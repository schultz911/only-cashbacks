// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { Server } from 'node:http';
import { createRemoteApp } from '../src/index.js';
import { getLoginHtml } from '../src/loginHtml.js';

let server: Server | undefined;
let fixture: string | undefined;
afterEach(async () => {
  if (server) {
    server.closeAllConnections();
    await new Promise<void>(resolve => server!.close(() => resolve()));
    server = undefined;
  }
  vi.restoreAllMocks();
  if (fixture) fs.rmSync(fixture, { recursive: true, force: true });
  fixture = undefined;
});

describe('offline worker routing', () => {
  it('serves the built worker and retires the legacy URL without deleting current caches', async () => {
    fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'onlycashbacks-pwa-test-'));
    fs.mkdirSync(path.join(fixture, 'web'));
    fs.writeFileSync(path.join(fixture, 'web', 'index.html'), '<!doctype html><title>fixture</title>');
    fs.writeFileSync(path.join(fixture, 'web', 'sw.js'), '/* generated wallet worker */');
    vi.spyOn(process, 'cwd').mockReturnValue(fixture);
    server = createRemoteApp().listen(0, '127.0.0.1');
    await new Promise<void>(resolve => server!.once('listening', resolve));
    const base = `http://127.0.0.1:${(server.address() as any).port}`;
    const current = await fetch(base + '/sw.js');
    expect(current.status).toBe(200);
    expect(current.headers.get('cache-control')).toContain('no-cache');
    expect(await current.text()).toContain('generated wallet worker');
    const legacy = await fetch(base + '/service-worker.js');
    const cleanup = await legacy.text();
    expect(cleanup).toContain('self.registration.unregister()');
    expect(cleanup).not.toContain('caches.delete');
    expect(legacy.headers.get('cache-control')).toBe('no-store');
  });

  it('does not unregister the wallet worker or clear caches from the sign-in page', () => {
    const html = getLoginHtml('', { recaptchaSiteKey: 'public-test-key' }, 'request');
    expect(html).not.toContain('getRegistrations()');
    expect(html).not.toContain('caches.delete');
    expect(html).toContain('appCheck.activate(');
    expect(html).toContain("fetch('/oauth/approve'");
  });
});
