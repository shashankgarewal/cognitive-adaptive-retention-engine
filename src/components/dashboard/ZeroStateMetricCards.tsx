/**
 * CARE - ZeroStateMetricCards Component
 * 3-Card 0-State Metric Overview Row:
 * 1. Journal Volume: "0 Entries" | "Ready for initial engineering log"
 * 2. Knowledge Graph: "0 Topics" | "Concept graph idle · 0 nodes indexed"
 * 3. Cognitive Stability: "0 Topics At Risk" | "No decay detected · Baseline pristine"
 */

import React from 'react';
import { BookOpen, Network, ShieldCheck, ArrowUpRight } from 'lucide-react';

export const ZeroStateMetricCards: React.FC = () => {
  const cards = [
    {
      id: 'journal-volume',
      title: 'Journal Volume',
      value: '0 Entries',
      status: 'Ready for initial engineering log',
      icon: BookOpen,
      iconBg: 'bg-[#F0F3FF]',
      iconColor: 'text-[#006948]',
      badge: 'IDLE',
      badgeColor: 'bg-slate-100 text-[#505F76] border-slate-200',
    },
    {
      id: 'knowledge-graph',
      title: 'Knowledge Graph',
      value: '0 Topics',
      status: 'Concept graph idle · 0 nodes indexed',
      icon: Network,
      iconBg: 'bg-[#F3EFEA]',
      iconColor: 'text-[#8D4B00]',
      badge: 'PENDING',
      badgeColor: 'bg-[#FFF8ED] text-[#8D4B00] border-amber-200',
    },
    {
      id: 'cognitive-stability',
      title: 'Cognitive Stability',
      value: '0 Topics At Risk',
      status: 'No decay detected · Baseline pristine',
      icon: ShieldCheck,
      iconBg: 'bg-[#ECFDF5]',
      iconColor: 'text-[#006948]',
      badge: 'STABLE',
      badgeColor: 'bg-emerald-50 text-[#006948] border-emerald-200',
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
            className="bg-white rounded-2xl border border-[#E5E0D8] p-4 sm:p-5 shadow-xs hover:border-[#D5CFC6] hover:shadow-sm transition-all text-left flex flex-col justify-between group"
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
