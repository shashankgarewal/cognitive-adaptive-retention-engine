/**
 * CARE - HeroAuthCard Component
 * Hero section with typography pairings and dual authentication card (Google SSO + Email/Password).
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, ArrowRight, Lock, Mail, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';

interface HeroAuthCardProps {
  onSuccess?: () => void;
  defaultMode?: 'signup' | 'signin';
}

export const HeroAuthCard: React.FC<HeroAuthCardProps> = ({
  onSuccess,
  defaultMode = 'signup',
}) => {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, error, clearError, user } = useAuth();

  const [activeTab, setActiveTab] = useState<'signup' | 'signin'>(defaultMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    setActiveTab(defaultMode);
  }, [defaultMode]);

  const handleTabChange = (mode: 'signup' | 'signin') => {
    setActiveTab(mode);
    setLocalError(null);
    clearError();
  };

  const handleGoogleSignIn = async () => {
    setLocalError(null);
    clearError();
    setIsGoogleSubmitting(true);
    try {
      await signInWithGoogle();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('Google SSO error:', err);
      // AuthContext populates error or parsed details
      setLocalError(err.message || 'Google sign-in could not be completed.');
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (!email.trim() || !email.includes('@')) {
      setLocalError('Please enter a valid email address.');
      return;
    }

    if (password.length < 8) {
      setLocalError('Password must be at least 8 characters in length.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (activeTab === 'signup') {
        await signUpWithEmail(email.trim(), password);
      } else {
        await signInWithEmail(email.trim(), password);
      }
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('Auth submission error:', err);
      setLocalError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="hero-section" className="relative pt-6 sm:pt-8 pb-6 sm:pb-8 px-4 sm:px-6 lg:px-8 text-center">
      {/* Background soft gradient aura */}
      <div className="absolute inset-0 -z-10 pointer-events-none flex items-center justify-center">
        <div className="w-[500px] h-[260px] bg-emerald-100/40 rounded-full blur-3xl" />
      </div>

      <div className="max-w-4xl mx-auto space-y-4">
        {/* Pill Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-slate-700 text-xs font-mono tracking-tight shadow-2xs">
          <span>CONTINUOUS MASTERY SYSTEM</span>
          <span className="text-emerald-400">•</span>
          <span>
            An AI that <strong className="text-emerald-600 font-bold">cares</strong> about Human Expertise
          </span>
        </div>

        {/* Hero Headline */}
        <div className="space-y-0.5 sm:space-y-1">
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-[50px] font-bold text-slate-900 tracking-tight leading-tight">
            Build fast with AI.
          </h1>
          <p className="font-serif italic text-3xl sm:text-4xl lg:text-[50px] text-emerald-600 font-normal tracking-tight leading-tight">
            Keep your engineering intuition.
          </p>
        </div>

        {/* Subtitle */}
        <p className="max-w-2xl mx-auto text-slate-600 text-xs sm:text-sm leading-relaxed">
          CARE synthesizes your technical work logs, measures AI reliance on core mental models, and triggers 2-minute active recall drills before critical architectural knowledge fades.
        </p>

        {/* Auth Card Component */}
        <div
          id="auth-card"
          className="mt-5 sm:mt-6 max-w-md mx-auto w-full bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 text-left transition-all hover:border-slate-300"
        >
          {/* Tabbed Switcher */}
          <div className="grid grid-cols-2 p-1 bg-slate-100/90 rounded-lg border border-slate-200/80 mb-4 text-xs font-semibold">
            <button
              id="tab-create-account"
              type="button"
              onClick={() => handleTabChange('signup')}
              className={`py-1.5 rounded-md transition-all text-center ${
                activeTab === 'signup'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Create Account
            </button>
            <button
              id="tab-sign-in"
              type="button"
              onClick={() => handleTabChange('signin')}
              className={`py-1.5 rounded-md transition-all text-center ${
                activeTab === 'signin'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
          </div>

          {/* Error Message Display */}
          {(localError || error) && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{localError || error}</span>
            </div>
          )}

          {/* Primary Action: Begin with Google */}
          <button
            id="btn-hero-google-auth"
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isGoogleSubmitting || isSubmitting}
            className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-75 text-white font-medium text-sm flex items-center justify-center gap-2.5 transition-colors shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 cursor-pointer"
          >
            {isGoogleSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <svg className="w-4 h-4 shrink-0 fill-current" viewBox="0 0 24 24">
                <path d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.344-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z" />
              </svg>
            )}
            <span>Begin with Google</span>
          </button>

          {/* Divider */}
          <div className="relative my-5 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <span className="relative bg-white px-3 text-[11px] font-mono text-slate-500 uppercase tracking-wider">
              or continue with email
            </span>
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleEmailSubmit} className="space-y-3.5">
            <div>
              <label
                htmlFor="auth-email-input"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Email Address
              </label>
              <div className="relative">
                <input
                  id="auth-email-input"
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting || isGoogleSubmitting}
                  className="w-full py-2 pl-3 pr-9 rounded-lg border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="auth-password-input"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Password
                </label>
                <span className="text-[10px] font-mono text-slate-400">
                  {activeTab === 'signup' ? 'min 8 characters' : ''}
                </span>
              </div>
              <div className="relative">
                <input
                  id="auth-password-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  placeholder={activeTab === 'signup' ? 'minimum 8 characters' : '••••••••'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting || isGoogleSubmitting}
                  className="w-full py-2 pl-3 pr-9 rounded-lg border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-hidden"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Form Submit Button */}
            <button
              id="btn-hero-email-submit"
              type="submit"
              disabled={isSubmitting || isGoogleSubmitting}
              className="w-full mt-2 py-2.5 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-75 text-white font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:ring-offset-1 cursor-pointer"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>{activeTab === 'signup' ? 'Sign Up with Email' : 'Sign In with Email'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Toggle link */}
          <div className="mt-3.5 text-center">
            {activeTab === 'signup' ? (
              <p className="text-xs text-slate-500">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => handleTabChange('signin')}
                  className="text-slate-900 font-semibold hover:underline"
                >
                  Sign In
                </button>
              </p>
            ) : (
              <p className="text-xs text-slate-500">
                New to CARE?{' '}
                <button
                  type="button"
                  onClick={() => handleTabChange('signup')}
                  className="text-slate-900 font-semibold hover:underline"
                >
                  Create Account
                </button>
              </p>
            )}
          </div>

          {/* Security Micro-copy */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] font-mono text-slate-500 text-center">
            <Lock className="w-3 h-3 text-emerald-600 shrink-0" />
            <span>Private & isolated to your account • Zero-knowledge telemetry sandboxing</span>
          </div>
        </div>
      </div>
    </section>
  );
};
