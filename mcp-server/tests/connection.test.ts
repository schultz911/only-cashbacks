// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import crypto from 'node:crypto';
import type { Server } from 'node:http';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { createRemoteApp } from '../src/index.js';
import { MCP_RESOURCE, PUBLIC_ORIGIN } from '../src/oauth.js';
import { getCycleForCard, getRecommendations } from '../src/lib/recommendation.js';

const identity = vi.hoisted(() => ({ wallet: { walletCards: ['sbi-cashback'] } as any, otherWallet: null as any }));
vi.mock('../src/firebase.js', () => ({
  verifyIdToken: vi.fn(async (token: string) => {
    if (token === 'test-other-identity') return { uid: 'other-user', name: 'Other User' };
    if (token !== 'test-identity') throw new Error('Invalid signature');
    return { uid: 'test-user', name: 'Test User' };
  }),
  getUserData: vi.fn(async (uid: string) => uid === 'test-user' ? identity.wallet : uid === 'other-user' ? identity.otherWallet : null),
}));

let http: Server;
let origin: string;
const clients: Client[] = [];
beforeEach(async () => {
  vi.stubEnv('OAUTH_CLIENT_SIGNING_KEY', 'integration-tests-only-persistent-signing-key');
  identity.wallet = { walletCards: ['sbi-cashback'] };
  identity.otherWallet = null;
  http = createRemoteApp().listen(0, '127.0.0.1');
  await new Promise<void>(resolve => http.once('listening', resolve));
  origin = `http://127.0.0.1:${(http.address() as any).port}`;
});
afterEach(async () => {
  await Promise.all(clients.splice(0).map(client => client.close()));
  http.closeAllConnections();
  await new Promise<void>((resolve, reject) => http.close(err => err ? reject(err) : resolve()));
  vi.unstubAllEnvs();
});
const post = (path: string, body: object) => fetch(origin + path, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
});
async function connect(token?: string) {
  const transport = new StreamableHTTPClientTransport(new URL(origin + '/mcp'), {
    requestInit: token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
  });
  const client = new Client({ name: 'regression', version: '1.0.0' });
  clients.push(client);
  await client.connect(transport);
  return { client, transport };
}
function text(result: any) { return result.content.map((c: any) => c.text || '').join('\n'); }
async function authorization(idToken = 'test-identity') {
  const registration = await (await post('/oauth/register', { redirect_uris: ['https://chatgpt.com/connector/oauth/callback'] })).json();
  const verifier = 'v'.repeat(43);
  const params = new URLSearchParams({
    client_id: registration.client_id, redirect_uri: registration.redirect_uris[0], response_type: 'code',
    code_challenge: crypto.createHash('sha256').update(verifier).digest('base64url'), code_challenge_method: 'S256',
    state: 'state-to-preserve', resource: MCP_RESOURCE,
  });
  const page = await (await fetch(origin + '/oauth/authorize?' + params)).text();
  const requestId = JSON.parse(page.match(/const oauthRequestId = ("[^"]+");/)![1]);
  const approved = await (await post('/oauth/approve', { requestId, idToken })).json();
  const redirect = new URL(approved.redirectUrl);
  expect(redirect.searchParams.get('state')).toBe('state-to-preserve');
  return { client_id: registration.client_id, redirect_uri: registration.redirect_uris[0], code: redirect.searchParams.get('code'), code_verifier: verifier, resource: MCP_RESOURCE, grant_type: 'authorization_code' };
}

describe('OnlyCashbacks plugin connection', () => {
  it('advertises accurate read-only and non-destructive tool annotations', async () => {
    const { client } = await connect();
    const { tools } = await client.listTools();
    expect(tools).toHaveLength(4);
    for (const tool of tools) {
      expect(tool.annotations).toMatchObject({ readOnlyHint: tool.name !== 'authenticate', destructiveHint: false, openWorldHint: tool.name === 'authenticate' });
    }
  });
  it('advertises Railway discovery and a usable authentication challenge', async () => {
    const metadata = await (await fetch(origin + '/.well-known/oauth-protected-resource/mcp')).json();
    expect(metadata.resource).toBe(MCP_RESOURCE);
    expect(metadata.authorization_servers).toEqual([PUBLIC_ORIGIN]);
    const response = await fetch(origin + '/mcp', { method: 'POST', headers: { Authorization: 'Bearer invalid' } });
    expect(response.status).toBe(401);
    expect(response.headers.get('www-authenticate')).toContain(`${PUBLIC_ORIGIN}/.well-known/oauth-protected-resource/mcp`);
    const cors = await fetch(origin + '/mcp', { method: 'OPTIONS' });
    expect(cors.headers.get('access-control-allow-headers')).toContain('Mcp-Session-Id');
  });

  it('completes OAuth, rotates refresh tokens and rejects code/token replay', async () => {
    const grant = await authorization();
    expect((await post('/oauth/token', { ...grant, code_verifier: 'x'.repeat(43) })).status).toBe(400);
    expect((await post('/oauth/token', { ...grant, client_id: 'other-client' })).status).toBe(400);
    expect((await post('/oauth/token', { ...grant, redirect_uri: 'https://other.example/callback' })).status).toBe(400);
    expect((await post('/oauth/token', { ...grant, resource: 'https://other.example/mcp' })).status).toBe(400);
    const token = await (await post('/oauth/token', grant)).json();
    expect(token.access_token).toMatch(/^oc_access_/);
    expect(token).not.toHaveProperty('id_token');
    expect((await post('/oauth/token', grant)).status).toBe(400);
    const body = { grant_type: 'refresh_token', client_id: grant.client_id, refresh_token: token.refresh_token };
    const refreshed = await (await post('/oauth/token', body)).json();
    expect(refreshed.refresh_token).not.toBe(token.refresh_token);
    expect((await post('/oauth/token', body)).status).toBe(400);
    const { client } = await connect(refreshed.access_token);
    const wallet = await client.callTool({ name: 'list_cards', arguments: {} });
    expect(wallet.structuredContent).toMatchObject({ authenticated: true, uid: 'test-user', wallet: identity.wallet });
  });

  it('updates an existing anonymous MCP session after OAuth without leaking it to another session', async () => {
    const { client, transport } = await connect();
    const other = await connect();
    const token = await (await post('/oauth/token', await authorization())).json();
    const response = await fetch(origin + '/mcp', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream',
        Authorization: `Bearer ${token.access_token}`, 'Mcp-Session-Id': transport.sessionId!, 'Mcp-Protocol-Version': '2025-03-26' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 45, method: 'tools/call', params: { name: 'list_cards', arguments: {} } }),
    });
    expect(response.status).toBe(200);
    expect(await response.text()).toContain('Your Saved Wallet');
    expect(text(await other.client.callTool({ name: 'list_cards', arguments: {} }))).toContain('Account not connected');
    // A transport session ID alone cannot access an OAuth-authenticated wallet.
    await expect(client.callTool({ name: 'list_cards', arguments: {} })).rejects.toThrow();
  });

  it('pairs only the requesting session, consumes the code, and reloads changed wallet data', async () => {
    const { client } = await connect();
    const other = await connect();
    const login = text(await client.callTool({ name: 'authenticate', arguments: {} }));
    const code = login.match(/OC-[A-F0-9]{32}/)![0];
    expect((await post('/api/auth/complete', { code, idToken: 'test-identity' })).status).toBe(200);
    const status = await (await fetch(origin + '/api/auth/status?code=' + code)).json();
    expect(status).toEqual({ status: 'completed' });
    expect((await other.client.callTool({ name: 'authenticate', arguments: { code } })).isError).toBe(true);
    expect(text(await client.callTool({ name: 'authenticate', arguments: { code } }))).toContain('Successfully authenticated');
    expect((await client.callTool({ name: 'authenticate', arguments: { code } })).isError).toBe(true);
    const rec = await client.callTool({ name: 'find_best_card', arguments: { merchant: 'Amazon', amount: 1000 } });
    expect(rec.structuredContent).toMatchObject({ recommendation: { bestCard: { id: 'sbi-cashback' } } });
    identity.wallet = { walletCards: [] };
    expect(text(await client.callTool({ name: 'find_best_card', arguments: { merchant: 'Amazon', amount: 1000 } }))).toContain('saved setting selects all');
    identity.wallet = null;
    expect((await client.callTool({ name: 'list_cards', arguments: {} })).isError).toBe(true);
    expect((await client.callTool({ name: 'find_best_card', arguments: { merchant: 'Amazon', amount: 1000 } })).isError).toBe(true);
  });

  it('matches the app all-cards sentinel, preserves saved settings, and does not expose BYOK credentials', async () => {
    const { client } = await connect();
    identity.wallet = {
      walletCards: [], kiwiNeonEarnRate: 4, cardBillDates: { 'kiwi-neon': 15 },
      exhaustedCards: {}, offerUsage: { 'axis-myzone-Food-Swiggy-2026-10': 2 },
      openRouterApiKey: 'test-secret-must-not-be-returned',
    };
    const authenticated = await client.callTool({ name: 'authenticate', arguments: { idToken: 'test-identity' } });
    expect(authenticated.isError).not.toBe(true);
    expect(authenticated.structuredContent).toMatchObject({ authenticated: true, uid: 'test-user', cardSelection: { mode: 'all_supported_cards' }, wallet: { kiwiNeonEarnRate: 4, walletCards: [] } });
    const wallet = await client.callTool({ name: 'list_cards', arguments: {} });
    expect(wallet.isError).not.toBe(true);
    expect(text(wallet)).toContain('saved setting selects all');
    expect(JSON.stringify(wallet)).not.toContain('test-secret-must-not-be-returned');
    const result = await client.callTool({ name: 'find_best_card', arguments: { merchant: 'General Store', amount: 1000, isOnline: false, isScanAndPay: true } });
    const expected = getRecommendations({ name: 'General Store', category: 'Other', isOnline: false, isP2P: false },
      1000, false, false, true, identity.wallet.exhaustedCards, identity.wallet.offerUsage, 4, null, identity.wallet.cardBillDates);
    expect(result.structuredContent).toMatchObject({ cardSelection: { mode: 'all_supported_cards' }, recommendation: { bestCard: { id: expected!.bestCard.id }, netValue: expected!.netValue } });
    expect(JSON.stringify(result)).not.toContain('test-secret-must-not-be-returned');
    identity.wallet = { kiwiNeonEarnRate: 4 };
    expect((await client.callTool({ name: 'find_best_card', arguments: { merchant: 'Amazon', amount: 1000 } })).isError).toBe(true);
  });

  it('rejects unknown sessions, unsolicited pairing, and unregistered callbacks', async () => {
    expect((await fetch(origin + '/mcp', { headers: { 'Mcp-Session-Id': 'unknown' } })).status).toBe(404);
    expect((await post('/api/auth/complete', { code: 'OC-arbitrary', idToken: 'test-identity' })).status).toBe(400);
    expect((await fetch(origin + '/login?code=%3Cscript%3E')).status).toBe(400);
    expect((await fetch(origin + '/oauth/authorize?redirect_uri=https://other.example')).status).toBe(400);
    expect((await post('/oauth/register', { redirect_uris: ['javascript:alert(1)'] })).status).toBe(400);
  });

  it('matches the app billing-cycle handling for saved exhausted-card markers', async () => {
    const { client } = await connect();
    const billDates = { 'sbi-cashback': 4 };
    identity.wallet = { walletCards: ['sbi-cashback'], exhaustedCards: { 'sbi-cashback': '2000-1' }, cardBillDates: billDates };
    await client.callTool({ name: 'authenticate', arguments: { idToken: 'test-identity' } });
    const merchant = { name: 'Amazon', category: 'Other', isOnline: true, isP2P: false };
    const previousCycle = await client.callTool({ name: 'find_best_card', arguments: { merchant: 'Amazon', amount: 1000 } });
    expect(previousCycle.structuredContent).toMatchObject({ recommendation: { netValue: getRecommendations(merchant, 1000, true, false, false, {}, {}, 2, ['sbi-cashback'], billDates)!.netValue } });
    identity.wallet.exhaustedCards['sbi-cashback'] = getCycleForCard('sbi-cashback', billDates);
    const currentCycle = await client.callTool({ name: 'find_best_card', arguments: { merchant: 'Amazon', amount: 1000 } });
    const exhaustedValue = getRecommendations(merchant, 1000, true, false, false, { 'sbi-cashback': true }, {}, 2, ['sbi-cashback'], billDates)!.netValue;
    expect(currentCycle.structuredContent).toMatchObject({ recommendation: { netValue: exhaustedValue } });
    identity.wallet.exhaustedCards['sbi-cashback'] = true;
    expect((await client.callTool({ name: 'find_best_card', arguments: { merchant: 'Amazon', amount: 1000 } })).structuredContent).toMatchObject({ recommendation: { netValue: exhaustedValue } });
  });

  it('isolates two signed-in users, only displays their owned cards, and rejects using another account session', async () => {
    identity.wallet = { walletCards: ['sbi-cashback'], kiwiNeonEarnRate: 2, cardBillDates: { 'sbi-cashback': 4 }, offerUsage: { 'account-a-only': 1 } };
    identity.otherWallet = { walletCards: ['icici-amazon-pay'], kiwiNeonEarnRate: 4, cardBillDates: { 'icici-amazon-pay': 19 }, offerUsage: { 'account-b-only': 2 } };
    const grantA = await authorization();
    const grantB = await authorization('test-other-identity');
    const tokenA = await (await post('/oauth/token', grantA)).json();
    const tokenB = await (await post('/oauth/token', grantB)).json();
    const a = await connect(tokenA.access_token);
    const b = await connect(tokenB.access_token);
    const walletA = await a.client.callTool({ name: 'list_cards', arguments: {} });
    const walletB = await b.client.callTool({ name: 'list_cards', arguments: {} });
    expect(walletA.structuredContent).toMatchObject({ uid: 'test-user', cardSelection: { cardIds: ['sbi-cashback'] }, wallet: identity.wallet });
    expect(walletB.structuredContent).toMatchObject({ uid: 'other-user', cardSelection: { cardIds: ['icici-amazon-pay'] }, wallet: identity.otherWallet });
    expect(text(walletA)).not.toContain('ICICI');
    expect(text(walletB)).not.toContain('SBI');
    expect(JSON.stringify(walletA)).not.toContain('account-b-only');
    expect(JSON.stringify(walletB)).not.toContain('account-a-only');
    const recA = await a.client.callTool({ name: 'find_best_card', arguments: { merchant: 'Amazon', amount: 1000 } });
    const recB = await b.client.callTool({ name: 'find_best_card', arguments: { merchant: 'Amazon', amount: 1000 } });
    expect(recA.structuredContent).toMatchObject({ recommendation: { bestCard: { id: 'sbi-cashback' } } });
    expect(recB.structuredContent).toMatchObject({ recommendation: { bestCard: { id: 'icici-amazon-pay' } } });
    // A fixed engine route must not bypass this user's card selection.
    const fixedRoute = await b.client.callTool({ name: 'find_best_card', arguments: { merchant: 'Google Play', amount: 1000 } });
    expect(fixedRoute.isError).toBe(true);
    expect(JSON.stringify(fixedRoute)).not.toContain('sbi-cashback');
    const stolenSession = await fetch(origin + '/mcp', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream',
        Authorization: `Bearer ${tokenB.access_token}`, 'Mcp-Session-Id': a.transport.sessionId!, 'Mcp-Protocol-Version': '2025-03-26' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 85, method: 'tools/call', params: { name: 'list_cards', arguments: {} } }),
    });
    expect(stolenSession.status).toBe(401);
    expect(await stolenSession.text()).not.toContain('sbi-cashback');
    // Refreshing a token must preserve the original user binding.
    const invalidRefresh = await post('/oauth/token', { grant_type: 'refresh_token', client_id: grantB.client_id, refresh_token: tokenA.refresh_token });
    expect(invalidRefresh.status).toBe(400);
    const refreshedA = await (await post('/oauth/token', { grant_type: 'refresh_token', client_id: grantA.client_id, refresh_token: tokenA.refresh_token })).json();
    const reconnectedA = await connect(refreshedA.access_token);
    expect((await reconnectedA.client.callTool({ name: 'list_cards', arguments: {} })).structuredContent).toMatchObject({ uid: 'test-user', wallet: identity.wallet });
  });
});
