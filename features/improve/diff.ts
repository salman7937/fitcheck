import type { Resume, Bullet } from "@/features/resume/schema";
import type { Change } from "./schema";

let counter = 0;
function changeId(): string {
  counter += 1;
  return `diff-${counter}`;
}

function baseChange(partial: Omit<Change, "id" | "linkedFindingId" | "accepted" | "unverified">): Change {
  return {
    id: changeId(),
    linkedFindingId: null,
    accepted: true,
    unverified: false,
    ...partial,
  };
}

/**
 * Diffs one entity's bullets (by stable id) between `before` and `after`,
 * producing rewrite/reorder/remove changes. Pure — no LLM, no I/O.
 */
function diffBullets(pathPrefix: string, before: Bullet[], after: Bullet[]): Change[] {
  const changes: Change[] = [];

  const beforeIndexById = new Map(before.map((b, i) => [b.id, i]));
  const afterIndexById = new Map(after.map((b, i) => [b.id, i]));

  const commonIds = before
    .map((b) => b.id)
    .filter((id) => afterIndexById.has(id));

  for (const id of commonIds) {
    const beforeIdx = beforeIndexById.get(id)!;
    const afterIdx = afterIndexById.get(id)!;
    const beforeBullet = before[beforeIdx];
    const afterBullet = after[afterIdx];

    if (beforeBullet.text !== afterBullet.text) {
      changes.push(
        baseChange({
          path: `${pathPrefix}.bullets[${beforeIdx}].text`,
          kind: "rewrite",
          before: beforeBullet.text,
          after: afterBullet.text,
          reason: "Bullet text changed",
        })
      );
    } else if (beforeIdx !== afterIdx) {
      changes.push(
        baseChange({
          path: `${pathPrefix}.bullets`,
          kind: "reorder",
          before: `position ${beforeIdx}`,
          after: `position ${afterIdx}`,
          reason: "Bullet order changed",
        })
      );
    }
  }

  for (const [id, idx] of beforeIndexById) {
    if (!afterIndexById.has(id)) {
      changes.push(
        baseChange({
          path: `${pathPrefix}.bullets[${idx}].text`,
          kind: "remove",
          before: before[idx].text,
          after: "",
          reason: "Bullet removed",
        })
      );
    }
  }

  return changes;
}

/**
 * Diffs two full Resume objects into a Change[]. Used to verify the
 * improve LLM's own output and to distinguish reorders from rewrites.
 */
export function diff(before: Resume, after: Resume): Change[] {
  const changes: Change[] = [];

  if (before.summary !== after.summary) {
    changes.push(
      baseChange({
        path: "summary",
        kind: "rewrite",
        before: before.summary ?? "",
        after: after.summary ?? "",
        reason: "Summary changed",
      })
    );
  }

  const beforeExpById = new Map(before.experience.map((e, i) => [e.id, i]));
  const afterExpById = new Map(after.experience.map((e, i) => [e.id, i]));

  for (const [id, beforeIdx] of beforeExpById) {
    const afterIdx = afterExpById.get(id);
    if (afterIdx === undefined) continue;

    changes.push(
      ...diffBullets(
        `experience[${beforeIdx}]`,
        before.experience[beforeIdx].bullets,
        after.experience[afterIdx].bullets
      )
    );
  }

  return changes;
}
