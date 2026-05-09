import { checkRateLimit } from "@/lib/rate-limit";
import { SYSTEM_PROMPT } from "./system-prompt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ── CORS ────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  "https://maxwellii.com",
  "https://www.maxwellii.com",
  "http://localhost:4567",
  "http://localhost:8080",
  "http://127.0.0.1:4567",
];

function corsHeaders(origin: string | null): Record<string, string> {
  const allow = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

export async function OPTIONS(req: Request) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(req.headers.get("origin")),
  });
}

// ── helpers ─────────────────────────────────────────────
type ChatMsg = { role: "user" | "assistant"; content: string };

function getClientIP(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

function sanitizeMessages(raw: unknown): ChatMsg[] | null {
  if (!Array.isArray(raw)) return null;
  const out: ChatMsg[] = [];
  for (const m of raw) {
    if (!m || typeof m !== "object") return null;
    const role = (m as { role?: string }).role;
    const content = (m as { content?: string }).content;
    if ((role !== "user" && role !== "assistant") || typeof content !== "string") return null;
    if (content.length > 4000) return null;  // 单条上限 4k 字符
    out.push({ role, content });
  }
  if (out.length === 0 || out.length > 20) return null;  // 历史最多 20 轮
  if (out[out.length - 1].role !== "user") return null;  // 最后一条必须是用户
  return out;
}

// ── POST /api/chat ──────────────────────────────────────
export async function POST(req: Request) {
  const origin = req.headers.get("origin");
  const cors = corsHeaders(origin);
  const ip = getClientIP(req);

  // rate limit: 20 requests per minute per IP
  // (复用 shared 包的 in-memory checkRateLimit,默认 60s 窗口)
  if (!checkRateLimit(`chat:${ip}`, 20)) {
    return new Response(JSON.stringify({ error: "rate_limited", retry_after: 60 }), {
      status: 429,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  // parse body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid_json" }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
  const messages = sanitizeMessages((body as { messages?: unknown })?.messages);
  if (!messages) {
    return new Response(JSON.stringify({ error: "invalid_messages" }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  // env check
  const apiBase = process.env.VOLCANO_API_BASE;
  const apiKey  = process.env.VOLCANO_API_KEY;
  const model   = process.env.VOLCANO_MODEL;
  if (!apiBase || !apiKey || !model) {
    console.error("[chat] missing env: VOLCANO_API_BASE / VOLCANO_API_KEY / VOLCANO_MODEL");
    return new Response(JSON.stringify({ error: "server_misconfigured" }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  // Volcano Ark stream call
  const upstream = await fetch(`${apiBase}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      stream: true,
      temperature: 0.7,
      max_tokens: 800,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages,
      ],
    }),
  });

  if (!upstream.ok || !upstream.body) {
    const errText = await upstream.text().catch(() => "");
    console.error(`[chat] upstream ${upstream.status}: ${errText.slice(0, 300)}`);
    return new Response(JSON.stringify({ error: "upstream_error", status: upstream.status }), {
      status: 502,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  // SSE 转发：把火山的 chunked SSE 解析后，重新发出更精简的 {delta}/[DONE] 给前端
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const reader = upstream.body.getReader();

  const stream = new ReadableStream({
    async start(controller) {
      let buffer = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          // 按行分割，留尾部不完整的行到 buffer
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const rawLine of lines) {
            const line = rawLine.trim();
            if (!line.startsWith("data:")) continue;
            const data = line.slice(5).trim();
            if (!data) continue;
            if (data === "[DONE]") {
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();
              return;
            }
            try {
              const json = JSON.parse(data);
              const delta = json?.choices?.[0]?.delta?.content;
              if (typeof delta === "string" && delta.length > 0) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta })}\n\n`));
              }
            } catch {
              // 忽略 parse 失败的行
            }
          }
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (err) {
        console.error("[chat] stream error:", err);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: "stream_error" })}\n\n`));
        controller.close();
      }
    },
    cancel() {
      reader.cancel().catch(() => {});
    },
  });

  return new Response(stream, {
    headers: {
      ...cors,
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",  // 防止 nginx buffer
    },
  });
}
