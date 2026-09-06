/**
 * CARE - ZeroStateDashboard Component
 * The complete Authenticated Zero-State dashboard meeting all "Warm Scholastic Engineering" guidelines:
 * 1. Fixed Header Bar (Brand, Streak Telemetry, Nav Pills, Action Button, Avatar)
 * 2. Sub-Header / Overview Bar (WORKSPACE OVERVIEW indicator & System Blueprint toggle button)
 * 3. Main Content Grid (2-column layout on desktop):
 *    - Left Column: 0-State Metric Row, Onboarding Hero Card, Empty Feed Container
 *    - Right Column: Collapsible System Architecture & Spec Blueprint Panel
 */

import React, { useState } from 'react';
import { Zap, X, Layers } from 'lucide-react';
import { ZeroStateHeader } from './ZeroStateHeader';
import { ZeroStateMetricCards } from './ZeroStateMetricCards';
import { ZeroStateOnboardingCard } from './ZeroStateOnboardingCard';
import { ZeroStateEmptyFeed } from './ZeroStateEmptyFeed';
import { ZeroStateBlueprintPanel } from './ZeroStateBlueprintPanel';
import { ZeroStateInfoModals } from './ZeroStateInfoModals';
import { JournalEntryForm } from '../journal/JournalEntryForm';
import { ExtractedConcept, JournalEntry } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface ZeroStateDashboardProps {
  onLogJournalSuccess?: (entry: JournalEntry, concepts: ExtractedConcept[]) => void;
  onViewLanding?: () => void;
  onOpenAuth?: () => void;
  entriesCount?: number;
  onToggleToPopulated?: () => void;
  onOpenSpec?: () => void;
  onSelectNav?: (nav: string) => void;
}

export const ZeroStateDashboard: React.FC<ZeroStateDashboardProps> = ({
  onLogJournalSuccess,
  onViewLanding,
  onOpenAuth,
  entriesCount = 0,
  onToggleToPopulated,
  onOpenSpec,
  onSelectNav,
}) => {
  const { user } = useAuth();
  // State for collapsible Right Blueprint Panel
  const [isBlueprintOpen, setIsBlueprintOpen] = useState(true);

  // State for Journal Entry Form Modal
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  // State for Info Modals (AI reliance, security spec, quickstart)
  const [activeInfoModal, setActiveInfoModal] = useState<
    'ai-reliance' | 'security-spec' | 'quickstart' | null
  >(null);

  // Active navigation pill
  const [activeNav, setActiveNav] = useState('feed');

  const handleLogClick = () => {
    if (!user && onOpenAuth) {
      onOpenAuth();
      return;
    }
    setIsLogModalOpen(true);
  };

  const handleNavSelect = (navId: string) => {
    setActiveNav(navId);
    if (navId === 'spec') {
      if (onOpenSpec) {
        onOpenSpec();
      } else if (onSelectNav) {
        onSelectNav('spec');
      } else {
        setIsBlueprintOpen(true);
      }
    } else if (onSelectNav) {
      onSelectNav(navId);
    }
  };

  const handleJournalSuccess = (entry: JournalEntry, concepts: ExtractedConcept[]) => {
    setIsLogModalOpen(false);
    if (onLogJournalSuccess) {
      onLogJournalSuccess(entry, concepts);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1E293B] font-sans flex flex-col selection:bg-emerald-500/20 selection:text-emerald-900 antialiased">
      {/* 1. Fixed Header Bar */}
      <ZeroStateHeader
        onLogClick={handleLogClick}
        onViewLanding={onViewLanding}
        onToggleBlueprint={() => setIsBlueprintOpen((prev) => !prev)}
        activeNav={activeNav}
        onSelectNav={handleNavSelect}
      />

      {/* 2. Sub-Header / Overview Bar */}
      <div className="border-b border-[#E5E0D8] bg-white/70 backdrop-blur-xs py-2.5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Text Indicator */}
          <div className="flex items-center gap-2 text-[#505F76] font-mono">
            <span className="w-2 h-2 rounded-full bg-[#006948]" />
            <span className="font-semibold text-[#1E293B]">WORKSPACE OVERVIEW</span>
            <span className="text-slate-300">•</span>
            <span className="hidden sm:inline">Zero-state initialization & architecture walkthrough</span>
          </div>

          <div className="flex items-center gap-2">
            {onOpenSpec && (
              <button
                type="button"
                onClick={onOpenSpec}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F0F3FF] border border-[#E7EEFF] text-[#006948] hover:bg-emerald-50 transition-colors font-mono text-xs font-semibold cursor-pointer shadow-2xs"
              >
                <span>Full Spec Blueprint</span>
                <span className="text-[10px] text-slate-400">&rarr;</span>
              </button>
            )}

            {entriesCount > 0 && onToggleToPopulated && (
              <button
                type="button"
                onClick={onToggleToPopulated}
                className="px-2.5 py-1 rounded-full bg-[#006948] text-white font-mono text-xs font-semibold hover:bg-[#005439] transition-colors cursor-pointer shadow-2xs"
              >
                View Populated Feed ({entriesCount})
              </button>
            )}

            {/* System Blueprint Toggle Button */}
            <button
              id="btn-toggle-blueprint-panel"
              type="button"
              onClick={() => setIsBlueprintOpen((prev) => !prev)}
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border transition-all cursor-pointer font-mono text-xs shadow-2xs ${
                isBlueprintOpen
                  ? 'bg-[#ECFDF5] border-emerald-300 text-[#006948] hover:bg-emerald-100/60'
                  : 'bg-white border-[#E5E0D8] text-[#505F76] hover:text-[#1E293B] hover:bg-[#FAF8F5]'
              }`}
            >
              <Zap className={`w-3.5 h-3.5 ${isBlueprintOpen ? 'text-[#006948]' : 'text-[#505F76]'}`} />
              <span>
                System Blueprint{' '}
                <strong className={isBlueprintOpen ? 'text-[#006948]' : 'text-slate-400'}>
                  [{isBlueprintOpen ? 'ACTIVE' : 'HIDDEN'}]
                </strong>
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Main Content Grid (2-Column Layout on Desktop) */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
          {/* Left Column (Primary Feed Stage) */}
          <div
            className={`space-y-6 sm:space-y-8 transition-all duration-300 ${
              isBlueprintOpen ? 'lg:col-span-8' : 'lg:col-span-12'
            }`}
          >
            {/* 1. 0-State Metric Overview Row (3 Cards) */}
            <ZeroStateMetricCards />

            {/* 2. Onboarding Hero Card ("Get Started with CARE") */}
            <ZeroStateOnboardingCard onLogClick={handleLogClick} />

            {/* 3. Empty Feed Container */}
            <ZeroStateEmptyFeed
              onLogClick={handleLogClick}
              onOpenAiRelianceInfo={() => setActiveInfoModal('ai-reliance')}
              onOpenSecuritySpec={() => setActiveInfoModal('security-spec')}
              onOpenQuickstart={() => setActiveInfoModal('quickstart')}
            />
          </div>

          {/* Right Column (Inline Architecture & Spec Panel - Collapsible) */}
          {isBlueprintOpen && (
            <div className="lg:col-span-4 w-full animate-in fade-in slide-in-from-right-4 duration-200">
              <ZeroStateBlueprintPanel onClose={() => setIsBlueprintOpen(false)} />
            </div>
          )}
        </div>
      </main>

      {/* Bottom Footer Note */}
      <footer className="border-t border-[#E5E0D8] bg-white/60 py-4 px-4 sm:px-6 lg:px-8 text-center text-xs text-[#505F76] font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>CARE Continuous Mastery • Authenticated Session Initialization</span>
          <span>Ebbinghaus Memory Optimization Matrix</span>
        </div>
      </footer>

      {/* Journal Entry Ingestion Modal */}
      {isLogModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl border border-[#E5E0D8] shadow-2xl overflow-hidden p-6 max-h-[90vh] overflow-y-auto text-left">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E5E0D8]">
              <div>
                <h3 className="font-serif font-bold text-xl text-[#1E293B]">
                  Log Engineering Work Journal
                </h3>
                <p className="text-xs text-[#505F76] font-mono">
                  Input technical notes & AI reliance signals for Gemini concept extraction
                </p>
              </div>
              <button
                onClick={() => setIsLogModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Close form"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <JournalEntryForm
              onSuccess={handleJournalSuccess}
              onCancel={() => setIsLogModalOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Secondary Quick Links Info Modals */}
      <ZeroStateInfoModals
        isOpen={activeInfoModal !== null}
        onClose={() => setActiveInfoModal(null)}
        type={activeInfoModal}
        onOpenLogModal={() => setIsLogModalOpen(true)}
      />
    </div>
  );
};
