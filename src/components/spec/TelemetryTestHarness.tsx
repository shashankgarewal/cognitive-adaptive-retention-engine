import React, { useState, useEffect } from 'react';
import {
  Play,
  RotateCcw,
  CheckCircle2,
  Terminal,
  Cpu,
  Clock,
  Check,
  ChevronRight,
  Code2,
} from 'lucide-react';

type HarnessStatus = 'idle' | 'synthesizing' | 'cloudrun' | 'complete';

interface TelemetryLogEntry {
  time: string;
  stage: string;
  message: string;
  type: 'info' | 'compute' | 'success' | 'warning';
}

export const TelemetryTestHarness: React.FC = () => {
  const [status, setStatus] = useState<HarnessStatus>('idle');
  const [logs, setLogs] = useState<TelemetryLogEntry[]>([
    {
      time: '00:00.000',
      stage: 'READY',
      message: 'Telemetry test harness initialized in sandboxed tenant environment.',
      type: 'info',
    },
  ]);
  const [showPayload, setShowPayload] = useState(false);

  // Execute Simulated Telemetry Ingestion Loop
  const handleRunSimulation = () => {
    if (status !== 'idle' && status !== 'complete') return;

    setStatus('synthesizing');
    setLogs([
      {
        time: '00:00.012',
        stage: 'HOOK:PRE-COMMIT',
        message: 'Captured git staged diff (+382 lines) & AST tokens from VS Code telemetry daemon.',
        type: 'info',
      },
      {
        time: '00:00.024',
        stage: 'CLIENT:AUTH',
        message: 'Signed Firebase Auth JWT verified. Asserts uid="usr_dev_48f9d02a". Payload sanitized.',
        type: 'compute',
      },
    ]);

    // Step 2 transition: Cloud Run + Vertex AI
    setTimeout(() => {
      setStatus('cloudrun');
      setLogs((prev) => [
        ...prev,
        {
          time: '00:00.068',
          stage: 'CLOUDRUN:FASTAPI',
          message: 'FastAPI container ingested JournalEntryPayload. Dispatched to Vertex AI task pool.',
          type: 'compute',
        },
        {
          time: '00:00.124',
          stage: 'VERTEX:GEMINI-2.5',
          message: 'gemini-2.5-flash extracted 3 canonical concepts: [Distributed Locking, Token Ratio Decay, Firestore Rules].',
          type: 'info',
        },
      ]);

      // Step 3 transition: Persistence & complete
      setTimeout(() => {
        setStatus('complete');
        setLogs((prev) => [
          ...prev,
          {
            time: '00:00.142',
            stage: 'FIRESTORE:COMMITTED',
            message: 'Committed to /users/usr_dev_48f9d02a/journal_entries/ent_99a82f. 200 OK (Runtime: 142ms).',
            type: 'success',
          },
        ]);
      }, 1100);
    }, 1000);
  };

  const handleReset = () => {
    setStatus('idle');
    setLogs([
      {
        time: '00:00.000',
        stage: 'READY',
        message: 'Telemetry test harness reset. Pipeline ready for execution.',
        type: 'info',
      },
    ]);
  };

  // Status Indicator Text & Styling
  const getStatusDisplay = () => {
    switch (status) {
      case 'synthesizing':
        return {
          text: 'Synthesizing Prompt Payload...',
          badgeClass: 'bg-amber-50 border-amber-300 text-[#8D4B00]',
          dotClass: 'bg-amber-500 animate-pulse',
        };
      case 'cloudrun':
        return {
          text: 'FastAPI Cloud Run > Vertex AI',
          badgeClass: 'bg-blue-50 border-blue-300 text-blue-800',
          dotClass: 'bg-blue-600 animate-pulse',
        };
      case 'complete':
        return {
          text: '200 OK: /users/{uid}/journal_entries',
          badgeClass: 'bg-[#ECFDF5] border-emerald-300 text-[#006948]',
          dotClass: 'bg-emerald-600',
        };
      default:
        return {
          text: 'Pipeline Ready: Idle',
          badgeClass: 'bg-[#FAF8F5] border-[#E5E0D8] text-[#505F76]',
          dotClass: 'bg-slate-400',
        };
    }
  };

  const currentStatusDisplay = getStatusDisplay();

  return (
    <div className="bg-white border border-[#E5E0D8] rounded-xl p-5 sm:p-6 lg:p-7 shadow-xs">
      {/* Header & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E5E0D8]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded bg-[#ECFDF5] text-[#006948] flex items-center justify-center font-mono text-xs font-bold">
              &gt;_
            </div>
            <h2 className="font-serif font-bold text-xl text-[#1E293B]">
              Execute Simulated Telemetry Ingestion Loop
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[#505F76]">
            Fire a mock Git pre-commit signal through client auth hygiene, Cloud Run worker routing, and Vertex AI concept extraction.
          </p>
        </div>

        {/* Live Status Indicator */}
        <div className="flex items-center gap-3">
          <div
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border font-mono text-xs font-semibold shadow-2xs transition-all ${currentStatusDisplay.badgeClass}`}
          >
            <span className={`w-2 h-2 rounded-full ${currentStatusDisplay.dotClass}`} />
            <span>{currentStatusDisplay.text}</span>
          </div>

          <button
            type="button"
            onClick={status === 'complete' ? handleReset : handleRunSimulation}
            disabled={status === 'synthesizing' || status === 'cloudrun'}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-xs font-semibold shadow-2xs transition-all cursor-pointer ${
              status === 'synthesizing' || status === 'cloudrun'
                ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                : 'bg-[#006948] hover:bg-[#005439] text-white active:scale-98'
            }`}
          >
            {status === 'complete' ? (
              <>
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Pipeline</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Simulate Telemetry Run</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Progress Stepper Bar */}
      <div className="py-4 border-b border-[#E5E0D8]">
        <div className="grid grid-cols-3 gap-2 text-xs font-mono">
          <div
            className={`p-2.5 rounded border transition-all ${
              status === 'synthesizing'
                ? 'bg-amber-50/70 border-amber-300 text-[#8D4B00] font-semibold'
                : status === 'cloudrun' || status === 'complete'
                ? 'bg-[#ECFDF5] border-emerald-300 text-[#006948]'
                : 'bg-[#FAF8F5] border-[#E5E0D8] text-slate-400'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span>01. Synthesizing Payload</span>
              {(status === 'cloudrun' || status === 'complete') && <Check className="w-3 h-3 text-emerald-600" />}
            </div>
            <span className="text-[10px] text-slate-500 block">Git hook diff &amp; AST tokens</span>
          </div>

          <div
            className={`p-2.5 rounded border transition-all ${
              status === 'cloudrun'
                ? 'bg-blue-50/70 border-blue-300 text-blue-800 font-semibold'
                : status === 'complete'
                ? 'bg-[#ECFDF5] border-emerald-300 text-[#006948]'
                : 'bg-[#FAF8F5] border-[#E5E0D8] text-slate-400'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span>02. Cloud Run &gt; Vertex AI</span>
              {status === 'complete' && <Check className="w-3 h-3 text-emerald-600" />}
            </div>
            <span className="text-[10px] text-slate-500 block">FastAPI + gemini-2.5-flash</span>
          </div>

          <div
            className={`p-2.5 rounded border transition-all ${
              status === 'complete'
                ? 'bg-[#ECFDF5] border-emerald-300 text-[#006948] font-semibold'
                : 'bg-[#FAF8F5] border-[#E5E0D8] text-slate-400'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span>03. Firestore Commit</span>
              {status === 'complete' && <Check className="w-3 h-3 text-emerald-600" />}
            </div>
            <span className="text-[10px] text-slate-500 block">200 OK /users/{'{uid}'}</span>
          </div>
        </div>
      </div>

      {/* Terminal Telemetry Output Window */}
      <div className="pt-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 font-mono text-xs text-[#505F76]">
            <Terminal className="w-3.5 h-3.5 text-[#006948]" />
            <span>TERMINAL EXECUTION LOG</span>
            <span className="text-[10px] text-slate-400">({logs.length} events emitted)</span>
          </div>
          <button
            type="button"
            onClick={() => setShowPayload(!showPayload)}
            className="text-xs font-mono text-[#006948] hover:underline inline-flex items-center gap-1 cursor-pointer"
          >
            <Code2 className="w-3 h-3" />
            <span>{showPayload ? 'Hide Payload' : 'Inspect JSON Payload'}</span>
          </button>
        </div>

        <div className="bg-[#1E293B] text-slate-200 rounded-lg p-3 sm:p-4 font-mono text-xs border border-slate-700 min-h-[140px] max-h-[220px] overflow-y-auto space-y-1.5 shadow-inner">
          {logs.map((log, idx) => (
            <div key={idx} className="flex items-start gap-2 leading-relaxed">
              <span className="text-slate-500 shrink-0 select-none">[{log.time}]</span>
              <span
                className={`font-semibold shrink-0 select-none ${
                  log.type === 'success'
                    ? 'text-emerald-400'
                    : log.type === 'compute'
                    ? 'text-blue-400'
                    : 'text-amber-400'
                }`}
              >
                [{log.stage}]
              </span>
              <span className="text-slate-200">{log.message}</span>
            </div>
          ))}

          {(status === 'synthesizing' || status === 'cloudrun') && (
            <div className="flex items-center gap-2 text-slate-400 animate-pulse pt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Streaming synchronous telemetry traces from Cloud Run...</span>
            </div>
          )}
        </div>

        {/* Collapsible JSON Payload Inspector */}
        {showPayload && (
          <div className="mt-3 p-3 bg-[#FAF8F5] border border-[#E5E0D8] rounded-lg">
            <div className="font-mono text-[10px] font-bold text-[#505F76] mb-1 uppercase tracking-wider">
              Sample Telemetry Ingestion Contract (FastAPI Pydantic Model)
            </div>
            <pre className="font-mono text-[11px] text-[#1E293B] overflow-x-auto leading-relaxed">
{`{
  "raw_content": "Engineered distributed locking using Redis Redlock and handled lease expirations.",
  "ai_reliance_level": "assisted", // mapped to numerical ratio: 0.65
  "git_metadata": {
    "commit_hash": "c4d8e901f",
    "files_changed": ["services/lock_manager.py"],
    "staged_tokens": 1420
  },
  "domain_tags": ["concurrency", "distributed_systems"]
}`}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
