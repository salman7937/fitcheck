"use client";

import { motion } from "framer-motion";
import { Briefcase, Calendar } from "lucide-react";
import type { Run } from "@/features/history/schema";
import { scoreBand } from "@/features/analysis/score";

export function RunCard({ run }: { run: Run }) {
  const band = scoreBand(run.score);

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-beam bg-beam/10 border-beam/30";
    if (score >= 70) return "text-match bg-match/10 border-match/30";
    if (score >= 50) return "text-amber-600 bg-amber-500/10 border-amber-500/30";
    return "text-gap bg-gap/10 border-gap/30";
  };

  return (
    <motion.li
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-rule rounded-xl p-5 bg-white shadow-card hover:shadow-elevated transition-all flex items-center justify-between gap-4"
    >
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-muted shrink-0" />
          <h4 className="font-display text-base font-semibold text-graphite">
            {run.jobTitle}
            {run.company ? ` — ${run.company}` : ""}
          </h4>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted font-mono">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {new Date(run.createdAt).toLocaleDateString()}
          </span>
          <span>•</span>
          <span className="font-sans text-graphite/70">{band}</span>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div className={`px-4 py-2 rounded-xl border font-mono flex flex-col items-center justify-center ${getScoreColor(run.score)}`}>
          <span className="font-display text-2xl font-bold leading-none">{run.score}</span>
          <span className="text-[9px] uppercase tracking-wider font-mono opacity-80 mt-0.5">Score</span>
        </div>
      </div>
    </motion.li>
  );
}

