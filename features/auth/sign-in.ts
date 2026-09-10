import { GoogleAuthProvider, linkWithPopup, signInWithPopup } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { syncSession } from "./sync-session";

/**
 * Links Google onto the existing anonymous uid so the uid — and everything
 * already saved under it — is preserved (§6.1). If that Google account
 * already exists under a different uid (`auth/credential-already-in-use`),
 * signs into it directly and copies the anonymous session's runs across
 * instead of losing them. This is the one migration path the spec calls
 * out as "not rare" — it's exercised on every returning user who signs in
 * with Google from a fresh anonymous session on a new device/browser.
 */
export async function signInWithGoogle(): Promise<void> {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error("Firebase is not configured");

  const provider = new GoogleAuthProvider();
  const currentUser = auth.currentUser;

  if (!currentUser?.isAnonymous) {
    const credential = await signInWithPopup(auth, provider);
    await syncSession(credential.user);
    return;
  }

  const anonymousIdToken = await currentUser.getIdToken();

  try {
    const credential = await linkWithPopup(currentUser, provider);
    await syncSession(credential.user);
  } catch (err) {
    if (!(err instanceof FirebaseError) || err.code !== "auth/credential-already-in-use") {
      throw err;
    }

    const credential = await signInWithPopup(auth, provider);
    await syncSession(credential.user);

    await fetch("/api/auth/migrate-runs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ anonymousIdToken }),
    });
  }
}
