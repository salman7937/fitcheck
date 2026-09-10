import { z } from "zod";

/**
 * Some providers (esp. non-Gemini ones via OpenRouter) return null for a
 * required string when the source CV genuinely has nothing there (e.g. a
 * freelance role with no "company"), instead of an empty string. Treat
 * null the same as missing rather than failing validation.
 */
const requiredString = () => z.string().nullable().transform((v) => v ?? "");

export const BulletSchema = z.object({
  id: z.string(),
  text: z.string().max(320),
});

export const ResumeSchema = z.object({
  basics: z.object({
    name: z.string(),
    title: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    location: z.string().optional(),
    links: z.array(z.object({ label: z.string(), url: z.string() })),
  }),
  summary: z.string().max(600).optional(),
  experience: z.array(
    z.object({
      id: z.string(),
      company: requiredString(),
      role: requiredString(),
      location: z.string().optional(),
      start: z.string(),
      end: z.string().nullable(),
      bullets: z.array(BulletSchema),
    })
  ),
  projects: z.array(
    z.object({
      id: z.string(),
      name: requiredString(),
      url: z.string().optional(),
      tech: z.array(z.string()),
      bullets: z.array(BulletSchema),
    })
  ),
  skills: z.array(
    z.object({
      category: requiredString(),
      items: z.array(z.string()),
    })
  ),
  education: z.array(
    z.object({
      id: z.string(),
      institution: requiredString(),
      degree: requiredString(),
      year: z.string().optional(),
    })
  ),
  certifications: z.array(
    z.object({
      id: z.string(),
      name: requiredString(),
      issuer: z.string().optional(),
      year: z.string().optional(),
    })
  ),
});

export type Bullet = z.infer<typeof BulletSchema>;
export type Resume = z.infer<typeof ResumeSchema>;
