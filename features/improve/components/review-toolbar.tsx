"use client";

import { motion } from "framer-motion";
import { Download, Loader2, TrendingUp } from "lucide-react";

export function ReviewToolbar({
  score,
  onDownload,
  downloading,
}: {
  score: number;
  onDownload: () => void;
  downloading?: boolean;
}) {
  return (
    <div className="sticky bottom-6 z-40 bg-graphite/95 text-white backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-2xl flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-beam/20 border border-beam/40 text-beam flex items-center justify-center font-bold">
          <TrendingUp className="w-5 h-5 text-white" />
        </div>

        <div>
          <span className="font-mono text-[10px] uppercase text-white/60 tracking-wider">
            Live Recalculated Score
          </span>
          <div aria-live="polite" className="flex items-baseline gap-1.5">
            <motion.span
              key={score}
              initial={{ scale: 0.8, opacity: 0.5 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="font-display text-2xl font-bold tracking-tight text-white"
            >
              {score}
            </motion.span>
            <span className="font-mono text-xs text-white/60">/ 100</span>
          </div>
        </div>
      </div>

      <button
        onClick={onDownload}
        disabled={downloading}
        className="inline-flex items-center gap-2 bg-beam text-white font-medium text-sm rounded-xl px-6 py-3.5 hover:bg-beam/90 active:scale-[0.98] disabled:opacity-60 transition-all shadow-lg shadow-beam/30 shrink-0"
      >
        {downloading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-white" />
            <span>Rendering PDF...</span>
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            <span>Download ATS PDF</span>
          </>
        )}
      </button>
    </div>
  );
}

