/**
 * CARE - Unified Application Footer
 * Streamlined, low-height full-width edge-to-edge footer.
 * Single-line brand mission statement: CARE • Cognitive & Adaptive Retention Engine • AI that cares about human expertise.
 */

import React from 'react';
import { Terminal } from 'lucide-react';

interface AppFooterProps {
  onOpenSpec?: () => void;
}

export const AppFooter: React.FC<AppFooterProps> = () => {
  return (
    <footer
      id="app-footer"
      className="w-full border-t border-slate-200/80 bg-slate-50/90 py-3.5 sm:py-4 transition-colors mt-auto text-left"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand & Mission in the exact same line */}
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-2.5 gap-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-emerald-50 border border-emerald-300 flex items-center justify-center text-emerald-700 shadow-2xs shrink-0">
              <Terminal className="w-3 h-3" />
            </div>
            <span className="font-semibold text-slate-900 tracking-tight text-xs">CARE</span>
          </div>
          <span className="text-slate-300 hidden sm:inline">•</span>
          <span className="text-slate-600 font-medium text-xs">
            Cognitive &amp; Adaptive Retention Engine
          </span>
          <span className="text-slate-300 hidden sm:inline">•</span>
          <span className="text-slate-500 text-xs">
            AI that <span className="text-emerald-700 font-semibold">cares</span> about human expertise.
          </span>
        </div>

        {/* Right side copyright */}
        <div className="flex items-center gap-2 font-sans text-xs text-slate-500 shrink-0">
          <span>© 2026 CARE Engine</span>
        </div>
      </div>
    </footer>
  );
};

