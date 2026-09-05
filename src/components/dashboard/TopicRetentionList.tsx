/**
 * CARE - TopicRetentionList Component
 * Displays calibrated topic retention states, priority rankings,
 * and mathematical decay heuristics from extracted journal concepts.
 */

import React from 'react';
import {
  Brain,
  Layers,
  Flame,
  Clock,
  Sparkles,
  ArrowUpRight,
  Info,
} from 'lucide-react';
import { TopicRetentionState } from '../../types';

interface TopicRetentionListProps {
  topics: TopicRetentionState[];
  isLoading?: boolean;
  onInitiateRecall?: (topic: TopicRetentionState) => void;
}

export const TopicRetentionList: React.FC<TopicRetentionListProps> = ({
  topics,
  isLoading,
  onInitiateRecall,
}) => {
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
      {topics.map((topic, index) => {
        // Priority color hierarchy
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

        return (
          <div
            key={topic.topicId}
            id={`topic-state-${topic.topicId}`}
            className="bg-stone-900 border border-stone-800 hover:border-stone-750 rounded-xl p-4 sm:p-5 transition-all shadow-sm"
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
                  </div>

                  <div className="flex items-center gap-3 mt-1.5 text-[11px] text-stone-400 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-stone-500" />
                      Last logged: {lastLoggedDate}
                    </span>
                    <span>•</span>
                    <span>Occurrences: <strong className="text-stone-300 font-mono">{topic.journalOccurrences}</strong></span>
                    <span>•</span>
                    <span>
                      AI signal weight: <strong className="text-stone-300 font-mono">{(topic.effectiveAiAssistanceWeight * 100).toFixed(0)}%</strong>
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
                  className="px-3 py-2 rounded-lg bg-stone-800 hover:bg-emerald-600 hover:text-stone-950 text-stone-200 text-xs font-medium border border-stone-700 hover:border-emerald-500 transition-all flex items-center gap-1.5 group"
                  title="Prepare Socratic recall interview"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400 group-hover:text-stone-950 transition-colors" />
                  <span>Recall Interview</span>
                  <ArrowUpRight className="w-3 h-3 text-stone-400 group-hover:text-stone-950" />
                </button>
              </div>
            </div>

            {/* Heuristic Explanation / Formula breakdown */}
            {topic.explanationReason && (
              <div className="mt-3 pt-2.5 border-t border-stone-800/60 flex items-center gap-2 text-[11px] font-mono text-stone-400">
                <Info className="w-3 h-3 text-stone-500 shrink-0" />
                <span className="truncate">Formula: {topic.explanationReason}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
