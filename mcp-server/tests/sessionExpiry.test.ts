// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Server } from 'node:http';
import { get } from 'node:http';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createRemoteApp } from '../src/index.js';
import { getUserData } from '../src/firebase.js';

vi.mock('../src/firebase.js', () => ({
  verifyIdToken: vi.fn(async () => ({ uid: 'expiry-test-user' })),
  getUserData: vi.fn(async () => ({ walletCards: ['sbi-cashback'] })),
}));

let http: Server;
let origin: string;
let app: ReturnType<typeof createRemoteApp>;
const headers = { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' };

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] });
  vi.stubEnv('OAUTH_CLIENT_SIGNING_KEY', 'expiry-tests-only-persistent-signing-key');
  vi.stubEnv('MCP_SESSION_IDLE_TIMEOUT_MINUTES', '1');
  vi.mocked(getUserData).mockResolvedValue({ walletCards: ['sbi-cashback'] });
});
afterEach(async () => {
  if (http) {
    app.locals.disposeMcpSessions();
    http.closeAllConnections();
    if (http.listening) await new Promise<void>(resolve => http.close(() => resolve()));
  }
  vi.restoreAllMocks(); vi.useRealTimers(); vi.unstubAllEnvs();
});
async function start() {
  app = createRemoteApp();
  http = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => http.once('listening', resolve));
  origin = `http://127.0.0.1:${(http.address() as any).port}`;
}
async function initialize() {
  const response = await fetch(origin + '/mcp', {
    method: 'POST', headers,
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: {
      protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'expiry-regression', version: '1' },
    } }),
  });
  await response.text();
  expect(response.status).toBe(200);
  return response.headers.get('mcp-session-id')!;
}
async function request(sessionId: string, method = 'tools/list', params?: object) {
  const response = await fetch(origin + '/mcp', {
    method: 'POST', headers: { ...headers, 'Mcp-Session-Id': sessionId, 'Mcp-Protocol-Version': '2025-03-26' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 2, method, params }),
  });
  return { status: response.status, body: await response.text() };
}

describe('MCP idle session cleanup', () => {
  it('defaults to 60 idle minutes and allows a fresh session after expiry', async () => {
    vi.stubEnv('MCP_SESSION_IDLE_TIMEOUT_MINUTES', '');
    const close = vi.spyOn(McpServer.prototype, 'close');
    await start(); const id = await initialize();
    await vi.advanceTimersByTimeAsync(59 * 60 * 1000);
    expect(close).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(60 * 1000);
    expect(close).toHaveBeenCalledTimes(1);
    expect((await request(id)).status).toBe(404);
    expect((await request(await initialize())).status).toBe(200);
  });

  it('resets the configurable idle period after activity', async () => {
    await start(); const id = await initialize();
    await vi.advanceTimersByTimeAsync(50000);
    expect((await request(id)).status).toBe(200);
    await vi.advanceTimersByTimeAsync(20000);
    expect((await request(id)).status).toBe(200);
    await vi.advanceTimersByTimeAsync(110000);
    expect((await request(id)).status).toBe(404);
  });

  it('protects open event streams and starts idle time when they close', async () => {
    await start(); const id = await initialize();
    const streamClosed = new Promise<void>(resolve => {
      http.once('connection', socket => socket.once('close', () => resolve()));
    });
    const response = await new Promise<import('node:http').IncomingMessage>(resolve => {
      get(origin + '/mcp', {
        headers: { Accept: 'text/event-stream', 'Mcp-Session-Id': id, 'Mcp-Protocol-Version': '2025-03-26' },
      }, resolve);
    });
    expect(response.statusCode).toBe(200);
    await vi.advanceTimersByTimeAsync(5 * 60 * 1000);
    expect((await request(id)).status).toBe(200);
    response.destroy();
    await streamClosed;
    await vi.advanceTimersByTimeAsync(2 * 60 * 1000);
    expect((await request(id)).status).toBe(404);
  });

  it('does not interrupt a pending tool request', async () => {
    await start(); const id = await initialize();
    let release!: (wallet: any) => void;
    let entered!: () => void;
    const started = new Promise<void>(resolve => { entered = resolve; });
    vi.mocked(getUserData).mockImplementationOnce(() => {
      entered();
      return new Promise(resolve => { release = resolve; });
    });
    const result = request(id, 'tools/call', { name: 'authenticate', arguments: { idToken: 'test-identity' } });
    await started;
    await vi.advanceTimersByTimeAsync(5 * 60 * 1000);
    release({ walletCards: ['sbi-cashback'] });
    expect((await result).body).toContain('Signed in');
    expect((await request(id)).status).toBe(200);
  });

  it('releases pairing codes and the shared timer on explicit DELETE', async () => {
    await start(); const id = await initialize();
    const login = await request(id, 'tools/call', { name: 'authenticate', arguments: {} });
    const code = login.body.match(/OC-[A-F0-9]{32}/)![0];
    expect(vi.getTimerCount()).toBe(1);
    const response = await fetch(origin + '/mcp', {
      method: 'DELETE', headers: { ...headers, 'Mcp-Session-Id': id, 'Mcp-Protocol-Version': '2025-03-26' },
    });
    await response.text();
    expect(response.status).toBe(200);
    expect(vi.getTimerCount()).toBe(0);
    expect((await fetch(origin + '/api/auth/status?code=' + code)).status).toBe(404);
  });

  it('uses one timer for multiple sessions and stops it when HTTP shuts down', async () => {
    await start();
    await initialize(); await initialize(); await initialize();
    expect(vi.getTimerCount()).toBe(1);
    http.closeAllConnections();
    await new Promise<void>(resolve => http.close(() => resolve()));
    expect(vi.getTimerCount()).toBe(0);
  });

  it('rejects invalid timeout configuration instead of silently disabling expiry', () => {
    for (const value of ['0', '-1', 'invalid', 'Infinity', '1e308']) {
      vi.stubEnv('MCP_SESSION_IDLE_TIMEOUT_MINUTES', value);
      expect(() => createRemoteApp()).toThrow('must be a positive number');
    }
  });
});
