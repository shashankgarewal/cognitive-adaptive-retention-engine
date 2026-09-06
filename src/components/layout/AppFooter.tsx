/**
 * CARE - Unified Application Footer
 * Full-width edge-to-edge footer consistent across Landing & Authenticated pages.
 * Year: 2026, Version: v0.1
 */

import React from 'react';
import { Terminal, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AppFooterProps {
  onOpenSpec?: () => void;
}

export const AppFooter: React.FC<AppFooterProps> = ({ onOpenSpec }) => {
  const navigate = useNavigate();

  const handleSpecClick = () => {
    if (onOpenSpec) {
      onOpenSpec();
    } else {
      navigate('/spec');
    }
  };

  return (
    <footer
      id="app-footer"
      className="w-full border-t border-slate-200/80 bg-slate-50/90 py-8 transition-colors mt-auto text-left"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* Brand & Mission Statement */}
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-md bg-emerald-50 border border-emerald-300 flex items-center justify-center text-emerald-700 shadow-2xs">
                <Terminal className="w-3.5 h-3.5" />
              </div>
              <span className="font-semibold text-slate-900 tracking-tight text-sm">CARE</span>
              <span className="text-slate-300">•</span>
              <span className="text-xs text-slate-600 font-medium">
                Cognitive &amp; Adaptive Retention Engine
              </span>
            </div>
            <p className="text-xs text-slate-500 max-w-xl leading-relaxed">
              AI that <span className="text-emerald-700 font-semibold">cares</span> about human expertise.
            </p>
          </div>

          {/* Right Status & Meta */}
          <div className="flex flex-wrap items-center gap-3 shrink-0 font-mono text-xs text-slate-500">
            <button
              type="button"
              onClick={handleSpecClick}
              className="text-xs font-mono font-medium text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
            >
              Architecture Spec
            </button>
            <span className="text-slate-300">•</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white text-slate-700 font-mono text-[11px] font-semibold border border-slate-200 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>v0.1-telemetry-online</span>
            </span>
            <span className="font-sans text-xs text-slate-600 font-medium">© 2026 CARE Engine</span>
          </div>
        </div>

        {/* Bottom Micro-Badge Row */}
        <div className="pt-4 border-t border-slate-200/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-slate-500 font-mono">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Zero-Knowledge Telemetry • Isolated path /users/{'{uid}'}/*</span>
          </div>
          <span>Ebbinghaus Memory Optimization Matrix</span>
        </div>
      </div>
    </footer>
  );
};
