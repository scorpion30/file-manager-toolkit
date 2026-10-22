/* Small "how it works" demos (.hx-anim): a cursor does the tool's steps in a loop.
 * With data-play they play while on screen (tool pages); without it they show the finished
 * result as a still picture (home page cards). */
(() => {
  'use strict';
  // Each step adds a class (s-a, s-b…) to the demo; the CSS moves the cursor and shows the result.
  // [class, ms, caption index, button to press]
  const TIMELINES = {
    list: [['a', 1300, 0], ['b', 1100, 1, '.a-export'], ['c', 1700, 2], ['d', 2000, 2]],
    titleblock: [['a', 700, 0], ['b', 1300, 0], ['c1', 500, 1], ['c2', 450, 1], ['c3', 1000, 1], ['d', 1800, 2, '.a-apply']],
    extract: [['b1', 750, 0], ['b2', 750, 0], ['b3', 900, 0], ['r1', 350, 1], ['r2', 350, 1], ['r3', 350, 1], ['r4', 900, 1], ['d', 1700, 2]],
    rename: [['a', 1500, 0], ['b', 1400, 1, '.a-ok'], ['c', 1500, 1], ['d', 1600, 2]],
  };
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function startDemo(demo) {
    const steps = TIMELINES[demo.dataset.anim];
    const captions = [...demo.parentElement.querySelectorAll('.hx-steps li')];
    const cursor = demo.querySelector('.a-cur');
    const typed = demo.querySelector('.a-type');
    let i = 0;
    let timer = null;
    let visible = false;
    const reset = () => {
      demo.className = demo.className.replace(/\bs-\S+/g, '').trim();
      if (typed) typed.textContent = '';
    };
    const show = (k) => {
      const [cls, , cap, press] = steps[k];
      demo.classList.add('s-' + cls);
      captions.forEach((c, n) => c.classList.toggle('on', n === cap));
      if (typed && cls === 'a') {
        const text = typed.dataset.text;
        [...text].forEach((_, n) => setTimeout(() => { typed.textContent = text.slice(0, n + 1); }, 250 + n * 140));
      }
      if (press) {
        setTimeout(() => {
          const btn = demo.querySelector(press);
          cursor.classList.add('down');
          btn.classList.add('press');
          setTimeout(() => { cursor.classList.remove('down'); btn.classList.remove('press'); }, 220);
        }, 600);
      }
    };
    const tick = () => {
      if (!visible) { timer = null; return; }
      if (i === steps.length) { reset(); i = 0; timer = setTimeout(tick, 500); return; }
      show(i);
      timer = setTimeout(tick, steps[i++][1]);
    };
    if (reduced || !demo.hasAttribute('data-play')) {
      // Still picture: the finished result, no cursor.
      demo.classList.add('still');
      steps.forEach((k) => demo.classList.add('s-' + k[0]));
      if (typed) typed.textContent = typed.dataset.text;
      return;
    }
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !timer) tick();
    }, { threshold: 0.4 }).observe(demo);
  }


  const init = () => document.querySelectorAll('.hx-anim').forEach(startDemo);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
