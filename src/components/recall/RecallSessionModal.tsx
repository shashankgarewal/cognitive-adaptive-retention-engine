/**
 * CARE - RecallSessionModal Component (Slice 4)
 * Multi-Turn Peer Knowledge Partner Agent Workspace powered by gemini-3.8-flash:
 *  - Real-time turn-based active recall conversational interface
 *  - Dynamic typing indicator during partner conceptual evaluation
 *  - Concept focus tags and target depth telemetry
 *  - End session trigger and automated scorecard generation
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Brain,
  Sparkles,
  Send,
  X,
  ShieldCheck,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Award,
  ChevronRight,
  Flame,
  ArrowRight,
  Layers,
  MessageSquare,
} from 'lucide-react';
import { RecallSession, ChatTurn, TopicRetentionState } from '../../types';
import { api } from '../../lib/api';
import { ScorecardDisplay } from './ScorecardDisplay';

interface RecallSessionModalProps {
  session: RecallSession;
  topic?: TopicRetentionState | null;
  onClose: () => void;
  onSessionCompleted?: (session: RecallSession, updatedTopic?: TopicRetentionState | null) => void;
}

export const RecallSessionModal: React.FC<RecallSessionModalProps> = ({
  session: initialSession,
  topic,
  onClose,
  onSessionCompleted,
}) => {
  const [session, setSession] = useState<RecallSession>(initialSession);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Completed session / scorecard state
  const [completedTopic, setCompletedTopic] = useState<TopicRetentionState | null>(topic || null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasInitializedRef = useRef<boolean>(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [session.turns, isSending]);

  // If session unexpectedly has no turns on load, fetch the initial prompt safely once
  useEffect(() => {
    if (session.turns.length > 0 || session.status === 'completed' || hasInitializedRef.current) {
      return;
    }

    hasInitializedRef.current = true;
    let isMounted = true;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    async function initFirstTurn() {
      setIsSending(true);
      try {
        const res = await api.sendRecallMessage(session.sessionId, undefined, controller.signal);
        if (isMounted) {
          setSession(res.session);
        }
      } catch (err: any) {
        if (isMounted) {
          const isTimeout = err.name === 'AbortError' || err.message?.toLowerCase().includes('timeout') || err.message?.toLowerCase().includes('abort');
          const fallbackMsg = isTimeout
            ? 'Peer Knowledge Partner connection timed out. Retry or click Complete & Score'
            : (err.message || 'Peer Knowledge Partner connection timed out. Retry or click Complete & Score');
          setErrorMessage(fallbackMsg);
        }
      } finally {
        clearTimeout(timeoutId);
        if (isMounted) {
          setIsSending(false);
        }
      }
    }

    initFirstTurn();

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [session.sessionId, session.turns.length, session.status]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (session.status === 'completed') {
          handleFinishAndExit();
        } else {
          setShowExitConfirm(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [session.status]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanText = inputText.trim();
    if (!cleanText || isSending || isEvaluating || session.status === 'completed') return;

    setInputText('');
    setErrorMessage(null);

    // Optimistically add user turn for instant UI responsiveness
    const optimisticTurn: ChatTurn = {
      role: 'user',
      message: cleanText,
      timestamp: new Date().toISOString(),
    };

    setSession((prev) => ({
      ...prev,
      turns: [...prev.turns, optimisticTurn],
    }));

    setIsSending(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const res = await api.sendRecallMessage(session.sessionId, cleanText, controller.signal);
      setSession(res.session);
    } catch (err: any) {
      const isTimeout = err.name === 'AbortError' || err.message?.toLowerCase().includes('timeout') || err.message?.toLowerCase().includes('abort');
      const fallbackMsg = isTimeout
        ? 'Peer Knowledge Partner connection timed out. Retry or click Complete & Score'
        : (err.message || 'Peer Knowledge Partner connection timed out. Retry or click Complete & Score');
      setErrorMessage(fallbackMsg);
    } finally {
      clearTimeout(timeoutId);
      setIsSending(false);
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleEvaluateSession = async () => {
    if (isEvaluating || isSending) return;
    setIsEvaluating(true);
    setErrorMessage(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const res = await api.evaluateRecallSession(session.sessionId, controller.signal);
      setSession(res.session);
      if (res.updatedTopic) {
        setCompletedTopic(res.updatedTopic);
      }
    } catch (err: any) {
      const isTimeout = err.name === 'AbortError' || err.message?.toLowerCase().includes('timeout') || err.message?.toLowerCase().includes('abort');
      const fallbackMsg = isTimeout
        ? 'Peer Knowledge Partner connection timed out. Retry or click Complete & Score'
        : (err.message || 'Failed to evaluate active recall session.');
      setErrorMessage(fallbackMsg);
    } finally {
      clearTimeout(timeoutId);
      setIsEvaluating(false);
    }
  };

  const handleFinishAndExit = () => {
    if (onSessionCompleted) {
      onSessionCompleted(session, completedTopic);
    }
    onClose();
  };

  // Quick inquiry starters
  const quickPrompts = [
    'Explain the mathematical formulation',
    'Walk through failure modes & assumptions',
    'Discuss hyperparameter trade-offs',
    'How does it behave under non-stationary distributions?',
  ];

  const userTurnCount = session.turns.filter((t) => t.role === 'user').length;
  const isReadyForEvaluation = userTurnCount >= 2;

  return (
    <div
      id="recall-session-backdrop"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
    >
      <div
        id="recall-session-modal"
        className="bg-stone-900 border border-stone-800 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[92vh] max-h-[900px] animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="p-4 sm:p-5 border-b border-stone-800 bg-stone-925 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Brain className="w-5 h-5" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold text-stone-100 truncate">
                  {session.topicName}
                </h3>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-stone-800 text-stone-400 border border-stone-750">
                  {topic?.category || 'Data Science'}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/70 text-emerald-300 border border-emerald-800/80 capitalize">
                  {session.targetDepth || 'intermediate'}
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs text-stone-400 mt-0.5 flex-wrap">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  <span>Peer Knowledge Partner • gemini-3.8-flash</span>
                </span>
                {session.customFocusArea && (
                  <span className="text-stone-500 truncate max-w-xs">
                    Focus: <span className="text-stone-300">{session.customFocusArea}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {session.status !== 'completed' && (
              <button
                id="btn-evaluate-recall-session"
                type="button"
                onClick={handleEvaluateSession}
                disabled={isEvaluating || isSending || userTurnCount === 0}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl border transition-all flex items-center gap-1.5 shadow-sm ${
                  isReadyForEvaluation
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-stone-950 border-emerald-400'
                    : 'bg-stone-800 hover:bg-stone-750 text-stone-300 border-stone-700 disabled:opacity-50'
                }`}
                title={userTurnCount === 0 ? 'Respond to at least 1 turn before completing evaluation.' : 'Conclude session and compute recall scorecard'}
              >
                {isEvaluating ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
                    <span>Grading...</span>
                  </>
                ) : (
                  <>
                    <Award className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Complete &amp; Score</span>
                    <span className="sm:hidden">Score</span>
                  </>
                )}
              </button>
            )}

            <button
              id="btn-close-recall-session"
              type="button"
              onClick={() => {
                if (session.status === 'completed') {
                  handleFinishAndExit();
                } else {
                  setShowExitConfirm(true);
                }
              }}
              className="p-2 text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Area: Chat or Scorecard */}
        {session.status === 'completed' && session.evaluation ? (
          <div className="flex-1 overflow-y-auto p-5 sm:p-7">
            <ScorecardDisplay
              session={session}
              evaluation={session.evaluation}
              updatedTopic={completedTopic}
              onDone={handleFinishAndExit}
            />
          </div>
        ) : (
          <>
            {/* Live Message History */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {/* Session Context Banner */}
              <div className="p-3 bg-stone-950/60 border border-stone-800/80 rounded-xl text-xs text-stone-400 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    Active Recall Mode: Your Peer Knowledge Partner will probe your conceptual models without giving direct answers.
                  </span>
                </div>
                <span className="text-[11px] font-mono text-stone-500 shrink-0">
                  {userTurnCount} response{userTurnCount === 1 ? '' : 's'} recorded
                </span>
              </div>

              {/* Chat turns */}
              {session.turns.map((turn, index) => {
                const isUser = turn.role === 'user';
                return (
                  <div
                    key={index}
                    className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isUser && (
                      <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-700/60 flex items-center justify-center text-emerald-400 shrink-0 mt-1 shadow-sm">
                        <Brain className="w-4 h-4" />
                      </div>
                    )}

                    <div
                      className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                        isUser
                          ? 'bg-emerald-600 text-stone-950 font-medium rounded-tr-sm shadow-md'
                          : 'bg-stone-800/90 text-stone-100 border border-stone-750 rounded-tl-sm shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4 mb-1">
                        <span className={`text-[10px] font-mono uppercase tracking-wider font-semibold ${isUser ? 'text-emerald-950/80' : 'text-emerald-400'}`}>
                          {isUser ? 'You' : 'Peer Knowledge Partner'}
                        </span>
                        <span className={`text-[10px] font-mono ${isUser ? 'text-emerald-950/60' : 'text-stone-500'}`}>
                          {new Date(turn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div className="whitespace-pre-wrap">{turn.message}</div>
                    </div>

                    {isUser && (
                      <div className="w-8 h-8 rounded-lg bg-stone-800 border border-stone-700 flex items-center justify-center text-stone-200 font-mono text-xs shrink-0 mt-1">
                        DS
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Typing Indicator */}
              {isSending && (
                <div className="flex items-start gap-3 justify-start">
                  <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-700/60 flex items-center justify-center text-emerald-400 shrink-0 mt-1">
                    <Brain className="w-4 h-4 animate-pulse" />
                  </div>
                  <div className="bg-stone-800/90 border border-stone-750 rounded-2xl rounded-tl-sm p-4 text-xs text-stone-300 flex items-center gap-3 shadow-sm">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      <span className="w-2 h-2 rounded-full bg-emerald-400/80 animate-bounce" />
                      <span className="w-2 h-2 rounded-full bg-emerald-400/60 animate-pulse" />
                    </div>
                    <span className="font-mono text-[11px] text-stone-400">
                      Peer Knowledge Partner is evaluating your conceptual formulation...
                    </span>
                  </div>
                </div>
              )}

              {/* Error / Timeout Notification */}
              {errorMessage && (
                <div className="p-3.5 bg-amber-950/70 border border-amber-800/80 rounded-xl text-amber-200 text-xs flex items-start gap-2.5 shadow-sm animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="flex-1 leading-relaxed">
                    <p className="font-semibold text-amber-100">{errorMessage}</p>
                    <p className="text-[11px] text-amber-300/80 mt-0.5">
                      You can send another prompt, retry your technical explanation, or conclude the session with <strong>Complete &amp; Score</strong>.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setErrorMessage(null)}
                    className="p-1 text-amber-400 hover:text-amber-200 hover:bg-amber-900/50 rounded transition-colors shrink-0"
                    title="Dismiss"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Starter Suggestion Chips */}
            {session.turns.length <= 2 && (
              <div className="px-4 sm:px-6 py-2 border-t border-stone-800/60 bg-stone-925/40 flex items-center gap-2 overflow-x-auto text-[11px] font-mono">
                <span className="text-stone-500 shrink-0">Prompts:</span>
                {quickPrompts.map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setInputText(chip);
                      textareaRef.current?.focus();
                    }}
                    className="px-2.5 py-1 bg-stone-800 hover:bg-stone-750 text-stone-300 rounded-lg whitespace-nowrap border border-stone-700 transition-colors shrink-0"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            )}

            {/* Input Bar Footer */}
            <div className="p-3 sm:p-4 border-t border-stone-800 bg-stone-925 shrink-0">
              <form onSubmit={handleSendMessage} className="space-y-2">
                <div className="relative">
                  <textarea
                    id="textarea-recall-response"
                    ref={textareaRef}
                    rows={3}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isSending || isEvaluating}
                    placeholder="Formulate your technical explanation, mathematical mechanics, or edge case rationale... (Press Enter to send, Shift+Enter for new line)"
                    className="w-full px-4 py-3 bg-stone-950 border border-stone-800 rounded-xl text-xs sm:text-sm text-stone-100 placeholder-stone-600 focus:outline-none focus:border-emerald-500 transition-colors resize-none pr-14 disabled:opacity-50"
                  />

                  <button
                    id="btn-send-recall-turn"
                    type="submit"
                    disabled={!inputText.trim() || isSending || isEvaluating}
                    className="absolute right-2.5 bottom-3 p-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-stone-800 text-stone-950 disabled:text-stone-600 rounded-xl transition-all shadow-sm"
                    title="Send response"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between text-[11px] text-stone-500 font-mono px-1">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="w-3.5 h-3.5 text-stone-500" />
                    <span>Explain underlying principles rather than quoting high-level API names.</span>
                  </div>
                  <span>{inputText.length} chars</span>
                </div>
              </form>
            </div>
          </>
        )}

        {/* Exit Confirmation Dialog */}
        {showExitConfirm && (
          <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
            <div className="bg-stone-900 border border-stone-800 rounded-xl max-w-sm w-full p-5 shadow-2xl space-y-4 text-center">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-stone-100 text-sm">Leave Active Recall Session?</h4>
                <p className="text-xs text-stone-400 mt-1">
                  Your current turns are saved to Firestore, but your decay priority score won't update until evaluated.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowExitConfirm(false)}
                  className="px-4 py-2 bg-stone-800 hover:bg-stone-750 text-stone-300 text-xs font-medium rounded-lg"
                >
                  Keep Practicing
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowExitConfirm(false);
                    onClose();
                  }}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg"
                >
                  Exit Session
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
