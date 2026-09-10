import { cookies } from "next/headers";
import { getAdminAuth } from "@/lib/firebase/admin";
import { requireSession } from "@/lib/firebase/session";
import { SESSION_COOKIE_NAME } from "@/lib/firebase/cookie-name";
import { deleteAllUserData } from "@/features/history/repository";

export const runtime = "nodejs";

/**
 * Deletes the auth record, the user document, and the entire `runs`
 * subcollection together (§11.9b) — the difference between a product and
 * a data-collection exercise. The UI gates this behind a typed-word
 * confirmation, not a checkbox.
 */
export async function DELETE() {
  const session = await requireSession();

  await deleteAllUserData(session.uid);
  await getAdminAuth().deleteUser(session.uid);

  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);

  return Response.json({ ok: true });
}
