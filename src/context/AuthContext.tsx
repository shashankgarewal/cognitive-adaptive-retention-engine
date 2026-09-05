/**
 * SynapseDS - Authentication Context Provider
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
  updateProfile,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { api } from '../lib/api';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name?: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const syncProfileWithBackend = useCallback(async (firebaseUser: User) => {
    try {
      const response = await api.syncUserProfile();
      setProfile(response.user);
    } catch (err: any) {
      console.warn('Backend profile sync note:', err.message);
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
      setUser(currentUser);
      if (currentUser) {
        await syncProfileWithBackend(currentUser);
      } else {
        // Complete session sanitation on sign-out
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [syncProfileWithBackend]);

  const signInWithGoogle = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        await syncProfileWithBackend(result.user);
      }
    } catch (err: any) {
      console.error('Google SSO Error:', err);
      let message = err.message || 'Failed to sign in with Google';
      if (err.code === 'auth/popup-blocked') {
        message = 'Popup was blocked by your browser. Please allow popups for this site.';
      } else if (err.code === 'auth/cancelled-popup-request') {
        message = 'Sign in was cancelled.';
      }
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    setError(null);
    setLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email, pass);
      if (result.user) {
        await syncProfileWithBackend(result.user);
      }
    } catch (err: any) {
      console.error('Email Sign-in Error:', err);
      let message = 'Failed to sign in. Please check your email and password.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        message = 'Invalid email or password.';
      } else if (err.code === 'auth/too-many-requests') {
        message = 'Too many attempts. Please try again later.';
      }
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name?: string) => {
    setError(null);
    setLoading(true);
    try {
      const result = await createUserWithEmailAndPassword(auth, email, pass);
      if (name && result.user) {
        await updateProfile(result.user, { displayName: name });
      }
      if (result.user) {
        await syncProfileWithBackend(result.user);
      }
    } catch (err: any) {
      console.error('Email Sign-up Error:', err);
      let message = 'Failed to create account.';
      if (err.code === 'auth/email-already-in-use') {
        message = 'An account with this email already exists.';
      } else if (err.code === 'auth/weak-password') {
        message = 'Password must be at least 6 characters.';
      }
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setError(null);
    try {
      await firebaseSignOut(auth);
      // Clean slate sanitation
      setUser(null);
      setProfile(null);
    } catch (err: any) {
      console.error('Sign-out error:', err);
      setError(err.message || 'Failed to sign out');
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await syncProfileWithBackend(user);
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        error,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
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
