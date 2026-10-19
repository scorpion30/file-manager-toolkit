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

  document.addEventListener('DOMContentLoaded', () => {
    wrapCards();
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
