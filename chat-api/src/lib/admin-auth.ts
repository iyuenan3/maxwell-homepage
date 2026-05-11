/**
 * Admin token 校验 — 用于 /admin/* 页面
 * 用法：在 page/route 顶部调 requireAdminToken(searchParams.token)
 */

const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "";

export function isValidToken(token: string | string[] | undefined): boolean {
  if (!ADMIN_TOKEN) return false;
  const t = Array.isArray(token) ? token[0] : token;
  return typeof t === "string" && t.length > 0 && t === ADMIN_TOKEN;
}
