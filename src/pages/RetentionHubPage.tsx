import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import {
  TopicRetentionState,
  RecallSession,
  JournalEntry,
  ExtractedConcept,
} from '../types';
import { getDescriptiveFragileSubconcept } from '../lib/retentionFragility';
import { ZeroStateHeader } from '../components/dashboard/ZeroStateHeader';
import { ZeroStateBlueprintPanel } from '../components/dashboard/ZeroStateBlueprintPanel';
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
  Zap,
  Activity,
  Table,
  LayoutGrid,
  Check,
  Flame,
  Plus,
} from 'lucide-react';

interface ConceptCardData {
  id: string;
  title: string;
  category: string;
  priorityScore: number;
  retentionScore: number;
  statusLabel: string;
  statusColor: 'critical' | 'moderate' | 'stable';
  nuanceGapTitle: string;
  nuanceGapDetail: string;
  fragileSubconcept?: string;
  cognitiveLossRisk?: string;
  aiExposure: string;
  aiExposureRaw: number;
  lastExposure: string;
  durationEst: string;
  actionLabel: string;
}

const DEFAULT_CONCEPT_CARDS: ConceptCardData[] = [
  {
    id: 'self-attention',
    title: 'Self-Attention Mechanism',
    category: 'DEEP LEARNING',
    priorityScore: 49.0,
    retentionScore: 49.0,
    statusLabel: 'HIGHEST PRIORITY',
    statusColor: 'critical',
    nuanceGapTitle: '⚠️ FRAGILE SUBCONCEPTS IDENTIFIED',
    fragileSubconcept: 'Softmax scaling factor (1/√d_k) variance normalization & Q,K,V projection dimension bounds.',
    cognitiveLossRisk: 'Losing first-principles intuition for tensor broadcasting invariants, attention normalization, and numerical underflow prevention when delegating code to Copilot.',
    nuanceGapDetail: 'Softmax scaling factor (1/√d_k) variance & Q,K,V projection dimension bounds. Risk: Losing first-principles intuition for tensor broadcasting invariants and numerical underflow safeguards.',
    aiExposure: '85% Copilot / Claude',
    aiExposureRaw: 85,
    lastExposure: '2 days ago (3 sessions)',
    durationEst: 'Est: 6 mins Socratic',
    actionLabel: 'Start Peer Recall Session',
  },
  {
    id: 'postgres-jsonb',
    title: 'Postgres JSONB GIN Indexing',
    category: 'DATA INFRASTRUCTURE',
    priorityScore: 62.4,
    retentionScore: 62.4,
    statusLabel: 'MODERATE DECAY',
    statusColor: 'moderate',
    nuanceGapTitle: 'SUBCONCEPT NUANCE GAP',
    fragileSubconcept: 'Distinction between jsonb_ops and jsonb_path_ops inverted index storage trade-offs.',
    cognitiveLossRisk: 'Overlooking index amplification bloat and queries silently falling back to full table sequential heap scans.',
    nuanceGapDetail: 'Distinction between jsonb_ops and jsonb_path_ops inverted index storage trade-offs. Risk: Overlooking index amplification bloat and queries falling back to sequential scans.',
    aiExposure: '62% Copilot',
    aiExposureRaw: 62,
    lastExposure: '4 days ago (2 sessions)',
    durationEst: 'Est: 4 mins Socratic',
    actionLabel: 'Diagnose Nuance',
  },
  {
    id: 'cache-invalidation',
    title: 'Distributed Cache Invalidation',
    category: 'SYSTEMS ARCHITECTURE',
    priorityScore: 84.2,
    retentionScore: 84.2,
    statusLabel: 'STABLE COGNITIVE GRASP',
    statusColor: 'stable',
    nuanceGapTitle: '✓ REINFORCED MENTAL MODEL',
    fragileSubconcept: 'Write-Through vs Cache-Aside lease token concurrency & TTL dogpiling locks.',
    cognitiveLossRisk: 'Losing edge-case intuition for cache stampede thundering herds and split-brain inconsistency during network partitions.',
    nuanceGapDetail: 'Strong retention of Write-Through vs. Cache-Aside lease token concurrency & TTL dogpiling locks. Low cognitive decay risk.',
    aiExposure: '28% Manual Code',
    aiExposureRaw: 28,
    lastExposure: 'Yesterday (5 sessions)',
    durationEst: 'Est: 3 mins Socratic',
    actionLabel: 'Quick 3-Min Warmup',
  },
  {
    id: 'flash-attention',
    title: 'FlashAttention Memory Hierarchy',
    category: 'GPU SYSTEMS',
    priorityScore: 54.1,
    retentionScore: 54.1,
    statusLabel: 'DECAY IMMINENT',
    statusColor: 'critical',
    nuanceGapTitle: 'MEMORY BOUNDARY DEGRADATION',
    fragileSubconcept: 'SRAM tiling block size computation, IO-awareness roofline bounds, and kernel fusion pass rationale.',
    cognitiveLossRisk: 'Forgetting GPU memory hierarchy bottlenecks, memory-bound vs compute-bound roofline limits, and HBM memory transfer overhead under automated kernel generation.',
    nuanceGapDetail: 'SRAM tiling block size computation and IO-awareness kernel fusion rationale. Risk: Forgetting GPU memory hierarchy bottlenecks and HBM-to-SRAM roofline limits.',
    aiExposure: '78% Claude Opus',
    aiExposureRaw: 78,
    lastExposure: '5 days ago (1 session)',
    durationEst: 'Est: 5 mins Socratic',
    actionLabel: 'Start Peer Recall Session',
  },
];

export const RetentionHubPage: React.FC = () => {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [topics, setTopics] = useState<TopicRetentionState[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBlueprintOpen, setIsBlueprintOpen] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<'priority' | 'reliance' | 'recency'>('priority');
  const [viewMode, setViewMode] = useState<'grid' | 'matrix'>('grid');
  const [dockInput, setDockInput] = useState('');

  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

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

  const handleStartRecallSession = (conceptTitle: string, score: number) => {
    // Check if topic exists in state
    const existing = topics.find((t) => (t.canonicalName || '').toLowerCase() === conceptTitle.toLowerCase());
    if (existing) {
      setSelectedTopicForPreSession(existing);
    } else {
      // Mock topic object to launch instant recall
      const syntheticTopic: TopicRetentionState = {
        topicId: `synth-${Date.now()}`,
        userId: user?.uid || 'guest',
        canonicalName: conceptTitle,
        category: 'Data Science & Systems',
        firstLoggedAt: new Date().toISOString(),
        lastLoggedAt: new Date().toISOString(),
        journalOccurrences: 4,
        recentAiAssistanceSignals: score < 60 ? ['agentic'] : ['prompt_driven'],
        effectiveAiAssistanceWeight: (100 - score) / 100,
        recallHistory: [],
        lastRecallScore: score,
        currentPriorityScore: (100 - score) / 100,
        decayFactor: score < 60 ? 0.72 : 0.28,
        explanationReason: 'High AI assistance exposure detected in recent code diff snapshots.',
      };
      setSelectedTopicForPreSession(syntheticTopic);
    }
  };

  const handlePreSessionStart = (session: RecallSession) => {
    setActiveRecallTopic(selectedTopicForPreSession);
    setActiveRecallSession(session);
    setSelectedTopicForPreSession(null);
  };

  const handleRecallComplete = async () => {
    setActiveRecallSession(null);
    setActiveRecallTopic(null);
    showToast('Recall session recorded! Retention scores calibrated.');
    await refreshProfile();
    await fetchTopics();
  };

  // Filter and sort concept cards strictly based on authenticated user's database topics
  const filteredCards = useMemo(() => {
    let list: ConceptCardData[] = [];

    // Map strictly from user's authentic Firestore topics
    if (topics.length > 0) {
      list = topics.map((t) => {
        const score = t.lastRecallScore ? Math.round(t.lastRecallScore) : Math.max(10, Math.round((1 - t.currentPriorityScore) * 100));
        const isCritical = score < 60;
        const isModerate = score >= 60 && score < 75;

        // Generate descriptive fragile subconcept analysis
        const fragility = getDescriptiveFragileSubconcept(
          t.canonicalName,
          t.category,
          t.effectiveAiAssistanceWeight,
          score,
          t.fragileSubconcept || t.explanationReason
        );

        return {
          id: t.topicId,
          title: t.canonicalName,
          category: (t.category || 'DATA SCIENCE').toUpperCase(),
          priorityScore: Math.round(t.currentPriorityScore * 100),
          retentionScore: score,
          statusLabel: isCritical ? 'DECAY IMMINENT' : isModerate ? 'MODERATE DECAY' : 'STABLE COGNITIVE GRASP',
          statusColor: isCritical ? 'critical' : isModerate ? 'moderate' : 'stable',
          nuanceGapTitle: isCritical ? '⚠️ FRAGILE SUBCONCEPTS' : isModerate ? 'SUBCONCEPT NUANCE GAP' : '✓ REINFORCED MENTAL MODEL',
          nuanceGapDetail: fragility.fullDescription,
          fragileSubconcept: fragility.fragileSubconcept,
          cognitiveLossRisk: fragility.cognitiveLossRisk,
          aiExposure: `${Math.round(t.effectiveAiAssistanceWeight * 100)}% AI Assistance`,
          aiExposureRaw: Math.round(t.effectiveAiAssistanceWeight * 100),
          lastExposure: t.lastLoggedAt ? new Date(t.lastLoggedAt).toLocaleDateString() : 'Recently active',
          durationEst: 'Est: 4 mins Socratic',
          actionLabel: 'Start Peer Recall Session',
        };
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q) ||
          c.nuanceGapDetail.toLowerCase().includes(q)
      );
    }

    if (sortOption === 'priority') {
      list.sort((a, b) => a.retentionScore - b.retentionScore); // Lowest retention score = highest decay priority
    } else if (sortOption === 'reliance') {
      list.sort((a, b) => b.aiExposureRaw - a.aiExposureRaw);
    } else {
      list.reverse();
    }

    return list;
  }, [topics, searchQuery, sortOption]);

  const handleDockLaunch = () => {
    const target = dockInput.trim() || 'Self-Attention Mechanism';
    handleStartRecallSession(target, 49.0);
    setDockInput('');
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#111C2D] font-sans flex flex-col selection:bg-emerald-500/20 selection:text-emerald-900 antialiased pb-28">
      
      {/* 1. Global Navigation Header */}
      <header id="global-header" className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E5E0D8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Brand & Streaks */}
          <div className="flex items-center gap-4 sm:gap-6">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex items-center gap-2.5 group cursor-pointer text-left"
              title="CARE - Adaptive Retention"
            >
              <div className="w-8 h-8 rounded-lg bg-[#006948] text-white flex items-center justify-center font-serif text-base font-bold shadow-xs group-hover:bg-[#005439] transition-colors">
                C
              </div>
              <div>
                <div className="font-serif font-bold text-sm tracking-tight text-[#111C2D] group-hover:text-[#006948] transition-colors flex items-center gap-1.5">
                  <span>CARE</span>
                  <span className="text-slate-300 font-sans font-light">|</span>
                  <span className="text-xs font-sans font-semibold text-slate-700">Adaptive Retention</span>
                </div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-slate-400 font-medium">
                  Knowledge Retention Hub
                </div>
              </div>
            </button>

            {/* Streaks Telemetry */}
            <div className="hidden md:flex items-center gap-2 pl-3 border-l border-[#E5E0D8]">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FFF8ED] border border-amber-300 text-[#8D4B00] text-xs font-mono font-medium">
                <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>Log Streak: <strong>12 Days</strong></span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F0F3FF] border border-[#CCD8FF] text-[#111C2D] text-xs font-mono font-medium">
                <Brain className="w-3.5 h-3.5 text-blue-600" />
                <span>Recall Streak: <strong>5 Days</strong></span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-1 p-1 bg-[#FAF8F5] rounded-full border border-[#E5E0D8] text-xs font-medium">
            <button
              type="button"
              onClick={() => navigate('/feed')}
              className="px-3.5 py-1.5 rounded-full text-[#64748B] hover:text-[#111C2D] hover:bg-white/80 transition-all cursor-pointer"
            >
              Work Journal Feed
            </button>
            <button
              type="button"
              onClick={() => navigate('/journal/editor')}
              className="px-3.5 py-1.5 rounded-full text-[#64748B] hover:text-[#111C2D] hover:bg-white/80 transition-all cursor-pointer"
            >
              Journal Writer
            </button>
            <button
              type="button"
              onClick={() => navigate('/hub')}
              className="px-3.5 py-1.5 rounded-full bg-[#006948] text-white font-semibold shadow-xs cursor-pointer"
            >
              Retention Hub
            </button>
            <button
              type="button"
              onClick={() => navigate('/analytics')}
              className="px-3.5 py-1.5 rounded-full text-[#64748B] hover:text-[#111C2D] hover:bg-white/80 transition-all cursor-pointer"
            >
              Analytics &amp; Decay
            </button>
            <button
              type="button"
              onClick={() => navigate('/spec')}
              className="px-3.5 py-1.5 rounded-full text-[#64748B] hover:text-[#111C2D] hover:bg-white/80 transition-all cursor-pointer"
            >
              Architecture Spec
            </button>
          </nav>

          {/* Right Controls & CTA */}
          <div className="flex items-center gap-3">
            <button
              id="btn-log-work-journal"
              type="button"
              onClick={() => navigate('/journal/editor')}
              className="py-1.5 px-3.5 rounded-lg bg-[#006948] hover:bg-[#005439] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span className="whitespace-nowrap font-medium">+ Log Work Journal</span>
            </button>

            <button
              type="button"
              onClick={() => setIsBlueprintOpen((prev) => !prev)}
              className={`p-2 rounded-lg border transition-all cursor-pointer ${
                isBlueprintOpen
                  ? 'bg-emerald-50 border-emerald-300 text-[#006948]'
                  : 'bg-white border-[#E5E0D8] text-slate-500 hover:text-slate-800'
              }`}
              title="Toggle System Architecture Blueprint"
            >
              <Layers className="w-4 h-4" />
            </button>

            {/* Profile Avatar */}
            <div className="flex items-center gap-2 pl-2 border-l border-[#E5E0D8]">
              <div
                className="w-8 h-8 rounded-full bg-[#E7EEFF] text-[#006948] font-mono font-bold text-xs flex items-center justify-center border border-[#CCD8FF]"
                title={user?.email || 'Data Science Engineer'}
              >
                {user?.displayName
                  ? user.displayName.slice(0, 2).toUpperCase()
                  : user?.email
                  ? user.email.slice(0, 2).toUpperCase()
                  : 'DS'}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Engine Status Ribbon */}
      <aside id="status-ribbon" className="bg-white border-b border-[#E5E0D8] py-2 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 font-mono text-[11px] text-[#3D4A42]">
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold text-[#006948]">ENGINE MODE:</span>
            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200">
              ACTIVE ADAPTIVE INTERVENTION
            </span>
          </div>

          <div className="flex items-center gap-4 sm:gap-6 font-mono text-[11px] text-[#64748B]">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Cognitive Debt Score:</span>
              <span className="font-bold text-[#8D4B00] px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200">
                31.4%
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5">
              <span className="text-slate-400">Target Decay Threshold:</span>
              <span className="font-bold text-[#111C2D]">&le; 60.0 R-pts</span>
            </div>
            <div className="flex items-center gap-1 text-[#006948] font-semibold">
              <RefreshCw className="w-3.5 h-3.5" />
              <span>CALCULUS v2.4</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Blueprint Drawer Panel if open */}
      {isBlueprintOpen && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 w-full animate-in fade-in slide-in-from-top-3 duration-200">
          <ZeroStateBlueprintPanel onClose={() => setIsBlueprintOpen(false)} />
        </div>
      )}

      {/* 3. Hero Overview Bento Grid (2 Columns: 8/4 Split) */}
      <section id="hero-overview" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Hero Card (Left: 8 cols) */}
          <div className="lg:col-span-8 bg-white rounded-xl border border-[#E5E0D8] p-6 sm:p-8 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center gap-2 mb-2 font-mono text-xs text-[#64748B] font-semibold tracking-wider">
                <span className="w-2 h-2 rounded-full bg-[#006948] animate-pulse" />
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#006948]">CONTINUOUS KNOWLEDGE MASTERY</span>
                <span className="text-slate-300">•</span>
                <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400">EBBINGHAUS COUNTERMEASURE</span>
              </div>

              <h1 className="font-serif font-bold text-3xl sm:text-4xl text-[#111C2D] tracking-tight">
                Knowledge Retention Hub
              </h1>

              <p className="font-sans text-sm sm:text-base text-[#3D4A42] mt-2 max-w-2xl leading-relaxed">
                Full-spectrum telemetry counteracting neural knowledge decay in AI-assisted workflows. High-assistance code sessions accelerate forgetting; CARE schedules Socratic dialectic checks right before stability cliffs.
              </p>
            </div>

            {/* 3 Key Metric Nodes */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-[#F0ECE6]">
              <div className="p-3.5 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8]">
                <div className="font-mono text-[10px] uppercase tracking-wider text-[#64748B]">Active Tracks</div>
                <div className="font-sans font-extrabold text-2xl text-[#111C2D] mt-1">
                  {topics.length} {topics.length === 1 ? 'Concept' : 'Concepts'}
                </div>
                <div className="text-[11px] font-mono text-[#006948] font-medium mt-1">
                  {topics.filter((t) => (t.lastRecallScore ? t.lastRecallScore >= 60 : t.currentPriorityScore < 0.5)).length} in safe halflife
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-[#FFF8ED] border border-amber-300">
                <div className="font-mono text-[10px] uppercase tracking-wider text-[#8D4B00]">High Decay Vectors</div>
                <div className="font-sans font-extrabold text-2xl text-[#8D4B00] mt-1">
                  {topics.filter((t) => (t.lastRecallScore ? t.lastRecallScore < 60 : t.currentPriorityScore >= 0.5)).length} Critical
                </div>
                <div className="text-[11px] font-mono text-amber-800 font-medium mt-1">
                  {topics.filter((t) => (t.lastRecallScore ? t.lastRecallScore < 60 : t.currentPriorityScore >= 0.5)).length > 0 ? 'Intervention required' : 'Cognitive load stable'}
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-[#ECFDF5] border border-emerald-200">
                <div className="font-mono text-[10px] uppercase tracking-wider text-[#006948]">Recall Accuracy</div>
                <div className="font-sans font-extrabold text-2xl text-[#006948] mt-1">
                  {topics.length > 0
                    ? `${Math.round(topics.reduce((acc, t) => acc + (t.lastRecallScore || Math.round((1 - t.currentPriorityScore) * 100)), 0) / topics.length)}%`
                    : '100%'}
                </div>
                <div className="text-[11px] font-mono text-emerald-800 font-medium mt-1">Authenticated Firestore Engine</div>
              </div>
            </div>
          </div>

          {/* Decay Curve Snapshot (Right: 4 cols) */}
          <div className="lg:col-span-4 bg-white rounded-xl border border-[#E5E0D8] p-6 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#F0ECE6]">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-wider text-[#64748B]">Decay Curve Snapshot</div>
                  <h2 className="font-serif font-bold text-base text-[#111C2D] mt-0.5">Ebbinghaus Retention vs. AI</h2>
                </div>
                <span className="px-2 py-0.5 rounded bg-[#F0F3FF] border border-[#CCD8FF] text-[10px] font-mono font-bold text-[#111C2D]">
                  R(t)=e^(-t/S)
                </span>
              </div>

              {/* Embedded SVG Line Graph */}
              <div className="py-4">
                <div className="relative w-full h-36">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 280 120" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="curveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#006948" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#006948" stopOpacity="0.0" />
                      </linearGradient>
                      <linearGradient id="decayArea" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#EF4444" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#EF4444" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Gridlines */}
                    <line x1="0" y1="30" x2="280" y2="30" stroke="#E5E0D8" strokeDasharray="3,3" strokeWidth="1" />
                    <line x1="0" y1="70" x2="280" y2="70" stroke="#E5E0D8" strokeDasharray="3,3" strokeWidth="1" />
                    
                    {/* Critical Threshold Line */}
                    <line x1="0" y1="75" x2="280" y2="75" stroke="#D97706" strokeWidth="1.5" strokeDasharray="4,2" />
                    <text x="200" y="70" fill="#D97706" fontSize="8" fontFamily="JetBrains Mono" fontWeight="bold">
                      CLIFF 60 R-pts
                    </text>

                    {/* High AI Assistance Decay (Steep drop) */}
                    <path d="M 10 15 Q 60 40 100 85 T 270 110 L 270 120 L 10 120 Z" fill="url(#decayArea)" />
                    <path d="M 10 15 Q 60 40 100 85 T 270 110" fill="none" stroke="#DC2626" strokeWidth="2" />

                    {/* CARE Interleaved Socratic Inoculation (Stepped recovery) */}
                    <path d="M 10 15 Q 50 35 70 50 L 75 22 Q 130 38 150 54 L 155 25 Q 210 35 270 42" fill="none" stroke="#006948" strokeWidth="2.5" />

                    {/* Intervention Pulse Markers */}
                    <circle cx="75" cy="22" r="3.5" fill="#006948" stroke="#FFFFFF" strokeWidth="1.5" />
                    <circle cx="155" cy="25" r="3.5" fill="#006948" stroke="#FFFFFF" strokeWidth="1.5" />
                  </svg>
                </div>

                {/* Legend */}
                <div className="flex items-center justify-between text-[10px] font-mono text-[#64748B] mt-2 pt-2 border-t border-[#F0ECE6]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-1 bg-[#DC2626] rounded-full inline-block" />
                    <span>Copilot High Exposure</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-1 bg-[#006948] rounded-full inline-block" />
                    <span>CARE Interleaved</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 bg-[#FAF8F5] rounded-lg border border-[#E5E0D8] flex items-center justify-between mt-2">
              <div className="text-xs font-mono">
                <span className="text-slate-400">Scheduled Interventions:</span>
                <strong className="text-[#006948] ml-1">3 Available</strong>
              </div>
              <button
                type="button"
                onClick={() => setShowTopicSelectModal(true)}
                className="text-xs font-mono font-bold text-[#006948] hover:underline cursor-pointer"
              >
                Run Socratic Drill &rarr;
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* Pre-Session Diagnostic Card when selected */}
      {selectedTopicForPreSession && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 w-full animate-in fade-in slide-in-from-top-3 duration-200">
          <TopicPreSessionCard
            topic={selectedTopicForPreSession}
            onStartSession={handlePreSessionStart}
            onCancel={() => setSelectedTopicForPreSession(null)}
          />
        </section>
      )}

      {/* 4. Search & Filter Toolbar */}
      <section id="filter-toolbar" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 w-full">
        <div className="bg-white rounded-xl border border-[#E5E0D8] p-3 flex flex-col md:flex-row items-center justify-between gap-3 shadow-xs">
          
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              id="topic-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter concepts (e.g., Attention, Postgres, Raft)..."
              className="w-full pl-9 pr-4 py-1.5 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5] text-xs text-[#111C2D] placeholder-slate-400 focus:outline-none focus:border-[#006948] focus:bg-white transition-all font-sans"
            />
          </div>

          {/* Sort Pills & Layout Toggles */}
          <div className="flex items-center justify-between w-full md:w-auto gap-4">
            
            {/* Sort Pills */}
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400 hidden sm:inline">Sort:</span>
              <button
                type="button"
                onClick={() => setSortOption('priority')}
                className={`px-2.5 py-1 rounded-md text-xs font-mono font-medium transition-all cursor-pointer ${
                  sortOption === 'priority'
                    ? 'bg-[#006948] text-white shadow-xs'
                    : 'text-[#64748B] hover:bg-slate-100 hover:text-[#111C2D]'
                }`}
              >
                Priority (Decay)
              </button>
              <button
                type="button"
                onClick={() => setSortOption('reliance')}
                className={`px-2.5 py-1 rounded-md text-xs font-mono font-medium transition-all cursor-pointer ${
                  sortOption === 'reliance'
                    ? 'bg-[#006948] text-white shadow-xs'
                    : 'text-[#64748B] hover:bg-slate-100 hover:text-[#111C2D]'
                }`}
              >
                AI Reliance
              </button>
              <button
                type="button"
                onClick={() => setSortOption('recency')}
                className={`px-2.5 py-1 rounded-md text-xs font-mono font-medium transition-all cursor-pointer ${
                  sortOption === 'recency'
                    ? 'bg-[#006948] text-white shadow-xs'
                    : 'text-[#64748B] hover:bg-slate-100 hover:text-[#111C2D]'
                }`}
              >
                Recency
              </button>
            </div>

            {/* Grid vs Matrix View Toggles */}
            <div className="flex items-center p-0.5 bg-[#FAF8F5] rounded-lg border border-[#E5E0D8]">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded cursor-pointer ${
                  viewMode === 'grid' ? 'bg-white text-[#111C2D] shadow-xs' : 'text-slate-400 hover:text-[#111C2D]'
                }`}
                title="2-Column Detailed Card Grid"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('matrix')}
                className={`p-1.5 rounded cursor-pointer ${
                  viewMode === 'matrix' ? 'bg-white text-[#111C2D] shadow-xs' : 'text-slate-400 hover:text-[#111C2D]'
                }`}
                title="Compact Diagnostic Matrix"
              >
                <Table className="w-4 h-4" />
              </button>
            </div>

          </div>

        </div>
      </section>

      {/* 5. Priority Concept Retention Cards Grid (2-Column Desktop Grid) */}
      <main id="retention-grid-container" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 w-full">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="font-serif font-bold text-lg text-[#111C2D]">Priority Retention Queue</h3>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[#64748B] text-xs font-mono font-semibold">
              {filteredCards.length} Concepts
            </span>
          </div>
          <span className="text-xs font-mono text-[#64748B]">Dynamic weight: 0.40·T + 0.35·A + 0.25·H</span>
        </div>

        {filteredCards.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-[#E5E0D8] p-8 sm:p-12 text-center my-4 col-span-full shadow-xs">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-[#006948] flex items-center justify-center mx-auto mb-4 border border-emerald-200">
              <Brain className="w-6 h-6" />
            </div>
            <h4 className="font-serif font-bold text-xl text-[#111C2D]">No Topics in Retention Matrix</h4>
            <p className="font-sans text-sm text-[#64748B] max-w-md mx-auto mt-2 leading-relaxed">
              Your personal Firestore database does not have any tracked concept entries yet. Log a technical work journal to begin calculating forgetting curves and scheduling dialectic recall drills.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
              <button
                type="button"
                onClick={() => navigate('/journal/editor')}
                className="px-4 py-2 rounded-lg bg-[#006948] hover:bg-[#005439] text-white font-medium text-xs font-mono shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Log First Work Journal
              </button>
            </div>
          </div>
        ) : (
          <div className={`grid gap-5 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
            {filteredCards.map((card) => {
              const isCritical = card.statusColor === 'critical';
              const isModerate = card.statusColor === 'moderate';

              // SVG circular gauge math: r=19 -> perimeter = 2*pi*19 = 119.38
              const perimeter = 119.38;
              const offset = perimeter - (card.retentionScore / 100) * perimeter;

              return (
                <article
                  key={card.id}
                  className={`concept-card bg-white rounded-xl border border-[#E5E0D8] p-5 flex flex-col justify-between shadow-xs hover:border-slate-300 transition-all group ${
                    isCritical
                      ? 'border-t-4 border-t-amber-500'
                      : isModerate
                      ? 'border-t-4 border-t-amber-400'
                      : 'border-t-4 border-t-emerald-500'
                  }`}
                >
                  <div>
                    {/* Top Row: Category + Gauge Score */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] uppercase tracking-wider text-[#64748B] font-bold">
                            {card.category}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                              isCritical
                                ? 'bg-[#FFF8ED] border border-amber-300 text-[#8D4B00]'
                                : isModerate
                                ? 'bg-amber-50 border border-amber-200 text-amber-800'
                                : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                            }`}
                          >
                            {card.statusLabel}
                          </span>
                        </div>
                        <h4 className="font-serif font-bold text-xl text-[#111C2D] mt-1 group-hover:text-[#006948] transition-colors">
                          {card.title}
                        </h4>
                      </div>

                      {/* Circular Gauge */}
                      <div className="relative w-12 h-12 shrink-0 flex items-center justify-center">
                        <svg className="w-12 h-12 transform -rotate-90">
                          <circle cx="24" cy="24" r="19" stroke="#F1F5F9" strokeWidth="4" fill="transparent" />
                          <circle
                            cx="24"
                            cy="24"
                            r="19"
                            stroke={isCritical ? '#D97706' : isModerate ? '#D97706' : '#006948'}
                            strokeWidth="4"
                            strokeDasharray={perimeter}
                            strokeDashoffset={offset}
                            strokeLinecap="round"
                            fill="transparent"
                          />
                        </svg>
                        <div
                          className={`absolute font-mono text-[11px] font-bold ${
                            isCritical || isModerate ? 'text-[#8D4B00]' : 'text-[#006948]'
                          }`}
                        >
                          {card.retentionScore.toFixed(1)}
                        </div>
                      </div>
                    </div>

                    {/* Nuance gap alert */}
                    <div
                      className={`mt-3 p-3 rounded-lg border text-xs font-sans leading-relaxed ${
                        isCritical
                          ? 'bg-[#FFF8ED] border-amber-200 text-amber-950'
                          : isModerate
                          ? 'bg-[#FAF8F5] border-[#E5E0D8] text-[#243028]'
                          : 'bg-[#ECFDF5] border-emerald-200 text-emerald-950'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold mb-1.5">
                        <AlertTriangle className={`w-3.5 h-3.5 shrink-0 ${isCritical ? 'text-amber-600' : isModerate ? 'text-amber-600' : 'text-emerald-600'}`} />
                        <span>{card.nuanceGapTitle}</span>
                      </div>
                      {card.fragileSubconcept && card.cognitiveLossRisk ? (
                        <div className="space-y-1.5">
                          <p>
                            <span className="font-semibold font-mono text-[11px] uppercase tracking-wider text-stone-700">Fragile: </span>
                            <span>{card.fragileSubconcept}</span>
                          </p>
                          <p>
                            <span className="font-semibold font-mono text-[11px] uppercase tracking-wider text-rose-800">Risk: </span>
                            <span>{card.cognitiveLossRisk}</span>
                          </p>
                        </div>
                      ) : (
                        <p>{card.nuanceGapDetail}</p>
                      )}
                    </div>

                    {/* Telemetry Specs */}
                    <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-[#F0ECE6] text-xs font-mono text-[#3D4A42]">
                      <div>
                        <span className="text-slate-400 block text-[10px]">AI SYNTHESIS EXPOSURE</span>
                        <span className={`font-bold ${card.aiExposureRaw > 60 ? 'text-rose-700' : 'text-emerald-700'}`}>
                          {card.aiExposure}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">LAST EXPOSURE</span>
                        <span className="font-semibold text-[#111C2D]">{card.lastExposure}</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer / Action */}
                  <div className="mt-5 pt-3 border-t border-[#E5E0D8] flex items-center justify-between">
                    <span className="text-[11px] font-mono text-[#64748B]">{card.durationEst}</span>
                    <button
                      type="button"
                      onClick={() => handleStartRecallSession(card.title, card.retentionScore)}
                      className="py-1.5 px-3.5 rounded-lg bg-[#006948] hover:bg-[#005439] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <span>{card.actionLabel}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {/* 6. Cognitive Debt Diagnostic Ledger Table */}
      <section id="ledger-table-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="bg-white rounded-xl border border-[#E5E0D8] shadow-xs overflow-hidden">
          
          {/* Table Header */}
          <div className="p-5 border-b border-[#E5E0D8] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-wider text-[#64748B] font-bold">
                COGNITIVE AUDIT TRAIL
              </div>
              <h3 className="font-serif font-bold text-xl text-[#111C2D] mt-0.5">
                Cognitive Debt Diagnostic Ledger
              </h3>
            </div>
            <div className="flex items-center gap-2 font-mono text-xs text-[#64748B]">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
              <span>User-Isolated Firestore Synced</span>
            </div>
          </div>

          {/* Responsive Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#111C2D] font-sans">
              <thead className="bg-[#FAF8F5] border-b border-[#E5E0D8] font-mono text-[11px] text-[#64748B] uppercase">
                <tr>
                  <th className="py-3 px-4 font-bold">Tracked Domain Concept</th>
                  <th className="py-3 px-4 font-bold">Human Autonomy %</th>
                  <th className="py-3 px-4 font-bold">Retention Score</th>
                  <th className="py-3 px-4 font-bold">Dialectic Check Status</th>
                  <th className="py-3 px-4 font-bold">Intervention Strategy</th>
                  <th className="py-3 px-4 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0ECE6]">
                {filteredCards.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#64748B] font-mono text-xs">
                      No concept ledger entries recorded for this authenticated account.
                    </td>
                  </tr>
                ) : (
                  filteredCards.map((c) => {
                    const isCrit = c.statusColor === 'critical';
                    const isMod = c.statusColor === 'moderate';
                    return (
                      <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-[#111C2D] font-sans">{c.title}</div>
                          <div className="text-[11px] font-mono text-slate-500 mt-0.5 line-clamp-2 max-w-md">
                            {c.fragileSubconcept ? `Nuance: ${c.fragileSubconcept} • Risk: ${c.cognitiveLossRisk}` : c.nuanceGapDetail}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-[#8D4B00]">
                          {100 - c.aiExposureRaw}% ({c.aiExposureRaw}% AI Gen)
                        </td>
                        <td className={`py-3.5 px-4 font-mono font-semibold ${isCrit ? 'text-rose-700' : isMod ? 'text-amber-800' : 'text-emerald-800'}`}>
                          {c.retentionScore.toFixed(1)}% ({c.halfLifeEst})
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[10px] font-semibold ${
                            isCrit ? 'bg-amber-50 text-amber-800 border border-amber-200' : isMod ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          }`}>
                            <span>{c.statusLabel}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold ${
                            isCrit ? 'bg-rose-50 text-rose-800 border border-rose-200' : isMod ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          }`}>
                            {isCrit ? 'URGENT DRILL' : isMod ? 'QUEUE STANDBY' : 'STABLE'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleStartRecallSession(c.title, c.retentionScore)}
                            className="text-[#006948] hover:text-[#005439] font-mono font-bold text-xs hover:underline cursor-pointer"
                          >
                            Recall &rarr;
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer Info */}
          <div className="p-4 bg-[#FAF8F5] border-t border-[#E5E0D8] flex flex-col sm:flex-row items-center justify-between text-xs text-[#64748B] font-mono gap-2">
            <span>Showing {filteredCards.length} user-isolated audited domains</span>
            <span>Cryptographic UID isolation enforced</span>
          </div>

        </div>
      </section>

      {/* 7. Floating Bottom Recall Dock */}
      <aside id="floating-recall-dock" className="fixed bottom-4 left-1/2 transform -translate-x-1/2 w-[95%] max-w-4xl z-50">
        <div className="bg-white/95 backdrop-blur-md rounded-xl border border-[#E5E0D8] p-3 sm:p-4 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Dock Input & Prompt */}
          <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
            <div className="w-8 h-8 rounded-lg bg-[#ECFDF5] border border-emerald-200 text-[#006948] flex items-center justify-center shrink-0">
              <Brain className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="font-sans font-semibold text-xs text-[#111C2D]">Want to refresh something specific?</div>
              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                <span className="text-[10px] font-mono text-slate-400">Quick jump:</span>
                <button
                  type="button"
                  onClick={() => handleStartRecallSession('CUDA Streams', 55.0)}
                  className="px-2 py-0.5 rounded bg-[#FAF8F5] border border-[#E5E0D8] text-[10px] font-mono text-[#111C2D] hover:border-[#006948] hover:text-[#006948] transition-all cursor-pointer"
                >
                  [ CUDA Streams ]
                </button>
                <button
                  type="button"
                  onClick={() => handleStartRecallSession('Raft Consensus', 42.0)}
                  className="px-2 py-0.5 rounded bg-[#FAF8F5] border border-[#E5E0D8] text-[10px] font-mono text-[#111C2D] hover:border-[#006948] hover:text-[#006948] transition-all cursor-pointer"
                >
                  [ Raft Consensus ]
                </button>
                <button
                  type="button"
                  onClick={() => handleStartRecallSession('eBPF Tracing', 58.0)}
                  className="px-2 py-0.5 rounded bg-[#FAF8F5] border border-[#E5E0D8] text-[10px] font-mono text-[#111C2D] hover:border-[#006948] hover:text-[#006948] transition-all cursor-pointer"
                >
                  [ eBPF Tracing ]
                </button>
              </div>
            </div>
          </div>

          {/* Dock CTA */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <input
              id="custom-recall-input"
              type="text"
              value={dockInput}
              onChange={(e) => setDockInput(e.target.value)}
              placeholder="Concept name..."
              className="hidden sm:block w-36 px-2.5 py-1.5 rounded-lg border border-[#E5E0D8] text-xs bg-[#FAF8F5] font-mono text-[#111C2D] focus:outline-none focus:border-[#006948]"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleDockLaunch();
              }}
            />
            <button
              id="btn-dock-launch-recall"
              type="button"
              onClick={handleDockLaunch}
              className="w-full sm:w-auto px-4 py-2 rounded-lg bg-[#006948] hover:bg-[#005439] text-white font-sans text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <span>Launch Recall</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </aside>

      {/* Simulated Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-[#111C2D] text-white px-4 py-2.5 rounded-xl shadow-lg font-sans text-xs flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

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
    </div>
  );
};
