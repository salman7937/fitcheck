import { parseResume } from "@/features/resume/parse";
import { ndjsonStream, ndjsonResponse } from "@/lib/stream";
import { requireSession } from "@/lib/firebase/session";

export const runtime = "nodejs";

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5MB
const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const ALLOWED_MIME_TYPES = new Set(["application/pdf", DOCX_MIME]);

export async function POST(req: Request) {
  try {
    await requireSession();
  } catch {
    return Response.json(
      { error: { code: "UNAUTHENTICATED", message: "Sign-in required" } },
      { status: 401 }
    );
  }

  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return Response.json({ error: { code: "FILE_TOO_LARGE", message: "No file provided" } }, { status: 400 });
  }

  if (file.size > MAX_FILE_BYTES) {
    return Response.json(
      { error: { code: "FILE_TOO_LARGE", message: "File exceeds 5 MB" } },
      { status: 413 }
    );
  }

  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return Response.json(
      { error: { code: "SCANNED_PDF", message: "Unsupported file type" } },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const stream = ndjsonStream(async (emit) => {
    emit({ stage: "extracting", progress: 0.2 });
    const resume = await parseResume(buffer, file.type);
    emit({ stage: "structuring", progress: 0.7 });
    emit({ stage: "done", progress: 1, payload: resume });
  });

  return ndjsonResponse(stream);
}
