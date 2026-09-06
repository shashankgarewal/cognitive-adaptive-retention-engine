/**
 * CARE - Landing Header Component
 * Minimalist, high-density developer navigation header with version badge and auth triggers.
 */

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Terminal, ShieldCheck, ArrowRight, UserCheck, LogOut } from 'lucide-react';

interface LandingHeaderProps {
  onSignInClick: () => void;
  onOpenWorkspace?: () => void;
}

export const LandingHeader: React.FC<LandingHeaderProps> = ({
  onSignInClick,
  onOpenWorkspace,
}) => {
  const { user, profile, signOut } = useAuth();

  return (
    <header
      id="landing-header"
      className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md transition-all"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: CARE Logo + Version Badge */}
        <div className="flex items-center gap-2.5">
          <a
            href="#"
            className="flex items-center gap-2.5 text-slate-950 font-bold tracking-tight text-xl font-sans group"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-300 flex items-center justify-center text-emerald-700 shadow-2xs group-hover:bg-emerald-100 transition-colors">
              <Terminal className="w-4 h-4" />
            </div>
            <span className="font-semibold text-slate-900 tracking-tight text-lg">CARE</span>
          </a>
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-emerald-200 bg-[#ECFDF5] text-emerald-800 text-xs font-mono font-semibold tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>v0.1</span>
          </div>
        </div>

        {/* Center: Minimal Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          <a
            href="#features"
            className="hover:text-slate-950 transition-colors py-1"
          >
            Features
          </a>
          <a
            href="#architecture"
            className="hover:text-slate-950 transition-colors py-1"
          >
            System Architecture
          </a>
          <a
            href="#security"
            className="hover:text-slate-950 transition-colors py-1"
          >
            Security Spec
          </a>
        </nav>

        {/* Right: Action button */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2.5">
              <button
                id="btn-nav-workspace"
                onClick={onOpenWorkspace}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-medium transition-colors shadow-xs"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Open Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                id="btn-nav-signout"
                onClick={signOut}
                title="Sign out"
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                aria-label="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              id="btn-nav-signin"
              onClick={onSignInClick}
              className="inline-flex items-center justify-center px-4 py-1.5 rounded-full border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 hover:text-slate-950 text-xs sm:text-sm font-medium transition-all shadow-2xs hover:shadow-xs"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
