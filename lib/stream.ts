export type ProgressFrame =
  | { stage: string; progress: number }
  | { stage: "done"; progress: 1; payload: unknown }
  | { stage: "error"; progress: 1; error: { code: string; message: string } };

/**
 * Builds a ReadableStream of newline-delimited JSON progress frames.
 * `producer` receives an `emit` function to push frames and must
 * eventually emit a "done" (or "error") frame and return.
 */
export function ndjsonStream(
  producer: (emit: (frame: ProgressFrame) => void) => Promise<void>
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      const emit = (frame: ProgressFrame) => {
        controller.enqueue(encoder.encode(JSON.stringify(frame) + "\n"));
      };

      try {
        await producer(emit);
      } catch (err) {
        emit({
          stage: "error",
          progress: 1,
          error: {
            code: (err as { code?: string })?.code ?? "UNKNOWN",
            message: (err as Error)?.message ?? "Unknown error",
          },
        });
      } finally {
        controller.close();
      }
    },
  });
}

export function ndjsonResponse(stream: ReadableStream<Uint8Array>): Response {
  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}

/** Client-side helper: reads an NDJSON response and yields parsed frames. */
export async function* readNdjson(
  body: ReadableStream<Uint8Array>
): AsyncGenerator<ProgressFrame> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (line.trim() === "") continue;
      yield JSON.parse(line) as ProgressFrame;
    }
  }

  if (buffer.trim() !== "") {
    yield JSON.parse(buffer) as ProgressFrame;
  }
}
