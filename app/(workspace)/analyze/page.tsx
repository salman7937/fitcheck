"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  UploadCloud,
  X,
  Sparkles,
  AlertTriangle,
  FileCheck,
  ClipboardList,
} from "lucide-react";
import { useSessionStore } from "@/store/session";
import { parseResumeRequest, analyzeRequest } from "@/lib/api-client";
import { ScanStage } from "@/features/scan/scan-stage";
import type { Resume } from "@/features/resume/schema";
import type { JobDescription } from "@/features/job-description/schema";
import type { Analysis } from "@/features/analysis/schema";

const PARSE_WEIGHT = 0.4;
const ANALYZE_WEIGHT = 0.6;

const SAMPLE_JD = `Senior Full Stack Engineer (Next.js & TypeScript)

We are looking for a Senior Full Stack Engineer with 4+ years of hands-on experience building production React & Next.js applications with TypeScript.

Key Requirements:
• Strong mastery of React 19, Next.js App Router, Server Components, and TypeScript strict mode.
• Solid background designing RESTful APIs, Node.js services, and Cloud Firestore/PostgreSQL backends.
• Experience with state management (Zustand, TanStack Query) and Framer Motion UI animations.
• Understanding of ATS optimizations, CI/CD pipelines, automated testing (Vitest/Jest, Playwright).
• Track record of improving app performance, bundle optimization, and core web vitals.`;

export default function AnalyzePage() {
  const router = useRouter();
  const { setResume, jdText, setJdText, setAnalysisResult } = useSessionStore();

  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [result, setResult] = useState<{ analysis: Analysis; jd: JobDescription } | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      if (droppedFile.size > 5 * 1024 * 1024) {
        setError("File size exceeds 5 MB. Please choose a smaller file.");
        return;
      }
      setFile(droppedFile);
      setError(null);
    }
  };

  async function runAnalysis() {
    if (!file) {
      setError("Drop your CV here. PDF or Word, under 5 MB.");
      return;
    }
    if (jdText.trim().length < 40) {
      setError("Paste the job description. The whole posting works better than a summary.");
      return;
    }

    setError(null);
    setResult(null);
    setScanProgress(0);
    setBusy(true);

    try {
      const resume = await parseResumeRequest<Resume>(file, (f) =>
        setScanProgress(f.progress * PARSE_WEIGHT)
      );
      setResume(resume);

      const analyzed = await analyzeRequest<{ analysis: Analysis; jd: JobDescription }>(
        resume,
        jdText,
        (f) => setScanProgress(PARSE_WEIGHT + f.progress * ANALYZE_WEIGHT)
      );

      setResult(analyzed);
      setAnalysisResult(analyzed.jd, analyzed.analysis);

      // Deliberate pause so verdict stage is visible before navigating
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      await new Promise((resolve) => setTimeout(resolve, reduceMotion ? 200 : 1400));

      router.push("/analyze/report");
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  if (busy) {
    return (
      <main className="max-w-5xl mx-auto px-6 py-12">
        <ScanStage
          progress={scanProgress}
          matched={result?.analysis.keywords.matched.map((k) => k.term) ?? []}
          missing={result?.analysis.keywords.missing.map((k) => k.term) ?? []}
          score={result?.analysis.score ?? null}
          done={result !== null}
        />
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-6 py-12 space-y-10">
      <div className="space-y-2">
        <h1 className="font-display text-4xl font-bold tracking-tight text-graphite">
          CV & Job Match Analysis
        </h1>
        <p className="text-sm text-muted">
          Upload your candidate resume and paste the targeted job description below to start the ATS scan.
        </p>
      </div>

      <div className="space-y-8">
        {/* Upload File Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="cv-file" className="block text-sm font-medium text-graphite">
              1. Upload Candidate CV
            </label>
            <span className="text-xs text-muted font-mono">PDF or DOCX (Max 5 MB)</span>
          </div>

          {!file ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer ${
                isDragging
                  ? "border-beam bg-beam/5 shadow-beam"
                  : "border-rule hover:border-beam/60 hover:bg-white/80 bg-white"
              }`}
            >
              <input
                id="cv-file"
                type="file"
                accept=".pdf,.docx"
                onChange={(e) => {
                  const selected = e.target.files?.[0] ?? null;
                  if (selected && selected.size > 5 * 1024 * 1024) {
                    setError("File size exceeds 5 MB.");
                    return;
                  }
                  setFile(selected);
                  setError(null);
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />

              <div className="flex flex-col items-center gap-3 pointer-events-none">
                <div className="w-12 h-12 rounded-full bg-beam/10 text-beam flex items-center justify-center shadow-sm">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-graphite">
                    Drop your CV file here, or <span className="text-beam underline">browse</span>
                  </p>
                  <p className="text-xs text-muted mt-1">Supports PDF and Word documents</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between border border-match/30 bg-match/5 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-lg bg-match/15 text-match flex items-center justify-center shrink-0">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div className="truncate">
                  <p className="text-sm font-medium text-graphite truncate">{file.name}</p>
                  <p className="text-xs text-muted font-mono">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB • Selected
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFile(null)}
                className="p-1.5 rounded-full text-muted hover:text-gap hover:bg-gap/10 transition-colors"
                title="Remove file"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Job Description Textarea */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="jd-text" className="block text-sm font-medium text-graphite">
              2. Target Job Description
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setJdText(SAMPLE_JD);
                  setError(null);
                }}
                className="text-xs text-beam hover:underline flex items-center gap-1 font-mono"
              >
                <ClipboardList className="w-3.5 h-3.5" />
                Try example JD
              </button>
              <span className="text-xs font-mono text-muted">
                {jdText.trim().length} chars
              </span>
            </div>
          </div>

          <textarea
            id="jd-text"
            rows={10}
            value={jdText}
            onChange={(e) => {
              setJdText(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Paste the full job posting requirements, required tech stack, and experience qualifications here..."
            className="block w-full border border-rule/80 rounded-xl px-4 py-3.5 bg-white font-mono text-xs leading-relaxed focus:border-beam focus:ring-2 focus:ring-beam/20 focus:outline-none transition-all shadow-sm"
          />
        </div>

        {/* Error Notification */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            role="alert"
            className="flex items-center gap-3 p-4 rounded-xl bg-gap/10 border border-gap/20 text-gap text-xs font-medium"
          >
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        {/* Action Button */}
        <button
          onClick={runAnalysis}
          className="w-full relative group inline-flex items-center justify-center gap-2.5 bg-beam text-white font-medium rounded-xl px-6 py-4 text-base shadow-beam/30 shadow-md hover:bg-beam/90 hover:shadow-lg active:scale-[0.99] transition-all duration-200"
        >
          <Sparkles className="w-5 h-5 text-white/90 group-hover:rotate-12 transition-transform" />
          Run ATS Analysis
        </button>
      </div>
    </main>
  );
}
