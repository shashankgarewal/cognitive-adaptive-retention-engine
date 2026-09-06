import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ZeroStateHeader } from '../dashboard/ZeroStateHeader';
import { PipelineDiagramCard } from './PipelineDiagramCard';
import { DeepDiveSpecGrid } from './DeepDiveSpecGrid';
import { TelemetryTestHarness } from './TelemetryTestHarness';
import { JournalEntry, ExtractedConcept } from '../../types';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldCheck,
  Activity,
  Layers,
  Cpu,
  Clock,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

interface ArchitectureSpecPageProps {
  onSelectNav?: (nav: string) => void;
  onViewLanding?: () => void;
  onOpenAuth?: () => void;
  onLogSuccess?: (entry: JournalEntry, concepts: ExtractedConcept[]) => void;
}

export const ArchitectureSpecPage: React.FC<ArchitectureSpecPageProps> = ({
  onSelectNav,
  onViewLanding,
  onOpenAuth,
  onLogSuccess,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLogClick = () => {
    if (!user && onOpenAuth) {
      onOpenAuth();
      return;
    }
    navigate('/journal/editor');
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1E293B] font-sans flex flex-col selection:bg-emerald-500/20 selection:text-emerald-900 antialiased">
      {/* 1. Fixed Header Bar */}
      <ZeroStateHeader
        onLogClick={handleLogClick}
        onViewLanding={onViewLanding}
        activeNav="spec"
        onSelectNav={onSelectNav}
        logStreak={12}
        recallStreak={5}
      />

      {/* 2. Page Context & Telemetry Header */}
      <div className="border-b border-[#E5E0D8] bg-white/70 backdrop-blur-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Breadcrumb & Scope Lock pill */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#ECFDF5] border border-emerald-300 text-[#006948] font-mono text-xs font-semibold shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                PROJECT SCOPE LOCKED: care-recall
              </span>
              <span className="hidden sm:inline text-xs font-mono text-[#505F76]">
                GCP: us-central1 • Vertex AI &amp; Cloud Run Active
              </span>
            </div>

            {/* Status Metrics (Right) */}
            <div className="flex items-center gap-2 font-mono text-xs">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF8F5] border border-[#E5E0D8] text-[#1E293B] shadow-2xs">
                <Clock className="w-3 h-3 text-[#006948]" />
                <span>Runtime Latency: <strong>142ms p95</strong></span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF8ED] border border-amber-200 text-[#8D4B00] shadow-2xs">
                <Activity className="w-3 h-3 text-amber-600 animate-pulse" />
                <span>Decay Loop: <strong>Real-time Stream</strong></span>
              </div>
            </div>
          </div>

          {/* Main Title & Subtitle */}
          <div className="max-w-4xl">
            <h1 className="font-serif font-bold text-3xl sm:text-4xl lg:text-5xl text-[#1E293B] tracking-tight leading-tight">
              CARE System Architecture &amp; Technical Spec
            </h1>
            <p className="font-sans text-sm sm:text-base text-[#505F76] mt-2.5 leading-relaxed max-w-3xl">
              Complete engineering blueprint: data ingestion pipelines, mathematical decay modeling, UID security boundaries, and autonomous Socratic recall agents.
            </p>
          </div>
        </div>
      </div>

      {/* Main Blueprint Content Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 flex-1 w-full">
        {/* 3. Pipeline Diagram Card (6 Horizontal Sequential Nodes) */}
        <section aria-labelledby="pipeline-section">
          <PipelineDiagramCard />
        </section>

        {/* 4. 2x2 Deep-Dive Specification Grid */}
        <section aria-labelledby="spec-grid-section">
          <DeepDiveSpecGrid />
        </section>

        {/* 5. Interactive Telemetry Test Harness Inset */}
        <section aria-labelledby="test-harness-section">
          <TelemetryTestHarness />
        </section>
      </main>

      {/* 6. Footer */}
      <footer className="border-t border-[#E5E0D8] bg-white py-6 px-4 sm:px-6 lg:px-8 text-xs text-[#505F76]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-[#006948] text-white flex items-center justify-center font-serif text-xs font-bold">
              C
            </div>
            <span className="font-sans font-medium text-[#1E293B]">
              CARE - Cognitive &amp; Adaptive Retention Engine · An AI that CAREs about Human Expertise.
            </span>
          </div>
          <div className="flex items-center gap-3 font-mono text-[11px] text-slate-500">
            <span className="px-2 py-0.5 rounded bg-[#FAF8F5] border border-[#E5E0D8] text-[#006948] font-bold">
              v0.1-telemetry-online
            </span>
            <span className="hidden md:inline">Vertex AI &amp; Cloud Run us-central1</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
