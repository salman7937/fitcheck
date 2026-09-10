import { z } from "zod";

export const AnalysisSchema = z.object({
  score: z.number().min(0).max(100),
  subscores: z.object({
    keywordCoverage: z.number(),
    experienceMatch: z.number(),
    atsSafety: z.number(),
    impactQuality: z.number(),
  }),
  keywords: z.object({
    matched: z.array(z.object({ term: z.string(), foundIn: z.array(z.string()) })),
    missing: z.array(z.object({ term: z.string(), required: z.boolean() })),
  }),
  findings: z.array(
    z.object({
      id: z.string(),
      severity: z.enum(["critical", "warning", "polish"]),
      section: z.string(),
      target: z.string().nullable(),
      title: z.string(),
      detail: z.string(),
      fixable: z.boolean(),
    })
  ),
  verdict: z.string().max(400),
});

export type Analysis = z.infer<typeof AnalysisSchema>;
export type Finding = Analysis["findings"][number];
