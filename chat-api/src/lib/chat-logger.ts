/**
 * Chat 对话日志记录器
 *
 * 设计：每个 IP 一个 JSONL 文件，append-only。
 *   - 文件路径：~/chat-api-logs/<ip-sanitized>.jsonl
 *   - 每行一条 JSON 对话记录
 *   - 写入失败不阻塞 chat 响应（吃掉错误）
 *
 * 查询：SSH 到服务器后用 grep / jq 分析。
 *   ssh alicloud-sg 'cat ~/chat-api-logs/192.168.1.1.jsonl | jq .'
 *   ssh alicloud-sg 'find ~/chat-api-logs -name "*.jsonl" | wc -l'  # 总访客数
 */

import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const LOG_DIR = path.join(os.homedir(), "chat-api-logs");

let _dirReady = false;
function ensureDir() {
  if (_dirReady) return;
  try {
    fs.mkdirSync(LOG_DIR, { recursive: true });
    _dirReady = true;
  } catch (e) {
    console.error("[chat-logger] mkdir failed:", e);
  }
}

/** IPv6 ':' / 'unknown' / IPv4 '.' 等字符兼容文件名 */
function sanitizeIp(ip: string): string {
  return ip.replace(/[^0-9a-zA-Z._-]/g, "_");
}

export interface ChatLogEntry {
  /** ISO 8601 时间戳 */
  ts: string;
  /** 访客原始 IP（不 hash） */
  ip: string;
  /** 浏览器 user-agent */
  user_agent: string;
  /** 这一轮交互时 messages 数组长度（含本次 user） */
  msg_count: number;
  /** 本轮用户输入 */
  user: string;
  /** AI 完整回复（accumulated SSE deltas） */
  assistant: string;
  /** LLM 模型名 */
  model: string;
  /** token 用量 */
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  /** RAG 命中的 source 列表（截前 10 个） */
  rag_hits: string[];
  /** SSE 总响应耗时 ms（从请求到 stream 结束） */
  duration_ms: number;
  /** Time-to-first-token：从请求到 LLM 第一个 delta 的延迟 ms（含 RAG embedding + 检索 + LLM 首 token），未拿到首 token 时缺省 */
  ttft_ms?: number;
  /** 火山方舟 prefix cache 命中的 token 数（usage.prompt_tokens_details.cached_tokens）— 验证 prompt cache 是否生效 */
  cached_tokens?: number;
  /** 拦截原因（injection / rate_limit / upstream_error 等），正常对话不写 */
  blocked?: string;
}

export async function logChat(entry: ChatLogEntry): Promise<void> {
  try {
    ensureDir();
    const filename = `${sanitizeIp(entry.ip)}.jsonl`;
    const filepath = path.join(LOG_DIR, filename);
    const line = JSON.stringify(entry) + "\n";
    await fs.promises.appendFile(filepath, line, "utf8");
  } catch (e) {
    console.error("[chat-logger] write failed:", e);
    // 吃掉错误，不阻塞 chat 响应
  }
}
