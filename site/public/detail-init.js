/* 详情页初始化（CSP 兼容：从 _base.html inline 提取）
 * - 根据 referrer 设置回主页 link 指向 V1 (/v1/) 或 V2 (/)
 * - 触发 [data-reveal] 元素的入场动画
 */
(function () {
  'use strict';

  // 回主页链接：根据 referrer 判断访客来自 V1 还是 V2
  const fromV1 = document.referrer.includes('/v1/');
  const homeUrl = fromV1 ? '/v1/' : '/';
  document.querySelectorAll('.back-link a, .signoff .end a').forEach((a) =>
    a.setAttribute('href', homeUrl),
  );

  // 入场动画
  const reveals = document.querySelectorAll('[data-reveal]');
  reveals.forEach((el, i) => {
    el.style.transitionDelay = i * 0.06 + 's';
  });

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      }
    },
    { threshold: 0.05 },
  );
  reveals.forEach((el) => io.observe(el));

  // Fallback：100ms 后强制把仍未 .in 的元素显示出来
  // （防 IO 在某些场景未 fire，例如元素已在 viewport 但 layout 未稳）
  setTimeout(() => {
    reveals.forEach((el) => el.classList.add('in'));
  }, 100);
})();
