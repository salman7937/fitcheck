"use client";

import { motion } from "framer-motion";
import { ShieldAlert, Check, FileCode2, Sparkles } from "lucide-react";
import type { Change } from "@/features/improve/schema";
import { DiffText } from "./diff-text";

export function ChangeCard({
  change,
  onToggle,
}: {
  change: Change;
  onToggle: (id: string) => void;
}) {
  return (
    <motion.li
      layout
      animate={{ opacity: change.accepted ? 1 : 0.6 }}
      className={`border rounded-xl p-5 bg-white transition-all space-y-4 shadow-card ${
        change.accepted ? "border-rule/80" : "border-rule/40 bg-paper/30"
      }`}
    >
      <div className="flex items-center justify-between gap-4 border-b border-rule/60 pb-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-semibold uppercase px-2.5 py-0.5 rounded bg-beam/10 text-beam">
            {change.kind}
          </span>
          <span className="font-mono text-xs text-muted flex items-center gap-1">
            <FileCode2 className="w-3.5 h-3.5" />
            {change.path}
          </span>
        </div>

        {/* Custom Toggle Switch */}
        <button
          type="button"
          onClick={() => onToggle(change.id)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono font-medium transition-all ${
            change.accepted
              ? "bg-match text-white shadow-xs shadow-match/20"
              : "bg-paper text-muted border border-rule/60 hover:text-graphite"
          }`}
        >
          <div
            className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${
              change.accepted ? "bg-white text-match" : "border border-muted/50"
            }`}
          >
            {change.accepted && <Check className="w-2.5 h-2.5 stroke-[3]" />}
          </div>
          <span>{change.accepted ? "Accepted" : "Rejected"}</span>
        </button>
      </div>

      {/* Before / After Diff */}
      <DiffText before={change.before} after={change.after} />

      {/* Reason Narrative */}
      <div className="flex items-start gap-2 text-xs text-graphite/80">
        <Sparkles className="w-4 h-4 text-beam shrink-0 mt-0.5" />
        <p className="leading-relaxed"><strong className="text-graphite">Rationale:</strong> {change.reason}</p>
      </div>

      {/* Unverified Warning Shield */}
      {change.unverified && (
        <div
          role="alert"
          className="flex items-start gap-2.5 p-3 rounded-lg bg-gap/10 border border-gap/20 text-gap text-xs"
        >
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-mono font-semibold uppercase tracking-wide text-[11px]">
              Unverified Claim Warning
            </p>
            <p className="leading-relaxed">
              This change surfaces terms not found in your original resume. Verify accuracy before accepting.
            </p>
          </div>
        </div>
      )}
    </motion.li>
  );
}

