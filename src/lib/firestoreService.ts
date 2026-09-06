/**
 * CARE - Cloud Firestore Service
 * Enforces strict multi-tenant data isolation under /users/{userId}.
 * Directly reads and writes to Firebase Cloud Firestore with owner-bound security paths.
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  query,
  orderBy,
  where,
  increment,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';
import { db, auth } from './firebase';
import {
  JournalEntry,
  TopicRetentionState,
  ExtractedConcept,
  AiAssistanceLevel,
  RecallSession,
  ChatTurn,
  RecallEvaluation,
  UserProfile,
} from '../types';

/**
 * Standard Operation Types for Firestore Error Reporting
 */
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

/**
 * Structured Firestore Error Details
 */
export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

/**
 * Uniform Firestore Error Handler
 * Catches permission-denied, network failures, or database write exceptions,
 * prints detailed auth/path context, and throws a JSON-formatted Error string.
 */
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const currentUser = auth.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid ?? null,
      email: currentUser?.email ?? null,
      emailVerified: currentUser?.emailVerified ?? null,
      isAnonymous: currentUser?.isAnonymous ?? null,
      providerInfo: currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };

  console.error(
    `[FIRESTORE ERROR] [UID: ${currentUser?.uid ?? 'UNAUTHENTICATED'}] [Path: ${path}] [Op: ${operationType}]`,
    JSON.stringify(errInfo)
  );
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Executes a Promise with a maximum timeout to prevent UI components from spinning indefinitely.
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs = 5000,
  errorMessage = 'Firestore operation timed out'
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${errorMessage} (after ${timeoutMs}ms)`));
    }, timeoutMs);

    promise
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

// AI Assistance Weights for CARE Heuristics
const AI_ASSISTANCE_WEIGHTS: Record<AiAssistanceLevel, number> = {
  none: 0.1,
  prompt_driven: 0.45,
  spec_driven: 0.75,
  agentic: 1.0,
};

/**
 * Deeply removes any undefined keys or values from an object before Firestore submission.
 * Firestore strictly rejects documents with any property set to undefined.
 */
export function stripUndefinedDeep<T>(obj: T): T {
  if (obj === undefined) {
    return null as unknown as T;
  }
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj
      .filter((v) => v !== undefined)
      .map((v) => stripUndefinedDeep(v)) as unknown as T;
  }
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      result[key] = stripUndefinedDeep(value);
    }
  }
  return result as T;
}

function sanitizeTopicId(rawId: string, canonicalName: string): string {
  const clean = (rawId || canonicalName || 'topic').trim().toLowerCase();
  const sanitized = clean.replace(/[^a-z0-9_-]/g, '_').replace(/_+/g, '_').slice(0, 48);
  return sanitized || `topic_${Date.now().toString(36)}`;
}

export function extractConceptsLocally(
  title: string,
  rawContent: string,
  aiLevel: AiAssistanceLevel
): ExtractedConcept[] {
  const text = `${title} ${rawContent}`.toLowerCase();
  const taxonomy = [
    { kw: 'attention', name: 'Self-Attention Mechanism', cat: 'Deep Learning', score: 0.95 },
    { kw: 'flashattention', name: 'FlashAttention-2', cat: 'Deep Learning', score: 0.88 },
    { kw: 'transformer', name: 'Transformer Architecture', cat: 'Deep Learning', score: 0.9 },
    { kw: 'lora', name: 'LoRA Fine-Tuning', cat: 'Deep Learning', score: 0.89 },
    { kw: 'peft', name: 'Parameter-Efficient Fine-Tuning', cat: 'Deep Learning', score: 0.86 },
    { kw: 'kv cache', name: 'KV Cache Optimization', cat: 'Deep Learning', score: 0.93 },
    { kw: 'quantization', name: 'FP8 Quantization', cat: 'Model Optimization', score: 0.85 },
    { kw: 'hnsw', name: 'HNSW Vector Indexing', cat: 'Information Retrieval', score: 0.91 },
    { kw: 'pgvector', name: 'Vector Search with pgvector', cat: 'Information Retrieval', score: 0.84 },
    { kw: 'gin', name: 'Postgres GIN Indexing', cat: 'Data Infrastructure', score: 0.86 },
    { kw: 'jsonb', name: 'Postgres JSONB Architecture', cat: 'Data Infrastructure', score: 0.83 },
    { kw: 'redis', name: 'Distributed Cache Invalidation', cat: 'Distributed Systems', score: 0.82 },
    { kw: 'ray', name: 'Ray Distributed Clusters', cat: 'MLOps & Infrastructure', score: 0.8 },
    { kw: 'drift', name: 'Covariate Shift & Data Drift', cat: 'MLOps & Infrastructure', score: 0.9 },
    { kw: 'mmd', name: 'Maximum Mean Discrepancy (MMD)', cat: 'Statistics & Probability', score: 0.87 },
    { kw: 'bayes', name: 'Bayesian Inference', cat: 'Statistics & Probability', score: 0.88 },
    { kw: 'kde', name: 'Kernel Density Estimation', cat: 'Statistics & Probability', score: 0.81 },
    { kw: 'k-fold', name: 'Stratified K-Fold CV', cat: 'Classical ML', score: 0.84 },
    { kw: 'cross validation', name: 'Stratified K-Fold CV', cat: 'Classical ML', score: 0.84 },
    { kw: 'feature store', name: 'Feature Store Time Joins', cat: 'Data Infrastructure', score: 0.79 },
    { kw: 'ddp', name: 'Distributed Data Parallel', cat: 'Deep Learning', score: 0.87 },
  ];

  const matched: ExtractedConcept[] = [];
  for (const item of taxonomy) {
    if (text.includes(item.kw)) {
      matched.push({
        topicId: sanitizeTopicId(item.name, item.name),
        canonicalName: item.name,
        category: item.cat,
        importanceScore: item.score,
        contextSummary: `Identified from technical context: ${title}`,
      });
    }
  }

  if (matched.length === 0) {
    matched.push({
      topicId: sanitizeTopicId(title, title) || 'data_science_workflow',
      canonicalName: title || 'Data Science Workflow',
      category: 'Data Science & Systems',
      importanceScore: 0.75,
      contextSummary: 'Primary concept identified from work journal entry.',
    });
  }

  return matched;
}

export function calculateTopicPriority(
  topic: Partial<TopicRetentionState>,
  baseImportance = 0.85
): { priorityScore: number; explanationReason: string; T_decay: number; A_signal: number; H_weakness: number; M_freq: number } {
  const lastEvent = topic.lastRecallAt || topic.lastLoggedAt || new Date().toISOString();
  const elapsedDays = Math.max(0.1, (Date.now() - new Date(lastEvent).getTime()) / (1000 * 86400));
  
  // Time decay factor T(t) = 1 - e^(-0.1 * t)
  const T_decay = +(1.0 - Math.exp(-0.1 * elapsedDays)).toFixed(3);
  
  // AI reliance factor A(t)
  const A_signal = +(topic.effectiveAiAssistanceWeight ?? 0.5).toFixed(3);
  
  // Historical weakness H(t)
  const score = topic.lastRecallScore ?? 2.5;
  const H_weakness = topic.recallHistory && topic.recallHistory.length > 0 ? +((5.0 - score) / 4.0).toFixed(3) : 0.5;
  
  // Frequency multiplier M(t)
  const occurrences = topic.journalOccurrences ?? 1;
  const M_freq = +(1.0 + 0.05 * Math.min(Math.max(0, occurrences - 1), 6)).toFixed(3);
  
  // Priority(t) = [0.40 * T(t) + 0.35 * A(t) + 0.25 * H(t)] * M(t)
  const rawPriority = (0.4 * T_decay + 0.35 * A_signal + 0.25 * H_weakness) * M_freq * (baseImportance || 1.0) * 100;
  const priorityScore = Math.round(Math.min(100, Math.max(5, rawPriority)) * 10) / 10;
  
  const explanationReason = `T(t)=${T_decay} (${elapsedDays.toFixed(1)}d) | A(t)=${A_signal} | H(t)=${H_weakness} | M(t)=${M_freq}`;
  
  return { priorityScore, explanationReason, T_decay, A_signal, H_weakness, M_freq };
}

export const firestoreService = {
  /**
   * Subscribes to real-time journal entries for a given user from Firestore.
   * Explicitly logs current UID and collection path, and handles listener errors.
   */
  subscribeUserJournalEntries(
    userId: string,
    onUpdate: (entries: JournalEntry[], empty: boolean) => void,
    onError?: (error: any) => void
  ): () => void {
    if (!userId) {
      onUpdate([], true);
      return () => {};
    }

    const path = `users/${userId}/journal_entries`;
    console.log(`[FIRESTORE LISTENER] [UID: ${userId}] Subscribing to real-time updates on path: ${path}`);

    try {
      const entriesRef = collection(db, 'users', userId, 'journal_entries');
      const q = query(entriesRef, orderBy('createdAt', 'desc'));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (snapshot.empty) {
            onUpdate([], true);
            return;
          }

          const entries: JournalEntry[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            if (data && data.entryId) {
              entries.push({
                entryId: data.entryId,
                userId: data.userId || userId,
                title: data.title || 'Untitled Journal',
                rawContent: data.rawContent || '',
                aiAssistanceLevel: data.aiAssistanceLevel || 'prompt_driven',
                aiReliancePercentage: data.aiReliancePercentage,
                aiToolUsed: data.aiToolUsed,
                modeType: data.modeType || 'Web App',
                stabilityRatio: data.stabilityRatio,
                kernelProfileSnapshot: data.kernelProfileSnapshot,
                hardwareProfile: data.hardwareProfile,
                tags: data.tags || [],
                timeUtc: data.timeUtc,
                actionLabel: data.actionLabel,
                dateGroup: data.dateGroup,
                extractedConcepts: data.extractedConcepts || [],
                createdAt: data.createdAt || new Date().toISOString(),
              });
            }
          });

          onUpdate(entries, snapshot.empty);
        },
        (error) => {
          console.warn(`[FIRESTORE LISTENER WARNING] [UID: ${userId}] Path: ${path}`, error.message || error);
          if (onError) onError(error);
          onUpdate([], true);
        }
      );

      return unsubscribe;
    } catch (err: any) {
      console.warn(`[FIRESTORE INIT LISTENER WARNING] [UID: ${userId}] Path: ${path}`, err.message || err);
      if (onError) onError(err);
      onUpdate([], true);
      return () => {};
    }
  },

  /**
   * Fetches journal entries belonging exclusively to the given userId from Firestore.
   */
  async getUserJournalEntries(userId: string): Promise<JournalEntry[]> {
    if (!userId) return [];
    const path = `users/${userId}/journal_entries`;
    console.log(`[FIRESTORE GET] [UID: ${userId}] Querying documents at path: ${path}`);

    try {
      const entriesRef = collection(db, 'users', userId, 'journal_entries');
      const q = query(entriesRef, orderBy('createdAt', 'desc'));
      const snapshot = await withTimeout(
        getDocs(q),
        10000,
        `getDocs timeout on path ${path}`
      );

      const entries: JournalEntry[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data && data.entryId) {
          entries.push({
            entryId: data.entryId,
            userId: data.userId || userId,
            title: data.title || 'Untitled Journal',
            rawContent: data.rawContent || '',
            aiAssistanceLevel: data.aiAssistanceLevel || 'prompt_driven',
            aiReliancePercentage: data.aiReliancePercentage,
            aiToolUsed: data.aiToolUsed,
            modeType: data.modeType || 'Web App',
            stabilityRatio: data.stabilityRatio,
            kernelProfileSnapshot: data.kernelProfileSnapshot,
            hardwareProfile: data.hardwareProfile,
            tags: data.tags || [],
            timeUtc: data.timeUtc,
            actionLabel: data.actionLabel,
            dateGroup: data.dateGroup,
            extractedConcepts: data.extractedConcepts || [],
            createdAt: data.createdAt || new Date().toISOString(),
          });
        }
      });

      return entries;
    } catch (err: any) {
      console.warn(`[FIRESTORE GET WARNING] [UID: ${userId}] Path: ${path}`, err.message || err);
      return [];
    }
  },

  /**
   * Creates a new journal entry in Firestore under /users/{userId}/journal_entries/{entryId}
   * and extracts/updates topic retention states under /users/{userId}/topic_retention_states/{topicId}.
   */
  async createJournalEntry(
    userId: string,
    payload: {
      title: string;
      rawContent: string;
      aiAssistanceLevel: AiAssistanceLevel;
      aiToolUsed?: string;
      modeType?: string;
      stabilityRatio?: number;
      tags?: string[];
    }
  ): Promise<{
    entry: JournalEntry;
    extractedConcepts: ExtractedConcept[];
    updatedTopics: TopicRetentionState[];
  }> {
    if (!userId) throw new Error('User ID required for Firestore write');

    const entryId = `entry_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();
    const timeUtc = `${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })} UTC`;
    const dateGroup = `Today — ${new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}`;

    const reliancePct =
      payload.aiAssistanceLevel === 'agentic'
        ? 85
        : payload.aiAssistanceLevel === 'spec_driven'
        ? 78
        : payload.aiAssistanceLevel === 'prompt_driven'
        ? 45
        : 12;

    const stabilityRatio = payload.stabilityRatio ?? (reliancePct >= 70 ? 0.34 : reliancePct >= 40 ? 0.65 : 0.88);
    const actionLabel = stabilityRatio < 0.55 ? 'Recall Diagnostic →' : 'Stable';

    // 1. Extract concepts
    const concepts = extractConceptsLocally(payload.title, payload.rawContent, payload.aiAssistanceLevel);

    // 2. Build entry object
    const entry: Record<string, any> = {
      entryId,
      userId,
      title: payload.title.trim(),
      rawContent: payload.rawContent.trim(),
      aiAssistanceLevel: payload.aiAssistanceLevel,
      aiReliancePercentage: reliancePct,
      modeType: payload.modeType || 'Web App',
      stabilityRatio,
      tags: payload.tags && payload.tags.length > 0 ? payload.tags : concepts.map((c) => `#${c.canonicalName}`),
      timeUtc,
      actionLabel,
      dateGroup,
      extractedConcepts: concepts,
      createdAt: nowIso,
    };
    if (payload.aiToolUsed && payload.aiToolUsed.trim()) {
      entry.aiToolUsed = payload.aiToolUsed.trim();
    }

    // 3. Persist entry doc to Firestore
    const entryPath = `users/${userId}/journal_entries/${entryId}`;
    console.log(`[FIRESTORE WRITE] [UID: ${userId}] Writing setDoc to path: ${entryPath}`);
    const entryDocRef = doc(db, 'users', userId, 'journal_entries', entryId);
    try {
      await withTimeout(
        setDoc(entryDocRef, stripUndefinedDeep(entry)),
        15000,
        `setDoc timeout on path ${entryPath}`
      );
    } catch (err: any) {
      console.warn(`[FIRESTORE WRITE WARNING] ${err.message || err}`);
    }

    // 4. Update/Create Topic Retention States in Firestore
    const updatedTopics: TopicRetentionState[] = [];
    for (const concept of concepts) {
      const topicId = concept.topicId;
      const topicPath = `users/${userId}/topic_retention_states/${topicId}`;
      console.log(`[FIRESTORE ACCESS] [UID: ${userId}] Accessing topic state at path: ${topicPath}`);
      const topicDocRef = doc(db, 'users', userId, 'topic_retention_states', topicId);

      let existingSnap: any = null;
      try {
        existingSnap = await withTimeout(
          getDoc(topicDocRef),
          10000,
          `getDoc timeout on path ${topicPath}`
        );
      } catch (err: any) {
        console.warn(`[FIRESTORE GET WARNING] ${err.message || err}`);
      }

      let topicState: TopicRetentionState;
      if (existingSnap && existingSnap.exists && existingSnap.exists()) {
        const data = existingSnap.data();
        const occurrences = (data.journalOccurrences || 1) + 1;
        const signals = [...(data.recentAiAssistanceSignals || []), payload.aiAssistanceLevel].slice(-10);
        const weights = signals.map((s) => AI_ASSISTANCE_WEIGHTS[s as AiAssistanceLevel] || 0.5);
        const avgWeight = +(weights.reduce((a, b) => a + b, 0) / Math.max(weights.length, 1)).toFixed(2);

        topicState = {
          topicId,
          userId,
          canonicalName: data.canonicalName || concept.canonicalName,
          category: data.category || concept.category,
          firstLoggedAt: data.firstLoggedAt || nowIso,
          lastLoggedAt: nowIso,
          lastRecallAt: data.lastRecallAt || null,
          journalOccurrences: occurrences,
          recentAiAssistanceSignals: signals,
          effectiveAiAssistanceWeight: avgWeight,
          recallHistory: data.recallHistory || [],
          lastRecallScore: data.lastRecallScore ?? 2.5,
          currentPriorityScore: 50.0,
          decayFactor: data.decayFactor ?? 1.0,
        };
      } else {
        const initialWeight = AI_ASSISTANCE_WEIGHTS[payload.aiAssistanceLevel] || 0.5;
        topicState = {
          topicId,
          userId,
          canonicalName: concept.canonicalName,
          category: concept.category,
          firstLoggedAt: nowIso,
          lastLoggedAt: nowIso,
          lastRecallAt: null,
          journalOccurrences: 1,
          recentAiAssistanceSignals: [payload.aiAssistanceLevel],
          effectiveAiAssistanceWeight: initialWeight,
          recallHistory: [],
          lastRecallScore: 2.5,
          currentPriorityScore: 50.0,
          decayFactor: 1.0,
        };
      }

      const priorityCalc = calculateTopicPriority(topicState, concept.importanceScore);
      topicState.currentPriorityScore = priorityCalc.priorityScore;
      topicState.explanationReason = priorityCalc.explanationReason;

      console.log(`[FIRESTORE WRITE] [UID: ${userId}] Writing topic state setDoc to path: ${topicPath}`);
      try {
        await withTimeout(
          setDoc(topicDocRef, stripUndefinedDeep(topicState)),
          15000,
          `setDoc topic timeout on path ${topicPath}`
        );
      } catch (err: any) {
        console.warn(`[FIRESTORE WRITE WARNING] ${err.message || err}`);
      }
      updatedTopics.push(topicState);
    }

    // 5. Update user profile statistics
    const userPath = `users/${userId}`;
    console.log(`[FIRESTORE WRITE] [UID: ${userId}] Updating user profile stats merge at path: ${userPath}`);
    try {
      const userDocRef = doc(db, 'users', userId);
      await withTimeout(
        setDoc(
          userDocRef,
          stripUndefinedDeep({
            updatedAt: nowIso,
            stats: {
              totalJournalsLogged: increment(1),
            },
          }),
          { merge: true }
        ),
        15000,
        `setDoc stats timeout on path ${userPath}`
      );
    } catch (e: any) {
      console.warn(`[FIRESTORE MERGE WARNING] [UID: ${userId}] Path: ${userPath}`, e);
    }

    return { entry: entry as JournalEntry, extractedConcepts: concepts, updatedTopics };
  },

  /**
   * Fetches all topics for the given userId from Firestore with recalculated priority.
   */
  async getUserTopics(userId: string): Promise<TopicRetentionState[]> {
    if (!userId) return [];
    const path = `users/${userId}/topic_retention_states`;
    console.log(`[FIRESTORE GET] [UID: ${userId}] Fetching topics at path: ${path}`);

    try {
      const topicsRef = collection(db, 'users', userId, 'topic_retention_states');
      const snapshot = await withTimeout(
        getDocs(topicsRef),
        10000,
        `getDocs timeout on path ${path}`
      );

      const topics: TopicRetentionState[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data && data.topicId) {
          const state: TopicRetentionState = {
            topicId: data.topicId,
            userId: data.userId || userId,
            canonicalName: data.canonicalName || 'Concept',
            category: data.category || 'Data Science',
            firstLoggedAt: data.firstLoggedAt || new Date().toISOString(),
            lastLoggedAt: data.lastLoggedAt || new Date().toISOString(),
            lastRecallAt: data.lastRecallAt || null,
            journalOccurrences: data.journalOccurrences || 1,
            recentAiAssistanceSignals: data.recentAiAssistanceSignals || ['prompt_driven'],
            effectiveAiAssistanceWeight: data.effectiveAiAssistanceWeight ?? 0.5,
            recallHistory: data.recallHistory || [],
            lastRecallScore: data.lastRecallScore ?? 2.5,
            currentPriorityScore: data.currentPriorityScore ?? 50.0,
            decayFactor: data.decayFactor ?? 1.0,
            explanationReason: data.explanationReason,
          };

          // Dynamically compute real-time elapsed decay priority
          const calc = calculateTopicPriority(state);
          state.currentPriorityScore = calc.priorityScore;
          state.explanationReason = calc.explanationReason;

          topics.push(state);
        }
      });

      // Sort descending by priority score
      topics.sort((a, b) => b.currentPriorityScore - a.currentPriorityScore);
      return topics;
    } catch (err: any) {
      console.warn(`[FIRESTORE GET WARNING] [UID: ${userId}] Path: ${path}`, err.message || err);
      return [];
    }
  },

  /**
   * Initializes an active recall session doc in Firestore under /users/{userId}/recall_sessions/{sessionId}.
   */
  async initRecallSession(
    userId: string,
    topicId: string,
    targetDepth: 'foundational' | 'intermediate' | 'advanced' = 'intermediate',
    customFocusArea?: string
  ): Promise<{ session: RecallSession; topic: TopicRetentionState; breakdown: any }> {
    const topicPath = `users/${userId}/topic_retention_states/${topicId}`;
    console.log(`[FIRESTORE READ] [UID: ${userId}] Fetching topic state for session init at path: ${topicPath}`);
    const topicDocRef = doc(db, 'users', userId, 'topic_retention_states', topicId);

    let snap: any = null;
    try {
      snap = await getDoc(topicDocRef);
    } catch (err: any) {
      console.warn(`[FIRESTORE GET WARNING] [UID: ${userId}] Path: ${topicPath}`, err.message || err);
    }

    let topic: TopicRetentionState;
    if (snap && snap.exists && snap.exists()) {
      topic = snap.data() as TopicRetentionState;
    } else {
      // Fallback baseline topic
      topic = {
        topicId,
        userId,
        canonicalName: topicId.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
        category: 'Data Science & Systems',
        firstLoggedAt: new Date().toISOString(),
        lastLoggedAt: new Date().toISOString(),
        lastRecallAt: null,
        journalOccurrences: 1,
        recentAiAssistanceSignals: ['prompt_driven'],
        effectiveAiAssistanceWeight: 0.5,
        recallHistory: [],
        lastRecallScore: 2.5,
        currentPriorityScore: 50.0,
        decayFactor: 1.0,
      };
    }

    const calc = calculateTopicPriority(topic);
    const breakdown = {
      priorityScore: calc.priorityScore,
      T_decay: calc.T_decay,
      d_elapsed_days: 1.0,
      A_signal: calc.A_signal,
      H_weakness: calc.H_weakness,
      M_freq: calc.M_freq,
      rationaleBadge: calc.A_signal >= 0.75 ? 'High AI Reliance' : 'Time Decay Alert',
      explanationReason: calc.explanationReason,
    };

    const sessionId = `session_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
    const sessionPath = `users/${userId}/recall_sessions/${sessionId}`;
    const session: RecallSession = {
      sessionId,
      userId,
      topicId: topic.topicId,
      topicName: topic.canonicalName,
      status: 'in_progress',
      targetDepth,
      customFocusArea,
      initialBreakdown: breakdown,
      turns: [],
      startedAt: new Date().toISOString(),
    };

    console.log(`[FIRESTORE WRITE] [UID: ${userId}] Initializing recall session at path: ${sessionPath}`);
    const sessionDocRef = doc(db, 'users', userId, 'recall_sessions', sessionId);
    try {
      await setDoc(sessionDocRef, stripUndefinedDeep(session));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, sessionPath);
    }

    return { session, topic, breakdown };
  },

  /**
   * Appends user and partner turns to the recall session.
   */
  async sendRecallMessage(
    userId: string,
    sessionId: string,
    userMessage?: string
  ): Promise<{ session: RecallSession; turn: ChatTurn; isFirstTurn: boolean }> {
    const sessionPath = `users/${userId}/recall_sessions/${sessionId}`;
    console.log(`[FIRESTORE READ] [UID: ${userId}] Fetching session for turn update at path: ${sessionPath}`);
    const sessionDocRef = doc(db, 'users', userId, 'recall_sessions', sessionId);

    let snap: any = null;
    try {
      snap = await getDoc(sessionDocRef);
    } catch (err: any) {
      console.warn(`[FIRESTORE GET WARNING] [UID: ${userId}] Path: ${sessionPath}`, err.message || err);
    }

    if (!snap || !snap.exists || !snap.exists()) throw new Error(`Session ${sessionId} not found`);

    const session = snap.data() as RecallSession;
    if (!session.turns) session.turns = [];

    if (userMessage && userMessage.trim()) {
      session.turns.push({
        role: 'user',
        message: userMessage.trim(),
        timestamp: new Date().toISOString(),
      });
    }

    const turnCount = session.turns.length;
    const topicName = session.topicName || 'this concept';
    const depth = session.targetDepth || 'intermediate';

    let partnerResponse = '';
    if (turnCount === 0 || (turnCount === 1 && userMessage)) {
      if (depth === 'foundational') {
        partnerResponse = `Welcome to this active recall session on ${topicName}. As your Peer Knowledge Partner, walk me through the intuitive problem statement: why do we need ${topicName}, and what breaks down if we use classical baselines instead?`;
      } else if (depth === 'advanced') {
        partnerResponse = `Let's dive straight into ${topicName}. From a mathematical formulation standpoint, what objective function or loss surfaces dictate its convergence, and how does the architecture prevent gradient instability or degenerate representations?`;
      } else {
        partnerResponse = `Welcome. As your Peer Knowledge Partner, let's examine ${topicName}. Walk me through its primary algorithmic mechanism: what inputs does it transform, and what fundamental trade-off does it make between representational capacity and computational efficiency?`;
      }
    } else if (turnCount <= 3) {
      partnerResponse = `That's a sound formulation. Let's probe the mechanics deeper: when you tune hyperparameters or loss coefficients for ${topicName}, which parameter directly controls this sensitivity, and what happens mathematically during gradient updates if that parameter is set an order of magnitude too high?`;
    } else if (turnCount <= 5) {
      partnerResponse = `Great observation regarding the dynamics. Now consider a real-world edge case: suppose your production input distribution shifts significantly or contains high-sparsity anomalies. Under what specific conditions does ${topicName} fail silently, and how would you verify this in telemetry?`;
    } else {
      partnerResponse = `To wrap up our technical deep dive into ${topicName}: if you had to mentor a colleague on avoiding the single most dangerous misconception when implementing or fine-tuning this, what would that core takeaway be?`;
    }

    const assistantTurn: ChatTurn = {
      role: 'assistant',
      message: partnerResponse,
      timestamp: new Date().toISOString(),
    };

    session.turns.push(assistantTurn);

    console.log(`[FIRESTORE WRITE] [UID: ${userId}] Updating session turns at path: ${sessionPath}`);
    try {
      await setDoc(sessionDocRef, stripUndefinedDeep(session));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, sessionPath);
    }

    return {
      session,
      turn: assistantTurn,
      isFirstTurn: turnCount <= 1,
    };
  },

  /**
   * Finalizes and evaluates a completed recall session, updating topic state in Firestore.
   */
  async evaluateRecallSession(
    userId: string,
    sessionId: string
  ): Promise<{ session: RecallSession; evaluation: RecallEvaluation; updatedTopic: TopicRetentionState }> {
    const sessionPath = `users/${userId}/recall_sessions/${sessionId}`;
    console.log(`[FIRESTORE READ] [UID: ${userId}] Fetching session for evaluation at path: ${sessionPath}`);
    const sessionDocRef = doc(db, 'users', userId, 'recall_sessions', sessionId);

    let snap: any = null;
    try {
      snap = await getDoc(sessionDocRef);
    } catch (err: any) {
      console.warn(`[FIRESTORE GET WARNING] [UID: ${userId}] Path: ${sessionPath}`, err.message || err);
    }

    if (!snap || !snap.exists || !snap.exists()) throw new Error(`Session ${sessionId} not found`);

    const session = snap.data() as RecallSession;
    const userTurns = (session.turns || []).filter((t) => t.role === 'user');
    const totalChars = userTurns.reduce((acc, t) => acc + t.message.length, 0);
    const scorePercentage = Math.min(96, Math.max(58, Math.round(62 + Math.min(28, (totalChars / 40) * 4) + userTurns.length * 3)));
    const overallScore = +(1.0 + (scorePercentage / 100) * 4.0).toFixed(1);

    const evaluation: RecallEvaluation = {
      scorePercentage,
      conceptualDepth: scorePercentage >= 80 ? 4 : 3,
      practicalApplication: scorePercentage >= 75 ? 4 : 3,
      overallScore,
      identifiedGaps: [
        `Formal mathematical bounds and derivation nuances for ${session.topicName}`,
        `Edge case handling under non-stationary or high-skew feature distributions`,
      ],
      retentionTips: [
        `Work through a paper-and-pencil derivation of the primary objective functions in ${session.topicName}`,
        `Implement a minimal toy benchmark from scratch to test degradation thresholds`,
        `Schedule a follow-up active recall in 4-6 days to reinforce memory consolidation`,
      ],
      strengths: `Demonstrated clear practical intuition and solid grasp of core architectural trade-offs for ${session.topicName}.`,
      areasForImprovement: `Solidify mathematical mechanics and explicit failure mode telemetry mitigations.`,
      keyTakeaway: `${session.topicName} relies on core mathematical invariants that must be validated in production deployment.`,
    };

    const nowIso = new Date().toISOString();
    session.status = 'completed';
    session.evaluation = evaluation;
    session.completedAt = nowIso;

    console.log(`[FIRESTORE WRITE] [UID: ${userId}] Saving evaluated session at path: ${sessionPath}`);
    try {
      await setDoc(sessionDocRef, stripUndefinedDeep(session));
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, sessionPath);
    }

    // Update Topic in Firestore
    const topicPath = `users/${userId}/topic_retention_states/${session.topicId}`;
    console.log(`[FIRESTORE ACCESS] [UID: ${userId}] Updating post-recall topic state at path: ${topicPath}`);
    const topicDocRef = doc(db, 'users', userId, 'topic_retention_states', session.topicId);

    let topicSnap: any = null;
    try {
      topicSnap = await getDoc(topicDocRef);
    } catch (err: any) {
      console.warn(`[FIRESTORE GET WARNING] [UID: ${userId}] Path: ${topicPath}`, err.message || err);
    }

    let updatedTopic: TopicRetentionState;

    if (topicSnap && topicSnap.exists && topicSnap.exists()) {
      const topicData = topicSnap.data() as TopicRetentionState;
      const history = topicData.recallHistory || [];
      history.push({
        sessionId,
        timestamp: nowIso,
        score: overallScore,
        feedbackSummary: evaluation.keyTakeaway,
      });

      updatedTopic = {
        ...topicData,
        lastRecallAt: nowIso,
        lastRecallScore: overallScore,
        recallHistory: history,
      };

      const calc = calculateTopicPriority(updatedTopic);
      updatedTopic.currentPriorityScore = calc.priorityScore;
      updatedTopic.explanationReason = calc.explanationReason;

      try {
        await setDoc(topicDocRef, stripUndefinedDeep(updatedTopic));
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, topicPath);
      }
    } else {
      updatedTopic = {
        topicId: session.topicId,
        userId,
        canonicalName: session.topicName,
        category: 'Data Science',
        firstLoggedAt: nowIso,
        lastLoggedAt: nowIso,
        lastRecallAt: nowIso,
        journalOccurrences: 1,
        recentAiAssistanceSignals: ['prompt_driven'],
        effectiveAiAssistanceWeight: 0.5,
        recallHistory: [{ sessionId, timestamp: nowIso, score: overallScore, feedbackSummary: evaluation.keyTakeaway }],
        lastRecallScore: overallScore,
        currentPriorityScore: 25.0,
        decayFactor: 0.4,
      };
      try {
        await setDoc(topicDocRef, stripUndefinedDeep(updatedTopic));
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, topicPath);
      }
    }

    return { session, evaluation, updatedTopic };
  },

  /**
   * Helper to seed sample telemetry specifically for the authenticated user's private database.
   */
  async seedUserSampleData(userId: string): Promise<void> {
    if (!userId) return;

    const samples = [
      {
        title: 'Self-Attention Mechanism Optimization',
        rawContent: 'Refactored multi-head scaled dot-product attention kernels. Replaced custom naive QK^T matrix multiplication with tiled block SRAM operations to mitigate memory bandwidth saturation. AI co-pilot generated vector masking routines while I tuned dimension alignment with torch.matmul(q, k.transpose(-2, -1)) and strict block_size = 128 boundaries.',
        aiAssistanceLevel: 'spec_driven' as AiAssistanceLevel,
        aiToolUsed: 'Cursor Copilot',
        modeType: 'Web App',
      },
      {
        title: 'Distributed Cache Invalidation via Redis Streams',
        rawContent: 'Implemented consumer group rebalancing and two-phase tombstone marking for distributed session state. Evaluated probabilistic early expiration against dogpiling cache stamps across 8 global nodes. Configured manual backpressure acknowledgment queues with Lua scripts to prevent stale subscriber drops.',
        aiAssistanceLevel: 'prompt_driven' as AiAssistanceLevel,
        aiToolUsed: 'Claude Sonnet',
        modeType: 'GitHub PR #412',
      },
      {
        title: 'Postgres JSONB GIN Indexing & Query Planner Cost Tuning',
        rawContent: 'Diagnosed sequential table scan on 4.2M rows telemetry logs. Constructed expression GIN index over nested schema payload and adjusted random_page_cost down to 1.1 for NVMe storage, shifting the planner execution graph from a 420ms heap inspection to a 3.4ms bitmap index scan.',
        aiAssistanceLevel: 'spec_driven' as AiAssistanceLevel,
        aiToolUsed: 'Claude CLI',
        modeType: 'Web App / Claude CLI',
      },
    ];

    for (const s of samples) {
      await this.createJournalEntry(userId, s);
    }
  },
};
