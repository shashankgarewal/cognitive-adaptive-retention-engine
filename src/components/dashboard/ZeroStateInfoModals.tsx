/**
 * CARE - ZeroStateInfoModals Component
 * Accessible dialogs for the secondary quick links:
 * - "How does CARE detect AI reliance?"
 * - "Read Security & UID Isolation Spec"
 * - "View Quickstart Guide"
 */

import React from 'react';
import { X, HelpCircle, ShieldCheck, BookOpen, Code2, Terminal, Wand2, Bot, CheckCircle2 } from 'lucide-react';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'ai-reliance' | 'security-spec' | 'quickstart' | null;
  onOpenLogModal?: () => void;
}

export const ZeroStateInfoModals: React.FC<InfoModalProps> = ({
  isOpen,
  onClose,
  type,
  onOpenLogModal,
}) => {
  if (!isOpen || !type) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl border border-[#E5E0D8] shadow-2xl overflow-hidden text-left">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#E5E0D8] bg-[#FAF8F5] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#ECFDF5] text-[#006948] flex items-center justify-center border border-emerald-200">
              {type === 'ai-reliance' && <HelpCircle className="w-4 h-4" />}
              {type === 'security-spec' && <ShieldCheck className="w-4 h-4" />}
              {type === 'quickstart' && <BookOpen className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-[#1E293B]">
                {type === 'ai-reliance' && 'How CARE Detects AI Reliance'}
                {type === 'security-spec' && 'Security & UID Isolation Specification'}
                {type === 'quickstart' && 'CARE Quickstart & Onboarding Guide'}
              </h3>
              <p className="text-xs text-[#505F76] font-mono">
                {type === 'ai-reliance' && 'Telemetry signals & heuristic calibration'}
                {type === 'security-spec' && 'Owner-bound cryptographically partitioned database'}
                {type === 'quickstart' && 'Three steps to establish continuous mastery'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-sm text-[#1E293B]">
          {/* AI Reliance Modal Content */}
          {type === 'ai-reliance' && (
            <div className="space-y-4">
              <p className="text-[#505F76] leading-relaxed">
                CARE treats AI assistance as an empirical retention signal rather than an arbitrary penalty. When code is authored with high AI autonomy, memory decay accelerates because the developer did not experience the cognitive resistance required for durable encoding.
              </p>

              <div className="space-y-3">
                <div className="font-semibold font-serif text-[#1E293B]">The 4 Reliance Signal Tiers:</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-[#1E293B]">
                      <Code2 className="w-3.5 h-3.5 text-[#006948]" />
                      <span>Manual / Zero AI (A = 0.10)</span>
                    </div>
                    <p className="text-xs text-[#505F76]">
                      Direct theoretical derivation and native implementation. Retains highest half-life.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-[#1E293B]">
                      <Terminal className="w-3.5 h-3.5 text-sky-700" />
                      <span>Prompt-Driven (A = 0.50)</span>
                    </div>
                    <p className="text-xs text-[#505F76]">
                      Iterative conversational queries for snippets, syntax lookup, or troubleshooting.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-[#1E293B]">
                      <Wand2 className="w-3.5 h-3.5 text-purple-700" />
                      <span>Spec-Driven (A = 0.80)</span>
                    </div>
                    <p className="text-xs text-[#505F76]">
                      High-level architectural prompt specs; AI implements boilerplate and logic.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-[#1E293B]">
                      <Bot className="w-3.5 h-3.5 text-rose-700" />
                      <span>Autonomous Agentic (A = 1.00)</span>
                    </div>
                    <p className="text-xs text-[#505F76]">
                      Agent runs commands, creates files, and self-heals tests. Triggers priority drills.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-[#F0F3FF] rounded-xl border border-[#CCD8FF] text-xs text-slate-700">
                <strong>Daemon Automation:</strong> The VS Code Care Daemon socket tracks editor paste events and LLM completion diffs to suggest accurate AI reliance tiers automatically.
              </div>
            </div>
          )}

          {/* Security Spec Modal Content */}
          {type === 'security-spec' && (
            <div className="space-y-4">
              <p className="text-[#505F76] leading-relaxed">
                CARE is built around a zero-knowledge developer privacy invariant. Your codebases, commits, and private engineering journals are never aggregated or used for model training.
              </p>

              <div className="space-y-3">
                <div className="p-4 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] space-y-2">
                  <div className="flex items-center gap-2 font-bold text-xs text-[#006948]">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Cryptographic Firestore Owner Path Binding</span>
                  </div>
                  <pre className="p-2 bg-[#1E293B] text-emerald-300 rounded font-mono text-xs overflow-x-auto">
                    match /users/{'{userId}'}/journal_entries/{'{entryId}'} {'{'}{'\n'}
                    &nbsp;&nbsp;allow read, write: if request.auth.uid == userId;{'\n'}
                    {'}'}
                  </pre>
                  <p className="text-xs text-[#505F76]">
                    Database rules strictly prevent cross-tenant reading or modification. Unauthenticated requests are rejected immediately at the ingress proxy.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 rounded-xl border border-[#E5E0D8] bg-white space-y-1">
                    <div className="text-xs font-semibold text-[#1E293B] flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#006948]" />
                      <span>Local-First Socket IPC</span>
                    </div>
                    <p className="text-xs text-[#505F76]">
                      Telemetry communicates through a local Unix domain socket before encrypted HTTPS transmission.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl border border-[#E5E0D8] bg-white space-y-1">
                    <div className="text-xs font-semibold text-[#1E293B] flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#006948]" />
                      <span>Zero Training Data Egress</span>
                    </div>
                    <p className="text-xs text-[#505F76]">
                      Gemini API requests run with explicit non-logging parameters. Your prompts stay private.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quickstart Guide Modal Content */}
          {type === 'quickstart' && (
            <div className="space-y-4">
              <p className="text-[#505F76] leading-relaxed">
                Establish your cognitive retention baseline in less than 3 minutes.
              </p>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5]">
                  <div className="w-6 h-6 rounded-full bg-[#006948] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-[#1E293B]">Log an Initial Technical Decision</h4>
                    <p className="text-xs text-[#505F76] mt-0.5">
                      Click "+ Log Work Journal" to record what you built today, paste your code diff, and tag your AI reliance.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5]">
                  <div className="w-6 h-6 rounded-full bg-[#006948] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-[#1E293B]">Inspect Gemini Concept Extraction</h4>
                    <p className="text-xs text-[#505F76] mt-0.5">
                      Gemini 3.8 Flash automatically vectorizes canonical concepts and generates your Ebbinghaus memory curve.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5]">
                  <div className="w-6 h-6 rounded-full bg-[#006948] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-[#1E293B]">Engage in 2-Minute Socratic Drills</h4>
                    <p className="text-xs text-[#505F76] mt-0.5">
                      Receive interleaved Socratic inquiries testing causal comprehension rather than rote syntax.
                    </p>
                  </div>
                </div>
              </div>

              {onOpenLogModal && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenLogModal();
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#006948] hover:bg-[#005439] text-white font-medium text-xs sm:text-sm text-center transition-colors cursor-pointer shadow-xs"
                  >
                    Get Started: Log First Journal Entry
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-[#E5E0D8] bg-[#FAF8F5] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-[#E5E0D8] bg-white hover:bg-slate-50 text-xs font-semibold text-[#1E293B] transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
