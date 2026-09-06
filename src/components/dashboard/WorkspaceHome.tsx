/**
 * CARE - WorkspaceHome Component (Slice 2: Journal Ingestion & Concept Extraction)
 * Orchestrates work journal ingestion, displays Gemini-extracted canonical concepts,
 * and tracks real-time retention decay priority rankings.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import {
  ShieldCheck,
  Database,
  Cpu,
  Brain,
  CheckCircle2,
  BookOpen,
  MessageSquareCode,
  Sparkles,
  RefreshCw,
  KeyRound,
  FileCode,
  Plus,
  Layers,
  Flame,
  ArrowRight,
  Lock,
} from 'lucide-react';
import { JournalEntry, TopicRetentionState, ExtractedConcept, RecallSession } from '../../types';
import { JournalEntryForm } from '../journal/JournalEntryForm';
import { JournalFeed } from '../journal/JournalFeed';
import { TopicRetentionList } from './TopicRetentionList';
import { TopicSelectionModal } from '../recall/TopicSelectionModal';
import { TopicPreSessionCard } from '../recall/TopicPreSessionCard';
import { SocraticChatModal } from '../recall/SocraticChatModal';

interface WorkspaceHomeProps {
  onOpenAuth: () => void;
}

export const WorkspaceHome: React.FC<WorkspaceHomeProps> = ({ onOpenAuth }) => {
  const { user, profile, refreshProfile } = useAuth();
  const [showJournalForm, setShowJournalForm] = useState(false);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [topics, setTopics] = useState<TopicRetentionState[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [selectedConcept, setSelectedConcept] = useState<ExtractedConcept | null>(null);

  // Slice 3 & 4: Recall Engine & Socratic Interviewer states
  const [showTopicSelectModal, setShowTopicSelectModal] = useState(false);
  const [selectedTopicForPreSession, setSelectedTopicForPreSession] = useState<TopicRetentionState | null>(null);
  const [activeRecallSession, setActiveRecallSession] = useState<RecallSession | null>(null);
  const [activeRecallTopic, setActiveRecallTopic] = useState<TopicRetentionState | null>(null);

  // Security test token state
  const [tokenTestResult, setTokenTestResult] = useState<any | null>(null);
  const [isTestingToken, setIsTestingToken] = useState<boolean>(false);
  const [testError, setTestError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) {
      setEntries([]);
      setTopics([]);
      setIsLoadingData(false);
      return;
    }

    setIsLoadingData(true);
    try {
      const [entriesRes, topicsRes] = await Promise.all([
        api.getJournalEntries().catch(() => ({ entries: [], total: 0 })),
        api.getTopics().catch(() => ({ topics: [], total: 0 })),
      ]);

      setEntries(entriesRes.entries || []);
      setTopics(topicsRes.topics || []);
    } catch (err) {
      console.warn('Error fetching workspace data:', err);
    } finally {
      setIsLoadingData(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData, user]);

  // Reset form and concept inspector when logged out
  useEffect(() => {
    if (!user) {
      setShowJournalForm(false);
      setSelectedConcept(null);
      setEntries([]);
      setTopics([]);
    }
  }, [user]);

  const handleJournalSuccess = async (newEntry: JournalEntry, newConcepts: ExtractedConcept[]) => {
    // Refresh user profile stats and refresh entries/topics lists
    await refreshProfile();
    await fetchData();
  };

  const handleTestTokenVerification = async () => {
    setIsTestingToken(true);
    setTestError(null);
    try {
      const res = await api.syncUserProfile();
      setTokenTestResult(res);
      await refreshProfile();
    } catch (err: any) {
      setTestError(err.message || 'Token verification failed');
    } finally {
      setIsTestingToken(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner / Hero */}
      <div className="bg-stone-900 border border-stone-800 rounded-xl p-6 relative overflow-hidden shadow-sm">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/25 rounded-md text-xs text-emerald-400 font-mono mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Slice 2 Active: Journal Ingestion & Gemini Concept Extraction
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-100">
              {user ? (
                <>Welcome, <span className="text-emerald-400">{profile?.displayName || user.email?.split('@')[0]}</span></>
              ) : (
                <>Adaptive Retention for <span className="text-emerald-400">Data Science Workflows</span></>
              )}
            </h1>
            <p className="text-sm sm:text-base text-stone-400 mt-2 leading-relaxed">
              Counteracting AI-assisted technical knowledge decay. Log your daily work notes with AI reliance signals;
              Gemini 3.8 Flash extracts core canonical concepts and updates your decay priority scores.
            </p>
          </div>

          <div className="shrink-0 flex flex-wrap items-center gap-3">
            {user ? (
              <>
                <button
                  id="btn-toggle-log-journal"
                  type="button"
                  onClick={() => setShowJournalForm((prev) => !prev)}
                  className="py-2.5 px-5 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-semibold rounded-lg text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  {showJournalForm ? (
                    <span>Hide Entry Form</span>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 text-stone-950" />
                      <span>Log Work Journal</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={fetchData}
                  disabled={isLoadingData}
                  className="p-2.5 bg-stone-800 hover:bg-stone-750 text-stone-300 rounded-lg border border-stone-700 transition-colors"
                  title="Refresh journal entries and topics"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingData ? 'animate-spin' : ''}`} />
                </button>
              </>
            ) : (
              <button
                id="btn-hero-connect-workspace"
                onClick={onOpenAuth}
                className="py-2.5 px-5 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-semibold rounded-lg text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <KeyRound className="w-4 h-4 text-stone-950" />
                <span>Sign In Workspace</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Unauthenticated Locked State Banner */}
      {!user ? (
        <div id="unauthenticated-locked-banner" className="bg-stone-900 border border-stone-800 rounded-xl p-8 sm:p-12 text-center shadow-md">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center mx-auto mb-4 text-emerald-400">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-stone-100 tracking-tight">
            Sign in to access your private CARE workspace
          </h2>
          <p className="text-sm text-stone-400 max-w-lg mx-auto mt-2 leading-relaxed">
            All Data Science journals, canonical concept extractions, and mathematical decay priority queues are securely isolated to your authenticated Firebase UID. Sign in to log journals and view your personalized retention queue.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              id="btn-locked-banner-sign-in"
              type="button"
              onClick={onOpenAuth}
              className="py-2.5 px-6 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-semibold rounded-lg text-sm transition-colors flex items-center gap-2 shadow-sm"
            >
              <KeyRound className="w-4 h-4 text-stone-950" />
              <span>Sign In to Access Workspace</span>
            </button>
          </div>
          <div className="mt-8 pt-6 border-t border-stone-800/80 flex flex-wrap justify-center gap-6 text-xs text-stone-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Zero Cross-User Data Exposure</span>
            </div>
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" />
              <span>Owner-Bound Firestore Collections</span>
            </div>
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-emerald-400" />
              <span>Gemini 3.8 Flash Concept Extraction</span>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Embedded Journal Ingestion Form (when opened or when user clicks Log) */}
          {showJournalForm && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-300">
              <JournalEntryForm
                onSuccess={handleJournalSuccess}
                onCancel={() => setShowJournalForm(false)}
              />
            </div>
          )}

          {/* Metrics Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-stone-900 border border-stone-800 rounded-xl p-4">
              <div className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-1">
                Journals Logged
              </div>
              <div className="text-2xl font-bold text-stone-100 font-mono">
                {profile?.stats?.totalJournalsLogged ?? entries.length}
              </div>
              <div className="text-[11px] text-stone-500 mt-1 flex items-center gap-1">
                <BookOpen className="w-3 h-3 text-emerald-400" />
                <span>Persisted in /journal_entries</span>
              </div>
            </div>

            <div className="bg-stone-900 border border-stone-800 rounded-xl p-4">
              <div className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-1">
                Active Topics
              </div>
              <div className="text-2xl font-bold text-stone-100 font-mono">
                {topics.length}
              </div>
              <div className="text-[11px] text-stone-500 mt-1 flex items-center gap-1">
                <Brain className="w-3 h-3 text-emerald-400" />
                <span>Scoped in /topic_retention_states</span>
              </div>
            </div>

            <div className="bg-stone-900 border border-stone-800 rounded-xl p-4">
              <div className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-1">
                High-Decay Topics
              </div>
              <div className="text-2xl font-bold text-rose-400 font-mono">
                {topics.filter((t) => t.currentPriorityScore >= 50).length}
              </div>
              <div className="text-[11px] text-stone-500 mt-1 flex items-center gap-1">
                <Flame className="w-3 h-3 text-rose-400" />
                <span>Priority(t) &gt; 50.0</span>
              </div>
            </div>

            <div className="bg-stone-900 border border-stone-800 rounded-xl p-4">
              <div className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-1">
                Concept Extraction
              </div>
              <div className="text-2xl font-bold text-emerald-400 font-mono">
                Gemini 3.8
              </div>
              <div className="text-[11px] text-stone-500 mt-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Structured response_schema</span>
              </div>
            </div>
          </div>

          {/* Main Two-Column Workspace Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Recent Journal Entries Feed */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-400" />
                  <h2 className="text-base font-semibold text-stone-100">Work Journal Feed</h2>
                  <span className="text-xs text-stone-500 font-mono">({entries.length})</span>
                </div>

                {!showJournalForm && (
                  <button
                    type="button"
                    onClick={() => setShowJournalForm(true)}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New Entry</span>
                  </button>
                )}
              </div>

              <JournalFeed
                entries={entries}
                isLoading={isLoadingData}
                onSelectConcept={(concept) => setSelectedConcept(concept)}
              />
            </div>

            {/* Right Column: Topic Retention States & Decay Rankings */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-emerald-400" />
                  <h2 className="text-base font-semibold text-stone-100">Retention Decay Queue</h2>
                  <span className="text-xs text-stone-500 font-mono">({topics.length})</span>
                </div>
                <button
                  id="btn-select-topic-modal-trigger"
                  type="button"
                  onClick={() => setShowTopicSelectModal(true)}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Select Topic</span>
                </button>
              </div>

              <TopicRetentionList
                topics={topics}
                isLoading={isLoadingData}
                onInitiateRecall={(topic) => setSelectedTopicForPreSession(topic)}
                onOpenSelectModal={() => setShowTopicSelectModal(true)}
              />

              {/* Heuristic Formula Card */}
              <div className="p-4 bg-stone-900 border border-stone-800 rounded-xl text-xs space-y-2">
                <div className="font-semibold text-stone-200 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                  <span>CARE Priority Formula</span>
                </div>
                <div className="p-2.5 bg-stone-950 rounded-lg font-mono text-[11px] text-emerald-300 border border-stone-850">
                  Priority(t) = [0.40·T(t) + 0.35·A(t) + 0.25·H(t)] × M(t)
                </div>
                <p className="text-[11px] text-stone-400 leading-relaxed">
                  T(t) accounts for elapsed forgetting time; A(t) captures cognitive offload risk from AI assistance;
                  H(t) reflects historical test performance gaps; and M(t) scales by canonical concept importance.
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Slice 3: Select Topic for Recall Modal */}
      <TopicSelectionModal
        isOpen={showTopicSelectModal}
        onClose={() => setShowTopicSelectModal(false)}
        onSelectTopic={(topic) => {
          setShowTopicSelectModal(false);
          setSelectedTopicForPreSession(topic);
        }}
      />

      {/* Slice 3: Topic Pre-Session Card */}
      {selectedTopicForPreSession && (
        <TopicPreSessionCard
          topic={selectedTopicForPreSession}
          onClose={() => setSelectedTopicForPreSession(null)}
          onSessionInitialized={(session, initTopic) => {
            setSelectedTopicForPreSession(null);
            setActiveRecallSession(session);
            setActiveRecallTopic(initTopic || selectedTopicForPreSession);
            fetchData();
          }}
        />
      )}

      {/* Slice 4: Socratic Interview & Scorecard Modal */}
      {activeRecallSession && (
        <SocraticChatModal
          session={activeRecallSession}
          topic={activeRecallTopic}
          onClose={() => {
            setActiveRecallSession(null);
            setActiveRecallTopic(null);
          }}
          onSessionCompleted={async () => {
            await refreshProfile();
            await fetchData();
          }}
        />
      )}

      {/* Selected Concept Inspector Modal */}
      {selectedConcept && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400">
                  {selectedConcept.category}
                </span>
                <h3 className="text-base font-semibold text-stone-100 mt-0.5">
                  {selectedConcept.canonicalName}
                </h3>
              </div>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-stone-800 text-stone-300 border border-stone-700">
                {(selectedConcept.importanceScore * 100).toFixed(0)}% Imp
              </span>
            </div>

            <div className="text-xs text-stone-300 bg-stone-950 p-3 rounded-lg border border-stone-850 leading-relaxed">
              {selectedConcept.contextSummary || 'Extracted canonical concept from engineering work journal.'}
            </div>

            <div className="text-[11px] text-stone-400 font-mono">
              Topic ID: <span className="text-stone-300">{selectedConcept.topicId}</span>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedConcept(null)}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-750 text-stone-200 text-xs font-medium rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Infrastructure & Security Integrity Verification */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Security / Isolation Card */}
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-stone-100">
                  Data Isolation & Security
                </h2>
                <p className="text-xs text-stone-400">
                  User data bound strictly to request.auth.uid across all Firestore collections.
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">
              ENFORCED
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-stone-950 border border-stone-800 rounded-lg flex items-center justify-between">
              <span className="text-stone-400">Target Collections:</span>
              <code className="text-emerald-400 font-mono text-[11px]">
                /users/{'{userId}'}/journal_entries
              </code>
            </div>

            <div className="p-3 bg-stone-950 border border-stone-800 rounded-lg flex items-center justify-between">
              <span className="text-stone-400">Current Session UID:</span>
              <code className="text-stone-200 font-mono text-[11px]">
                {user ? user.uid : 'Local Session'}
              </code>
            </div>

            {user && (
              <div className="pt-1">
                <button
                  id="btn-test-jwt-verification"
                  onClick={handleTestTokenVerification}
                  disabled={isTestingToken}
                  className="w-full py-2 px-3 bg-stone-800 hover:bg-stone-750 text-stone-200 border border-stone-700 rounded-lg font-medium text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTestingToken ? 'animate-spin' : ''}`} />
                  <span>Verify Firebase JWT with Backend (/api/auth/me)</span>
                </button>
              </div>
            )}

            {testError && (
              <div className="p-2.5 bg-red-950/50 border border-red-900 rounded text-red-300 text-[11px]">
                {testError}
              </div>
            )}

            {tokenTestResult && (
              <div className="p-3 bg-stone-950 border border-emerald-900/60 rounded-lg text-emerald-300 text-[11px] font-mono">
                <div className="flex items-center gap-1.5 text-emerald-400 font-semibold mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Token Verified Successfully</span>
                </div>
                <div>Status: {tokenTestResult.status}</div>
                <div>Profile UID: {tokenTestResult.user?.uid}</div>
              </div>
            )}
          </div>
        </div>

        {/* Runtime Matrix Card */}
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-stone-100">
                  Infrastructure & Model Matrix
                </h2>
                <p className="text-xs text-stone-400">
                  Live runtime configurations for CARE.
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-stone-800 text-stone-300 border border-stone-700">
              ACTIVE
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-2.5 bg-stone-950 border border-stone-800 rounded-lg">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                <span className="text-stone-300 font-medium">Cloud Firestore</span>
              </div>
              <span className="font-mono text-[11px] text-stone-400 truncate max-w-[200px]">
                ai-studio-aicuratedrecalls-...
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-stone-950 border border-stone-800 rounded-lg">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-emerald-400" />
                <span className="text-stone-300 font-medium">FastAPI Backend</span>
              </div>
              <span className="font-mono text-[11px] text-stone-400">
                Python 3.10 • Pydantic v2
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-stone-950 border border-stone-800 rounded-lg">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-emerald-400" />
                <span className="text-stone-300 font-medium">Concept Extractor</span>
              </div>
              <span className="font-mono text-[11px] text-stone-400">
                gemini-3.8-flash (google-genai)
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-stone-950 border border-stone-800 rounded-lg">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-emerald-400" />
                <span className="text-stone-300 font-medium">Frontend Framework</span>
              </div>
              <span className="font-mono text-[11px] text-stone-400">
                React 19 • Tailwind CSS
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Slices Roadmap */}
      <div className="bg-stone-900 border border-stone-800 rounded-xl p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-400 mb-4">
          Implementation Progress (<span className="text-emerald-400 font-mono">4/4 Vertical Slices Complete</span>)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Slice 1 */}
          <div className="p-4 bg-emerald-950/20 border border-emerald-800/80 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold">
                Slice 1 • Complete
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <h3 className="font-semibold text-stone-100 text-sm">Auth & Workspace</h3>
            <p className="text-xs text-stone-400 mt-1">
              Firebase Auth, JWT token verification dependency, and user profile management.
            </p>
          </div>

          {/* Slice 2 */}
          <div className="p-4 bg-emerald-950/20 border border-emerald-800/80 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold">
                Slice 2 • Complete
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <h3 className="font-semibold text-stone-100 text-sm">Journal Ingestion</h3>
            <p className="text-xs text-stone-400 mt-1">
              AI reliance level selection (none, prompt, spec, agentic), Gemini 3.8 Flash structured concept extraction.
            </p>
          </div>

          {/* Slice 3 */}
          <div className="p-4 bg-emerald-950/20 border border-emerald-800/80 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold">
                Slice 3 • Complete
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <h3 className="font-semibold text-stone-100 text-sm">Heuristic Priority Engine</h3>
            <p className="text-xs text-stone-400 mt-1">
              Priority(t) = (w1·T + w2·A + w3·H)·M, decay queue sorting, topic selection modal & pre-session cards.
            </p>
          </div>

          {/* Slice 4 */}
          <div className="p-4 bg-emerald-950/20 border border-emerald-800/80 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold">
                Slice 4 • Complete
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <h3 className="font-semibold text-stone-100 text-sm">ADK Peer Interviewer</h3>
            <p className="text-xs text-stone-400 mt-1">
              Multi-turn Socratic recall chat with gemini-3.8-flash, structured scorecard, and priority decay consolidation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
