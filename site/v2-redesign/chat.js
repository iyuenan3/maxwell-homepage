/* ============================================================
   chat.js — V2 LLM 对话前端（Phase 5 + Phase 6 表情联动）
   ------------------------------------------------------------
   依赖：
     - DOM .chat-history（commands.js 也用同一个容器）
     - window.glassesEmote（emotes.js 提供，可选）
   暴露：
     window.maxwellChat = { send(text), clear(), getHistory() }
   ============================================================ */

(function () {
  'use strict';

  // ── API 端点（dev 跨域 / 生产同源） ─────────────────────
  const HOST = window.location.hostname;
  const IS_LOCAL = HOST === 'localhost' || HOST === '127.0.0.1' || HOST === '';
  const API_URL = IS_LOCAL
    ? 'http://localhost:3002/api/chat'
    : '/api/chat';

  // ── 对话历史（sessionStorage 持久化） ───────────────────
  const STORE_KEY = 'maxwell-chat-v1';
  const MAX_HISTORY = 18;  // 后端限 20，前端留 2 个余量

  function loadHistory() {
    try {
      const raw = sessionStorage.getItem(STORE_KEY);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr)) return [];
      return arr.filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string');
    } catch {
      return [];
    }
  }

  function saveHistory() {
    try {
      sessionStorage.setItem(STORE_KEY, JSON.stringify(messages));
    } catch {}
  }

  let messages = loadHistory();

  // ── DOM helpers ─────────────────────────────────────────
  const $history = () => document.querySelector('.chat-history');

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  // ── 滚动控制：instant + 仅在用户已在底部时强制滚（rAF 节流） ────
  // 修复：smooth 动画 + 多次 SSE delta 触发会乱跳
  let scrollScheduled = false;
  function isNearBottom(threshold = 80) {
    const doc = document.documentElement;
    return doc.scrollHeight - window.scrollY - window.innerHeight < threshold;
  }
  function scheduleScrollToBottom(force = false) {
    if (scrollScheduled) return;
    const wasNearBottom = force || isNearBottom();
    if (!wasNearBottom) return;  // 用户上滑看历史，不打扰
    scrollScheduled = true;
    requestAnimationFrame(() => {
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' });
      scrollScheduled = false;
    });
  }

  // 极简 markdown 渲染：bold / italic / code / link
  function mdInline(s) {
    return s
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^*])\*([^*]+?)\*(?!\*)/g, '$1<em>$2</em>')
      // P1 安全修复：链接 URL scheme 校验，禁止 javascript: / data: 等危险协议
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, url) => {
        const safe = /^(https?:|mailto:|#|\/)/.test(url.trim()) ? url : '#';
        return `<a href="${safe}" target="_blank" rel="noopener">${text}</a>`;
      });
  }

  // line-by-line 渲染：支持 H1-H6 / ul / ol / 段落 / 代码块
  function mdToHtml(md) {
    if (!md || !md.trim()) return '';

    // 抽出代码块占位
    const codeBlocks = [];
    const withPh = md.replace(/```[^\n]*\n?([\s\S]*?)```/g, (_, code) => {
      codeBlocks.push(code.replace(/\n$/, ''));
      return `\n___CB${codeBlocks.length - 1}___\n`;
    });

    const lines = withPh.split('\n');
    const out = [];
    let i = 0;
    while (i < lines.length) {
      const line = lines[i].trim();
      if (!line) { i++; continue; }

      const cbm = line.match(/^___CB(\d+)___$/);
      if (cbm) { out.push(`<pre><code>${escapeHtml(codeBlocks[+cbm[1]])}</code></pre>`); i++; continue; }

      // H1-H6
      const hm = line.match(/^(#{1,6})\s+(.+?)\s*$/);
      if (hm) { out.push(`<h${hm[1].length}>${mdInline(escapeHtml(hm[2]))}</h${hm[1].length}>`); i++; continue; }

      // 无序列表
      if (/^[-*]\s+/.test(line)) {
        const items = [];
        while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
          items.push(`<li>${mdInline(escapeHtml(lines[i].trim().replace(/^[-*]\s+/, '')))}</li>`);
          i++;
        }
        out.push(`<ul>${items.join('')}</ul>`);
        continue;
      }

      // 有序列表
      if (/^\d+\.\s+/.test(line)) {
        const items = [];
        while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
          items.push(`<li>${mdInline(escapeHtml(lines[i].trim().replace(/^\d+\.\s+/, '')))}</li>`);
          i++;
        }
        out.push(`<ol>${items.join('')}</ol>`);
        continue;
      }

      // 段落：合并连续非特殊行
      const para = [];
      while (i < lines.length) {
        const cur = lines[i].trim();
        if (!cur) break;
        if (/^(#{1,6}\s+|[-*]\s+|\d+\.\s+|___CB\d+___$)/.test(cur)) break;
        para.push(cur);
        i++;
      }
      if (para.length) out.push(`<p>${mdInline(escapeHtml(para.join(' ')))}</p>`);
    }
    return out.join('');
  }

  // ── 气泡 DOM ────────────────────────────────────────────
  function pushUserBubble(text) {
    const div = document.createElement('div');
    div.className = 'chat-msg user';
    div.innerHTML = `<span class="bubble-prefix">you:</span><div class="bubble-body">${escapeHtml(text)}</div>`;
    $history().appendChild(div);
    scheduleScrollToBottom(true);  // user 发消息 → 强制滚到底
  }

  function createAssistantBubble() {
    const wrap = document.createElement('div');
    wrap.className = 'chat-msg assistant';
    wrap.innerHTML = `
      <span class="bubble-prefix">maxwell:</span>
      <div class="bubble-body"><span class="bubble-thinking">[thinking]</span> <span class="bubble-cursor">▍</span></div>
    `;
    $history().appendChild(wrap);
    scheduleScrollToBottom(true);  // assistant 气泡刚创建 → 强制滚
    return {
      wrap,
      body: wrap.querySelector('.bubble-body'),
      cursor: wrap.querySelector('.bubble-cursor'),
    };
  }

  function pushErrorBubble(msg) {
    const div = document.createElement('div');
    div.className = 'chat-msg assistant chat-error';
    div.innerHTML = `<span class="bubble-prefix">maxwell:</span><div class="bubble-body err-line">${escapeHtml(msg)}</div>`;
    $history().appendChild(div);
    scheduleScrollToBottom(true);
  }

  // ── SSE 流式调用 ────────────────────────────────────────
  let inflight = false;

  async function send(userText) {
    const text = String(userText || '').trim();
    if (!text || inflight) return;

    inflight = true;
    pushUserBubble(text);
    messages.push({ role: 'user', content: text });

    // 表情：thinking
    if (window.glassesEmote) window.glassesEmote.set('loading');

    const bubble = createAssistantBubble();
    let acc = '';

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: messages.slice(-MAX_HISTORY) }),
      });

      if (!res.ok || !res.body) {
        let errMsg = `请求失败（HTTP ${res.status}）`;
        try {
          const j = await res.json();
          if (j?.error === 'rate_limited') errMsg = '请求太频繁了，等一分钟再试';
          else if (j?.error) errMsg = `服务异常：${j.error}`;
        } catch {}
        bubble.wrap.remove();
        pushErrorBubble(errMsg);
        if (window.glassesEmote) window.glassesEmote.flash('error', 1500);
        return;
      }

      // 表情：流式输出 → typing
      if (window.glassesEmote) window.glassesEmote.set('typing');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const rawLine of lines) {
          const line = rawLine.trim();
          if (!line.startsWith('data:')) continue;
          const data = line.slice(5).trim();
          if (!data) continue;
          if (data === '[DONE]') {
            buffer = '';
            break;
          }
          try {
            const j = JSON.parse(data);
            if (j.delta) {
              acc += j.delta;
              // 增量 render：保留光标在末尾
              bubble.body.innerHTML = mdToHtml(acc) + '<span class="bubble-cursor">▍</span>';
              scheduleScrollToBottom();  // 流式输出：仅在用户已在底部时滚
            }
            if (j.meta) {
              // token usage / blocked flag → HUD
              if (window.tokenHud) window.tokenHud.update(j.meta);
            }
            if (j.error) {
              throw new Error(j.error);
            }
          } catch (e) {
            // SSE parse 失败忽略；error 字段 throw 上去
            if (e.message && e.message !== 'SyntaxError') {
              // re-throw real errors
            }
          }
        }
      }

      // 完成：去光标 + 表情 smile→idle + push assistant msg
      bubble.body.innerHTML = mdToHtml(acc);
      messages.push({ role: 'assistant', content: acc });
      // 截断历史（保留最近 MAX_HISTORY 条）
      if (messages.length > MAX_HISTORY) {
        messages = messages.slice(-MAX_HISTORY);
      }
      saveHistory();

      if (window.glassesEmote) {
        window.glassesEmote.set('smile');
        setTimeout(() => window.glassesEmote.set('idle'), 1500);
      }
    } catch (err) {
      console.error('[chat] error:', err);
      bubble.wrap.remove();
      pushErrorBubble('网络异常，对话失败');
      if (window.glassesEmote) window.glassesEmote.flash('error', 1500);
    } finally {
      inflight = false;
    }
  }

  function clear() {
    messages = [];
    saveHistory();
  }

  function getHistory() {
    return messages.slice();
  }

  // ── Restore：刷新后把对话历史重新渲染回来 ────────────────
  function restoreHistory() {
    const hist = $history();
    if (!hist || messages.length === 0) return;
    for (const m of messages) {
      if (m.role === 'user') {
        pushUserBubble(m.content);
      } else {
        const bub = createAssistantBubble();
        bub.cursor.remove();  // 历史消息不带光标
        bub.body.innerHTML = mdToHtml(m.content);
      }
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    restoreHistory();
  });

  // ── Export ──────────────────────────────────────────────
  window.maxwellChat = { send, clear, getHistory };
})();
