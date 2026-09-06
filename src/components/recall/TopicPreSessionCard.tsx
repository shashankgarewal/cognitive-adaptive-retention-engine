/**
 * CARE - TopicPreSessionCard Component
 * Displays mathematical decay breakdown (T_decay, A_signal, H_weakness, M_freq),
 * human-readable rationale badge, target depth bounds, and
 * the "Begin Active Recall Session" initialization trigger for Slice 3.
 */

import React, { useState } from 'react';
import {
  Brain,
  Sparkles,
  Flame,
  Clock,
  Cpu,
  Layers,
  CheckCircle2,
  AlertCircle,
  X,
  Target,
  ArrowRight,
  Calculator,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { TopicRetentionState, RecallSession } from '../../types';
import { api } from '../../lib/api';
import { getDescriptiveFragileSubconcept } from '../../lib/retentionFragility';

interface TopicPreSessionCardProps {
  topic: TopicRetentionState;
  onClose: () => void;
  onSessionInitialized?: (session: RecallSession, topic: TopicRetentionState) => void;
}

export const TopicPreSessionCard: React.FC<TopicPreSessionCardProps> = ({
  topic,
  onClose,
  onSessionInitialized,
}) => {
  // Compute breakdown client-side or display pre-calculated fields
  const lastEvent = topic.lastRecallAt || topic.lastLoggedAt;
  const elapsedDays = Math.max(0.1, (Date.now() - new Date(lastEvent).getTime()) / (1000 * 86400));
  const T_decay = +(1.0 - Math.exp(-0.1 * elapsedDays)).toFixed(3);
  const A_signal = +(topic.effectiveAiAssistanceWeight || 0.5).toFixed(3);
  const H_weakness = +(
    topic.recallHistory && topic.recallHistory.length > 0
      ? (5.0 - topic.lastRecallScore) / 4.0
      : 0.50
  ).toFixed(3);
  const M_freq = +(1.0 + 0.05 * Math.min(Math.max(0, (topic.journalOccurrences || 1) - 1), 6)).toFixed(3);

  const rawPriority = (0.40 * T_decay + 0.35 * A_signal + 0.25 * H_weakness) * M_freq;
  const priorityScore = Math.round(Math.min(100, Math.max(0, rawPriority * 100)) * 10) / 10;

  // Resolve descriptive fragile subconcept and cognitive loss risk
  const fragility = getDescriptiveFragileSubconcept(
    topic.canonicalName,
    topic.category,
    topic.effectiveAiAssistanceWeight,
    topic.lastRecallScore,
    topic.fragileSubconcept || topic.explanationReason
  );

  // Compute adaptive depth dynamically:
  // If decay priority > 60% OR AI reliance > 70%: Target deeper architectural trade-offs and edge cases
  // Else: Target practical runtime intuition and implementation trade-offs
  const isHighRisk = priorityScore > 60 || A_signal * 100 > 70;
  const computedAdaptiveDepth: 'foundational' | 'intermediate' | 'advanced' = isHighRisk ? 'advanced' : 'intermediate';
  const defaultFocus = isHighRisk
    ? `Deeper architectural trade-offs and edge cases: ${fragility.fragileSubconcept}`
    : `Practical runtime intuition and implementation trade-offs: ${fragility.fragileSubconcept}`;

  const [targetDepth, setTargetDepth] = useState<'foundational' | 'intermediate' | 'advanced'>(computedAdaptiveDepth);
  const [customFocusArea, setCustomFocusArea] = useState(defaultFocus);
  const [isInitializing, setIsInitializing] = useState(false);
  const [initializedSession, setInitializedSession] = useState<RecallSession | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Determine dominant rationale badge
  let rationaleBadge = 'Stable Baseline';
  if (A_signal >= 0.75) rationaleBadge = 'High AI Reliance';
  else if (elapsedDays >= 5.0 || T_decay >= 0.40) rationaleBadge = 'Time Decay Alert';
  else if (H_weakness >= 0.70) rationaleBadge = 'Weak Retention Signal';
  else if (M_freq >= 1.15) rationaleBadge = 'High Frequency Focus';
  else if (priorityScore >= 50.0) rationaleBadge = 'High Priority Decay';

  const isUrgent = priorityScore >= 60;
  const isModerate = priorityScore >= 35 && priorityScore < 60;
  const priorityBadgeStyle = isUrgent
    ? 'bg-rose-950/60 text-rose-300 border-rose-800'
    : isModerate
    ? 'bg-amber-950/60 text-amber-300 border-amber-800'
    : 'bg-emerald-950/60 text-emerald-300 border-emerald-800';

  const handleStartSession = async () => {
    setIsInitializing(true);
    setErrorMessage(null);

    try {
      const res = await api.initRecallSession({
        topicId: topic.topicId,
        targetDepth,
        customFocusArea: customFocusArea.trim() || undefined,
      });

      setInitializedSession(res.session);
      if (onSessionInitialized) {
        onSessionInitialized(res.session, res.topic);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to initialize recall session document');
    } finally {
      setIsInitializing(false);
    }
  };

  return (
    <div
      id="topic-pre-session-backdrop"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="topic-pre-session-modal"
        className="bg-stone-900 border border-stone-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-stone-800 flex items-start justify-between bg-stone-925">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg sm:text-xl font-bold text-stone-100">
                  {topic.canonicalName}
                </h3>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-stone-800 text-stone-400 border border-stone-750 uppercase">
                  {topic.category}
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-1">
                Calibrated Retention Profile &amp; Active Recall Preparation
              </p>
            </div>
          </div>

          <button
            id="btn-close-pre-session"
            type="button"
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded-lg transition-colors shrink-0 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-950/50 border border-rose-800/80 rounded-xl text-xs text-rose-300 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <strong>Initialization Error:</strong> {errorMessage}
              </div>
            </div>
          )}

          {/* Success Session Ready Banner */}
          {initializedSession ? (
            <div className="p-5 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-stone-100 space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                <span>Recall Session Active &amp; Persisted</span>
              </div>
              <p className="text-xs text-stone-300 leading-relaxed">
                Session document <code className="font-mono text-emerald-300 bg-stone-900 px-1.5 py-0.5 rounded border border-stone-800">{initializedSession.sessionId}</code> has been initialized in Firestore under your authenticated UID.
              </p>
              <div className="p-3 bg-stone-900/90 rounded-lg border border-stone-800 text-xs space-y-1.5 font-mono">
                <div className="text-stone-400 flex justify-between">
                  <span>Topic:</span>
                  <span className="text-stone-200 font-semibold">{initializedSession.topicName}</span>
                </div>
                <div className="text-stone-400 flex justify-between">
                  <span>Target Depth:</span>
                  <span className="text-emerald-400 capitalize">{initializedSession.targetDepth}</span>
                </div>
                {initializedSession.customFocusArea && (
                  <div className="text-stone-400 flex justify-between">
                    <span>Focus Area:</span>
                    <span className="text-stone-200">{initializedSession.customFocusArea}</span>
                  </div>
                )}
                <div className="text-stone-400 flex justify-between">
                  <span>Decay Priority:</span>
                  <span className="text-rose-400">{priorityScore.toFixed(1)} / 100</span>
                </div>
              </div>
              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-stone-800 hover:bg-stone-750 text-stone-200 text-xs font-medium rounded-lg transition-colors"
                >
                  Return to Workspace
                </button>
                <button
                  id="btn-launch-interview-stage"
                  type="button"
                  onClick={() => {
                    if (onSessionInitialized) {
                      onSessionInitialized(initializedSession, topic);
                    }
                    onClose();
                  }}
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-stone-950 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <span>Launch Active Recall Session</span>
                  <ArrowRight className="w-3.5 h-3.5 text-stone-950" />
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Decay Heuristic Math Breakdown Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-stone-200 uppercase tracking-wider">
                    <Calculator className="w-4 h-4 text-emerald-400" />
                    <span>Mathematical Decay Breakdown</span>
                  </div>
                  <div className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold border ${priorityBadgeStyle}`}>
                    {isUrgent && <Flame className="w-3 h-3 inline mr-1 text-rose-400" />}
                    Priority: {priorityScore.toFixed(1)} / 100
                  </div>
                </div>

                {/* Dominant Rationale Badge */}
                <div className="flex items-center gap-2 text-xs bg-stone-950 border border-stone-800 rounded-lg p-3">
                  <span className="text-stone-400">Primary Decay Driver:</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-950/70 text-emerald-300 border border-emerald-800/80 font-mono">
                    {rationaleBadge}
                  </span>
                </div>

                {/* Math Matrix Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-stone-950 border border-stone-800/80 rounded-xl p-3">
                    <div className="text-[10px] uppercase font-mono text-stone-500 flex items-center justify-between">
                      <span>T(t) Time Decay</span>
                      <Clock className="w-3 h-3 text-stone-400" />
                    </div>
                    <div className="text-lg font-bold font-mono text-stone-100 mt-1">
                      {T_decay.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-stone-400 mt-0.5 font-mono">
                      {elapsedDays.toFixed(1)}d elapsed (w₁=0.40)
                    </div>
                  </div>

                  <div className="bg-stone-950 border border-stone-800/80 rounded-xl p-3">
                    <div className="text-[10px] uppercase font-mono text-stone-500 flex items-center justify-between">
                      <span>A(t) AI Signal</span>
                      <Cpu className="w-3 h-3 text-amber-400" />
                    </div>
                    <div className="text-lg font-bold font-mono text-amber-300 mt-1">
                      {A_signal.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-stone-400 mt-0.5 font-mono">
                      Offload risk (w₂=0.35)
                    </div>
                  </div>

                  <div className="bg-stone-950 border border-stone-800/80 rounded-xl p-3">
                    <div className="text-[10px] uppercase font-mono text-stone-500 flex items-center justify-between">
                      <span>H(t) History Deficit</span>
                      <Target className="w-3 h-3 text-rose-400" />
                    </div>
                    <div className="text-lg font-bold font-mono text-stone-100 mt-1">
                      {H_weakness.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-stone-400 mt-0.5 font-mono">
                      Recall gap (w₃=0.25)
                    </div>
                  </div>

                  <div className="bg-stone-950 border border-stone-800/80 rounded-xl p-3">
                    <div className="text-[10px] uppercase font-mono text-stone-500 flex items-center justify-between">
                      <span>M(t) Multiplier</span>
                      <Layers className="w-3 h-3 text-emerald-400" />
                    </div>
                    <div className="text-lg font-bold font-mono text-emerald-400 mt-1">
                      {M_freq.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-stone-400 mt-0.5 font-mono">
                      {topic.journalOccurrences} journal touch{topic.journalOccurrences === 1 ? '' : 's'}
                    </div>
                  </div>
                </div>

                {/* Identified Fragile Subconcept & Cognitive Loss Risk */}
                <div className="p-3.5 bg-amber-950/25 rounded-xl border border-amber-800/40 text-xs">
                  <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>Cognitive Fragility Diagnosis</span>
                  </div>
                  <div className="space-y-1.5 text-stone-300">
                    <p>
                      <span className="font-semibold text-amber-300 font-mono text-[11px] uppercase tracking-wide">Fragile Nuance: </span>
                      <span>{fragility.fragileSubconcept}</span>
                    </p>
                    <p>
                      <span className="font-semibold text-rose-300 font-mono text-[11px] uppercase tracking-wide">Cognitive Loss Risk: </span>
                      <span className="text-stone-300">{fragility.cognitiveLossRisk}</span>
                    </p>
                  </div>
                </div>

                {/* Explicit Formula */}
                <div className="p-3 bg-stone-950 rounded-xl border border-stone-850 font-mono text-[11px] text-stone-400 leading-relaxed">
                  <div className="text-emerald-400 font-semibold mb-1">CARE Retention Formula Parameters:</div>
                  <code>
                    Priority(t) = [0.40·{T_decay.toFixed(2)} + 0.35·{A_signal.toFixed(2)} + 0.25·{H_weakness.toFixed(2)}] × {M_freq.toFixed(2)} = {priorityScore.toFixed(1)} / 100
                  </code>
                </div>
              </div>

              {/* Target Depth Selection */}
              <div className="space-y-3 pt-2">
                <label className="text-xs font-semibold text-stone-200 flex items-center gap-1.5 uppercase tracking-wider">
                  <Target className="w-4 h-4 text-emerald-400" />
                  <span>Target Interview Depth</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setTargetDepth('foundational')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      targetDepth === 'foundational'
                        ? 'bg-emerald-950/40 border-emerald-500 text-stone-100 shadow-sm'
                        : 'bg-stone-950 border-stone-800 hover:border-stone-700 text-stone-400'
                    }`}
                  >
                    <div className="font-semibold text-xs text-stone-200">Foundational</div>
                    <div className="text-[11px] text-stone-400 mt-1 leading-snug">
                      Core definitions, fundamental concepts, and primary intuition.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetDepth('intermediate')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      targetDepth === 'intermediate'
                        ? 'bg-emerald-950/40 border-emerald-500 text-stone-100 shadow-sm'
                        : 'bg-stone-950 border-stone-800 hover:border-stone-700 text-stone-400'
                    }`}
                  >
                    <div className="font-semibold text-xs text-emerald-400 flex items-center justify-between">
                      <span>Intermediate</span>
                      <span className="text-[10px] font-mono bg-emerald-900/60 px-1.5 py-0.2 rounded text-emerald-300">Recommended</span>
                    </div>
                    <div className="text-[11px] text-stone-400 mt-1 leading-snug">
                      Mathematical intuition, algorithm trade-offs, and hyperparameters.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetDepth('advanced')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      targetDepth === 'advanced'
                        ? 'bg-emerald-950/40 border-emerald-500 text-stone-100 shadow-sm'
                        : 'bg-stone-950 border-stone-800 hover:border-stone-700 text-stone-400'
                    }`}
                  >
                    <div className="font-semibold text-xs text-stone-200">Advanced</div>
                    <div className="text-[11px] text-stone-400 mt-1 leading-snug">
                      Edge cases, derivation mechanics, failure modes, and anomaly mitigation.
                    </div>
                  </button>
                </div>
              </div>

              {/* Optional Custom Focus Area */}
              <div className="space-y-2 pt-1">
                <label className="text-xs font-semibold text-stone-300 flex items-center justify-between">
                  <span>Custom Focus Area (Optional)</span>
                  <span className="text-[11px] text-stone-500 font-normal">e.g. derivations, loss surface</span>
                </label>
                <input
                  id="input-custom-focus"
                  type="text"
                  value={customFocusArea}
                  onChange={(e) => setCustomFocusArea(e.target.value)}
                  placeholder="e.g. Focus on backpropagation gradient derivations or LoRA rank selection..."
                  className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-xs sm:text-sm text-stone-100 placeholder-stone-600 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              {/* Security Isolation Notice */}
              <div className="pt-2 flex items-center gap-2 text-[11px] text-stone-500 font-mono">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Session documents are strictly isolated to your authenticated UID in Firestore.</span>
              </div>
            </>
          )}
        </div>

        {/* Action Controls Footer */}
        {!initializedSession && (
          <div className="p-4 sm:p-5 border-t border-stone-800 bg-stone-925 flex items-center justify-between gap-3">
            <button
              id="btn-cancel-pre-session"
              type="button"
              onClick={onClose}
              disabled={isInitializing}
              className="px-4 py-2.5 bg-stone-800 hover:bg-stone-750 text-stone-300 text-xs sm:text-sm font-medium rounded-xl transition-colors"
            >
              Cancel
            </button>

            <button
              id="btn-begin-recall-session"
              type="button"
              onClick={handleStartSession}
              disabled={isInitializing}
              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-stone-800 text-stone-950 disabled:text-stone-500 font-semibold text-xs sm:text-sm rounded-xl transition-colors flex items-center gap-2 shadow-sm"
            >
              {isInitializing ? (
                <>
                  <div className="w-4 h-4 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
                  <span>Initializing Session...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-stone-950" />
                  <span>Begin Active Recall Session</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
