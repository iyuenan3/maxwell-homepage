/* ============================================================
   token-hud.js — Context bar + token 累计 HUD（claude-hud 风）
   ------------------------------------------------------------
   依赖 DOM：.token-hud 容器（index.html 提供 fixed bar）
   暴露：window.tokenHud = { update(meta), reset() }
   ============================================================ */

(function () {
  'use strict';

  // ctx 上限按当前后端模型设；首次对话前显示占位，SSE meta.model 到达后由后端动态填充
  const CTX_LIMIT = 128000;        // 当前 deepseek-v3.2 (128k)；未来换 256k 模型时调
  const STORE_KEY = 'maxwell-tokens-v2';
  const DEFAULT_MODEL = '-';        // 占位 — 不写死模型名，等后端 SSE meta.model 告知

  // ── 累计存储 ────────────────────────────────────────────
  function load() {
    try {
      const raw = sessionStorage.getItem(STORE_KEY);
      if (!raw) return { cumIn: 0, cumOut: 0, lastInput: 0, calls: 0, model: DEFAULT_MODEL };
      const obj = JSON.parse(raw);
      return {
        cumIn: obj.cumIn || 0,
        cumOut: obj.cumOut || 0,
        lastInput: obj.lastInput || 0,
        calls: obj.calls || 0,
        model: obj.model || DEFAULT_MODEL,
      };
    } catch {
      return { cumIn: 0, cumOut: 0, lastInput: 0, calls: 0, model: DEFAULT_MODEL };
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

  // ── render（用 DOM API + textContent，不用 innerHTML，防 XSS） ──
  function makeSpan(cls, text, title) {
    const el = document.createElement('span');
    el.className = cls;
    el.textContent = text;
    if (title) el.title = title;
    return el;
  }

  function render() {
    const root = document.querySelector('.token-hud');
    if (!root) return;

    const pct = Math.round((state.lastInput / CTX_LIMIT) * 100);

    root.replaceChildren(
      makeSpan('hud-label', 'ctx'),
      makeSpan(`hud-bar hud-${classByPct(pct)}`, bar(pct), `last input ${state.lastInput} / ${CTX_LIMIT} tokens`),
      makeSpan('hud-pct', `${pct}%`),
      makeSpan('hud-sep', '·'),
      makeSpan('hud-label', 'tokens'),
      makeSpan('hud-num', `in ${fmt(state.cumIn)}`, '累计 input 自 session 开始'),
      makeSpan('hud-sep', '·'),
      makeSpan('hud-num', `out ${fmt(state.cumOut)}`, '累计 output'),
      makeSpan('hud-sep', '·'),
      makeSpan('hud-num hud-dim', `${state.calls} calls`, '本会话调用次数'),
      makeSpan('hud-spacer', ''),
      makeSpan('hud-model', state.model, 'LLM 模型'),
    );
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
    if (meta.model) state.model = meta.model; // 后端动态告知
    save(state);
    render();
  }

  function reset() {
    state = { cumIn: 0, cumOut: 0, lastInput: 0, calls: 0, model: DEFAULT_MODEL };
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
