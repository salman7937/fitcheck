"use client";

import { useState } from "react";
import { signOut } from "firebase/auth";
import { LogIn, LogOut, User as UserIcon, Trash2, AlertCircle } from "lucide-react";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { useAuthContext } from "./auth-provider";
import { clearSession } from "../sync-session";
import { SignInDialog } from "./sign-in-dialog";

const DELETE_CONFIRMATION_WORD = "DELETE";

export function AccountMenu() {
  const { user, isAnonymous, resolved } = useAuthContext();
  const [showSignIn, setShowSignIn] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);

  // Never flash a "Sign in" button that swaps to an avatar — render a
  // neutral placeholder until the first onIdTokenChanged has resolved (§6.7).
  if (!resolved) {
    return <div className="h-9 w-24 animate-pulse rounded bg-rule/30" />;
  }

  async function handleSignOut() {
    setBusy(true);
    const auth = getFirebaseAuth();
    await clearSession(); // server-side revokeRefreshTokens, not just client signOut()
    if (auth) await signOut(auth);
    setBusy(false);
  }

  async function handleDeleteAccount() {
    if (confirmText !== DELETE_CONFIRMATION_WORD) return;
    setBusy(true);
    try {
      await fetch("/api/auth/account", { method: "DELETE" });
      const auth = getFirebaseAuth();
      if (auth) await signOut(auth);
      // Full reload on purpose: wipe all client state (auth, store) after account deletion.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = "/";
    } finally {
      setBusy(false);
    }
  }

  if (isAnonymous) {
    return (
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono bg-gap/10 text-gap border border-gap/20 font-medium">
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-gap animate-pulse inline-block" />
          Unsaved Run
        </span>
        <div className="relative">
          <button
            onClick={() => setShowSignIn((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-medium bg-beam text-white hover:bg-beam/90 px-3.5 py-1.5 rounded-full transition-all shadow-sm shadow-beam/20"
          >
            <LogIn className="w-3.5 h-3.5" />
            Sign in with Google
          </button>
          {showSignIn && (
            <div className="absolute right-0 top-10 z-50 w-72">
              <SignInDialog onClose={() => setShowSignIn(false)} />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex items-center gap-3">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/70 border border-rule/60 text-xs">
        <div className="w-5 h-5 rounded-full bg-beam/10 text-beam flex items-center justify-center font-bold text-[10px]">
          {user?.displayName ? user.displayName[0].toUpperCase() : <UserIcon className="w-3 h-3" />}
        </div>
        <span className="font-medium max-w-[120px] truncate">{user?.displayName ?? user?.email ?? "Signed in"}</span>
      </div>

      <button
        onClick={handleSignOut}
        disabled={busy}
        title="Sign out"
        className="p-1.5 rounded-full text-muted hover:text-graphite hover:bg-white/80 transition-colors"
      >
        <LogOut className="w-4 h-4" />
      </button>

      {showDeleteConfirm ? (
        <div
          role="dialog"
          aria-label="Delete account"
          className="absolute right-0 top-12 z-50 w-80 border border-rule/80 rounded-card p-4 bg-white shadow-elevated space-y-3 animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-gap shrink-0 mt-0.5" />
            <p className="text-xs text-graphite/90 leading-relaxed">
              This permanently deletes your account and every saved run. Type{" "}
              <strong className="font-mono bg-paper px-1 py-0.5 rounded">{DELETE_CONFIRMATION_WORD}</strong> to confirm.
            </p>
          </div>
          <input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            aria-label={`Type ${DELETE_CONFIRMATION_WORD} to confirm`}
            className="w-full border border-rule rounded-chip px-3 py-1.5 text-xs font-mono focus:border-gap focus:outline-none"
            placeholder={DELETE_CONFIRMATION_WORD}
          />
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="px-3 py-1 text-xs text-muted hover:text-graphite"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteAccount}
              disabled={busy || confirmText !== DELETE_CONFIRMATION_WORD}
              className="bg-gap text-white rounded-chip px-3 py-1 text-xs font-medium disabled:opacity-40 hover:bg-gap/90 transition-colors"
            >
              Delete account
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowDeleteConfirm(true)}
          title="Delete account"
          className="p-1.5 rounded-full text-muted hover:text-gap hover:bg-gap/10 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

