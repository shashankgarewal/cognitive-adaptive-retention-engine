/**
 * SynapseDS - Firebase Client SDK Setup
 * Configured with Firebase Authentication and Cloud Firestore.
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App singleton
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Firebase Auth instance
export const auth = getAuth(app);

// Google SSO Provider configuration
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Cloud Firestore instance bound to the app's provisioned databaseId
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');

export default app;
