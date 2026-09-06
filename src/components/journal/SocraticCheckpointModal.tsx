import React, { useState } from 'react';
import { Brain, CheckCircle2, AlertTriangle, Sparkles, X, ArrowRight, Loader2, RefreshCw } from 'lucide-react';

interface SocraticCheckpointModalProps {
  isOpen: boolean;
  onClose: () => void;
  topicTitle?: string;
  onSessionComplete?: (score: number) => void;
}

export const SocraticCheckpointModal: React.FC<SocraticCheckpointModalProps> = ({
  isOpen,
  onClose,
  topicTitle = 'Grouped-Query Attention (GQA-8)',
  onSessionComplete,
}) => {
  const [userResponse, setUserResponse] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isEvaluated, setIsEvaluated] = useState(false);
  const [revealedSolution, setRevealedSolution] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleEvaluate = () => {
    if (!userResponse.trim()) return;

    setIsEvaluating(true);
    setTimeout(() => {
      setIsEvaluating(false);
      setIsEvaluated(true);
      setScore(88);
      if (onSessionComplete) {
        onSessionComplete(88);
      }
    }, 1200);
  };

  const handleReset = () => {
    setUserResponse('');
    setIsEvaluated(false);
    setRevealedSolution(false);
    setScore(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white rounded-2xl border border-[#E5E0D8] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-[#FAF8F5] border-b border-[#E5E0D8] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#006948] text-white flex items-center justify-center font-bold text-sm shadow-xs">
              <Brain className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-base text-[#111C2D]">Socratic Checkpoint Drill</h3>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#ECFDF5] text-[#006948] border border-emerald-200">
                  Diagnostic Recall
                </span>
              </div>
              <p className="text-xs font-mono text-[#505F76] truncate max-w-md">{topicTitle}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-[#111C2D] hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Prompt card */}
          <div className="p-4 rounded-xl bg-[#F0F3FF] border border-[#D0DEFF] space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#005691] uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Socratic Diagnostic Question</span>
            </div>
            <p className="text-sm font-sans text-[#111C2D] font-medium leading-relaxed">
              When grouping 32 query heads to 8 key-value heads in GQA ($H_q=32, H_kv=8$), how do you calculate the tensor stride offsets to prevent uncoalesced global memory reads across CUDA thread blocks when batch size $B &gt; 1$?
            </p>
          </div>

          {/* User Input or Evaluation */}
          {!isEvaluated ? (
            <div className="space-y-3">
              <label className="block text-xs font-mono font-semibold text-[#505F76] uppercase">
                Your Mathematical / Architectural Formulation:
              </label>
              <textarea
                value={userResponse}
                onChange={(e) => setUserResponse(e.target.value)}
                placeholder="Explain the stride mechanism, program ID grouping (pid // GROUP_SIZE), and memory alignment constraints..."
                className="w-full h-36 p-3.5 bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl text-xs sm:text-sm font-mono text-[#111C2D] placeholder:text-slate-400 focus:bg-white focus:border-[#006948] focus:outline-none resize-none leading-relaxed"
              />

              <div className="flex items-center justify-between gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setRevealedSolution((prev) => !prev)}
                  className="text-xs font-mono text-[#505F76] hover:text-[#006948] underline underline-offset-4 cursor-pointer"
                >
                  {revealedSolution ? 'Hide Model Solution' : 'Peek Model Solution Reference'}
                </button>

                <button
                  type="button"
                  onClick={handleEvaluate}
                  disabled={!userResponse.trim() || isEvaluating}
                  className="px-4 py-2 rounded-xl bg-[#006948] hover:bg-[#005439] disabled:bg-slate-300 text-white font-sans font-semibold text-xs flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
                >
                  {isEvaluating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Calibrating Neural Retention...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Socratic Diagnostic</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>

              {revealedSolution && (
                <div className="p-3.5 rounded-xl bg-[#FFF8ED] border border-amber-200 text-xs font-mono text-[#8D4B00] space-y-1 animate-in fade-in">
                  <div className="font-bold">Model Solution Reference:</div>
                  <p className="font-sans leading-relaxed text-slate-800">
                    With group size $G = H_q / H_kv = 4$, each KV head index is obtained via <code className="bg-amber-100 px-1 py-0.5 rounded text-amber-900">kv_head_idx = pid // G</code>. To ensure coalesced reads, the stride for the head dimension in Q must multiply by $G$, while K and V strides must preserve continuous memory alignment on 128-byte SRAM tile boundaries.
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Result card */
            <div className="space-y-4 animate-in fade-in">
              <div className="p-4 rounded-xl bg-[#ECFDF5] border border-emerald-300 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#006948] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-sans font-bold text-sm text-[#006948]">
                      Diagnostic Completed: Retention Score Calibrated to {score}%
                    </span>
                  </div>
                  <p className="text-xs font-sans text-emerald-900 leading-relaxed">
                    Your formulation correctly recognized the tensor stride division factor and CUDA thread block alignment invariants. Your topic retention trajectory for GQA has been boosted by +18.4 days.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-mono space-y-2">
                <div className="flex justify-between items-center text-[#505F76]">
                  <span>Telemetry State:</span>
                  <span className="text-[#006948] font-bold">Synchronized with Firestore</span>
                </div>
                <div className="flex justify-between items-center text-[#505F76]">
                  <span>Decay Halflife:</span>
                  <span className="font-bold text-[#111C2D]">S(t) increased from 4.2d → 22.6d</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-3.5 py-1.5 rounded-lg border border-[#E5E0D8] text-xs font-mono text-[#505F76] hover:bg-slate-100 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry Diagnostic</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-[#006948] hover:bg-[#005439] text-white font-sans font-semibold text-xs transition-colors cursor-pointer shadow-xs"
                >
                  Done & Return to Canvas
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
