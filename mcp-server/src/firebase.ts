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

function ensureInitialized() {
  if (initialized) return;
  
  // Try to initialize from service account JSON env var first,
  // then fall back to GOOGLE_APPLICATION_CREDENTIALS file path
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } else {
    // Uses GOOGLE_APPLICATION_CREDENTIALS env var automatically
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  }
  initialized = true;
}

/**
 * Verify a Firebase ID token and return the decoded user info.
 * The token comes from the user's Google sign-in on the OnlyCashbacks app.
 */
export async function verifyIdToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
  ensureInitialized();
  return admin.auth().verifyIdToken(idToken);
}

/**
 * Fetch a user's wallet state from Firestore.
 * Returns their selected cards, exhausted cards, offer usage, etc.
 */
export async function getUserData(uid: string): Promise<UserData | null> {
  ensureInitialized();
  const db = admin.firestore();
  // Use the specific database ID that matches the frontend config
  const docRef = db.collection('users').doc(uid);
  const snap = await docRef.get();
  
  if (!snap.exists) return null;
  return snap.data() as UserData;
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
