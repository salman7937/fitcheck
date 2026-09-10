import type { Resume } from "@/features/resume/schema";
import type { JobDescription } from "@/features/job-description/schema";
import type { Analysis } from "@/features/analysis/schema";
import { ImproveResultSchema, type Change } from "./schema";
import { callGeminiJson } from "@/lib/gemini/call";
import { IMPROVE_RESUME_SYSTEM_PROMPT } from "@/lib/gemini/prompts/improve-resume";
import { applyFabricationCheck } from "./fabrication-check";
import { applyChanges } from "./apply-changes";

/** Looks like a serialized object/array rather than prose. */
function isStructureDump(text: string): boolean {
  const t = text.trimStart();
  return t.startsWith("{") || t.startsWith("[");
}

/**
 * Weaker models sometimes emit a "change" whose path points at a whole array
 * (e.g. `skills`) with the entire structure JSON-stringified into before/after,
 * or a path that doesn't resolve to an editable leaf at all. Those render as
 * unreadable JSON in the review diff and can't be applied — drop them, keeping
 * only changes that actually transform the resume.
 */
function sanitizeChanges(resume: Resume, changes: Change[]): Change[] {
  const baseline = JSON.stringify(resume);

  return changes.filter((change) => {
    if (isStructureDump(change.before) || isStructureDump(change.after)) {
      return false;
    }
    if (change.kind === "reorder") return true; // hard to dry-run; trust it
    const applied = JSON.stringify(applyChanges(resume, [{ ...change, accepted: true }]));
    return applied !== baseline; // dropped if the change was a no-op / unapplicable
  });
}

/**
 * Gemini proposes Change[] for the resume against this JD/analysis, then the
 * deterministic fabrication post-check (§8) runs over every change before
 * returning — flagged changes come back forced to accepted:false.
 */
export async function improve(
  resume: Resume,
  jd: JobDescription,
  analysis: Analysis
): Promise<Change[]> {
  const result = await callGeminiJson<{ changes: Change[] }>({
    schema: ImproveResultSchema,
    systemPrompt: IMPROVE_RESUME_SYSTEM_PROMPT,
    parts: [
      {
        text: JSON.stringify({
          resume,
          jd,
          findings: analysis.findings,
        }),
      },
    ],
    maxTokens: 8192,
  });

  const changes = sanitizeChanges(resume, result.changes);
  console.log(
    `[improve] model proposed ${result.changes.length} change(s), ${changes.length} usable`
  );

  return applyFabricationCheck(resume, changes);
}
