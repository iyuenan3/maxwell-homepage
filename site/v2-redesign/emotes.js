/* ============================================================
   Glasses Emote System v1 — 主页集成版
   ------------------------------------------------------------
   依赖：DOM 中存在 .avatar-emote 容器,内部有 .ae-face / .ae-mouth
   暴露：window.glassesEmote = { set, opening, loading, typing, stop, idle }
   ============================================================ */

(function () {
  'use strict';

  // ── EMOTE LIBRARY ──────────────────────────────────────
  const EMOTES = {
    idle:     { face: '[●][●]', mouth: '',     name: '待机' },
    blink:    { face: '[─][─]', mouth: '',     name: '眨眼' },
    wink:     { face: '[●][─]', mouth: 'ᴗ',    name: '俏皮眨眼' },
    happy:    { face: '[◠][◠]', mouth: 'ᴗ',    name: '开心' },
    smile:    { face: '[●][●]', mouth: '◡',    name: '微笑' },
    sleep:    { face: '[z][z]', mouth: '___',  name: '休眠' },
    sleepy:   { face: '[─][─]', mouth: '~zZ',  name: '困倦' },
    surprise: { face: '[○][○]', mouth: 'o',    name: '惊讶' },
    shock:    { face: '[◎][◎]', mouth: 'O',    name: '震惊' },
    focus:    { face: '[━][━]', mouth: '—',    name: '专注' },
    squint:   { face: '[›][‹]', mouth: '⌒',    name: '审视' },
    look_l:   { face: '[●·][●·]', mouth: '',   name: '左看' },
    look_r:   { face: '[·●][·●]', mouth: '',   name: '右看' },
    look_up:  { face: '[˙][˙]', mouth: '',     name: '抬头' },
    curious:  { face: '[●·][·●]', mouth: '?',  name: '好奇' },
    loading:  { face: '[◐][◑]', mouth: '···',  name: '加载' },
    typing:   { face: '[●][●]', mouth: '___',  name: '打字' },
    cool:     { face: '[■][■]', mouth: '—',    name: '酷' },
    love:     { face: '[♥][♥]', mouth: 'ᴗ',    name: '喜欢' },
    error:    { face: '[✕][✕]', mouth: '×',    name: '出错' },
    success:  { face: '[✓][✓]', mouth: 'ᴗ',    name: '成功' },
    glitch:   { face: '[#][@]', mouth: '!?',   name: '故障' },
  };

  const OPENING_FRAMES = [
    { face: ' ',   mouth: '',  ms: 200 },
    { face: ' .   . ',  mouth: '',  ms: 220 },
    { face: '──   ──',  mouth: '',  ms: 260 },
    { face: '──   ──',  mouth: '',  ms: 180 },
    { face: '[─] [─]',  mouth: '',  ms: 280 },
    { face: '[─] [─]',  mouth: '',  ms: 150 },
    { face: '[●] [●]',  mouth: '',  ms: 120 },
    { face: '[─] [─]',  mouth: '',  ms: 90  },
    { face: '[●] [●]',  mouth: '',  ms: 200 },
    { face: '[●][●]',   mouth: '',  ms: 200 },
    { face: '[●][●]',   mouth: 'ᴗ', ms: 600 },
  ];

  // ── STATE ───────────────────────────────────────────────
  let $face = null;
  let $mouth = null;
  let $container = null;
  let openingTimer = null;
  let animTimer = null;
  let idleTimer1 = null;  // 30s → sleepy
  let idleTimer2 = null;  // 60s → sleep

  function ensureBound() {
    if ($face && $mouth) return true;
    $container = document.querySelector('.avatar-emote');
    if (!$container) return false;
    $face = $container.querySelector('.ae-face');
    $mouth = $container.querySelector('.ae-mouth');
    return !!($face && $mouth);
  }

  function clearTimers() {
    if (openingTimer) { clearTimeout(openingTimer); openingTimer = null; }
    if (animTimer)    { clearInterval(animTimer);   animTimer = null; }
  }

  function clearIdle() {
    if (idleTimer1) { clearTimeout(idleTimer1); idleTimer1 = null; }
    if (idleTimer2) { clearTimeout(idleTimer2); idleTimer2 = null; }
  }

  function scheduleIdle() {
    clearIdle();
    idleTimer1 = setTimeout(() => set('sleepy'), 30000);
    idleTimer2 = setTimeout(() => set('sleep'),  60000);
  }

  // ── PUBLIC: set(key) ────────────────────────────────────
  function set(key) {
    if (!ensureBound()) return;
    clearTimers();
    if (key === 'loading') return playLoading();
    if (key === 'typing')  return playTyping();
    const e = EMOTES[key];
    if (!e) return;
    $face.textContent = e.face;
    $mouth.textContent = e.mouth || ' ';
    $container.classList.remove('is-loading', 'is-booting');
    if (key === 'idle' || key === 'smile') scheduleIdle();
  }

  function idle() { set('idle'); }

  // ── PUBLIC: opening animation ───────────────────────────
  function opening() {
    if (!ensureBound()) return;
    clearTimers();
    clearIdle();
    $container.classList.add('is-booting');
    let i = 0;
    const step = () => {
      if (i >= OPENING_FRAMES.length) {
        $container.classList.remove('is-booting');
        set('idle');
        return;
      }
      const f = OPENING_FRAMES[i];
      $face.textContent = f.face;
      $mouth.textContent = f.mouth || ' ';
      i++;
      openingTimer = setTimeout(step, f.ms);
    };
    step();
  }

  // ── PUBLIC: loading (动) ────────────────────────────────
  function playLoading() {
    if (!ensureBound()) return;
    clearTimers();
    clearIdle();
    $container.classList.add('is-loading');
    const frames = ['[◐][◑]', '[◓][◒]', '[◑][◐]', '[◒][◓]'];
    const dots   = ['.  ', '.. ', '...', '   '];
    let i = 0;
    animTimer = setInterval(() => {
      $face.textContent = frames[i % frames.length];
      $mouth.textContent = dots[i % dots.length];
      i++;
    }, 220);
  }

  // ── PUBLIC: typing (动) ─────────────────────────────────
  function playTyping() {
    if (!ensureBound()) return;
    clearTimers();
    clearIdle();
    $container.classList.remove('is-loading');
    const mouths = ['_     ', ' _    ', '  _   ', '   _  ', '    _ ', '     _'];
    let i = 0;
    $face.textContent = '[●][●]';
    animTimer = setInterval(() => {
      $mouth.textContent = mouths[i % mouths.length];
      i++;
    }, 140);
  }

  function stop() {
    clearTimers();
    set('idle');
  }

  // ── PUBLIC: short flash (短暂表情后回 idle) ─────────────
  function flash(key, ms = 1200) {
    set(key);
    setTimeout(() => set('idle'), ms);
  }

  // ── EXPORT ──────────────────────────────────────────────
  window.glassesEmote = {
    set, idle, opening, loading: playLoading, typing: playTyping, stop, flash,
    EMOTES,  // expose for debugging / commands.js
  };

  // ── AUTO-INIT ───────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    if (!ensureBound()) return;
    const FIRST_VISIT = !sessionStorage.getItem('glasses-opened');
    if (FIRST_VISIT) {
      sessionStorage.setItem('glasses-opened', '1');
      opening();
    } else {
      set('idle');
    }
  });
})();
