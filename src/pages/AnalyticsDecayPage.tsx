import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { TopicRetentionState, JournalEntry, ExtractedConcept } from '../types';
import { ZeroStateHeader } from '../components/dashboard/ZeroStateHeader';
import { ZeroStateBlueprintPanel } from '../components/dashboard/ZeroStateBlueprintPanel';
import { JournalEntryForm } from '../components/journal/JournalEntryForm';
import {
  TrendingDown,
  Activity,
  Cpu,
  Layers,
  Sparkles,
  ShieldCheck,
  Brain,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  GitBranch,
  Terminal,
  FileCode2,
  ArrowUpRight,
} from 'lucide-react';

export const AnalyticsDecayPage: React.FC = () => {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [topics, setTopics] = useState<TopicRetentionState[]>([]);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isBlueprintOpen, setIsBlueprintOpen] = useState(true);

  // Ebbinghaus simulator selected curve
  const [selectedTrajectory, setSelectedTrajectory] = useState<
    'agentic' | 'spec' | 'prompt' | 'manual' | 'interleaved'
  >('interleaved');

  useEffect(() => {
    async function loadData() {
      if (!user) {
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
        console.warn('Failed to load analytics data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [user]);

  const handleJournalSuccess = async (entry: JournalEntry, concepts: ExtractedConcept[]) => {
    setIsLogModalOpen(false);
    await refreshProfile();
    try {
      const [entriesRes, topicsRes] = await Promise.all([
        api.getJournalEntries().catch(() => ({ entries: [], total: 0 })),
        api.getTopics().catch(() => ({ topics: [], total: 0 })),
      ]);
      setEntries(entriesRes.entries || []);
      setTopics(topicsRes.topics || []);
    } catch (e) {
      // ignore
    }
  };

  // Trajectory curve mathematical parameters
  // R(t) = e^(-t / S)
  const trajectoryData = useMemo(() => {
    const configs = {
      agentic: { label: 'Autonomous Agentic Coding', s: 1.1, halflife: '18h', color: '#DC2626', stroke: '#EF4444' },
      spec: { label: 'Spec-Driven Generation', s: 2.4, halflife: '40h', color: '#EA580C', stroke: '#F97316' },
      prompt: { label: 'Prompt-Assisted Dev', s: 3.2, halflife: '53h', color: '#D97706', stroke: '#F59E0B' },
      manual: { label: 'Manual Derivation', s: 7.2, halflife: '120h', color: '#2563EB', stroke: '#3B82F6' },
      interleaved: { label: 'CARE Socratic Recall Interleaving', s: 24.0, halflife: '400h+', color: '#006948', stroke: '#10B981' },
    };

    const days = [0, 1, 2, 3, 5, 7, 10, 14, 21, 30];
    const points = days.map((day) => {
      const activeS = configs[selectedTrajectory].s;
      // Exponential decay
      const retention = Math.round(Math.exp(-day / activeS) * 100);
      return { day, retention };
    });

    return { configs, points, currentConfig: configs[selectedTrajectory] };
  }, [selectedTrajectory]);

  // Mode breakdown count
  const modeStats = useMemo(() => {
    let agentic = 0;
    let spec = 0;
    let prompt = 0;
    let manual = 0;

    entries.forEach((e) => {
      if (e.assistanceLevel === 'spec_first' || e.promptStrategy === 'spec_driven') spec++;
      else if (e.aiRelianceScore > 0.75) agentic++;
      else if (e.aiRelianceScore > 0.3) prompt++;
      else manual++;
    });

    const total = entries.length || 1;
    return {
      agentic: { count: agentic, pct: Math.round((agentic / total) * 100) },
      spec: { count: spec, pct: Math.round((spec / total) * 100) },
      prompt: { count: prompt, pct: Math.round((prompt / total) * 100) },
      manual: { count: manual, pct: Math.round((manual / total) * 100) },
    };
  }, [entries]);

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1E293B] font-sans flex flex-col selection:bg-emerald-500/20 selection:text-emerald-900 antialiased">
      {/* 1. Global Navigation Header */}
      <ZeroStateHeader
        onLogClick={() => setIsLogModalOpen(true)}
        onViewLanding={() => navigate('/')}
        onToggleBlueprint={() => setIsBlueprintOpen((prev) => !prev)}
        activeNav="analytics"
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
              <span>COGNITIVE ATROPHY ANALYTICS</span>
              <span className="text-slate-300">•</span>
              <span>MATHEMATICAL DECAY TRAJECTORIES</span>
            </div>
            <h1 className="font-serif font-bold text-3xl sm:text-4xl text-[#1E293B] tracking-tight">
              Analytics &amp; Decay Engine
            </h1>
            <p className="font-sans text-xs sm:text-sm text-[#505F76] mt-1.5 max-w-2xl leading-relaxed">
              Empirical modeling of cognitive decay rates across AI assistance tiers.
              Evaluate retention half-lives and telemetry breakdown in real time.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
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
          </div>
        </div>
      </div>

      {/* 3. Main 2-Column Content Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* Left Column: Analytics Visualizers */}
        <section
          aria-label="Cognitive Decay Analytics"
          className={`space-y-6 transition-all duration-300 ${
            isBlueprintOpen ? 'lg:col-span-8' : 'lg:col-span-12'
          }`}
        >
          {/* Card 1: Interactive Ebbinghaus Retention Trajectory Simulator */}
          <div className="bg-white rounded-2xl border border-[#E5E0D8] p-6 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#F0ECE6]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#505F76] uppercase tracking-wider">
                    EBBINGHAUS RETENTION TRAJECTORY
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-[#F0F3FF] border border-[#CCD8FF] text-[#1E293B] font-mono text-[9px] font-bold">
                    R(t) = e^(-t / S)
                  </span>
                </div>
                <h3 className="font-serif font-bold text-lg text-[#1E293B] mt-1">
                  Memory Stability &amp; AI Atrophy Simulation
                </h3>
              </div>

              {/* Trajectory Select Buttons */}
              <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#FAF8F5] rounded-xl border border-[#E5E0D8] text-xs">
                {(
                  [
                    { id: 'agentic', label: 'Agentic' },
                    { id: 'spec', label: 'Spec' },
                    { id: 'prompt', label: 'Prompt' },
                    { id: 'manual', label: 'Manual' },
                    { id: 'interleaved', label: 'CARE Drills' },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedTrajectory(t.id)}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer font-medium ${
                      selectedTrajectory === t.id
                        ? 'bg-[#1E293B] text-white shadow-2xs font-semibold'
                        : 'text-[#505F76] hover:text-[#1E293B]'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Active Mode Callout */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-5 p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
              <div>
                <span className="text-[10px] font-mono font-bold text-[#505F76] uppercase">
                  ACTIVE REGIME
                </span>
                <div className="font-sans font-bold text-sm text-[#1E293B] mt-0.5">
                  {trajectoryData.currentConfig.label}
                </div>
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold text-[#505F76] uppercase">
                  RETENTION HALF-LIFE
                </span>
                <div className="font-mono font-bold text-sm text-[#006948] mt-0.5">
                  {trajectoryData.currentConfig.halflife}
                </div>
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold text-[#505F76] uppercase">
                  STABILITY CONSTANT (S)
                </span>
                <div className="font-mono font-bold text-sm text-[#1E293B] mt-0.5">
                  {trajectoryData.currentConfig.s} days
                </div>
              </div>
            </div>

            {/* Visual Decay Curve Graph (CSS-SVG based high precision visualizer) */}
            <div className="relative pt-4 pb-2">
              <div className="h-48 w-full flex items-end justify-between gap-2 px-2 border-b border-l border-[#E5E0D8] relative">
                {/* Horizontal Baseline markers */}
                <div className="absolute top-1/4 left-0 right-0 h-px border-b border-dashed border-slate-200" />
                <div className="absolute top-1/2 left-0 right-0 h-px border-b border-dashed border-slate-200" />
                <div className="absolute top-3/4 left-0 right-0 h-px border-b border-dashed border-slate-200" />

                {trajectoryData.points.map((pt, idx) => {
                  const barHeight = Math.max(pt.retention, 4);
                  const isCritical = pt.retention < 35;
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                      {/* Tooltip on hover */}
                      <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-[#1E293B] text-white text-[10px] font-mono px-2 py-0.5 rounded shadow-md pointer-events-none whitespace-nowrap z-10">
                        Day {pt.day}: {pt.retention}%
                      </div>
                      <div
                        className="w-full rounded-t transition-all duration-300 relative"
                        style={{
                          height: `${barHeight * 1.5}px`,
                          backgroundColor: isCritical ? '#EF4444' : trajectoryData.currentConfig.color,
                          opacity: 0.85,
                        }}
                      />
                      <span className="font-mono text-[9px] text-[#505F76]">
                        d{pt.day}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono text-[#505F76] mt-2 px-1">
                <span>0 Days (Immediate Capture)</span>
                <span>30 Days (Long-Term Retention Horizon)</span>
              </div>
            </div>
          </div>

          {/* Card 2: AI Assistance Telemetry Distribution */}
          <div className="bg-white rounded-2xl border border-[#E5E0D8] p-6 shadow-2xs">
            <div className="flex items-center justify-between pb-4 border-b border-[#F0ECE6]">
              <div>
                <span className="font-mono text-xs font-bold text-[#505F76] uppercase tracking-wider">
                  TELEMETRY INGESTION MIX
                </span>
                <h3 className="font-serif font-bold text-lg text-[#1E293B] mt-1">
                  AI Assistance Stratification Across Work Journals
                </h3>
              </div>
              <span className="font-mono text-xs text-[#006948] font-bold">
                {entries.length} Total Logs
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
              <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-[#505F76]">AGENTIC</span>
                  <Terminal className="w-4 h-4 text-rose-500" />
                </div>
                <div className="font-sans font-extrabold text-2xl text-[#1E293B] mt-2">
                  {modeStats.agentic.pct}%
                </div>
                <div className="text-[11px] text-[#505F76] mt-1">
                  {modeStats.agentic.count} entries (&gt;75% AI)
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-[#505F76]">SPEC-FIRST</span>
                  <GitBranch className="w-4 h-4 text-amber-500" />
                </div>
                <div className="font-sans font-extrabold text-2xl text-[#1E293B] mt-2">
                  {modeStats.spec.pct}%
                </div>
                <div className="text-[11px] text-[#505F76] mt-1">
                  {modeStats.spec.count} entries (spec guided)
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-[#505F76]">PROMPT-DRIVEN</span>
                  <Cpu className="w-4 h-4 text-blue-500" />
                </div>
                <div className="font-sans font-extrabold text-2xl text-[#1E293B] mt-2">
                  {modeStats.prompt.pct}%
                </div>
                <div className="text-[11px] text-[#505F76] mt-1">
                  {modeStats.prompt.count} entries (30-75% AI)
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8]">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-[#505F76]">MANUAL</span>
                  <FileCode2 className="w-4 h-4 text-[#006948]" />
                </div>
                <div className="font-sans font-extrabold text-2xl text-[#1E293B] mt-2">
                  {modeStats.manual.pct}%
                </div>
                <div className="text-[11px] text-[#505F76] mt-1">
                  {modeStats.manual.count} entries (&lt;30% AI)
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Priority Scheduling Calculus Breakdown */}
          <div className="bg-white rounded-2xl border border-[#E5E0D8] p-6 shadow-2xs">
            <div className="flex items-center justify-between pb-4 border-b border-[#F0ECE6]">
              <div>
                <span className="font-mono text-xs font-bold text-[#505F76] uppercase tracking-wider">
                  PRIORITY SCHEDULING CALCULUS
                </span>
                <h3 className="font-serif font-bold text-lg text-[#1E293B] mt-1">
                  Dynamic Weight Vector Distribution
                </h3>
              </div>
              <span className="font-mono text-xs text-[#006948] font-bold">
                Formula Eq. 4.2
              </span>
            </div>

            <div className="p-3 my-4 rounded-xl bg-[#F0F3FF] border border-[#CCD8FF] text-center font-mono text-xs sm:text-sm font-bold text-[#1E293B]">
              Priority(t) = [0.40·T(t) + 0.35·A(t) + 0.25·H(t)] × M(t)
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-3 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5]">
                <div className="font-mono text-xs font-bold text-[#1E293B]">
                  w₁ = 0.40 · Time Decay T(t)
                </div>
                <p className="text-[11px] text-[#505F76] mt-1 leading-relaxed">
                  Normalized elapsed time since last concept exposure relative to estimated Ebbinghaus half-life.
                </p>
              </div>

              <div className="p-3 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5]">
                <div className="font-mono text-xs font-bold text-[#1E293B]">
                  w₂ = 0.35 · AI Reliance A(t)
                </div>
                <p className="text-[11px] text-[#505F76] mt-1 leading-relaxed">
                  Composite assistance score derived from diff snapshot token density and prompting strategy.
                </p>
              </div>

              <div className="p-3 rounded-lg border border-[#E5E0D8] bg-[#FAF8F5]">
                <div className="font-mono text-xs font-bold text-[#1E293B]">
                  w₃ = 0.25 · Hist. Efficacy H(t)
                </div>
                <p className="text-[11px] text-[#505F76] mt-1 leading-relaxed">
                  Inverse historic recall score from prior Socratic dialogue assessments.
                </p>
              </div>
            </div>
          </div>
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

      {/* 4. Footer */}
      <footer className="border-t border-[#E5E0D8] bg-white py-6 px-4 sm:px-6 lg:px-8 text-xs text-[#505F76] mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-center sm:text-left">
            <span className="font-serif font-bold text-[#1E293B]">
              CARE Cognitive &amp; Adaptive Retention Engine
            </span>
            <span className="hidden sm:inline text-slate-300">•</span>
            <span>Mathematical Ebbinghaus decay analytics counteracting engineering memory decay.</span>
          </div>
          <div className="flex items-center gap-3 font-mono text-[11px]">
            <span className="text-[#006948] font-bold">Analytics Engine v2.4</span>
            <span className="text-slate-400">&copy; 2025 CARE Engine</span>
          </div>
        </div>
      </footer>

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
