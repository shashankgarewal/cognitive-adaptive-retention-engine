/**
 * CARE - SystemBlueprintSpecSection Component
 * Incorporates all System Blueprint & Architecture live specification details:
 * - 4-Stage Ingestion-to-Recall Pipeline Flow
 * - UID Security Sandbox & Owner-Bound Data Paths
 * - Priority Calculus Formula Breakdown
 * - Production Infrastructure & Telemetry Matrix
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Zap,
  Cpu,
  Lock,
  Database,
  Layers,
  CheckCircle2,
  Copy,
  Check,
  Server,
  Activity,
  ArrowRight,
  ShieldCheck,
  Terminal,
} from 'lucide-react';

export const SystemBlueprintSpecSection: React.FC = () => {
  const { user } = useAuth();
  const [copiedPath, setCopiedPath] = useState(false);

  const uid = user?.uid || 'user_demo_uid';
  const samplePath = `/users/${uid}/journal_entries/{entryId}`;

  const handleCopyPath = () => {
    navigator.clipboard.writeText(samplePath);
    setCopiedPath(true);
    setTimeout(() => setCopiedPath(false), 2000);
  };

  const pipelineStages = [
    {
      stage: '01',
      title: 'Journal Ingestion',
      subtitle: 'Technical context & AI reliance capture',
      description:
        'Technical notes, git commit diffs, and self-reported AI reliance levels (None, Prompt, Spec, Agentic) are ingested directly into owner-bound storage.',
      badge: 'Capture',
      badgeColor: 'bg-[#ECFDF5] text-[#006948] border-emerald-200',
    },
    {
      stage: '02',
      title: 'Gemini 3.8 Flash Extraction',
      subtitle: 'AST parsing & logic vectorization',
      description:
        'Structured response_schema prompts isolate core canonical concepts, fragile subconcepts, and cognitive loss risks from raw engineering notes.',
      badge: 'Vertex AI',
      badgeColor: 'bg-[#F0F3FF] text-[#1E293B] border-[#CCD8FF]',
    },
    {
      stage: '03',
      title: 'Firestore State Indexation',
      subtitle: 'Decay curve indexing per concept node',
      description:
        'Each concept node is indexed with exponential Ebbinghaus half-life trajectories, updating current priority score Priority(t) in real time.',
      badge: 'Persistence',
      badgeColor: 'bg-[#FAF8F5] text-[#505F76] border-[#E5E0D8]',
    },
    {
      stage: '04',
      title: 'Knowledge Recall Probes',
      subtitle: 'Targeted Socratic question dispatch',
      description:
        'Autonomous Socratic knowledge partner conducts multi-turn active recall drills when Priority(t) indicates high cognitive decay risk.',
      badge: 'Retention',
      badgeColor: 'bg-[#FFF8ED] text-[#8D4B00] border-amber-200',
    },
  ];

  const infraMatrix = [
    { label: 'Telemetry Ingestion', value: 'v0.1 Web + IPC', detail: 'Local browser & daemon' },
    { label: 'Inference Engine', value: 'Gemini 3.8 Flash', detail: 'Vertex AI / Pydantic schema' },
    { label: 'Indexing Store', value: 'Cloud Firestore', detail: 'Owner-bound security paths' },
    { label: 'Latency Budget', value: '< 140ms p95', detail: 'Edge cached streaming' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-[#E5E0D8] shadow-sm overflow-hidden text-left p-6 sm:p-8 space-y-8">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E5E0D8]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#006948] text-white flex items-center justify-center shadow-xs">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif font-bold text-xl sm:text-2xl text-[#1E293B] tracking-tight">
                System Blueprint &amp; Core Invariants
              </h2>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#ECFDF5] text-[#006948] font-bold border border-emerald-200">
                v0.1 Active
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#505F76] mt-0.5">
              Architectural flow, mathematical priority calculus, and isolated multi-tenant execution paths.
            </p>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-mono text-[#505F76]">
          <Activity className="w-3.5 h-3.5 text-[#006948]" />
          <span>Telemetry Stream Active</span>
        </div>
      </div>

      {/* Grid: 4-Stage Pipeline & Invariants */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: 4-Stage Pipeline Flow (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#505F76]">
              End-to-End Execution Pipeline
            </h3>
            <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Closed Socratic Loop
            </span>
          </div>

          <div className="space-y-4 relative pl-4 border-l-2 border-[#E5E0D8]">
            {pipelineStages.map((stage) => (
              <div key={stage.stage} className="relative space-y-1 group">
                <div className="absolute -left-[23px] top-1 w-3.5 h-3.5 rounded-full bg-white border-2 border-[#006948] group-hover:scale-125 transition-transform shadow-2xs" />
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono font-bold text-[#006948]">
                    Stage {stage.stage}
                  </span>
                  <span className="text-slate-300">•</span>
                  <h4 className="text-sm font-semibold text-[#1E293B]">
                    {stage.title}
                  </h4>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${stage.badgeColor}`}>
                    {stage.badge}
                  </span>
                </div>
                <p className="text-xs text-[#505F76] leading-relaxed">
                  {stage.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Isolation Sandbox + Priority Calculus + Infra Matrix (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* UID Isolation Sandbox */}
          <div className="bg-[#FAF8F5] rounded-xl p-4 border border-[#E5E0D8] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-[#006948]" />
                <span className="text-xs font-mono font-bold text-[#1E293B]">
                  UID ISOLATION SANDBOX
                </span>
              </div>
              <span className="text-[10px] font-mono text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Rule Bound
              </span>
            </div>

            <p className="text-xs text-[#505F76] leading-relaxed">
              Every document path is bound to the authenticated user ID. Cross-tenant leakage is physically barred by Firestore security rules.
            </p>

            <div className="bg-white p-2.5 rounded-lg border border-[#E5E0D8] flex items-center justify-between gap-2">
              <code className="text-[11px] font-mono text-slate-700 truncate select-all">
                {samplePath}
              </code>
              <button
                type="button"
                onClick={handleCopyPath}
                className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
                title="Copy sandbox path"
              >
                {copiedPath ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Priority Engine Math Card */}
          <div className="bg-emerald-50/70 rounded-xl p-4 border border-emerald-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#006948]">
                <Cpu className="w-3.5 h-3.5" />
                <span className="text-xs font-mono font-bold">
                  PRIORITY ENGINE CALCULUS
                </span>
              </div>
              <span className="text-[10px] font-mono font-semibold text-emerald-800">
                Formula Spec
              </span>
            </div>

            <div className="bg-white/90 p-3 rounded-lg border border-emerald-200 font-mono text-xs text-slate-800 text-center shadow-2xs">
              Priority(t) = (0.40·T(t) + 0.35·A(t) + 0.25·H(t)) × M(t)
            </div>

            <p className="text-[11px] text-slate-600 leading-relaxed">
              Where <strong className="text-slate-800">T(t)</strong> is time elapsed, <strong className="text-slate-800">A(t)</strong> is AI reliance weight, <strong className="text-slate-800">H(t)</strong> is recall deficit, and <strong className="text-slate-800">M(t)</strong> is the domain complexity multiplier.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
