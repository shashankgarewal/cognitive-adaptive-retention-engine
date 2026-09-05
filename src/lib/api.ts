/**
 * CARE - API Client Service
 * Injects Firebase ID token as Bearer token into all requests to enforce zero cross-user leakage.
 */

import { auth } from './firebase';
import { UserProfile, JournalEntry, TopicRetentionState, RecallSession } from '../types';

async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const currentUser = auth.currentUser;
  if (currentUser) {
    try {
      const token = await currentUser.getIdToken();
      headers['Authorization'] = `Bearer ${token}`;
    } catch (err) {
      console.warn('Failed to retrieve Firebase ID token:', err);
    }
  }

  return headers;
}

export const api = {
  async getHealth(): Promise<{ status: string; service: string }> {
    const res = await fetch('/api/health');
    if (!res.ok) throw new Error('Health check failed');
    return res.json();
  },

  async syncUserProfile(): Promise<{ status: string; user: UserProfile; isNewUser: boolean }> {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/auth/me', {
      method: 'GET',
      headers,
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ detail: 'Failed to sync user profile' }));
      throw new Error(errorData.detail || 'Failed to authenticate user profile');
    }

    return res.json();
  },

  async updatePreferences(preferences: Partial<UserProfile['preferences']>): Promise<UserProfile> {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/auth/sync', {
      method: 'POST',
      headers,
      body: JSON.stringify({ preferences }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ detail: 'Failed to update preferences' }));
      throw new Error(errorData.detail || 'Failed to update preferences');
    }

    const data = await res.json();
    return data.user;
  },
};
