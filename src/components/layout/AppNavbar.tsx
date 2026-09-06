/**
 * CARE - Unified Application Navigation Bar
 * Perfectly matches public landing page navbar font style, size, weight, and visual aesthetic.
 * Adheres strictly to:
 * - Font style: text-sm font-medium text-slate-600 (active: text-[#006948] font-semibold)
 * - Brand: Terminal icon in emerald box + CARE + v0.1 pulsating badge
 * - Streaks: Dynamic Log Streak and Recall Streak calculation
 * - Nav links: Work Journal Feed, Retention Hub, Analytics & Decay, Architecture Spec (NO separate Journal Writer tab)
 * - Action: + Log Work Journal button (routes to /editor) + user profile avatar menu
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useStreaks } from '../../hooks/useStreaks';
import { JournalEntry, TopicRetentionState } from '../../types';
import {
  Terminal,
  Plus,
  ChevronDown,
  LogOut,
  ShieldCheck,
  ExternalLink,
  User,
  LogIn,
} from 'lucide-react';

interface AppNavbarProps {
  activeNav?: 'feed' | 'hub' | 'analytics' | 'spec' | 'editor' | string;
  onSelectNav?: (navId: string) => void;
  onLogClick?: () => void;
  onOpenAuth?: () => void;
  onViewLanding?: () => void;
  entries?: JournalEntry[];
  topics?: TopicRetentionState[];
  logStreak?: number;
  recallStreak?: number;
}

export const AppNavbar: React.FC<AppNavbarProps> = ({
  activeNav: propActiveNav,
  onSelectNav,
  onLogClick,
  onOpenAuth,
  onViewLanding,
  entries,
  topics,
  logStreak: propLogStreak,
  recallStreak: propRecallStreak,
}) => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Derive active nav item from route if not provided
  const currentPath = location.pathname;
  let activeNav = propActiveNav;
  if (!activeNav) {
    if (currentPath.startsWith('/feed')) activeNav = 'feed';
    else if (currentPath.startsWith('/hub')) activeNav = 'hub';
    else if (currentPath.startsWith('/analytics')) activeNav = 'analytics';
    else if (currentPath.startsWith('/spec')) activeNav = 'spec';
    else if (currentPath.startsWith('/editor') || currentPath.startsWith('/journal/editor')) activeNav = 'editor';
    else activeNav = 'feed';
  }

  // Calculate live streaks from Firestore entities or custom props
  const computedStreaks = useStreaks(entries, topics);
  const logStreak = propLogStreak !== undefined ? propLogStreak : computedStreaks.logStreak;
  const recallStreak = propRecallStreak !== undefined ? propRecallStreak : computedStreaks.recallStreak;

  // Close profile dropdown on outside click
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

  const handleNavClick = (id: string, path: string) => {
    if (onSelectNav) {
      onSelectNav(id);
    } else {
      navigate(path);
    }
  };

  const handleLogJournal = () => {
    if (onLogClick) {
      onLogClick();
    } else {
      navigate('/editor');
    }
  };

  const handleBrandClick = () => {
    if (user) {
      navigate('/feed');
    } else {
      navigate('/');
    }
  };

  const userInitial = user
    ? (profile?.displayName || user.displayName || user.email || 'U')[0].toUpperCase()
    : '?';

  return (
    <header
      id="app-navbar"
      className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md transition-all"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand + v0.1 Badge + Streaks */}
        <div className="flex items-center gap-3 sm:gap-6">
          <div
            onClick={handleBrandClick}
            className="flex items-center gap-2.5 text-slate-950 font-bold tracking-tight text-xl font-sans group cursor-pointer select-none"
            title={user ? 'CARE - Go to Work Journal Feed' : 'CARE - Adaptive Retention'}
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-300 flex items-center justify-center text-emerald-700 shadow-2xs group-hover:bg-emerald-100 transition-colors">
              <Terminal className="w-4 h-4" />
            </div>
            <span className="font-semibold text-slate-900 tracking-tight text-lg">CARE</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-emerald-200 bg-[#ECFDF5] text-emerald-800 text-xs font-mono font-semibold tracking-wide select-none">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>v0.1</span>
          </div>

          {/* Genuine Streak Telemetry Pills */}
          {user && (
            <div className="hidden lg:flex items-center gap-2 pl-3 border-l border-slate-200">
              <div
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50/80 border border-amber-200 text-amber-900 text-xs font-mono font-medium shadow-2xs"
                title={`${logStreak} consecutive day${logStreak === 1 ? '' : 's'} logging work journals`}
              >
                <span className="text-amber-600">🔥</span>
                <span>
                  Log Streak: <strong className="font-semibold text-amber-950">{logStreak}d</strong>
                </span>
              </div>

              <div
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50/80 border border-emerald-200 text-emerald-900 text-xs font-mono font-medium shadow-2xs"
                title={`${recallStreak} consecutive day${recallStreak === 1 ? '' : 's'} completing active recall`}
              >
                <span className="text-emerald-700">🧠</span>
                <span>
                  Recall Streak: <strong className="font-semibold text-emerald-950">{recallStreak}d</strong>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Center: Navigation Links (Exact font style, size, and weight as Landing Header) */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          {navItems.map((item) => {
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id, item.path)}
                className={`py-1 transition-colors cursor-pointer whitespace-nowrap text-sm font-medium ${
                  isActive
                    ? 'text-[#006948] font-semibold border-b-2 border-[#006948]'
                    : 'hover:text-slate-950'
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
            id="btn-navbar-log-work-journal"
            type="button"
            onClick={handleLogJournal}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#006948] hover:bg-[#005439] text-white text-xs sm:text-sm font-medium transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 text-white" />
            <span className="whitespace-nowrap font-medium">+ Log Work Journal</span>
          </button>

          {/* User Profile Menu or Sign In */}
          {!user ? (
            <button
              id="btn-navbar-sign-in"
              type="button"
              onClick={onOpenAuth}
              className="py-1.5 px-3.5 rounded-lg border border-slate-300 hover:border-slate-400 text-slate-700 hover:text-slate-900 text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <LogIn className="w-3.5 h-3.5 text-slate-600" />
              <span>Sign In</span>
            </button>
          ) : (
            <div className="relative" ref={dropdownRef}>
              <button
                id="btn-navbar-user-profile"
                type="button"
                onClick={() => setIsProfileOpen((prev) => !prev)}
                className="flex items-center gap-1.5 p-1 rounded-full hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all cursor-pointer"
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
                  <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-800 font-bold text-xs flex items-center justify-center border border-emerald-200 shadow-2xs">
                    {userInitial}
                  </div>
                )}
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 hidden sm:block" />
              </button>

              {/* Profile Dropdown */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl border border-slate-200 shadow-lg py-2 z-50 text-left animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <div className="text-xs font-semibold text-slate-900 truncate">
                      {profile?.displayName || user.displayName || user.email?.split('@')[0] || 'Engineer'}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono truncate">
                      {user.email || 'authenticated-session'}
                    </div>
                    <div className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-mono text-[#006948] bg-[#ECFDF5] px-2 py-0.5 rounded border border-emerald-200">
                      <ShieldCheck className="w-3 h-3" />
                      <span>UID: {user.uid.slice(0, 8)}...</span>
                    </div>
                  </div>

                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileOpen(false);
                        if (onViewLanding) onViewLanding();
                        else navigate('/');
                      }}
                      className="w-full px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 text-left cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                      <span>Public Landing Page</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileOpen(false);
                        navigate('/spec');
                      }}
                      className="w-full px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 text-left cursor-pointer"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                      <span>Architecture Spec</span>
                    </button>
                  </div>

                  <div className="border-t border-slate-100 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileOpen(false);
                        signOut();
                      }}
                      className="w-full px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 text-left cursor-pointer font-medium"
                    >
                      <LogOut className="w-3.5 h-3.5 text-red-500" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
