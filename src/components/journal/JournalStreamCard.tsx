import React from 'react';
import {
  Globe,
  GitPullRequest,
  Terminal,
  Code2,
  Clock,
  ArrowRight,
  CheckCircle2,
  Bot,
  Laptop,
} from 'lucide-react';
import { JournalEntry } from '../../types';

interface JournalStreamCardProps {
  entry: JournalEntry;
  onSelectConcept?: (conceptName: string) => void;
  onOpenRecallDiagnostic?: (entry: JournalEntry) => void;
}

export const JournalStreamCard: React.FC<JournalStreamCardProps> = ({
  entry,
  onSelectConcept,
  onOpenRecallDiagnostic,
}) => {
  // Determine Mode Type Icon and Label
  const modeLabel = entry.modeType || (entry.aiToolUsed ? `Logged via ${entry.aiToolUsed}` : 'Logged via Web App');
  
  const getModeIcon = () => {
    const lower = modeLabel.toLowerCase();
    if (lower.includes('github') || lower.includes('pr')) {
      return <GitPullRequest className="w-3.5 h-3.5 text-slate-500" />;
    }
    if (lower.includes('cli') || lower.includes('terminal')) {
      return <Terminal className="w-3.5 h-3.5 text-slate-500" />;
    }
    if (lower.includes('cursor') || lower.includes('vs code')) {
      return <Code2 className="w-3.5 h-3.5 text-slate-500" />;
    }
    return <Laptop className="w-3.5 h-3.5 text-slate-500" />;
  };

  // AI Reliance styling and percentage
  const reliancePercent =
    entry.aiReliancePercentage ??
    (entry.aiAssistanceLevel === 'agentic'
      ? 85
      : entry.aiAssistanceLevel === 'spec_driven'
      ? 75
      : entry.aiAssistanceLevel === 'prompt_driven'
      ? 45
      : 12);

  const isHighReliance = reliancePercent >= 70;
  const isModerateReliance = reliancePercent >= 35 && reliancePercent < 70;

  const stability = entry.stabilityRatio ?? (isHighReliance ? 0.34 : isModerateReliance ? 0.65 : 0.88);
  const isDecaying = stability < 0.55;

  return (
    <article
      id={`journal-stream-card-${entry.entryId}`}
      className="bg-white rounded-2xl border border-[#E5E0D8] p-5 sm:p-6 shadow-2xs hover:shadow-xs transition-all space-y-3.5 relative group"
    >
      {/* Top Header Row: Mode, AI Reliance Badge, Stability Ratio Sparkline */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Mode Type & AI Reliance Badge */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Mode Badge: Logged via <mode-type> */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#FAF8F5] border border-[#E5E0D8] text-[#505F76] font-mono text-xs">
            {getModeIcon()}
            <span className="font-medium text-[#1E293B]">{modeLabel.startsWith('Logged via') ? modeLabel : `Logged via ${modeLabel}`}</span>
          </div>

          {/* AI Reliance Pill */}
          {isHighReliance ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#FFF8ED] border border-amber-300 text-[#8D4B00] font-mono text-xs font-bold uppercase tracking-wider">
              HIGH AI RELIANCE — {reliancePercent}%
            </span>
          ) : isModerateReliance ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#ECFDF5] border border-emerald-300 text-[#006948] font-mono text-xs font-bold uppercase tracking-wider">
              MODERATE AI RELIANCE — {reliancePercent}%
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#F1F5F9] border border-slate-300 text-[#334155] font-mono text-xs font-bold uppercase tracking-wider">
              LOW AI RELIANCE — {reliancePercent}%
            </span>
          )}
        </div>

        {/* Right: Stability Ratio Box with Mini SVG Sparkline */}
        <div className="flex items-center gap-2">
          <div className="flex flex-col items-end">
            <span className="text-[9px] font-mono font-semibold uppercase tracking-wider text-[#505F76]">
              STABILITY RATIO
            </span>
            <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded bg-[#F0F3FF] border border-[#E7EEFF]">
              <span className="font-mono text-xs font-bold text-[#1E293B]">
                {stability.toFixed(2)} S(t)
              </span>
              {/* Mini Sparkline Curve */}
              <svg className="w-10 h-4" viewBox="0 0 40 16" fill="none">
                {isDecaying ? (
                  // Downward decay curve in amber
                  <path
                    d="M2 3 Q 20 5, 38 13"
                    stroke="#D97706"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                ) : (
                  // Upward stable curve in emerald
                  <path
                    d="M2 13 Q 20 10, 38 3"
                    stroke="#006948"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                )}
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Title */}
      <h2 className="font-sans font-bold text-lg sm:text-xl text-[#1E293B] tracking-tight hover:text-[#006948] transition-colors cursor-pointer">
        {entry.title}
      </h2>

      {/* Optional Kernel / Technical Snapshot Bar */}
      {(entry.kernelProfileSnapshot || entry.hardwareProfile) && (
        <div className="flex items-center justify-between py-1 px-2.5 rounded bg-[#FAF8F5] border border-[#E5E0D8] font-mono text-[10px] text-[#505F76] font-semibold">
          <span>{entry.kernelProfileSnapshot || 'KERNEL PROFILE SNAPSHOT'}</span>
          <span>{entry.hardwareProfile || 'SRAM TILE: 128x128 FP16'}</span>
        </div>
      )}

      {/* Content Body */}
      <p className="font-sans text-xs sm:text-sm text-[#334155] leading-relaxed">
        {entry.rawContent}
      </p>

      {/* Bottom Footer Row: Tags (Left) & UTC Time / Action (Right) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-[#F0ECE6]">
        {/* Concept Tags */}
        <div className="flex flex-wrap items-center gap-1.5">
          {entry.tags && entry.tags.length > 0 ? (
            entry.tags.map((tag, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onSelectConcept && onSelectConcept(tag.replace('#', ''))}
                className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#F0F3FF] hover:bg-emerald-50 border border-[#E7EEFF] hover:border-emerald-200 text-[#1E293B] font-mono text-[11px] font-medium transition-colors cursor-pointer"
              >
                {tag.startsWith('#') ? tag : `#${tag}`}
              </button>
            ))
          ) : (
            (entry.extractedConcepts || []).map((concept, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onSelectConcept && onSelectConcept(concept.canonicalName)}
                className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#F0F3FF] hover:bg-emerald-50 border border-[#E7EEFF] hover:border-emerald-200 text-[#1E293B] font-mono text-[11px] font-medium transition-colors cursor-pointer"
              >
                #{concept.canonicalName}
              </button>
            ))
          )}
        </div>

        {/* Timestamp & Diagnostic Action */}
        <div className="flex items-center gap-2 font-mono text-xs text-[#505F76] shrink-0 self-end sm:self-auto">
          <Clock className="w-3 h-3 text-[#505F76]" />
          <span>{entry.timeUtc || new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) + ' UTC'}</span>
          <span className="text-slate-300">•</span>
          {entry.actionLabel === 'Stable' ? (
            <span className="inline-flex items-center gap-1 text-[#006948] font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Stable
            </span>
          ) : (
            <button
              type="button"
              onClick={() => onOpenRecallDiagnostic && onOpenRecallDiagnostic(entry)}
              className="inline-flex items-center gap-1 text-[#006948] hover:text-[#005439] font-semibold hover:underline cursor-pointer"
            >
              <span>{entry.actionLabel || 'Recall Diagnostic'}</span>
              {!entry.actionLabel?.includes('→') && <span>&rarr;</span>}
            </button>
          )}
        </div>
      </div>
    </article>
  );
};
