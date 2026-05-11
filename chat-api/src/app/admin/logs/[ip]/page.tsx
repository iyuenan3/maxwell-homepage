import Link from "next/link";
import { isValidToken } from "@/lib/admin-auth";
import { readLogsByIp } from "@/lib/log-reader";

export const dynamic = "force-dynamic";

type Params = Promise<{ ip: string }>;
type SP = Promise<{ token?: string }>;

function fmtTs(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export default async function LogDetailPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SP;
}) {
  const { ip } = await params;
  const sp = await searchParams;

  if (!isValidToken(sp.token)) {
    return (
      <div className="unauth">
        401 unauthorized<br />
        <small>append <code>?token=&lt;ADMIN_TOKEN&gt;</code> to the URL</small>
      </div>
    );
  }

  const decodedIp = decodeURIComponent(ip);
  const entries = readLogsByIp(decodedIp);
  const tokenQ = encodeURIComponent(sp.token || "");

  // 取第一条（最新）的 ua 当摘要
  const ua = entries[0]?.user_agent || "(unknown)";
  const totalTokens = entries.reduce((s, e) => s + (e.total_tokens || 0), 0);

  return (
    <>
      <Link href={`/admin/logs?token=${tokenQ}`} className="back">← back to /admin/logs</Link>
      <h1 className="prompt">cat ~/chat-api-logs/{decodedIp}.jsonl</h1>
      <hr className="divider" />

      <div className="summary-block">
        ip <b>{decodedIp}</b> · entries <b>{entries.length}</b> · total_tokens <b>{totalTokens.toLocaleString()}</b>
        <div className="ua">ua: {ua}</div>
      </div>

      {entries.length === 0 ? (
        <div className="empty">no entries (file missing or empty)</div>
      ) : (
        entries.map((e, i) => (
          <div key={`${e.ts}-${i}`} className="entry">
            <div className="meta">
              [{entries.length - i}] <b>{fmtTs(e.ts)}</b> · {e.model || "?"} · {e.duration_ms}ms ·
              tokens <b>{e.total_tokens}</b> (in {e.input_tokens} / out {e.output_tokens}) · msgs <b>{e.msg_count}</b>
              {e.blocked && <> · <span className="blocked">BLOCKED: {e.blocked}</span></>}
            </div>
            <div className="role">USER:</div>
            <div className="body">{e.user || "(empty)"}</div>
            <div className="role assistant">AI:</div>
            <div className="body">{e.assistant || "(empty)"}</div>
            {e.rag_hits && e.rag_hits.length > 0 && (
              <div className="rag">
                <b>RAG hits ({e.rag_hits.length}):</b> {e.rag_hits.join(", ")}
              </div>
            )}
          </div>
        ))
      )}
    </>
  );
}
