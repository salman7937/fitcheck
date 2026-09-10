"use client";

import { useEffect, useState } from "react";
import { onIdTokenChanged, signInAnonymously, type User } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { syncSession } from "./sync-session";
import { completeRedirectSignIn } from "./sign-in";

export type AuthState = {
  user: User | null;
  isAnonymous: boolean;
  /** True once auth has resolved (or been determined unavailable) — render a neutral placeholder until then, never "Sign in". */
  resolved: boolean;
};

/**
 * Client hook driving the whole session lifecycle: creates an anonymous
 * session silently on first load if none exists, and keeps the server
 * cookie in sync via onIdTokenChanged — not onAuthStateChanged, since this
 * also needs to fire on the hourly token refresh.
 */
export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [resolved, setResolved] = useState(false);
  // Firebase mutates the same User instance in place when an anonymous account
  // is linked to Google, so setUser(nextUser) is a no-op reference-wise and the
  // UI stays on "Sign in" until a reload. Bump a nonce on every token change to
  // force the re-render.
  const [, setNonce] = useState(0);

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) {
      // No Firebase project configured yet — resolve to a signed-out state
      // rather than leaving the UI stuck on a placeholder forever.
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot terminal state, no cascade
      setResolved(true);
      return;
    }

    // If the user just returned from a redirect sign-in, finish it before
    // the token listener below reacts to the new user.
    completeRedirectSignIn(auth).catch((err) =>
      console.error("Redirect sign-in completion failed:", err)
    );

    const unsubscribe = onIdTokenChanged(auth, async (nextUser) => {
      if (!nextUser) {
        try {
          await signInAnonymously(auth);
        } catch (err) {
          console.error("Firebase Anonymous Auth Error:", err);
          setResolved(true);
        }
        return; // onIdTokenChanged fires again once the anonymous user resolves
      }

      await syncSession(nextUser);
      setUser(nextUser);
      setResolved(true);
      setNonce((n) => n + 1);
    });

    return unsubscribe;
  }, []);

  return {
    user,
    isAnonymous: user?.isAnonymous ?? true,
    resolved,
  };
}
