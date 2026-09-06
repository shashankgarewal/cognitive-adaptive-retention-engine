import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { JournalEntry, TopicRetentionState, ExtractedConcept } from '../types';
import { ZeroStateDashboard } from '../components/dashboard/ZeroStateDashboard';
import { CognitiveRetentionStream } from '../components/journal/CognitiveRetentionStream';
import { Loader2 } from 'lucide-react';

export const WorkJournalFeedPage: React.FC = () => {
  const { user, loading: authLoading, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [topics, setTopics] = useState<TopicRetentionState[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [forceZeroState, setForceZeroState] = useState(false);

  useEffect(() => {
    // 3. Auth Ready Guard: Entry fetching only fires after authLoading is completely false and currentUser is resolved
    if (authLoading) {
      return;
    }

    if (!user) {
      setEntries([]);
      setTopics([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // 2. Timeout Safety Net:
    // Add a fallback setTimeout (3 seconds) inside the loading effect so if Firestore/Auth sync takes too long,
    // the UI automatically unsets the loading spinner and falls back to rendering the empty zero-state UI.
    const safetyTimeout = setTimeout(() => {
      console.warn('[WorkJournalFeedPage] 3s timeout safety net triggered. Unsetting loading state.');
      setIsLoading(false);
    }, 3000);

    // Fetch topics asynchronously
    api.getTopics().then((topicsRes) => {
      setTopics(topicsRes.topics || []);
    }).catch((err) => {
      console.warn('[WorkJournalFeedPage] Topics fetch warning:', err);
    });

    // 1. Firestore Unsubscribe & Fallback Handling:
    // Subscribe to Firestore onSnapshot for journal entries
    const unsubscribe = api.subscribeJournalEntries(
      (fetchedEntries, empty) => {
        clearTimeout(safetyTimeout);
        setEntries(fetchedEntries);
        // Ensure setIsLoading(false) is called immediately when snapshot.empty is true or data received
        setIsLoading(false);
      },
      (error) => {
        console.error('[WorkJournalFeedPage] Firestore onSnapshot error:', error);
        clearTimeout(safetyTimeout);
        // Error callback explicitly sets loading to false
        setIsLoading(false);
      }
    );

    return () => {
      clearTimeout(safetyTimeout);
      unsubscribe();
    };
  }, [user, authLoading]);

  const handleJournalSuccess = async (entry: JournalEntry, concepts: ExtractedConcept[]) => {
    await refreshProfile();
    try {
      const topicsRes = await api.getTopics();
      setTopics(topicsRes.topics || []);
    } catch (e) {
      // ignore
    }
  };

  const handleNavSelect = (navId: string) => {
    if (navId === 'feed') navigate('/feed');
    else if (navId === 'editor' || navId === 'writer') navigate('/journal/editor');
    else if (navId === 'hub') navigate('/hub');
    else if (navId === 'analytics') navigate('/analytics');
    else if (navId === 'spec') navigate('/spec');
    else if (navId === 'landing') navigate('/');
  };

  if (isLoading && entries.length === 0) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center font-mono text-xs text-[#006948]">
        <div className="flex items-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-[#006948]" />
          <span>Synchronizing telemetry stream...</span>
        </div>
      </div>
    );
  }

  // Render the Authenticated Zero-State dashboard when there are 0 journal entries or forced
  if (entries.length === 0 || forceZeroState) {
    return (
      <ZeroStateDashboard
        onLogJournalSuccess={handleJournalSuccess}
        onViewLanding={() => navigate('/')}
        entriesCount={entries.length}
        onToggleToPopulated={entries.length > 0 ? () => setForceZeroState(false) : undefined}
        onOpenSpec={() => navigate('/spec')}
        onSelectNav={handleNavSelect}
      />
    );
  }

  // Populated feed view
  return (
    <CognitiveRetentionStream
      entries={entries}
      topics={topics}
      onOpenSpec={() => navigate('/spec')}
      onSelectNav={handleNavSelect}
      onViewLanding={() => navigate('/')}
      onLogSuccess={handleJournalSuccess}
      onToggleToZeroState={() => setForceZeroState(true)}
    />
  );
};
