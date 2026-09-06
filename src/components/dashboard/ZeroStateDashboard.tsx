/**
 * CARE - ZeroStateDashboard Component
 * Clean, focused Authenticated Zero-State dashboard meeting "Warm Scholastic Engineering" guidelines:
 * 1. Fixed Header Bar with standardized Landing Header font style & real streaks
 * 2. Sub-Header with Workspace Overview and direct link to Architecture Spec
 * 3. Primary Feed Stage: 0-State Metric Row, Onboarding Hero Card, Empty Feed Container
 * 4. Unified Full-Width 2026 v0.1 Footer
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ZeroStateHeader } from './ZeroStateHeader';
import { ZeroStateMetricCards } from './ZeroStateMetricCards';
import { ZeroStateOnboardingCard } from './ZeroStateOnboardingCard';
import { ZeroStateEmptyFeed } from './ZeroStateEmptyFeed';
import { ZeroStateInfoModals } from './ZeroStateInfoModals';
import { AppFooter } from '../layout/AppFooter';
import { ExtractedConcept, JournalEntry } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, ArrowRight } from 'lucide-react';

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
  onViewLanding,
  onOpenAuth,
  entriesCount = 0,
  onToggleToPopulated,
  onOpenSpec,
  onSelectNav,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State for Info Modals (ai-reliance, security-spec, quickstart)
  const [activeInfoModal, setActiveInfoModal] = useState<
    'ai-reliance' | 'security-spec' | 'quickstart' | null
  >(null);

  const [activeNav, setActiveNav] = useState('feed');

  const handleLogClick = () => {
    if (!user && onOpenAuth) {
      onOpenAuth();
      return;
    }
    navigate('/editor');
  };

  const handleNavSelect = (navId: string) => {
    setActiveNav(navId);
    if (navId === 'spec') {
      if (onOpenSpec) onOpenSpec();
      else navigate('/spec');
    } else if (navId === 'hub') {
      navigate('/hub');
    } else if (navId === 'analytics') {
      navigate('/analytics');
    } else if (onSelectNav) {
      onSelectNav(navId);
    }
  };

  const handleOpenSpec = () => {
    if (onOpenSpec) onOpenSpec();
    else navigate('/spec');
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1E293B] font-sans flex flex-col selection:bg-emerald-500/20 selection:text-emerald-900 antialiased">
      {/* 1. Global Navigation Header Bar */}
      <ZeroStateHeader
        onLogClick={handleLogClick}
        onViewLanding={onViewLanding}
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
            <span className="hidden sm:inline">Zero-state initialization & continuous mastery</span>
          </div>
        </div>
      </div>

      {/* 3. Main Content Stage */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* 0-State Metric Overview Row */}
        <ZeroStateMetricCards entriesCount={0} topics={[]} />

        {/* Onboarding Hero Card ("Get Started with CARE") */}
        <ZeroStateOnboardingCard onLogClick={handleLogClick} />

        {/* Empty Feed Container */}
        <ZeroStateEmptyFeed
          onLogClick={handleLogClick}
          onOpenAiRelianceInfo={() => setActiveInfoModal('ai-reliance')}
          onOpenSecuritySpec={() => setActiveInfoModal('security-spec')}
          onOpenQuickstart={() => setActiveInfoModal('quickstart')}
        />
      </main>

      {/* 4. Full-Width Application Footer */}
      <AppFooter onOpenSpec={handleOpenSpec} />

      {/* Secondary Quick Links Info Modals */}
      <ZeroStateInfoModals
        isOpen={activeInfoModal !== null}
        onClose={() => setActiveInfoModal(null)}
        type={activeInfoModal}
        onOpenLogModal={() => navigate('/editor')}
      />
    </div>
  );
};
