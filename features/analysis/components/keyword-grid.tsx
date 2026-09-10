"use client";

import { useState } from "react";
import { CheckCircle2, AlertCircle, Search } from "lucide-react";
import type { Analysis } from "@/features/analysis/schema";

export function KeywordGrid({ keywords }: { keywords: Analysis["keywords"] }) {
  const [filter, setFilter] = useState<"all" | "matched" | "missing">("all");
  const [query, setQuery] = useState("");

  const matchedList = keywords.matched.filter((k) =>
    k.term.toLowerCase().includes(query.toLowerCase())
  );
  const missingList = keywords.missing.filter((k) =>
    k.term.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="bg-white border border-rule rounded-xl p-6 shadow-card space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-rule/60 pb-4">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-muted">
          Extracted Keyword Signal
        </h3>

        {/* Filter Pills & Search */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search skills..."
              className="pl-7 pr-3 py-1 rounded-full text-xs font-mono border border-rule/80 bg-paper focus:outline-none focus:border-beam w-36"
            />
          </div>

          <div className="flex bg-paper p-1 rounded-full border border-rule/50">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1 rounded-full text-xs font-mono font-medium transition-all ${
                filter === "all" ? "bg-graphite text-white shadow-xs" : "text-muted hover:text-graphite"
              }`}
            >
              All ({keywords.matched.length + keywords.missing.length})
            </button>
            <button
              onClick={() => setFilter("matched")}
              className={`px-3 py-1 rounded-full text-xs font-mono font-medium transition-all ${
                filter === "matched" ? "bg-match text-white shadow-xs" : "text-muted hover:text-graphite"
              }`}
            >
              Matched ({keywords.matched.length})
            </button>
            <button
              onClick={() => setFilter("missing")}
              className={`px-3 py-1 rounded-full text-xs font-mono font-medium transition-all ${
                filter === "missing" ? "bg-gap text-white shadow-xs" : "text-muted hover:text-graphite"
              }`}
            >
              Missing ({keywords.missing.length})
            </button>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Matched Panel */}
        {(filter === "all" || filter === "matched") && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono font-semibold text-match">
              <CheckCircle2 className="w-4 h-4" />
              <span>MATCHED SKILLS ({matchedList.length})</span>
            </div>
            <ul className="flex flex-wrap gap-2">
              {matchedList.map((k) => (
                <li
                  key={k.term}
                  className="font-mono text-xs rounded-chip px-2.5 py-1 border border-match/30 bg-match/10 text-match flex items-center gap-1 font-medium shadow-xs"
                >
                  <CheckCircle2 className="w-3 h-3 shrink-0" />
                  <span>{k.term}</span>
                </li>
              ))}
              {matchedList.length === 0 && (
                <li className="text-xs text-muted font-mono italic">No matched skills found.</li>
              )}
            </ul>
          </div>
        )}

        {/* Missing Panel */}
        {(filter === "all" || filter === "missing") && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono font-semibold text-gap">
              <AlertCircle className="w-4 h-4" />
              <span>MISSING SKILLS ({missingList.length})</span>
            </div>
            <ul className="flex flex-wrap gap-2">
              {missingList.map((k) => (
                <li
                  key={k.term}
                  className="font-mono text-xs rounded-chip px-2.5 py-1 border border-gap/30 bg-gap/10 text-gap flex items-center gap-1 font-medium shadow-xs"
                >
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{k.term}</span>
                  <span className="text-[10px] opacity-75 font-mono">
                    ({k.required ? "required" : "preferred"})
                  </span>
                </li>
              ))}
              {missingList.length === 0 && (
                <li className="text-xs text-muted font-mono italic">No missing skills flagged.</li>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

