/**
 * CARE - Streak Service
 * Calculates genuine consecutive daily streaks for work journals and active recall sessions.
 * 
 * Rules:
 * - A streak is active if the user has logged/recalled today, OR if the user logged/recalled yesterday (grace period for today).
 * - A streak counts consecutive calendar days without a gap.
 * - Dates are normalized to local calendar date YYYY-MM-DD.
 */

import { JournalEntry, TopicRetentionState } from '../types';

/**
 * Format a Date or ISO timestamp string into a local 'YYYY-MM-DD' key.
 */
export function toLocalDateKey(dateInput: string | Date | number): string {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Given a list of timestamps, calculate the consecutive daily streak.
 */
export function calculateStreak(
  dates: (string | Date | number | undefined | null)[]
): number {
  const validDates = dates
    .filter((d): d is string | Date | number => d !== undefined && d !== null)
    .map(toLocalDateKey)
    .filter((key) => key.length === 10);

  if (validDates.length === 0) return 0;

  // Set of unique date keys
  const dateSet = new Set(validDates);

  const today = new Date();
  const todayKey = toLocalDateKey(today);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = toLocalDateKey(yesterday);

  // Check where the streak starts:
  // If user has an entry today, streak is anchored at today.
  // If no entry today, but has an entry yesterday, streak is anchored at yesterday (active today!).
  // If neither today nor yesterday has an entry, the streak is broken (0).
  let anchorDate: Date;
  if (dateSet.has(todayKey)) {
    anchorDate = new Date(today);
  } else if (dateSet.has(yesterdayKey)) {
    anchorDate = new Date(yesterday);
  } else {
    return 0;
  }

  let streak = 0;
  const cursor = new Date(anchorDate);

  // Count backwards day by day as long as the date exists in dateSet
  while (true) {
    const key = toLocalDateKey(cursor);
    if (dateSet.has(key)) {
      streak += 1;
      // Step back one calendar day
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

const LOCAL_STORAGE_RECALL_KEY = 'care_user_recall_events';
const LOCAL_STORAGE_JOURNAL_KEY = 'care_user_journal_events';

/**
 * Record a journal entry completion locally to ensure immediate streak reactivity.
 */
export function recordJournalCompletion(userId: string, timestamp: string = new Date().toISOString()): void {
  if (typeof window === 'undefined' || !userId) return;
  try {
    const key = `${LOCAL_STORAGE_JOURNAL_KEY}_${userId}`;
    const raw = localStorage.getItem(key);
    const existing: string[] = raw ? JSON.parse(raw) : [];
    existing.push(timestamp);
    // Keep max 200 events
    localStorage.setItem(key, JSON.stringify(existing.slice(-200)));
  } catch (err) {
    console.warn('[streakService] Failed to cache journal event:', err);
  }
}

/**
 * Retrieve cached journal completion timestamps for a user.
 */
export function getCachedJournalDates(userId?: string): string[] {
  if (typeof window === 'undefined' || !userId) return [];
  try {
    const key = `${LOCAL_STORAGE_JOURNAL_KEY}_${userId}`;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Record a recall session completion locally to ensure immediate streak reactivity.
 */
export function recordRecallCompletion(userId: string, timestamp: string = new Date().toISOString()): void {
  if (typeof window === 'undefined' || !userId) return;
  try {
    const key = `${LOCAL_STORAGE_RECALL_KEY}_${userId}`;
    const raw = localStorage.getItem(key);
    const existing: string[] = raw ? JSON.parse(raw) : [];
    existing.push(timestamp);
    // Keep max 200 events
    localStorage.setItem(key, JSON.stringify(existing.slice(-200)));
  } catch (err) {
    console.warn('[streakService] Failed to cache recall event:', err);
  }
}

/**
 * Retrieve cached recall completion timestamps for a user.
 */
export function getCachedRecallDates(userId?: string): string[] {
  if (typeof window === 'undefined' || !userId) return [];
  try {
    const key = `${LOCAL_STORAGE_RECALL_KEY}_${userId}`;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Compute both Log Streak and Recall Streak from live application entities.
 */
export function calculateUserStreaks(
  entries: JournalEntry[] = [],
  topics: TopicRetentionState[] = [],
  userId?: string
): { logStreak: number; recallStreak: number } {
  // 1. Log streak from journal entries + local cached completions
  const localJournalDates = getCachedJournalDates(userId);
  const logDates = [...entries.map((e) => e.createdAt), ...localJournalDates];
  const logStreak = calculateStreak(logDates);

  // 2. Recall streak from topics' recallHistory + local cached completions
  const topicRecallDates: string[] = [];
  topics.forEach((t) => {
    if (t.recallHistory && Array.isArray(t.recallHistory)) {
      t.recallHistory.forEach((h) => {
        if (h.timestamp) topicRecallDates.push(h.timestamp);
      });
    }
    if (t.lastRecallAt) {
      topicRecallDates.push(t.lastRecallAt);
    }
  });

  const localRecallDates = getCachedRecallDates(userId);
  const combinedRecallDates = [...topicRecallDates, ...localRecallDates];
  const recallStreak = calculateStreak(combinedRecallDates);

  return { logStreak, recallStreak };
}
