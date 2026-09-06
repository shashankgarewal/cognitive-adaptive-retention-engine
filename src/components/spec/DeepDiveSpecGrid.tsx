import React, { useState } from 'react';
import {
  Shield,
  KeyRound,
  Lock,
  Server,
  Cloud,
  Cpu,
  Layers,
  Sparkles,
  Calculator,
  Sliders,
  Users,
  MessageSquare,
  Compass,
  CheckCircle2,
  Copy,
  Check,
} from 'lucide-react';

export const DeepDiveSpecGrid: React.FC = () => {
  const [copiedRule, setCopiedRule] = useState(false);

  // Interactive Decay Calculator State
  const [timeDecay, setTimeDecay] = useState(0.65);
  const [aiReliance, setAiReliance] = useState(0.80);
  const [recallDeficit, setRecallDeficit] = useState(0.40);
  const [domainMultiplier, setDomainMultiplier] = useState(1.5);

  const calculatedPriority =
    (0.4 * timeDecay + 0.35 * aiReliance + 0.25 * recallDeficit) * domainMultiplier;

  const getPriorityCategory = (score: number) => {
    if (score >= 1.0) return { label: 'CRITICAL ATROPHY DRIFT', color: 'text-red-700 bg-red-50 border-red-200' };
    if (score >= 0.7) return { label: 'HIGH DECAY RISK', color: 'text-amber-800 bg-amber-50 border-amber-200' };
    if (score >= 0.4) return { label: 'MODERATE RECALL INTERVAL', color: 'text-blue-800 bg-blue-50 border-blue-200' };
    return { label: 'STABLE RETENTION BASELINE', color: 'text-emerald-800 bg-emerald-50 border-emerald-200' };
  };

  const priorityMeta = getPriorityCategory(calculatedPriority);

  const securityRuleText = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Owner-bound isolation pattern for CARE
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(securityRuleText);
    setCopiedRule(true);
    setTimeout(() => setCopiedRule(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* ========================================================================= */}
      {/* CARD 1: Strict Data Isolation & Security Architecture */}
      {/* ========================================================================= */}
      <div className="bg-white border border-[#E5E0D8] rounded-xl p-5 sm:p-6 flex flex-col shadow-xs">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-[#E5E0D8]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#ECFDF5] border border-emerald-300 text-[#006948] flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-[#1E293B]">
                Strict Data Isolation &amp; Security Architecture
              </h3>
              <p className="text-xs text-[#505F76]">
                Cryptographic tenant boundaries and owner-asserted access controls
              </p>
            </div>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-[#006948] border border-emerald-200 font-bold">
            SEC-LEVEL: HIGH-TENANT
          </span>
        </div>

        {/* Badges Bar */}
        <div className="flex flex-wrap gap-2 my-4">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#F0F3FF] border border-[#E7EEFF] text-[#1E293B] font-mono text-xs">
            <Lock className="w-3 h-3 text-[#006948]" />
            <span>AES-256 At Rest</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#F0F3FF] border border-[#E7EEFF] text-[#1E293B] font-mono text-xs">
            <KeyRound className="w-3 h-3 text-[#006948]" />
            <span>TLS 1.3 In Flight</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#ECFDF5] border border-emerald-200 text-[#006948] font-mono text-xs font-semibold">
            <CheckCircle2 className="w-3 h-3" />
            <span>Zero Cross-Tenant Leakage</span>
          </div>
        </div>

        {/* Path Topology Block */}
        <div className="mb-4">
          <div className="text-xs font-mono font-semibold text-[#505F76] mb-1.5 flex items-center justify-between">
            <span>SUB-COLLECTION PATH TOPOLOGY</span>
            <span className="text-[10px] text-emerald-700">Firebase Firestore</span>
          </div>
          <div className="p-3 bg-[#1E293B] text-slate-100 rounded-lg font-mono text-xs space-y-1.5 border border-slate-700">
            <div className="flex items-center gap-2 text-emerald-300">
              <span className="text-slate-500 select-none">&gt;</span>
              <span>/users/<strong className="text-amber-300">{'{request.auth.uid}'}</strong>/journal_entries/<span className="text-slate-400">{'{entryId}'}</span></span>
            </div>
            <div className="flex items-center gap-2 text-emerald-300">
              <span className="text-slate-500 select-none">&gt;</span>
              <span>/users/<strong className="text-amber-300">{'{request.auth.uid}'}</strong>/retention_topics/<span className="text-slate-400">{'{topicId}'}</span></span>
            </div>
          </div>
        </div>

        {/* Security Rules Snippet */}
        <div className="mt-auto">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-mono font-semibold text-[#505F76]">
              FIRESTORE SECURITY RULES ASSERTION
            </span>
            <button
              type="button"
              onClick={copyToClipboard}
              className="inline-flex items-center gap-1 text-[11px] font-mono text-[#006948] hover:underline cursor-pointer"
            >
              {copiedRule ? (
                <>
                  <Check className="w-3 h-3" /> Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" /> Copy Rule
                </>
              )}
            </button>
          </div>
          <pre className="p-3 bg-[#FAF8F5] border border-[#E5E0D8] rounded-lg font-mono text-[11px] text-[#1E293B] leading-relaxed overflow-x-auto">
            <code>{securityRuleText}</code>
          </pre>
          <p className="text-[11px] text-[#505F76] mt-2 leading-relaxed">
            All document mutations check <code className="font-mono text-[#006948]">request.auth.uid == userId</code>. Unauthenticated requests or mismatched identities result in deterministic, zero-disclosure security rejections.
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CARD 2: Infrastructure & Deployment Matrix */}
      {/* ========================================================================= */}
      <div className="bg-white border border-[#E5E0D8] rounded-xl p-5 sm:p-6 flex flex-col shadow-xs">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-[#E5E0D8]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#F0F3FF] border border-[#E7EEFF] text-[#1E293B] flex items-center justify-center">
              <Server className="w-4 h-4 text-[#006948]" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-[#1E293B]">
                Infrastructure &amp; Deployment Matrix
              </h3>
              <p className="text-xs text-[#505F76]">
                Cloud-native orchestration across Google Cloud &amp; client extensions
              </p>
            </div>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-[#006948] border border-emerald-200 font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            LIVE FLEET
          </span>
        </div>

        {/* Matrix Table */}
        <div className="my-4 overflow-hidden border border-[#E5E0D8] rounded-lg">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#FAF8F5] text-[#505F76] font-mono border-b border-[#E5E0D8]">
              <tr>
                <th className="px-3 py-2 font-semibold">Infrastructure Parameter</th>
                <th className="px-3 py-2 font-semibold">Production Specification</th>
                <th className="px-3 py-2 font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E0D8] font-sans text-[#1E293B]">
              <tr className="hover:bg-[#FAF8F5]/60 transition-colors">
                <td className="px-3 py-2.5 font-medium text-[#505F76]">GCP Project ID</td>
                <td className="px-3 py-2.5 font-mono font-semibold text-[#1E293B]">care-recall-prod</td>
                <td className="px-3 py-2.5 text-right font-mono text-[11px] text-emerald-700 font-medium">LOCKED</td>
              </tr>
              <tr className="hover:bg-[#FAF8F5]/60 transition-colors">
                <td className="px-3 py-2.5 font-medium text-[#505F76]">Backend Runtime</td>
                <td className="px-3 py-2.5 font-mono text-xs">Cloud Run (FastAPI, Py 3.11)</td>
                <td className="px-3 py-2.5 text-right font-mono text-[11px] text-[#006948]">ACTIVE</td>
              </tr>
              <tr className="hover:bg-[#FAF8F5]/60 transition-colors">
                <td className="px-3 py-2.5 font-medium text-[#505F76]">Compute Concurrency</td>
                <td className="px-3 py-2.5 font-mono text-xs">1–20 Instances (Scale to Zero)</td>
                <td className="px-3 py-2.5 text-right font-mono text-[11px] text-slate-500">DYNAMIC</td>
              </tr>
              <tr className="hover:bg-[#FAF8F5]/60 transition-colors">
                <td className="px-3 py-2.5 font-medium text-[#505F76]">Primary LLM Node</td>
                <td className="px-3 py-2.5 font-mono text-xs text-[#006948] font-semibold">Vertex AI: gemini-2.5-flash</td>
                <td className="px-3 py-2.5 text-right font-mono text-[11px] text-emerald-700">READY</td>
              </tr>
              <tr className="hover:bg-[#FAF8F5]/60 transition-colors">
                <td className="px-3 py-2.5 font-medium text-[#505F76]">Active Database</td>
                <td className="px-3 py-2.5 font-mono text-xs">Firestore Native (Real-time sync)</td>
                <td className="px-3 py-2.5 text-right font-mono text-[11px] text-emerald-700">CONNECTED</td>
              </tr>
              <tr className="hover:bg-[#FAF8F5]/60 transition-colors">
                <td className="px-3 py-2.5 font-medium text-[#505F76]">Client Connectors</td>
                <td className="px-3 py-2.5 font-mono text-xs">Cursor / VS Code Plugin + PWA</td>
                <td className="px-3 py-2.5 text-right font-mono text-[11px] text-slate-500">SYNCED</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer info strip */}
        <div className="mt-auto p-3 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2 text-[#505F76]">
            <Cloud className="w-3.5 h-3.5 text-[#006948]" />
            <span>CI/CD: Cloud Build via GitHub Push</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-emerald-100/70 border border-emerald-300 text-[#006948] font-bold text-[11px]">
              UPTIME: 99.98%
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CARD 3: Priority Decay Formula Breakdown */}
      {/* ========================================================================= */}
      <div className="bg-white border border-[#E5E0D8] rounded-xl p-5 sm:p-6 flex flex-col shadow-xs">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-[#E5E0D8]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#FFF8ED] border border-amber-200 text-[#8D4B00] flex items-center justify-center">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-[#1E293B]">
                Priority Decay Formula Breakdown
              </h3>
              <p className="text-xs text-[#505F76]">
                Non-linear cognitive atrophy calculus balancing retention variables
              </p>
            </div>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-bold">
            CALCULUS v1.4
          </span>
        </div>

        {/* Equation Display Block */}
        <div className="my-4 p-4 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-center">
          <div className="text-[10px] font-mono uppercase tracking-widest text-[#505F76] mb-1">
            CORE MATHEMATICAL SPECIFICATION
          </div>
          <div className="font-mono text-base sm:text-lg font-bold text-[#1E293B] tracking-tight py-1 select-all">
            Priority(t) = [0.40 · T(t) + 0.35 · A(t) + 0.25 · H(t)] × M(t)
          </div>
        </div>

        {/* 4 Parameter Breakdown Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
          <div className="p-2.5 rounded-lg border border-[#E5E0D8] bg-white">
            <div className="flex items-center justify-between font-mono text-xs font-bold text-[#1E293B] mb-1">
              <span>T(t) Time Decay</span>
              <span className="text-[#006948] bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">40% W1</span>
            </div>
            <p className="text-[11px] text-[#505F76] leading-relaxed">
              Ebbinghaus curve <code className="font-mono text-slate-800">1 - exp(-t / (λ · S))</code> where <em className="font-serif">S</em> is cognitive stability score.
            </p>
          </div>

          <div className="p-2.5 rounded-lg border border-[#E5E0D8] bg-white">
            <div className="flex items-center justify-between font-mono text-xs font-bold text-[#1E293B] mb-1">
              <span>A(t) AI Reliance</span>
              <span className="text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">35% W2</span>
            </div>
            <p className="text-[11px] text-[#505F76] leading-relaxed">
              Ratio of synthesized LLM code tokens vs manual developer keystrokes (<code className="font-mono text-slate-800">0.0 → 1.0</code>).
            </p>
          </div>

          <div className="p-2.5 rounded-lg border border-[#E5E0D8] bg-white">
            <div className="flex items-center justify-between font-mono text-xs font-bold text-[#1E293B] mb-1">
              <span>H(t) Recall Deficit</span>
              <span className="text-[#1E293B] bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">25% W3</span>
            </div>
            <p className="text-[11px] text-[#505F76] leading-relaxed">
              Historical probe fail rate (<code className="font-mono text-slate-800">1 - passed / total</code>) during Socratic recall sessions.
            </p>
          </div>

          <div className="p-2.5 rounded-lg border border-[#E5E0D8] bg-white">
            <div className="flex items-center justify-between font-mono text-xs font-bold text-[#1E293B] mb-1">
              <span>M(t) Domain Scaler</span>
              <span className="text-purple-800 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200">1.5× MULT</span>
            </div>
            <p className="text-[11px] text-[#505F76] leading-relaxed">
              Critical systems, security invariants &amp; core concurrency weighted at <code className="font-mono text-slate-800">1.5×</code> base priority.
            </p>
          </div>
        </div>

        {/* Interactive Parameter Sandbox Inset */}
        <div className="mt-auto p-3.5 rounded-lg bg-[#F0F3FF] border border-[#E7EEFF]">
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-xs font-bold text-[#1E293B] flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-[#006948]" />
              Interactive Calculus Sandbox
            </span>
            <div className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${priorityMeta.color}`}>
              {priorityMeta.label}
            </div>
          </div>

          {/* Sliders */}
          <div className="grid grid-cols-2 gap-3 mb-3 text-[11px] font-mono">
            <div>
              <div className="flex justify-between text-[#505F76] mb-1">
                <span>T(t) Decay:</span>
                <span className="font-bold text-[#1E293B]">{(timeDecay * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={timeDecay}
                onChange={(e) => setTimeDecay(parseFloat(e.target.value))}
                className="w-full accent-[#006948] cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-[#505F76] mb-1">
                <span>A(t) AI Rel:</span>
                <span className="font-bold text-[#8D4B00]">{(aiReliance * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={aiReliance}
                onChange={(e) => setAiReliance(parseFloat(e.target.value))}
                className="w-full accent-[#8D4B00] cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-[#505F76] mb-1">
                <span>H(t) Deficit:</span>
                <span className="font-bold text-[#1E293B]">{(recallDeficit * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={recallDeficit}
                onChange={(e) => setRecallDeficit(parseFloat(e.target.value))}
                className="w-full accent-slate-700 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-[#505F76] mb-1">
                <span>M(t) Scaler:</span>
                <span className="font-bold text-purple-700">{domainMultiplier.toFixed(1)}×</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="2.0"
                step="0.1"
                value={domainMultiplier}
                onChange={(e) => setDomainMultiplier(parseFloat(e.target.value))}
                className="w-full accent-purple-700 cursor-pointer"
              />
            </div>
          </div>

          {/* Result Output Bar */}
          <div className="flex items-center justify-between p-2 rounded bg-white border border-[#E7EEFF] text-xs font-mono">
            <span className="text-[#505F76]">Calculated Priority Index:</span>
            <span className="font-bold text-base text-[#006948]">
              {calculatedPriority.toFixed(3)}
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CARD 4: Peer Knowledge Partner Behavioral Policy */}
      {/* ========================================================================= */}
      <div className="bg-white border border-[#E5E0D8] rounded-xl p-5 sm:p-6 flex flex-col shadow-xs">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-[#E5E0D8]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#ECFDF5] border border-emerald-300 text-[#006948] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-[#1E293B]">
                Peer Knowledge Partner Behavioral Policy
              </h3>
              <p className="text-xs text-[#505F76]">
                Autonomous Socratic agent constraints and heuristic interaction protocol
              </p>
            </div>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-[#006948] border border-emerald-200 font-bold">
            ADK-SOCRATIC-V2
          </span>
        </div>

        {/* Persona Description Block */}
        <div className="my-4 p-3.5 rounded-lg bg-[#FAF8F5] border-l-4 border-l-[#006948] border border-[#E5E0D8]">
          <div className="font-mono text-[10px] uppercase tracking-wider text-[#006948] font-bold mb-1">
            AGENT ARCHETYPE PERSONA
          </div>
          <p className="font-serif italic text-sm text-[#1E293B] leading-relaxed">
            &ldquo;Colleague in the next seat: calm, senior staff engineer who probes deeply without condescension. Never a quiz show host.&rdquo;
          </p>
        </div>

        {/* 3 Sequential Protocol Steps */}
        <div className="space-y-3 mb-4">
          <div className="p-3 rounded-lg border border-[#E5E0D8] bg-white flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-[#ECFDF5] border border-emerald-300 text-[#006948] font-mono text-xs font-bold flex items-center justify-center shrink-0">
              1
            </div>
            <div>
              <h4 className="font-sans font-bold text-xs text-[#1E293B] mb-0.5">
                Context Extraction Focus
              </h4>
              <p className="text-[11px] text-[#505F76] leading-relaxed">
                Constrains dialogue strictly to 1–2 high-decay nuances. Avoids broad architectural trivia or generic textbooks. Anchors directly onto developer work notes.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-lg border border-[#E5E0D8] bg-white flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-[#ECFDF5] border border-emerald-300 text-[#006948] font-mono text-xs font-bold flex items-center justify-center shrink-0">
              2
            </div>
            <div>
              <h4 className="font-sans font-bold text-xs text-[#1E293B] mb-0.5">
                Edge-Case Provocation
              </h4>
              <p className="text-[11px] text-[#505F76] leading-relaxed">
                Probes runtime failure domains (e.g. cache stampedes, distributed lock lease expiration, re-entrancy risks). Checks if developer truly owns the model.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-lg border border-[#E5E0D8] bg-white flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-[#ECFDF5] border border-emerald-300 text-[#006948] font-mono text-xs font-bold flex items-center justify-center shrink-0">
              3
            </div>
            <div>
              <h4 className="font-sans font-bold text-xs text-[#1E293B] mb-0.5">
                Sentinel Verification Closure
              </h4>
              <p className="text-[11px] text-[#505F76] leading-relaxed">
                Appends <code className="font-mono text-[#006948] font-semibold bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200">[INTERVIEW_COMPLETE]</code> token upon conceptual recall to trigger state updates and decay half-life expansion.
              </p>
            </div>
          </div>
        </div>

        {/* Sentinel Protocol Inset */}
        <div className="mt-auto p-3 rounded-lg bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-mono text-[#505F76] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-3.5 h-3.5 text-[#006948]" />
            <span>Turn Limit: <strong>3 exchanges max</strong></span>
          </div>
          <span className="text-[#006948] font-semibold">Guardrails Enforced</span>
        </div>
      </div>
    </div>
  );
};
