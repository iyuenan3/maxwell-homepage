import Link from "next/link";
import { isValidToken } from "@/lib/admin-auth";
import { listIps, globalStats } from "@/lib/log-reader";

export const dynamic = "force-dynamic";

type SP = Promise<{ token?: string }>;

function fmtTs(iso: string): string {
  // 2026-05-11T14:32:11.123Z → 2026-05-11 22:32:11 (本地时区)
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export default async function LogsListPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  if (!isValidToken(sp.token)) {
    return (
      <div className="unauth">
        401 unauthorized<br />
        <small>append <code>?token=&lt;ADMIN_TOKEN&gt;</code> to the URL</small>
      </div>
    );
  }

  const summaries = listIps();
  const stats = globalStats(summaries);
  const tokenQ = encodeURIComponent(sp.token || "");

  return (
    <>
      <h1 className="prompt">chat-api admin / logs</h1>
      <hr className="divider" />
      <div className="stats">
        visitors <b>{stats.visitor_count}</b> · conversations <b>{stats.entry_count}</b> ·
        tokens <b>{stats.total_tokens.toLocaleString()}</b> · blocked <b>{stats.blocked_count}</b>
      </div>

      {summaries.length === 0 ? (
        <div className="empty">
          ~/chat-api-logs/ is empty (no JSONL files yet)
        </div>
      ) : (
        <table className="logs">
          <thead>
            <tr>
              <th>last_ts</th>
              <th>ip</th>
              <th className="right">msgs</th>
              <th className="right">tokens</th>
              <th className="right">blocked</th>
              <th>first_ts</th>
            </tr>
          </thead>
          <tbody>
            {summaries.map((s) => (
              <tr key={s.filename}>
                <td>{fmtTs(s.last_ts)}</td>
                <td>
                  <Link href={`/admin/logs/${encodeURIComponent(s.ip)}?token=${tokenQ}`}>
                    {s.ip}
                  </Link>
                </td>
                <td className="right">{s.entry_count}</td>
                <td className="right">{s.total_tokens.toLocaleString()}</td>
                <td className={`right ${s.blocked_count > 0 ? "blocked" : ""}`}>
                  {s.blocked_count > 0 ? s.blocked_count : "-"}
                </td>
                <td>{fmtTs(s.first_ts)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
