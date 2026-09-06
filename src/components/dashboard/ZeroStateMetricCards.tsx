/**
 * CARE - ZeroStateMetricCards Component
 * 3-Card Dynamic Metric Overview Row:
 * 1. Journal Volume: Dynamic volume & AI reliance count
 * 2. Knowledge Graph: Indexed topic nodes
 * 3. Cognitive Stability: Active decay detection & baseline status
 */

import React from 'react';
import { BookOpen, Network, ShieldCheck, ArrowUpRight } from 'lucide-react';
import { JournalEntry, TopicRetentionState } from '../../types';

interface ZeroStateMetricCardsProps {
  entriesCount?: number;
  topics?: TopicRetentionState[];
  entries?: JournalEntry[];
  onCardClick?: (cardId: string) => void;
}

export const ZeroStateMetricCards: React.FC<ZeroStateMetricCardsProps> = ({
  entriesCount: propEntriesCount,
  topics = [],
  entries = [],
  onCardClick,
}) => {
  const journalCount = propEntriesCount !== undefined ? propEntriesCount : entries.length;
  const topicsCount = topics.length;

  const highAiCount = entries.filter((e) => {
    const reliance =
      e.aiReliancePercentage ??
      (e.aiAssistanceLevel === 'agentic'
        ? 85
        : e.aiAssistanceLevel === 'spec_driven'
        ? 75
        : e.aiAssistanceLevel === 'prompt_driven'
        ? 45
        : 15);
    return reliance >= 60;
  }).length;

  const atRiskTopics = topics.filter((t) => {
    const score = t.retentionScore ?? t.stabilityRatio ?? 1;
    return score < 0.65;
  }).length;

  const cards = [
    {
      id: 'journal-volume',
      title: 'Journal Volume',
      value: `${journalCount} Entr${journalCount === 1 ? 'y' : 'ies'}`,
      status:
        journalCount === 0
          ? 'Ready for initial engineering log'
          : `${highAiCount} logged with AI assistance tracking`,
      icon: BookOpen,
      iconBg: 'bg-[#F0F3FF]',
      iconColor: 'text-[#006948]',
      badge: journalCount === 0 ? 'IDLE' : 'ACTIVE',
      badgeColor:
        journalCount === 0
          ? 'bg-slate-100 text-[#505F76] border-slate-200'
          : 'bg-emerald-50 text-[#006948] border-emerald-200',
    },
    {
      id: 'knowledge-graph',
      title: 'Knowledge Graph',
      value: `${topicsCount} Topic${topicsCount === 1 ? '' : 's'}`,
      status:
        topicsCount === 0
          ? 'Concept graph idle · 0 nodes indexed'
          : `${topicsCount} domain topic${topicsCount > 1 ? 's' : ''} mapped in graph`,
      icon: Network,
      iconBg: 'bg-[#F3EFEA]',
      iconColor: 'text-[#8D4B00]',
      badge: topicsCount === 0 ? 'PENDING' : 'SYNCED',
      badgeColor:
        topicsCount === 0
          ? 'bg-[#FFF8ED] text-[#8D4B00] border-amber-200'
          : 'bg-[#F0F3FF] text-[#1E293B] border-[#CCD8FF]',
    },
    {
      id: 'cognitive-stability',
      title: 'Cognitive Stability',
      value: `${atRiskTopics} Topic${atRiskTopics === 1 ? '' : 's'} At Risk`,
      status:
        atRiskTopics === 0
          ? 'No decay detected · Baseline pristine'
          : `${atRiskTopics} require Socratic recall reinforcement`,
      icon: ShieldCheck,
      iconBg: atRiskTopics > 0 ? 'bg-amber-50' : 'bg-[#ECFDF5]',
      iconColor: atRiskTopics > 0 ? 'text-[#8D4B00]' : 'text-[#006948]',
      badge: atRiskTopics > 0 ? 'DECAY DETECTED' : 'STABLE',
      badgeColor:
        atRiskTopics > 0
          ? 'bg-[#FFF8ED] text-[#8D4B00] border-amber-200'
          : 'bg-emerald-50 text-[#006948] border-emerald-200',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            id={`metric-card-${card.id}`}
            onClick={() => onCardClick && onCardClick(card.id)}
            className={`bg-white rounded-2xl border border-[#E5E0D8] p-4 sm:p-5 shadow-xs hover:border-[#D5CFC6] hover:shadow-sm transition-all text-left flex flex-col justify-between group ${
              onCardClick ? 'cursor-pointer' : ''
            }`}
          >
            <div>
              {/* Header row with Icon and Badge */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <div
                  className={`w-9 h-9 rounded-xl ${card.iconBg} ${card.iconColor} flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border ${card.badgeColor}`}
                >
                  {card.badge}
                </span>
              </div>

              {/* Title label */}
              <div className="text-xs font-medium text-[#505F76] uppercase tracking-wider font-mono">
                {card.title}
              </div>

              {/* High-contrast metric value */}
              <div className="font-serif text-2xl sm:text-[28px] font-bold text-[#1E293B] mt-1 tracking-tight leading-tight">
                {card.value}
              </div>
            </div>

            {/* Bottom status subtext */}
            <div className="mt-4 pt-3 border-t border-[#F0ECE6] text-[11px] text-[#505F76] font-sans flex items-center justify-between">
              <span className="truncate">{card.status}</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#006948] transition-colors shrink-0 ml-1" />
            </div>
          </div>
        );
      })}
    </div>
  );
};

