import { ResumeSchema } from "@/features/resume/schema";
import { JobDescriptionSchema } from "@/features/job-description/schema";
import { AnalysisSchema } from "@/features/analysis/schema";
import { ChangeSchema } from "@/features/improve/schema";
import { renderResumePdf, exportFilename } from "@/features/export/render";
import { requireSession } from "@/lib/firebase/session";
import { saveRun } from "@/features/history/repository";

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

  const rawBody = await req.text();
  let body: any;
  try {
    body = JSON.parse(rawBody);
  } catch (err) {
    // The request body arrives here with a trailing NUL byte (and occasionally
    // other trailing junk) on some Windows/dev-server setups. Trim anything
    // after the last closing brace/bracket and retry.
    try {
      const end = Math.max(rawBody.lastIndexOf("}"), rawBody.lastIndexOf("]"));
      body = JSON.parse(rawBody.slice(0, end + 1));
    } catch {
      console.error(
        `Export body parse failed (${rawBody.length} bytes):`,
        (err as Error).message,
        "…tail:",
        JSON.stringify(rawBody.slice(-120))
      );
      return Response.json(
        { error: { code: "BAD_REQUEST", message: "Malformed request body" } },
        { status: 400 }
      );
    }
  }

  const resumeResult = ResumeSchema.safeParse(body.resume);
  if (!resumeResult.success) {
    return Response.json(
      { error: { code: "LLM_MALFORMED", message: "Invalid resume payload" } },
      { status: 400 }
    );
  }

  const jdTitle: string = typeof body.jdTitle === "string" ? body.jdTitle : "resume";

  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await renderResumePdf(resumeResult.data);
  } catch (err) {
    console.error("PDF render failed:", err);
    return Response.json(
      { error: { code: "PDF_RENDER_FAILED", message: "Failed to render PDF" } },
      { status: 500 }
    );
  }
  const filename = exportFilename(resumeResult.data, jdTitle);

  // Persisting the run is what makes it survive reload (§6.4/§7). Downloading
  // the PDF is the "run complete" moment in the user flow, so that's where
  // this is triggered. Best-effort: a Firestore hiccup must never break the
  // PDF the user is actively downloading.
  const jdResult = JobDescriptionSchema.safeParse(body.jd);
  const analysisResult = AnalysisSchema.safeParse(body.analysis);
  const changesResult = ChangeSchema.array().safeParse(body.changes ?? []);

  if (jdResult.success && analysisResult.success && changesResult.success) {
    saveRun({
      uid: session.uid,
      isAnonymous: session.isAnonymous,
      resume: resumeResult.data,
      jd: jdResult.data,
      analysis: analysisResult.data,
      changes: changesResult.data,
    })
      .then((id) => console.log("[history] saved run", id, "for", session.uid))
      .catch((err) => {
        console.error("Failed to save run to history:", err);
      });
  } else {
    console.warn("[history] run NOT saved — payload failed validation:", {
      jd: jdResult.success ? "ok" : jdResult.error.issues,
      analysis: analysisResult.success ? "ok" : analysisResult.error.issues,
      changes: changesResult.success ? "ok" : changesResult.error.issues,
    });
  }

  // Next's dev server on Windows intermittently drops a one-shot binary body
  // (`new Response(uint8array)`), delivering 200 with zero bytes. Streaming the
  // buffer and declaring Content-Length makes the response reliable.
  const bytes = new Uint8Array(pdfBuffer);
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(bytes);
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(bytes.byteLength),
      "Cache-Control": "no-store",
    },
  });
}
