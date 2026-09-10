import { ResumeSchema } from "@/features/resume/schema";
import { JobDescriptionSchema } from "@/features/job-description/schema";
import { AnalysisSchema } from "@/features/analysis/schema";
import { improve } from "@/features/improve/improve";
import { ndjsonStream, ndjsonResponse } from "@/lib/stream";
import { requireSession } from "@/lib/firebase/session";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    await requireSession();
  } catch {
    return Response.json(
      { error: { code: "UNAUTHENTICATED", message: "Sign-in required" } },
      { status: 401 }
    );
  }

  const body = await req.json();

  const resumeResult = ResumeSchema.safeParse(body.resume);
  const jdResult = JobDescriptionSchema.safeParse(body.jd);
  const analysisResult = AnalysisSchema.safeParse(body.analysis);

  if (!resumeResult.success || !jdResult.success || !analysisResult.success) {
    return Response.json(
      { error: { code: "LLM_MALFORMED", message: "Invalid resume, jd, or analysis payload" } },
      { status: 400 }
    );
  }

  const stream = ndjsonStream(async (emit) => {
    emit({ stage: "rewriting", progress: 0.2 });
    const changes = await improve(resumeResult.data, jdResult.data, analysisResult.data);
    emit({ stage: "verifying", progress: 0.8 });
    emit({ stage: "done", progress: 1, payload: { changes } });
  });

  return ndjsonResponse(stream);
}
