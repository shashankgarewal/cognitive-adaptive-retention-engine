/**
 * SynapseDS - Primary Application Component
 * Scoped with AuthProvider and Slice 1 Workspace Foundation.
 */

import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { Header } from './components/layout/Header';
import { WorkspaceHome } from './components/dashboard/WorkspaceHome';
import { AuthModal } from './components/auth/AuthModal';

function MainLayout() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans selection:bg-emerald-500/20 selection:text-emerald-300">
      <Header onOpenAuth={() => setIsAuthModalOpen(true)} />
      <main className="flex-1">
        <WorkspaceHome onOpenAuth={() => setIsAuthModalOpen(true)} />
      </main>
      <footer className="border-t border-stone-850 py-6 px-4 sm:px-6 lg:px-8 text-center text-xs text-stone-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>SynapseDS • Cognitive Retention Engine for Data Science Workflows</span>
          <span className="font-mono text-[11px] text-stone-600">
            CRE Architecture • React 19 + FastAPI + Firestore + Gemini 3.8 Flash
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
