/**
 * Chat 日志读取器 — 列出 IP 摘要 / 读单个 IP 全量
 *
 * 数据源：~/chat-api-logs/<ip>.jsonl（chat-logger.ts 写入）
 */

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import type { ChatLogEntry } from "./chat-logger";

const LOG_DIR = path.join(os.homedir(), "chat-api-logs");

export interface IpSummary {
  ip: string;
  filename: string;
  entry_count: number;
  first_ts: string;
  last_ts: string;
  blocked_count: number;
  total_tokens: number;
}

function safeParseLine(line: string): ChatLogEntry | null {
  try {
    return JSON.parse(line) as ChatLogEntry;
  } catch {
    return null;
  }
}

function readEntriesSync(filepath: string): ChatLogEntry[] {
  let content: string;
  try {
    content = fs.readFileSync(filepath, "utf8");
  } catch {
    return [];
  }
  return content
    .split("\n")
    .filter((l) => l.trim())
    .map(safeParseLine)
    .filter((e): e is ChatLogEntry => e !== null);
}

/** 列出所有 IP 摘要，按 last_ts 倒序 */
export function listIps(): IpSummary[] {
  let files: string[];
  try {
    files = fs.readdirSync(LOG_DIR).filter((f) => f.endsWith(".jsonl"));
  } catch {
    return [];
  }

  const summaries: IpSummary[] = [];
  for (const filename of files) {
    const filepath = path.join(LOG_DIR, filename);
    const entries = readEntriesSync(filepath);
    if (entries.length === 0) continue;

    const ts = entries.map((e) => e.ts).sort();
    summaries.push({
      ip: entries[0].ip,
      filename,
      entry_count: entries.length,
      first_ts: ts[0],
      last_ts: ts[ts.length - 1],
      blocked_count: entries.filter((e) => e.blocked).length,
      total_tokens: entries.reduce((s, e) => s + (e.total_tokens || 0), 0),
    });
  }
  summaries.sort((a, b) => b.last_ts.localeCompare(a.last_ts));
  return summaries;
}

/** 读某个 IP 的全部对话，按 ts 倒序（最新的在上） */
export function readLogsByIp(ip: string): ChatLogEntry[] {
  // 与 chat-logger 的 sanitize 规则一致
  const sanitized = ip.replace(/[^0-9a-zA-Z._-]/g, "_");
  const filepath = path.join(LOG_DIR, `${sanitized}.jsonl`);
  const entries = readEntriesSync(filepath);
  entries.sort((a, b) => b.ts.localeCompare(a.ts));
  return entries;
}

/** 全局统计：总访客 / 总对话 / 总 token / 总拦截 */
export function globalStats(summaries: IpSummary[]) {
  return {
    visitor_count: summaries.length,
    entry_count: summaries.reduce((s, x) => s + x.entry_count, 0),
    total_tokens: summaries.reduce((s, x) => s + x.total_tokens, 0),
    blocked_count: summaries.reduce((s, x) => s + x.blocked_count, 0),
  };
}
