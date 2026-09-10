"use client";

import { useState } from "react";
import { signInWithGoogle } from "../sign-in";

export function SignInDialog({ onClose }: { onClose: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-label="Sign in"
      className="border border-rule rounded-card p-4 bg-white shadow-card space-y-3 mt-2"
    >
      <button
        onClick={handleSignIn}
        disabled={loading}
        className="bg-beam text-white rounded-card px-4 py-2 text-sm transition-colors duration-150 hover:opacity-90 disabled:opacity-50"
      >
        Sign in with Google
      </button>
      <p className="text-xs text-muted">
        Signing in saves your runs and raises your daily limit from 2 analyses to 10.
        Anonymous runs are deleted after 30 days if you don&apos;t.
      </p>
      <p className="text-xs">
        <a href="/account/delete" className="underline text-muted">
          Delete your data
        </a>
      </p>
      {error && (
        <p role="alert" className="text-gap text-xs">
          {error}
        </p>
      )}
      <button onClick={onClose} className="text-xs text-muted underline">
        Not now
      </button>
    </div>
  );
}
