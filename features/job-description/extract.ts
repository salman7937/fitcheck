import { JobDescriptionSchema, type JobDescription } from "./schema";
import { callGeminiJson } from "@/lib/gemini/call";
import { EXTRACT_JD_SYSTEM_PROMPT } from "@/lib/gemini/prompts/extract-jd";
import { AppError } from "@/lib/errors";

const MIN_JD_LENGTH = 40;

export async function extractJobDescription(
  jdText: string
): Promise<JobDescription> {
  if (jdText.trim().length < MIN_JD_LENGTH) {
    throw new AppError("JD_TOO_SHORT");
  }

  return callGeminiJson<JobDescription>({
    schema: JobDescriptionSchema,
    systemPrompt: EXTRACT_JD_SYSTEM_PROMPT,
    parts: [{ text: jdText }],
  });
}
