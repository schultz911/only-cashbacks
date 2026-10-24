import crypto from 'node:crypto';

export function validOAuthRedirect(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try {
    const url = new URL(value);
    return !url.hash && !url.username && !url.password &&
      (url.protocol === 'https:' || (url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)));
  } catch { return false; }
}

// Registration IDs contain signed callback hashes, never user identity or wallet data.
// Keeping this key in deployment configuration makes registrations survive restarts.
export function createOAuthClientRegistry(
  signingKey = process.env.OAUTH_CLIENT_SIGNING_KEY,
  legacyClientsJson = process.env.OAUTH_REGISTERED_CLIENTS_JSON,
) {
  if (signingKey !== undefined && Buffer.byteLength(signingKey) < 32) {
    throw new Error('OAUTH_CLIENT_SIGNING_KEY must contain at least 32 bytes');
  }
  const clients = new Map<string, string[]>();
  if (legacyClientsJson) {
    const configured: unknown = JSON.parse(legacyClientsJson);
    if (!configured || typeof configured !== 'object' || Array.isArray(configured)) {
      throw new Error('OAUTH_REGISTERED_CLIENTS_JSON must map client IDs to registered callback arrays');
    }
    for (const [id, redirects] of Object.entries(configured)) {
      if (!id || !Array.isArray(redirects) || !redirects.length || !redirects.every(validOAuthRedirect)) {
        throw new Error('Invalid configured OAuth client registration');
      }
      clients.set(id, [...redirects]);
    }
  }
  const hash = (value: string) => crypto.createHash('sha256').update(value).digest('base64url');
  const sign = (payload: string) => crypto.createHmac('sha256', signingKey!).update(`oc_client_v1.${payload}`).digest();
  return {
    register(redirects: string[]) {
      if (!signingKey) {
        const id = crypto.randomBytes(32).toString('base64url');
        clients.set(id, [...redirects]);
        return id;
      }
      const payload = Buffer.from(JSON.stringify({ nonce: crypto.randomBytes(32).toString('base64url'), redirects: redirects.map(hash) })).toString('base64url');
      return `oc_client_v1.${payload}.${sign(payload).toString('base64url')}`;
    },
    allows(id: string, redirect: string) {
      if (clients.get(id)?.includes(redirect)) return true;
      if (!signingKey) return false;
      const [prefix, payload, signature, extra] = id.split('.');
      if (prefix !== 'oc_client_v1' || !payload || !signature || extra !== undefined || !/^[A-Za-z0-9_-]+$/.test(payload) || !/^[A-Za-z0-9_-]{43}$/.test(signature)) return false;
      const expected = sign(payload);
      const supplied = Buffer.from(signature, 'base64url');
      if (supplied.length !== expected.length || !crypto.timingSafeEqual(supplied, expected)) return false;
      try {
        const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
        return Array.isArray(decoded.redirects) && decoded.redirects.includes(hash(redirect));
      } catch { return false; }
    },
  };
}
