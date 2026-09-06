/**
 * CARE - ZeroStateBlueprintPanel Component
 * Right Column: Inline Architecture & Spec Panel (Collapsible):
 * - Header: ⚡ System Architecture & Spec with close ✕ button
 * - 4-Stage Pipeline Flow (01 Journal Ingestion, 02 Gemini 2.5 Extraction, 03 Firestore State, 04 Recall Probes)
 * - UID Isolation Sandbox Card: /users/{request.auth.uid}/journal_entries/{entryId}
 * - Priority Calculus Card: Priority(t) = [0.40·T(t) + 0.35·A(t) + 0.25·H(t)] × M(t)
 * - Infrastructure Matrix: Telemetry Daemon, Inference Engine, Indexing Store, Latency Budget
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  X,
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
  ArrowDown,
} from 'lucide-react';

interface ZeroStateBlueprintPanelProps {
  onClose: () => void;
}

export const ZeroStateBlueprintPanel: React.FC<ZeroStateBlueprintPanelProps> = ({ onClose }) => {
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
        'Web capture or local VS Code daemon telemetry records technical context, diffs, and self-reported AI reliance levels.',
      badge: 'Capture',
      badgeColor: 'bg-[#ECFDF5] text-[#006948] border-emerald-200',
    },
    {
      stage: '02',
      title: 'Gemini 2.5 Concept Extraction',
      subtitle: 'AST parsing & logic vectorization',
      description:
        'Structured response_schema prompts isolate core canonical concepts and structural invariants from raw implementation notes.',
      badge: 'Inference',
      badgeColor: 'bg-[#F0F3FF] text-[#1E293B] border-[#CCD8FF]',
    },
    {
      stage: '03',
      title: 'Firestore State',
      subtitle: 'Decay curve indexation per concept node',
      description:
        'Each concept node is persisted under owner-bound collections with exponential Ebbinghaus half-life trajectories.',
      badge: 'Persistence',
      badgeColor: 'bg-[#FAF8F5] text-[#505F76] border-[#E5E0D8]',
    },
    {
      stage: '04',
      title: 'Knowledge Recall Probes',
      subtitle: 'Targeted Socratic question dispatch',
      description:
        'Dynamic 2-minute Socratic dialogues challenge causal understanding as soon as Priority(t) crosses the decay threshold.',
      badge: 'Retention',
      badgeColor: 'bg-[#FFF8ED] text-[#8D4B00] border-amber-200',
    },
  ];

  const infraMatrix = [
    { label: 'Telemetry Daemon', value: 'v2.4 Rust', detail: 'Local IPC socket' },
    { label: 'Inference Engine', value: 'Gemini 2.5 Flash', detail: 'Structured Pydantic' },
    { label: 'Indexing Store', value: 'Cloud Firestore', detail: 'Owner-bound rules' },
    { label: 'Latency Budget', value: '< 140ms', detail: 'Edge cached' },
  ];

  return (
    <aside
      id="right-blueprint-panel"
      className="bg-white rounded-2xl border border-[#E5E0D8] shadow-sm overflow-hidden text-left sticky top-20 transition-all duration-300 flex flex-col"
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-[#E5E0D8] bg-[#FAF8F5]/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[#006948] text-white flex items-center justify-center shadow-2xs">
            <Zap className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-sm sm:text-base text-[#1E293B] tracking-tight">
              System Architecture & Spec
            </h3>
            <span className="text-[10px] font-mono text-[#006948] font-semibold">
              Live Inspection Panel
            </span>
          </div>
        </div>

        <button
          id="btn-close-blueprint-panel"
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-[#505F76] hover:text-[#1E293B] hover:bg-slate-100 transition-colors cursor-pointer"
          title="Close architecture spec panel"
          aria-label="Close architecture spec panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Panel Scrollable Content */}
      <div className="p-5 space-y-6 max-h-[calc(100vh-140px)] overflow-y-auto">
        {/* 1. 4-Stage Pipeline Flow */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-mono font-semibold text-[#505F76] uppercase tracking-wider">
            <span>4-Stage Pipeline Flow</span>
            <span className="text-[10px] text-[#006948] bg-[#ECFDF5] px-2 py-0.5 rounded border border-emerald-200">
              Active Loop
            </span>
          </div>

          <div className="space-y-3 relative pl-3 border-l-2 border-[#E5E0D8]">
            {pipelineStages.map((stage, idx) => (
              <div key={stage.stage} className="relative space-y-1 group">
                {/* Timeline node */}
                <div className="absolute -left-[19px] top-1 w-3 h-3 rounded-full bg-white border-2 border-[#006948] group-hover:scale-125 transition-transform shadow-2xs" />

                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs font-bold text-[#1E293B]">
                    <span className="font-mono text-[#006948] mr-1">{stage.stage}</span>
                    {stage.title}
                  </div>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider border ${stage.badgeColor}`}
                  >
                    {stage.badge}
                  </span>
                </div>

                <div className="text-[11px] font-mono text-[#505F76]">
                  {stage.subtitle}
                </div>

                <p className="text-xs text-[#505F76] leading-relaxed pt-0.5">
                  {stage.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 2. UID Isolation Sandbox Card */}
        <div className="bg-[#FAF8F5] rounded-xl border border-[#E5E0D8] p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1E293B]">
              <Lock className="w-3.5 h-3.5 text-[#006948]" />
              <span>UID Isolation Sandbox</span>
            </div>
            <span className="px-2 py-0.5 rounded bg-[#ECFDF5] text-[#006948] border border-emerald-200 font-mono text-[10px] font-bold">
              ZERO-LEAKAGE
            </span>
          </div>

          <p className="text-xs text-[#505F76] leading-relaxed">
            All journal logs and concept nodes are strictly partitioned to your authenticated UID in Firestore:
          </p>

          <div className="relative group">
            <pre className="p-2.5 bg-[#1E293B] text-emerald-300 rounded-lg font-mono text-[11px] overflow-x-auto selection:bg-emerald-800">
              <code>{samplePath}</code>
            </pre>
            <button
              type="button"
              onClick={handleCopyPath}
              className="absolute top-2 right-2 p-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs transition-colors cursor-pointer"
              title="Copy Firestore path"
            >
              {copiedPath ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>
          </div>

          <div className="text-[10px] font-mono text-[#505F76] flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-[#006948]" />
            <span>Enforced via request.auth.uid == userId rule</span>
          </div>
        </div>

        {/* 3. Priority Calculus Card */}
        <div className="bg-[#FAF8F5] rounded-xl border border-[#E5E0D8] p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1E293B]">
              <Cpu className="w-3.5 h-3.5 text-[#8D4B00]" />
              <span>Priority Calculus Engine</span>
            </div>
            <span className="px-2 py-0.5 rounded bg-[#FFF8ED] text-[#8D4B00] border border-amber-200 font-mono text-[10px] font-bold">
              FORMULA
            </span>
          </div>

          {/* Equation */}
          <div className="p-3 bg-white rounded-lg border border-[#E5E0D8] font-mono text-xs text-[#1E293B] font-semibold tracking-tight shadow-2xs">
            Priority(t) = [0.40·T(t) + 0.35·A(t) + 0.25·H(t)] × M(t)
          </div>

          {/* Parameter Definitions */}
          <div className="space-y-1.5 text-xs text-[#505F76] font-sans pt-1">
            <div className="flex items-start gap-2">
              <span className="font-mono font-bold text-[#1E293B] w-8 shrink-0">T(t):</span>
              <span>Time decay factor based on Ebbinghaus forgetting rate.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-mono font-bold text-[#006948] w-8 shrink-0">A(t):</span>
              <span>AI reliance signal (0.10 manual → 1.00 autonomous agentic).</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-mono font-bold text-[#1E293B] w-8 shrink-0">H(t):</span>
              <span>Architectural criticality and concept centrality score.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-mono font-bold text-[#8D4B00] w-8 shrink-0">M(t):</span>
              <span>Historical mastery modifier from past recall drill outcomes.</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
