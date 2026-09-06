import React, { useState, useEffect, useMemo } from 'react';
import {
  Brain,
  Sparkles,
  Send,
  X,
  Database,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ChevronRight,
  ArrowRight,
  Zap,
  Clock,
  Activity,
  Layers,
} from 'lucide-react';
import { SocraticCheckpointModal } from './SocraticCheckpointModal';
import { aiService, extractConceptsLocally } from '../../lib/aiService';
import { getDescriptiveFragileSubconcept } from '../../lib/retentionFragility';

interface CoThinkingDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  body: string;
  onCommitSession: () => void;
  persistAiThread: boolean;
  setPersistAiThread: (val: boolean) => void;
  showToast: (msg: string) => void;
}

export const CoThinkingDrawer: React.FC<CoThinkingDrawerProps> = ({
  isOpen,
  onClose,
  title,
  body,
  onCommitSession,
  persistAiThread,
  setPersistAiThread,
  showToast,
}) => {
  const [aiChatInput, setAiChatInput] = useState('');
  const [isAiResponding, setIsAiResponding] = useState(false);
  const [isCheckpointOpen, setIsCheckpointOpen] = useState(false);
  const [modelLatency, setModelLatency] = useState<string>('45ms');

  const [dynamicQuickPrompts, setDynamicQuickPrompts] = useState<string[]>([]);

  const [chatHistory, setChatHistory] = useState<
    Array<{
      role: 'assistant' | 'user';
      message: string;
      timestamp: string;
      modelLatency?: string;
      mathBlock?: string;
      recommendation?: string;
    }>
  >([]);

  // Derived concept focus for Socratic cards
  const activeConcepts = useMemo(() => {
    return extractConceptsLocally(title, body).concepts;
  }, [title, body]);

  const primaryConcept = useMemo(() => {
    return activeConcepts[0]?.canonicalName || title.trim() || '';
  }, [activeConcepts, title]);

  const primaryCategory = useMemo(() => {
    return activeConcepts[0]?.category || 'Data Science';
  }, [activeConcepts]);

  const fragility = useMemo(() => {
    if (!primaryConcept) return null;
    return getDescriptiveFragileSubconcept(primaryConcept, primaryCategory);
  }, [primaryConcept, primaryCategory]);

  const focusSummary = useMemo(() => {
    if (activeConcepts.length > 0) {
      return `Focus: ${activeConcepts.map((c) => c.canonicalName).join(', ')}`;
    }
    if (title.trim()) {
      return `Focus: ${title.trim()}`;
    }
    return 'Your canvas is currently blank. Draft technical notes or load a template to activate real-time Socratic analysis.';
  }, [activeConcepts, title]);

  // Sync initial dynamic AI analysis whenever document or drawer state changes
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsAiResponding(true);
    const startT = performance.now();

    aiService
      .cothinkingChat({
        title,
        body,
        message: 'init',
      })
      .then((res) => {
        if (!isMounted) return;
        const elapsed = `${Math.max(25, Math.round(performance.now() - startT))}ms`;
        setChatHistory([
          {
            role: 'assistant',
            message: res.assistantMessage,
            timestamp: 'Just now',
            modelLatency: res.modelLatency || elapsed,
            mathBlock: res.mathBlock,
            recommendation: res.recommendation,
          },
        ]);
        if (res.dynamicQuickPrompts && res.dynamicQuickPrompts.length > 0) {
          setDynamicQuickPrompts(res.dynamicQuickPrompts);
        }
        setModelLatency(res.modelLatency || elapsed);
        setIsAiResponding(false);
      })
      .catch((err) => {
        console.warn('Co-Thinking init error:', err);
        if (isMounted) {
          const elapsed = `${Math.max(25, Math.round(performance.now() - startT))}ms`;
          setModelLatency(elapsed);
          setIsAiResponding(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, title, body]);

  const handleSendAiMessage = async (forcedText?: string) => {
    const text = (forcedText || aiChatInput).trim();
    if (!text) return;

    const userTurn = {
      role: 'user' as const,
      message: text,
      timestamp: 'Just now',
    };

    setChatHistory((prev) => [...prev, userTurn]);
    if (!forcedText) setAiChatInput('');
    setIsAiResponding(true);
    const startT = performance.now();

    try {
      const res = await aiService.cothinkingChat({
        title,
        body,
        message: text,
        history: chatHistory.map((turn) => ({ role: turn.role, message: turn.message })),
      });

      const elapsed = `${Math.max(25, Math.round(performance.now() - startT))}ms`;

      setChatHistory((prev) => [
        ...prev,
        {
          role: 'assistant',
          message: res.assistantMessage,
          timestamp: 'Just now',
          modelLatency: res.modelLatency || elapsed,
          mathBlock: res.mathBlock,
          recommendation: res.recommendation,
        },
      ]);

      if (res.dynamicQuickPrompts && res.dynamicQuickPrompts.length > 0) {
        setDynamicQuickPrompts(res.dynamicQuickPrompts);
      }
      setModelLatency(res.modelLatency || elapsed);
    } catch (err) {
      console.warn('Co-Thinking message error:', err);
      const elapsed = `${Math.max(25, Math.round(performance.now() - startT))}ms`;
      setChatHistory((prev) => [
        ...prev,
        {
          role: 'assistant',
          message: `Regarding "${text}": In the context of ${primaryConcept || 'your technical notes'}, maintaining parity between mathematical formulations and runtime execution prevents edge-case degradation.${
            fragility ? ` Pay special attention to: ${fragility.fragileSubconcept}.` : ''
          }`,
          timestamp: 'Just now',
          modelLatency: elapsed,
        },
      ]);
      setModelLatency(elapsed);
    } finally {
      setIsAiResponding(false);
    }
  };

  return (
    <>
      <aside
        id="coThinkingWrapper"
        className={`w-full lg:w-[460px] xl:w-[500px] bg-white border-l border-[#E5E0D8] shadow-xl flex flex-col transition-all duration-300 ease-in-out shrink-0 ${
          isOpen ? 'block' : 'hidden'
        }`}
      >
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-[#E5E0D8] bg-[#FAF8F5] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#006948] text-white flex items-center justify-center font-bold shadow-xs">
              <Brain className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-base text-[#111C2D]">
                  Co-Thinking Partner
                </h3>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#ECFDF5] text-[#006948] border border-emerald-200">
                  Gemini 3.8 Flash
                </span>
              </div>
              <p className="text-[11px] text-[#505F76] font-mono">
                Socratic feedback &amp; cognitive retention probes
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-[#111C2D] hover:bg-slate-200/60 transition-colors cursor-pointer"
            title="Close drawer (Cmd+/)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dynamic Quick-Prompt Chips */}
        <div className="px-4 py-2.5 bg-white border-b border-[#F0ECE6] flex flex-wrap items-center gap-1.5 overflow-x-auto">
          {dynamicQuickPrompts.length > 0 ? (
            dynamicQuickPrompts.map((promptText, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendAiMessage(promptText)}
                className="px-2.5 py-1 rounded-full bg-[#FAF8F5] hover:bg-[#ECFDF5] hover:text-[#006948] border border-[#E5E0D8] text-[#111C2D] text-[11px] font-mono transition-colors cursor-pointer whitespace-nowrap"
              >
                {promptText}
              </button>
            ))
          ) : !primaryConcept ? (
            <>
              <button
                type="button"
                onClick={() => handleSendAiMessage('How does the CARE retention engine quantify AI-induced forgetting?')}
                className="px-2.5 py-1 rounded-full bg-[#FAF8F5] hover:bg-[#ECFDF5] hover:text-[#006948] border border-[#E5E0D8] text-[#111C2D] text-[11px] font-mono transition-colors cursor-pointer whitespace-nowrap"
              >
                💡 Explain Retention Math
              </button>
              <button
                type="button"
                onClick={() => handleSendAiMessage('What notes or architecture should I document to test active recall?')}
                className="px-2.5 py-1 rounded-full bg-[#FAF8F5] hover:bg-[#ECFDF5] hover:text-[#006948] border border-[#E5E0D8] text-[#111C2D] text-[11px] font-mono transition-colors cursor-pointer whitespace-nowrap"
              >
                💡 Socratic Topics
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => handleSendAiMessage(`Coach me on potential technical blindspots or conceptual gaps in ${primaryConcept}.`)}
                className="px-2.5 py-1 rounded-full bg-[#FAF8F5] hover:bg-[#ECFDF5] hover:text-[#006948] border border-[#E5E0D8] text-[#111C2D] text-[11px] font-mono transition-colors cursor-pointer whitespace-nowrap"
              >
                🎯 Coach Gaps in {primaryConcept.slice(0, 18)}
              </button>
              <button
                type="button"
                onClick={() => handleSendAiMessage(`Summarize key concepts and mathematical trade-offs from ${primaryConcept}.`)}
                className="px-2.5 py-1 rounded-full bg-[#FAF8F5] hover:bg-[#ECFDF5] hover:text-[#006948] border border-[#E5E0D8] text-[#111C2D] text-[11px] font-mono transition-colors cursor-pointer whitespace-nowrap"
              >
                📋 Summarize Concepts
              </button>
              <button
                type="button"
                onClick={() => handleSendAiMessage(`Brainstorm edge cases and boundary conditions for ${primaryConcept}.`)}
                className="px-2.5 py-1 rounded-full bg-[#FAF8F5] hover:bg-[#ECFDF5] hover:text-[#006948] border border-[#E5E0D8] text-[#111C2D] text-[11px] font-mono transition-colors cursor-pointer whitespace-nowrap"
              >
                ⚡ Probe Edge Cases
              </button>
            </>
          )}
        </div>

        {/* Interactive Chat / Socratic Stream */}
        <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4 bg-white">
          {/* Socratic Focus Intro Card */}
          <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] text-xs font-mono space-y-1.5">
            <div className="flex items-center justify-between text-[#505F76]">
              <span className="font-semibold text-[#111C2D]">Socratic Mode Active</span>
              <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded font-mono">
                Model latency: {modelLatency}
              </span>
            </div>
            <p className="font-sans text-xs text-slate-600 leading-relaxed">
              {focusSummary}
            </p>
            {fragility && (
              <div className="pt-2 mt-1 border-t border-[#E5E0D8]/80 text-[11px] font-mono space-y-0.5">
                <div className="text-amber-800">
                  <span className="font-bold">Fragile Nuance: </span>
                  <span>{fragility.fragileSubconcept}</span>
                </div>
                <div className="text-rose-700">
                  <span className="font-bold">Loss Risk: </span>
                  <span>{fragility.cognitiveLossRisk}</span>
                </div>
              </div>
            )}
          </div>

          {/* Active Recall Drill Card */}
          {primaryConcept ? (
            <div className="p-4 rounded-xl bg-gradient-to-br from-[#FFF8ED] to-white border border-amber-300/80 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#8D4B00]">
                  <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                  <span>Active Recall Checkpoint</span>
                </div>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                  Imminent Decay
                </span>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-sans text-[#111C2D] font-medium leading-snug">
                  Prove your grasp on <span className="font-bold text-[#006948]">{primaryConcept}</span> mechanics to prevent knowledge decay.
                </p>
                {fragility && (
                  <p className="text-[11px] font-mono text-amber-800 bg-amber-50/80 px-2.5 py-1 rounded border border-amber-200/60 leading-tight">
                    <span className="font-semibold">Target Nuance: </span>{fragility.fragileSubconcept}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsCheckpointOpen(true)}
                className="w-full py-2 px-3 rounded-lg bg-[#8D4B00] hover:bg-[#733D00] text-white font-sans font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                <span>Start Socratic Checkpoint for {primaryConcept.slice(0, 24)} ↗</span>
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] space-y-2 text-xs">
              <div className="flex items-center gap-1.5 font-mono font-semibold text-[#505F76]">
                <Clock className="w-3.5 h-3.5" />
                <span>Active Recall Checkpoint Awaiting Input</span>
              </div>
              <p className="font-sans text-slate-500 leading-relaxed">
                Draft technical concepts or load a note in the editor to activate diagnostic questions and retention probes.
              </p>
            </div>
          )}

          {/* Chat Messages */}
          {chatHistory.map((turn, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-2.5 ${
                turn.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {turn.role === 'assistant' && (
                <div className="w-6 h-6 rounded-md bg-[#006948] text-white flex items-center justify-center shrink-0 text-[10px] font-mono font-bold shadow-2xs mt-0.5">
                  AI
                </div>
              )}

              <div
                className={`p-3.5 text-xs rounded-xl ${
                  turn.role === 'user'
                    ? 'bg-[#111C2D] text-white rounded-tr-xs max-w-[85%]'
                    : 'bg-[#FAF8F5] border border-[#E5E0D8] text-[#111C2D] rounded-tl-xs flex-1 space-y-2'
                }`}
              >
                <p className="leading-relaxed whitespace-pre-line font-sans">{turn.message}</p>

                {turn.mathBlock && (
                  <div className="p-2.5 rounded-lg bg-white border border-[#E5E0D8] font-mono text-[11px] text-[#006948] overflow-x-auto">
                    <code>{turn.mathBlock}</code>
                  </div>
                )}

                {turn.recommendation && (
                  <div className="pt-2 border-t border-[#E5E0D8] text-[11px] font-mono text-[#505F76]">
                    <span className="font-bold text-[#111C2D]">Recommendation: </span>
                    <span>{turn.recommendation}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1">
                  <span>{turn.timestamp}</span>
                  {turn.modelLatency && <span>Latency: {turn.modelLatency}</span>}
                </div>
              </div>

              {turn.role === 'user' && (
                <div className="w-6 h-6 rounded-md bg-[#505F76] text-white flex items-center justify-center shrink-0 text-[10px] font-mono font-bold mt-0.5">
                  AK
                </div>
              )}
            </div>
          ))}

          {isAiResponding && (
            <div className="flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-md bg-[#006948] text-white flex items-center justify-center shrink-0 text-[10px] font-mono font-bold shadow-2xs mt-0.5">
                AI
              </div>
              <div className="bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl rounded-tl-xs p-3 text-xs text-[#505F76] font-mono flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#006948]" />
                <span>Evaluating technical journal invariants...</span>
              </div>
            </div>
          )}
        </div>

        {/* Persistence Toggle & Chat Input */}
        <div className="p-4 border-t border-[#E5E0D8] bg-[#FAF8F5] space-y-3">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-[#E5E0D8]">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-[#006948]" />
              <div className="flex flex-col">
                <label className="text-xs font-semibold text-[#111C2D] cursor-pointer">
                  Save AI conversation history as part of journal record
                </label>
                <span className="text-[10px] font-mono text-[#505F76]">
                  Ingests Q&amp;A into personalized Ebbinghaus half-life curves
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={persistAiThread}
              onChange={(e) => setPersistAiThread(e.target.checked)}
              className="rounded text-[#006948] focus:ring-[#006948] w-4 h-4 cursor-pointer accent-[#006948]"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={aiChatInput}
              onChange={(e) => setAiChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendAiMessage();
              }}
              placeholder="Ask a technical probe or test your recall..."
              className="flex-1 px-3.5 py-2 bg-white border border-[#E5E0D8] rounded-xl text-xs font-mono text-[#111C2D] placeholder:text-slate-400 focus:outline-none focus:border-[#006948]"
            />
            <button
              type="button"
              onClick={() => handleSendAiMessage()}
              className="p-2 rounded-xl bg-[#006948] hover:bg-[#005439] text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Send prompt"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={onCommitSession}
            className="w-full py-2.5 rounded-xl bg-[#111C2D] hover:bg-black text-white font-sans font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors"
          >
            <span>Commit Session to Retention Database</span>
          </button>
        </div>
      </aside>

      {/* Socratic Checkpoint Modal */}
      <SocraticCheckpointModal
        isOpen={isCheckpointOpen}
        onClose={() => setIsCheckpointOpen(false)}
        topicTitle={primaryConcept || 'Data Science Architecture'}
        topicCategory={primaryCategory}
        fragileSubconcept={fragility?.fragileSubconcept}
        cognitiveLossRisk={fragility?.cognitiveLossRisk}
        onSessionComplete={(score) => {
          showToast(`Socratic Checkpoint passed (${score}%)! Retention half-life updated.`);
        }}
      />
    </>
  );
};
