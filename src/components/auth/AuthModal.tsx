/**
 * CARE - AuthModal Component
 * Accessible, high-contrast modal supporting Google SSO and Email/Password authentication
 * with comprehensive error diagnostics and resolution guidance.
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  LogIn,
  UserPlus,
  AlertCircle,
  Lock,
  Mail,
  User,
  Info,
  ChevronDown,
  ChevronUp,
  Terminal,
  CheckCircle2,
} from 'lucide-react';
import { AuthErrorDetails } from '../../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const {
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    sendPasswordReset,
    error,
    errorDetails,
    clearError,
  } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [localErrorDetails, setLocalErrorDetails] = useState<AuthErrorDetails | null>(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  const emailInputRef = React.useRef<HTMLInputElement>(null);
  const [authMethod, setAuthMethod] = useState<'sso' | 'credentials'>('sso');

  if (!isOpen) return null;

  const handleClose = () => {
    clearError();
    setLocalError(null);
    setLocalErrorDetails(null);
    setResetSuccessMessage(null);
    setShowDiagnostics(false);
    onClose();
  };

  const activeError = localError || error;
  const activeDetails = localErrorDetails || errorDetails;

  const handleGoogleSignIn = async () => {
    setLocalError(null);
    setLocalErrorDetails(null);
    setResetSuccessMessage(null);
    clearError();
    setIsSubmitting(true);
    try {
      await signInWithGoogle();
      handleClose();
    } catch (err: any) {
      // The error and errorDetails are populated in AuthContext
      setAuthMethod('credentials');
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchToEmailAuth = () => {
    setAuthMethod('credentials');
    setTimeout(() => {
      emailInputRef.current?.focus();
    }, 100);
  };

  const handleForgotPassword = async () => {
    setLocalError(null);
    setLocalErrorDetails(null);
    setResetSuccessMessage(null);
    clearError();

    const targetEmail = email.trim();
    if (!targetEmail) {
      setLocalError('Please enter your email address above to receive password reset instructions.');
      emailInputRef.current?.focus();
      return;
    }

    setIsResettingPassword(true);
    try {
      await sendPasswordReset(targetEmail);
      setResetSuccessMessage(`Password reset link sent to ${targetEmail}. Please check your inbox.`);
    } catch (err: any) {
      // Handled by AuthContext error state
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setLocalErrorDetails(null);
    setResetSuccessMessage(null);
    clearError();

    if (!email || !password) {
      setLocalError('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'signin') {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password, displayName);
      }
      handleClose();
    } catch (err: any) {
      // AuthContext sets error and errorDetails
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="auth-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150 overflow-y-auto"
    >
      <div
        id="auth-modal-card"
        className="w-full max-w-md bg-stone-900 border border-stone-800 rounded-xl shadow-2xl p-6 relative text-stone-100 my-8"
      >
        {/* Close Button */}
        <button
          id="btn-close-auth-modal"
          onClick={handleClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-200 p-1.5 rounded-lg hover:bg-stone-800 transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
              C
            </div>
            <span className="text-xs font-medium tracking-wide uppercase text-stone-400">
              CARE Access
            </span>
          </div>
          <h2 className="text-xl font-semibold text-stone-100">
            {mode === 'signin' ? 'Sign in to your Workspace' : 'Create CARE Workspace'}
          </h2>
          <p className="text-sm text-stone-400 mt-1">
            Scoped user isolation under Firebase Auth with end-to-end Firestore persistence.
          </p>
        </div>

        {/* Auth Method Selector / Direct Toggle */}
        <div className="flex bg-stone-950 p-1 rounded-lg border border-stone-800 mb-5">
          <button
            id="tab-auth-sso"
            type="button"
            onClick={() => {
              setAuthMethod('sso');
              clearError();
              setLocalError(null);
            }}
            className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-all ${
              authMethod === 'sso'
                ? 'bg-stone-800 text-stone-100 shadow-sm border border-stone-700/80'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Google SSO
          </button>
          <button
            id="tab-auth-credentials"
            type="button"
            onClick={() => {
              switchToEmailAuth();
              clearError();
              setLocalError(null);
            }}
            className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-all ${
              authMethod === 'credentials'
                ? 'bg-stone-800 text-stone-100 shadow-sm border border-stone-700/80'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Email &amp; Password
          </button>
        </div>

        {/* Success Feedback Banner */}
        {resetSuccessMessage && (
          <div
            id="auth-success-banner"
            className="mb-5 p-3.5 bg-emerald-950/70 border border-emerald-800/80 rounded-xl text-emerald-200 text-xs shadow-sm animate-in fade-in flex items-start gap-2.5"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-emerald-100">{resetSuccessMessage}</p>
              <p className="text-[11px] text-emerald-300/80 mt-0.5">
                The continue redirect will bring you back directly to your CARE workspace.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setResetSuccessMessage(null)}
              className="text-emerald-400 hover:text-emerald-200 p-1 rounded hover:bg-emerald-900/40 transition-colors"
              title="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Top-Level Error & Diagnostics Banner */}
        {activeError && (
          <div
            id="auth-error-banner"
            className="mb-5 p-3.5 bg-amber-950/70 border border-amber-800/80 rounded-xl text-amber-200 text-xs shadow-sm animate-in fade-in space-y-2.5"
          >
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1">
                <p className="font-semibold text-amber-100">{activeError}</p>
                {activeDetails?.resolutionHint && (
                  <p className="text-[11px] text-amber-300/90 leading-relaxed">
                    <strong>Hint:</strong> {activeDetails.resolutionHint}
                  </p>
                )}
                {authMethod === 'sso' && (
                  <button
                    id="btn-switch-to-email-auth"
                    type="button"
                    onClick={switchToEmailAuth}
                    className="inline-flex items-center gap-1.5 mt-1.5 px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-600/50 rounded-md font-medium text-[11px] transition-colors"
                  >
                    <Mail className="w-3 h-3" />
                    <span>Use Email &amp; Password Sign-In</span>
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  clearError();
                  setLocalError(null);
                  setLocalErrorDetails(null);
                }}
                className="text-amber-400 hover:text-amber-200 p-1 rounded hover:bg-amber-900/40 transition-colors"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Diagnostic Details Accordion */}
            {activeDetails && (
              <div className="pt-1.5 border-t border-amber-800/50">
                <button
                  type="button"
                  onClick={() => setShowDiagnostics((prev) => !prev)}
                  className="flex items-center gap-1 text-[11px] text-amber-400/90 hover:text-amber-200 font-mono transition-colors"
                >
                  <Terminal className="w-3 h-3" />
                  <span>{showDiagnostics ? 'Hide Diagnostic Tracing' : 'Show Diagnostic Tracing'}</span>
                  {showDiagnostics ? (
                    <ChevronUp className="w-3 h-3 ml-0.5" />
                  ) : (
                    <ChevronDown className="w-3 h-3 ml-0.5" />
                  )}
                </button>

                {showDiagnostics && (
                  <div className="mt-2 p-2.5 bg-stone-950/80 rounded-lg border border-amber-900/60 font-mono text-[10px] space-y-1.5 text-stone-300">
                    <div className="flex items-center justify-between">
                      <span className="text-stone-500">Firebase Error Code:</span>
                      <span className="text-amber-400 font-bold">{activeDetails.code}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-stone-500">App Origin:</span>
                      <span className="text-stone-300 truncate max-w-[220px]" title={activeDetails.origin}>
                        {activeDetails.origin}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-stone-500">Configured Auth Domain:</span>
                      <span className="text-stone-300">{activeDetails.authDomain}</span>
                    </div>
                    {activeDetails.rawMessage && (
                      <div className="pt-1 border-t border-stone-800 text-stone-400 break-words">
                        <span className="text-stone-500">Raw Message: </span>
                        {activeDetails.rawMessage}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Google SSO View */}
        {authMethod === 'sso' && (
          <div className="space-y-4">
            <button
              id="btn-google-sso"
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-stone-800 hover:bg-stone-750 text-stone-100 border border-stone-700 rounded-lg text-sm font-medium transition-colors focus:ring-2 focus:ring-emerald-500/40 focus:outline-none disabled:opacity-50 shadow-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27A7.2 7.2 0 0 1 4.9 12c0-.79.14-1.57.38-2.27V6.58H1.25A11.97 11.97 0 0 0 0 12c0 1.92.46 3.74 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>{isSubmitting ? 'Authenticating with Google...' : 'Continue with Google SSO'}</span>
            </button>

            <div className="text-center">
              <button
                id="btn-toggle-to-email-credentials"
                type="button"
                onClick={switchToEmailAuth}
                className="text-xs text-stone-400 hover:text-emerald-400 underline underline-offset-2 transition-colors"
              >
                Or use email and password credentials
              </button>
            </div>
          </div>
        )}

        {/* Email/Password Form View */}
        {authMethod === 'credentials' && (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
                  <input
                    id="input-auth-name"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Elena Rostova"
                    className="w-full bg-stone-950 border border-stone-800 rounded-lg pl-9 pr-3 py-2 text-sm text-stone-100 placeholder-stone-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
                <input
                  ref={emailInputRef}
                  id="input-auth-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full bg-stone-950 border border-stone-800 rounded-lg pl-9 pr-3 py-2 text-sm text-stone-100 placeholder-stone-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-stone-300">Password</label>
                {mode === 'signin' && (
                  <button
                    id="btn-forgot-password"
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={isResettingPassword}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 underline underline-offset-2 transition-colors disabled:opacity-50"
                  >
                    {isResettingPassword ? 'Sending reset link...' : 'Forgot password?'}
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
                <input
                  id="input-auth-password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full bg-stone-950 border border-stone-800 rounded-lg pl-9 pr-3 py-2 text-sm text-stone-100 placeholder-stone-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <button
              id="btn-auth-submit"
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-stone-950 font-medium rounded-lg text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-stone-950 border-t-transparent" />
              ) : mode === 'signin' ? (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Sign In to Workspace</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Create Workspace</span>
                </>
              )}
            </button>

            <div className="text-center pt-1">
              <button
                id="btn-back-to-sso"
                type="button"
                onClick={() => {
                  setAuthMethod('sso');
                  clearError();
                  setLocalError(null);
                }}
                className="text-xs text-stone-400 hover:text-emerald-400 transition-colors"
              >
                &larr; Return to Google SSO
              </button>
            </div>
          </form>
        )}

        {/* Mode Toggle */}
        <div className="mt-5 text-center text-xs text-stone-400">
          {mode === 'signin' ? (
            <span>
              New to CARE?{' '}
              <button
                id="btn-toggle-to-signup"
                type="button"
                onClick={() => {
                  clearError();
                  setLocalError(null);
                  setMode('signup');
                }}
                className="text-emerald-400 hover:text-emerald-300 font-medium underline underline-offset-2"
              >
                Create an account
              </button>
            </span>
          ) : (
            <span>
              Already registered?{' '}
              <button
                id="btn-toggle-to-signin"
                type="button"
                onClick={() => {
                  clearError();
                  setLocalError(null);
                  setMode('signin');
                }}
                className="text-emerald-400 hover:text-emerald-300 font-medium underline underline-offset-2"
              >
                Sign in
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
