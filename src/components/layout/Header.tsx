/**
 * SynapseDS - Header Component
 * Header navigation with user profile chip, auth triggers, and data isolation indicator.
 */

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, LogOut, User, Sparkles, Database, Terminal } from 'lucide-react';

interface HeaderProps {
  onOpenAuth: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAuth }) => {
  const { user, profile, signOut } = useAuth();

  return (
    <header className="border-b border-stone-800 bg-stone-900/90 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-base shadow-sm">
            <Terminal className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold tracking-tight text-stone-100 text-lg">
                Synapse<span className="text-emerald-400">DS</span>
              </span>
              <span className="px-1.5 py-0.5 text-[10px] uppercase font-mono tracking-wider bg-stone-800 text-stone-400 border border-stone-700 rounded">
                CRE Stack
              </span>
            </div>
            <p className="text-[11px] text-stone-400 tracking-normal hidden sm:block">
              Cognitive Retention Engine for Data Science
            </p>
          </div>
        </div>

        {/* Center / Security isolation badge */}
        {user && (
          <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-stone-950 border border-stone-800 rounded-full text-xs text-stone-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Isolated Path:</span>
            <code className="text-stone-300 font-mono text-[11px]">
              users/{user.uid.slice(0, 10)}...
            </code>
          </div>
        )}

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              {/* User profile capsule */}
              <div className="flex items-center gap-2.5 px-3 py-1.5 bg-stone-800/80 border border-stone-700/60 rounded-lg">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={profile?.displayName || 'User'}
                    className="w-6 h-6 rounded-full object-cover ring-1 ring-emerald-500/40"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-emerald-950 border border-emerald-700/60 text-emerald-300 text-xs font-semibold flex items-center justify-center">
                    {(profile?.displayName || user.email || 'DS')[0].toUpperCase()}
                  </div>
                )}
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-medium text-stone-200 truncate max-w-[140px]">
                    {profile?.displayName || user.email?.split('@')[0]}
                  </div>
                  <div className="text-[10px] text-stone-400 font-mono">
                    {profile?.authProvider === 'google.com' ? 'Google SSO' : 'Email Auth'}
                  </div>
                </div>
              </div>

              {/* Sign out */}
              <button
                id="btn-header-signout"
                onClick={signOut}
                title="Sign out of workspace"
                className="p-2 text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded-lg transition-colors border border-transparent hover:border-stone-700"
                aria-label="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              id="btn-header-signin"
              onClick={onOpenAuth}
              className="flex items-center gap-2 py-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-stone-950 font-medium text-xs rounded-lg transition-colors shadow-sm"
            >
              <User className="w-3.5 h-3.5" />
              <span>Connect Workspace</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
