import type { Resume } from "@/features/resume/schema";
import type { Change } from "./schema";

type PathSegment = { key: string; index: number | null };

/** Parses "experience[0].bullets[2].text" into segments. */
function parsePath(path: string): PathSegment[] {
  return path.split(".").map((part) => {
    const match = /^([a-zA-Z]+)(?:\[(\d+)\])?$/.exec(part);
    if (!match) throw new Error(`Invalid path segment: ${part}`);
    return { key: match[1], index: match[2] !== undefined ? Number(match[2]) : null };
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveContainer(root: any, segments: PathSegment[]): { parent: any; last: PathSegment } {
  let node = root;
  for (let i = 0; i < segments.length - 1; i++) {
    const seg = segments[i];
    node = seg.index !== null ? node[seg.key][seg.index] : node[seg.key];
  }
  return { parent: node, last: segments[segments.length - 1] };
}

function setText(resume: Resume, path: string, text: string): void {
  const segments = parsePath(path);
  const { parent, last } = resolveContainer(resume, segments);
  const current = last.index !== null ? parent[last.key][last.index] : parent[last.key];
  if (typeof current !== "string") {
    throw new Error(`set-text path does not point to a string: ${path}`);
  }
  if (last.index !== null) {
    parent[last.key][last.index] = text;
  } else {
    parent[last.key] = text;
  }
}

function removeBullet(resume: Resume, path: string): void {
  // Only ever removes a single bullet, e.g. "experience[0].bullets[2].text".
  // A path that doesn't end in ".text" isn't pointing at a bullet leaf, and
  // blindly dropping the last segment would delete the wrong (containing)
  // entry instead — e.g. an entire experience or skill group.
  if (!path.endsWith(".text")) {
    throw new Error(`remove path does not target a bullet: ${path}`);
  }
  const segments = parsePath(path).slice(0, -1); // drop trailing ".text"
  const { parent, last } = resolveContainer(resume, segments);
  if (last.index === null) throw new Error(`Cannot remove non-indexed path: ${path}`);
  if (!Array.isArray(parent[last.key])) {
    throw new Error(`remove path is not inside an array: ${path}`);
  }
  parent[last.key].splice(last.index, 1);
}

function addSkill(resume: Resume, path: string, item: string): void {
  // path like "skills[0].items"
  const segments = parsePath(path);
  const { parent, last } = resolveContainer(resume, segments);
  const target = last.index !== null ? parent[last.key][last.index] : parent[last.key];
  if (!Array.isArray(target)) throw new Error(`add-skill path is not an array: ${path}`);
  if (!target.includes(item)) target.push(item);
}

function reorderBullets(resume: Resume, path: string, before: string, after: string): void {
  // path like "experience[0].bullets"; before/after are "position N"
  const fromMatch = /position (\d+)/.exec(before);
  const toMatch = /position (\d+)/.exec(after);
  if (!fromMatch || !toMatch) return;

  const segments = parsePath(path);
  const { parent, last } = resolveContainer(resume, segments);
  const list = last.index !== null ? parent[last.key][last.index] : parent[last.key];
  if (!Array.isArray(list)) return;

  const from = Number(fromMatch[1]);
  const to = Number(toMatch[1]);
  if (from < 0 || from >= list.length || to < 0 || to >= list.length) return;

  const [item] = list.splice(from, 1);
  list.splice(to, 0, item);
}

/**
 * Applies accepted `Change[]` to a Resume, producing a new Resume.
 * Rejected changes (accepted: false) are excluded entirely — the original
 * text at that path is left untouched. Pure: does not mutate its input.
 */
export function applyChanges(resume: Resume, changes: Change[]): Resume {
  const result: Resume = structuredClone(resume);

  for (const change of changes) {
    if (!change.accepted) continue;

    try {
      switch (change.kind) {
        case "rewrite":
        case "tighten":
          setText(result, change.path, change.after);
          break;
        case "remove":
          removeBullet(result, change.path);
          break;
        case "add-skill":
          addSkill(result, change.path, change.after);
          break;
        case "reorder":
          reorderBullets(result, change.path, change.before, change.after);
          break;
      }
    } catch (err) {
      // The LLM occasionally emits a change with a path/kind mismatch
      // (e.g. rewriting a non-text node). Skip it rather than corrupt
      // the resume or crash the review page.
      console.error(`Skipping malformed change ${change.id} (${change.path}):`, err);
    }
  }

  return result;
}
