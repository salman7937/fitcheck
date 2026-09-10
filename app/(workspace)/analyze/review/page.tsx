"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Loader2,
  AlertTriangle,
  FileCheck2,
  ArrowLeft,
  CheckCheck,
  RotateCcw,
} from "lucide-react";
import { useSessionStore } from "@/store/session";
import { improveRequest, exportPdfRequest } from "@/lib/api-client";
import { recalculateScore } from "@/features/improve/live-score";
import { applyChanges } from "@/features/improve/apply-changes";
import { ChangeCard } from "@/features/improve/components/change-card";
import { ReviewToolbar } from "@/features/improve/components/review-toolbar";
import { SaveRunPrompt } from "@/features/auth/components/save-run-prompt";
import type { Change } from "@/features/improve/schema";

export default function ReviewPage() {
  const router = useRouter();
  const { resume, jobDescription, analysis, changes, setChanges, toggleChange } =
    useSessionStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  useEffect(() => {
    if (!resume || !jobDescription || !analysis) return;
    if (changes) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect -- kicks off a one-time fetch on mount
    setLoading(true);
    improveRequest<{ changes: Change[] }>(resume, jobDescription, analysis)
      .then((result) => setChanges(result.changes))
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, [resume, jobDescription, analysis, changes, setChanges]);

  if (!resume || !jobDescription || !analysis) {
    return (
      <main className="max-w-3xl mx-auto px-6 py-16 text-center space-y-4">
        <h2 className="font-display text-2xl font-bold">No active analysis to review</h2>
        <button
          onClick={() => router.push("/analyze")}
          className="inline-flex items-center gap-2 bg-beam text-white rounded-xl px-6 py-3 text-sm font-medium hover:bg-beam/90 transition-all shadow-md shadow-beam/20"
        >
          <ArrowLeft className="w-4 h-4" /> Start analysis
        </button>
      </main>
    );
  }

  if (loading || !changes) {
    return (
      <main className="max-w-xl mx-auto px-6 py-24 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-beam/10 border border-beam/20 text-beam mx-auto flex items-center justify-center shadow-lg shadow-beam/15">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
        <div className="space-y-2">
          <h2 className="font-display text-2xl font-bold text-graphite">
            Generating non-fabricated rewrites...
          </h2>
          <p aria-live="polite" className="text-xs text-muted font-mono">
            {error ?? "Enforcing strict no-fabrication constraints & ATS formatting rules."}
          </p>
        </div>
      </main>
    );
  }

  const { score } = recalculateScore(
    resume,
    jobDescription,
    changes,
    analysis.subscores.impactQuality
  );

  const acceptedCount = changes.filter((c) => c.accepted).length;

  const handleAcceptAll = () => {
    setChanges(changes.map((c) => ({ ...c, accepted: true })));
  };

  const handleRejectAll = () => {
    setChanges(changes.map((c) => ({ ...c, accepted: false })));
  };

  async function handleDownload() {
    if (!resume || !jobDescription || !changes) return;
    setDownloading(true);
    try {
      const finalResume = applyChanges(resume, changes);
      await exportPdfRequest({
        resume: finalResume,
        jdTitle: jobDescription.title,
        jd: jobDescription,
        analysis,
        changes,
      });
      setDownloaded(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <main className="max-w-3xl mx-auto px-6 py-12 space-y-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-rule/60 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-3xl font-bold tracking-tight text-graphite">
              Review Proposed Changes
            </h1>
            <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-beam/10 text-beam font-semibold">
              {acceptedCount}/{changes.length} Accepted
            </span>
          </div>
          <p className="text-xs text-muted mt-1">
            Toggle individual rewrites to see live score recalculation in real-time.
          </p>
        </div>

        {/* Bulk Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleAcceptAll}
            className="inline-flex items-center gap-1 text-xs font-mono font-medium px-3 py-1.5 rounded-lg border border-match/30 bg-match/10 text-match hover:bg-match/20 transition-all"
          >
            <CheckCheck className="w-3.5 h-3.5" /> Accept all
          </button>
          <button
            onClick={handleRejectAll}
            className="inline-flex items-center gap-1 text-xs font-mono font-medium px-3 py-1.5 rounded-lg border border-rule/80 bg-paper text-muted hover:text-graphite transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reject all
          </button>
        </div>
      </div>

      {/* Changes List */}
      <ul className="space-y-4">
        {changes.map((change) => (
          <ChangeCard key={change.id} change={change} onToggle={toggleChange} />
        ))}
      </ul>

      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          role="alert"
          className="flex items-center gap-3 p-4 rounded-xl bg-gap/10 border border-gap/20 text-gap text-xs font-medium"
        >
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </motion.div>
      )}

      {/* Post Download Success Notification */}
      {downloaded && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-4 p-5 rounded-2xl bg-match/10 border border-match/30"
        >
          <div className="flex items-center gap-3 text-match">
            <div className="w-8 h-8 rounded-full bg-match text-white flex items-center justify-center shrink-0">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <p role="status" className="font-display text-sm font-bold text-graphite">
                ATS-Safe PDF successfully generated and downloaded!
              </p>
              <p className="text-xs text-muted font-mono">
                Single-column ATS format • Standard fonts embedded
              </p>
            </div>
          </div>
          <SaveRunPrompt />
        </motion.div>
      )}

      {/* Floating Bottom Live Score & Action Bar */}
      <ReviewToolbar score={score} onDownload={handleDownload} downloading={downloading} />
    </main>
  );
}
