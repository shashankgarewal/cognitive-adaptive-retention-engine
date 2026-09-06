/**
 * CARE - PrivacyAndFooter Component
 * Includes Developer Privacy Pledge section and unified full-width 2026 v0.1 footer.
 */

import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { AppFooter } from '../layout/AppFooter';

interface PrivacyAndFooterProps {
  onSignInClick?: () => void;
  onOpenSpec?: () => void;
}

export const PrivacyAndFooter: React.FC<PrivacyAndFooterProps> = ({ onOpenSpec }) => {
  return (
    <section id="security" className="mt-12 sm:mt-16 scroll-mt-16 flex flex-col">
      {/* Full-width Privacy Pledge Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full mb-12">
        <div className="relative bg-emerald-50/90 border border-emerald-200/90 rounded-2xl p-6 sm:p-8 shadow-xs overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100/90 border border-emerald-300/80 flex items-center justify-center text-emerald-700 shrink-0 shadow-2xs">
              <ShieldCheck className="w-6 h-6" />
            </div>

            <div className="space-y-1.5 flex-1 text-left">
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
      </div>

      {/* Unified Full-Width Edge-to-Edge Footer */}
      <AppFooter onOpenSpec={onOpenSpec} />
    </section>
  );
};
