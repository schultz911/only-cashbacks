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
interface Grant extends Authorization { uid: string }
interface Token { uid: string; clientId: string; expiresAt: number }

// These stores share the lifetime of MCP transport sessions. A restart requires reconnecting.
export function installOAuthRoutes(
  app: express.Express,
  firebaseConfig: Record<string, string>,
  verifyIdentity: (token: string) => Promise<{ uid: string }>,
) {
  const clients = createOAuthClientRegistry();
  const requests = new Map<string, Authorization>();
  const codes = new Map<string, Grant>();
  const accessTokens = new Map<string, Token>();
  const refreshTokens = new Map<string, Token>();
  const random = () => crypto.randomBytes(32).toString('base64url');
  const prune = () => {
    for (const store of [requests, codes, accessTokens, refreshTokens]) {
      for (const [key, value] of store) if (value.expiresAt <= Date.now()) store.delete(key);
    }
  };
  const issueTokens = (uid: string, clientId: string, refreshExpiresAt = Date.now() + 24 * 60 * 60 * 1000) => {
    const access = `oc_access_${random()}`;
    const refresh = `oc_refresh_${random()}`;
    accessTokens.set(access, { uid, clientId, expiresAt: Date.now() + 60 * 60 * 1000 });
    refreshTokens.set(refresh, { uid, clientId, expiresAt: refreshExpiresAt });
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
  app.post(['/oauth/register', '/register'], express.json(), (req, res) => {
    const redirects = req.body?.redirect_uris;
    if (!Array.isArray(redirects) || !redirects.length || !redirects.every(validOAuthRedirect)) {
      res.status(400).json({ error: 'invalid_redirect_uri' });
      return;
    }
    const clientId = clients.register(redirects);
    res.status(201).json({ client_id: clientId, redirect_uris: redirects, token_endpoint_auth_method: 'none', grant_types: ['authorization_code', 'refresh_token'], response_types: ['code'] });
  });
  app.get(['/oauth/authorize', '/authorize'], (req, res) => {
    prune();
    const { client_id, redirect_uri, code_challenge, code_challenge_method, response_type, resource, state } = req.query;
    if (typeof client_id !== 'string' || typeof redirect_uri !== 'string' || !clients.allows(client_id, redirect_uri) ||
      response_type !== 'code' || code_challenge_method !== 'S256' || typeof code_challenge !== 'string' ||
      !/^[A-Za-z0-9_-]{43}$/.test(code_challenge) || (resource !== undefined && resource !== MCP_RESOURCE) ||
      (state !== undefined && typeof state !== 'string')) {
      res.status(400).json({ error: 'invalid_request' });
      return;
    }
    const requestId = random();
    requests.set(requestId, { clientId: client_id, redirectUri: redirect_uri, challenge: code_challenge, state: typeof state === 'string' ? state : undefined, expiresAt: Date.now() + 10 * 60 * 1000 });
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.type('html').send(getLoginHtml('', firebaseConfig, requestId));
  });
  app.post('/oauth/approve', express.json(), async (req, res) => {
    prune();
    const requestId = req.body?.requestId;
    const request = requests.get(requestId);
    if (!request || typeof req.body?.idToken !== 'string') {
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
      requests.delete(requestId);
      const code = random();
      codes.set(code, { ...request, uid: identity.uid, expiresAt: Date.now() + 60 * 1000 });
      const redirect = new URL(request.redirectUri);
      redirect.searchParams.set('code', code);
      if (request.state !== undefined) redirect.searchParams.set('state', request.state);
      res.setHeader('Cache-Control', 'no-store');
      res.json({ success: true, redirectUrl: redirect.toString() });
    } catch {
      res.status(401).json({ success: false, error: 'Identity verification failed' });
    }
  });
  app.post(['/oauth/token', '/token'], express.urlencoded({ extended: false }), express.json(), (req, res) => {
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
      if (!grant || grant.clientId !== client_id || grant.redirectUri !== redirect_uri || typeof code_verifier !== 'string' ||
        !/^[A-Za-z0-9._~-]{43,128}$/.test(code_verifier) ||
        crypto.createHash('sha256').update(code_verifier).digest('base64url') !== grant.challenge) {
        res.status(400).json({ error: 'invalid_grant' });
        return;
      }
      codes.delete(code);
      res.json(issueTokens(grant.uid, grant.clientId));
    } else if (grant_type === 'refresh_token') {
      const record = refreshTokens.get(req.body.refresh_token);
      if (!record || record.clientId !== client_id) {
        res.status(400).json({ error: 'invalid_grant' });
        return;
      }
      refreshTokens.delete(req.body.refresh_token);
      res.json(issueTokens(record.uid, record.clientId, record.expiresAt));
    } else {
      res.status(400).json({ error: 'unsupported_grant_type' });
    }
  });

  return async (token: string): Promise<{ uid: string }> => {
    prune();
    const record = accessTokens.get(token);
    if (!record) throw new Error('Invalid or expired access token');
    return { uid: record.uid };
  };
}
