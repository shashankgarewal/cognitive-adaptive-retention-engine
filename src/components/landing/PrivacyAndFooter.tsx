/**
 * CARE - PrivacyAndFooter Component
 * Includes Developer Privacy Pledge and unified v0.1 rounded telemetry status footer card.
 */

import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface PrivacyAndFooterProps {
  onSignInClick?: () => void;
}

export const PrivacyAndFooter: React.FC<PrivacyAndFooterProps> = () => {
  return (
    <footer id="security" className="mt-8 sm:mt-10 border-t border-slate-200/80 bg-slate-50/70 pt-8 sm:pt-10 pb-8 scroll-mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
        {/* Full-width Privacy Pledge Banner Card */}
        <div className="relative bg-emerald-50/90 border border-emerald-200/90 rounded-2xl p-5 sm:p-7 shadow-xs overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-100/90 border border-emerald-300/80 flex items-center justify-center text-emerald-700 shrink-0 shadow-2xs">
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>

            <div className="space-y-1 flex-1 text-left">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-mono font-bold tracking-wider text-emerald-800 uppercase">
                  Strict Developer Privacy Pledge
                </span>
                <span className="text-emerald-400">•</span>
                <span className="text-[11px] font-mono text-emerald-700 font-medium">
                  Zero-Knowledge Telemetry
                </span>
              </div>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Your intellectual property stays strictly isolated.
              </h3>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed max-w-4xl">
                Data paths are isolated to <code className="bg-emerald-100/70 px-1.5 py-0.5 rounded font-mono text-emerald-950 font-semibold text-[11px]">/users/{'{uid}'}/journal_entries</code>. Your proprietary code and commit context are never used for public foundation model training.
              </p>
            </div>
          </div>
        </div>

        {/* Final Rounded Telemetry Status Footer Card */}
        <div
          id="telemetry-status-footer"
          className="w-full rounded-[12px] bg-[#F1F5F9] border border-[#E2E8F0] px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all"
        >
          {/* Left Column */}
          <div className="space-y-1 text-left">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-sm tracking-tight">CARE</span>
              <span className="text-xs text-slate-600 font-normal">Cognitive & Adaptive Retention Engine</span>
            </div>
            <p className="text-xs text-slate-500">
              AI that <span className="text-[#059669] font-bold">cares</span> about Human Expertise. Counteracting AI-assisted cognitive decay.
            </p>
          </div>

          {/* Right Column */}
          <div className="flex items-center gap-3 shrink-0 font-mono text-xs text-slate-500">
            <span className="px-2.5 py-1 rounded-md bg-white text-slate-700 font-mono text-[11px] font-medium border border-slate-200 shadow-2xs">
              v0.1-telemetry-online
            </span>
            <span>© 2026 CARE Engine</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
