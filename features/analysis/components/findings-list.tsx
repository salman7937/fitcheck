"use client";

import { motion } from "framer-motion";
import { AlertTriangle, AlertCircle, Sparkles, Wrench, ShieldAlert } from "lucide-react";
import type { Finding } from "@/features/analysis/schema";

const SEVERITY_CONFIG: Record<
  Finding["severity"],
  { label: string; text: string; bg: string; border: string; icon: React.ElementType }
> = {
  critical: {
    label: "Critical Finding",
    text: "text-gap",
    bg: "bg-gap/10",
    border: "border-gap/30",
    icon: AlertTriangle,
  },
  warning: {
    label: "Warning",
    text: "text-amber-600",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    icon: AlertCircle,
  },
  polish: {
    label: "Polish Opportunity",
    text: "text-beam",
    bg: "bg-beam/10",
    border: "border-beam/30",
    icon: Sparkles,
  },
};

export function FindingsList({ findings }: { findings: Finding[] }) {
  return (
    <div className="space-y-4">
      <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-muted border-b border-rule/60 pb-3">
        Actionable Detailed Findings ({findings.length})
      </h3>

      <ul className="space-y-3">
        {findings.map((f, index) => {
          const cfg = SEVERITY_CONFIG[f.severity];
          const Icon = cfg.icon;

          return (
            <motion.li
              key={f.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="border border-rule rounded-xl p-5 bg-white shadow-card hover:shadow-elevated transition-all space-y-3"
            >
              <div className="flex items-center justify-between gap-4">
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{cfg.label}</span>
                </div>

                {f.fixable ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono text-match bg-match/10 px-2 py-0.5 rounded border border-match/20 font-medium">
                    <Wrench className="w-3 h-3" /> Auto-Fixable
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono text-gap bg-gap/10 px-2 py-0.5 rounded border border-gap/20 font-medium">
                    <ShieldAlert className="w-3 h-3" /> Unfixable Gap
                  </span>
                )}
              </div>

              <div>
                <h4 className="font-display text-base font-semibold text-graphite">{f.title}</h4>
                <p className="text-xs text-muted leading-relaxed mt-1">{f.detail}</p>
              </div>

              {!f.fixable && (
                <div className="p-2.5 rounded-lg bg-paper border border-rule/60 text-xs text-gap font-mono">
                  💡 Note: This is an experience or qualification gap that rewording alone cannot solve.
                </div>
              )}
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}

