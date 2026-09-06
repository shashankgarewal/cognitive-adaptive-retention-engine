import React from 'react';
import {
  Bold,
  Italic,
  Code,
  Heading2,
  Heading3,
  List,
  Sparkles,
  Loader2,
  Sigma,
  FileCode,
  Brush,
  Wand2,
} from 'lucide-react';

interface JournalEditorToolbarProps {
  onInsertSyntax: (prefix: string, suffix: string, placeholder: string) => void;
  onAutoGenerateTitle: () => void;
  onGeminiPolish: () => void;
  isSynthesizingTitle: boolean;
  isPolishing: boolean;
  isAiDrawerOpen: boolean;
  onToggleAiDrawer: () => void;
}

export const JournalEditorToolbar: React.FC<JournalEditorToolbarProps> = ({
  onInsertSyntax,
  onAutoGenerateTitle,
  onGeminiPolish,
  isSynthesizingTitle,
  isPolishing,
  isAiDrawerOpen,
  onToggleAiDrawer,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-white border-b border-[#F0ECE6]">
      {/* Left formatting tools */}
      <div className="flex flex-wrap items-center gap-1">
        <button
          type="button"
          onClick={() => onInsertSyntax('**', '**', 'bold text')}
          className="p-1.5 rounded-lg text-slate-700 hover:text-[#111C2D] hover:bg-slate-100 transition-colors cursor-pointer"
          title="Bold (**text**)"
        >
          <Bold className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => onInsertSyntax('*', '*', 'italic text')}
          className="p-1.5 rounded-lg text-slate-700 hover:text-[#111C2D] hover:bg-slate-100 transition-colors cursor-pointer"
          title="Italic (*text*)"
        >
          <Italic className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => onInsertSyntax('`', '`', 'inline_code')}
          className="p-1.5 rounded-lg text-slate-700 hover:text-[#111C2D] hover:bg-slate-100 transition-colors cursor-pointer font-mono"
          title="Inline Code (`code`)"
        >
          <Code className="w-4 h-4" />
        </button>

        <div className="h-4 w-[1px] bg-[#E5E0D8] mx-1" />

        <button
          type="button"
          onClick={() => onInsertSyntax('\n## ', '\n', 'Section Heading')}
          className="px-2 py-1 rounded-lg text-slate-700 hover:text-[#111C2D] hover:bg-slate-100 transition-colors text-xs font-mono font-bold cursor-pointer"
          title="Heading 2 (## Heading)"
        >
          H2
        </button>

        <button
          type="button"
          onClick={() => onInsertSyntax('\n### ', '\n', 'Subheading')}
          className="px-2 py-1 rounded-lg text-slate-700 hover:text-[#111C2D] hover:bg-slate-100 transition-colors text-xs font-mono font-bold cursor-pointer"
          title="Heading 3 (### Subheading)"
        >
          H3
        </button>

        <button
          type="button"
          onClick={() => onInsertSyntax('\n- ', '', 'List item')}
          className="p-1.5 rounded-lg text-slate-700 hover:text-[#111C2D] hover:bg-slate-100 transition-colors cursor-pointer"
          title="Unordered List (- item)"
        >
          <List className="w-4 h-4" />
        </button>

        <div className="h-4 w-[1px] bg-[#E5E0D8] mx-1" />

        <button
          type="button"
          onClick={() =>
            onInsertSyntax(
              '\n$$\n\\text{Equation} = ',
              '\n$$\n',
              '\\alpha \\times \\beta'
            )
          }
          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-slate-700 hover:text-[#111C2D] hover:bg-slate-100 transition-colors text-xs font-mono font-medium cursor-pointer"
          title="LaTeX Equation ($$ formula $$)"
        >
          <Sigma className="w-3.5 h-3.5 text-slate-600" />
          <span>Σ LaTeX</span>
        </button>

        <button
          type="button"
          onClick={() =>
            onInsertSyntax(
              '\n```python\n# Implementation snippet\n',
              '\n```\n',
              'def forward(x):\n    return x'
            )
          }
          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-slate-700 hover:text-[#111C2D] hover:bg-slate-100 transition-colors text-xs font-mono font-medium cursor-pointer"
          title="Code Block (```python ... ```)"
        >
          <FileCode className="w-3.5 h-3.5 text-slate-600" />
          <span>{'{ }'}</span>
        </button>
      </div>

      {/* Right AI Action Triggers */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onGeminiPolish}
          disabled={isPolishing}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FAF8F5] hover:bg-[#F0ECE6] border border-[#E5E0D8] text-[#111C2D] font-mono text-xs font-medium transition-colors cursor-pointer"
          title="Clean up formatting, fix punctuation, and optimize technical phrasing"
        >
          {isPolishing ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#006948]" />
          ) : (
            <Brush className="w-3.5 h-3.5 text-amber-700" />
          )}
          <span className="hidden sm:inline">🧹 Gemini Polish</span>
          <span className="sm:hidden">Polish</span>
        </button>

        <button
          type="button"
          onClick={onAutoGenerateTitle}
          disabled={isSynthesizingTitle}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F0F3FF] hover:bg-[#E2ECFF] border border-[#D0DEFF] text-[#005691] font-mono text-xs font-medium transition-colors cursor-pointer"
          title="Synthesize an AST-indexed canonical title from journal content"
        >
          {isSynthesizingTitle ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5" />
          )}
          <span className="hidden sm:inline">✨ Auto-Generate Title</span>
          <span className="sm:hidden">Auto Title</span>
        </button>

        <button
          type="button"
          onClick={onToggleAiDrawer}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-mono text-xs font-semibold transition-all cursor-pointer ${
            isAiDrawerOpen
              ? 'bg-[#ECFDF5] border-emerald-300 text-[#006948]'
              : 'bg-white border-[#E5E0D8] text-[#505F76] hover:text-[#111C2D] hover:bg-slate-50'
          }`}
          title="Toggle AI Co-Thinking Drawer (Shortcut: Cmd+/)"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#006948]" />
          <span>✨ Co-Thinking</span>
          <span className="hidden md:inline px-1 py-0.2 rounded text-[9px] bg-slate-100 text-slate-500 border border-slate-200">
            ⌘/
          </span>
        </button>
      </div>
    </div>
  );
};
