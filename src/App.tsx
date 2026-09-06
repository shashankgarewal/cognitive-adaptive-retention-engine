/**
 * CARE - Primary Application Component
 * Displays the responsive public Landing Page for unauthenticated visitors
 * and the authenticated workspace for logged-in users.
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/layout/Header';
import { WorkspaceHome } from './components/dashboard/WorkspaceHome';
import { AuthModal } from './components/auth/AuthModal';
import { LandingPage } from './components/landing/LandingPage';
import { ArchitectureSpecPage } from './components/spec/ArchitectureSpecPage';

function MainLayout() {
  const { user, loading } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  // View toggle: defaults to 'spec' (System Architecture & Technical Spec Page)
  const [activeView, setActiveView] = useState<'landing' | 'workspace' | 'spec'>('spec');

  // When user logs in, if they were on 'landing', transition to 'workspace'
  useEffect(() => {
    if (user && activeView === 'landing') {
      setActiveView('workspace');
    }
  }, [user]);

  // Loading spinner during initial auth hydration
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-300 flex items-center justify-center animate-pulse">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
          </div>
          <span className="font-mono text-xs text-slate-500">CARE Engine Initializing...</span>
        </div>
      </div>
    );
  }

  // System Architecture & Technical Spec View
  if (activeView === 'spec') {
    return (
      <>
        <ArchitectureSpecPage
          onSelectNav={(nav) => {
            if (nav === 'spec') {
              setActiveView('spec');
            } else {
              setActiveView('workspace');
            }
          }}
          onViewLanding={() => setActiveView('landing')}
          onOpenAuth={() => setIsAuthModalOpen(true)}
        />
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
        />
      </>
    );
  }

  // Public Landing Page View
  if (activeView === 'landing') {
    return (
      <>
        <LandingPage
          onOpenWorkspace={() => setActiveView('workspace')}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onOpenSpec={() => setActiveView('spec')}
        />
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
        />
      </>
    );
  }

  // Authenticated/Interactive Workspace View
  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1E293B] flex flex-col font-sans selection:bg-emerald-500/20 selection:text-emerald-900">
      <main className="flex-1">
        <WorkspaceHome
          onOpenAuth={() => setIsAuthModalOpen(true)}
          onViewLanding={() => setActiveView('landing')}
          onOpenSpec={() => setActiveView('spec')}
        />
      </main>
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}

