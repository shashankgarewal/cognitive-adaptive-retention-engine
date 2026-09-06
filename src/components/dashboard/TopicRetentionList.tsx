/**
 * CARE - TopicRetentionList Component
 * Displays calibrated topic retention states, decay rankings,
 * sorting toggles (Priority, AI Reliance Signal, Recency),
 * mathematical components breakdown, and recall triggers.
 */

import React, { useState, useMemo } from 'react';
import {
  Brain,
  Layers,
  Flame,
  Clock,
  Sparkles,
  ArrowUpRight,
  Info,
  SlidersHorizontal,
  Cpu,
  Search,
  AlertTriangle,
} from 'lucide-react';
import { TopicRetentionState } from '../../types';

interface TopicRetentionListProps {
  topics: TopicRetentionState[];
  isLoading?: boolean;
  onInitiateRecall?: (topic: TopicRetentionState) => void;
  onOpenSelectModal?: () => void;
}

export const TopicRetentionList: React.FC<TopicRetentionListProps> = ({
  topics,
  isLoading,
  onInitiateRecall,
  onOpenSelectModal,
}) => {
  const [sortOption, setSortOption] = useState<'priority' | 'ai_signal' | 'recency'>('priority');

  const sortedTopics = useMemo(() => {
    const list = [...topics];
    if (sortOption === 'priority') {
      return list.sort((a, b) => b.currentPriorityScore - a.currentPriorityScore);
    } else if (sortOption === 'ai_signal') {
      return list.sort((a, b) => b.effectiveAiAssistanceWeight - a.effectiveAiAssistanceWeight);
    } else if (sortOption === 'recency') {
      return list.sort(
        (a, b) => new Date(b.lastLoggedAt).getTime() - new Date(a.lastLoggedAt).getTime()
      );
    }
    return list;
  }, [topics, sortOption]);

  if (isLoading) {
    return (
      <div className="bg-stone-900 border border-stone-800 rounded-xl p-6 text-center">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-stone-800 rounded w-1/3 mx-auto" />
          <div className="h-12 bg-stone-850 rounded" />
          <div className="h-12 bg-stone-850 rounded" />
        </div>
      </div>
    );
  }

  if (topics.length === 0) {
    return (
      <div className="bg-stone-900 border border-stone-800 rounded-xl p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-stone-800 flex items-center justify-center mx-auto mb-3 text-stone-400">
          <Brain className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-stone-200">No Retention Topics Initialized</h3>
        <p className="text-xs text-stone-400 mt-1 max-w-sm mx-auto">
          Log a journal entry above. CARE's Gemini concept extractor will automatically identify topics and compute decay priority queues.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Sorting Control Bar */}
      <div className="bg-stone-900 border border-stone-800 rounded-xl p-2.5 px-3.5 flex flex-wrap items-center justify-between gap-2.5 text-xs">
        <div className="flex items-center gap-2 text-stone-400">
          <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="font-medium text-[11px] uppercase tracking-wider text-stone-300">Sort By:</span>
          <div className="flex items-center gap-1">
            <button
              id="sort-btn-priority"
              type="button"
              onClick={() => setSortOption('priority')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                sortOption === 'priority'
                  ? 'bg-emerald-500 text-stone-950 font-semibold shadow-xs'
                  : 'bg-stone-800 text-stone-300 hover:bg-stone-750'
              }`}
            >
              Priority (Decay)
            </button>
            <button
              id="sort-btn-ai-signal"
              type="button"
              onClick={() => setSortOption('ai_signal')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                sortOption === 'ai_signal'
                  ? 'bg-emerald-500 text-stone-950 font-semibold shadow-xs'
                  : 'bg-stone-800 text-stone-300 hover:bg-stone-750'
              }`}
            >
              AI Reliance
            </button>
            <button
              id="sort-btn-recency"
              type="button"
              onClick={() => setSortOption('recency')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                sortOption === 'recency'
                  ? 'bg-emerald-500 text-stone-950 font-semibold shadow-xs'
                  : 'bg-stone-800 text-stone-300 hover:bg-stone-750'
              }`}
            >
              Recency
            </button>
          </div>
        </div>

        {onOpenSelectModal && (
          <button
            id="btn-open-topic-picker"
            type="button"
            onClick={onOpenSelectModal}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 transition-colors"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search All Topics</span>
          </button>
        )}
      </div>

      {/* Topics List */}
      <div className="space-y-3">
        {sortedTopics.map((topic, index) => {
          const score = topic.currentPriorityScore;
          const isUrgent = score >= 60;
          const isModerate = score >= 35 && score < 60;

          const priorityBadgeColor = isUrgent
            ? 'bg-rose-950/60 text-rose-300 border-rose-800/80'
            : isModerate
            ? 'bg-amber-950/60 text-amber-300 border-amber-800/80'
            : 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80';

          const lastLoggedDate = new Date(topic.lastLoggedAt).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
          });

          // Compute Rationale Badge
          const aiSignal = topic.effectiveAiAssistanceWeight || 0.5;
          const lastEvent = topic.lastRecallAt || topic.lastLoggedAt;
          const elapsedDays = Math.max(0.1, (Date.now() - new Date(lastEvent).getTime()) / (1000 * 86400));
          let rationaleBadge = 'Stable Baseline';
          if (aiSignal >= 0.75) rationaleBadge = 'High AI Reliance';
          else if (elapsedDays >= 5.0) rationaleBadge = 'Time Decay Alert';
          else if (score >= 50.0) rationaleBadge = 'High Priority Decay';
          else if (topic.journalOccurrences >= 3) rationaleBadge = 'High Frequency Focus';

          return (
            <div
              key={topic.topicId}
              id={`topic-state-${topic.topicId}`}
              className="bg-stone-900 border border-stone-800 hover:border-stone-750 rounded-xl p-4 sm:p-5 transition-all shadow-sm space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-md bg-stone-800 text-stone-300 font-mono text-xs flex items-center justify-center shrink-0 mt-0.5">
                    #{index + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-semibold text-stone-100">{topic.canonicalName}</h4>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-850 text-stone-400 border border-stone-750 uppercase">
                        {topic.category}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 font-medium">
                        {rationaleBadge}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-stone-400 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-stone-500" />
                        Last logged: {lastLoggedDate}
                      </span>
                      <span>•</span>
                      <span>
                        Occurrences: <strong className="text-stone-300 font-mono">{topic.journalOccurrences}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        AI signal: <strong className="text-stone-300 font-mono">{(aiSignal * 100).toFixed(0)}%</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Priority Score & Action */}
                <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                  <div className="text-right">
                    <div className="text-[10px] uppercase font-mono text-stone-500">Decay Priority</div>
                    <div className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-mono font-bold border ${priorityBadgeColor}`}>
                      {isUrgent && <Flame className="w-3 h-3 text-rose-400" />}
                      <span>{score.toFixed(1)} / 100</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    id={`btn-recall-${topic.topicId}`}
                    onClick={() => onInitiateRecall && onInitiateRecall(topic)}
                    className="px-3.5 py-2 rounded-lg bg-stone-800 hover:bg-emerald-500 hover:text-stone-950 text-stone-200 text-xs font-semibold border border-stone-700 hover:border-emerald-500 transition-all flex items-center gap-1.5 group shadow-xs"
                    title="Inspect decay math and initiate active recall session"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400 group-hover:text-stone-950 transition-colors" />
                    <span>Recall Interview</span>
                    <ArrowUpRight className="w-3 h-3 text-stone-400 group-hover:text-stone-950" />
                  </button>
                </div>
              </div>

              {/* Heuristic Fragility & Loss Risk */}
              {(topic.fragileSubconcept || topic.explanationReason) && (
                <div className="pt-2 border-t border-stone-800/60 flex items-start gap-2 text-[11px] font-mono text-stone-400">
                  <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                  <div className="leading-snug min-w-0">
                    <span className="text-amber-400 font-semibold">Fragile Nuance: </span>
                    <span className="text-stone-300">
                      {topic.fragileSubconcept ||
                        (topic.explanationReason?.startsWith('T(t)=') ? 'Algorithmic invariants and edge cases' : topic.explanationReason)}
                    </span>
                    {topic.cognitiveLossRisk && (
                      <div className="text-rose-400/90 text-[10px] mt-0.5">
                        <span className="font-semibold text-rose-400">Loss Risk: </span>
                        <span>{topic.cognitiveLossRisk}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
