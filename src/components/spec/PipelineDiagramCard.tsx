import React, { useState } from 'react';
import {
  Terminal,
  ShieldCheck,
  Server,
  Sparkles,
  Database,
  Bot,
  ArrowRight,
  CheckCircle2,
  Cpu,
  Info,
} from 'lucide-react';

interface PipelineNode {
  id: string;
  step: string;
  title: string;
  description: string;
  tag: string;
  protocol: string;
  latency: string;
  icon: React.ElementType;
  details: {
    input: string;
    output: string;
    invariant: string;
  };
}

export const PipelineDiagramCard: React.FC = () => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('04');

  const nodes: PipelineNode[] = [
    {
      id: '01',
      step: '01',
      title: 'Journal Ingestion',
      description: 'Cursor & VS Code telemetry',
      tag: 'hook: pre-commit.sh',
      protocol: 'Git pre-commit diff capture & AST tokenizer',
      latency: '~12ms',
      icon: Terminal,
      details: {
        input: 'Developer Git diffs + manual code edits vs LLM prompt completions',
        output: 'Token ratio histogram (A_ratio: 0.0-1.0) & Markdown work journal payload',
        invariant: 'Zero telemetry captured outside staged repository boundaries',
      },
    },
    {
      id: '02',
      step: '02',
      title: 'Client Validation',
      description: 'Schema hygiene & JWT validation',
      tag: 'auth: RS256 / Ed25519',
      protocol: 'Firebase Auth token parsing & Pydantic verification',
      latency: '~18ms',
      icon: ShieldCheck,
      details: {
        input: 'HTTP Authorization: Bearer <Firebase JWT> + raw JSON payload',
        output: 'Cryptographically asserted request.auth.uid & sanitized UTF-8 string',
        invariant: 'Instant 401 Unauthorized rejection on missing or expired claims',
      },
    },
    {
      id: '03',
      step: '03',
      title: 'Cloud Run API',
      description: 'Async FastAPI workers & token buckets',
      tag: 'compute: python-3.11',
      protocol: 'Uvicorn ASGI container with scale-to-zero autoscaler',
      latency: '~35ms',
      icon: Server,
      details: {
        input: 'Sanitized JournalEntryPayload via POST /api/journals/log',
        output: 'Dispatched task queue & asynchronous Google GenAI SDK request',
        invariant: 'Maximum 20 concurrency instances with graceful scale-to-zero',
      },
    },
    {
      id: '04',
      step: '04',
      title: 'Vertex AI Inference',
      description: 'gemini-2.5-flash concept extraction',
      tag: 'model: 2.5-flash-json',
      protocol: 'Structured JSON output schema via Google GenAI SDK',
      latency: '~65ms',
      icon: Sparkles,
      details: {
        input: 'System prompt + developer journal text + response_schema=ConceptsList',
        output: 'Canonical concept entities, prerequisite hierarchy & AI reliance weighting',
        invariant: 'Strict response_mime_type="application/json"; zero prompt injection vector',
      },
    },
    {
      id: '05',
      step: '05',
      title: 'Firestore State',
      description: 'Encrypted documents under /users/{uid}',
      tag: 'storage: native-firestore',
      protocol: 'Cloud Firestore multi-region transactional writes',
      latency: '~12ms',
      icon: Database,
      details: {
        input: 'Strip-null model_dump() written to /users/{uid}/journal_entries/{id}',
        output: 'Updated RetentionTopic records with recalculation of Priority(t)',
        invariant: 'Firestore security rule: request.auth.uid == userId strictly enforced',
      },
    },
    {
      id: '06',
      step: '06',
      title: 'Socratic Agent',
      description: 'Autonomous dialogue loop',
      tag: 'agent: adk-socratic-v2',
      protocol: 'Google Agent Development Kit (ADK) state engine',
      latency: 'Dynamic',
      icon: Bot,
      details: {
        input: 'Top decay priority topic + historical probe failure history',
        output: 'Senior staff engineer conversational interview terminating on [INTERVIEW_COMPLETE]',
        invariant: 'Strict 1-2 nuance limit per probe; never acts as a quiz-show host',
      },
    },
  ];

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || nodes[3];

  return (
    <div className="bg-white border border-[#E5E0D8] rounded-xl p-5 sm:p-6 lg:p-7 shadow-xs">
      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-[#E5E0D8]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="font-serif font-bold text-xl sm:text-2xl text-[#1E293B]">
              End-to-End Reactive Telemetry &amp; Socratic Recall Pipeline
            </h2>
            <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-[#ECFDF5] border border-emerald-300 text-[#006948] font-semibold">
              v2.4.1-rc
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#505F76]">
            Real-time event-driven flow connecting terminal Git hooks, async Cloud Run inference, and autonomous Socratic recall agents.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#FAF8F5] border border-[#E5E0D8] font-mono text-xs text-[#505F76]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            6 Pipeline Stages Synchronous &amp; Live
          </span>
        </div>
      </div>

      {/* 6-Node Horizontal Flow Strip */}
      <div className="pt-6 pb-2 overflow-x-auto">
        <div className="min-w-[860px] grid grid-cols-6 gap-2.5 relative">
          {nodes.map((node, index) => {
            const isSelected = node.id === selectedNodeId;
            const Icon = node.icon;
            return (
              <div key={node.id} className="relative group">
                <button
                  type="button"
                  onClick={() => setSelectedNodeId(node.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-all cursor-pointer relative ${
                    isSelected
                      ? 'bg-[#F0F3FF] border-[#006948] shadow-sm ring-1 ring-[#006948]/20'
                      : 'bg-[#FAF8F5] border-[#E5E0D8] hover:bg-white hover:border-slate-300'
                  }`}
                >
                  {/* Top node bar: Step index & latency */}
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span
                      className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        isSelected
                          ? 'bg-[#006948] text-white'
                          : 'bg-[#E5E0D8] text-[#505F76] group-hover:bg-slate-300'
                      }`}
                    >
                      Node {node.step}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">
                      {node.latency}
                    </span>
                  </div>

                  {/* Icon & Title */}
                  <div className="flex items-center gap-2 mb-1.5">
                    <div
                      className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-[#006948] text-white'
                          : 'bg-white border border-[#E5E0D8] text-[#1E293B]'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <h3 className="font-sans font-bold text-xs text-[#1E293B] leading-tight line-clamp-1">
                      {node.title}
                    </h3>
                  </div>

                  {/* Subtitle description */}
                  <p className="text-[11px] text-[#505F76] line-clamp-2 mb-2 leading-relaxed">
                    {node.description}
                  </p>

                  {/* Schema / Command tag */}
                  <div className="mt-auto">
                    <span className="inline-block w-full truncate font-mono text-[10px] px-1.5 py-0.5 rounded bg-white border border-[#E5E0D8] text-[#006948]">
                      {node.tag}
                    </span>
                  </div>
                </button>

                {/* Connecting arrow indicator between nodes */}
                {index < nodes.length - 1 && (
                  <div className="hidden lg:flex absolute -right-2.5 top-1/2 -translate-y-1/2 z-10 w-4 h-4 rounded-full bg-white border border-[#E5E0D8] items-center justify-center text-slate-400 pointer-events-none">
                    <ArrowRight className="w-2.5 h-2.5" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive Node Protocol Inspector Basin */}
      {selectedNode && (
        <div className="mt-5 p-4 rounded-lg bg-[#F0F3FF] border border-[#E7EEFF] text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E0E7FF]">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-[#006948] bg-white px-2 py-0.5 rounded border border-[#E0E7FF]">
                NODE {selectedNode.step} SPEC
              </span>
              <span className="font-sans font-bold text-[#1E293B]">
                {selectedNode.title} — {selectedNode.protocol}
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-500 font-mono text-[11px]">
              <span>Telemetry Runtime: <strong>{selectedNode.latency}</strong></span>
              <span>•</span>
              <span className="text-[#006948] font-semibold">{selectedNode.tag}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3">
            <div className="bg-white/80 p-2.5 rounded border border-[#E0E7FF]">
              <span className="font-mono text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">
                Ingested Input
              </span>
              <p className="font-sans text-[11px] text-[#1E293B] leading-relaxed">
                {selectedNode.details.input}
              </p>
            </div>

            <div className="bg-white/80 p-2.5 rounded border border-[#E0E7FF]">
              <span className="font-mono text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">
                Pipeline Output
              </span>
              <p className="font-sans text-[11px] text-[#1E293B] leading-relaxed">
                {selectedNode.details.output}
              </p>
            </div>

            <div className="bg-white/80 p-2.5 rounded border border-[#E0E7FF]">
              <span className="font-mono text-[10px] font-bold text-[#006948] block mb-1 uppercase tracking-wider">
                Security &amp; Architectural Invariant
              </span>
              <p className="font-sans text-[11px] text-[#1E293B] leading-relaxed">
                {selectedNode.details.invariant}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
