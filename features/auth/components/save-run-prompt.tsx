"use client";

import { useState } from "react";
import { LogIn, Sparkles, X } from "lucide-react";
import { useAuthContext } from "./auth-provider";
import { SignInDialog } from "./sign-in-dialog";

export function SaveRunPrompt() {
  const { isAnonymous, resolved } = useAuthContext();
  const [dismissed, setDismissed] = useState(false);
  const [open, setOpen] = useState(false);

  if (!resolved || !isAnonymous || dismissed) return null;

  return (
    <div className="border border-beam/30 rounded-xl p-5 bg-beam/5 shadow-elevated space-y-3 relative">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-beam text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm shadow-beam/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-display text-sm font-semibold text-graphite flex items-center gap-1.5">
              Save this analysis run
              <span className="font-mono text-[10px] bg-match/10 text-match px-2 py-0.5 rounded font-medium">
                10 Analyses/Day
              </span>
            </h4>
            <p className="text-xs text-muted leading-relaxed mt-1">
              Sign in with Google to link your anonymous analysis, persist your runs, and unlock 10 daily scans.
            </p>
          </div>
        </div>

        <button
          onClick={() => setDismissed(true)}
          className="p-1 text-muted hover:text-graphite rounded-full"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {open ? (
        <SignInDialog onClose={() => setOpen(false)} />
      ) : (
        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 bg-beam text-white font-medium text-xs rounded-lg px-4 py-2 hover:bg-beam/90 transition-all shadow-sm"
          >
            <LogIn className="w-3.5 h-3.5" />
            Sign in with Google
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="text-xs text-muted hover:text-graphite font-mono"
          >
            Not now
          </button>
        </div>
      )}
    </div>
  );
}

