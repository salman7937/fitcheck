"use client";

import { motion } from "framer-motion";
import { Search, Briefcase, ShieldCheck, TrendingUp } from "lucide-react";
import type { Analysis } from "@/features/analysis/schema";

const METRICS: Record<
  keyof Analysis["subscores"],
  { label: string; weight: string; icon: React.ElementType }
> = {
  keywordCoverage: { label: "Keyword coverage", weight: "35% weight", icon: Search },
  experienceMatch: { label: "Experience match", weight: "25% weight", icon: Briefcase },
  atsSafety: { label: "ATS safety index", weight: "20% weight", icon: ShieldCheck },
  impactQuality: { label: "Impact & Action verbs", weight: "20% weight", icon: TrendingUp },
};

export function SubscoreBars({ subscores }: { subscores: Analysis["subscores"] }) {
  return (
    <div className="bg-white border border-rule rounded-xl p-6 shadow-card space-y-4">
      <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-muted border-b border-rule/60 pb-3">
        Sub-Score Breakdown
      </h3>

      <ul className="space-y-4">
        {(Object.keys(METRICS) as (keyof Analysis["subscores"])[]).map((key, i) => {
          const item = METRICS[key];
          const Icon = item.icon;
          const val = Math.max(0, Math.min(100, subscores[key]));

          const getBarColor = (score: number) => {
            if (score >= 80) return "bg-match";
            if (score >= 60) return "bg-beam";
            return "bg-gap";
          };

          return (
            <li key={key} className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-paper flex items-center justify-center text-graphite border border-rule/50">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-medium text-graphite">{item.label}</span>
                  <span className="font-mono text-[10px] text-muted bg-paper px-1.5 py-0.5 rounded">
                    {item.weight}
                  </span>
                </div>
                <span className="font-mono font-bold text-graphite">{val}/100</span>
              </div>

              <div className="h-2 bg-paper border border-rule/60 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full ${getBarColor(val)}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${val}%` }}
                  transition={{ duration: 0.8, delay: i * 0.1, ease: "easeOut" }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

