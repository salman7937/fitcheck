import { z } from "zod";
import { ResumeSchema } from "@/features/resume/schema";
import { AnalysisSchema } from "@/features/analysis/schema";
import { ChangeSchema } from "@/features/improve/schema";

export const RunSchema = z.object({
  id: z.string(),
  createdAt: z.number(), // epoch millis
  jobTitle: z.string(),
  company: z.string().nullish(),
  score: z.number(),
  subscores: AnalysisSchema.shape.subscores,
  resume: ResumeSchema,
  analysis: AnalysisSchema,
  changes: z.array(ChangeSchema),
});

export type Run = z.infer<typeof RunSchema>;

/** Findings are the largest field on a run; truncate rather than split a run across documents (§6.4). */
export const MAX_FINDINGS_PERSISTED = 30;
