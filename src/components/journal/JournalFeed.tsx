/**
 * CARE - JournalFeed Component
 * Displays recent Data Science work journals, AI reliance telemetry badges,
 * and extracted canonical concept pills.
 */

import React, { useState } from 'react';
import {
  BookOpen,
  Bot,
  Terminal,
  Code2,
  Wand2,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
  Cpu,
} from 'lucide-react';
import { JournalEntry, AiAssistanceLevel, ExtractedConcept } from '../../types';

interface JournalFeedProps {
  entries: JournalEntry[];
  isLoading?: boolean;
  onSelectConcept?: (concept: ExtractedConcept) => void;
}

const AI_LEVEL_CONFIG: Record<
  AiAssistanceLevel,
  { label: string; color: string; icon: React.ComponentType<{ className?: string }> }
> = {
  none: {
    label: 'Manual (Zero AI)',
    color: 'bg-stone-800 text-stone-300 border-stone-700',
    icon: Code2,
  },
  prompt_driven: {
    label: 'Prompt-Driven',
    color: 'bg-sky-950/60 text-sky-300 border-sky-800/60',
    icon: Terminal,
  },
  spec_driven: {
    label: 'Spec-Driven',
    color: 'bg-amber-950/60 text-amber-300 border-amber-800/60',
    icon: Wand2,
  },
  agentic: {
    label: 'Agentic / Autonomous',
    color: 'bg-purple-950/60 text-purple-300 border-purple-800/60',
    icon: Bot,
  },
};

export const JournalFeed: React.FC<JournalFeedProps> = ({
  entries,
  isLoading,
  onSelectConcept,
}) => {
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);

  const toggleExpand = (entryId: string) => {
    setExpandedEntryId((prev) => (prev === entryId ? null : entryId));
  };

  if (isLoading) {
    return (
      <div className="bg-stone-900 border border-stone-800 rounded-xl p-6 text-center">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-stone-800 rounded w-1/3 mx-auto" />
          <div className="h-16 bg-stone-850 rounded" />
          <div className="h-16 bg-stone-850 rounded" />
        </div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="bg-stone-900 border border-stone-800 rounded-xl p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-stone-800 flex items-center justify-center mx-auto mb-3 text-stone-400">
          <BookOpen className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-stone-200">No Journal Entries Recorded Yet</h3>
        <p className="text-xs text-stone-400 mt-1 max-w-sm mx-auto">
          Log your daily Data Science workflows, model tuning sessions, and code implementations to begin tracking concept decay.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => {
        const isExpanded = expandedEntryId === entry.entryId;
        const aiConfig = AI_LEVEL_CONFIG[entry.aiAssistanceLevel] || AI_LEVEL_CONFIG.prompt_driven;
        const AiIcon = aiConfig.icon;
        const dateFormatted = new Date(entry.createdAt).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });

        return (
          <div
            key={entry.entryId}
            id={`journal-entry-${entry.entryId}`}
            className="bg-stone-900 border border-stone-800 hover:border-stone-750 rounded-xl p-5 transition-all shadow-sm"
          >
            {/* Entry Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-stone-800 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-stone-100">{entry.title}</h3>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-stone-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-stone-500" />
                      {dateFormatted}
                    </span>
                    {entry.aiToolUsed && (
                      <span className="text-stone-400 font-mono">
                        via <span className="text-stone-300 font-medium">{entry.aiToolUsed}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                {/* AI Reliance Badge */}
                <div
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono border ${aiConfig.color}`}
                >
                  <AiIcon className="w-3.5 h-3.5" />
                  <span>{aiConfig.label}</span>
                </div>

                <button
                  type="button"
                  onClick={() => toggleExpand(entry.entryId)}
                  className="p-1.5 text-stone-400 hover:text-stone-200 rounded hover:bg-stone-800 transition-colors"
                  aria-label="Toggle notes"
                >
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Content Snippet / Full Content */}
            <div className="text-xs text-stone-300 leading-relaxed pl-10">
              {isExpanded ? (
                <div className="p-3 bg-stone-950 border border-stone-800 rounded-lg whitespace-pre-wrap font-mono text-[11px] text-stone-300 mb-3">
                  {entry.rawContent}
                </div>
              ) : (
                <p className="line-clamp-2 text-stone-400 mb-2.5">{entry.rawContent}</p>
              )}

              {/* Extracted Concepts Badges */}
              {entry.extractedConcepts && entry.extractedConcepts.length > 0 && (
                <div className="pt-2 border-t border-stone-800/80">
                  <div className="flex items-center gap-1.5 text-[11px] text-stone-400 mb-2">
                    <Layers className="w-3 h-3 text-emerald-400" />
                    <span>Extracted Concepts ({entry.extractedConcepts.length}):</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {entry.extractedConcepts.map((concept, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => onSelectConcept && onSelectConcept(concept)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-stone-850 hover:bg-stone-800 text-stone-200 border border-stone-750 hover:border-emerald-700/60 text-[11px] transition-colors group"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span className="font-medium group-hover:text-emerald-300">
                          {concept.canonicalName}
                        </span>
                        <span className="text-[10px] text-stone-500 font-mono">
                          [{concept.category}]
                        </span>
                        <span className="text-[10px] text-stone-400 font-mono bg-stone-800 px-1 rounded">
                          {(concept.importanceScore * 100).toFixed(0)}%
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
