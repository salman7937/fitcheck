import type { User } from "firebase/auth";

/** Posts the current ID token to the server so the httpOnly cookie stays in sync. */
export async function syncSession(user: User): Promise<void> {
  const idToken = await user.getIdToken();
  await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
}

export async function clearSession(): Promise<void> {
  await fetch("/api/auth/session", { method: "DELETE" });
}
