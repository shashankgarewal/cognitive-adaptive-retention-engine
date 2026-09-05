/**
 * CARE - JournalEntryForm Component
 * Ingests daily Data Science work journals and commits with AI reliance signals.
 * Triggers asynchronous Gemini 3.8 Flash concept extraction and priority recalibration.
 */

import React, { useState } from 'react';
import {
  Sparkles,
  Cpu,
  Bot,
  Terminal,
  Code2,
  Wand2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  BookOpen,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { api } from '../../lib/api';
import { AiAssistanceLevel, ExtractedConcept, JournalEntry } from '../../types';

interface JournalEntryFormProps {
  onSuccess?: (entry: JournalEntry, concepts: ExtractedConcept[]) => void;
  onCancel?: () => void;
}

const AI_RELIANCE_OPTIONS: {
  level: AiAssistanceLevel;
  label: string;
  weightLabel: string;
  weight: number;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    level: 'none',
    label: 'Manual / Zero AI',
    weightLabel: 'A(t) = 0.10',
    weight: 0.1,
    description: 'Direct theoretical derivation, manual implementation, and native coding.',
    icon: Code2,
  },
  {
    level: 'prompt_driven',
    label: 'Prompt-Driven',
    weightLabel: 'A(t) = 0.50',
    weight: 0.5,
    description: 'Iterative conversational prompts for snippets, syntax lookup, or debugging.',
    icon: Terminal,
  },
  {
    level: 'spec_driven',
    label: 'Spec-Driven',
    weightLabel: 'A(t) = 0.80',
    weight: 0.8,
    description: 'High-level architectural specs; AI generated boilerplate and implementation.',
    icon: Wand2,
  },
  {
    level: 'agentic',
    label: 'Agentic / Autonomous',
    weightLabel: 'A(t) = 1.00',
    weight: 1.0,
    description: 'Autonomous agents (Cursor, Devin, Copilot Workspace) with minimal manual code review.',
    icon: Bot,
  },
];

const PRESET_JOURNALS = [
  {
    title: 'Fine-tuning LoRA Adapters on Mistral 7B',
    tool: 'Cursor Agent',
    level: 'agentic' as AiAssistanceLevel,
    content:
      'Implemented Low-Rank Adaptation (LoRA) for rank=16 and alpha=32 on Mistral 7B attention projections (q_proj, v_proj). Monitored training cross-entropy loss, gradient norm clipping, and evaluated against validation perplexity to prevent catastrophic forgetting.',
  },
  {
    title: 'Stratified K-Fold Cross-Validation & Covariance Shift',
    tool: 'Claude Code',
    level: 'spec_driven' as AiAssistanceLevel,
    content:
      'Constructed a 5-fold Stratified Cross-Validation pipeline for an imbalanced customer churn dataset. Identified distribution drift using Kolmogorov-Smirnov statistical tests and corrected for covariance shift with importance weighting.',
  },
  {
    title: 'Bayesian Parameter Estimation via Markov Chain Monte Carlo',
    tool: 'None',
    level: 'none' as AiAssistanceLevel,
    content:
      'Manually derived posterior distributions for a hierarchical Gaussian model using PyMC and Stan. Evaluated Gelman-Rubin diagnostic R-hat metrics and effective sample size to verify MCMC chain convergence.',
  },
];

export const JournalEntryForm: React.FC<JournalEntryFormProps> = ({ onSuccess, onCancel }) => {
  const [title, setTitle] = useState('');
  const [rawContent, setRawContent] = useState('');
  const [aiAssistanceLevel, setAiAssistanceLevel] = useState<AiAssistanceLevel>('prompt_driven');
  const [aiToolUsed, setAiToolUsed] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedResult, setExtractedResult] = useState<{
    entry: JournalEntry;
    concepts: ExtractedConcept[];
    summary?: string;
  } | null>(null);

  const handleApplyPreset = (preset: (typeof PRESET_JOURNALS)[0]) => {
    setTitle(preset.title);
    setRawContent(preset.content);
    setAiAssistanceLevel(preset.level);
    setAiToolUsed(preset.tool);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a title for this engineering journal.');
      return;
    }
    if (!rawContent.trim()) {
      setError('Please provide work notes or implementation details.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const res = await api.createJournalEntry({
        title: title.trim(),
        rawContent: rawContent.trim(),
        aiAssistanceLevel,
        aiToolUsed: aiToolUsed.trim() || undefined,
      });

      const entry = res.entry;
      const concepts = res.extractedConcepts || [];

      setExtractedResult({
        entry,
        concepts,
        summary: res.summary,
      });

      if (onSuccess) {
        onSuccess(entry, concepts);
      }
    } catch (err: any) {
      console.error('Journal ingestion error:', err);
      setError(err.message || 'Failed to ingest journal entry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setRawContent('');
    setAiToolUsed('');
    setExtractedResult(null);
    setError(null);
  };

  return (
    <div id="journal-entry-form-container" className="bg-stone-900 border border-stone-800 rounded-xl p-6 sm:p-7 shadow-xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 pb-5 border-b border-stone-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-stone-100 flex items-center gap-2">
              Log Data Science Journal
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                Gemini 3.8 Flash
              </span>
            </h2>
            <p className="text-xs text-stone-400 mt-0.5">
              Ingest technical notes. CARE extracts canonical theoretical concepts and updates your decay priority scores.
            </p>
          </div>
        </div>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-stone-400 hover:text-stone-200 text-xs px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-750 transition-colors"
          >
            Close
          </button>
        )}
      </div>

      {/* Preset Quick-Fill Chips */}
      {!extractedResult && (
        <div className="mt-4 pt-1">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs font-medium text-stone-300">Quick-Fill DS Scenarios:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {PRESET_JOURNALS.map((preset, idx) => (
              <button
                key={idx}
                id={`btn-preset-${idx}`}
                type="button"
                onClick={() => handleApplyPreset(preset)}
                className="text-xs px-2.5 py-1.5 rounded-lg bg-stone-850 hover:bg-stone-800 text-stone-300 border border-stone-750 hover:border-stone-650 transition-colors text-left flex items-center gap-1.5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                {preset.title.split(' ')[0]} {preset.title.split(' ')[1]}...
                <span className="text-[10px] text-stone-500 uppercase font-mono">({preset.level})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="mt-4 p-3 rounded-lg bg-rose-950/40 border border-rose-900/60 flex items-start gap-2.5 text-xs text-rose-300">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Extraction Success Result View */}
      {extractedResult ? (
        <div className="mt-6 space-y-5 animate-in fade-in duration-300">
          <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-900/40">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-semibold text-sm">Journal Ingested & Analyzed</span>
              </div>
              <span className="text-[11px] font-mono text-stone-400">
                ID: {extractedResult.entry.entryId.slice(0, 14)}
              </span>
            </div>
            <p className="text-xs text-stone-300 mb-3 leading-relaxed">
              {extractedResult.summary || extractedResult.entry.rawContent.slice(0, 200)}
            </p>

            {/* Extracted Concepts Display */}
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-200 mb-2">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                Extracted Canonical Concepts ({extractedResult.concepts.length}):
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {extractedResult.concepts.map((concept, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-stone-900/80 border border-stone-800 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-xs font-semibold text-stone-100">
                          {concept.canonicalName}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-stone-800 text-stone-300 border border-stone-700">
                          {(concept.importanceScore * 100).toFixed(0)}% Imp
                        </span>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-mono tracking-wide uppercase">
                        {concept.category}
                      </span>
                    </div>
                    {concept.contextSummary && (
                      <p className="text-[11px] text-stone-400 mt-1.5 line-clamp-2">
                        {concept.contextSummary}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              id="btn-log-another-journal"
              type="button"
              onClick={resetForm}
              className="px-4 py-2 rounded-lg bg-stone-800 hover:bg-stone-750 text-stone-200 text-xs font-medium border border-stone-700 transition-colors"
            >
              Log Another Journal
            </button>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-stone-950 text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                View Dashboard
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Form Inputs */
        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {/* Title */}
          <div>
            <label htmlFor="journal-title" className="block text-xs font-medium text-stone-300 mb-1.5">
              Work Title / Focus Area <span className="text-emerald-400">*</span>
            </label>
            <input
              id="journal-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Fine-tuning LoRA adapters on Mistral 7B"
              className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-lg text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              required
            />
          </div>

          {/* AI Reliance Level Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-medium text-stone-300">
                AI Reliance Level <span className="text-emerald-400">*</span>
              </label>
              <span className="text-[11px] font-mono text-stone-400">
                Heuristic signal weight: A(t)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {AI_RELIANCE_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isSelected = aiAssistanceLevel === opt.level;
                return (
                  <button
                    key={opt.level}
                    id={`btn-ai-reliance-${opt.level}`}
                    type="button"
                    onClick={() => setAiAssistanceLevel(opt.level)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      isSelected
                        ? 'bg-emerald-950/30 border-emerald-500/70 shadow-sm ring-1 ring-emerald-500/50'
                        : 'bg-stone-950/60 border-stone-800 hover:border-stone-700 hover:bg-stone-950'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-emerald-400' : 'text-stone-400'}`} />
                        <span className={`text-xs font-semibold ${isSelected ? 'text-stone-100' : 'text-stone-300'}`}>
                          {opt.label}
                        </span>
                      </div>
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        isSelected ? 'bg-emerald-900/60 text-emerald-300' : 'bg-stone-800 text-stone-400'
                      }`}>
                        {opt.weightLabel}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-400 leading-snug">
                      {opt.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* AI Tool & Content */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1">
              <label htmlFor="journal-tool" className="block text-xs font-medium text-stone-300 mb-1.5">
                AI Tool / Agent Used
              </label>
              <input
                id="journal-tool"
                type="text"
                value={aiToolUsed}
                onChange={(e) => setAiToolUsed(e.target.value)}
                placeholder="e.g. Cursor, Devin, Claude Code"
                className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-lg text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="journal-content" className="block text-xs font-medium text-stone-300">
                  Engineering Notes & Context <span className="text-emerald-400">*</span>
                </label>
                <span className="text-[11px] text-stone-500">
                  Equations, architecture, code snippets
                </span>
              </div>
              <textarea
                id="journal-content"
                rows={4}
                value={rawContent}
                onChange={(e) => setRawContent(e.target.value)}
                placeholder="Describe what you worked on, trade-offs analyzed, models configured, algorithms tuned..."
                className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-lg text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors leading-relaxed font-sans"
                required
              />
            </div>
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-between pt-2 border-t border-stone-800">
            <div className="flex items-center gap-1.5 text-[11px] text-stone-500">
              <Cpu className="w-3.5 h-3.5 text-stone-400" />
              <span>Extracts concepts & updates Priority(t) = (w1·T + w2·A + w3·H)·M</span>
            </div>

            <div className="flex items-center gap-3">
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-4 py-2 rounded-lg text-xs text-stone-400 hover:text-stone-200 transition-colors"
                >
                  Cancel
                </button>
              )}
              <button
                id="btn-submit-journal"
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-semibold text-xs transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-emerald-950/40"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Extracting Concepts with Gemini...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-stone-950" />
                    Ingest & Extract Concepts
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};
