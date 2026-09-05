/**
 * CARE - Shared TypeScript Interfaces
 * Matches backend Pydantic models for strict type safety.
 */

export type AiAssistanceLevel = 'none' | 'prompt_driven' | 'spec_driven' | 'agentic';

export interface UserStats {
  totalJournalsLogged: number;
  totalRecallSessionsCompleted: number;
  averageRecallScore: number;
  activeTopicsCount: number;
}

export interface UserPreferences {
  dailyRecallTarget: number;
  preferredInterviewTone: 'rigorous_peer' | 'supportive_coach';
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string | null;
  photoURL?: string | null;
  authProvider: string;
  createdAt: string;
  updatedAt: string;
  stats: UserStats;
  preferences: UserPreferences;
}

export interface ExtractedConcept {
  topicId: string;
  canonicalName: string;
  category: string;
  importanceScore: number;
  contextSummary?: string;
}

export interface JournalEntry {
  entryId: string;
  userId: string;
  title: string;
  rawContent: string;
  aiAssistanceLevel: AiAssistanceLevel;
  aiToolUsed?: string;
  extractedConcepts: ExtractedConcept[];
  createdAt: string;
}

export interface RecallHistoryItem {
  sessionId: string;
  timestamp: string;
  score: number;
  feedbackSummary?: string;
}

export interface TopicRetentionState {
  topicId: string;
  userId: string;
  canonicalName: string;
  category: string;
  firstLoggedAt: string;
  lastLoggedAt: string;
  lastRecallAt?: string | null;
  journalOccurrences: number;
  recentAiAssistanceSignals: AiAssistanceLevel[];
  effectiveAiAssistanceWeight: number; // 0.0 to 1.0
  recallHistory: RecallHistoryItem[];
  lastRecallScore: number;
  currentPriorityScore: number;
  decayFactor: number;
  explanationReason?: string;
}

export interface ChatTurn {
  role: 'assistant' | 'user';
  message: string;
  timestamp: string;
}

export interface RecallEvaluation {
  conceptualDepth: number;
  practicalApplication: number;
  overallScore: number;
  strengths: string;
  areasForImprovement: string;
  keyTakeaway: string;
}

export interface RecallSession {
  sessionId: string;
  userId: string;
  topicId: string;
  topicName: string;
  status: 'in_progress' | 'completed' | 'abandoned';
  turns: ChatTurn[];
  evaluation?: RecallEvaluation;
  startedAt: string;
  completedAt?: string;
}

export interface JournalIngestionResponse {
  status: string;
  entry: JournalEntry;
  summary?: string;
  detectedComplexity?: 'foundational' | 'intermediate' | 'advanced';
  extractedConcepts: ExtractedConcept[];
  updatedTopics: TopicRetentionState[];
}

export interface JournalListResponse {
  status: string;
  entries: JournalEntry[];
  total: number;
}

export interface TopicsListResponse {
  status: string;
  topics: TopicRetentionState[];
  total: number;
}
