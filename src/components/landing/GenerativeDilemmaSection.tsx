/**
 * CARE - GenerativeDilemmaSection Component
 * Problem statement and 3-column value proposition feature cards.
 */

import React from 'react';
import { Terminal, Activity, MessageSquareCode, Sparkles, Brain, Cpu, ArrowUpRight } from 'lucide-react';

export const GenerativeDilemmaSection: React.FC = () => {
  return (
    <section id="features" className="py-10 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-mt-16">
      {/* Section Eyebrow & Dual Header */}
      <div className="space-y-3 max-w-4xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-mono uppercase tracking-wider font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>The Generative AI Dilemma</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-10 items-start">
          <div className="lg:col-span-7">
            <h2 className="font-serif text-2xl sm:text-3xl lg:text-[38px] font-bold text-slate-900 tracking-tight leading-tight">
              Copilots write 70% of your code.{' '}
              <span className="italic font-serif text-slate-600 font-normal block sm:inline">
                Who retains the core architectural intuition?
              </span>
            </h2>
          </div>

          <div className="lg:col-span-5 text-slate-600 text-xs sm:text-sm leading-relaxed pt-1">
            <p>
              When language models generate solutions effortlessly, human developers miss the neural struggle required to encode durable long-term mental models. CARE turns passive acceptance into active mastery.
            </p>
          </div>
        </div>
      </div>

      {/* 3-Column Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6 sm:mt-8">
        {/* Card 1: Effortless Technical Ingestion */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-3.5 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between group">
          <div className="space-y-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 group-hover:scale-105 transition-transform">
              <Terminal className="w-5 h-5" />
            </div>

            <h3 className="font-serif text-xl font-bold text-slate-900 tracking-tight">
              Effortless Technical Ingestion
            </h3>

            <p className="text-sm text-slate-600 leading-relaxed">
              Capture your real day-to-day architecture discussions, terminal sessions, and LLM conversations via VS Code or CLI without context switching.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-500">
            <span>VS Code Extension • zsh hook • Web GUI</span>
          </div>
        </div>

        {/* Card 2: Calculated Half-Life Decay */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 space-y-4 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between group">
          <div className="space-y-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 group-hover:scale-105 transition-transform">
              <Activity className="w-5 h-5" />
            </div>

            <h3 className="font-serif text-xl font-bold text-slate-900 tracking-tight">
              Calculated Half-Life Decay
            </h3>

            <p className="text-sm text-slate-600 leading-relaxed">
              Mathematical Ebbinghaus decay curves continuously model memory degradation based on AI reliance factors, complexity metrics, and recall intervals.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-500">
            <span>R = e^(-t/S) Continuous Telemetry</span>
          </div>
        </div>

        {/* Card 3: Socratic Peer Evaluation */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 space-y-4 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between group">
          <div className="space-y-4">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-700 group-hover:scale-105 transition-transform">
              <MessageSquareCode className="w-5 h-5" />
            </div>

            <h3 className="font-serif text-xl font-bold text-slate-900 tracking-tight">
              Socratic Peer Evaluation
            </h3>

            <p className="text-sm text-slate-600 leading-relaxed">
              No multiple-choice trivia. Engage in rapid, high-yield conceptual debates with Gemini 2.5 Flash to verify true foundational ownership.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-500">
            <span>2-Minute Frictionless Flash Drills</span>
          </div>
        </div>
      </div>
    </section>
  );
};
