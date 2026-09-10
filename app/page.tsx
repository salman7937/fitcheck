"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Zap,
  Lock,
  FileCheck2,
  Sparkles,
  Search,
} from "lucide-react";

export default function Home() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 md:py-24 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-beam/10 via-match/5 to-transparent blur-3xl rounded-full pointer-events-none -z-10" />

      {/* Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-3xl flex flex-col items-center"
      >
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-rule/80 text-xs font-mono text-graphite shadow-sm mb-6">
          <span className="w-2 h-2 rounded-full bg-beam animate-ping inline-block" />
          <span className="text-beam font-medium">ATS Precision Engine</span>
          <span className="text-rule">•</span>
          <span className="text-muted">Zero Hallucinations</span>
        </div>

        <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-graphite text-balance leading-[1.08]">
          Know exactly which lines are{" "}
          <span className="underline decoration-beam/40 decoration-wavy decoration-2">
            costing you
          </span>{" "}
          the interview.
        </h1>

        <p className="mt-6 max-w-2xl text-base md:text-lg text-muted leading-relaxed text-balance">
          Upload your CV, paste the job description, and see your fit score broken down —
          then rewrite it with 1 click <strong className="text-graphite font-semibold">without inventing anything</strong>.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
          <Link
            href="/analyze"
            className="group relative inline-flex items-center justify-center gap-2.5 bg-beam text-white font-medium rounded-card px-8 py-4 text-base shadow-beam/30 shadow-lg hover:bg-beam/90 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          >
            <Sparkles className="w-5 h-5 text-white/80 group-hover:rotate-12 transition-transform" />
            Run CV Analysis
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>

          <a
            href="#features"
            className="inline-flex items-center justify-center gap-2 text-sm font-medium text-graphite hover:text-beam px-6 py-4 transition-colors"
          >
            How fitcheck works
          </a>
        </div>
      </motion.div>

      {/* Hero Visual Showcase Preview */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="mt-16 w-full max-w-4xl bg-white border border-rule rounded-2xl shadow-elevated p-6 md:p-8 space-y-6 relative"
      >
        <div className="flex items-center justify-between border-b border-rule/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-gap/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-match/80" />
            <span className="ml-2 font-mono text-xs text-muted">analysis_preview.pdf</span>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded bg-match/10 text-match font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" /> 84% Match Score
          </span>
        </div>

        <div className="grid md:grid-cols-3 gap-4 text-left">
          <div className="bg-paper p-4 rounded-xl border border-rule/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-muted uppercase">Keyword Match</span>
              <span className="text-xs font-mono text-match font-semibold">92%</span>
            </div>
            <div className="h-2 rounded-full bg-rule/50 overflow-hidden">
              <div className="h-full bg-match w-[92%]" />
            </div>
            <div className="flex flex-wrap gap-1 pt-1">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-match/10 text-match">Next.js</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-match/10 text-match">TypeScript</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gap/10 text-gap">Kubernetes</span>
            </div>
          </div>

          <div className="bg-paper p-4 rounded-xl border border-rule/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-muted uppercase">Experience Match</span>
              <span className="text-xs font-mono text-beam font-semibold">100%</span>
            </div>
            <div className="h-2 rounded-full bg-rule/50 overflow-hidden">
              <div className="h-full bg-beam w-[100%]" />
            </div>
            <p className="text-xs text-muted">5+ years required vs 6.2 years detected</p>
          </div>

          <div className="bg-paper p-4 rounded-xl border border-rule/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-muted uppercase">ATS Safety Index</span>
              <span className="text-xs font-mono text-match font-semibold">Pass</span>
            </div>
            <div className="h-2 rounded-full bg-rule/50 overflow-hidden">
              <div className="h-full bg-match w-[95%]" />
            </div>
            <p className="text-xs text-muted">Single-column layout, clean standard typography</p>
          </div>
        </div>
      </motion.div>

      {/* Feature Grid */}
      <section id="features" className="mt-24 w-full max-w-5xl space-y-8 text-left">
        <div className="text-center space-y-2">
          <p className="text-xs font-mono uppercase tracking-widest text-muted">Engineered for Candidates</p>
          <h2 className="font-display text-3xl font-bold text-graphite">Built around ATS machine reading</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-rule shadow-card hover:shadow-elevated transition-shadow space-y-3">
            <div className="w-10 h-10 rounded-lg bg-beam/10 text-beam flex items-center justify-center">
              <Search className="w-5 h-5" />
            </div>
            <h3 className="font-display text-lg font-semibold">Deterministic Keyword Scan</h3>
            <p className="text-sm text-muted leading-relaxed">
              We extract exact skills from the job description and highlight present vs missing candidate keywords.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-rule shadow-card hover:shadow-elevated transition-shadow space-y-3">
            <div className="w-10 h-10 rounded-lg bg-gap/10 text-gap flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-display text-lg font-semibold">No-Fabrication Rule</h3>
            <p className="text-sm text-muted leading-relaxed">
              Rewrites never invent companies, dates, or unverified skills. Post-checks flag unverified claims automatically.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-rule shadow-card hover:shadow-elevated transition-shadow space-y-3">
            <div className="w-10 h-10 rounded-lg bg-match/10 text-match flex items-center justify-center">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <h3 className="font-display text-lg font-semibold">1-Click ATS PDF Export</h3>
            <p className="text-sm text-muted leading-relaxed">
              Download clean, single-column, deterministic PDFs engineered specifically for machine parsing.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
