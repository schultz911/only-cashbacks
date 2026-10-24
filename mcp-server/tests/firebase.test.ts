// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

const sdk = vi.hoisted(() => ({
  verify: vi.fn(),
  read: vi.fn(),
  database: vi.fn(),
  collection: vi.fn(),
  doc: vi.fn(),
}));
vi.mock('firebase-admin/app', () => ({ initializeApp: vi.fn(), applicationDefault: vi.fn(), cert: vi.fn() }));
vi.mock('firebase-admin/auth', () => ({ getAuth: () => ({ verifyIdToken: sdk.verify }) }));
vi.mock('firebase-admin/firestore', () => ({ getFirestore: sdk.database }));

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  sdk.database.mockReturnValue({ collection: sdk.collection });
  sdk.collection.mockReturnValue({ doc: sdk.doc });
  sdk.doc.mockReturnValue({ get: sdk.read });
});

describe('MCP Firebase identity and saved wallet', () => {
  it('rejects fabricated JWT claims when Firebase verification rejects the signature', async () => {
    const { verifyIdToken } = await import('../src/firebase.js');
    const payload = Buffer.from(JSON.stringify({ sub: 'victim', aud: 'gen-lang-client-0447512961',
      iss: 'https://securetoken.google.com/gen-lang-client-0447512961', exp: Date.now() / 1000 + 3600 })).toString('base64url');
    sdk.verify.mockRejectedValue(new Error('Invalid signature'));
    await expect(verifyIdToken(`e30.${payload}.forged`)).rejects.toThrow('Invalid signature');
  });

  it('reads the configured named database and the verified user document', async () => {
    vi.stubEnv('FIREBASE_DATABASE_ID', 'wallet-test-database');
    try {
      const { getUserData } = await import('../src/firebase.js');
      sdk.read.mockResolvedValue({ exists: true, data: () => ({ walletCards: ['sbi-cashback'] }) });
      expect(await getUserData('verified-user')).toEqual({ walletCards: ['sbi-cashback'] });
      expect(sdk.database).toHaveBeenCalledWith('wallet-test-database');
      expect(sdk.collection).toHaveBeenCalledWith('users');
      expect(sdk.doc).toHaveBeenCalledWith('verified-user');
    } finally { vi.unstubAllEnvs(); }
  });
});
