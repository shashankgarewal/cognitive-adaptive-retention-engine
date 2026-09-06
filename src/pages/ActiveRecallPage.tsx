/**
 * CARE - ActiveRecallPage Component
 * Full-page, direct-launch peer active recall conversation with adaptive depth.
 * Automatically initializes the session based on the URL parameter (?topic=...)
 * with zero intermediate configuration modal steps.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Brain,
  Sparkles,
  Send,
  Award,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AppNavbar } from '../components/layout/AppNavbar';
import { RecallSession, ChatTurn, TopicRetentionState } from '../types';
import { api } from '../lib/api';
import { getDescriptiveFragileSubconcept } from '../lib/retentionFragility';
import { ScorecardDisplay } from '../components/recall/ScorecardDisplay';

export const ActiveRecallPage: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const topicQuery = searchParams.get('topic')?.trim() || searchParams.get('topicId')?.trim() || searchParams.get('name')?.trim() || '';

  const [session, setSession] = useState<RecallSession | null>(null);
  const [topic, setTopic] = useState<TopicRetentionState | null>(null);
  const [inputText, setInputText] = useState('');
  const [isInitializing, setIsInitializing] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasLaunchedRef = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [session?.turns, isSending]);

  // Direct initialization on mount: calculate adaptive depth and start peer session immediately
  useEffect(() => {
    if (hasLaunchedRef.current) return;
    hasLaunchedRef.current = true;

    async function launchDirectSession() {
      setIsInitializing(true);
      setErrorMessage(null);

      try {
        // 1. Fetch user's topics to match canonical topic or build synthetic baseline
        let matchedTopic: TopicRetentionState | null = null;
        if (user) {
          try {
            const res = await api.getTopics();
            if (topicQuery) {
              const queryLower = topicQuery.toLowerCase();
              matchedTopic = res.topics.find(
                (t) =>
                  (t.canonicalName || '').toLowerCase() === queryLower ||
                  (t.topicId || '').toLowerCase() === queryLower
              ) || null;
            } else if (res.topics.length > 0) {
              matchedTopic = res.topics[0];
            }
          } catch (e) {
            console.warn('Could not fetch existing topic list for recall match:', e);
          }
        }

        if (!matchedTopic) {
          const rawName = topicQuery || 'Data Science Systems';
          const cleanName = rawName.length > 60 ? rawName.slice(0, 60) : rawName.replace(/_/g, ' ');
          const canonicalName = /^[a-z0-9\s_-]+$/.test(cleanName)
            ? cleanName.replace(/\b\w/g, (l) => l.toUpperCase())
            : cleanName;
          const customTopicId = `custom_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;

          matchedTopic = {
            topicId: customTopicId,
            userId: user?.uid || 'guest',
            canonicalName,
            category: 'Data Science & Systems',
            firstLoggedAt: new Date().toISOString(),
            lastLoggedAt: new Date().toISOString(),
            journalOccurrences: 1,
            recentAiAssistanceSignals: ['prompt_driven'],
            effectiveAiAssistanceWeight: 0.60,
            recallHistory: [],
            lastRecallScore: 2.8,
            currentPriorityScore: 55.0,
            decayFactor: 0.5,
            explanationReason: `Custom peer recall session for ${canonicalName}.`,
          };
        }

        setTopic(matchedTopic);

        // 2. Adaptive Depth calculation:
        // If decay priority > 60% OR AI reliance > 70%: Target deeper architectural trade-offs and edge cases
        // Else: Target practical runtime intuition and implementation trade-offs
        const priorityScore = matchedTopic.currentPriorityScore > 1 ? matchedTopic.currentPriorityScore : matchedTopic.currentPriorityScore * 100;
        const aiReliancePercent = (matchedTopic.effectiveAiAssistanceWeight || 0.5) * 100;
        const isHighRisk = priorityScore > 60 || aiReliancePercent > 70;

        const targetDepth: 'foundational' | 'intermediate' | 'advanced' = isHighRisk ? 'advanced' : 'intermediate';

        const fragility = getDescriptiveFragileSubconcept(
          matchedTopic.canonicalName,
          matchedTopic.category,
          matchedTopic.effectiveAiAssistanceWeight,
          matchedTopic.lastRecallScore,
          matchedTopic.fragileSubconcept || matchedTopic.explanationReason
        );

        const customFocusArea = (topicQuery && topicQuery.length > matchedTopic.canonicalName.length + 5)
          ? topicQuery
          : isHighRisk
          ? `Deeper architectural trade-offs and edge cases: ${fragility.fragileSubconcept}`
          : `Practical runtime intuition and implementation trade-offs: ${fragility.fragileSubconcept}`;

        // 3. Initialize session in Firestore
        const initRes = await api.initRecallSession({
          topicId: matchedTopic.topicId,
          topicName: matchedTopic.canonicalName,
          targetDepth,
          customFocusArea,
        });

        // 4. Request the opening peer colleague turn
        const firstTurnRes = await api.sendRecallMessage(initRes.session.sessionId, undefined);
        setSession(firstTurnRes.session);
        setTopic(initRes.topic);
      } catch (err: any) {
        console.error('Failed to direct-launch active recall session:', err);
        setErrorMessage(err.message || 'Failed to initialize active recall session. Please try again.');
      } finally {
        setIsInitializing(false);
      }
    }

    launchDirectSession();
  }, [topicQuery, user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanText = inputText.trim();
    if (!cleanText || isSending || isEvaluating || !session || session.status === 'completed') return;

    setInputText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    setErrorMessage(null);

    const optimisticTurn: ChatTurn = {
      role: 'user',
      message: cleanText,
      timestamp: new Date().toISOString(),
    };

    setSession((prev) => (prev ? { ...prev, turns: [...prev.turns, optimisticTurn] } : prev));
    setIsSending(true);

    try {
      const res = await api.sendRecallMessage(session.sessionId, cleanText);
      setSession(res.session);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error communicating with Peer Colleague. Please retry.');
    } finally {
      setIsSending(false);
    }
  };

  const handleEvaluateSession = async () => {
    if (!session || isEvaluating || isSending) return;
    setIsEvaluating(true);
    setErrorMessage(null);

    try {
      const res = await api.evaluateRecallSession(session.sessionId);
      setSession(res.session);
      setTopic(res.updatedTopic);
      if (refreshProfile) {
        await refreshProfile();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Evaluation generation timed out. Please retry.');
    } finally {
      setIsEvaluating(false);
    }
  };

  const userTurnCount = (session?.turns || []).filter((t) => t.role === 'user').length;
  const isReadyForEvaluation = userTurnCount >= 2;

  const fragility = getDescriptiveFragileSubconcept(
    session?.topicName || topic?.canonicalName || topicQuery,
    topic?.category || 'Data Science',
    topic?.effectiveAiAssistanceWeight,
    topic?.lastRecallScore,
    topic?.fragileSubconcept || topic?.explanationReason || session?.customFocusArea
  );

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#111C2D] flex flex-col font-sans">
      <AppNavbar activeNav="hub" />

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-3 sm:p-6 flex flex-col">
        {/* Top Breadcrumb & Exit Bar */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <button
            type="button"
            onClick={() => {
              if (session && session.status !== 'completed' && userTurnCount > 0) {
                setShowExitConfirm(true);
              } else {
                navigate('/hub');
              }
            }}
            className="flex items-center gap-1.5 text-xs font-mono text-[#64748B] hover:text-[#111C2D] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Retention Hub</span>
          </button>

          {session && session.status !== 'completed' && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleEvaluateSession}
                disabled={isEvaluating || isSending || userTurnCount === 0}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 shadow-xs cursor-pointer ${
                  isReadyForEvaluation
                    ? 'bg-[#006948] hover:bg-[#005439] text-white border-[#006948]'
                    : 'bg-white hover:bg-slate-50 text-[#111C2D] border-[#E5E0D8] disabled:opacity-50'
                }`}
              >
                {isEvaluating ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Grading Recall...</span>
                  </>
                ) : (
                  <>
                    <Award className="w-3.5 h-3.5" />
                    <span>Complete &amp; Score</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Card Shell */}
        <div className="flex-1 bg-white border border-[#E5E0D8] rounded-2xl shadow-sm flex flex-col overflow-hidden min-h-[600px]">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-[#E5E0D8] bg-[#FAF8F5] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-[#006948] flex items-center justify-center shrink-0">
                <Brain className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base sm:text-lg font-serif font-bold text-[#111C2D] truncate">
                    {session?.topicName || topic?.canonicalName || topicQuery}
                  </h2>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white text-[#64748B] border border-[#E5E0D8]">
                    {topic?.category || 'Data Science'}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-[#006948] border border-emerald-200 capitalize">
                    {session?.targetDepth || 'intermediate'} depth
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#64748B] mt-0.5">
                  <span className="flex items-center gap-1 text-[#006948] font-medium">
                    <Sparkles className="w-3 h-3" />
                    <span>Peer Colleague • Active Recall</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Minimal UI Context Header in Chat View */}
          <div className="px-4 py-2.5 bg-[#FAF8F5] border-b border-[#E5E0D8] text-xs text-[#3D4A42] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-semibold text-[#111C2D] shrink-0">{session?.topicName || topic?.canonicalName || topicQuery}</span>
              <span className="text-slate-400 shrink-0">·</span>
              <span className="text-[#64748B] truncate">
                Focusing on: <strong className="text-[#111C2D] font-semibold">{fragility.fragileSubconcept}</strong>
              </span>
            </div>
            <span className="text-[11px] font-mono text-[#64748B] shrink-0 hidden sm:inline">
              {userTurnCount} turn{userTurnCount === 1 ? '' : 's'} logged
            </span>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="m-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <strong>Notice:</strong> {errorMessage}
              </div>
            </div>
          )}

          {/* Initializing Spinner */}
          {isInitializing ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
              <div className="w-10 h-10 border-3 border-[#006948] border-t-transparent rounded-full animate-spin mb-4" />
              <h3 className="font-serif font-bold text-lg text-[#111C2D]">Preparing Peer Recall Context</h3>
              <p className="text-xs text-[#64748B] font-mono mt-1 max-w-sm">
                Calibrating adaptive depth and probing fragile subconcepts...
              </p>
            </div>
          ) : session?.status === 'completed' && session.evaluation ? (
            /* Completed Scorecard View */
            <div className="flex-1 overflow-y-auto p-5 sm:p-8 bg-stone-900 text-stone-100">
              <ScorecardDisplay
                session={session}
                evaluation={session.evaluation}
                updatedTopic={topic}
                onDone={() => navigate('/hub')}
              />
            </div>
          ) : (
            /* Live Chat Message Feed */
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                {(session?.turns || []).map((turn, index) => {
                  const isUser = turn.role === 'user';
                  return (
                    <div
                      key={index}
                      className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isUser && (
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#006948] shrink-0 mt-1 shadow-xs">
                          <Brain className="w-4 h-4" />
                        </div>
                      )}

                      <div
                        className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                          isUser
                            ? 'bg-[#006948] text-white font-medium rounded-tr-xs shadow-xs'
                            : 'bg-[#FAF8F5] text-[#111C2D] border border-[#E5E0D8] rounded-tl-xs shadow-xs'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4 mb-1">
                          <span
                            className={`text-[10px] font-mono uppercase tracking-wider font-semibold ${
                              isUser ? 'text-emerald-100' : 'text-[#006948]'
                            }`}
                          >
                            {isUser ? 'You' : 'Peer Colleague'}
                          </span>
                          <span className={`text-[10px] font-mono ${isUser ? 'text-emerald-200/80' : 'text-slate-400'}`}>
                            {new Date(turn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <div className="whitespace-pre-wrap">{turn.message}</div>
                      </div>

                      {isUser && (
                        <div className="w-8 h-8 rounded-lg bg-[#111C2D] border border-slate-700 flex items-center justify-center text-white font-mono text-xs shrink-0 mt-1">
                          DS
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Typing Indicator */}
                {isSending && (
                  <div className="flex items-start gap-3 justify-start">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#006948] shrink-0 mt-1">
                      <Brain className="w-4 h-4 animate-pulse" />
                    </div>
                    <div className="bg-[#FAF8F5] border border-[#E5E0D8] rounded-2xl rounded-tl-xs p-3.5 shadow-xs flex items-center gap-2">
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-[#006948] rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-1.5 h-1.5 bg-[#006948] rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-1.5 h-1.5 bg-[#006948] rounded-full animate-bounce" />
                      </div>
                      <span className="text-xs text-[#64748B] font-mono">Peer colleague is thinking...</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Dock */}
              <form
                onSubmit={handleSendMessage}
                className="p-3 sm:p-4 border-t border-[#E5E0D8] bg-[#FAF8F5] flex items-end gap-2"
              >
                <div className="flex-1 relative">
                  <textarea
                    ref={textareaRef}
                    value={inputText}
                    onChange={handleInputChange}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    disabled={isSending || isEvaluating || !session}
                    rows={1}
                    placeholder="Explain the architectural mechanics, invariant constraints, or failure modes (Enter to send)..."
                    className="w-full px-3.5 py-2.5 bg-white border border-[#E5E0D8] rounded-xl text-xs sm:text-sm text-[#111C2D] placeholder-slate-400 focus:outline-none focus:border-[#006948] transition-all resize-none disabled:opacity-60 font-sans min-h-[44px] max-h-48 leading-relaxed"
                  />
                </div>

                <button
                  id="btn-send-recall-msg"
                  type="submit"
                  disabled={!inputText.trim() || isSending || isEvaluating || !session}
                  className="px-4 py-2.5 bg-[#006948] hover:bg-[#005439] disabled:bg-slate-200 text-white disabled:text-slate-400 text-xs font-semibold rounded-xl transition-colors shrink-0 flex items-center gap-1.5 shadow-xs cursor-pointer disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">Send</span>
                </button>
              </form>
            </div>
          )}
        </div>
      </main>

      {/* Exit Confirmation Dialog */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E5E0D8] rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4">
            <h4 className="font-serif font-bold text-base text-[#111C2D]">Conclude Active Recall?</h4>
            <p className="text-xs text-[#64748B] leading-relaxed">
              You have {userTurnCount} response{userTurnCount === 1 ? '' : 's'} recorded. Would you like to score this session before returning to the hub?
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowExitConfirm(false);
                  navigate('/hub');
                }}
                className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#111C2D] text-xs font-medium transition-colors cursor-pointer"
              >
                Discard &amp; Exit
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowExitConfirm(false);
                  handleEvaluateSession();
                }}
                className="px-4 py-2 rounded-lg bg-[#006948] hover:bg-[#005439] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                Complete &amp; Score
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
