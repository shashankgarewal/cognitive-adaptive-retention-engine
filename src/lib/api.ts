/**
 * CARE - API Client Service
 * Injects Firebase ID token as Bearer token into all requests to enforce zero cross-user leakage.
 */

import { auth } from './firebase';
import {
  UserProfile,
  JournalEntry,
  TopicRetentionState,
  RecallSession,
  RecallQueueResponse,
  RecallTopicsQueryResponse,
  RecallSessionInitPayload,
  RecallSessionInitResponse,
} from '../types';

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

  async createJournalEntry(payload: {
    title: string;
    rawContent: string;
    aiAssistanceLevel: string;
    aiToolUsed?: string;
  }) {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/journal/entries', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ detail: 'Failed to ingest journal entry' }));
      throw new Error(errorData.detail || 'Failed to ingest journal entry');
    }

    return res.json();
  },

  async getJournalEntries() {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/journal/entries', {
      method: 'GET',
      headers,
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ detail: 'Failed to fetch journal entries' }));
      throw new Error(errorData.detail || 'Failed to fetch journal entries');
    }

    return res.json();
  },

  async getTopics() {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/topics', {
      method: 'GET',
      headers,
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ detail: 'Failed to fetch topics' }));
      throw new Error(errorData.detail || 'Failed to fetch topics');
    }

    return res.json();
  },

  async getRecallQueue(limit = 20): Promise<RecallQueueResponse> {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/recall/queue?limit=${limit}`, {
      method: 'GET',
      headers,
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ detail: 'Failed to evaluate recall queue' }));
      throw new Error(errorData.detail || 'Failed to evaluate recall queue');
    }

    return res.json();
  },

  async getRecallTopics(params?: {
    search?: string;
    category?: string;
    sortBy?: string;
    page?: number;
    limit?: number;
  }): Promise<RecallTopicsQueryResponse> {
    const headers = await getAuthHeaders();
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.category) query.append('category', params.category);
    if (params?.sortBy) query.append('sort_by', params.sortBy);
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));

    const res = await fetch(`/api/recall/topics?${query.toString()}`, {
      method: 'GET',
      headers,
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ detail: 'Failed to search topics' }));
      throw new Error(errorData.detail || 'Failed to search topics');
    }

    return res.json();
  },

  async initRecallSession(payload: RecallSessionInitPayload): Promise<RecallSessionInitResponse> {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/recall/sessions/init', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ detail: 'Failed to initialize recall session' }));
      throw new Error(errorData.detail || 'Failed to initialize recall session');
    }

    return res.json();
  },
};
