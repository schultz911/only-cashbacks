import crypto from 'node:crypto';
import express from 'express';
import { getLoginHtml } from './loginHtml.js';
import { createOAuthClientRegistry, validOAuthRedirect } from './oauthClients.js';

export const PUBLIC_ORIGIN = 'https://only-cashbacks.up.railway.app';
export const MCP_RESOURCE = `${PUBLIC_ORIGIN}/mcp`;
export const AUTH_CHALLENGE = `Bearer resource_metadata="${PUBLIC_ORIGIN}/.well-known/oauth-protected-resource/mcp"`;

interface Authorization {
  clientId: string;
  redirectUri: string;
  challenge: string;
  state?: string;
  expiresAt: number;
}
interface Identity { uid: string; auth_time: number }
interface Grant extends Authorization, Identity {}
interface Token extends Identity { clientId: string; expiresAt: number }

// These stores share the lifetime of MCP transport sessions. A restart requires reconnecting.
export function installOAuthRoutes(
  app: express.Express,
  firebaseConfig: Record<string, string>,
  verifyIdentity: (token: string) => Promise<Identity>,
  checkIdentity: (identity: Identity, fresh?: boolean) => Promise<void>,
) {
  const clients = createOAuthClientRegistry();
  const requests = new Map<string, Authorization>();
  const codes = new Map<string, Grant>();
  const accessTokens = new Map<string, Token>();
  const refreshTokens = new Map<string, Token & { access: string }>();
  const random = () => crypto.randomBytes(32).toString('base64url');
  const limit = 2048;
  const publicCalls = new Map<string, number>();
  let rateWindow = 0;
  const admitPublicCall = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const window = Math.floor(Date.now() / 60_000);
    if (window !== rateWindow) { publicCalls.clear(); rateWindow = window; }
    const caller = req.ip ?? 'unknown';
    const calls = publicCalls.get(caller) ?? 0;
    if (calls >= 120) {
      res.setHeader('Retry-After', '60');
      res.status(429).json({ error: 'temporarily_unavailable' });
      return;
    }
    if (calls === 0 && publicCalls.size >= limit) {
      const oldest = publicCalls.keys().next().value;
      if (oldest !== undefined) publicCalls.delete(oldest);
    }
    publicCalls.set(caller, calls + 1);
    next();
  };
  let nextPrune = 0;
  const prune = () => {
    if (Date.now() < nextPrune) return;
    nextPrune = Date.now() + 1000;
    for (const store of [requests, codes, accessTokens, refreshTokens]) {
      for (const [key, value] of store) if (value.expiresAt <= Date.now()) store.delete(key);
    }
  };
  const issueTokens = ({ uid, auth_time, clientId }: Identity & { clientId: string }, refreshExpiresAt = Date.now() + 24 * 60 * 60 * 1000) => {
    const access = `oc_access_${random()}`;
    const refresh = `oc_refresh_${random()}`;
    accessTokens.set(access, { uid, auth_time, clientId, expiresAt: Date.now() + 60 * 60 * 1000 });
    refreshTokens.set(refresh, { uid, auth_time, clientId, expiresAt: refreshExpiresAt, access });
    return { access_token: access, refresh_token: refresh, token_type: 'Bearer', expires_in: 3600, scope: 'wallet' };
  };

  app.get(['/.well-known/oauth-protected-resource', '/.well-known/oauth-protected-resource/mcp'], (_req, res) => {
    res.json({ resource: MCP_RESOURCE, authorization_servers: [PUBLIC_ORIGIN], scopes_supported: ['wallet'], bearer_methods_supported: ['header'] });
  });
  app.get('/.well-known/oauth-authorization-server', (_req, res) => {
    res.json({
      issuer: PUBLIC_ORIGIN,
      authorization_endpoint: `${PUBLIC_ORIGIN}/oauth/authorize`,
      token_endpoint: `${PUBLIC_ORIGIN}/oauth/token`,
      registration_endpoint: `${PUBLIC_ORIGIN}/oauth/register`,
      response_types_supported: ['code'], grant_types_supported: ['authorization_code', 'refresh_token'],
      code_challenge_methods_supported: ['S256'], token_endpoint_auth_methods_supported: ['none'], scopes_supported: ['wallet'],
    });
  });
  app.post(['/oauth/register', '/register'], admitPublicCall, express.json(), (req, res) => {
    const redirects = req.body?.redirect_uris;
    if (!Array.isArray(redirects) || !redirects.length || redirects.length > 8 || !redirects.every((uri: unknown) => validOAuthRedirect(uri) && uri.length <= 2048)) {
      res.status(400).json({ error: 'invalid_redirect_uri' });
      return;
    }
    const clientId = clients.register(redirects);
    res.status(201).json({ client_id: clientId, redirect_uris: redirects, token_endpoint_auth_method: 'none', grant_types: ['authorization_code', 'refresh_token'], response_types: ['code'] });
  });
  app.get(['/oauth/authorize', '/authorize'], admitPublicCall, (req, res) => {
    prune();
    const { client_id, redirect_uri, code_challenge, code_challenge_method, response_type, resource, state } = req.query;
    if (typeof client_id !== 'string' || typeof redirect_uri !== 'string' || !clients.allows(client_id, redirect_uri) ||
      response_type !== 'code' || code_challenge_method !== 'S256' || typeof code_challenge !== 'string' ||
      !/^[A-Za-z0-9_-]{43}$/.test(code_challenge) || (resource !== undefined && resource !== MCP_RESOURCE) ||
      (state !== undefined && typeof state !== 'string')) {
      res.status(400).json({ error: 'invalid_request' });
      return;
    }
    if (requests.size >= limit) { res.status(429).json({ error: "temporarily_unavailable" }); return; }
    const requestId = random();
    requests.set(requestId, { clientId: client_id, redirectUri: redirect_uri, challenge: code_challenge, state: typeof state === 'string' ? state : undefined, expiresAt: Date.now() + 10 * 60 * 1000 });
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Content-Security-Policy', "frame-ancestors 'none'");
    res.setHeader('X-Frame-Options', 'DENY');
    res.type('html').send(getLoginHtml('', firebaseConfig, requestId, new URL(redirect_uri).origin));
  });
  app.post('/oauth/approve', admitPublicCall, express.json(), async (req, res) => {
    prune();
    const requestId = req.body?.requestId;
    const request = requests.get(requestId);
    if (!request || request.expiresAt <= Date.now() || req.body?.consent !== true || typeof req.body?.idToken !== 'string') {
      res.status(400).json({ success: false, error: 'Invalid or expired authorization request' });
      return;
    }
    try {
      const identity = await verifyIdentity(req.body.idToken);
      // Recheck after verification so concurrent approvals cannot reuse a request.
      if (requests.get(requestId) !== request || request.expiresAt <= Date.now()) {
        res.status(400).json({ success: false, error: 'Authorization request already used or expired' });
        return;
      }
      if (codes.size >= limit) { res.status(429).json({ error: "temporarily_unavailable" }); return; }
      requests.delete(requestId);
      const code = random();
      codes.set(code, { ...request, uid: identity.uid, auth_time: identity.auth_time, expiresAt: Date.now() + 60 * 1000 });
      const redirect = new URL(request.redirectUri);
      redirect.searchParams.set('code', code);
      if (request.state !== undefined) redirect.searchParams.set('state', request.state);
      res.setHeader('Cache-Control', 'no-store');
      res.json({ success: true, redirectUrl: redirect.toString() });
    } catch {
      res.status(401).json({ success: false, error: 'Identity verification failed' });
    }
  });
  app.post(['/oauth/token', '/token'], admitPublicCall, express.urlencoded({ extended: false }), express.json(), async (req, res) => {
    prune();
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Pragma', 'no-cache');
    const { grant_type, client_id, resource } = req.body || {};
    if (resource !== undefined && resource !== MCP_RESOURCE) {
      res.status(400).json({ error: 'invalid_target' });
      return;
    }
    if (grant_type === 'authorization_code') {
      const { code, code_verifier, redirect_uri } = req.body;
      const grant = codes.get(code);
      if (!grant || grant.expiresAt <= Date.now() || grant.clientId !== client_id || grant.redirectUri !== redirect_uri || typeof code_verifier !== 'string' ||
        !/^[A-Za-z0-9._~-]{43,128}$/.test(code_verifier) ||
        crypto.createHash('sha256').update(code_verifier).digest('base64url') !== grant.challenge) {
        res.status(400).json({ error: 'invalid_grant' });
        return;
      }
      try { await checkIdentity(grant, true); } catch { res.status(400).json({ error: 'invalid_grant' }); return; }
      if (codes.get(code) !== grant || grant.expiresAt <= Date.now()) { res.status(400).json({ error: 'invalid_grant' }); return; }
      if (accessTokens.size >= limit || refreshTokens.size >= limit) { res.status(429).json({ error: 'temporarily_unavailable' }); return; }
      codes.delete(code);
      res.json(issueTokens(grant));
    } else if (grant_type === 'refresh_token') {
      const record = refreshTokens.get(req.body.refresh_token);
      if (!record || record.expiresAt <= Date.now() || record.clientId !== client_id) {
        res.status(400).json({ error: 'invalid_grant' });
        return;
      }
      try { await checkIdentity(record, true); } catch { res.status(400).json({ error: 'invalid_grant' }); return; }
      if (refreshTokens.get(req.body.refresh_token) !== record || record.expiresAt <= Date.now()) { res.status(400).json({ error: 'invalid_grant' }); return; }
      if (!accessTokens.has(record.access) && accessTokens.size >= limit) { res.status(429).json({ error: 'temporarily_unavailable' }); return; }
      refreshTokens.delete(req.body.refresh_token);
      accessTokens.delete(record.access);
      res.json(issueTokens(record, record.expiresAt));
    } else {
      res.status(400).json({ error: 'unsupported_grant_type' });
    }
  });

  return async (token: string): Promise<{ uid: string }> => {
    const record = accessTokens.get(token);
    if (!record || record.expiresAt <= Date.now()) throw new Error('Invalid or expired access token');
    await checkIdentity(record);
    if (accessTokens.get(token) !== record || record.expiresAt <= Date.now()) throw new Error('Expired access token');
    return { uid: record.uid };
  };
}
