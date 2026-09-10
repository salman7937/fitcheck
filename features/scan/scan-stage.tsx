"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Scan, CheckCircle2 } from "lucide-react";
import { useScanBeam } from "./use-scan-timeline";
import { KeywordChip } from "./keyword-chip";

const LINE_COUNT = 14;

export type ScanStageProps = {
  progress: number; // 0-1, combined across parse + analyze streaming
  matched: string[];
  missing: string[];
  score: number | null;
  done: boolean;
};

export function ScanStage({ progress, matched, missing, score, done }: ScanStageProps) {
  const beamRef = useScanBeam(progress);
  const reduceMotion = useReducedMotion();

  // Helper text for scanning stages
  const getStageStatusText = () => {
    if (done) return "Analysis complete — generating fit report...";
    if (progress < 0.4) return "Phase 1: Ingesting document & parsing text nodes...";
    if (progress < 0.75) return "Phase 2: Extracting JD keywords & experience match...";
    return "Phase 3: Calculating ATS safety index & bullet impact...";
  };

  const percentage = Math.round(progress * 100);

  return (
    <div className="space-y-6">
      {/* Top Status Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-rule rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-beam/10 text-beam flex items-center justify-center shrink-0">
            <Scan className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <p className="text-xs font-mono font-medium text-muted uppercase">Active ATS Scan</p>
            <p className="text-sm font-semibold text-graphite">{getStageStatusText()}</p>
          </div>
        </div>

        {/* Progress Pill */}
        <div className="flex items-center gap-3">
          <div className="w-32 h-2 rounded-full bg-paper border border-rule overflow-hidden">
            <motion.div
              className="h-full bg-beam"
              initial={{ width: "0%" }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.2 }}
            />
          </div>
          <span className="font-mono text-xs font-bold text-beam min-w-[36px]">
            {percentage}%
          </span>
        </div>
      </div>

      {/* Main Scan Grid Pane */}
      <div className="grid md:grid-cols-[58%_42%] gap-6 border border-rule rounded-xl shadow-elevated overflow-hidden bg-white">
        {/* Abstracted Document Wireframe */}
        <div className="relative bg-white p-8 space-y-4 min-h-[380px] flex flex-col justify-between border-r border-rule/60">
          {/* Header block wireframe */}
          <div className="space-y-2 border-b border-rule/50 pb-4">
            <div className="h-4 w-44 bg-graphite/80 rounded-sm" />
            <div className="flex gap-2">
              <div className="h-2 w-20 bg-muted/40 rounded-sm" />
              <div className="h-2 w-28 bg-muted/40 rounded-sm" />
              <div className="h-2 w-16 bg-muted/40 rounded-sm" />
            </div>
          </div>

          {/* Section 1 lines */}
          <div className="space-y-3">
            <div className="h-3 w-28 bg-beam/40 rounded-sm font-mono text-[10px] text-beam uppercase tracking-wider pl-1">
              Experience
            </div>
            {Array.from({ length: LINE_COUNT }).map((_, i) => {
              const linePassed = progress * LINE_COUNT > i;
              return (
                <motion.div
                  key={i}
                  initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: reduceMotion ? 0 : i * 0.015 }}
                  className="h-2.5 rounded-sm transition-all duration-300"
                  style={{
                    width: `${65 + ((i * 43) % 32)}%`,
                    backgroundColor: linePassed ? "var(--graphite)" : "var(--rule)",
                    opacity: linePassed ? 0.85 : 0.4,
                  }}
                />
              );
            })}
          </div>

          {/* Glowing Laser Scan Beam line */}
          <div
            ref={beamRef}
            className="absolute left-0 right-0 h-1 z-20 pointer-events-none transition-all duration-75"
            style={{
              top: 0,
              background:
                "linear-gradient(90deg, transparent 0%, rgba(75, 46, 232, 0.4) 20%, var(--beam) 50%, rgba(75, 46, 232, 0.4) 80%, transparent 100%)",
              boxShadow: "0 0 15px var(--beam), 0 0 30px var(--beam)",
            }}
          />
        </div>

        {/* Analysis Rail */}
        <div className="bg-paper p-6 flex flex-col justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-rule/50 pb-3">
              <span className="font-display text-xs tracking-widest text-muted uppercase font-semibold">
                Match Score Verdict
              </span>
              {done && (
                <span className="inline-flex items-center gap-1 text-[11px] font-mono text-match font-semibold bg-match/10 px-2 py-0.5 rounded">
                  <CheckCircle2 className="w-3 h-3" /> Ready
                </span>
              )}
            </div>

            <div aria-live="polite" className="flex items-baseline gap-2">
              {done && score !== null ? (
                <span className="font-display text-6xl md:text-7xl font-bold tracking-tight text-graphite">
                  {score}
                </span>
              ) : (
                <span
                  className="text-6xl md:text-7xl font-bold tracking-tight text-muted/40"
                  style={{ fontFamily: "system-ui, sans-serif" }}
                >
                  --
                </span>
              )}
              <span className="font-mono text-sm text-muted">/ 100</span>
            </div>
          </div>

          {/* Keywords Stream Output */}
          <div className="space-y-4 flex-1 flex flex-col justify-start">
            <div>
              <p className="text-xs font-mono text-muted uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Matched Skills</span>
                <span className="text-match font-bold">{matched.length}</span>
              </p>
              <ul className="flex flex-wrap gap-1.5 min-h-[40px]">
                {matched.length > 0 ? (
                  matched.map((term, i) => (
                    <KeywordChip key={term} term={term} matched index={i} />
                  ))
                ) : (
                  <li className="text-xs text-muted/60 italic font-mono">Extracting matching terms...</li>
                )}
              </ul>
            </div>

            <div>
              <p className="text-xs font-mono text-muted uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Missing Skills</span>
                <span className="text-gap font-bold">{missing.length}</span>
              </p>
              <ul className="flex flex-wrap gap-1.5 min-h-[40px]">
                {missing.length > 0 ? (
                  missing.map((term, i) => (
                    <KeywordChip key={term} term={term} matched={false} index={i} />
                  ))
                ) : (
                  <li className="text-xs text-muted/60 italic font-mono">Identifying missing terms...</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

