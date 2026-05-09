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
    if (content.length > 2000) return null;  // 单条上限 2000 字符（更严，防灌注）
    out.push({ role, content });
  }
  if (out.length === 0 || out.length > 20) return null;
  if (out[out.length - 1].role !== "user") return null;
  return out;
}

// ── Prompt injection 黑名单 ─────────────────────────────
// 只挡明显恶意，跨领域题让 LLM 自己 redirect（system prompt 已强化）
const INJECTION_PATTERNS = [
  /ignore\s+(previous|above|the\s+above)\s+(instruction|rule|prompt)/i,
  /\bsystem\s*prompt\b/i,
  /(you\s+are\s+now|act\s+as|pretend\s+to\s+be)\s+(?!Maxwell)/i,
  /\bDAN\b/,
  /\bjailbreak\b/i,
  /忽略.*(上面|前面|之前).*(规则|指令|提示|prompt)/,
  /你的\s*(system\s*)?prompt/i,
  /扮演(?!Maxwell)|装作|假装(?!Maxwell)/,
  /角色扮演/,
  /重复(以下|下面)/,
];

const REJECT_INJECTION_MSG = "我只能聊 Maxwell 相关的话题。";

function detectInjection(content: string): boolean {
  return INJECTION_PATTERNS.some((p) => p.test(content));
}

// ── 用 SSE 流式返回固定文案（不打 LLM） ────────────────
function makeStaticReply(text: string, cors: Record<string, string>) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta: text })}\n\n`));
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ meta: { input_tokens: 0, output_tokens: 0, blocked: true } })}\n\n`),
      );
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });
  return new Response(stream, {
    headers: {
      ...cors,
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

// ── POST /api/chat ──────────────────────────────────────
export async function POST(req: Request) {
  const origin = req.headers.get("origin");
  const cors = corsHeaders(origin);
  const ip = getClientIP(req);

  // ── 三层限流 ─────────────────────────────────────────
  // 1. per-IP 10 req / minute
  if (!checkRateLimit(`chat:1m:${ip}`, 10, 60 * 1000)) {
    return new Response(JSON.stringify({ error: "rate_limited", retry_after: 60 }), {
      status: 429,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
  // 2. per-IP 100 req / day
  if (!checkRateLimit(`chat:1d:${ip}`, 100, 24 * 3600 * 1000)) {
    return new Response(JSON.stringify({ error: "rate_limited_daily", retry_after: 86400 }), {
      status: 429,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
  // 3. global 5000 req / day
  if (!checkRateLimit(`chat:global:1d`, 5000, 24 * 3600 * 1000)) {
    return new Response(JSON.stringify({ error: "service_busy" }), {
      status: 503,
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
  const messagesRaw = sanitizeMessages((body as { messages?: unknown })?.messages);
  if (!messagesRaw) {
    return new Response(JSON.stringify({ error: "invalid_messages" }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  // ── 截断历史：只留最后 12 条（约 6 轮 user+assistant） ─
  // 防 client 灌假 history
  let messages = messagesRaw.slice(-12);
  // 截断后保证最后一条是 user
  while (messages.length > 0 && messages[messages.length - 1].role !== "user") {
    messages.pop();
  }
  if (messages.length === 0) {
    return new Response(JSON.stringify({ error: "invalid_messages" }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  // ── Prompt injection 预过滤（只看最新 user 消息） ───
  const lastUserMsg = messages[messages.length - 1].content;
  if (detectInjection(lastUserMsg)) {
    console.log(`[chat] blocked injection from ${ip}: ${lastUserMsg.slice(0, 100)}`);
    return makeStaticReply(REJECT_INJECTION_MSG, cors);
  }

  // env check
  const apiBase = process.env.VOLCANO_API_BASE;
  const apiKey = process.env.VOLCANO_API_KEY;
  const model = process.env.VOLCANO_MODEL;
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
      stream_options: { include_usage: true },  // 让最后一个 chunk 带 usage（OpenAI 兼容）
      temperature: 0.7,
      max_tokens: 300,
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

  // ── SSE 转发 + parse usage from any chunk ──────────────
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const reader = upstream.body.getReader();

  const stream = new ReadableStream({
    async start(controller) {
      let buffer = "";
      let lastUsage: { input_tokens: number; output_tokens: number; total_tokens: number } | null = null;

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const rawLine of lines) {
            const line = rawLine.trim();
            if (!line.startsWith("data:")) continue;
            const data = line.slice(5).trim();
            if (!data) continue;

            if (data === "[DONE]") {
              if (lastUsage) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ meta: lastUsage })}\n\n`));
              }
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
              // doubao SSE 末段（include_usage 启用后）有 usage
              if (json?.usage && typeof json.usage.prompt_tokens === "number") {
                lastUsage = {
                  input_tokens: json.usage.prompt_tokens,
                  output_tokens: json.usage.completion_tokens || 0,
                  total_tokens: json.usage.total_tokens || 0,
                };
              }
            } catch {
              // 忽略 parse 失败的行
            }
          }
        }
        if (lastUsage) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ meta: lastUsage })}\n\n`));
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
      "X-Accel-Buffering": "no",
    },
  });
}
