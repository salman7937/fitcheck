import {
  GoogleAuthProvider,
  linkWithPopup,
  linkWithRedirect,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  type Auth,
} from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { syncSession } from "./sync-session";

/**
 * Popup sign-in is blocked by default in many browsers (and always inside
 * embedded webviews). When that happens we fall back to a full-page redirect,
 * whose result is picked up on the next load by `completeRedirectSignIn()`.
 */
const POPUP_FALLBACK_CODES = new Set([
  "auth/popup-blocked",
  "auth/popup-closed-by-user",
  "auth/cancelled-popup-request",
  "auth/operation-not-supported-in-this-environment",
  "auth/web-storage-unsupported",
]);

const PENDING_ANON_TOKEN_KEY = "fitcheck.pendingAnonToken";

function isPopupFallback(err: unknown): boolean {
  return err instanceof FirebaseError && POPUP_FALLBACK_CODES.has(err.code);
}

/**
 * Links Google onto the existing anonymous uid so the uid — and everything
 * already saved under it — is preserved (§6.1). If that Google account
 * already exists under a different uid (`auth/credential-already-in-use`),
 * signs into it directly and copies the anonymous session's runs across
 * instead of losing them.
 */
export async function signInWithGoogle(): Promise<void> {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error("Firebase is not configured");

  const provider = new GoogleAuthProvider();
  const currentUser = auth.currentUser;

  if (!currentUser?.isAnonymous) {
    try {
      const credential = await signInWithPopup(auth, provider);
      await syncSession(credential.user);
    } catch (err) {
      if (!isPopupFallback(err)) throw err;
      await signInWithRedirect(auth, provider);
    }
    return;
  }

  const anonymousIdToken = await currentUser.getIdToken();

  try {
    const credential = await linkWithPopup(currentUser, provider);
    await syncSession(credential.user);
  } catch (err) {
    if (isPopupFallback(err)) {
      sessionStorage.setItem(PENDING_ANON_TOKEN_KEY, anonymousIdToken);
      await linkWithRedirect(currentUser, provider);
      return;
    }

    if (!(err instanceof FirebaseError) || err.code !== "auth/credential-already-in-use") {
      throw err;
    }

    try {
      const credential = await signInWithPopup(auth, provider);
      await syncSession(credential.user);
      await migrateRuns(anonymousIdToken);
    } catch (popupErr) {
      if (!isPopupFallback(popupErr)) throw popupErr;
      sessionStorage.setItem(PENDING_ANON_TOKEN_KEY, anonymousIdToken);
      await signInWithRedirect(auth, provider);
    }
  }
}

async function migrateRuns(anonymousIdToken: string): Promise<void> {
  await fetch("/api/auth/migrate-runs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ anonymousIdToken }),
  });
}

/**
 * Run once on app load: if the user just came back from a redirect sign-in,
 * finish syncing the server session (and migrate anonymous runs when the
 * Google account turned out to already exist).
 */
export async function completeRedirectSignIn(auth: Auth): Promise<void> {
  const pendingAnonToken = sessionStorage.getItem(PENDING_ANON_TOKEN_KEY);

  let result;
  try {
    result = await getRedirectResult(auth);
  } catch (err) {
    // linkWithRedirect fails here when the Google account already exists.
    if (err instanceof FirebaseError && err.code === "auth/credential-already-in-use") {
      await signInWithRedirect(auth, new GoogleAuthProvider());
      return;
    }
    throw err;
  }

  if (!result) return;

  sessionStorage.removeItem(PENDING_ANON_TOKEN_KEY);
  await syncSession(result.user);
  if (pendingAnonToken && !result.user.isAnonymous) {
    await migrateRuns(pendingAnonToken);
  }
}
