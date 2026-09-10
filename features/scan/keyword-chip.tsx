"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Check, X } from "lucide-react";

export function KeywordChip({
  term,
  matched,
  index,
}: {
  term: string;
  matched: boolean;
  index: number;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.li
      layout
      initial={reduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.85, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        delay: reduceMotion ? 0 : index * 0.04,
        type: "spring",
        stiffness: 400,
        damping: 25,
      }}
      className={`font-mono text-xs font-medium rounded-chip px-2.5 py-1 border flex items-center gap-1.5 shadow-xs ${
        matched
          ? "text-match border-match/30 bg-match/10"
          : "text-gap border-gap/30 bg-gap/10"
      }`}
    >
      {matched ? (
        <Check className="w-3 h-3 text-match shrink-0" />
      ) : (
        <X className="w-3 h-3 text-gap shrink-0" />
      )}
      <span>{term}</span>
    </motion.li>
  );
}

