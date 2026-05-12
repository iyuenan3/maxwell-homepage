/* ============================================================
   /cmd Static Command Router (v2 — Phase 3, no LLM)
   ------------------------------------------------------------
   依赖：DOM 中存在 .chat-input / .chat-history / .cmd-chips
   每个命令：把渲染好的 HTML push 进 .chat-history
   ============================================================ */

(function () {
  'use strict';

  const $history = () => document.querySelector('.chat-history');
  const $input   = () => document.querySelector('.chat-input');
  const $chips   = () => document.querySelectorAll('.cmd-chip');

  // ── 数据：从 site/data/home-data.js 读取（V1 / V2 共用真相源） ──
  // home-data.js 必须在 commands.js 之前加载（v2-redesign/index.html 已配置）
  if (!window.HOME_DATA) {
    console.error('commands.js: window.HOME_DATA not loaded — 检查 <script src="../data/home-data.js"> 顺序');
    return;
  }
  const D = window.HOME_DATA;
  const PROJECTS = D.projects;
  const PETS     = D.pets;
  const STACK    = D.stack;
  const GIT_LOG  = D.gitLog;
  const HISTORY  = [
    { k: 'edu',     v: D.history.edu },
    { k: 'patents', v: D.history.patents },
  ];

  // ── HELPERS ────────────────────────────────────────────
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function pushUserMsg(cmd) {
    const div = document.createElement('div');
    div.className = 'chat-msg user';
    div.innerHTML = `<span class="prompt-arrow">$</span> <span class="user-cmd">${escapeHtml(cmd)}</span>`;
    $history().appendChild(div);
  }

  function pushSystemMsg(html, klass = '') {
    const div = document.createElement('div');
    div.className = 'chat-msg system ' + klass;
    div.innerHTML = html;
    $history().appendChild(div);
    div.scrollIntoView({ behavior: 'smooth', block: 'end' });
    return div;
  }

  // ── COMMAND IMPLEMENTATIONS ────────────────────────────
  function cmdProjects() {
    let html = `<div class="ls-head"><span>perm</span><span>state</span><span>updated</span><span>name · description</span><span>stack</span></div>`;
    const stateSym = { live:'● live', active:'◐ active', archived:'✕ archived', planned:'◯ planned', paused:'◌ paused' };
    for (const p of PROJECTS) {
      html += `<a class="ls-row" href="/p/${p.slug}.html">
        <span class="perm${p.priv ? ' private' : ''}">${p.perm}</span>
        <span class="stars state-${p.state}">${stateSym[p.state]}</span>
        <span class="date">${p.date}</span>
        <div class="name-block">
          <div class="ls-name${p.dir ? ' dir' : ''}">${p.slug}</div>
          <div class="ls-name-zh">${p.zh}</div>
          <div class="ls-desc">— ${p.desc}</div>
        </div>
        <span class="stack">${p.stack}</span>
      </a>`;
    }
    return html;
  }

  function cmdGitLog() {
    let html = `<div class="gitlog">`;
    GIT_LOG.forEach((c, i) => {
      const isLast = c.last || i === GIT_LOG.length - 1;
      const branchPart = (c.branches && c.branches.length)
        ? ` (${c.branches.map(b => `<span class="branch">${b.name}</span>`).join(', ')})`
        : '';
      html += `<div class="commit">
        <div class="graph">
          <div class="node"></div>
          ${isLast ? '' : '<div class="line"></div>'}
        </div>
        <div class="body-c">
          <div class="meta">commit <span class="hash">${c.hash}</span>${branchPart}</div>
          <div class="meta">Date:   ${c.date}</div>
          <div class="subject">${c.subject}</div>
          <div class="body-text">${c.body}</div>
          ${c.tags ? `<div class="tags">${c.tags.map(t => `<span>${t}</span>`).join('')}</div>` : ''}
        </div>
      </div>`;
    });
    html += `</div>`;
    return html;
  }

  function cmdStack() {
    return `<div class="stack-flow">
      <div class="top">█ daily &nbsp;&nbsp; ${STACK.daily}</div>
      <div class="mid">▓ often &nbsp;&nbsp; ${STACK.often}</div>
      <div class="low">░ done&nbsp;&nbsp;&nbsp;  ${STACK.done}</div>
    </div>`;
  }

  function cmdPets() {
    let html = `<div class="ls-head"><span>perm</span><span>★</span><span>since</span><span>name · breed · note</span><span>status</span></div>`;
    for (const p of PETS) {
      html += `<div class="ls-row pet-row" style="cursor: default;">
        <span class="perm">${p.perm}</span>
        <span class="stars">${p.star}</span>
        <span class="date">${p.date}</span>
        <span><span class="name">${p.name}</span> <span class="desc">— ${p.desc}</span></span>
        <span class="stack">${p.status}</span>
      </div>`;
    }
    return html;
  }

  function cmdHistory() {
    let html = '';
    for (const h of HISTORY) {
      html += `<div class="kv"><span class="k">${h.k}</span><span class="v">${h.v}</span></div>`;
    }
    return html;
  }

  function cmdHelp() {
    return `<div class="help-block">
      <div class="help-line"><code>/projects</code> — 有趣的项目</div>
      <div class="help-line"><code>/git log</code> — 十年职业生涯</div>
      <div class="help-line"><code>/stack</code> — 技术栈</div>
      <div class="help-line"><code>/pets</code> — 我的毛孩子们</div>
      <div class="help-line"><code>/history</code> — 学历</div>
      <div class="help-line"><code>/clear</code> — 清空对话历史</div>
      <div class="help-line"><code>/help</code> — 显示本帮助</div>
    </div>`;
  }

  function cmdClear() {
    // 保留首条 .intro,清掉后续所有消息
    const hist = $history();
    Array.from(hist.children).forEach(el => {
      if (!el.classList.contains('intro')) el.remove();
    });
    // 同时清 LLM 对话历史(messages 数组 + sessionStorage)
    if (window.maxwellChat) window.maxwellChat.clear();
    return null;  // 不 push system msg
  }

  // ── ROUTER ─────────────────────────────────────────────
  const ROUTES = {
    '/projects': cmdProjects,
    '/git log':  cmdGitLog,
    '/git':      cmdGitLog,    // alias for /git log
    '/stack':    cmdStack,
    '/pets':     cmdPets,
    '/history':  cmdHistory,
    '/help':     cmdHelp,
    '/?':        cmdHelp,
    '/clear':    cmdClear,
    '/cls':      cmdClear,
  };

  function dispatch(raw) {
    const cmd = raw.trim();
    if (!cmd) return;

    if (cmd in ROUTES) {
      // 静态命令：终端式回显 + 渲染输出
      pushUserMsg(cmd);
      if (window.glassesEmote) window.glassesEmote.flash('typing', 300);
      const out = ROUTES[cmd]();
      if (out !== null) pushSystemMsg(out);
      if (window.glassesEmote) setTimeout(() => window.glassesEmote.flash('success', 700), 350);
    } else if (cmd.startsWith('/')) {
      // 未知命令
      pushUserMsg(cmd);
      pushSystemMsg(`<span class="err-line">command not found: <code>${escapeHtml(cmd)}</code> — 试试 <code>/help</code></span>`);
      if (window.glassesEmote) window.glassesEmote.flash('error', 1000);
    } else {
      // 自由对话 → LLM (chat.js 自己 push 用户气泡 + 流式 assistant 气泡 + 表情联动)
      if (window.maxwellChat) {
        window.maxwellChat.send(cmd);
      } else {
        pushUserMsg(cmd);
        pushSystemMsg(`<span class="err-line">chat 模块未加载（检查 chat.js 引入顺序）</span>`);
      }
    }
  }

  // ── INPUT BINDING ──────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    const input = $input();
    if (input) {
      input.addEventListener('keydown', (e) => {
        // IME composition 中（中文输入法选词时敲 Enter）→ 不发送
        // e.isComposing 现代浏览器；keyCode 229 兼容老 Safari
        if (e.key === 'Enter' && !e.isComposing && e.keyCode !== 229) {
          const v = input.value;
          input.value = '';
          dispatch(v);
        }
      });
      // 输入时表情：typing
      input.addEventListener('input', () => {
        if (input.value && window.glassesEmote) {
          window.glassesEmote.set('typing');
        }
      });
      // 失焦回 idle
      input.addEventListener('blur', () => {
        if (window.glassesEmote) window.glassesEmote.set('idle');
      });
    }

    // chip 点击 → 直接 dispatch
    $chips().forEach(chip => {
      chip.addEventListener('click', (e) => {
        e.preventDefault();
        const cmd = chip.dataset.cmd || chip.textContent.trim();
        dispatch(cmd);
        if (input) input.focus();
      });
    });

    // hover 触发表情联动 — 委托到 chat-history(因为内容动态生成)
    const hist = $history();
    if (hist) {
      hist.addEventListener('mouseover', (e) => {
        if (!window.glassesEmote) return;
        const row = e.target.closest('.ls-row');
        const commit = e.target.closest('.commit');
        const pet = e.target.closest('.pet-row');
        if (pet) window.glassesEmote.set('love');
        else if (commit) window.glassesEmote.set('look_l');
        else if (row) window.glassesEmote.set('focus');
      });
      hist.addEventListener('mouseout', (e) => {
        if (!window.glassesEmote) return;
        if (!e.relatedTarget || !hist.contains(e.relatedTarget)) {
          window.glassesEmote.set('idle');
        }
      });
    }
  });

  // ── EXPORT (for debugging) ─────────────────────────────
  window.cmd = { dispatch, ROUTES };
})();
