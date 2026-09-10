import { z } from "zod";

export const JobDescriptionSchema = z.object({
  title: z.string(),
  // Some providers return null (not an empty string) when the JD names no company.
  company: z.string().nullish().transform((v) => v ?? undefined),
  seniority: z.enum(["intern", "junior", "mid", "senior", "lead", "unknown"]),
  yearsRequired: z.number().nullable(),
  hardSkills: z.array(
    z.object({
      term: z.string(),
      aliases: z.array(z.string()),
      required: z.boolean(),
    })
  ),
  softSkills: z.array(z.string()),
  responsibilities: z.array(z.string()),
});

export type JobDescription = z.infer<typeof JobDescriptionSchema>;
export type HardSkill = JobDescription["hardSkills"][number];
