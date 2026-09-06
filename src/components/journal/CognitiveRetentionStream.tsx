import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Share2,
  AlertTriangle,
  Search,
  LayoutGrid,
  ShieldCheck,
  ChevronRight,
  Activity,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Sliders,
  Filter,
  Layers,
  X,
} from 'lucide-react';
import { JournalEntry, TopicRetentionState, ExtractedConcept } from '../../types';
import { ZeroStateHeader } from '../dashboard/ZeroStateHeader';
import { ZeroStateBlueprintPanel } from '../dashboard/ZeroStateBlueprintPanel';
import { JournalStreamCard } from './JournalStreamCard';
import { useAuth } from '../../context/AuthContext';

interface CognitiveRetentionStreamProps {
  entries: JournalEntry[];
  topics?: TopicRetentionState[];
  onOpenSpec?: () => void;
  onSelectNav?: (nav: string) => void;
  onViewLanding?: () => void;
  onOpenAuth?: () => void;
  onLogSuccess?: (entry: JournalEntry, concepts: ExtractedConcept[]) => void;
  onToggleToZeroState?: () => void;
}

export const CognitiveRetentionStream: React.FC<CognitiveRetentionStreamProps> = ({
  entries,
  topics = [],
  onOpenSpec,
  onSelectNav,
  onViewLanding,
  onOpenAuth,
  onLogSuccess,
  onToggleToZeroState,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'high_ai' | 'decay_flagged'>('all');
  const [isBlueprintOpen, setIsBlueprintOpen] = useState(true);

  // Progressive scroll loading state
  const [visibleCount, setVisibleCount] = useState(3);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadMoreSentinelRef = useRef<HTMLDivElement>(null);

  // Filter entries based on search and active filter pill
  const filteredEntries = useMemo(() => {
    let result = [...entries];

    // Filter pill logic
    if (activeFilter === 'high_ai') {
      result = result.filter(
        (e) => (e.aiReliancePercentage ?? (e.aiAssistanceLevel === 'agentic' ? 85 : 50)) >= 70
      );
    } else if (activeFilter === 'decay_flagged') {
      result = result.filter(
        (e) => (e.stabilityRatio ?? 0.5) < 0.55 || e.actionLabel?.includes('Diagnostic')
      );
    }

    // Search query logic
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.rawContent.toLowerCase().includes(q) ||
          (e.modeType && e.modeType.toLowerCase().includes(q)) ||
          (e.tags && e.tags.some((t) => t.toLowerCase().includes(q))) ||
          (e.extractedConcepts &&
            e.extractedConcepts.some((c) => c.canonicalName.toLowerCase().includes(q)))
      );
    }

    return result;
  }, [entries, activeFilter, searchQuery]);

  // Progressive scroll observer
  useEffect(() => {
    const sentinel = loadMoreSentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (observerEntries) => {
        const first = observerEntries[0];
        if (first.isIntersecting && visibleCount < filteredEntries.length && !isLoadingMore) {
          setIsLoadingMore(true);
          // Simulate smooth progressive chunk loading
          setTimeout(() => {
            setVisibleCount((prev) => Math.min(prev + 3, filteredEntries.length));
            setIsLoadingMore(false);
          }, 350);
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [visibleCount, filteredEntries.length, isLoadingMore]);

  // Currently visible entries
  const currentEntries = filteredEntries.slice(0, visibleCount);
  const isAllLoaded = visibleCount >= filteredEntries.length && filteredEntries.length > 0;

  // Group entries by dateGroup
  const groupedEntries = useMemo(() => {
    const groups: { groupName: string; syncCount: number; items: JournalEntry[] }[] = [];
    currentEntries.forEach((entry) => {
      const dateHeader = entry.dateGroup || 'Recent Telemetry Sync';
      let existingGroup = groups.find((g) => g.groupName === dateHeader);
      if (!existingGroup) {
        existingGroup = { groupName: dateHeader, syncCount: 1, items: [] };
        groups.push(existingGroup);
      }
      existingGroup.items.push(entry);
    });
    return groups;
  }, [currentEntries]);

  // Derived metric counts
  const totalVolumeCount = entries.length;
  const criticalCount = topics.filter((t) => t.currentPriorityScore > 60 || (t.decayFactor ?? 1) < 0.55).length || 2;
  const topicCount = topics.length > 0 ? topics.length : 5;

  const handleLogClick = () => {
    if (!user && onOpenAuth) {
      onOpenAuth();
      return;
    }
    navigate('/journal/editor');
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1E293B] font-sans flex flex-col selection:bg-emerald-500/20 selection:text-emerald-900 antialiased">
      {/* 1. Fixed Header Bar */}
      <ZeroStateHeader
        onLogClick={handleLogClick}
        onViewLanding={onViewLanding}
        onOpenAuth={onOpenAuth}
        onToggleBlueprint={() => setIsBlueprintOpen((prev) => !prev)}
        activeNav="feed"
        onSelectNav={(navId) => {
          if (navId === 'spec' && onOpenSpec) {
            onOpenSpec();
          } else if (onSelectNav) {
            onSelectNav(navId);
          }
        }}
        logStreak={12}
        recallStreak={5}
      />

      {/* 2. Top Title & Search Control Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4 w-full">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          {/* Left: Stream Heading */}
          <div>
            <div className="flex items-center gap-2 mb-2 font-mono text-xs text-[#505F76] font-semibold tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>ACTIVE TELEMETRY STREAM</span>
              <span className="text-slate-300">•</span>
              <span>ENGINE v2.4-ONLINE</span>
            </div>
            <h1 className="font-serif font-bold text-3xl sm:text-4xl text-[#1E293B] tracking-tight">
              Cognitive Retention Stream
            </h1>
            <p className="font-sans text-xs sm:text-sm text-[#505F76] mt-1.5 max-w-2xl leading-relaxed">
              Automated knowledge-graph journaling counteracting AI-induced memory attrition through surgical Socratic recall.
            </p>
          </div>

          {/* Right: Search concepts & System Blueprint Button */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative min-w-[240px] sm:min-w-[280px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setVisibleCount(3);
                }}
                placeholder="Search concepts, logs, telemetry..."
                className="w-full pl-9 pr-3.5 py-2 text-xs bg-white rounded-lg border border-[#E5E0D8] text-[#1E293B] placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#006948] focus:border-[#006948] shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  &times;
                </button>
              )}
            </div>

            <button
              id="btn-stream-toggle-blueprint"
              type="button"
              onClick={() => setIsBlueprintOpen((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border transition-all font-mono text-xs font-semibold cursor-pointer shadow-2xs ${
                isBlueprintOpen
                  ? 'bg-[#ECFDF5] border-emerald-300 text-[#006948] hover:bg-emerald-100/60'
                  : 'bg-white border-[#E5E0D8] text-[#505F76] hover:text-[#1E293B] hover:bg-[#FAF8F5]'
              }`}
              title="Toggle Architecture Blueprint Panel"
            >
              <Layers className="w-3.5 h-3.5 text-[#006948]" />
              <span>System Blueprint</span>
              <span className="text-[10px] ml-0.5">
                <strong className={isBlueprintOpen ? 'text-[#006948]' : 'text-slate-400'}>
                  [{isBlueprintOpen ? 'ACTIVE' : 'HIDDEN'}]
                </strong>
              </span>
            </button>

            {onOpenSpec && (
              <button
                type="button"
                onClick={onOpenSpec}
                className="inline-flex items-center gap-1 px-2.5 py-2 rounded-lg bg-white hover:bg-slate-50 border border-[#E5E0D8] text-[#505F76] hover:text-[#006948] transition-colors font-mono text-xs font-medium cursor-pointer shadow-2xs"
                title="Open full dedicated spec page"
              >
                <span>Full Spec</span>
                <span className="text-[10px] text-slate-400">&rarr;</span>
              </button>
            )}
          </div>
        </div>

        {/* 3. Three Metric Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 mt-6">
          {/* Card 1: Telemetry Volume */}
          <div className="bg-white rounded-2xl border border-[#E5E0D8] p-5 shadow-2xs relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono text-[11px] font-bold text-[#505F76] uppercase tracking-wider">
                  TELEMETRY VOLUME
                </span>
                <div className="font-sans font-extrabold text-2xl sm:text-3xl text-[#1E293B] mt-1.5 tracking-tight">
                  {totalVolumeCount} Entries
                </div>
              </div>
              <div className="w-9 h-9 rounded-xl bg-[#ECFDF5] border border-emerald-200 flex items-center justify-center text-[#006948]">
                <BookOpen className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-center justify-between text-xs font-mono text-[#505F76] mt-4 pt-3 border-t border-[#F0ECE6]">
              <span>Lifetime record entries</span>
              <span className="text-[#006948] font-bold">↗ +3 today</span>
            </div>
          </div>

          {/* Card 2: Concept Graph Nodes */}
          <div className="bg-white rounded-2xl border border-[#E5E0D8] p-5 shadow-2xs relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono text-[11px] font-bold text-[#505F76] uppercase tracking-wider">
                  CONCEPT GRAPH NODES
                </span>
                <div className="font-sans font-extrabold text-2xl sm:text-3xl text-[#1E293B] mt-1.5 tracking-tight">
                  {topicCount} Topics
                </div>
              </div>
              <div className="w-9 h-9 rounded-xl bg-[#F0F3FF] border border-[#E7EEFF] flex items-center justify-center text-[#2563EB]">
                <Share2 className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-center justify-between text-xs font-mono text-[#505F76] mt-4 pt-3 border-t border-[#F0ECE6]">
              <span>Linked to {totalVolumeCount} journal logs</span>
              <span className="text-[#1E293B] font-bold">98.2% parse density</span>
            </div>
          </div>

          {/* Card 3: Retention Vulnerability */}
          <div className="bg-white rounded-2xl border border-[#E5E0D8] p-5 shadow-2xs relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] font-bold text-[#505F76] uppercase tracking-wider">
                    RETENTION VULNERABILITY
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-[#FFF8ED] border border-amber-300 text-[#8D4B00] font-mono text-[9px] font-bold">
                    CRITICAL
                  </span>
                </div>
                <div className="font-sans font-extrabold text-2xl sm:text-3xl text-[#1E293B] mt-1.5 tracking-tight">
                  {criticalCount} Topics
                </div>
              </div>
              <div className="w-9 h-9 rounded-xl bg-[#FFF8ED] border border-amber-300 flex items-center justify-center text-[#8D4B00]">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              </div>
            </div>
            <div className="flex items-center justify-between text-xs font-mono text-[#505F76] mt-4 pt-3 border-t border-[#F0ECE6]">
              <span>Targeted for immediate recall</span>
              <span className="text-[#8D4B00] font-bold">Halflife: &lt; 36h</span>
            </div>
          </div>
        </div>

        {/* 4. Filter Pills & Sync Status Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-6 pb-2 border-b border-[#E5E0D8]">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => {
                setActiveFilter('all');
                setVisibleCount(3);
              }}
              className={`px-3 py-1 rounded-full font-medium transition-all cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-[#1E293B] text-white shadow-2xs'
                  : 'bg-white text-[#505F76] hover:text-[#1E293B] border border-[#E5E0D8]'
              }`}
            >
              All Captured Logs
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveFilter('high_ai');
                setVisibleCount(3);
              }}
              className={`px-3 py-1 rounded-full font-medium transition-all cursor-pointer ${
                activeFilter === 'high_ai'
                  ? 'bg-[#1E293B] text-white shadow-2xs'
                  : 'bg-white text-[#505F76] hover:text-[#1E293B] border border-[#E5E0D8]'
              }`}
            >
              High AI Reliance (&gt;70%)
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveFilter('decay_flagged');
                setVisibleCount(3);
              }}
              className={`px-3 py-1 rounded-full font-medium transition-all cursor-pointer ${
                activeFilter === 'decay_flagged'
                  ? 'bg-[#1E293B] text-white shadow-2xs'
                  : 'bg-white text-[#505F76] hover:text-[#1E293B] border border-[#E5E0D8]'
              }`}
            >
              Decay Flagged
            </button>
          </div>

          <div className="flex items-center gap-3">
            {onToggleToZeroState && (
              <button
                type="button"
                onClick={onToggleToZeroState}
                className="text-[11px] font-mono text-[#505F76] hover:text-[#006948] transition-colors cursor-pointer"
              >
                Inspect Zero State &rarr;
              </button>
            )}
            <div className="flex items-center gap-1.5 font-mono text-xs text-[#505F76]">
              <span className="font-semibold text-[#1E293B]">SYNCED</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
          </div>
        </div>
      </div>

      {/* 5. Main 2-Column Content Layout (Dynamic Collapsible Blueprint Panel) */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* Left Column: Progressive Journal Feed Stream */}
        <section
          aria-label="Journal Feed Stream"
          className={`space-y-6 transition-all duration-300 ${
            isBlueprintOpen ? 'lg:col-span-8' : 'lg:col-span-12'
          }`}
        >
          {filteredEntries.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E5E0D8] p-12 text-center shadow-2xs">
              <BookOpen className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <h3 className="font-serif font-bold text-lg text-[#1E293B]">
                No journals match your active filter
              </h3>
              <p className="font-sans text-xs text-[#505F76] mt-1 max-w-md mx-auto">
                Try resetting your search query or selecting &quot;All Captured Logs&quot; to review all engineering records.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setActiveFilter('all');
                }}
                className="mt-4 px-4 py-2 bg-[#006948] text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            groupedEntries.map((group, groupIdx) => (
              <div key={groupIdx} className="space-y-4">
                {/* Date Group Header */}
                <div className="flex items-center gap-2 pt-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <h2 className="font-sans font-bold text-sm sm:text-base text-[#1E293B]">
                    {group.groupName}
                  </h2>
                  <span className="font-mono text-xs text-[#505F76]">
                    {group.syncCount} Telemetry Sync{group.syncCount > 1 ? 's' : ''}
                  </span>
                </div>

                {/* Journal Cards in this group */}
                <div className="space-y-4">
                  {group.items.map((entry) => (
                    <JournalStreamCard
                      key={entry.entryId}
                      entry={entry}
                      onSelectConcept={(concept) => setSearchQuery(concept)}
                      onOpenRecallDiagnostic={(e) => {
                        if (onSelectNav) {
                          onSelectNav('hub');
                        }
                      }}
                    />
                  ))}
                </div>
              </div>
            ))
          )}

          {/* Progressive Scroll Loading Sentinel */}
          <div ref={loadMoreSentinelRef} className="h-6 flex items-center justify-center">
            {isLoadingMore && (
              <div className="flex items-center gap-2 font-mono text-xs text-[#006948] py-4">
                <Loader2 className="w-4 h-4 animate-spin text-[#006948]" />
                <span>Loading telemetry diff snapshots...</span>
              </div>
            )}
          </div>

          {/* End of Stream Horizontal Indication Indicator */}
          {isAllLoaded && (
            <div
              id="stream-end-indicator"
              className="flex items-center justify-center my-8 gap-4 px-4"
            >
              <div className="h-px bg-[#E5E0D8] flex-1" />
              <span className="text-xs font-mono font-bold text-[#505F76] px-3 tracking-widest uppercase">
                --end--
              </span>
              <div className="h-px bg-[#E5E0D8] flex-1" />
            </div>
          )}
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

      {/* 6. Footer */}
      <footer className="border-t border-[#E5E0D8] bg-white py-6 px-4 sm:px-6 lg:px-8 text-xs text-[#505F76] mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-center sm:text-left">
            <span className="font-serif font-bold text-[#1E293B]">
              CARE Cognitive &amp; Adaptive Retention Engine
            </span>
            <span className="hidden sm:inline text-slate-300">•</span>
            <span>An AI that CAREs about Human Expertise. Counteracting AI-assisted cognitive decay.</span>
          </div>
          <div className="flex items-center gap-3 font-mono text-[11px]">
            <span className="text-[#006948] font-bold">v2.4-telemetry-online</span>
            <span className="text-slate-400">&copy; 2025 CARE Engine</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
