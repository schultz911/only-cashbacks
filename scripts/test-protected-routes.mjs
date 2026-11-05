import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { chromium } from 'playwright-core';
import express from 'express';

const buildDir = fs.mkdtempSync(path.join(os.tmpdir(), 'onlycashbacks-pwa-test-'));
let browser;
let server;
try {
  const build = spawnSync(process.execPath, ['node_modules/vite/bin/vite.js', 'build', '--outDir', buildDir], { stdio: 'inherit' });
  if (build.status !== 0) throw new Error('Frontend build failed');
  const app = express();
  // Return valid worker scripts so a mistaken runtime-cache match is observable.
  app.get(['/authorize', '/oauth/authorize', '/token', '/register', '/login', '/api/auth/status', '/mcp', '/sse', '/health', '/messages', '/.well-known/oauth-authorization-server', '/__/auth/handler'], (_req, res) => res.type('js').send('self.close()'));
  app.use(express.static(buildDir));
  app.get('*', (_req, res) => res.sendFile(path.join(buildDir, 'index.html')));
  server = http.createServer(app);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}) });
  const context = await browser.newContext();
  await context.route('**/*', route => route.request().url().startsWith(origin) ? route.continue() : route.abort());
  const page = await context.newPage();
  await page.goto(origin);
  await page.waitForFunction(async () => !!(await navigator.serviceWorker.getRegistration())?.active);
  await page.reload();
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  const routes = ['/oauth/authorize', '/authorize', '/token', '/register', '/login', '/api/auth/status', '/mcp', '/sse', '/health', '/messages', '/.well-known/oauth-authorization-server', '/__/auth/handler'];
  for (const route of routes) {
    await page.evaluate(url => new Promise(resolve => {
      const worker = new Worker(url);
      worker.onerror = () => resolve();
      setTimeout(() => { worker.terminate(); resolve(); }, 200);
    }), `${route}?code=synthetic`);
  }
  const cachedPaths = await page.evaluate(async () => {
    const paths = [];
    for (const name of await caches.keys()) {
      for (const request of await (await caches.open(name)).keys()) paths.push(new URL(request.url).pathname);
    }
    return paths;
  });
  assert.deepEqual(cachedPaths.filter(p => routes.includes(p)), [], 'Protected worker requests must not enter caches');
  await context.setOffline(true);
  await page.reload();
  assert.match(await page.title(), /OnlyCashbacks/, 'Wallet shell must remain available offline');
  for (const route of routes) {
    const tab = await context.newPage();
    let response;
    try { response = await tab.goto(`${origin}${route}?code=synthetic`, { timeout: 5000 }); }
    catch (error) {
      if (!String(error).includes('net::ERR_INTERNET_DISCONNECTED') && !String(error).includes('net::ERR_FAILED')) throw error;
    }
    if (response) assert.notEqual(await tab.title(), 'OnlyCashbacks', `${route} must not receive the offline wallet shell`);
    await tab.close();
  }
  await context.close();
  console.log(`Protected-route regression passed: ${routes.length} query-string routes excluded from offline fallback and runtime caches.`);
} finally {
  if (browser) await browser.close();
  if (server) await new Promise(resolve => server.close(resolve));
  fs.rmSync(buildDir, { recursive: true, force: true });
}
