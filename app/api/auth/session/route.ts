import { cookies } from "next/headers";
import { getAdminAuth } from "@/lib/firebase/admin";
import { SESSION_COOKIE_NAME, SESSION_COOKIE_MAX_AGE_MS, getSession } from "@/lib/firebase/session";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json();
  const idToken: unknown = body.idToken;

  if (typeof idToken !== "string" || idToken.length === 0) {
    return Response.json({ error: { code: "UNAUTHENTICATED", message: "Missing ID token" } }, { status: 400 });
  }

  const adminAuth = getAdminAuth();

  try {
    await adminAuth.verifyIdToken(idToken);
  } catch {
    return Response.json(
      { error: { code: "UNAUTHENTICATED", message: "Invalid ID token" } },
      { status: 401 }
    );
  }

  const sessionCookie = await adminAuth.createSessionCookie(idToken, {
    expiresIn: SESSION_COOKIE_MAX_AGE_MS,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionCookie, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_COOKIE_MAX_AGE_MS / 1000,
  });

  return Response.json({ ok: true });
}

export async function DELETE() {
  const session = await getSession();

  if (session) {
    // Revoking refresh tokens invalidates every session for this uid, not
    // just this cookie — the actual sign-out, not just clearing local state.
    await getAdminAuth().revokeRefreshTokens(session.uid).catch(() => {});
  }

  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);

  return Response.json({ ok: true });
}
