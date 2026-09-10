import { z } from "zod";
import type { Resume, Bullet } from "@/features/resume/schema";
import { callGeminiJson } from "@/lib/gemini/call";
import { JUDGE_IMPACT_SYSTEM_PROMPT } from "@/lib/gemini/prompts/judge-impact";

const RatingsSchema = z.array(
  z.object({ id: z.string(), rating: z.number().int().min(0).max(2) })
);

const HAS_NUMBER = /\d/;

/** Deterministic pre-pass: does the bullet contain a number? Pure, no LLM. */
export function hasQuantifier(bullet: Bullet): boolean {
  return HAS_NUMBER.test(bullet.text);
}

function allBullets(resume: Resume): Bullet[] {
  return [
    ...resume.experience.flatMap((e) => e.bullets),
    ...resume.projects.flatMap((p) => p.bullets),
  ];
}

/**
 * LLM-judged, constrained: a regex pre-pass scores the quantitative half
 * (does the bullet contain a number), Gemini judges only the qualitative
 * half (outcome vs. duty, 0-2). The two halves are averaged per bullet.
 */
export async function impactQuality(resume: Resume): Promise<number> {
  const bullets = allBullets(resume);
  if (bullets.length === 0) return 100;

  const ratings = await callGeminiJson<z.infer<typeof RatingsSchema>>({
    schema: RatingsSchema,
    systemPrompt: JUDGE_IMPACT_SYSTEM_PROMPT,
    parts: [
      { text: JSON.stringify(bullets.map((b) => ({ id: b.id, text: b.text }))) },
    ],
  });

  const ratingById = new Map(ratings.map((r) => [r.id, r.rating]));

  let total = 0;
  for (const bullet of bullets) {
    const quantScore = hasQuantifier(bullet) ? 100 : 0;
    const rating = ratingById.get(bullet.id) ?? 0;
    const qualScore = (rating / 2) * 100;
    total += quantScore * 0.5 + qualScore * 0.5;
  }

  return Math.round(total / bullets.length);
}
