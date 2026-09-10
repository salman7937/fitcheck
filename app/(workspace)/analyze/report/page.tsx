"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, RefreshCw, AlertCircle } from "lucide-react";
import { useSessionStore } from "@/store/session";
import { ScoreDial } from "@/features/analysis/components/score-dial";
import { SubscoreBars } from "@/features/analysis/components/subscore-bars";
import { KeywordGrid } from "@/features/analysis/components/keyword-grid";
import { FindingsList } from "@/features/analysis/components/findings-list";

export default function ReportPage() {
  const router = useRouter();
  const analysis = useSessionStore((s) => s.analysis);
  const jobDescription = useSessionStore((s) => s.jobDescription);

  if (!analysis) {
    return (
      <main className="max-w-3xl mx-auto px-6 py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-paper border border-rule mx-auto flex items-center justify-center text-muted">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="font-display text-2xl font-bold">No active analysis session</h2>
        <p className="text-sm text-muted">Upload a CV and job description to run an analysis run.</p>
        <button
          onClick={() => router.push("/analyze")}
          className="inline-flex items-center gap-2 bg-beam text-white rounded-xl px-6 py-3 text-sm font-medium hover:bg-beam/90 transition-all shadow-md shadow-beam/20"
        >
          <RefreshCw className="w-4 h-4" /> Start analysis
        </button>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-6 py-12 space-y-8">
      {/* Header Verdict Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-rule rounded-2xl p-6 md:p-8 shadow-elevated space-y-6"
      >
        <div className="flex items-center justify-between border-b border-rule/60 pb-4">
          <div>
            <span className="font-mono text-xs text-muted uppercase tracking-wider">Candidate Analysis Report</span>
            {jobDescription && (
              <h1 className="font-display text-xl font-bold text-graphite mt-0.5">
                Target: {jobDescription.title || "Job Posting"}
              </h1>
            )}
          </div>
          <button
            onClick={() => router.push("/analyze")}
            className="text-xs font-mono text-muted hover:text-graphite flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Re-run
          </button>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <ScoreDial score={analysis.score} />

          <div className="bg-paper border border-rule/60 rounded-xl p-5 md:max-w-sm space-y-2">
            <h4 className="font-display text-xs font-mono font-semibold uppercase text-graphite tracking-wider">
              Executive Verdict
            </h4>
            <p className="text-xs text-graphite/90 leading-relaxed italic">
              &quot;{analysis.verdict}&quot;
            </p>
          </div>
        </div>
      </motion.div>

      {/* Breakdown Grid */}
      <div className="space-y-8">
        <SubscoreBars subscores={analysis.subscores} />
        <KeywordGrid keywords={analysis.keywords} />
        <FindingsList findings={analysis.findings} />
      </div>

      {/* CTA Bottom Banner */}
      <div className="sticky bottom-6 z-40 bg-graphite text-white rounded-2xl p-6 shadow-2xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 backdrop-blur-md">
        <div className="space-y-1">
          <h4 className="font-display text-lg font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            Ready to close these gaps?
          </h4>
          <p className="text-xs text-white/70">
            Click to generate a strict, non-fabricated CV rewrite with live rescoring.
          </p>
        </div>

        <button
          onClick={() => router.push("/analyze/review")}
          className="inline-flex items-center justify-center gap-2 bg-beam hover:bg-beam/90 text-white font-medium text-sm rounded-xl px-6 py-3.5 transition-all shadow-lg shadow-beam/30 shrink-0"
        >
          Improve my CV
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </main>
  );
}
