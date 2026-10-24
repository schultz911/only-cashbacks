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
  return getAuth().verifyIdToken(idToken);
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

/**
 * Look up a user's UID by their email address.
 * Useful for the authenticate flow where the user provides their email.
 */
export async function getUserByEmail(email: string): Promise<UserRecord | null> {
  ensureInitialized();
  try {
    return await getAuth().getUserByEmail(email);
  } catch {
    return null;
  }
}
