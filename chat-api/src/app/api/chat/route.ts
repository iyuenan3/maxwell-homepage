import { checkRateLimit } from "@/lib/rate-limit";
import { buildSystemPrompt } from "./system-prompt";
import { createEmbedClient } from "@/lib/embed-client";
import { retrieve, formatContext } from "@/lib/rag";
import { logChat } from "@/lib/chat-logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ── embed client 单例（避免每次请求 new） ───────────────
let _embedClient: ReturnType<typeof createEmbedClient> | null = null;
function getEmbedClient() {
  if (_embedClient) return _embedClient;
  _embedClient = createEmbedClient({
    baseUrl: process.env.CHAT_LLM_BASE_URL!,
    apiKey: process.env.CHAT_LLM_API_KEY!,
    model: "doubao-embedding-vision",
  });
  return _embedClient;
}

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
    if (content.length > 8000) return null;  // 单条上限 8000 字符（体验优先，仍防超长 DoS）
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

// ── 求职 / 面试 / 第三方公司情报硬拦截 (P0 隐私边界) ───────
// 化身访客可能是潜在雇主 / 客户，泄露面试内容代价巨大。LLM prompt 防御 +
// RAG 路径排除 + server-side prefilter 三层防护，此处是 server-side prefilter。
const JOB_INTERVIEW_PATTERNS = [
  /面试/,
  /面经/,
  /面试官/,
  /面试题/,
  /面试录音/,
  /求职/,
  /找工作/,
  /应聘/,
  /招聘/,
  /投简历/,
  /投了几家/,
  /在面/,
  /跳槽/,
  /HR\s*面/i,
  /CEO\s*面/i,
  /终面/,
  /一面|二面|三面/,
  /谈薪/,
  /薪资期望/,
  /期望薪资/,
  /当前薪资/,
  /\bOffer\b/i,
  /BOSS\s*直聘/i,
  /招呼语/,
];

const REJECT_JOB_INTERVIEW_MSG =
  "求职 / 面试这块不方便公开聊，具体合作或岗位机会可以邮件 limaxwell93@gmail.com 直接联系 Maxwell。";

function detectJobInterview(content: string): boolean {
  return JOB_INTERVIEW_PATTERNS.some((p) => p.test(content));
}

// ── 雇主机密硬拦截 (P0 隐私边界) ───────────────────────────
// 当前雇主内部平台项目：访客=潜在雇主/同行，不能被问出当前雇主的产品/项目。
// 回复中立不确认不否认（连"在职"都不暴露）。
// ⚠️ 敏感词绝不入公开仓：从 gitignore 的 .env.local 读 EMPLOYER_CONFIDENTIAL_TERMS。
const EMPLOYER_PATTERNS = (process.env.EMPLOYER_CONFIDENTIAL_TERMS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean)
  .map((t) => new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));

const REJECT_EMPLOYER_MSG =
  "这块不方便公开聊。想了解 Maxwell 的公开项目和技术背景，可以直接问我，或邮件 limaxwell93@gmail.com 联系本人。";

function detectEmployer(content: string): boolean {
  return EMPLOYER_PATTERNS.length > 0 && EMPLOYER_PATTERNS.some((p) => p.test(content));
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
  const userAgent = req.headers.get("user-agent") || "";
  const startTime = Date.now();

  // ── 三层限流 ─────────────────────────────────────────
  // 1. per-IP 20 req / minute
  if (!checkRateLimit(`chat:1m:${ip}`, 20, 60 * 1000)) {
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

  // ── 截断历史：只留最后 20 条（约 10 轮 user+assistant） ─
  // 防 client 灌假 history
  let messages = messagesRaw.slice(-20);
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
    // 拦截也记日志
    logChat({
      ts: new Date().toISOString(),
      ip,
      user_agent: userAgent,
      msg_count: messages.length,
      user: lastUserMsg,
      assistant: REJECT_INJECTION_MSG,
      model: "blocked",
      input_tokens: 0,
      output_tokens: 0,
      total_tokens: 0,
      rag_hits: [],
      duration_ms: Date.now() - startTime,
      blocked: "injection",
    });
    return makeStaticReply(REJECT_INJECTION_MSG, cors);
  }

  // ── 求职 / 面试硬拦截（P0 隐私边界） ────────────────
  if (detectJobInterview(lastUserMsg)) {
    console.log(`[chat] blocked job_interview from ${ip}: ${lastUserMsg.slice(0, 100)}`);
    logChat({
      ts: new Date().toISOString(),
      ip,
      user_agent: userAgent,
      msg_count: messages.length,
      user: lastUserMsg,
      assistant: REJECT_JOB_INTERVIEW_MSG,
      model: "blocked",
      input_tokens: 0,
      output_tokens: 0,
      total_tokens: 0,
      rag_hits: [],
      duration_ms: Date.now() - startTime,
      blocked: "job_interview",
    });
    return makeStaticReply(REJECT_JOB_INTERVIEW_MSG, cors);
  }

  // ── 雇主机密硬拦截（P0 隐私边界） ────────────────
  if (detectEmployer(lastUserMsg)) {
    console.log(`[chat] blocked employer from ${ip}: ${lastUserMsg.slice(0, 100)}`);
    logChat({
      ts: new Date().toISOString(),
      ip,
      user_agent: userAgent,
      msg_count: messages.length,
      user: lastUserMsg,
      assistant: REJECT_EMPLOYER_MSG,
      model: "blocked",
      input_tokens: 0,
      output_tokens: 0,
      total_tokens: 0,
      rag_hits: [],
      duration_ms: Date.now() - startTime,
      blocked: "employer",
    });
    return makeStaticReply(REJECT_EMPLOYER_MSG, cors);
  }

  // env check
  const apiBase = process.env.CHAT_LLM_BASE_URL;
  const apiKey = process.env.CHAT_LLM_API_KEY;
  const model = process.env.CHAT_LLM_MODEL;
  if (!apiBase || !apiKey || !model) {
    console.error("[chat] missing env: CHAT_LLM_BASE_URL / CHAT_LLM_API_KEY / CHAT_LLM_MODEL");
    return new Response(JSON.stringify({ error: "server_misconfigured" }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  // ── RAG 检索（失败时降级为空 context，不中断 chat） ──
  let contextBlock = "";
  let ragHits: string[] = [];
  try {
    const embedClient = getEmbedClient();
    const queryText = lastUserMsg; // 体验优先：完整 query embed
    const t0 = Date.now();
    const results = await retrieve(embedClient, queryText, {
      topK: 12,           // 5/12 v2.3：20→12（TTFT 优化，朋友反馈太慢）
      perCategoryMax: 4,  // 5/12 v2.3：8→4，配合 perSourceMax=2（rag.ts 默认）解决同文件 chunk 刷屏 bug
    });
    contextBlock = formatContext(results);
    ragHits = results.slice(0, 10).map((r) => r.chunk.source || "?");
    console.log(
      `[chat] RAG ${results.length} chunks in ${Date.now() - t0}ms (top=${results[0]?.score.toFixed(3) ?? "?"}, cats=${results.map((r) => r.chunk.category || "?").join("/")})`,
    );
  } catch (e) {
    console.error("[chat] RAG failed, fallback to empty context:", e);
  }

  const systemPrompt = buildSystemPrompt(contextBlock);

  // Ark stream call (OpenAI-compatible)
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
      max_tokens: 2000,  // 体验优先：放宽（pro 版套餐 token 充足）
      thinking: { type: "disabled" },  // 关闭推理输出：TTFT 更快 + 省 token（当前 DeepSeek Flash 兼容）
      messages: [
        { role: "system", content: systemPrompt },
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
      let lastUsage: { input_tokens: number; output_tokens: number; total_tokens: number; cached_tokens?: number; model?: string } | null = null;
      let acc = "";  // 累积完整 assistant 回复供日志记录
      let firstChunkTime: number | null = null;  // LLM 第一个 delta 到达时间，用于 TTFT

      const writeLog = (extra?: { blocked?: string }) => {
        logChat({
          ts: new Date().toISOString(),
          ip,
          user_agent: userAgent,
          msg_count: messages.length,
          user: lastUserMsg,
          assistant: acc,
          model: lastUsage?.model || model,
          input_tokens: lastUsage?.input_tokens || 0,
          output_tokens: lastUsage?.output_tokens || 0,
          total_tokens: lastUsage?.total_tokens || 0,
          rag_hits: ragHits,
          duration_ms: Date.now() - startTime,
          ttft_ms: firstChunkTime ? firstChunkTime - startTime : undefined,
          cached_tokens: lastUsage?.cached_tokens,
          ...(extra || {}),
        });
      };

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
              writeLog();
              return;
            }

            try {
              const json = JSON.parse(data);
              const delta = json?.choices?.[0]?.delta?.content;
              if (typeof delta === "string" && delta.length > 0) {
                if (firstChunkTime === null) firstChunkTime = Date.now();
                acc += delta;
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta })}\n\n`));
              }
              // doubao SSE 末段（include_usage 启用后）有 usage
              if (json?.usage && typeof json.usage.prompt_tokens === "number") {
                // 兼容多种 cache 字段路径（OpenAI 新版 / 旧版 / 火山自定义）
                const cached =
                  json.usage.prompt_tokens_details?.cached_tokens ??
                  json.usage.cached_tokens ??
                  json.usage.prompt_cache_hit_tokens ??
                  undefined;
                console.log(`[chat] usage:`, JSON.stringify(json.usage));  // debug 一次看真实字段
                lastUsage = {
                  input_tokens: json.usage.prompt_tokens,
                  output_tokens: json.usage.completion_tokens || 0,
                  total_tokens: json.usage.total_tokens || 0,
                  cached_tokens: typeof cached === "number" ? cached : undefined,
                  model,
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
        writeLog();
      } catch (err) {
        console.error("[chat] stream error:", err);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: "stream_error" })}\n\n`));
        controller.close();
        writeLog({ blocked: "stream_error" });
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
