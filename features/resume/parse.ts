import mammoth from "mammoth";
import { ResumeSchema, type Resume } from "./schema";
import { callGeminiJson } from "@/lib/gemini/call";
import { PARSE_RESUME_SYSTEM_PROMPT } from "@/lib/gemini/prompts/parse-resume";

const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

/**
 * Native PDF input only works with Gemini and Claude. Every OpenAI-compatible
 * provider (Qwen, DeepSeek, Groq, OpenRouter, OpenAI) is text-only here, and
 * would otherwise be handed raw PDF bytes decoded as UTF-8 garbage.
 */
function providerAcceptsNativePdf(): boolean {
  if (process.env.QWEN_API_KEY) return false;
  if (process.env.ANTHROPIC_API_KEY) return true;
  const hasOpenAICompatible =
    process.env.DEEPSEEK_API_KEY ||
    process.env.GROQ_API_KEY ||
    process.env.OPENROUTER_API_KEY ||
    process.env.OPENAI_API_KEY;
  return !hasOpenAICompatible; // falls through to Gemini
}

async function extractPdfText(file: Buffer): Promise<string> {
  const { extractText, getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(new Uint8Array(file));
  const { text } = await extractText(pdf, { mergePages: true });
  return text;
}

/**
 * Parses an uploaded CV file into a validated `Resume` object.
 *
 * PDFs (and images) go to Gemini as native binary input.
 * DOCX is not accepted by Gemini's file input, so it is converted to
 * plain text with mammoth first and sent as a text part instead.
 */
export async function parseResume(
  file: Buffer,
  mimeType: string
): Promise<Resume> {
  let parts;
  if (mimeType === DOCX_MIME) {
    parts = [{ text: await extractDocxText(file) }];
  } else if (mimeType === "application/pdf" && !providerAcceptsNativePdf()) {
    parts = [{ text: await extractPdfText(file) }];
  } else {
    parts = [{ inlineData: { mimeType, data: file.toString("base64") } }];
  }

  return callGeminiJson<Resume>({
    schema: ResumeSchema,
    systemPrompt: PARSE_RESUME_SYSTEM_PROMPT,
    parts,
    maxTokens: 6000,
  });
}

async function extractDocxText(file: Buffer): Promise<string> {
  const { value } = await mammoth.extractRawText({ buffer: file });
  return value;
}
