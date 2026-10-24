import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getPerformance } from 'firebase/performance';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCHALzi5TDkpVQrUqobauyciLZurzjQsX4',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'gen-lang-client-0447512961.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'gen-lang-client-0447512961',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'gen-lang-client-0447512961.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_SENDER_ID || '343088435457',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:343088435457:web:14d0c083a241a00a86cb00',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || '',
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || 'ai-studio-onlycashbacks-9dfa3f2d-5762-4049-a6c8-583bd3c24948'
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const functions = getFunctions(app, 'asia-south1');

// Initialize Analytics (only if supported in the current environment)
export let analytics: any = null;
isSupported().then((supported) => {
  if (supported) {
    analytics = getAnalytics(app);
  }
}).catch(console.error);

// Initialize Performance Monitoring
export const perf = typeof window !== 'undefined' ? getPerformance(app) : null;

export const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaEnterpriseProvider(import.meta.env.VITE_RECAPTCHA_SITE_KEY || '6LdvmgotAAAAAL2cVPtKL1HIwAds1d7eB5MgxVPu'),
  isTokenAutoRefreshEnabled: true
});

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const isPermissionError = errorMessage.toLowerCase().includes('permission') || errorMessage.toLowerCase().includes('insufficient');

  const errInfo: FirestoreErrorInfo = {
    error: errorMessage,
    operationType,
    path
  };

  if (isPermissionError) {
    console.error('PRO-TIP: This looks like a Firestore Permission error. Make sure your rules are deployed to the correct database in Firebase Console!');
  }

  console.error('Firestore Error: ', JSON.stringify(errInfo));

  // We throw a more descriptive error object
  const finalError = new Error(errorMessage);
  (finalError as any).firestoreInfo = errInfo;
  throw finalError;
}