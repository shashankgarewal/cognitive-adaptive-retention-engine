import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { JournalEntry, TopicRetentionState, ExtractedConcept } from '../types';
import { ZeroStateDashboard } from '../components/dashboard/ZeroStateDashboard';
import { CognitiveRetentionStream } from '../components/journal/CognitiveRetentionStream';
import { Loader2 } from 'lucide-react';

export const WorkJournalFeedPage: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [topics, setTopics] = useState<TopicRetentionState[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [forceZeroState, setForceZeroState] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) {
      setEntries([]);
      setTopics([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const [entriesRes, topicsRes] = await Promise.all([
        api.getJournalEntries().catch(() => ({ entries: [], total: 0 })),
        api.getTopics().catch(() => ({ topics: [], total: 0 })),
      ]);

      setEntries(entriesRes.entries || []);
      setTopics(topicsRes.topics || []);
    } catch (err) {
      console.warn('Error fetching feed data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleJournalSuccess = async (entry: JournalEntry, concepts: ExtractedConcept[]) => {
    await refreshProfile();
    await fetchData();
  };

  const handleNavSelect = (navId: string) => {
    if (navId === 'feed') navigate('/feed');
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
