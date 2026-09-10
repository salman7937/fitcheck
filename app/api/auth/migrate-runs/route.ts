import { getAdminAuth } from "@/lib/firebase/admin";
import { requireSession } from "@/lib/firebase/session";
import { migrateRuns } from "@/features/history/repository";

export const runtime = "nodejs";

/**
 * Called after `auth/credential-already-in-use` (§6.1). The target uid comes
 * from the caller's own verified session cookie. The source uid is never
 * trusted as a raw client-supplied value — it's derived by verifying the
 * anonymous user's own ID token server-side, so this can only copy runs the
 * caller can actually prove they owned a moment ago, not an arbitrary uid.
 */
export async function POST(req: Request) {
  const session = await requireSession();

  const body = await req.json();
  const anonymousIdToken: unknown = body.anonymousIdToken;
  if (typeof anonymousIdToken !== "string" || anonymousIdToken.length === 0) {
    return Response.json(
      { error: { code: "UNAUTHENTICATED", message: "Missing anonymous ID token" } },
      { status: 400 }
    );
  }

  let fromUid: string;
  try {
    const decoded = await getAdminAuth().verifyIdToken(anonymousIdToken);
    fromUid = decoded.uid;
  } catch {
    return Response.json(
      { error: { code: "UNAUTHENTICATED", message: "Invalid anonymous ID token" } },
      { status: 401 }
    );
  }

  const migratedCount = await migrateRuns(fromUid, session.uid);
  return Response.json({ migratedCount });
}
