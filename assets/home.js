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


  // ---------- drop a folder / PDFs on a top card to open it in that tool ----------
  // Saves the dropped handles in IndexedDB (same store as FM.saveHandoff in common.js) and opens
  // the tool with ?dropped, so the visitor skips the "choose a folder" step. Chrome / Edge only.
  const T = (en, arText) => (ar ? arText : en);
  function homeToast(msg) {
    let box = document.getElementById('toasts');
    if (!box) { box = document.createElement('div'); box.className = 'toasts'; box.id = 'toasts'; document.body.appendChild(box); }
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    box.appendChild(el);
    setTimeout(() => el.remove(), 4500);
  }
  function saveHandoff(handles) {
    return new Promise((resolve, reject) => {
      const r = indexedDB.open('fm-drop', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('h');
      r.onerror = () => reject(r.error);
      r.onsuccess = () => {
        const db = r.result;
        const tx = db.transaction('h', 'readwrite');
        tx.objectStore('h').put({ at: Date.now(), handles }, 'last');
        tx.oncomplete = () => { db.close(); resolve(); };
        tx.onerror = () => reject(tx.error);
      };
    });
  }
  const log = (k) => { try { window.FMlog && window.FMlog(k); } catch { /* ignore */ } };

  function wireCardDrop() {
    const cards = [...document.querySelectorAll('.hx-cards .hx-card[data-drop]')];
    if (!cards.length) return;
    const supported = typeof DataTransferItem !== 'undefined' && 'getAsFileSystemHandle' in DataTransferItem.prototype;
    const hasFiles = (e) => [...((e.dataTransfer && e.dataTransfer.types) || [])].includes('Files');
    // A file dropped next to the cards must not make the browser open it instead of the site.
    document.addEventListener('dragover', (e) => { if (hasFiles(e)) e.preventDefault(); });
    document.addEventListener('drop', (e) => { if (hasFiles(e)) e.preventDefault(); });

    if (supported && matchMedia('(pointer: fine)').matches) {
      const tip = document.createElement('p');
      tip.className = 'hx-droptip';
      tip.innerHTML = T('<b>Tip:</b> drag a folder from your computer onto a card to open it straight in that tool.',
        '<b>نصيحة:</b> اسحب فولدر من جهازك وارميه على أي كارت، يفتح على طول في الأداة دي.');
      document.querySelector('.hx-cards').after(tip);
    }

    cards.forEach((card) => {
      const pdf = card.dataset.drop === 'pdf';
      const href = card.querySelector('.btn.primary').getAttribute('href');
      const veil = document.createElement('div');
      veil.className = 'hx-drop';
      veil.setAttribute('aria-hidden', 'true');
      veil.innerHTML = `<span class="hx-drop-ico">📂</span><b>${pdf ? T('Drop PDFs or a folder', 'ارمي ملفات PDF أو فولدر') : T('Drop the folder here', 'ارمي الفولدر هنا')}</b>
        <small>${T('It opens in this tool', 'هيفتح في الأداة دي')}</small>`;
      card.appendChild(veil);
      let depth = 0;
      card.addEventListener('dragenter', (e) => { if (!hasFiles(e)) return; depth++; card.classList.add('dragover'); });
      card.addEventListener('dragleave', () => { depth = Math.max(0, depth - 1); if (!depth) card.classList.remove('dragover'); });
      card.addEventListener('dragover', (e) => { if (!hasFiles(e)) return; e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; });
      card.addEventListener('drop', async (e) => {
        if (!hasFiles(e)) return;
        e.preventDefault();
        e.stopPropagation();
        depth = 0;
        card.classList.remove('dragover');
        if (!supported) {
          homeToast(T('Dropping works in Chrome and Edge. Opening the tool…', 'السحب والإفلات شغال في Chrome و Edge. بنفتحلك الأداة…'));
          setTimeout(() => { location.href = href; }, 1500);
          return;
        }
        // getAsFileSystemHandle() must be called for every item before the first await.
        const pending = [...e.dataTransfer.items].filter((i) => i.kind === 'file').map((i) => i.getAsFileSystemHandle());
        let handles = (await Promise.all(pending.map((p) => p.catch(() => null)))).filter(Boolean);
        handles = pdf ? handles.filter((h) => h.kind === 'directory' || /\.pdf$/i.test(h.name))
          : handles.filter((h) => h.kind === 'directory').slice(0, 1);
        if (!handles.length) {
          homeToast(pdf ? T('Drop PDF files or a folder.', 'ارمي ملفات PDF أو فولدر.') : T('Drop a folder, not a file.', 'ارمي فولدر، مش ملف.'));
          return;
        }
        card.classList.add('opening');
        log('home-drop-' + href.replace(/\.html.*$/, ''));
        try { await saveHandoff(handles); location.href = href + (href.includes('?') ? '&' : '?') + 'dropped'; }
        catch { location.href = href; }
      });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    wrapCards();
    wireCardDrop();
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
