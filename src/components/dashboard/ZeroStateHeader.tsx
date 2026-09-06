/**
 * CARE - ZeroStateHeader Component
 * Fixed header adhering to the "Warm Scholastic Engineering" design system:
 * - Brand identity: "CARE - Adaptive Retention"
 * - Streak telemetry pills: Log Streak & Recall Streak
 * - Navigation links: Work Journal Feed (Active), Retention Hub, Analytics & Decay, Architecture Spec
 * - Actions: + Log Work Journal button & circular user profile avatar
 */

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Plus,
  ChevronDown,
  LogOut,
  Layers,
  ShieldCheck,
  User,
  ExternalLink,
  LogIn,
} from 'lucide-react';

interface ZeroStateHeaderProps {
  onLogClick: () => void;
  onViewLanding?: () => void;
  onOpenAuth?: () => void;
  onToggleBlueprint?: () => void;
  activeNav?: string;
  onSelectNav?: (nav: string) => void;
  logStreak?: number;
  recallStreak?: number;
}

export const ZeroStateHeader: React.FC<ZeroStateHeaderProps> = ({
  onLogClick,
  onViewLanding,
  onOpenAuth,
  onToggleBlueprint,
  activeNav = 'feed',
  onSelectNav,
  logStreak = 12,
  recallStreak = 5,
}) => {
  const { user, profile, signOut } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { id: 'feed', label: 'Work Journal Feed', path: '/feed' },
    { id: 'hub', label: 'Retention Hub', path: '/hub' },
    { id: 'analytics', label: 'Analytics & Decay', path: '/analytics' },
    { id: 'spec', label: 'Architecture Spec', path: '/spec' },
  ];

  const handleNavClick = (id: string) => {
    if (onSelectNav) {
      onSelectNav(id);
    }
  };

  const userInitial = user
    ? (profile?.displayName || user.displayName || user.email || 'U')[0].toUpperCase()
    : '?';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E5E0D8] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand identity & Streak Telemetry */}
        <div className="flex items-center gap-4 sm:gap-6">
          {/* Brand Identity */}
          <div
            className="flex items-center gap-2.5 group cursor-pointer"
            onClick={() => handleNavClick(user ? 'feed' : 'landing')}
            title={user ? 'Go to Work Journal Feed' : 'Go to Landing Page'}
          >
            <div className="w-8 h-8 rounded-lg bg-[#006948] text-white flex items-center justify-center font-serif text-base font-bold shadow-2xs group-hover:bg-[#005439] transition-colors">
              C
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-lg text-[#1E293B] tracking-tight leading-none">
                  CARE
                </span>
                <span className="text-[11px] font-mono text-[#006948] font-semibold tracking-tight">
                  Adaptive Retention
                </span>
              </div>
            </div>
          </div>

          {/* Streak Telemetry Pills */}
          {user && (
            <div className="hidden md:flex items-center gap-2 pl-2 border-l border-[#E5E0D8]">
              <div
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FFF8ED] border border-amber-200 text-[#8D4B00] text-xs font-mono font-medium shadow-2xs"
                title="Consecutive days logging engineering work journals"
              >
                <span className="text-amber-600">🔥</span>
                <span>Log Streak: {logStreak} Days</span>
              </div>

              <div
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F0F3FF] border border-[#E7EEFF] text-[#1E293B] text-xs font-mono font-medium shadow-2xs"
                title="Consecutive days completing active recall drills"
              >
                <span className="text-emerald-700">🧠</span>
                <span>Recall Streak: {recallStreak} Days</span>
              </div>
            </div>
          )}
        </div>

        {/* Center: Navigation Pills */}
        <nav className="hidden md:flex items-center gap-1 p-1 bg-[#FAF8F5] rounded-full border border-[#E5E0D8] text-xs font-medium">
          {navItems.map((item) => {
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`px-3 py-1.5 rounded-full transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-[#006948] text-white shadow-2xs font-semibold'
                    : 'text-[#505F76] hover:text-[#1E293B] hover:bg-white/80'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {/* Primary Action Button: + Log Work Journal */}
          <button
            id="btn-header-log-work-journal"
            type="button"
            onClick={onLogClick}
            className="py-2 px-3.5 sm:px-4 rounded-lg bg-[#006948] hover:bg-[#005439] text-white font-medium text-xs sm:text-sm flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 text-white" />
            <span className="whitespace-nowrap font-medium">+ Log Work Journal</span>
          </button>

          {/* User Profile or Sign In button */}
          {!user ? (
            <button
              id="btn-header-sign-in"
              type="button"
              onClick={onOpenAuth}
              className="py-1.5 px-3.5 rounded-lg border border-[#006948] text-[#006948] hover:bg-emerald-50 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <LogIn className="w-3.5 h-3.5 text-[#006948]" />
              <span className="whitespace-nowrap">Sign In</span>
            </button>
          ) : (
            <div className="relative" ref={dropdownRef}>
              <button
                id="btn-user-profile-menu"
                type="button"
                onClick={() => setIsProfileOpen((prev) => !prev)}
                className="flex items-center gap-1.5 p-1 rounded-full hover:bg-slate-100 border border-transparent hover:border-[#E5E0D8] transition-all cursor-pointer"
                aria-label="User profile menu"
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={profile?.displayName || user.displayName || 'User profile'}
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-[#006948]/30"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#E7EEFF] text-[#006948] font-bold text-xs flex items-center justify-center border border-[#CCD8FF] shadow-2xs">
                    {userInitial}
                  </div>
                )}
                <ChevronDown className="w-3.5 h-3.5 text-[#505F76] hidden sm:block" />
              </button>

              {/* Dropdown Menu (Only shown when authenticated) */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl border border-[#E5E0D8] shadow-lg py-2 z-50 text-left animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <div className="text-xs font-semibold text-[#1E293B] truncate">
                      {profile?.displayName || user.displayName || user.email?.split('@')[0] || 'Authenticated Engineer'}
                    </div>
                    <div className="text-[11px] text-[#505F76] font-mono truncate">
                      {user.email || 'authenticated-session'}
                    </div>
                    <div className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-mono text-[#006948] bg-[#ECFDF5] px-2 py-0.5 rounded border border-emerald-200">
                      <ShieldCheck className="w-3 h-3" />
                      <span>UID: {user.uid.slice(0, 8)}...</span>
                    </div>
                  </div>

                  <div className="py-1">
                    {onViewLanding && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileOpen(false);
                          onViewLanding();
                        }}
                        className="w-full px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 text-left"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                        <span>View Public Landing Page</span>
                      </button>
                    )}
                    {onToggleBlueprint && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileOpen(false);
                          onToggleBlueprint();
                        }}
                        className="w-full px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 text-left"
                      >
                        <Layers className="w-3.5 h-3.5 text-slate-400" />
                        <span>Toggle Architecture Blueprint</span>
                      </button>
                    )}
                  </div>

                  <div className="pt-1 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileOpen(false);
                        signOut();
                      }}
                      className="w-full px-4 py-2 text-xs text-rose-700 hover:bg-rose-50 flex items-center gap-2 text-left font-medium"
                    >
                      <LogOut className="w-3.5 h-3.5 text-rose-500" />
                      <span>Sign Out of Workspace</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Navigation Sub-bar */}
      <div className="md:hidden border-t border-[#E5E0D8] bg-[#FAF8F5] px-3 py-1.5 flex items-center justify-around text-[11px] font-medium overflow-x-auto">
        {navItems.map((item) => {
          const isActive = activeNav === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavClick(item.id)}
              className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-[#006948] text-white font-semibold shadow-2xs'
                  : 'text-[#505F76]'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </header>
  );
};
