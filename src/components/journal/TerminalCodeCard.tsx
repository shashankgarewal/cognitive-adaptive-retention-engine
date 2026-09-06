import React, { useState } from 'react';
import { Terminal, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';

interface TerminalCodeCardProps {
  fileName?: string;
  language?: string;
  statusText?: string;
  codeSnippet?: string;
}

export const TerminalCodeCard: React.FC<TerminalCodeCardProps> = ({
  fileName = 'kv_stride_allocator.py',
  language = 'python',
  statusText = 'CUDA Warps aligned',
  codeSnippet = `@triton.jit
def _gqa_kv_cache_kernel(
    Q, K, V, Out,
    stride_qb, stride_qh, stride_qm, stride_qk,
    stride_kb, stride_kh, stride_kn, stride_kk,
    stride_vb, stride_vh, stride_vn, stride_vk,
    num_heads_q: tl.constexpr,
    num_heads_kv: tl.constexpr,
    BLOCK_M: tl.constexpr = 64,
    BLOCK_N: tl.constexpr = 64,
):
    # Group size: 32 Q heads / 8 KV heads = 4
    GROUP_SIZE: tl.constexpr = num_heads_q // num_heads_kv
    pid = tl.program_id(0)
    kv_head_idx = pid // GROUP_SIZE
    
    # Ensure memory coalescing on SRAM tile boundaries
    tl.static_assert(BLOCK_M % 16 == 0, "Unaligned warp access")
    # Autoregressive KV projection pointer calculation...`,
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(codeSnippet);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const codeLines = codeSnippet.split('\n');

  return (
    <div className="my-4 rounded-xl border border-stone-800 bg-[#0E1520] text-stone-100 shadow-md overflow-hidden font-mono text-xs">
      {/* Terminal Titlebar */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#080D14] border-b border-stone-800/80 select-none">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
          </div>

          <div className="flex items-center gap-1.5 text-stone-300 font-medium text-[11px]">
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            <span>{language}</span>
            <span className="text-stone-600">•</span>
            <span className="text-stone-200">{fileName}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/70 border border-emerald-700/60 text-emerald-400 text-[10px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {statusText}
          </span>

          <button
            type="button"
            onClick={handleCopy}
            className="p-1 rounded text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors cursor-pointer"
            title="Copy code snippet"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={() => setIsCollapsed((prev) => !prev)}
            className="p-1 rounded text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors cursor-pointer"
            title={isCollapsed ? 'Expand code block' : 'Collapse code block'}
          >
            {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Code Body with Line Numbers */}
      {!isCollapsed && (
        <div className="p-4 overflow-x-auto bg-[#0A101A] max-h-72 leading-relaxed">
          <table className="w-full text-left border-collapse">
            <tbody>
              {codeLines.map((line, idx) => (
                <tr key={idx} className="hover:bg-white/5 transition-colors">
                  <td className="pr-4 text-right text-stone-600 select-none text-[11px] w-8">
                    {idx + 1}
                  </td>
                  <td className="text-stone-200 whitespace-pre font-mono text-xs">
                    {line.includes('@triton') ? (
                      <span className="text-amber-400 font-semibold">{line}</span>
                    ) : line.includes('def ') ? (
                      <span>
                        <span className="text-purple-400 font-bold">def </span>
                        <span className="text-blue-300 font-semibold">{line.replace('def ', '')}</span>
                      </span>
                    ) : line.includes('#') ? (
                      <span className="text-stone-500 italic">{line}</span>
                    ) : line.includes('tl.') ? (
                      <span>
                        {line.split('tl.').map((part, pIdx) =>
                          pIdx === 0 ? (
                            part
                          ) : (
                            <React.Fragment key={pIdx}>
                              <span className="text-emerald-400 font-semibold">tl.</span>
                              <span>{part}</span>
                            </React.Fragment>
                          )
                        )}
                      </span>
                    ) : (
                      line
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
