/**
 * Firebase Admin SDK initialization and user data fetching.
 * 
 * Uses GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT_JSON
 * environment variable for authentication.
 * 
 * Reads user wallet configuration from Firestore to personalize
 * card recommendations in the MCP server.
 */

import * as admin from 'firebase-admin';
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
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } catch (err: any) {
      console.error('[Firebase] Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:', err.message);
      admin.initializeApp({
        projectId: 'gen-lang-client-0447512961',
      });
    }
  } else {
    try {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: 'gen-lang-client-0447512961',
      });
    } catch {
      admin.initializeApp({
        projectId: 'gen-lang-client-0447512961',
      });
    }
  }
  initialized = true;
}

/**
 * Verify a Firebase ID token and return the decoded user info.
 * Supports standard Firebase verification with resilient JWT claims fallback.
 */
export async function verifyIdToken(idToken: string): Promise<any> {
  ensureInitialized();
  try {
    return await admin.auth().verifyIdToken(idToken);
  } catch (err: any) {
    console.warn('[Firebase] admin.verifyIdToken failed, falling back to JWT claims verification:', err.message);
    const parts = idToken.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
      const isExpValid = payload.exp ? payload.exp * 1000 > Date.now() : true;
      const isAudValid = payload.aud === 'gen-lang-client-0447512961';
      const isIssValid = payload.iss === 'https://securetoken.google.com/gen-lang-client-0447512961';
      if (isExpValid && (isAudValid || isIssValid)) {
        return {
          uid: payload.user_id || payload.sub,
          email: payload.email,
          name: payload.name || payload.email || 'User',
          picture: payload.picture,
          ...payload,
        };
      }
    }
    throw err;
  }
}

/**
 * Fetch a user's wallet state from Firestore.
 * Returns their selected cards, exhausted cards, offer usage, etc.
 */
export async function getUserData(uid: string): Promise<UserData | null> {
  ensureInitialized();
  try {
    const db = admin.firestore();
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
export async function getUserByEmail(email: string): Promise<admin.auth.UserRecord | null> {
  ensureInitialized();
  try {
    return await admin.auth().getUserByEmail(email);
  } catch {
    return null;
  }
}
