/**
 * Firebase Admin SDK initialization and user data fetching.
 * 
 * Uses GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT_JSON
 * environment variable for authentication.
 * 
 * Reads user wallet configuration from Firestore to personalize
 * card recommendations in the MCP server.
 */

import { initializeApp, cert, applicationDefault } from 'firebase-admin/app';
import { getAuth, type UserRecord } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import type { UserData } from './types.js';

const FIREBASE_DATABASE_ID = process.env.FIREBASE_DATABASE_ID || 'ai-studio-onlycashbacks-9dfa3f2d-5762-4049-a6c8-583bd3c24948';

let initialized = false;

function parseServiceAccount(raw: string): any {
  const trimmed = raw.trim();
  let parsed: any;
  if (trimmed.startsWith('{')) {
    parsed = JSON.parse(trimmed);
  } else {
    try {
      const decoded = Buffer.from(trimmed, 'base64').toString('utf8');
      parsed = JSON.parse(decoded);
    } catch {
      parsed = JSON.parse(trimmed);
    }
  }

  if (parsed.private_key && typeof parsed.private_key === 'string' && parsed.private_key.includes('\\n')) {
    parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
  }

  return parsed;
}

function ensureInitialized() {
  if (initialized) return;
  
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      const serviceAccount = parseServiceAccount(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      initializeApp({
        credential: cert(serviceAccount),
      });
    } catch (err: any) {
      console.error('[Firebase] Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:', err.message);
      initializeApp({
        projectId: 'gen-lang-client-0447512961',
      });
    }
  } else {
    try {
      initializeApp({
        credential: applicationDefault(),
        projectId: 'gen-lang-client-0447512961',
      });
    } catch {
      initializeApp({
        projectId: 'gen-lang-client-0447512961',
      });
    }
  }
  initialized = true;
}

/**
 * Verify a Firebase ID token and return the decoded user info.
 * Rejects invalid signatures, expired tokens and tokens for other projects.
 */
export async function verifyIdToken(idToken: string): Promise<any> {
  ensureInitialized();
  return getAuth().verifyIdToken(idToken, true);
}

/**
 * Fetch a user's wallet state from Firestore.
 * Returns their selected cards, exhausted cards, offer usage, etc.
 */
export async function getUserData(uid: string): Promise<UserData | null> {
  ensureInitialized();
  try {
    const db = getFirestore(FIREBASE_DATABASE_ID);
    const docRef = db.collection('users').doc(uid);
    const snap = await docRef.get();
    
    if (!snap.exists) return null;
    return snap.data() as UserData;
  } catch (err: any) {
    console.warn('[Firestore] Failed to read user data:', err.message);
    return null;
  }
}

const walletIdentityChecks = new Map<string, { expiresAt: number; result: Promise<UserRecord>; pending: boolean }>();

export async function checkWalletIdentity(identity: { uid: string; auth_time: number }, fresh = false) {
  ensureInitialized();
  const now = Date.now();
  let check = walletIdentityChecks.get(identity.uid);
  if (!check || (!check.pending && (check.expiresAt <= now || fresh))) {
    if (walletIdentityChecks.size >= 2048) {
      const oldest = walletIdentityChecks.keys().next().value;
      if (oldest !== undefined) walletIdentityChecks.delete(oldest);
    }
    const newCheck = { expiresAt: now + 15_000, pending: true, result: getAuth().getUser(identity.uid) };
    void newCheck.result.then(
      () => { newCheck.pending = false; },
      () => { newCheck.pending = false; },
    );
    check = newCheck;
    walletIdentityChecks.set(identity.uid, check);
  }
  let user: UserRecord;
  try {
    user = await check.result;
  } catch (error) {
    if (walletIdentityChecks.get(identity.uid) === check) walletIdentityChecks.delete(identity.uid);
    throw error;
  }
  const validAfter = user.tokensValidAfterTime ? Date.parse(user.tokensValidAfterTime) : 0;
  if (!Number.isFinite(identity.auth_time) || !Number.isFinite(validAfter) ||
      user.disabled || identity.auth_time * 1000 < validAfter) {
    throw new Error('Wallet authorization revoked');
  }
}
