import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { JournalEntry, TopicRetentionState } from '../types';
import { calculateUserStreaks, getCachedRecallDates } from '../lib/streakService';

export function useStreaks(
  passedEntries?: JournalEntry[],
  passedTopics?: TopicRetentionState[]
) {
  const { user } = useAuth();
  const [internalEntries, setInternalEntries] = useState<JournalEntry[]>([]);
  const [internalTopics, setInternalTopics] = useState<TopicRetentionState[]>([]);

  // If not passed from parent, fetch/subscribe to live Firestore entries & topics
  useEffect(() => {
    if (passedEntries !== undefined || !user) return;

    const unsubscribe = api.subscribeJournalEntries(
      (entries) => {
        setInternalEntries(entries);
      },
      (err) => console.warn('[useStreaks] subscribe error:', err)
    );

    api.getTopics()
      .then((res) => setInternalTopics(res.topics || []))
      .catch((err) => console.warn('[useStreaks] getTopics error:', err));

    return () => unsubscribe();
  }, [user, passedEntries]);

  const effectiveEntries = passedEntries !== undefined ? passedEntries : internalEntries;
  const effectiveTopics = passedTopics !== undefined ? passedTopics : internalTopics;

  const streaks = useMemo(() => {
    return calculateUserStreaks(effectiveEntries, effectiveTopics, user?.uid);
  }, [effectiveEntries, effectiveTopics, user?.uid]);

  return streaks;
}
