import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getFunctions, type Functions } from 'firebase/functions';
import { validateFirebaseEnv } from '@/lib/env';

const envCheck = validateFirebaseEnv();
export const isFirebaseConfigured = envCheck.ok;
export const firebaseEnvMissing = envCheck.ok ? [] : envCheck.missing;

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let functions: Functions | null = null;

if (envCheck.ok) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  const region = import.meta.env.VITE_FUNCTIONS_REGION || undefined;
  functions = region ? getFunctions(app, region) : getFunctions(app);
}

export { app, auth, db, functions };

export const APP_ID = import.meta.env.VITE_APP_ID || 'joint-savings-app';
/** Browser-side Gemini key (`VITE_GEMINI_API_KEY`). Default path for the AI coach; keep out of git. */
export const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

/** Default household for data scoping (A-001). Override per deployment. */
export const HOUSEHOLD_ID = import.meta.env.VITE_HOUSEHOLD_ID || 'default';
