import type { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import { getGeminiClient, GEMINI_MODEL } from "./client";
import { AppError } from "@/lib/errors";

let anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (anthropicClient) return anthropicClient;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not set");
  }
  anthropicClient = new Anthropic({ apiKey });
  return anthropicClient;
}

const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-5";

type Part =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } };

function stripFences(raw: string): string {
  return raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
}

function tryParseJson(raw: string): unknown {
  const cleaned = stripFences(raw);
  return JSON.parse(cleaned);
}

class RateLimitError extends Error {
  constructor(message: string, public retryAfterMs: number) {
    super(message);
    this.name = "RateLimitError";
  }
}

function parseRetryDelayMs(errText: string): number {
  const match = errText.match(/try again in ([\d.]+)s/i);
  const seconds = match ? parseFloat(match[1]) : 5;
  return Math.ceil(seconds * 1000) + 250;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface ProviderConfig {
  name: string;
  baseUrl: string;
  apiKey: string;
  model: string;
}

function getActiveProvider():
  | { type: "gemini" }
  | { type: "anthropic" }
  | { type: "openai-compatible"; config: ProviderConfig } {
  // Qwen is checked first so it wins even when an ANTHROPIC_API_KEY is present
  // in the OS environment (Next.js won't override an already-set process env
  // var with an empty value from .env.local).
  if (process.env.QWEN_API_KEY) {
    return {
      type: "openai-compatible",
      config: {
        name: "Qwen",
        baseUrl:
          process.env.QWEN_BASE_URL ||
          "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
        apiKey: process.env.QWEN_API_KEY,
        model: process.env.QWEN_MODEL || "qwen-plus",
      },
    };
  }

  if (process.env.ANTHROPIC_API_KEY) {
    return { type: "anthropic" };
  }

  if (process.env.DEEPSEEK_API_KEY) {
    return {
      type: "openai-compatible",
      config: {
        name: "DeepSeek",
        baseUrl: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com",
        apiKey: process.env.DEEPSEEK_API_KEY,
        model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
      },
    };
  }

  if (process.env.GROQ_API_KEY) {
    return {
      type: "openai-compatible",
      config: {
        name: "Groq",
        baseUrl: "https://api.groq.com/openai/v1",
        apiKey: process.env.GROQ_API_KEY,
        model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      },
    };
  }

  if (process.env.OPENROUTER_API_KEY) {
    return {
      type: "openai-compatible",
      config: {
        name: "OpenRouter",
        baseUrl: "https://openrouter.ai/api/v1",
        apiKey: process.env.OPENROUTER_API_KEY,
        model: process.env.OPENROUTER_MODEL || "deepseek/deepseek-chat",
      },
    };
  }

  if (process.env.OPENAI_API_KEY) {
    return {
      type: "openai-compatible",
      config: {
        name: "OpenAI",
        baseUrl: "https://api.openai.com/v1",
        apiKey: process.env.OPENAI_API_KEY,
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      },
    };
  }

  return { type: "gemini" };
}

async function callOpenAICompatible(
  config: ProviderConfig,
  systemPrompt: string,
  parts: Part[],
  extraInstruction: string | undefined,
  maxTokens: number
): Promise<string> {
  const contentParts: any[] = [];

  for (const part of parts) {
    if ("text" in part) {
      contentParts.push({ type: "text", text: part.text });
    } else if ("inlineData" in part) {
      if (part.inlineData.mimeType.startsWith("image/")) {
        contentParts.push({
          type: "image_url",
          image_url: {
            url: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`,
          },
        });
      } else {
        const textContent = Buffer.from(part.inlineData.data, "base64").toString(
          "utf-8"
        );
        contentParts.push({ type: "text", text: textContent });
      }
    }
  }

  if (extraInstruction) {
    contentParts.push({ type: "text", text: extraInstruction });
  }

  const isAllText = contentParts.every((p) => p.type === "text");
  const userContent = isAllText
    ? contentParts.map((p) => p.text).join("\n\n")
    : contentParts;

  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    if (response.status === 429) {
      throw new RateLimitError(
        `${config.name} API Error (429): ${errText}`,
        parseRetryDelayMs(errText)
      );
    }
    throw new Error(`${config.name} API Error (${response.status}): ${errText}`);
  }

  const json = await response.json();
  const text = json.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error(`Empty response from ${config.name}`);
  }
  return text;
}

async function callAnthropic(
  systemPrompt: string,
  parts: Part[],
  extraInstruction: string | undefined,
  maxTokens: number
): Promise<string> {
  const client = getAnthropicClient();

  const contentBlocks: Anthropic.ContentBlockParam[] = [];
  for (const part of parts) {
    if ("text" in part) {
      contentBlocks.push({ type: "text", text: part.text });
    } else if ("inlineData" in part) {
      if (part.inlineData.mimeType.startsWith("image/")) {
        contentBlocks.push({
          type: "image",
          source: {
            type: "base64",
            media_type: part.inlineData.mimeType as
              | "image/jpeg"
              | "image/png"
              | "image/gif"
              | "image/webp",
            data: part.inlineData.data,
          },
        });
      } else if (part.inlineData.mimeType === "application/pdf") {
        contentBlocks.push({
          type: "document",
          source: {
            type: "base64",
            media_type: "application/pdf",
            data: part.inlineData.data,
          },
        });
      } else {
        const textContent = Buffer.from(
          part.inlineData.data,
          "base64"
        ).toString("utf-8");
        contentBlocks.push({ type: "text", text: textContent });
      }
    }
  }

  if (extraInstruction) {
    contentBlocks.push({ type: "text", text: extraInstruction });
  }

  try {
    const response = await client.messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: maxTokens,
      system: `${systemPrompt}\n\nRespond with ONLY valid JSON matching the required schema. Do not include markdown code fences or any commentary.`,
      messages: [{ role: "user", content: contentBlocks }],
    });

    const textBlock = response.content.find(
      (block): block is Anthropic.TextBlock => block.type === "text"
    );
    const text = textBlock?.text;
    if (!text) {
      throw new Error("Empty response from Claude");
    }
    return text;
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) {
      const retryAfterHeader = err.headers?.get("retry-after");
      const retryAfterMs = retryAfterHeader
        ? Math.ceil(parseFloat(retryAfterHeader) * 1000) + 250
        : 5000;
      throw new RateLimitError(
        `Claude API Error (429): ${err.message}`,
        retryAfterMs
      );
    }
    throw err;
  }
}

/**
 * Calls the configured AI Provider (Claude, DeepSeek, Groq, OpenRouter, OpenAI, or Gemini)
 * with a prompt (+ optional file part), parses the response as JSON, and validates
 * it against `schema`.
 */
export async function callGeminiJson<T>(params: {
  schema: z.ZodType<T>;
  systemPrompt: string;
  parts: Part[];
  maxTokens?: number;
}): Promise<T> {
  const { schema, systemPrompt, parts, maxTokens = 4096 } = params;
  const provider = getActiveProvider();

  const attempt = async (extraInstruction?: string): Promise<T> => {
    let raw: string;

    if (provider.type === "openai-compatible") {
      raw = await callOpenAICompatible(
        provider.config,
        systemPrompt,
        parts,
        extraInstruction,
        maxTokens
      );
    } else if (provider.type === "anthropic") {
      raw = await callAnthropic(systemPrompt, parts, extraInstruction, maxTokens);
    } else {
      const client = getGeminiClient();
      const contents = extraInstruction
        ? [...parts, { text: extraInstruction }]
        : parts;

      const response = await client.models.generateContent({
        model: GEMINI_MODEL,
        contents: [{ role: "user", parts: contents }],
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
        },
      });

      raw = response.text || "";
      if (!raw) {
        throw new Error("Empty response from Gemini");
      }
    }

    let parsed: unknown;
    try {
      parsed = tryParseJson(raw);
    } catch (err) {
      throw new Error(`Invalid JSON from model: ${(err as Error).message}`);
    }

    const result = schema.safeParse(parsed);
    if (!result.success) {
      throw new Error(`Schema validation failed: ${result.error.message}`);
    }

    return result.data;
  };

  const attemptWithRateLimitRetry = async (
    extraInstruction?: string,
    rateLimitRetriesLeft = 2
  ): Promise<T> => {
    try {
      return await attempt(extraInstruction);
    } catch (err) {
      if (err instanceof RateLimitError && rateLimitRetriesLeft > 0) {
        await sleep(err.retryAfterMs);
        return attemptWithRateLimitRetry(extraInstruction, rateLimitRetriesLeft - 1);
      }
      throw err;
    }
  };

  try {
    return await attemptWithRateLimitRetry();
  } catch (firstError) {
    try {
      const retryInstruction = `Your previous response was invalid: ${
        (firstError as Error).message
      }. Return ONLY valid JSON matching the required schema, with no markdown fences or commentary.`;
      return await attemptWithRateLimitRetry(retryInstruction);
    } catch (secondError) {
      throw new AppError(
        "LLM_MALFORMED",
        `AI response failed validation twice: ${
          (secondError as Error).message
        }`
      );
    }
  }
}
