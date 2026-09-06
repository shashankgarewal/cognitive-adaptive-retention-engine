/**
 * CARE - SystemArchitectureSection Component
 * 4-step horizontal process flow detailing the Continuous Mastery Architecture.
 */

import React from 'react';
import { Layers, ArrowRight, GitPullRequest, Cpu, LineChart, Sparkles } from 'lucide-react';

export const SystemArchitectureSection: React.FC = () => {
  const steps = [
    {
      stepNumber: 'STEP 01',
      badge: 'INGEST',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      title: 'Capture',
      description:
        'Auto-ingest technical context, architecture decisions, and LLM synthesis sessions via lightweight CLI hooks, VS Code extension, or web studio.',
      footerTag: 'Telemetry Input Bus',
      icon: GitPullRequest,
    },
    {
      stepNumber: 'STEP 02',
      badge: 'ISOLATE',
      badgeColor: 'bg-cyan-50 text-cyan-700 border-cyan-200',
      title: 'Synthesize',
      description:
        'Gemini 2.5 parses raw diffs to isolate critical mental models, extracting foundational logic and calculating an explicit AI Reliance Index.',
      footerTag: 'Gemini 2.5 Invariant Parser',
      icon: Cpu,
    },
    {
      stepNumber: 'STEP 03',
      badge: 'TELEMETRY',
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
      title: 'Calculate',
      description:
        'Dynamic decay algorithms map concept vulnerability in real time, projecting individual half-lives and flagging nuances crossing the 60% retention floor.',
      footerTag: 'Ebbinghaus Decay Simulator',
      icon: LineChart,
    },
    {
      stepNumber: 'STEP 04',
      badge: 'LOCK-IN',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      title: 'Reinforce',
      description:
        'Execute hyper-targeted 2-minute Socratic dialogues that challenge edge cases, resetting the decay half-life and confirming conceptual mastery.',
      footerTag: 'Socratic Recall Engine',
      icon: Sparkles,
    },
  ];

  return (
    <section id="architecture" className="py-10 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-16">
      {/* Eyebrow and Section Header */}
      <div className="text-center max-w-3xl mx-auto space-y-2.5">
        <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-700 font-semibold">
          END-TO-END COGNITIVE PRESERVATION
        </span>
        <h2 className="font-serif text-2xl sm:text-3xl lg:text-[38px] font-bold text-slate-900 tracking-tight leading-tight">
          The Continuous Mastery System Architecture
        </h2>
        <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
          A four-stage closed-loop loop that isolates perishable technical knowledge and transforms ambient code output into permanent developer intellect.
        </p>
      </div>

      {/* 4-Step Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mt-6 sm:mt-8">
        {steps.map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={item.stepNumber}
              className="relative bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between shadow-2xs hover:shadow-md hover:border-slate-300 transition-all group"
            >
              <div className="space-y-3.5">
                {/* Header row: Step number & Badge */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-400">
                    {item.stepNumber}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider border ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                </div>

                {/* Title */}
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 group-hover:bg-emerald-50 group-hover:text-emerald-700 transition-colors">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="font-serif text-xl font-bold text-slate-900 tracking-tight">
                    {item.title}
                  </h3>
                </div>

                {/* Description */}
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {item.description}
                </p>
              </div>

              {/* Sub-tag / footer */}
              <div className="mt-6 pt-3.5 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-500">
                <span>{item.footerTag}</span>
                {index < steps.length - 1 && (
                  <ArrowRight className="w-3.5 h-3.5 text-slate-300 hidden lg:block" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
