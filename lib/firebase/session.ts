import "server-only";
import { cookies } from "next/headers";
import { getAdminAuth } from "./admin";
import { AppError } from "@/lib/errors";
import { SESSION_COOKIE_NAME } from "./cookie-name";

export { SESSION_COOKIE_NAME };
export const SESSION_COOKIE_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

export type Session = {
  uid: string;
  isAnonymous: boolean;
};

export async function getSession(): Promise<Session | null> {
  const cookie = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (!cookie) return null;

  try {
    const decoded = await getAdminAuth().verifySessionCookie(cookie, true);
    return {
      uid: decoded.uid,
      isAnonymous: decoded.firebase.sign_in_provider === "anonymous",
    };
  } catch {
    return null;
  }
}

export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) throw new AppError("UNAUTHENTICATED");
  return session;
}
