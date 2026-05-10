/* reveal 动画（沿用 v1，从 inline script 提取以满足 CSP script-src 'self'） */
(function () {
  'use strict';
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    }
  }, { threshold: 0.05 });
  document.querySelectorAll('[data-reveal]').forEach((el, i) => {
    el.style.transitionDelay = (i * 0.06) + 's';
    io.observe(el);
  });
})();
