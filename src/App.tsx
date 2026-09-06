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

function MainLayout() {
  const { user, loading } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  // View toggle: if user is authenticated, default to 'workspace', else 'landing'
  const [activeView, setActiveView] = useState<'landing' | 'workspace'>('landing');

  // When user logs in or out, align the view appropriately
  useEffect(() => {
    if (user) {
      setActiveView('workspace');
    } else {
      setActiveView('landing');
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

  // If user is unauthenticated or explicitly requested the public landing page:
  if (!user || activeView === 'landing') {
    return (
      <>
        <LandingPage
          onOpenWorkspace={() => setActiveView('workspace')}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
        />
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
        />
      </>
    );
  }

  // Authenticated workspace view
  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans selection:bg-emerald-500/20 selection:text-emerald-300">
      <Header
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onViewLanding={() => setActiveView('landing')}
      />
      <main className="flex-1">
        <WorkspaceHome onOpenAuth={() => setIsAuthModalOpen(true)} />
      </main>
      <footer className="border-t border-stone-850 py-6 px-4 sm:px-6 lg:px-8 text-center text-xs text-stone-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>CARE • Cognitive & Adaptive Retention Engine for Data Science Workflows</span>
          <span className="font-mono text-[11px] text-stone-600">
            CARE Architecture • React 19 + FastAPI + Firestore + Gemini 3.8 Flash
          </span>
        </div>
      </footer>
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

