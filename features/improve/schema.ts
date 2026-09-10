import { z } from "zod";

/**
 * Some providers return `before`/`after` as something other than a plain string
 * — an array of strings (a skill list), an array of `{ text }` objects (bullet
 * rewrites), or null. Coerce any of those to a single string rather than
 * failing validation.
 */
function coerceText(v: unknown): string {
  if (typeof v === "string") return v;
  if (v == null) return "";
  if (Array.isArray(v)) return v.map(coerceText).filter(Boolean).join("; ");
  if (typeof v === "object") {
    const o = v as Record<string, unknown>;
    if (typeof o.text === "string") return o.text;
    if (typeof o.value === "string") return o.value;
    return JSON.stringify(v);
  }
  return String(v);
}

const changeText = () => z.unknown().transform(coerceText);

export const ChangeSchema = z.object({
  id: z.string(),
  path: z.string(),
  kind: z.enum(["rewrite", "reorder", "add-skill", "remove", "tighten"]),
  before: changeText(),
  after: changeText(),
  reason: z.string(),
  linkedFindingId: z.string().nullable(),
  accepted: z.boolean(),
  /** Set by the deterministic fabrication post-check (§8), not the LLM. */
  unverified: z.boolean().default(false),
});

export type Change = z.infer<typeof ChangeSchema>;

/** What the LLM returns before the fabrication post-check runs. */
export const ImproveResultSchema = z.object({
  changes: z.array(ChangeSchema),
});

export type ImproveResult = z.infer<typeof ImproveResultSchema>;
