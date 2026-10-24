// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { createOAuthClientRegistry } from '../src/oauthClients.js';

const key = 'test-key-only-for-tests-32-bytes-minimum';
const callback = 'https://chatgpt.com/connector/oauth/test-callback';
describe('OAuth registrations across server restarts', () => {
  it('accepts registered callbacks after a restart with the same deployment key', () => {
    const id = createOAuthClientRegistry(key).register([callback, 'http://localhost:1234/callback']);
    const restarted = createOAuthClientRegistry(key);
    expect(restarted.allows(id, callback)).toBe(true);
    expect(restarted.allows(id, 'http://localhost:1234/callback')).toBe(true);
    expect(restarted.allows(id, callback + '/different')).toBe(false);
    expect(restarted.allows(id, 'https://attacker.example/callback')).toBe(false);
    expect(createOAuthClientRegistry(key + '-other').allows(id, callback)).toBe(false);
  });
  it('rejects tampered signatures, payloads, unknown IDs and malformed IDs', () => {
    const registry = createOAuthClientRegistry(key);
    const id = registry.register([callback]);
    const [prefix, payload, signature] = id.split('.');
    for (const invalid of ['unknown', `${prefix}.${payload}.${signature.slice(1)}`, `${prefix}.${payload}A.${signature}`, `${id}.extra`, `${prefix}.bad.${signature}`]) {
      expect(registry.allows(invalid, callback)).toBe(false);
    }
  });
  it('restores explicitly configured pre-upgrade registrations without accepting other callbacks', () => {
    const registry = createOAuthClientRegistry(key, JSON.stringify({ 'previous-client': [callback] }));
    expect(registry.allows('previous-client', callback)).toBe(true);
    expect(registry.allows('previous-client', 'https://attacker.example/callback')).toBe(false);
    expect(registry.allows('unregistered-client', callback)).toBe(false);
  });
  it('keeps the existing ephemeral behavior when a deployment key is not configured', () => {
    const registry = createOAuthClientRegistry(undefined);
    const id = registry.register([callback]);
    expect(registry.allows(id, callback)).toBe(true);
    expect(createOAuthClientRegistry(undefined).allows(id, callback)).toBe(false);
  });
  it('fails closed on insecure keys or invalid migrated registrations', () => {
    expect(() => createOAuthClientRegistry('short')).toThrow();
    expect(() => createOAuthClientRegistry(key, JSON.stringify({ previous: ['javascript:alert(1)'] }))).toThrow();
    expect(() => createOAuthClientRegistry(key, '[]')).toThrow();
  });
});
