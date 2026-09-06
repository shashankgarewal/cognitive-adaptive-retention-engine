/**
 * CARE - CognitiveRetentionStream Component
 * The populated Work Journal Feed page displaying chronological journal entries,
 * concepts extracted by Gemini 3.8 Flash, and real-time retention telemetry.
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Search,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  TrendingDown,
  Loader2,
  Sliders,
  Filter,
  X,
  ArrowRight,
  Tag,
} from 'lucide-react';
import { JournalEntry, TopicRetentionState, ExtractedConcept } from '../../types';
import { ZeroStateHeader } from '../dashboard/ZeroStateHeader';
import { ZeroStateMetricCards } from '../dashboard/ZeroStateMetricCards';
import { JournalStreamCard } from './JournalStreamCard';
import { AppFooter } from '../layout/AppFooter';
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
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'high_ai' | 'decay_flagged'>('all');

  // Progressive scroll loading state
  const [visibleCount, setVisibleCount] = useState(5);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadMoreSentinelRef = useRef<HTMLDivElement>(null);

  // Extract all unique category tags and concepts across all entries
  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    entries.forEach((e) => {
      (e.tags || []).forEach((t) => {
        const clean = t.replace('#', '').trim();
        if (clean) tagSet.add(clean);
      });
      (e.extractedConcepts || []).forEach((c) => {
        if (c.canonicalName) {
          const clean = c.canonicalName.replace('#', '').trim();
          if (clean) tagSet.add(clean);
        }
      });
    });
    return Array.from(tagSet);
  }, [entries]);

  // Toggle a tag in/out of selectedTags
  const handleToggleTag = (rawTag: string) => {
    const tag = rawTag.replace('#', '').trim();
    if (!tag) return;
    setSelectedTags((prev) =>
      prev.some((t) => t.toLowerCase() === tag.toLowerCase())
        ? prev.filter((t) => t.toLowerCase() !== tag.toLowerCase())
        : [...prev, tag]
    );
  };

  // Filter entries based on search, selected tags, and active filter pill
  const filteredEntries = useMemo(() => {
    let result = [...entries];

    // 1. Multi-Selected tag filter (matches if entry contains ANY selected tag)
    if (selectedTags.length > 0) {
      result = result.filter((e) => {
        const entryTags = (e.tags || []).map((t) => t.replace('#', '').toLowerCase().trim());
        const conceptNames = (e.extractedConcepts || []).flatMap((c) => [
          c.name?.toLowerCase().trim(),
          c.canonicalName?.toLowerCase().trim(),
          c.fragileSubconcept?.toLowerCase().trim(),
        ]).filter(Boolean);
        const contentText = (e.rawContent || e.content || '').toLowerCase();
        const titleText = (e.title || '').toLowerCase();

        return selectedTags.some((st) => {
          const target = st.toLowerCase().trim();
          return (
            entryTags.includes(target) ||
            conceptNames.some((c) => c && c.includes(target)) ||
            contentText.includes(target) ||
            titleText.includes(target)
          );
        });
      });
    }

    // 2. Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((e) => {
        const matchContent = (e.rawContent || e.content || '').toLowerCase().includes(q);
        const matchTitle = (e.title || '').toLowerCase().includes(q);
        const matchTags = e.tags?.some((t) => t.toLowerCase().includes(q) || t.replace('#', '').toLowerCase().includes(q));
        const matchConcepts = e.extractedConcepts?.some(
          (c) =>
            c.name?.toLowerCase().includes(q) ||
            c.canonicalName?.toLowerCase().includes(q) ||
            c.fragileSubconcept?.toLowerCase().includes(q)
        );
        return matchContent || matchTitle || matchTags || matchConcepts;
      });
    }

    // 3. Status filter
    if (activeFilter === 'high_ai') {
      result = result.filter((e) => {
        const reliance =
          e.aiReliancePercentage ??
          (e.aiAssistanceLevel === 'agentic'
            ? 85
            : e.aiAssistanceLevel === 'spec_driven'
            ? 75
            : e.aiAssistanceLevel === 'prompt_driven'
            ? 45
            : 15);
        return (
          reliance >= 70 ||
          e.aiRelianceLevel === 'Spec-Driven' ||
          e.aiRelianceLevel === 'Agentic' ||
          e.aiAssistanceLevel === 'spec_driven' ||
          e.aiAssistanceLevel === 'agentic'
        );
      });
    } else if (activeFilter === 'decay_flagged') {
      result = result.filter((e) => {
        const stability = e.stabilityRatio ?? 0.8;
        const hasFastDecay = e.extractedConcepts?.some((c) => (c.estimatedDecayHalfLifeDays || 7) <= 4);
        return stability < 0.55 || hasFastDecay;
      });
    }

    return result;
  }, [entries, searchQuery, selectedTags, activeFilter]);

  // Infinite scroll trigger
  useEffect(() => {
    const sentinel = loadMoreSentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (observerEntries) => {
        const target = observerEntries[0];
        if (target.isIntersecting && visibleCount < filteredEntries.length && !isLoadingMore) {
          setIsLoadingMore(true);
          setTimeout(() => {
            setVisibleCount((prev) => Math.min(prev + 3, filteredEntries.length));
            setIsLoadingMore(false);
          }, 400);
        }
      },
      { rootMargin: '100px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [visibleCount, filteredEntries.length, isLoadingMore]);

  // Group entries chronologically
  const groupedEntries = useMemo(() => {
    const visibleList = filteredEntries.slice(0, visibleCount);
    const groups: { groupName: string; syncCount: number; items: JournalEntry[] }[] = [];

    visibleList.forEach((entry) => {
      const date = new Date(entry.createdAt);
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);

      let groupName = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

      if (date.toDateString() === today.toDateString()) {
        groupName = 'Today • ' + groupName;
      } else if (date.toDateString() === yesterday.toDateString()) {
        groupName = 'Yesterday • ' + groupName;
      }

      let group = groups.find((g) => g.groupName === groupName);
      if (!group) {
        group = { groupName, syncCount: 0, items: [] };
        groups.push(group);
      }
      group.syncCount += 1;
      group.items.push(entry);
    });

    return groups;
  }, [filteredEntries, visibleCount]);

  const handleLogClick = () => {
    if (!user && onOpenAuth) {
      onOpenAuth();
      return;
    }
    navigate('/editor');
  };

  const handleNavSelect = (navId: string) => {
    if (navId === 'spec') {
      if (onOpenSpec) onOpenSpec();
      else navigate('/spec');
    } else if (navId === 'hub') {
      navigate('/hub');
    } else if (navId === 'analytics') {
      navigate('/analytics');
    } else if (onSelectNav) {
      onSelectNav(navId);
    }
  };

  const handleOpenSpec = () => {
    if (onOpenSpec) onOpenSpec();
    else navigate('/spec');
  };

  const isAllLoaded = visibleCount >= filteredEntries.length && filteredEntries.length > 0;

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1E293B] font-sans flex flex-col selection:bg-emerald-500/20 selection:text-emerald-900 antialiased">
      {/* 1. Global Navigation Header Bar with Real Dynamic Streaks */}
      <ZeroStateHeader
        onLogClick={handleLogClick}
        onViewLanding={onViewLanding}
        activeNav="feed"
        onSelectNav={handleNavSelect}
        entries={entries}
        topics={topics}
      />

      {/* 2. Sub-Header & Telemetry Stream Bar */}
      <div className="border-b border-[#E5E0D8] bg-white/80 backdrop-blur-xs py-3 px-4 sm:px-6 lg:px-8 sticky top-16 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif font-bold text-lg sm:text-xl text-[#1E293B] tracking-tight">
                  Work Journal Feed
                </h1>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[#ECFDF5] text-[#006948] font-bold border border-emerald-200">
                  {entries.length} Captured
                </span>
              </div>
              <p className="text-xs text-[#505F76] hidden sm:block">
                Chronological engineering records with AI reliance tracking &amp; cognitive half-life decay.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Dynamic Telemetry Metric Overview & Filter Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2 w-full space-y-4">
        {/* Dynamic 3-Card Metric Overview Row */}
        <ZeroStateMetricCards entriesCount={entries.length} topics={topics} entries={entries} />

        {/* Filter & Search Controls Bar */}
        <div className="space-y-2.5">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-[#E5E0D8] shadow-2xs">
            {/* Search bar */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search concepts, topics, or notes..."
                className="w-full pl-9 pr-8 py-1.5 text-xs sm:text-sm bg-[#FAF8F5] border border-[#E5E0D8] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#006948] focus:border-[#006948] transition-all placeholder:text-slate-400"
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

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors whitespace-nowrap ${
                  activeFilter === 'all'
                    ? 'bg-[#006948] text-white shadow-2xs'
                    : 'bg-[#FAF8F5] text-slate-600 hover:text-slate-900 border border-[#E5E0D8]'
                }`}
              >
                All Journals
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('high_ai')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors whitespace-nowrap ${
                  activeFilter === 'high_ai'
                    ? 'bg-[#006948] text-white shadow-2xs'
                    : 'bg-[#FAF8F5] text-slate-600 hover:text-slate-900 border border-[#E5E0D8]'
                }`}
              >
                High AI Reliance
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('decay_flagged')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors whitespace-nowrap ${
                  activeFilter === 'decay_flagged'
                    ? 'bg-[#006948] text-white shadow-2xs'
                    : 'bg-[#FAF8F5] text-slate-600 hover:text-slate-900 border border-[#E5E0D8]'
                }`}
              >
                Decay Risk
              </button>
            </div>
          </div>

          {/* Category Tag Quick Selection Cloud */}
          {availableTags.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto py-1 px-1 text-xs font-mono no-scrollbar">
              <span className="text-[10px] uppercase font-bold text-[#505F76] shrink-0 mr-1 flex items-center gap-1">
                <Tag className="w-3 h-3 text-[#006948]" />
                Filter by Tags:
              </span>
              {availableTags.map((tag) => {
                const isSelected = selectedTags.some((st) => st.toLowerCase() === tag.toLowerCase());
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleToggleTag(tag)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] transition-all cursor-pointer whitespace-nowrap ${
                      isSelected
                        ? 'bg-[#006948] text-white font-bold shadow-2xs border border-[#006948]'
                        : 'bg-[#FAF8F5] hover:bg-[#F0F3FF] text-[#505F76] hover:text-[#1E293B] border border-[#E5E0D8]'
                    }`}
                  >
                    <span>#{tag}</span>
                    {isSelected && <X className="w-3 h-3 ml-0.5" />}
                  </button>
                );
              })}
            </div>
          )}

          {/* Active Filter Indicators & Deselect Chips */}
          {(selectedTags.length > 0 || searchQuery || activeFilter !== 'all') && (
            <div className="flex flex-wrap items-center gap-2 px-1 text-xs">
              <span className="font-mono text-[#505F76] font-semibold text-[11px] uppercase tracking-wider">
                Active Filters:
              </span>

              {/* Selected Tag Chips with (x) deselect */}
              {selectedTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#ECFDF5] border border-emerald-300 text-[#006948] font-mono text-xs font-bold shadow-2xs"
                >
                  <span>#{tag}</span>
                  <button
                    type="button"
                    onClick={() => handleToggleTag(tag)}
                    className="hover:text-red-600 transition-colors cursor-pointer p-0.5"
                    title={`Deselect #${tag}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              {searchQuery && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FAF8F5] border border-[#E5E0D8] text-slate-800 font-mono text-xs shadow-2xs">
                  <span>&quot;{searchQuery}&quot;</span>
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="hover:text-red-600 transition-colors cursor-pointer p-0.5"
                    title="Clear search"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {activeFilter !== 'all' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FFF8ED] border border-amber-300 text-[#8D4B00] font-mono text-xs font-bold shadow-2xs">
                  <span>{activeFilter === 'high_ai' ? 'High AI Reliance' : 'Decay Risk'}</span>
                  <button
                    type="button"
                    onClick={() => setActiveFilter('all')}
                    className="hover:text-red-600 transition-colors cursor-pointer p-0.5"
                    title="Reset filter"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              <button
                type="button"
                onClick={() => {
                  setSelectedTags([]);
                  setSearchQuery('');
                  setActiveFilter('all');
                }}
                className="text-xs text-[#505F76] hover:text-red-600 font-medium underline ml-1 cursor-pointer"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 4. Main Progressive Journal Feed Stream */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex-1 w-full space-y-6">
        {filteredEntries.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E5E0D8] p-12 text-center shadow-2xs">
            <BookOpen className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <h3 className="font-serif font-bold text-lg text-[#1E293B]">
              No journals match your filter
            </h3>
            <p className="font-sans text-xs text-[#505F76] mt-1 max-w-md mx-auto">
              Try resetting your search query or clearing active tags to review all captured engineering logs.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedTags([]);
                setActiveFilter('all');
              }}
              className="mt-4 px-4 py-2 bg-[#006948] text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs"
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
                    selectedTags={selectedTags}
                    onSelectConcept={(concept) => handleToggleTag(concept)}
                    onOpenRecallDiagnostic={() => {
                      if (onSelectNav) {
                        onSelectNav('hub');
                      } else {
                        navigate('/hub');
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
      </main>

      {/* 5. Full-Width Unified Application Footer */}
      <AppFooter onOpenSpec={handleOpenSpec} />
    </div>
  );
};

