#!/usr/bin/env node
// build.js — Maxwellii 二级详情页构建器（纯 Node，零依赖）
// 用法：node build.js
// 输入：site/data/projects/<slug>.md（含 frontmatter + ## README/NOTES/...）
// 可选：~/Desktop/Claude-Project/worklog/wiki/projects/<wiki_slug>.md
// 输出：site/public/p/<slug>.html

const fs = require('fs');
const path = require('path');
const os = require('os');

const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data', 'projects');
const TEMPLATES_DIR = path.join(ROOT, 'templates');
const OUTPUT_DIR = path.join(ROOT, 'public', 'p');
const WIKI_DIR = path.join(os.homedir(), 'Desktop', 'Claude-Project', 'worklog', 'wiki', 'projects');

// ============================================================
// 工具
// ============================================================

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// 简易 markdown → HTML（段落、粗体、斜体、行内代码、链接、列表、H3-H6、表格、代码块）
// 调用约定：mdToHtml 自己处理 esc；inline 假设输入已 esc。
function mdToHtml(md) {
  if (!md || !md.trim()) return '';

  // Pass 1: 提取代码块（避免内部空行被 \n\n+ 切碎）
  const codeBlocks = [];
  const withPlaceholders = md.replace(/```[^\n]*\n([\s\S]*?)\n```/g, (_, code) => {
    codeBlocks.push(code);
    return `\x00CB${codeBlocks.length - 1}\x00`;
  });

  const blocks = withPlaceholders.trim().split(/\n\n+/);
  return blocks
    .map((block) => {
      const lines = block.split('\n');

      // 代码块占位符还原
      const cbMatch = block.match(/^\x00CB(\d+)\x00$/);
      if (cbMatch) {
        return `<pre><code>${esc(codeBlocks[parseInt(cbMatch[1], 10)])}</code></pre>`;
      }

      // H3-H6 标题（H2 已被 parseSections 切走，不会到这里）
      const hMatch = lines.length === 1 && block.match(/^(#{3,6})\s+(.+)$/);
      if (hMatch) {
        const level = hMatch[1].length;
        return `<h${level}>${inline(esc(hMatch[2]))}</h${level}>`;
      }

      // 表格（全 | 开头多行）
      if (lines.length >= 2 && lines.every((l) => l.trim().startsWith('|'))) {
        const tableHtml = renderTable(block);
        if (tableHtml) return tableHtml;
      }

      // 列表
      if (lines.every((l) => /^[\s]*[-*]\s+/.test(l))) {
        const items = lines.map((l) => `<li>${inline(esc(l.replace(/^[\s]*[-*]\s+/, '')))}</li>`).join('');
        return `<ul>${items}</ul>`;
      }

      // 默认段落
      return `<p>${inline(esc(block.replace(/\n/g, ' ')))}</p>`;
    })
    .join('\n');
}

// inline 仅处理 markdown 语法到 HTML 标签，不再做 esc（避免 double escape）
function inline(s) {
  return s
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*]+?)\*(?!\*)/g, '$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
}

// 简易 frontmatter 解析（YAML 子集：键值对、列表、嵌套对象）
function parseFrontmatter(content) {
  const m = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return { meta: {}, body: content };
  return { meta: parseYaml(m[1]), body: m[2] };
}

function parseYaml(yaml) {
  const obj = {};
  const lines = yaml.split('\n');
  let curKey = null;
  let curIndent = 0;

  for (const raw of lines) {
    if (!raw.trim() || raw.trim().startsWith('#')) continue;
    const indent = raw.length - raw.trimStart().length;
    const line = raw.trimStart();

    if (indent === 0) {
      const m = line.match(/^([^:]+?):\s*(.*)$/);
      if (!m) continue;
      const [, key, val] = m;
      curKey = key;
      curIndent = 0;
      if (val.trim()) {
        obj[key] = parseScalar(val.trim());
      } else {
        obj[key] = null; // 待填充（下面是 list 或 dict）
      }
    } else if (curKey) {
      if (line.startsWith('- ')) {
        if (!Array.isArray(obj[curKey])) obj[curKey] = [];
        obj[curKey].push(parseScalar(line.slice(2).trim()));
      } else {
        const m = line.match(/^([^:]+?):\s*(.*)$/);
        if (!m) continue;
        const [, key, val] = m;
        if (typeof obj[curKey] !== 'object' || Array.isArray(obj[curKey]) || obj[curKey] === null) {
          obj[curKey] = {};
        }
        obj[curKey][key] = parseScalar(val.trim());
      }
    }
  }
  return obj;
}

function parseScalar(v) {
  if (!v) return '';
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    return v.slice(1, -1);
  }
  if (v === 'true') return true;
  if (v === 'false') return false;
  if (v === 'null' || v === '~') return null;
  return v;
}

// 拆解 body 为 sections（按 `## TITLE`）
function parseSections(body) {
  const sections = {};
  const re = /^##\s+([A-Z][A-Z_]*)\s*$/gm;
  const headings = [];
  let m;
  while ((m = re.exec(body)) !== null) {
    headings.push({ name: m[1], start: m.index, contentStart: m.index + m[0].length });
  }
  for (let i = 0; i < headings.length; i++) {
    const h = headings[i];
    const end = i + 1 < headings.length ? headings[i + 1].start : body.length;
    sections[h.name] = body.slice(h.contentStart, end).trim();
  }
  return sections;
}

// 读 wiki 项目页（如果有）
function readWiki(wikiSlug) {
  if (!wikiSlug) return null;
  const fp = path.join(WIKI_DIR, `${wikiSlug}.md`);
  if (!fs.existsSync(fp)) return null;
  return fs.readFileSync(fp, 'utf8');
}

// 解析 wiki 中的 markdown 表格（仅 body rows）
function parseTable(md) {
  const lines = md.split('\n').map((l) => l.trim()).filter((l) => l.startsWith('|'));
  if (lines.length < 2) return [];
  return lines.slice(2).map((l) => l.split('|').slice(1, -1).map((c) => c.trim()));
}

// 渲染完整 markdown 表格为 <table>（含 header）
function renderTable(md) {
  const lines = md.split('\n').map((l) => l.trim()).filter((l) => l.startsWith('|'));
  if (lines.length < 2) return null;
  const sepIdx = lines.findIndex((l) => /^\|[\s|:-]+\|$/.test(l));
  if (sepIdx < 1) return null;
  const header = lines[0].split('|').slice(1, -1).map((c) => c.trim());
  const body = lines.slice(sepIdx + 1).map((l) => l.split('|').slice(1, -1).map((c) => c.trim()));
  const headHtml = header.map((c) => `<th>${esc(c)}</th>`).join('');
  const bodyHtml = body.map((r) => `<tr>${r.map((c) => `<td>${inline(esc(c))}</td>`).join('')}</tr>`).join('');
  return `<table class="kv-table"><thead><tr>${headHtml}</tr></thead><tbody>${bodyHtml}</tbody></table>`;
}

// 提取 wiki 中指定 ## 标题下的内容
function extractSection(wiki, headingPattern) {
  if (!wiki) return null;
  const re = new RegExp(`##\\s+${headingPattern}[^\\n]*\\n+([\\s\\S]*?)(?=\\n##\\s|$)`, 'i');
  const m = wiki.match(re);
  return m ? m[1].trim() : null;
}

// ============================================================
// 9 个组件渲染器
// ============================================================

function block(promptHtml, comment, output) {
  const cmt = comment ? ` <span class="comment"># ${esc(comment)}</span>` : '';
  return `    <div class="block" data-reveal>
      <div class="prompt"><span class="sigil">$</span> ${promptHtml}${cmt}</div>
      <div class="output">${output}</div>
    </div>`;
}

const components = {
  readme(data) {
    const text = data.sections.README;
    const html = text ? mdToHtml(text) : '<p class="dim"><em>README 待补</em></p>';
    return block('<span class="cmd">cat</span> <span class="arg">README.md</span>', '项目简介', html);
  },

  links(data) {
    const links = data.meta.links || {};
    // label 直接采用 frontmatter 的 key（保留 url / source / docs 等英文小标题；自定义 key 也原样显示）
    const rows = [];
    for (const [key, val] of Object.entries(links)) {
      if (!val) continue;
      const v = val === 'private'
        ? '<em class="dim">private</em>'
        : `<a href="${esc(val)}" target="_blank">${esc(val)}</a>`;
      rows.push(`<div class="kv"><span class="k">${esc(key)}</span><span class="v">${v}</span></div>`);
    }
    const out = rows.length ? rows.join('\n') : '<p class="dim"><em>无公开链接</em></p>';
    return block('<span class="cmd">links</span>', '快速跳转', out);
  },

  git_log(data) {
    const wiki = data.wiki;
    const section = extractSection(wiki, 'Git\\s+活动');
    if (!section) {
      return block('<span class="cmd">git</span> <span class="arg">log</span> <span class="flag">--oneline --decorate</span>', '关键里程碑', '<p class="dim"><em>暂无 wiki Git 活动数据</em></p>');
    }
    const rows = parseTable(section);
    if (!rows.length) {
      return block('<span class="cmd">git</span> <span class="arg">log</span> <span class="flag">--oneline --decorate</span>', '关键里程碑', '<p class="dim"><em>表格解析失败</em></p>');
    }
    const items = rows.slice(0, 10).map((r) => {
      const date = r[0] || '';
      const hash = (r[1] || '').replace(/^`|`$/g, '');
      const msg = r.slice(2).join(' · ');
      return `<div class="commit-line"><span class="hash">${esc(hash)}</span><span class="date dim">${esc(date)}</span><span class="msg">${esc(msg)}</span></div>`;
    }).join('\n');
    return block('<span class="cmd">git</span> <span class="arg">log</span> <span class="flag">--oneline --decorate</span>', '关键里程碑', `<div class="gitlog-mini">${items}</div>`);
  },

  decisions(data) {
    const override = data.sections.DECISIONS;
    if (override && override.trim()) {
      return block('<span class="cmd">cat</span> <span class="arg">DECISIONS.md</span>', '关键决策', mdToHtml(override));
    }
    const wiki = data.wiki;
    const section = extractSection(wiki, '决策日志');
    if (!section) {
      return block('<span class="cmd">cat</span> <span class="arg">DECISIONS.md</span>', '关键决策', '<p class="dim"><em>暂无</em></p>');
    }
    const items = [...section.matchAll(/###\s+(.+?)\n+([\s\S]*?)(?=\n###\s|$)/g)];
    if (!items.length) {
      return block('<span class="cmd">cat</span> <span class="arg">DECISIONS.md</span>', '关键决策', mdToHtml(section.slice(0, 800)));
    }
    const html = items.slice(0, 5).map(([, title, content]) => {
      const raw = content.split('\n').filter((l) => l.trim() && !l.startsWith('|') && !l.startsWith('-')).slice(0, 4).join(' ').replace(/\s+/g, ' ').slice(0, 240);
      // 截断后清理末尾悬挂的 markdown 标记
      const summary = raw
        .replace(/\*\*[^*]*$/, '')
        .replace(/`[^`]*$/, '')
        .trim();
      if (!summary) return `<div class="decision"><div class="d-title">${esc(title.trim())}</div></div>`;
      return `<div class="decision"><div class="d-title">${esc(title.trim())}</div><div class="d-summary">${inline(esc(summary))}…</div></div>`;
    }).filter(Boolean).join('\n');
    return block('<span class="cmd">cat</span> <span class="arg">DECISIONS.md</span>', '关键决策（最近 5 项）', html);
  },

  stats(data) {
    // body 段优先（手写 STATS 表）→ 否则 fallback wiki
    const override = data.sections.STATS;
    if (override && override.trim()) {
      const tableHtml = renderTable(override);
      if (tableHtml) {
        return block('<span class="cmd">make</span> <span class="arg">stats</span>', '关键指标', tableHtml);
      }
      return block('<span class="cmd">make</span> <span class="arg">stats</span>', '关键指标', mdToHtml(override));
    }
    const wiki = data.wiki;
    const section = extractSection(wiki, '当前进度') || extractSection(wiki, '基本信息');
    if (!section) {
      return block('<span class="cmd">make</span> <span class="arg">stats</span>', '关键指标', '<p class="dim"><em>暂无</em></p>');
    }
    const rows = parseTable(section);
    if (!rows.length) {
      return block('<span class="cmd">make</span> <span class="arg">stats</span>', '关键指标', '<p class="dim"><em>无数据</em></p>');
    }
    const html = rows.slice(0, 10).map((r) => `<div class="kv"><span class="k">${esc(r[0])}</span><span class="v">${inline(esc(r.slice(1).join(' · ')))}</span></div>`).join('\n');
    return block('<span class="cmd">make</span> <span class="arg">stats</span>', '关键指标', html);
  },

  notes(data) {
    const text = data.sections.NOTES;
    const html = text ? mdToHtml(text) : '<p class="dim"><em>NOTES 待补</em></p>';
    return block('<span class="cmd">cat</span> <span class="arg">NOTES.md</span>', '复盘 & 感悟', html);
  },

  stack(data) {
    const stack = data.meta.stack || [];
    if (!stack.length) {
      return block('<span class="cmd">cat</span> <span class="arg">STACK.md</span>', '技术栈', '<p class="dim"><em>未声明</em></p>');
    }
    const tags = stack.map((s) => `<span>${esc(s)}</span>`).join('');
    return block('<span class="cmd">cat</span> <span class="arg">STACK.md</span>', '技术栈', `<div class="tag-row">${tags}</div>`);
  },

  ps(data) {
    const wiki = data.wiki;
    const section = extractSection(wiki, '部署');
    if (!section) {
      return block('<span class="cmd">ps</span> <span class="flag">-ef</span> <span class="arg">| grep ' + esc(data.meta.slug || '*') + '</span>', '当前运行状态', '<p class="dim"><em>未部署或未声明</em></p>');
    }
    const rows = parseTable(section);
    const html = rows.length
      ? rows.slice(0, 10).map((r) => `<div class="kv"><span class="k">${esc(r[0])}</span><span class="v">${inline(esc(r.slice(1).join(' · ')))}</span></div>`).join('\n')
      : mdToHtml(section.slice(0, 600));
    return block('<span class="cmd">ps</span> <span class="flag">-ef</span> <span class="arg">| grep ' + esc(data.meta.slug || '*') + '</span>', '当前运行状态', html);
  },

  history(data) {
    const text = data.sections.HISTORY;
    const html = text ? mdToHtml(text) : '<p class="dim"><em>HISTORY 待补</em></p>';
    return block('<span class="cmd">history</span>', '项目演进', html);
  },

  timeline(data) {
    // 截图接口预留，第一版不渲染。frontmatter 中显式包含 timeline 才会出来
    const text = data.sections.TIMELINE;
    const html = text ? mdToHtml(text) : '<p class="dim"><em>截图接口预留，暂未填充</em></p>';
    return block('<span class="cmd">ls</span> <span class="flag">-1</span> <span class="arg">timeline/</span>', '截图', html);
  },
};

// ============================================================
// 主流程
// ============================================================

const STATUS_LABELS = {
  planned: '◯ planned · 待启动',
  active: '◐ active · 进行中',
  live: '● live · 在线',
  paused: '◌ paused · 暂停',
  archived: '✕ archived · 归档',
};

function buildOne(slug) {
  const dataFile = path.join(DATA_DIR, `${slug}.md`);
  const raw = fs.readFileSync(dataFile, 'utf8');
  const { meta, body } = parseFrontmatter(raw);
  const sections = parseSections(body);
  const wiki = readWiki(meta.wiki_slug);

  const data = { meta, sections, wiki };
  const cmds = Array.isArray(meta.commands) && meta.commands.length ? meta.commands : ['readme'];
  const blocks = cmds.map((cmd) => {
    const fn = components[cmd];
    if (!fn) return `    <div class="block"><div class="output dim"><em>未知组件: ${esc(cmd)}</em></div></div>`;
    return fn(data);
  }).join('\n\n');

  const baseTpl = fs.readFileSync(path.join(TEMPLATES_DIR, '_base.html'), 'utf8');
  const html = baseTpl
    .replace(/{{slug}}/g, esc(slug))
    .replace(/{{name_en}}/g, esc(meta.name_en || slug))
    .replace(/{{name_zh}}/g, esc(meta.name_zh || slug))
    .replace(/{{status}}/g, esc(meta.status || '—'))
    .replace(/{{status_label}}/g, esc(STATUS_LABELS[meta.status] || meta.status || '—'))
    .replace(/{{since}}/g, esc(meta.since || ''))
    .replace('{{blocks}}', blocks);

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUTPUT_DIR, `${slug}.html`), html, 'utf8');
}

// ============================================================
// V1 主页（site/public/index.html）build —— 数据从 data/home-data.js 取
// ============================================================

const HOME_DATA_FILE = path.join(ROOT, 'data', 'home-data.js');
const HOME_TPL_FILE = path.join(TEMPLATES_DIR, 'home.html');
const HOME_OUT_FILE = path.join(ROOT, 'public', 'index.html');

// HOME render 函数（注意：home-data.js 的字段值有时已含 HTML，不再 esc）

function renderHomeTagline(t) {
  return `<span class="ver">${esc(t.ver)}</span> · last sync ${esc(t.sync)}`;
}

function renderHomeWhoamiFields(w) {
  const linkHtml = w.links.map(l => `<a href="${esc(l.url)}" target="_blank">${esc(l.label)}</a>`).join(' · ');
  const contactHtml = `<a href="mailto:${esc(w.contact.email)}">${esc(w.contact.email)}</a> · wechat: ${esc(w.contact.wechat)}`;
  const rows = [
    ['name',       esc(w.name)],
    ['location',   esc(w.location)],
    ['role',       esc(w.role)],
    ['previously', esc(w.previously)],
    ['household',  w.household],   // 含 <em>
    ['tags',       esc(w.tags)],
    ['contact',    contactHtml],
    ['links',      linkHtml],
  ];
  return rows.map(([k, v]) =>
    `            <div class="kv"><span class="k">${k}</span><span class="v">${v}</span></div>`
  ).join('\n');
}

function renderHomeGitLogCommits(commits) {
  return commits.map((c, i) => {
    const isLast = c.last || i === commits.length - 1;
    const hasGraph = !isLast;
    const graphHtml = hasGraph
      ? `<div class="graph">\n              <div class="node"></div>\n              <div class="line"></div>\n            </div>`
      : `<div class="graph"><div class="node"></div></div>`;

    let metaLine1;
    if (c.branches && c.branches.length) {
      const brs = c.branches.map(b => `<span class="branch">${esc(b.name)}</span>`).join(', ');
      metaLine1 = c.branches.length > 1
        ? `<div class="meta">\n                commit <span class="hash">${esc(c.hash)}</span>\n                (${brs})\n              </div>`
        : `<div class="meta">commit <span class="hash">${esc(c.hash)}</span> (${brs})</div>`;
    } else {
      metaLine1 = `<div class="meta">commit <span class="hash">${esc(c.hash)}</span></div>`;
    }

    const tagsHtml = c.tags && c.tags.length
      ? `<div class="tags">\n                ${c.tags.map(t => `<span>${esc(t)}</span>`).join('')}\n              </div>`
      : '';

    return `          <div class="commit">
            ${graphHtml}
            <div class="body-c">
              ${metaLine1}
              <div class="meta">Date:   ${esc(c.date)}</div>
              <div class="subject">${esc(c.subject)}</div>
              <div class="body-text">
                ${c.body}
              </div>
              ${tagsHtml}
            </div>
          </div>`;
  }).join('\n\n');
}

const STATE_SYM = { live: '● live', active: '◐ active', archived: '✕ archived', planned: '◯ planned', paused: '◌ paused' };

function renderHomeProjectsRows(projects) {
  return projects.map(p => {
    const permClass = p.priv ? 'perm private' : 'perm';
    const dirClass = p.dir ? 'ls-name dir' : 'ls-name';
    return `        <a class="ls-row" href="/p/${esc(p.slug)}.html">
          <span class="${permClass}">${esc(p.perm)}</span>
          <span class="stars state-${esc(p.state)}">${STATE_SYM[p.state] || esc(p.state)}</span>
          <span class="date">${esc(p.date)}</span>
          <div class="name-block">
            <div class="${dirClass}">${esc(p.slug)}</div>
            <div class="ls-name-zh">${esc(p.zh)}</div>
            <div class="ls-desc">— ${esc(p.desc)}</div>
          </div>
          <span class="stack">${esc(p.stack)}</span>
        </a>`;
  }).join('\n\n');
}

function renderHomePetsRows(pets) {
  return pets.map(p =>
    `        <div class="ls-row" style="cursor: default;">
          <span class="perm">${esc(p.perm)}</span><span class="stars">${esc(p.star)}</span><span class="date">${esc(p.date)}</span>
          <span><span class="name">${esc(p.name)}</span> <span class="desc">— ${esc(p.desc)}</span></span>
          <span class="stack">${esc(p.status)}</span>
        </div>`
  ).join('\n');
}

function renderHomeStackLines(s) {
  return `        <div class="top">█ daily &nbsp;&nbsp; ${esc(s.daily)}</div>
        <div class="mid">▓ often &nbsp;&nbsp; ${esc(s.often)}</div>
        <div class="low">░ done&nbsp;&nbsp;&nbsp;  ${esc(s.done)}</div>`;
}

function renderHomeHistoryKVs(h) {
  // edu / patents 的 v 字段含 <br><span class="dim">…</span>，不 esc
  return `        <div class="kv"><span class="k">edu</span><span class="v">${h.edu}</span></div>
        <div class="kv"><span class="k">patents</span><span class="v">${h.patents}</span></div>`;
}

function buildHome() {
  // 清缓存确保每次重读最新 data
  delete require.cache[require.resolve(HOME_DATA_FILE)];
  const data = require(HOME_DATA_FILE);
  let html = fs.readFileSync(HOME_TPL_FILE, 'utf8');

  const replacements = {
    'tagline':         renderHomeTagline(data.tagline),
    'whoami_fields':   renderHomeWhoamiFields(data.whoami),
    'gitlog_commits':  renderHomeGitLogCommits(data.gitLog),
    'projects_rows':   renderHomeProjectsRows(data.projects),
    'pets_rows':       renderHomePetsRows(data.pets),
    'stack_lines':     renderHomeStackLines(data.stack),
    'history_kvs':     renderHomeHistoryKVs(data.history),
    'signoff_echo':    esc(data.signoff.echo),
    'signoff_end':     esc(data.signoff.end),
  };

  for (const [k, v] of Object.entries(replacements)) {
    const token = `<!-- @data:${k} -->`;
    if (!html.includes(token)) {
      console.warn(`  ⚠ home.html 缺少 token: ${token}`);
    }
    html = html.replace(token, v);
  }

  fs.writeFileSync(HOME_OUT_FILE, html, 'utf8');
}

// ============================================================
// 主流程
// ============================================================

function main() {
  if (!fs.existsSync(DATA_DIR)) {
    console.error(`✗ 数据目录不存在: ${DATA_DIR}`);
    process.exit(1);
  }

  // 1. 详情页
  const files = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith('.md'));
  let ok = 0, fail = 0;
  const errors = [];
  for (const f of files) {
    const slug = f.replace(/\.md$/, '');
    try {
      buildOne(slug);
      console.log(`  ✓ p/${slug}.html`);
      ok++;
    } catch (e) {
      console.error(`  ✗ ${slug}: ${e.message}`);
      errors.push({ slug, err: e });
      fail++;
    }
  }

  // 2. V1 主页
  try {
    buildHome();
    console.log(`  ✓ index.html (V1 主页)`);
    ok++;
  } catch (e) {
    console.error(`  ✗ index.html: ${e.message}`);
    errors.push({ slug: 'index', err: e });
    fail++;
  }

  console.log(`\n构建完成: ${ok} ok · ${fail} fail`);
  if (fail) process.exit(1);
}

main();
