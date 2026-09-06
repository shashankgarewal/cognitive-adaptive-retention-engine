/**
 * CARE - Firebase Client SDK Setup
 * Configured with Firebase Authentication and Cloud Firestore.
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, ActionCodeSettings, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { initializeFirestore, memoryLocalCache, getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Standard fallback app URL when window.location.origin is unavailable
export const FALLBACK_APP_URL = 'https://ais-dev-dy4kmcdqvfvykhx4s4hmxo-63677282004.asia-southeast1.run.app';

/**
 * Resolves current app origin dynamically with robust fallback
 */
export function getAppOrigin(): string {
  if (typeof window !== 'undefined' && window.location?.origin && window.location.origin !== 'null') {
    return window.location.origin;
  }
  return FALLBACK_APP_URL;
}

/**
 * Generates valid ActionCodeSettings with absolute continue URL
 * to avoid auth/invalid-continue-uri errors in Firebase Auth operations.
 */
export function getActionCodeSettings(path = ''): ActionCodeSettings {
  const origin = getAppOrigin();
  const cleanPath = path ? (path.startsWith('/') ? path : `/${path}`) : '';
  const resolvedUrl = `${origin}${cleanPath}`;

  return {
    url: resolvedUrl,
    handleCodeInApp: true,
  };
}

// Use authoritative configuration from provisioned firebase-applet-config.json
const gcpProjectId = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GCP_PROJECT_ID) || firebaseConfig.projectId;
const effectiveFirebaseConfig = {
  ...firebaseConfig,
  projectId: gcpProjectId,
  authDomain: firebaseConfig.authDomain || `${gcpProjectId}.firebaseapp.com`,
};

// Diagnostic logging for Firebase initialization
if (typeof window !== 'undefined') {
  console.groupCollapsed('[FIREBASE] Client SDK Initialization');
  console.log('Project ID:', effectiveFirebaseConfig.projectId);
  console.log('Auth Domain:', effectiveFirebaseConfig.authDomain);
  console.log('Firestore Database:', firebaseConfig.firestoreDatabaseId || '(default)');
  console.log('Current Window Origin:', window.location.origin);
  console.log('Current Hostname:', window.location.hostname);
  console.groupEnd();
}

// Initialize Firebase App singleton
const app = !getApps().length ? initializeApp(effectiveFirebaseConfig) : getApp();

// Firebase Auth instance with explicit browser local storage persistence
export const auth = getAuth(app);
if (typeof window !== 'undefined') {
  setPersistence(auth, browserLocalPersistence).catch((err) => {
    console.warn('[FIREBASE] Explicit browserLocalPersistence notice:', err);
  });
}

// Google SSO Provider configuration
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Cloud Firestore instance bound to the app's provisioned databaseId or default.
// Disabled offline persistence during debugging (via memoryLocalCache)
// so failed network writes error out immediately instead of silently storing locally.
const databaseId = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? firebaseConfig.firestoreDatabaseId
  : undefined;

let firestoreInstance;
try {
  firestoreInstance = initializeFirestore(app, {
    ...(databaseId ? { databaseId } : {}),
    localCache: memoryLocalCache(),
    experimentalAutoDetectLongPolling: true,
  });
} catch (e) {
  firestoreInstance = getFirestore(app);
}

export const db = firestoreInstance;

export default app;
