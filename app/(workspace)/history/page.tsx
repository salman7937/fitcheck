import { redirect } from "next/navigation";
import { getSession } from "@/lib/firebase/session";
import { listRuns } from "@/features/history/repository";
import { RunList } from "@/features/history/components/run-list";

export default async function HistoryPage() {
  // The real boundary — middleware's cookie-presence check is UX only.
  const session = await getSession();
  if (!session) redirect("/");

  const runs = await listRuns(session.uid);

  return (
    <main className="max-w-3xl mx-auto px-6 py-12 space-y-6">
      <h1 className="font-display text-4xl">History</h1>
      <RunList runs={runs} />
    </main>
  );
}
