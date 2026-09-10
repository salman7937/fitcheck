import type { Run } from "@/features/history/schema";
import { RunCard } from "./run-card";

export function RunList({ runs }: { runs: Run[] }) {
  if (runs.length === 0) {
    return <p className="text-muted">No runs yet. Analyze a CV to see it here.</p>;
  }

  return (
    <ul className="space-y-3">
      {runs.map((run) => (
        <RunCard key={run.id} run={run} />
      ))}
    </ul>
  );
}
