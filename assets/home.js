/* Home page: tool filter (All / File / PDF / Review / Favourites), search box and favourite stars.
 * The header links #files, #pdf and #review pick the matching filter, so they keep working.
 * Favourites are kept in this browser only (localStorage). */
(() => {
  'use strict';
  const groups = { files: 'files', pdf: 'pdf', review: 'review' };
  const KEY = 'fm-favs';
  const ar = document.documentElement.lang === 'ar';
  let filter = 'all';
  let favs = [];
  try { favs = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { favs = []; }
  const saveFavs = () => { try { localStorage.setItem(KEY, JSON.stringify(favs)); } catch { /* ignore */ } };
  const norm = (t) => (t || '').toLowerCase().replace(/[ً-ْ]/g, '').replace(/[أإآ]/g, 'ا').replace(/\s+/g, ' ');

  function apply() {
    const q = norm(document.getElementById('toolSearch')?.value.trim());
    let shown = 0;
    document.querySelectorAll('.filter [data-filter]').forEach((b) => {
      const on = b.dataset.filter === filter;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    document.querySelectorAll('.tool-group').forEach((g) => {
      let groupShown = 0;
      g.querySelectorAll('.tool-wrap').forEach((w) => {
        const card = w.querySelector('.tool-card');
        const href = card.getAttribute('href');
        const okFilter = filter === 'all' || filter === g.id || (filter === 'fav' && favs.includes(href));
        const okSearch = !q || norm(card.innerText).includes(q);
        const show = okFilter && okSearch && !(filter === 'fav' && card.classList.contains('request'));
        w.hidden = !show;
        if (show) { groupShown++; shown++; }
      });
      g.hidden = groupShown === 0;
    });
    const none = document.getElementById('noResults');
    if (none) none.hidden = shown > 0;
  }

  function wrapCards() {
    document.querySelectorAll('.tool-grid > .tool-card').forEach((card) => {
      const wrap = document.createElement('div');
      wrap.className = 'tool-wrap' + (card.classList.contains('featured') ? ' featured-wrap' : '');
      card.replaceWith(wrap);
      wrap.append(card);
      if (card.classList.contains('request')) return;
      const href = card.getAttribute('href');
      const name = card.querySelector('h3')?.textContent || '';
      const star = document.createElement('button');
      star.type = 'button';
      star.className = 'fav-btn';
      star.setAttribute('translate', 'no');
      const paint = () => {
        const on = favs.includes(href);
        star.textContent = on ? '★' : '☆';
        star.setAttribute('aria-pressed', on ? 'true' : 'false');
        star.setAttribute('aria-label', (ar ? (on ? 'إزالة من المفضلة: ' : 'إضافة للمفضلة: ') : (on ? 'Remove from favourites: ' : 'Add to favourites: ')) + name);
      };
      paint();
      star.addEventListener('click', () => {
        favs = favs.includes(href) ? favs.filter((h) => h !== href) : favs.concat(href);
        saveFavs();
        paint();
        apply();
      });
      wrap.append(star);
    });
  }

  function fromHash() {
    const id = location.hash.slice(1);
    if (groups[id]) {
      filter = id;
      apply();
      document.querySelector('.tools-head')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }


  // ---------- looping demos in the four main cards ----------
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
    if (reduced) {
      steps.forEach((_, k) => show(k));
      if (typed) typed.textContent = typed.dataset.text;
      return;
    }
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !timer) tick();
    }, { threshold: 0.4 }).observe(demo);
  }

  document.addEventListener('DOMContentLoaded', () => {
    wrapCards();
    document.querySelectorAll('.hx-anim').forEach(startDemo);
    document.querySelectorAll('.filter [data-filter]').forEach((b) => {
      b.addEventListener('click', () => {
        filter = b.dataset.filter;
        apply();
        history.replaceState(null, '', filter === 'all' || filter === 'fav' ? '#tools' : '#' + filter);
      });
    });
    const search = document.getElementById('toolSearch');
    search?.addEventListener('input', apply);
    document.addEventListener('keydown', (e) => {
      if (e.key === '/' && search && document.activeElement !== search && !/input|textarea/i.test(document.activeElement?.tagName || '')) {
        e.preventDefault();
        search.focus();
        search.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
    apply();
    fromHash();
  });
  addEventListener('hashchange', fromHash);
})();
