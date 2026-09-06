/**
 * CARE - Browser Preview Mockup Component (Active Work Journal)
 * Renders the high-fidelity mock workstation showing the extracted mental model,
 * code diff, Ebbinghaus decay curve, and interactive Socratic drill trigger.
 */

import React, { useState } from 'react';
import {
  ShieldCheck,
  RotateCw,
  Share2,
  Lock,
  TrendingDown,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Code2,
  ExternalLink,
  Layers,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { InteractiveDrillModal } from './InteractiveDrillModal';

export const BrowserPreviewMockup: React.FC = () => {
  const [isDrillOpen, setIsDrillOpen] = useState(false);
  const [drillCompleted, setDrillCompleted] = useState(false);
  const [fragileScore, setFragileScore] = useState(54);

  const handleDrillSuccess = () => {
    setDrillCompleted(true);
    setFragileScore(91);
  };

  return (
    <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 sm:mt-8">
      {/* Outer Glow */}
      <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/10 via-slate-200/50 to-emerald-500/10 rounded-3xl blur-xl opacity-70 pointer-events-none" />

      {/* Main Browser Window Container */}
      <div className="relative bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden transition-all">
        {/* Safari/Chrome Window Header */}
        <div className="bg-slate-100/90 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between gap-4">
          {/* Window Traffic Lights */}
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-400 border border-rose-500/30" />
            <span className="w-3 h-3 rounded-full bg-amber-400 border border-amber-500/30" />
            <span className="w-3 h-3 rounded-full bg-emerald-400 border border-emerald-500/30" />
          </div>

          {/* Browser Address Bar */}
          <div className="flex-1 max-w-lg mx-auto bg-white border border-slate-200/90 rounded-lg px-3 py-1 flex items-center justify-between text-xs font-mono text-slate-600 shadow-2xs">
            <div className="flex items-center gap-1.5 truncate">
              <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="truncate">app.care-engine.dev/journal/catboost-shap-attribution</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400 shrink-0">
              <RotateCw className="w-3 h-3 hover:text-slate-700 cursor-pointer transition-colors" />
              <Share2 className="w-3 h-3 hover:text-slate-700 cursor-pointer transition-colors" />
            </div>
          </div>

          {/* Right Placeholder / Status */}
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>telemetry-active</span>
          </div>
        </div>

        {/* Top Metric Bar */}
        <div className="bg-slate-50/90 border-b border-slate-200 px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-1.5 font-semibold text-slate-900 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Retention Index: {drillCompleted ? '89.6%' : '82.4%'}</span>
            </div>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800 font-mono font-medium">
              <AlertTriangle className="w-3 h-3 text-amber-600" />
              <span>{drillCompleted ? '1 Concept At Risk' : '2 Concepts At Risk'}</span>
            </div>
            <span className="text-slate-600 font-mono hidden md:inline">
              14 Entries Indexed
            </span>
            <span className="text-slate-600 font-mono hidden lg:inline">
              Half-Life Mean: {drillCompleted ? '14.8d' : '11.2d'}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">
              ACTIVE MODEL: <strong className="text-slate-800 font-semibold">GEMINI 2.5 FLASH</strong>
            </span>
            <span className="px-2 py-0.5 rounded bg-cyan-50 border border-cyan-200 text-cyan-800 text-[10px] font-mono font-bold tracking-wider">
              LIVE SYNC
            </span>
          </div>
        </div>

        {/* Main Grid Layout (2 Columns) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 p-4 sm:p-5 bg-slate-50/50">
          {/* Left Column (Journal Entry & Code Diff) - 7 cols */}
          <div className="lg:col-span-7 space-y-3.5">
            {/* Metadata Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-slate-200/80 text-slate-800 font-mono font-semibold text-[11px]">
                  ARCH-102
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 font-mono font-bold text-[11px]">
                  85% AI Reliance
                </span>
              </div>
              <span className="text-slate-500 font-sans text-xs">
                Logged 18 hrs ago via VS Code Care Daemon • ARCH-102
              </span>
            </div>

            {/* Entry Title */}
            <h2 className="font-serif text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-snug">
              CatBoost Persona Segmentation & SHAP Feature Attribution
            </h2>

            {/* Topic Tags */}
            <div className="flex flex-wrap gap-1.5">
              {['#CatBoost', '#SHAP', '#MLInference', '#FeatureAttribution'].map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 font-mono text-[11px]"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Core Mental Model Box */}
            <div className="bg-sky-50/80 border border-sky-200/80 rounded-xl p-3.5 text-xs sm:text-sm text-slate-700 leading-relaxed shadow-2xs">
              <span className="font-semibold text-sky-950 block mb-1 font-sans">
                Core Mental Model:
              </span>
              <p className="text-slate-800">
                Naive tree inference returns raw probability scores without exposing feature impact vectors. Wrapping model output with SHAP TreeExplainer generates localized feature attribution, enabling deterministic persona classification.
              </p>
            </div>

            {/* Code Diff Container */}
            <div className="rounded-xl bg-[#0F172A] border border-slate-800 shadow-md overflow-hidden text-left">
              {/* Code Diff Bar */}
              <div className="bg-slate-900/90 px-3.5 py-2 border-b border-slate-800 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
                    MODEL INFERENCE DIFF
                  </span>
                  <span className="text-emerald-400 font-mono text-[11px]">
                    Calibrated Feature Attribution
                  </span>
                </div>
                <span className="text-slate-400 text-[11px]">python</span>
              </div>

              {/* Diff Lines */}
              <div className="p-3 space-y-1 font-mono text-[11px] sm:text-xs overflow-x-auto leading-relaxed">
                <div className="text-slate-400 italic text-[11px]">
                  // [Uncalibrated Raw Output] -&gt; Silent model drift on unverified feature weights
                </div>
                <div className="bg-rose-950/40 text-rose-300 px-2 py-0.5 rounded -mx-1 border-l-2 border-rose-500">
                  <span className="select-none text-rose-500 font-bold mr-2">-</span>
                  def predict_churn(df): return catboost_model.predict_proba(df)
                </div>

                <div className="pt-2 text-emerald-400/90 italic text-[11px]">
                  // [CARE Tracked Invariant] -&gt; SHAP TreeExplainer Localized Persona Extraction
                </div>
                <div className="bg-emerald-950/40 text-emerald-300 px-2 py-0.5 rounded -mx-1 border-l-2 border-emerald-500">
                  <span className="select-none text-emerald-500 font-bold mr-2">+</span>
                  def predict_churn(df):
                </div>
                <div className="bg-emerald-950/40 text-emerald-300 px-2 py-0.5 rounded -mx-1 border-l-2 border-emerald-500">
                  <span className="select-none text-emerald-500 font-bold mr-2">+</span>
                  &nbsp;&nbsp;&nbsp;&nbsp;explainer = shap.TreeExplainer(catboost_model)
                </div>
                <div className="bg-emerald-950/40 text-emerald-300 px-2 py-0.5 rounded -mx-1 border-l-2 border-emerald-500">
                  <span className="select-none text-emerald-500 font-bold mr-2">+</span>
                  &nbsp;&nbsp;&nbsp;&nbsp;shap_values = explainer(df)
                </div>
                <div className="bg-emerald-950/40 text-emerald-300 px-2 py-0.5 rounded -mx-1 border-l-2 border-emerald-500">
                  <span className="select-none text-emerald-500 font-bold mr-2">+</span>
                  &nbsp;&nbsp;&nbsp;&nbsp;return generate_persona_telemetry(df, shap_values)
                </div>
              </div>
            </div>

            {/* Sub-footer below diff */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5 text-[11px] font-mono text-slate-500">
              <div className="flex items-center gap-1.5 text-slate-600">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Telemetry isolated: Verified zero egress to third-party scrapers</span>
              </div>
              <div>
                <span>Decay rate λ = 0.084 / day</span>
              </div>
            </div>
          </div>

          {/* Right Column (Cognitive Analytics & Drills) - 5 cols */}
          <div className="lg:col-span-5 space-y-3.5">
            {/* Ebbinghaus Trajectory Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-3.5 space-y-2.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-slate-800">
                  <TrendingDown className="w-4 h-4 text-slate-600" />
                  <span>EBBINGHAUS TRAJECTORY</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-mono font-bold tracking-wider">
                  DECAY WARNING
                </span>
              </div>

              {/* Decay Curve SVG */}
              <div className="relative h-28 w-full bg-slate-50/70 rounded-lg border border-slate-100 p-2 overflow-hidden flex items-end">
                <svg
                  className="w-full h-full overflow-visible"
                  viewBox="0 0 300 100"
                  preserveAspectRatio="none"
                >
                  {/* Grid lines */}
                  <line x1="0" y1="20" x2="300" y2="20" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="3 3" />
                  <line x1="0" y1="50" x2="300" y2="50" stroke="#F59E0B" strokeWidth="1.2" strokeDasharray="4 3" />
                  <line x1="0" y1="80" x2="300" y2="80" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="3 3" />

                  {/* 60% Recall Threshold Text */}
                  <text x="10" y="46" fill="#D97706" fontSize="8" fontFamily="JetBrains Mono" fontWeight="600">
                    60% RECALL THRESHOLD
                  </text>

                  {/* Exponential Decay Curve */}
                  <path
                    d="M 10,15 C 60,18 120,42 160,52 C 210,65 250,78 290,85"
                    fill="none"
                    stroke="#D97706"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />

                  {/* Point at Day 0 */}
                  <circle cx="10" cy="15" r="3.5" fill="#059669" />

                  {/* Point at Today (T+2.4d) with Warning Pulse */}
                  <circle cx="160" cy="52" r="6" fill="#F59E0B" opacity="0.3" className="animate-ping" />
                  <circle cx="160" cy="52" r="4" fill="#D97706" stroke="#FFFFFF" strokeWidth="1.5" />

                  {/* Point at Day 7 */}
                  <circle cx="290" cy="85" r="3" fill="#64748B" />
                </svg>
              </div>

              {/* X-axis labels */}
              <div className="flex justify-between text-[10px] font-mono text-slate-500 px-1">
                <span>Day 0 (Logged)</span>
                <span className="text-amber-700 font-semibold font-mono">Today (T+2.4d)</span>
                <span>Day 7</span>
              </div>
            </div>

            {/* 2-Min Socratic Drill Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-3.5 space-y-2.5 shadow-2xs relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-slate-800">
                  <Zap className="w-4 h-4 text-emerald-600" />
                  <span>2-MIN SOCRATIC DRILL</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-mono font-bold tracking-wider">
                  CRITICAL TIMING
                </span>
              </div>

              <div className="text-xs sm:text-sm font-medium text-slate-900 leading-snug">
                "Why does computing SHAP values directly from tree margins provide exact additive feature attributions compared to standard feature importance weights?"
              </div>

              <p className="text-[11px] text-slate-500 italic leading-relaxed">
                Answer concisely in your own words. Gemini evaluates your causal understanding rather than rote syntax.
              </p>

              <button
                id="btn-engage-socratic-drill"
                type="button"
                onClick={() => setIsDrillOpen(true)}
                className="w-full py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <span>🗣️ Engage Socratic Drill</span>
              </button>
            </div>

            {/* Decay Attribution Bars */}
            <div className="bg-white rounded-xl border border-slate-200 p-3.5 space-y-2.5 shadow-2xs">
              <div className="font-mono text-xs font-semibold text-slate-800 uppercase tracking-wider">
                Decay Attribution
              </div>

              {/* Item 1 */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-700 font-medium">SHAP Additive Property (Efficiency Invariant)</span>
                  <span className="font-mono text-emerald-700 font-semibold">Stable (91%)</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: '91%' }} />
                </div>
              </div>

              {/* Item 2 */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-700 font-medium">CatBoost Tree Margin Transformations</span>
                  <span className={`font-mono font-semibold ${fragileScore > 70 ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {fragileScore > 70 ? `Reinforced (${fragileScore}%)` : `Fragile (${fragileScore}%)`}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      fragileScore > 70 ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${fragileScore}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Socratic Drill Preview Modal */}
      <InteractiveDrillModal
        isOpen={isDrillOpen}
        onClose={() => setIsDrillOpen(false)}
        onDrillComplete={handleDrillSuccess}
      />
    </div>
  );
};
