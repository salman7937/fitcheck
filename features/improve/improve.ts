import type { Resume } from "@/features/resume/schema";
import type { JobDescription } from "@/features/job-description/schema";
import type { Analysis } from "@/features/analysis/schema";
import { ImproveResultSchema, type Change } from "./schema";
import { callGeminiJson } from "@/lib/gemini/call";
import { IMPROVE_RESUME_SYSTEM_PROMPT } from "@/lib/gemini/prompts/improve-resume";
import { applyFabricationCheck } from "./fabrication-check";

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

  console.log(`[improve] model proposed ${result.changes.length} change(s)`);

  return applyFabricationCheck(resume, result.changes);
}
