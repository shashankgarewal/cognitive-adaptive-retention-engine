import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import {
  TopicRetentionState,
  RecallSession,
  JournalEntry,
  ExtractedConcept,
} from '../types';
import { ZeroStateHeader } from '../components/dashboard/ZeroStateHeader';
import { ZeroStateBlueprintPanel } from '../components/dashboard/ZeroStateBlueprintPanel';
import { TopicRetentionList } from '../components/dashboard/TopicRetentionList';
import { TopicPreSessionCard } from '../components/recall/TopicPreSessionCard';
import { TopicSelectionModal } from '../components/recall/TopicSelectionModal';
import { RecallSessionModal } from '../components/recall/RecallSessionModal';
import { JournalEntryForm } from '../components/journal/JournalEntryForm';
import {
  Brain,
  Layers,
  Sparkles,
  AlertTriangle,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Search,
  Filter,
} from 'lucide-react';

export const RetentionHubPage: React.FC = () => {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [topics, setTopics] = useState<TopicRetentionState[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isBlueprintOpen, setIsBlueprintOpen] = useState(true);

  // Socratic recall interactive modal state
  const [showTopicSelectModal, setShowTopicSelectModal] = useState(false);
  const [selectedTopicForPreSession, setSelectedTopicForPreSession] = useState<TopicRetentionState | null>(null);
  const [activeRecallSession, setActiveRecallSession] = useState<RecallSession | null>(null);
  const [activeRecallTopic, setActiveRecallTopic] = useState<TopicRetentionState | null>(null);

  const fetchTopics = useCallback(async () => {
    if (!user) {
      setTopics([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const res = await api.getTopics();
      setTopics(res.topics || []);
    } catch (err) {
      console.warn('Failed to load topics in Retention Hub:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

  const handleStartRecallSession = (topic: TopicRetentionState) => {
    setSelectedTopicForPreSession(topic);
  };

  const handlePreSessionStart = (session: RecallSession) => {
    setActiveRecallTopic(selectedTopicForPreSession);
    setActiveRecallSession(session);
    setSelectedTopicForPreSession(null);
  };

  const handleRecallComplete = async () => {
    setActiveRecallSession(null);
    setActiveRecallTopic(null);
    await refreshProfile();
    await fetchTopics();
  };

  const handleJournalSuccess = async (entry: JournalEntry, concepts: ExtractedConcept[]) => {
    setIsLogModalOpen(false);
    await refreshProfile();
    await fetchTopics();
  };

  const criticalTopicsCount = topics.filter((t) => t.isVulnerableToDecay).length;
  const avgPriority = topics.length > 0
    ? (topics.reduce((acc, t) => acc + t.currentPriorityScore, 0) / topics.length).toFixed(2)
    : '0.00';

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1E293B] font-sans flex flex-col selection:bg-emerald-500/20 selection:text-emerald-900 antialiased">
      {/* 1. Global Navigation Header */}
      <ZeroStateHeader
        onLogClick={() => setIsLogModalOpen(true)}
        onViewLanding={() => navigate('/')}
        onToggleBlueprint={() => setIsBlueprintOpen((prev) => !prev)}
        activeNav="hub"
        onSelectNav={(navId) => {
          if (navId === 'feed') navigate('/feed');
          else if (navId === 'hub') navigate('/hub');
          else if (navId === 'analytics') navigate('/analytics');
          else if (navId === 'spec') navigate('/spec');
        }}
        logStreak={12}
        recallStreak={5}
      />

      {/* 2. Page Header & Stats Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4 w-full">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-[#E5E0D8]">
          <div>
            <div className="flex items-center gap-2 mb-2 font-mono text-xs text-[#505F76] font-semibold tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>SOCRATIC RECALL SCHEDULER</span>
              <span className="text-slate-300">•</span>
              <span>CALCULUS ENGINE ACTIVE</span>
            </div>
            <h1 className="font-serif font-bold text-3xl sm:text-4xl text-[#1E293B] tracking-tight">
              Cognitive Retention Hub
            </h1>
            <p className="font-sans text-xs sm:text-sm text-[#505F76] mt-1.5 max-w-2xl leading-relaxed">
              Mathematical Ebbinghaus decay queues prioritizing topics right before neural pathways fade.
              Trigger 2-minute Socratic dialogues to restore long-term retention.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              id="btn-trigger-recall-drill"
              type="button"
              onClick={() => setShowTopicSelectModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#006948] hover:bg-[#005439] text-white font-medium text-xs shadow-xs transition-colors cursor-pointer"
            >
              <Brain className="w-3.5 h-3.5" />
              <span>Launch Active Recall Drill</span>
            </button>

            <button
              type="button"
              onClick={() => setIsBlueprintOpen((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border transition-all font-mono text-xs font-semibold cursor-pointer shadow-2xs ${
                isBlueprintOpen
                  ? 'bg-[#ECFDF5] border-emerald-300 text-[#006948] hover:bg-emerald-100/60'
                  : 'bg-white border-[#E5E0D8] text-[#505F76] hover:text-[#1E293B] hover:bg-[#FAF8F5]'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-[#006948]" />
              <span>System Blueprint</span>
              <span className="text-[10px] ml-0.5">
                <strong className={isBlueprintOpen ? 'text-[#006948]' : 'text-slate-400'}>
                  [{isBlueprintOpen ? 'ACTIVE' : 'HIDDEN'}]
                </strong>
              </span>
            </button>

            <button
              type="button"
              onClick={() => fetchTopics()}
              className="p-2 rounded-lg bg-white border border-[#E5E0D8] text-[#505F76] hover:text-[#1E293B] hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
              title="Refresh Topic Retention Queue"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#006948]' : ''}`} />
            </button>
          </div>
        </div>

        {/* 3. Metric Indicator Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <div className="bg-white rounded-2xl border border-[#E5E0D8] p-5 shadow-2xs">
            <span className="font-mono text-[11px] font-bold text-[#505F76] uppercase tracking-wider">
              TOTAL KNOWLEDGE NODES
            </span>
            <div className="font-sans font-extrabold text-2xl sm:text-3xl text-[#1E293B] mt-1.5">
              {topics.length} Concepts
            </div>
            <div className="text-xs font-mono text-[#505F76] mt-3 pt-2.5 border-t border-[#F0ECE6]">
              Indexed from work journals
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E5E0D8] p-5 shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] font-bold text-[#505F76] uppercase tracking-wider">
                DECAY VULNERABLE
              </span>
              <span className="px-1.5 py-0.5 rounded bg-[#FFF8ED] border border-amber-300 text-[#8D4B00] font-mono text-[9px] font-bold">
                ATTENTION REQUIRED
              </span>
            </div>
            <div className="font-sans font-extrabold text-2xl sm:text-3xl text-[#8D4B00] mt-1.5">
              {criticalTopicsCount} Critical
            </div>
            <div className="text-xs font-mono text-[#505F76] mt-3 pt-2.5 border-t border-[#F0ECE6]">
              Halflife decay threshold reached
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E5E0D8] p-5 shadow-2xs">
            <span className="font-mono text-[11px] font-bold text-[#505F76] uppercase tracking-wider">
              MEAN PRIORITY(T) SCORE
            </span>
            <div className="font-sans font-extrabold text-2xl sm:text-3xl text-[#006948] mt-1.5">
              {avgPriority} / 1.00
            </div>
            <div className="text-xs font-mono text-[#505F76] mt-3 pt-2.5 border-t border-[#F0ECE6]">
              Weighted: 0.40·T + 0.35·A + 0.25·H
            </div>
          </div>
        </div>
      </div>

      {/* 4. Main 2-Column Content Layout (Dynamic Collapsible Blueprint Panel) */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* Left Column: Topic Retention Priority List */}
        <section
          aria-label="Retention Decay Queue"
          className={`space-y-6 transition-all duration-300 ${
            isBlueprintOpen ? 'lg:col-span-8' : 'lg:col-span-12'
          }`}
        >
          {/* Pre-Session Diagnostic Card when a topic is selected */}
          {selectedTopicForPreSession && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-200 mb-6">
              <TopicPreSessionCard
                topic={selectedTopicForPreSession}
                onStartSession={handlePreSessionStart}
                onCancel={() => setSelectedTopicForPreSession(null)}
              />
            </div>
          )}

          {/* Calibrated Topic Retention List */}
          <TopicRetentionList
            topics={topics}
            isLoading={isLoading}
            onInitiateRecall={handleStartRecallSession}
            onOpenSelectModal={() => setShowTopicSelectModal(true)}
          />
        </section>

        {/* Right Column: Architectural Context Blueprint Panel (Collapsible) */}
        {isBlueprintOpen && (
          <aside
            aria-label="System Blueprint Panel"
            className="lg:col-span-4 w-full animate-in fade-in slide-in-from-right-4 duration-200 sticky top-20"
          >
            <ZeroStateBlueprintPanel onClose={() => setIsBlueprintOpen(false)} />
          </aside>
        )}
      </main>

      {/* 5. Footer */}
      <footer className="border-t border-[#E5E0D8] bg-white py-6 px-4 sm:px-6 lg:px-8 text-xs text-[#505F76] mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-center sm:text-left">
            <span className="font-serif font-bold text-[#1E293B]">
              CARE Cognitive &amp; Adaptive Retention Engine
            </span>
            <span className="hidden sm:inline text-slate-300">•</span>
            <span>Mathematical Ebbinghaus halflife preservation for software engineers.</span>
          </div>
          <div className="flex items-center gap-3 font-mono text-[11px]">
            <span className="text-[#006948] font-bold">Priority Calculus v2.4</span>
            <span className="text-slate-400">&copy; 2025 CARE Engine</span>
          </div>
        </div>
      </footer>

      {/* Socratic Drill Modals */}
      {showTopicSelectModal && (
        <TopicSelectionModal
          topics={topics}
          onSelectTopic={(topic) => {
            setShowTopicSelectModal(false);
            setSelectedTopicForPreSession(topic);
          }}
          onClose={() => setShowTopicSelectModal(false)}
        />
      )}

      {activeRecallSession && activeRecallTopic && (
        <RecallSessionModal
          session={activeRecallSession}
          topic={activeRecallTopic}
          onComplete={handleRecallComplete}
          onClose={() => {
            setActiveRecallSession(null);
            setActiveRecallTopic(null);
          }}
        />
      )}

      {/* Journal Entry Form Modal */}
      {isLogModalOpen && (
        <JournalEntryForm
          onClose={() => setIsLogModalOpen(false)}
          onSuccess={handleJournalSuccess}
        />
      )}
    </div>
  );
};
