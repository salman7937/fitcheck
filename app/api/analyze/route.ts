import { ResumeSchema } from "@/features/resume/schema";
import { extractJobDescription } from "@/features/job-description/extract";
import { analyze } from "@/features/analysis/analyze";
import { ndjsonStream, ndjsonResponse } from "@/lib/stream";
import { requireSession } from "@/lib/firebase/session";
import { checkAnalyzeRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let session;
  try {
    session = await requireSession();
  } catch {
    return Response.json(
      { error: { code: "UNAUTHENTICATED", message: "Sign-in required" } },
      { status: 401 }
    );
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rateLimit = await checkAnalyzeRateLimit(session.uid, session.isAnonymous, ip);
  if (!rateLimit.success) {
    return Response.json(
      {
        error: {
          code: "RATE_LIMITED",
          message: `You've used your ${rateLimit.limit} analyses for today. Resets at midnight UTC.`,
        },
      },
      { status: 429 }
    );
  }

  const body = await req.json();

  const resumeResult = ResumeSchema.safeParse(body.resume);
  if (!resumeResult.success) {
    return Response.json(
      { error: { code: "LLM_MALFORMED", message: "Invalid resume payload" } },
      { status: 400 }
    );
  }

  const jdText: unknown = body.jdText;
  if (typeof jdText !== "string" || jdText.trim().length < 40) {
    return Response.json(
      { error: { code: "JD_TOO_SHORT", message: "Job description is too short" } },
      { status: 400 }
    );
  }

  const stream = ndjsonStream(async (emit) => {
    emit({ stage: "extracting-jd", progress: 0.05 });
    const jd = await extractJobDescription(jdText);

    const analysis = await analyze(resumeResult.data, jd, (p) =>
      emit({ stage: p.stage, progress: p.progress })
    );

    emit({ stage: "done", progress: 1, payload: { analysis, jd } });
  });

  return ndjsonResponse(stream);
}
