/**
 * CARE - Authentication Context Provider
 * Manages Firebase Auth state, Google SSO, Email/Password flows,
 * and profile synchronization with the FastAPI backend.
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { auth, googleProvider, getActionCodeSettings, getAppOrigin } from '../lib/firebase';
import { api } from '../lib/api';
import { UserProfile, AuthErrorDetails } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  errorDetails: AuthErrorDetails | null;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name?: string) => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function parseAuthError(err: any): AuthErrorDetails {
  const code = err?.code || 'auth/unknown';
  const rawMessage = err?.message || 'An unexpected authentication error occurred.';
  const origin = typeof window !== 'undefined' ? window.location.origin : 'unknown';
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'unknown';
  const authDomain = auth.app.options.authDomain || 'unknown';

  let userFriendlyMessage = 'Authentication failed. Please verify your credentials and try again.';
  let resolutionHint: string | undefined = undefined;

  switch (code) {
    case 'auth/operation-not-allowed':
      userFriendlyMessage = 'This sign-in method is currently disabled in your Firebase project.';
      resolutionHint = 'Enable Email/Password or Google Provider in Firebase Console > Authentication > Sign-in method.';
      break;

    case 'auth/unauthorized-domain':
      userFriendlyMessage = `This web domain (${hostname}) is not authorized for Firebase OAuth operations.`;
      resolutionHint = `Add "${hostname}" to your Firebase Console under Authentication > Settings > Authorized domains.`;
      break;

    case 'auth/invalid-continue-uri':
      userFriendlyMessage = 'The redirect URI for authentication is invalid or not registered.';
      resolutionHint = `Origin "${origin}" does not match configured authorized redirect domains for authDomain "${authDomain}".`;
      break;

    case 'auth/email-already-in-use':
      userFriendlyMessage = 'An account with this email already exists. Please sign in instead.';
      resolutionHint = 'Switch to the "Sign in" tab or continue with Google SSO if you previously linked this account.';
      break;

    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-credential':
      userFriendlyMessage = 'Invalid email or password. Please verify your credentials.';
      resolutionHint = 'Check for typos in the email address or password. If you forgot your password, create a new account or use Google SSO.';
      break;

    case 'auth/weak-password':
      userFriendlyMessage = 'Password is too weak. Please use at least 6 characters.';
      resolutionHint = 'Choose a stronger password with a combination of letters, numbers, and symbols.';
      break;

    case 'auth/invalid-email':
      userFriendlyMessage = 'The email address format is invalid. Please enter a valid address.';
      resolutionHint = 'Ensure your email adheres to the standard format (e.g. name@domain.com).';
      break;

    case 'auth/popup-closed-by-user':
      userFriendlyMessage = 'Google sign-in popup was closed before completing authentication.';
      resolutionHint = 'Re-open Google SSO and complete account selection, or use email and password credentials below.';
      break;

    case 'auth/popup-blocked':
      userFriendlyMessage = 'Google sign-in popup was blocked by your browser.';
      resolutionHint = 'Allow popups for this site in your browser settings or use email and password sign-in.';
      break;

    case 'auth/cancelled-popup-request':
      userFriendlyMessage = 'The authentication popup request was cancelled.';
      resolutionHint = 'Another sign-in action was initiated before the previous one finished.';
      break;

    case 'auth/too-many-requests':
      userFriendlyMessage = 'Access to this account has been temporarily disabled due to many failed login attempts.';
      resolutionHint = 'Wait a few minutes before trying again or reset your password.';
      break;

    case 'auth/network-request-failed':
      userFriendlyMessage = 'Network connection failure while contacting Firebase Authentication services.';
      resolutionHint = 'Check your internet connection or verify that network firewalls do not block Firebase endpoints.';
      break;

    default:
      if (rawMessage.includes('popup-closed-by-user')) {
        userFriendlyMessage = 'Google sign-in popup was closed before completing authentication.';
        resolutionHint = 'Complete the Google authentication prompt or sign in using email & password.';
      } else if (rawMessage.includes('unauthorized-domain')) {
        userFriendlyMessage = `This domain (${hostname}) is not authorized in Firebase OAuth.`;
        resolutionHint = `Add "${hostname}" in Firebase Console > Authentication > Settings > Authorized domains.`;
      } else {
        userFriendlyMessage = rawMessage;
      }
      break;
  }

  return {
    code,
    rawMessage,
    userFriendlyMessage,
    origin,
    authDomain,
    resolutionHint,
    timestamp: new Date().toISOString(),
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const cached = localStorage.getItem('care_user_session');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.uid) {
          return {
            uid: parsed.uid,
            email: parsed.email || '',
            displayName: parsed.displayName || '',
            emailVerified: true,
            isAnonymous: false,
            metadata: {},
            providerData: [],
            refreshToken: '',
            tenantId: null,
            delete: async () => {},
            getIdToken: async () => '',
            getIdTokenResult: async () => ({} as any),
            reload: async () => {},
            toJSON: () => ({}),
          } as unknown as User;
        }
      }
    } catch {
      // ignore
    }
    return null;
  });
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(() => !localStorage.getItem('care_user_session'));
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<AuthErrorDetails | null>(null);

  const syncProfileWithBackend = useCallback(async (firebaseUser: User) => {
    try {
      const response = await api.syncUserProfile();
      setProfile(response.user);
    } catch (err: any) {
      console.warn('[AUTH] Backend profile sync note:', err.message);
      // Fallback local profile representation if backend call is delayed
      setProfile({
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || 'Data Scientist',
        photoURL: firebaseUser.photoURL,
        authProvider: firebaseUser.providerData[0]?.providerId || 'password',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        stats: {
          totalJournalsLogged: 0,
          totalRecallSessionsCompleted: 0,
          averageRecallScore: 0.0,
          activeTopicsCount: 0,
        },
        preferences: {
          dailyRecallTarget: 3,
          preferredInterviewTone: 'rigorous_peer',
        },
      });
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.groupCollapsed('[AUTH] Auth State Changed');
      console.log('Current User:', currentUser ? { uid: currentUser.uid, email: currentUser.email } : 'None (Signed Out)');
      console.log('Origin:', typeof window !== 'undefined' ? window.location.origin : 'unknown');
      console.log('Auth Domain:', auth.app.options.authDomain);
      console.groupEnd();

      setUser(currentUser);
      if (currentUser) {
        try {
          localStorage.setItem(
            'care_user_session',
            JSON.stringify({
              uid: currentUser.uid,
              email: currentUser.email || '',
              displayName: currentUser.displayName || '',
            })
          );
        } catch {
          // ignore storage access errors
        }
        await syncProfileWithBackend(currentUser);
      } else {
        // Complete session sanitation on sign-out
        try {
          localStorage.removeItem('care_user_session');
        } catch {
          // ignore storage access errors
        }
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [syncProfileWithBackend]);

  const signInWithGoogle = async () => {
    setError(null);
    setErrorDetails(null);
    setLoading(true);

    const origin = typeof window !== 'undefined' ? window.location.origin : 'unknown';
    const authDomain = auth.app.options.authDomain || 'unknown';

    console.group('[AUTH] Starting Google SSO');
    console.log('Action: signInWithGoogle');
    console.log('Current Window Origin:', origin);
    console.log('Firebase Auth Domain Setting:', authDomain);
    console.log('Timestamp:', new Date().toISOString());

    try {
      const result = await signInWithPopup(auth, googleProvider);
      console.log('[AUTH] Google SSO Success:', {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        provider: result.user.providerData[0]?.providerId,
      });
      console.groupEnd();

      if (result.user) {
        await syncProfileWithBackend(result.user);
      }
    } catch (err: any) {
      const parsedDetails = parseAuthError(err);
      console.error('[AUTH] Google SSO Error:', {
        code: err?.code,
        message: err?.message,
        customData: err?.customData,
        origin,
        authDomain,
        parsedDetails,
        error: err,
      });
      console.groupEnd();

      setError(parsedDetails.userFriendlyMessage);
      setErrorDetails(parsedDetails);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    setError(null);
    setErrorDetails(null);
    setLoading(true);

    const origin = typeof window !== 'undefined' ? window.location.origin : 'unknown';
    const authDomain = auth.app.options.authDomain || 'unknown';

    console.group('[AUTH] Starting Email Sign-in');
    console.log('Action: signInWithEmail');
    console.log('Email:', email);
    console.log('Current Window Origin:', origin);
    console.log('Firebase Auth Domain Setting:', authDomain);
    console.log('Timestamp:', new Date().toISOString());

    try {
      const result = await signInWithEmailAndPassword(auth, email, pass);
      console.log('[AUTH] Email Sign-in Success:', {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
      });
      console.groupEnd();

      if (result.user) {
        await syncProfileWithBackend(result.user);
      }
    } catch (err: any) {
      const parsedDetails = parseAuthError(err);
      console.error('[AUTH] Email Sign-in Error:', {
        code: err?.code,
        message: err?.message,
        customData: err?.customData,
        email,
        origin,
        authDomain,
        parsedDetails,
        error: err,
      });
      console.groupEnd();

      setError(parsedDetails.userFriendlyMessage);
      setErrorDetails(parsedDetails);
      throw new Error(parsedDetails.userFriendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name?: string) => {
    setError(null);
    setErrorDetails(null);
    setLoading(true);

    const origin = typeof window !== 'undefined' ? window.location.origin : 'unknown';
    const authDomain = auth.app.options.authDomain || 'unknown';

    console.group('[AUTH] Starting Email Sign-up');
    console.log('Action: signUpWithEmail');
    console.log('Email:', email);
    console.log('Display Name:', name || '(None provided)');
    console.log('Current Window Origin:', origin);
    console.log('Firebase Auth Domain Setting:', authDomain);
    console.log('Timestamp:', new Date().toISOString());

    try {
      const result = await createUserWithEmailAndPassword(auth, email, pass);
      console.log('[AUTH] User Creation Success:', {
        uid: result.user.uid,
        email: result.user.email,
      });

      if (name && result.user) {
        await updateProfile(result.user, { displayName: name });
        console.log('[AUTH] Profile DisplayName Updated:', name);
      }
      console.groupEnd();

      if (result.user) {
        await syncProfileWithBackend(result.user);
      }
    } catch (err: any) {
      const parsedDetails = parseAuthError(err);
      console.error('[AUTH] Email Sign-up Error:', {
        code: err?.code,
        message: err?.message,
        customData: err?.customData,
        email,
        origin,
        authDomain,
        parsedDetails,
        error: err,
      });
      console.groupEnd();

      setError(parsedDetails.userFriendlyMessage);
      setErrorDetails(parsedDetails);
      throw new Error(parsedDetails.userFriendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  const sendPasswordReset = async (email: string) => {
    setError(null);
    setErrorDetails(null);
    setLoading(true);

    const actionCodeSettings = getActionCodeSettings();
    const origin = getAppOrigin();
    const authDomain = auth.app.options.authDomain || 'unknown';

    console.group('[AUTH] Triggering Password Reset Email');
    console.log('Target Email:', email);
    console.log('ActionCodeSettings URL:', actionCodeSettings.url);
    console.log('handleCodeInApp:', actionCodeSettings.handleCodeInApp);
    console.log('Current Origin:', origin);
    console.log('Auth Domain:', authDomain);

    try {
      await sendPasswordResetEmail(auth, email.trim(), actionCodeSettings);
      console.log('[AUTH] Password reset email sent successfully to:', email);
      console.groupEnd();
    } catch (err: any) {
      const parsedDetails = parseAuthError(err);
      console.error('[AUTH] Failed to send password reset email:', {
        code: err?.code,
        message: err?.message,
        targetEmail: email,
        actionCodeSettings,
        origin,
        authDomain,
        parsedDetails,
        error: err,
      });
      console.groupEnd();

      setError(parsedDetails.userFriendlyMessage);
      setErrorDetails(parsedDetails);
      throw new Error(parsedDetails.userFriendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  const sendVerificationEmail = async () => {
    if (!auth.currentUser) {
      const msg = 'No authenticated user found to send verification email.';
      setError(msg);
      throw new Error(msg);
    }

    setError(null);
    setErrorDetails(null);
    setLoading(true);

    const actionCodeSettings = getActionCodeSettings();
    const origin = getAppOrigin();
    const authDomain = auth.app.options.authDomain || 'unknown';

    console.group('[AUTH] Triggering Email Verification');
    console.log('User UID:', auth.currentUser.uid);
    console.log('User Email:', auth.currentUser.email);
    console.log('ActionCodeSettings URL:', actionCodeSettings.url);
    console.log('handleCodeInApp:', actionCodeSettings.handleCodeInApp);
    console.log('Current Origin:', origin);
    console.log('Auth Domain:', authDomain);

    try {
      await sendEmailVerification(auth.currentUser, actionCodeSettings);
      console.log('[AUTH] Verification email dispatched successfully');
      console.groupEnd();
    } catch (err: any) {
      const parsedDetails = parseAuthError(err);
      console.error('[AUTH] Failed to send verification email:', {
        code: err?.code,
        message: err?.message,
        actionCodeSettings,
        origin,
        authDomain,
        parsedDetails,
        error: err,
      });
      console.groupEnd();

      setError(parsedDetails.userFriendlyMessage);
      setErrorDetails(parsedDetails);
      throw new Error(parsedDetails.userFriendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setError(null);
    setErrorDetails(null);
    console.group('[AUTH] Signing Out User');
    console.log('UID:', user?.uid);
    console.log('Email:', user?.email);
    console.log('Timestamp:', new Date().toISOString());

    try {
      await firebaseSignOut(auth);
      console.log('[AUTH] Sign-out completed successfully');
      console.groupEnd();
      // Clean slate sanitation
      try {
        localStorage.removeItem('care_user_session');
        localStorage.removeItem('care_last_internal_route');
        sessionStorage.removeItem('care_last_active_route');
        sessionStorage.removeItem('care_user_explicitly_chose_landing');
      } catch {
        // ignore
      }
      setUser(null);
      setProfile(null);
    } catch (err: any) {
      const parsedDetails = parseAuthError(err);
      console.error('[AUTH] Sign-out Error:', {
        code: err?.code,
        message: err?.message,
        parsedDetails,
        error: err,
      });
      console.groupEnd();
      setError(parsedDetails.userFriendlyMessage);
      setErrorDetails(parsedDetails);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await syncProfileWithBackend(user);
    }
  };

  const clearError = () => {
    setError(null);
    setErrorDetails(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        error,
        errorDetails,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        sendPasswordReset,
        sendVerificationEmail,
        signOut,
        refreshProfile,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
