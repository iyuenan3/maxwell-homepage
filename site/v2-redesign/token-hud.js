/* ============================================================
   token-hud.js — Context bar + token 累计 HUD（claude-hud 风）
   ------------------------------------------------------------
   依赖 DOM：.token-hud 容器（index.html 提供 fixed bar）
   暴露：window.tokenHud = { update(meta), reset() }
   ============================================================ */

(function () {
  'use strict';

  // doubao-seed-2.0-lite 上下文窗口 ~32k token
  const CTX_LIMIT = 32000;
  const STORE_KEY = 'maxwell-tokens-v1';

  // ── 累计存储 ────────────────────────────────────────────
  function load() {
    try {
      const raw = sessionStorage.getItem(STORE_KEY);
      if (!raw) return { cumIn: 0, cumOut: 0, lastInput: 0, calls: 0 };
      const obj = JSON.parse(raw);
      return {
        cumIn: obj.cumIn || 0,
        cumOut: obj.cumOut || 0,
        lastInput: obj.lastInput || 0,
        calls: obj.calls || 0,
      };
    } catch {
      return { cumIn: 0, cumOut: 0, lastInput: 0, calls: 0 };
    }
  }

  function save(s) {
    try { sessionStorage.setItem(STORE_KEY, JSON.stringify(s)); } catch {}
  }

  let state = load();

  // ── helpers ─────────────────────────────────────────────
  function fmt(n) {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 10_000)    return (n / 1_000).toFixed(0) + 'k';
    if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'k';
    return String(n);
  }

  function bar(percent) {
    const fill = Math.min(10, Math.max(0, Math.round(percent / 10)));
    return '█'.repeat(fill) + '░'.repeat(10 - fill);
  }

  function classByPct(p) {
    if (p >= 80) return 'high';
    if (p >= 50) return 'mid';
    return 'low';
  }

  // ── render ──────────────────────────────────────────────
  function render() {
    const root = document.querySelector('.token-hud');
    if (!root) return;

    const pct = Math.round((state.lastInput / CTX_LIMIT) * 100);

    root.innerHTML = `
      <span class="hud-label">ctx</span>
      <span class="hud-bar hud-${classByPct(pct)}" title="last input ${state.lastInput} / ${CTX_LIMIT} tokens">${bar(pct)}</span>
      <span class="hud-pct">${pct}%</span>
      <span class="hud-sep">·</span>
      <span class="hud-label">tokens</span>
      <span class="hud-num" title="累计 input 自 session 开始">in ${fmt(state.cumIn)}</span>
      <span class="hud-sep">·</span>
      <span class="hud-num" title="累计 output">out ${fmt(state.cumOut)}</span>
      <span class="hud-sep">·</span>
      <span class="hud-num hud-dim" title="本会话调用次数">${state.calls} calls</span>
      <span class="hud-spacer"></span>
      <span class="hud-model" title="LLM 模型">doubao-seed-2.0-lite</span>
    `;
  }

  // ── public API ──────────────────────────────────────────
  function update(meta) {
    if (!meta) return;
    if (meta.blocked) {
      // 被前置黑名单拦的请求,不算 token,但 calls + 1
      state.calls += 1;
    } else {
      state.cumIn += meta.input_tokens || 0;
      state.cumOut += meta.output_tokens || 0;
      state.lastInput = meta.input_tokens || state.lastInput;
      state.calls += 1;
    }
    save(state);
    render();
  }

  function reset() {
    state = { cumIn: 0, cumOut: 0, lastInput: 0, calls: 0 };
    save(state);
    render();
  }

  window.tokenHud = { update, reset };

  // ── init ─ 不等 DOMContentLoaded（script 在 body 末尾，DOM 已 ready）
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})();
