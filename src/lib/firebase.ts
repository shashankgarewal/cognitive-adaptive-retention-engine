/**
 * CARE - Firebase Client SDK Setup
 * Configured with Firebase Authentication and Cloud Firestore.
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, ActionCodeSettings } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
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
const gcpProjectId = import.meta.env.VITE_GCP_PROJECT_ID || firebaseConfig.projectId;
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

// Firebase Auth instance
export const auth = getAuth(app);

// Google SSO Provider configuration
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Cloud Firestore instance bound to the app's provisioned databaseId or default
export const db =
  !firebaseConfig.firestoreDatabaseId || firebaseConfig.firestoreDatabaseId === '(default)'
    ? getFirestore(app)
    : getFirestore(app, firebaseConfig.firestoreDatabaseId);

export default app;
