/**
 * CARE - WorkspaceHome Component (Slice 1 Foundation)
 * Primary workspace dashboard displaying user isolation metrics, security integrity,
 * and CARE architectural status.
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import {
  ShieldCheck,
  Database,
  Cpu,
  Brain,
  CheckCircle2,
  Lock,
  ArrowRight,
  BookOpen,
  MessageSquareCode,
  Sparkles,
  RefreshCw,
  KeyRound,
  FileCode,
} from 'lucide-react';

interface WorkspaceHomeProps {
  onOpenAuth: () => void;
}

export const WorkspaceHome: React.FC<WorkspaceHomeProps> = ({ onOpenAuth }) => {
  const { user, profile, refreshProfile } = useAuth();
  const [tokenTestResult, setTokenTestResult] = useState<any | null>(null);
  const [isTestingToken, setIsTestingToken] = useState<boolean>(false);
  const [testError, setTestError] = useState<string | null>(null);

  const handleTestTokenVerification = async () => {
    setIsTestingToken(true);
    setTestError(null);
    try {
      const res = await api.syncUserProfile();
      setTokenTestResult(res);
      await refreshProfile();
    } catch (err: any) {
      setTestError(err.message || 'Token verification failed');
    } finally {
      setIsTestingToken(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Banner / Hero */}
      <div className="bg-stone-900 border border-stone-800 rounded-xl p-6 mb-8 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/25 rounded-md text-xs text-emerald-400 font-mono mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Slice 1 Active: Auth & User Workspace Foundation
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-100">
              {user ? (
                <>Welcome back, <span className="text-emerald-400">{profile?.displayName || user.email?.split('@')[0]}</span></>
              ) : (
                <>Adaptive Retention for <span className="text-emerald-400">Data Science Workflows</span></>
              )}
            </h1>
            <p className="text-sm sm:text-base text-stone-400 mt-2 leading-relaxed">
              Counteracting AI-assisted technical knowledge decay. We capture real-world workflow context,
              model memory decay with exponential heuristics, and trigger targeted Socratic peer interviews.
            </p>
          </div>

          {!user && (
            <div className="shrink-0 flex flex-col sm:flex-row gap-3">
              <button
                id="btn-hero-connect-workspace"
                onClick={onOpenAuth}
                className="py-3 px-6 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-semibold rounded-lg text-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <KeyRound className="w-4 h-4" />
                <span>Sign In / Create Workspace</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Metrics Row (when authenticated) */}
      {user && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-stone-900 border border-stone-800 rounded-xl p-4">
            <div className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-1">
              Journals Logged
            </div>
            <div className="text-2xl font-bold text-stone-100 font-mono">
              {profile?.stats.totalJournalsLogged ?? 0}
            </div>
            <div className="text-[11px] text-stone-500 mt-1 flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              <span>Ready for Slice 2 logging</span>
            </div>
          </div>

          <div className="bg-stone-900 border border-stone-800 rounded-xl p-4">
            <div className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-1">
              Active Topics
            </div>
            <div className="text-2xl font-bold text-stone-100 font-mono">
              {profile?.stats.activeTopicsCount ?? 0}
            </div>
            <div className="text-[11px] text-stone-500 mt-1 flex items-center gap-1">
              <Brain className="w-3 h-3" />
              <span>Scoped in /topic_retention_states</span>
            </div>
          </div>

          <div className="bg-stone-900 border border-stone-800 rounded-xl p-4">
            <div className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-1">
              Mean Recall Score
            </div>
            <div className="text-2xl font-bold text-emerald-400 font-mono">
              {profile?.stats.averageRecallScore ? `${profile.stats.averageRecallScore.toFixed(1)}/5.0` : '—'}
            </div>
            <div className="text-[11px] text-stone-500 mt-1 flex items-center gap-1">
              <MessageSquareCode className="w-3 h-3" />
              <span>Peer interviewer calibration</span>
            </div>
          </div>

          <div className="bg-stone-900 border border-stone-800 rounded-xl p-4">
            <div className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-1">
              Daily Target
            </div>
            <div className="text-2xl font-bold text-stone-100 font-mono">
              {profile?.preferences.dailyRecallTarget ?? 3} <span className="text-xs font-normal text-stone-400">topics</span>
            </div>
            <div className="text-[11px] text-stone-500 mt-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Tone: {profile?.preferences.preferredInterviewTone || 'rigorous_peer'}</span>
            </div>
          </div>
        </div>
      )}

      {/* CARE Architecture & Security Verification Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Card 1: Data Isolation & Auth Integrity */}
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-stone-100">
                  Data Isolation & Authentication
                </h2>
                <p className="text-xs text-stone-400">
                  Zero cross-user leakage enforced via Firestore Security Rules & JWT verification.
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">
              ENFORCED
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-stone-950 border border-stone-800 rounded-lg flex items-center justify-between">
              <span className="text-stone-400">Target Path Pattern:</span>
              <code className="text-emerald-400 font-mono text-[11px]">
                /users/{'{userId}'}/...
              </code>
            </div>

            <div className="p-3 bg-stone-950 border border-stone-800 rounded-lg flex items-center justify-between">
              <span className="text-stone-400">Current Session UID:</span>
              <code className="text-stone-200 font-mono text-[11px]">
                {user ? user.uid : 'Unauthenticated'}
              </code>
            </div>

            <div className="p-3 bg-stone-950 border border-stone-800 rounded-lg flex items-center justify-between">
              <span className="text-stone-400">Auth Method:</span>
              <span className="text-stone-200 font-medium">
                {user?.providerData[0]?.providerId === 'google.com' ? 'Google SSO' : user ? 'Email/Password' : 'None'}
              </span>
            </div>

            {user && (
              <div className="pt-2">
                <button
                  id="btn-test-jwt-verification"
                  onClick={handleTestTokenVerification}
                  disabled={isTestingToken}
                  className="w-full py-2 px-3 bg-stone-800 hover:bg-stone-750 text-stone-200 border border-stone-700 rounded-lg font-medium text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTestingToken ? 'animate-spin' : ''}`} />
                  <span>Verify Firebase JWT with Backend (/api/auth/me)</span>
                </button>
              </div>
            )}

            {testError && (
              <div className="p-2.5 bg-red-950/50 border border-red-900 rounded text-red-300 text-[11px]">
                {testError}
              </div>
            )}

            {tokenTestResult && (
              <div className="p-3 bg-stone-950 border border-emerald-900/60 rounded-lg text-emerald-300 text-[11px] font-mono">
                <div className="flex items-center gap-1.5 text-emerald-400 font-semibold mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Backend Token Verification Succeeded</span>
                </div>
                <div>Status: {tokenTestResult.status}</div>
                <div>Profile UID: {tokenTestResult.user?.uid}</div>
                <div>Provider: {tokenTestResult.user?.authProvider}</div>
              </div>
            )}
          </div>
        </div>

        {/* Card 2: CARE Stack Component Verification */}
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-stone-100">
                  Infrastructure & Runtime Matrix
                </h2>
                <p className="text-xs text-stone-400">
                  Provisioned GCP services and verified CARE architecture modules.
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-stone-800 text-stone-300 border border-stone-700">
              ACTIVE
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-2.5 bg-stone-950 border border-stone-800 rounded-lg">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                <span className="text-stone-300 font-medium">Cloud Firestore</span>
              </div>
              <span className="font-mono text-[11px] text-stone-400 truncate max-w-[200px]">
                ai-studio-aicuratedrecalls-...
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-stone-950 border border-stone-800 rounded-lg">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-emerald-400" />
                <span className="text-stone-300 font-medium">FastAPI Backend</span>
              </div>
              <span className="font-mono text-[11px] text-stone-400">
                Python 3.10 • Pydantic v2
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-stone-950 border border-stone-800 rounded-lg">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-emerald-400" />
                <span className="text-stone-300 font-medium">AI Model</span>
              </div>
              <span className="font-mono text-[11px] text-stone-400">
                gemini-3.8-flash (Proxy)
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-stone-950 border border-stone-800 rounded-lg">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-emerald-400" />
                <span className="text-stone-300 font-medium">Frontend Framework</span>
              </div>
              <span className="font-mono text-[11px] text-stone-400">
                React 19 • Tailwind CSS
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Roadmap & Next Slices */}
      <div className="bg-stone-900 border border-stone-800 rounded-xl p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-400 mb-4">
          Implementation Progress (<span className="text-emerald-400 font-mono">1/4 Vertical Slices</span>)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Slice 1 */}
          <div className="p-4 bg-emerald-950/20 border border-emerald-800/80 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold">
                Slice 1 • Complete
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <h3 className="font-semibold text-stone-100 text-sm">Auth & Workspace</h3>
            <p className="text-xs text-stone-400 mt-1">
              Firebase Auth (Google SSO + Email), JWT verification dependency, and user provisioning.
            </p>
          </div>

          {/* Slice 2 */}
          <div className="p-4 bg-stone-950 border border-stone-800 rounded-lg opacity-85">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-stone-800 text-stone-400">
                Slice 2 • Next
              </span>
              <ArrowRight className="w-4 h-4 text-stone-500" />
            </div>
            <h3 className="font-semibold text-stone-200 text-sm">Journal Ingestion</h3>
            <p className="text-xs text-stone-400 mt-1">
              Markdown input, 4-tier AI assistance signals, and Gemini 3.8 Flash structured concept extraction.
            </p>
          </div>

          {/* Slice 3 */}
          <div className="p-4 bg-stone-950 border border-stone-800 rounded-lg opacity-60">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-stone-800 text-stone-400">
                Slice 3
              </span>
              <Brain className="w-4 h-4 text-stone-600" />
            </div>
            <h3 className="font-semibold text-stone-300 text-sm">Heuristic Priority</h3>
            <p className="text-xs text-stone-500 mt-1">
              Exponential decay math: Priority(t) = (w1*T(t) + w2*A(t) + w3*H(t))*M(t), AI-curated topic queues.
            </p>
          </div>

          {/* Slice 4 */}
          <div className="p-4 bg-stone-950 border border-stone-800 rounded-lg opacity-60">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-stone-800 text-stone-400">
                Slice 4
              </span>
              <MessageSquareCode className="w-4 h-4 text-stone-600" />
            </div>
            <h3 className="font-semibold text-stone-300 text-sm">ADK Peer Interviewer</h3>
            <p className="text-xs text-stone-500 mt-1">
              Multi-turn interactive Socratic recall chat with structured scorecard and retention feedback.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
