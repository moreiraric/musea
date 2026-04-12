// Streaming chat API for the artwork reflection panel.
// It loads the system prompt, trims history, and relays Perplexity responses as SSE.

import { NextRequest } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";

const SYSTEM_PROMPT_PATH = path.join(process.cwd(), "system_prompt.txt");
const MAX_HISTORY_TOKENS = 1500;

type ChatMessage = {
  role: "assistant" | "user" | "system";
  content: string;
};

// Validates chat roles coming from the client payload.
function isChatRole(value: unknown): value is ChatMessage["role"] {
  return value === "assistant" || value === "user" || value === "system";
}

// Parses the incoming chat history into a safe message array.
function parseChatMessages(value: unknown): ChatMessage[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((message) => {
    if (
      message &&
      typeof message === "object" &&
      isChatRole((message as { role?: unknown }).role) &&
      typeof (message as { content?: unknown }).content === "string"
    ) {
      return [
        {
          role: (message as { role: ChatMessage["role"] }).role,
          content: (message as { content: string }).content,
        },
      ];
    }

    return [];
  });
}

// Uses a rough character-based estimate to keep prompt history bounded.
function approximateTokens(text: string) {
  return Math.ceil(text.length / 4);
}

// Keeps the newest messages that fit within the token budget.
function trimMessagesToTokenLimit(messages: ChatMessage[], maxTokens: number) {
  let totalTokens = 0;
  const trimmed: ChatMessage[] = [];
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const message = messages[i];
    const tokenCount = approximateTokens(message.content);
    if (totalTokens + tokenCount > maxTokens && trimmed.length > 0) {
      break;
    }
    totalTokens += tokenCount;
    trimmed.push(message);
  }
  return trimmed.reverse();
}

// Reads the prompt template from disk and falls back to an empty prompt on failure.
async function readSystemPrompt() {
  try {
    return await fs.readFile(SYSTEM_PROMPT_PATH, "utf8");
  } catch {
    return "";
  }
}

// Streams an assistant response for the artwork reflection chat UI.
export async function POST(request: NextRequest) {
  const body = await request.json();
  const messages = parseChatMessages(body?.messages);
  const artworkTitle =
    typeof body?.artworkTitle === "string" ? body.artworkTitle : "";
  const artworkName =
    typeof body?.artworkName === "string" ? body.artworkName : "";
  const artistName =
    typeof body?.artistName === "string" ? body.artistName : "";
  const systemPrompt = await readSystemPrompt();

  const apiKey = process.env.PPLX_API_KEY;
  const apiBaseUrl = process.env.PERPLEXITY_API_URL || "https://api.perplexity.ai";
  const model = process.env.PERPLEXITY_MODEL || "sonar";

  if (!apiKey) {
    return new Response("Missing PPLX_API_KEY", { status: 500 });
  }

  const trimmedMessages = trimMessagesToTokenLimit(messages, MAX_HISTORY_TOKENS);
  // Replace prompt placeholders with the current artwork and artist names.
  const resolvedPrompt = systemPrompt
    .replace(/{{\s*artwork_title\s*}}/gi, artworkTitle)
    .replace(/{{\s*sertwork_title\s*}}/gi, artworkTitle)
    .replace(/{{\s*artwork_name\s*}}/gi, artworkName || artistName)
    .replace(/{{\s*artist_name\s*}}/gi, artistName || artworkName);

  const systemMessages: ChatMessage[] = resolvedPrompt
    ? [{ role: "system", content: resolvedPrompt }]
    : [];
  const payloadMessages: ChatMessage[] = [...systemMessages, ...trimmedMessages];

  const perplexityResponse = await fetch(`${apiBaseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify({
      model,
      stream: true,
      messages: payloadMessages,
    }),
  });

  if (!perplexityResponse.ok || !perplexityResponse.body) {
    const errorText = await perplexityResponse.text();
    return new Response(errorText || "Perplexity request failed", {
      status: perplexityResponse.status || 500,
    });
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const contentType = perplexityResponse.headers.get("content-type") ?? "";

  // Some providers fall back to JSON instead of SSE, so normalize that into the same stream shape.
  if (!contentType.includes("text/event-stream")) {
    const data = await perplexityResponse.json();
    const errorMessage = data?.error?.message ?? data?.message ?? "";
    const content = data?.choices?.[0]?.message?.content ?? "";
    const stream = new ReadableStream({
      start(controller) {
        if (errorMessage) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: errorMessage })}\n\n`),
          );
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
          return;
        }
        if (content) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ delta: content })}\n\n`),
          );
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const reader = perplexityResponse.body!.getReader();
      let buffer = "";

      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) {
            break;
          }
          buffer += decoder.decode(value, { stream: true });
          buffer = buffer.replace(/\r\n/g, "\n");
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data:")) {
              continue;
            }
          const payload = line.replace("data:", "").trim();
          if (!payload) {
            continue;
          }
            if (payload === "[DONE]") {
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();
              return;
            }
            try {
              const parsed = JSON.parse(payload);
              const delta =
                parsed?.choices?.[0]?.delta?.content ??
                parsed?.choices?.[0]?.message?.content ??
                parsed?.choices?.[0]?.text ??
                "";
              if (delta) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ delta })}\n\n`),
                );
              }
            } catch {
              // ignore malformed chunk
            }
          }
        }
        if (buffer.trim()) {
          const payload = buffer.replace("data:", "").trim();
          if (payload && payload !== "[DONE]") {
            try {
              const parsed = JSON.parse(payload);
              const delta =
                parsed?.choices?.[0]?.delta?.content ??
                parsed?.choices?.[0]?.message?.content ??
                parsed?.choices?.[0]?.text ??
                "";
              if (delta) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ delta })}\n\n`),
                );
              }
            } catch {
              // ignore trailing payload errors
            }
          }
        }
      } catch (error) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              error: error instanceof Error ? error.message : "Stream error",
            })}\n\n`,
          ),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
