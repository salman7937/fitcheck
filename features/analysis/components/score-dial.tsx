"use client";

import { motion } from "framer-motion";
import { scoreBand } from "@/features/analysis/score";
import { Award, ShieldAlert, CheckCircle, Sparkles } from "lucide-react";

export function ScoreDial({ score }: { score: number }) {
  const band = scoreBand(score);

  // SVG Gauge calculations
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getBandColor = () => {
    if (score >= 85) return { stroke: "#4B2EE8", bg: "bg-beam/10", text: "text-beam", border: "border-beam/30", icon: Sparkles };
    if (score >= 70) return { stroke: "#0B7A6B", bg: "bg-match/10", text: "text-match", border: "border-match/30", icon: CheckCircle };
    if (score >= 50) return { stroke: "#D97706", bg: "bg-amber-500/10", text: "text-amber-600", border: "border-amber-500/30", icon: Award };
    return { stroke: "#C42B6B", bg: "bg-gap/10", text: "text-gap", border: "border-gap/30", icon: ShieldAlert };
  };

  const colors = getBandColor();
  const IconComponent = colors.icon;

  return (
    <div aria-live="polite" className="flex items-center gap-6">
      {/* Animated Circular Gauge */}
      <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
        <svg className="w-full h-full transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="72"
            cy="72"
            r={radius}
            stroke="#DEE2DE"
            strokeWidth="10"
            fill="transparent"
          />
          {/* Animated progress circle */}
          <motion.circle
            cx="72"
            cy="72"
            r={radius}
            stroke={colors.stroke}
            strokeWidth="10"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>

        {/* Center score numeral */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="font-display text-4xl font-bold tracking-tight text-graphite">
            {score}
          </span>
          <span className="font-mono text-[10px] text-muted uppercase tracking-wider">
            / 100
          </span>
        </div>
      </div>

      {/* Band Details */}
      <div className="space-y-2">
        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold border ${colors.bg} ${colors.text} ${colors.border}`}>
          <IconComponent className="w-3.5 h-3.5" />
          <span>{band}</span>
        </div>
        <p className="text-xs text-muted max-w-[200px] leading-relaxed">
          Candidate fit score based on keyword extraction, experience match, ATS rules, and impact.
        </p>
      </div>
    </div>
  );
}

