import React from 'react';
import { Sparkles, CheckCircle2, FileText, Clock, Database, Tag, Layers, Cpu } from 'lucide-react';
import { TerminalCodeCard } from './TerminalCodeCard';

interface JournalEditorCanvasProps {
  title: string;
  setTitle: (val: string) => void;
  body: string;
  setBody: (val: string) => void;
  onApplyTemplate: (val: string) => void;
  extractedConceptsList: string[];
  wordsCount: number;
  charsCount: number;
  readTimeMin: number;
}

export const JournalEditorCanvas: React.FC<JournalEditorCanvasProps> = ({
  title,
  setTitle,
  body,
  setBody,
  onApplyTemplate,
  extractedConceptsList,
  wordsCount,
  charsCount,
  readTimeMin,
}) => {
  return (
    <div className="flex-1 flex flex-col bg-white rounded-2xl border border-[#E5E0D8] shadow-xs overflow-hidden">
      {/* Top Metadata Tag Line */}
      <div className="px-6 sm:px-8 pt-5 pb-3 border-b border-[#F0ECE6] flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
        <div className="flex flex-wrap items-center gap-2 text-[#505F76]">
          <span className="px-2 py-0.5 rounded bg-[#FAF8F5] border border-[#E5E0D8] text-[#111C2D] font-bold">
            CANONICAL TITLE • AST INDEXABLE
          </span>
          <span className="text-slate-300">•</span>
          <span className="text-[#006948] font-semibold flex items-center gap-1">
            <Layers className="w-3 h-3" />
            LLM Inference System Architecture
          </span>
          <span className="text-slate-300">•</span>
          <span className="text-slate-500">Oct 24, 2026 • 16:42 UTC</span>
        </div>

        <div className="flex items-center gap-2">
          <select
            onChange={(e) => {
              onApplyTemplate(e.target.value);
              e.target.value = '';
            }}
            className="text-xs font-mono text-[#505F76] bg-[#FAF8F5] border border-[#E5E0D8] rounded-lg px-2.5 py-1 hover:bg-slate-100 transition-colors focus:outline-none cursor-pointer"
            title="Load technical sample templates"
          >
            <option value="">Load Template...</option>
            <option value="gqa">GQA-8 Attention Optimization</option>
            <option value="lora">LoRA Rank-16 Decomposition</option>
            <option value="rope">RoPE Coordinate Rotations</option>
            <option value="clear">Blank Canvas</option>
          </select>
        </div>
      </div>

      {/* Title Canvas */}
      <div className="px-6 sm:px-8 pt-6 pb-2">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title (Optional - Gemini auto-synthesizes if left blank)"
          className="w-full font-serif font-bold text-2xl sm:text-3xl lg:text-4xl text-[#111C2D] placeholder:text-slate-300 placeholder:font-normal bg-transparent border-none p-0 focus:outline-none leading-tight"
        />
      </div>

      {/* Main Journal Body Canvas */}
      <div className="px-6 sm:px-8 py-4 flex-1 flex flex-col min-h-[360px]">
        <textarea
          id="reactJournalTextarea"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Document today's engineering decisions, architectural breakthroughs, kernel optimizations, or debugging notes..."
          className="w-full flex-1 font-mono text-sm sm:text-base text-[#111C2D] placeholder:text-slate-400 placeholder:font-sans bg-transparent resize-none leading-relaxed focus:outline-none"
        />

        {/* Embedded Terminal Code Card */}
        {body.includes('Triton') || body.includes('GQA') || body.includes('kernel') ? (
          <TerminalCodeCard
            fileName="kv_stride_allocator.py"
            language="python • triton"
            statusText="CUDA Warps aligned"
          />
        ) : null}
      </div>

      {/* AST Detected Concepts Bar */}
      <div className="px-6 sm:px-8 py-3 bg-[#FAF8F5] border-t border-[#F0ECE6] flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-mono text-[#505F76] font-semibold mr-1 flex items-center gap-1">
            <Tag className="w-3 h-3 text-[#006948]" />
            Detected Concepts:
          </span>
          {extractedConceptsList.map((concept, idx) => (
            <span
              key={idx}
              className="inline-flex items-center px-2 py-0.5 rounded-full bg-white border border-[#E5E0D8] text-[11px] font-mono font-medium text-[#111C2D] hover:border-[#006948] hover:text-[#006948] transition-colors cursor-pointer"
            >
              #{concept}
            </span>
          ))}
        </div>

        <div className="text-[11px] font-mono text-emerald-800 font-medium flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Local draft synced</span>
        </div>
      </div>

      {/* Footer Telemetry Bar */}
      <div className="px-6 sm:px-8 py-2.5 bg-white border-t border-[#E5E0D8] flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-[#505F76]">
        <div className="flex items-center gap-3">
          <span className="text-[#006948] font-semibold flex items-center gap-1">
            <Cpu className="w-3.5 h-3.5" />
            AST Engine: {extractedConceptsList.length} concepts extracted
          </span>
          <span className="text-slate-300">•</span>
          <span>{wordsCount} words</span>
          <span className="text-slate-300">•</span>
          <span>{charsCount} chars</span>
          <span className="text-slate-300">•</span>
          <span>~{readTimeMin} min read</span>
        </div>

        <div className="flex items-center gap-2">
          <Database className="w-3.5 h-3.5 text-[#006948]" />
          <span className="text-[#111C2D] font-medium">Sync: Connected to Cloud Firestore</span>
        </div>
      </div>
    </div>
  );
};
