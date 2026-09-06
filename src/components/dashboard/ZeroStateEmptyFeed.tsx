/**
 * CARE - ZeroStateEmptyFeed Component
 * Empty Feed Container:
 * - Centered SVG notebook graphic with an animated memory radar pulsing ring
 * - Title: "Your Work Journal is currently empty"
 * - Description: Prompting user to record technical decisions and track AI reliance
 * - Primary CTA: Large #006948 emerald button "+ Log First Journal Entry"
 * - Secondary Quick Links:
 *    - "How does CARE detect AI reliance?"
 *    - "Read Security & UID Isolation Spec"
 *    - "View Quickstart Guide"
 */

import React from 'react';
import { Plus, HelpCircle, Shield, BookOpen, Sparkles } from 'lucide-react';

interface ZeroStateEmptyFeedProps {
  onLogClick: () => void;
  onOpenAiRelianceInfo: () => void;
  onOpenSecuritySpec: () => void;
  onOpenQuickstart: () => void;
}

export const ZeroStateEmptyFeed: React.FC<ZeroStateEmptyFeedProps> = ({
  onLogClick,
  onOpenAiRelianceInfo,
  onOpenSecuritySpec,
  onOpenQuickstart,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-[#E5E0D8] p-8 sm:p-12 text-center shadow-xs flex flex-col items-center justify-center space-y-6 relative overflow-hidden">
      {/* Centered SVG notebook graphic with animated memory radar pulsing ring */}
      <div className="relative w-36 h-36 flex items-center justify-center">
        {/* Concentric Radar Pulsing Rings */}
        <div className="absolute inset-0 rounded-full border border-emerald-500/20 bg-emerald-50/40 animate-ping opacity-75" />
        <div className="absolute -inset-4 rounded-full border border-emerald-500/10 bg-emerald-50/20 animate-pulse" />
        <div className="absolute -inset-8 rounded-full border border-dashed border-emerald-500/15" />

        {/* Notebook Graphics Container */}
        <div className="relative z-10 w-24 h-24 rounded-2xl bg-[#FAF8F5] border-2 border-[#E5E0D8] shadow-md flex items-center justify-center">
          <svg
            className="w-14 h-14 text-[#006948]"
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Notebook Base */}
            <rect
              x="12"
              y="10"
              width="40"
              height="44"
              rx="4"
              fill="#FFFFFF"
              stroke="#1E293B"
              strokeWidth="2.5"
            />
            {/* Spine */}
            <path
              d="M18 10V54"
              stroke="#006948"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {/* Ruled lines */}
            <line
              x1="24"
              y1="20"
              x2="44"
              y2="20"
              stroke="#E5E0D8"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <line
              x1="24"
              y1="27"
              x2="44"
              y2="27"
              stroke="#E5E0D8"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <line
              x1="24"
              y1="34"
              x2="38"
              y2="34"
              stroke="#E5E0D8"
              strokeWidth="2"
              strokeLinecap="round"
            />
            {/* Pulsing Radar Node in center of book */}
            <circle cx="34" cy="42" r="4.5" fill="#006948" />
            <circle cx="34" cy="42" r="7.5" stroke="#006948" strokeWidth="1" strokeDasharray="2 2" />
          </svg>

          {/* Active scanning micro-chip */}
          <div className="absolute -bottom-1.5 -right-1.5 px-1.5 py-0.5 rounded bg-[#006948] text-white font-mono text-[9px] font-bold shadow-2xs">
            RADAR IDLE
          </div>
        </div>
      </div>

      {/* Title & Description */}
      <div className="space-y-2 max-w-md mx-auto">
        <h3 className="font-serif text-2xl sm:text-[26px] font-bold text-[#1E293B] tracking-tight">
          Your Work Journal is currently empty
        </h3>
        <p className="text-sm text-[#505F76] leading-relaxed font-sans">
          Record technical decisions, architecture designs, and code refactors. CARE extracts key mental models and tracks your AI reliance score to schedule personalized active recall drills before knowledge decays.
        </p>
      </div>

      {/* Primary CTA: Large #006948 emerald button */}
      <div className="pt-2">
        <button
          id="btn-zero-state-log-first-journal"
          type="button"
          onClick={onLogClick}
          className="py-3 px-6 sm:px-8 rounded-xl bg-[#006948] hover:bg-[#005439] text-white font-medium text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-sm transition-all hover:shadow-md cursor-pointer group"
        >
          <Plus className="w-5 h-5 text-white group-hover:rotate-90 transition-transform" />
          <span>+ Log First Journal Entry</span>
        </button>
      </div>

      {/* Secondary Quick Links */}
      <div className="pt-4 border-t border-[#F0ECE6] w-full max-w-lg">
        <div className="text-[11px] font-mono uppercase tracking-wider text-[#505F76] mb-3 font-semibold">
          Explore System Specifications
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onOpenAiRelianceInfo}
            className="px-3 py-1.5 rounded-lg bg-[#FAF8F5] hover:bg-[#F3EFEA] border border-[#E5E0D8] text-xs text-[#1E293B] hover:text-[#006948] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 text-[#505F76]" />
            <span>How does CARE detect AI reliance?</span>
          </button>

          <button
            type="button"
            onClick={onOpenSecuritySpec}
            className="px-3 py-1.5 rounded-lg bg-[#FAF8F5] hover:bg-[#F3EFEA] border border-[#E5E0D8] text-xs text-[#1E293B] hover:text-[#006948] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Shield className="w-3.5 h-3.5 text-[#505F76]" />
            <span>Read Security & UID Isolation Spec</span>
          </button>

          <button
            type="button"
            onClick={onOpenQuickstart}
            className="px-3 py-1.5 rounded-lg bg-[#FAF8F5] hover:bg-[#F3EFEA] border border-[#E5E0D8] text-xs text-[#1E293B] hover:text-[#006948] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#505F76]" />
            <span>View Quickstart Guide</span>
          </button>
        </div>
      </div>
    </div>
  );
};
