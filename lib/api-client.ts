import { readNdjson, type ProgressFrame } from "@/lib/stream";

async function streamRequest<T>(
  input: RequestInfo,
  init: RequestInit,
  onProgress?: (frame: ProgressFrame) => void
): Promise<T> {
  const res = await fetch(input, init);

  if (!res.ok || !res.body) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error?.message ?? `Request failed: ${res.status}`);
  }

  let payload: T | null = null;

  for await (const frame of readNdjson(res.body)) {
    onProgress?.(frame);

    if ("error" in frame) {
      throw new Error(frame.error.message);
    }
    if ("payload" in frame) {
      payload = frame.payload as T;
    }
  }

  if (payload === null) {
    throw new Error("Stream ended without a result");
  }

  return payload;
}

export function parseResumeRequest<T>(
  file: File,
  onProgress?: (frame: ProgressFrame) => void
): Promise<T> {
  const formData = new FormData();
  formData.append("file", file);
  return streamRequest<T>("/api/parse", { method: "POST", body: formData }, onProgress);
}

export function analyzeRequest<T>(
  resume: unknown,
  jdText: string,
  onProgress?: (frame: ProgressFrame) => void
): Promise<T> {
  return streamRequest<T>(
    "/api/analyze",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resume, jdText }),
    },
    onProgress
  );
}

export async function exportPdfRequest(params: {
  resume: unknown;
  jdTitle: string;
  jd?: unknown;
  analysis?: unknown;
  changes?: unknown;
}): Promise<void> {
  const res = await fetch("/api/export", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error?.message ?? `Export failed: ${res.status}`);
  }

  const disposition = res.headers.get("Content-Disposition") ?? "";
  const filenameMatch = /filename="([^"]+)"/.exec(disposition);
  const filename = filenameMatch?.[1] ?? "resume.pdf";

  const bytes = await res.arrayBuffer();
  if (bytes.byteLength === 0) {
    throw new Error("Export returned an empty file. Please try again.");
  }
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  // Chrome aborts the download if the anchor is removed or the object URL is
  // revoked synchronously after click(); defer both.
  setTimeout(() => {
    a.remove();
    URL.revokeObjectURL(url);
  }, 30_000);
}

export function improveRequest<T>(
  resume: unknown,
  jd: unknown,
  analysis: unknown,
  onProgress?: (frame: ProgressFrame) => void
): Promise<T> {
  return streamRequest<T>(
    "/api/improve",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resume, jd, analysis }),
    },
    onProgress
  );
}
