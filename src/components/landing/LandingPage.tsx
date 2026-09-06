/**
 * CARE - LandingPage Component
 * Full public landing and onboarding page designed for unauthenticated visitors
 * and showcasing the Continuous Mastery System.
 */

import React, { useState } from 'react';
import { LandingHeader } from './LandingHeader';
import { HeroAuthCard } from './HeroAuthCard';
import { BrowserPreviewMockup } from './BrowserPreviewMockup';
import { GenerativeDilemmaSection } from './GenerativeDilemmaSection';
import { SystemArchitectureSection } from './SystemArchitectureSection';
import { PrivacyAndFooter } from './PrivacyAndFooter';

interface LandingPageProps {
  onOpenWorkspace?: () => void;
  onOpenAuthModal?: () => void;
  onOpenSpec?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenWorkspace,
  onOpenAuthModal,
  onOpenSpec,
}) => {
  const [authMode, setAuthMode] = useState<'signup' | 'signin'>('signup');

  const handleSignInClick = () => {
    setAuthMode('signin');
    const authCard = document.getElementById('auth-card');
    if (authCard) {
      authCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Focus email input
      const emailInput = document.getElementById('auth-email-input');
      if (emailInput) {
        setTimeout(() => emailInput.focus(), 400);
      }
    } else if (onOpenAuthModal) {
      onOpenAuthModal();
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-slate-900 flex flex-col font-sans selection:bg-emerald-500/20 selection:text-emerald-800 antialiased">
      {/* 1. Global Navigation Header */}
      <LandingHeader
        onSignInClick={handleSignInClick}
        onOpenWorkspace={onOpenWorkspace}
        onOpenSpec={onOpenSpec}
      />

      {/* Main Page Flow */}
      <main className="flex-1">
        {/* 2. Hero Section & Dual Authentication Card */}
        <HeroAuthCard
          defaultMode={authMode}
          onSuccess={onOpenWorkspace}
        />

        {/* Section Partition 1 */}
        <hr className="border-t border-slate-200/70 max-w-6xl mx-auto my-8" />

        {/* 3. Browser Preview Mockup (Active Work Journal) */}
        <BrowserPreviewMockup />

        {/* Section Partition 2 */}
        <hr className="border-t border-slate-200/70 max-w-6xl mx-auto my-8" />

        {/* 4. Problem & Value Proposition ("The Generative AI Dilemma") */}
        <GenerativeDilemmaSection />

        {/* Section Partition 3 */}
        <hr className="border-t border-slate-200/70 max-w-6xl mx-auto my-8" />

        {/* 5. System Architecture Process Flow */}
        <SystemArchitectureSection />
      </main>

      {/* 6. Privacy Banner & Footer */}
      <PrivacyAndFooter onSignInClick={handleSignInClick} />
    </div>
  );
};
