/* Organize pages: every page of one or more PDFs as a picture. Drag to reorder, rotate, copy, delete,
 * add blank pages, reverse; then save one new PDF. */
(() => {
  'use strict';
  const { $, esc } = FM;
  const P = window.PdfOps;

  let kit;
  let entries = []; // { key, item (id), page, rot, blank: [w, h] | null, thumb }
  let nextKey = 1;
  const docs = new Map(); // item id -> mupdf Document
  let dragKey = null;

  async function docFor(it) {
    if (!docs.has(it.id)) {
      const m = await FM.mupdf();
      docs.set(it.id, m.Document.openDocument(new Uint8Array(await it.file.arrayBuffer()), 'application/pdf'));
    }
    return docs.get(it.id);
  }

  /** Keeps the page list in step with the files: pages of new files are added at the end. */
  async function sync(items) {
    const ids = new Set(items.map((x) => x.id));
    entries = entries.filter((e) => e.item == null || ids.has(e.item));
    for (const id of [...docs.keys()]) if (!ids.has(id)) docs.delete(id);
    const known = new Set(entries.map((e) => e.item));
    for (const it of items) {
      if (known.has(it.id) || !it.loaded || it.error || it.locked || !it.pages) continue;
      known.add(it.id);
      for (let p = 0; p < it.pages; p++) entries.push({ key: nextKey++, item: it.id, page: p, rot: 0, blank: null, thumb: null });
    }
    draw();
    thumbs(items);
  }

  let thumbing = false;
  async function thumbs(items) {
    if (thumbing) return;
    thumbing = true;
    try {
      const m = await FM.mupdf();
      for (;;) {
        const e = entries.find((x) => !x.thumb && !x.blank);
        if (!e) break;
        const it = items.find((x) => x.id === e.item) || kit.items.find((x) => x.id === e.item);
        if (!it) { e.thumb = 'none'; continue; }
        const doc = await docFor(it);
        const page = doc.loadPage(e.page);
        const b = page.getBounds();
        const k = 240 / Math.max(b[2] - b[0], b[3] - b[1]);
        const pix = page.toPixmap(m.Matrix.scale(k, k), m.ColorSpace.DeviceRGB, false, true);
        const url = URL.createObjectURL(new Blob([pix.asPNG().slice()], { type: 'image/png' }));
        entries.filter((x) => x.item === e.item && x.page === e.page && !x.thumb).forEach((x) => {
          x.thumb = url;
          const box = document.querySelector(`.pg-card[data-key="${x.key}"] .pg-img`);
          if (box) box.innerHTML = `<img src="${url}" alt=""${x.rot ? ` style="transform:rotate(${x.rot}deg)"` : ''}>`;
        });
        await FMKit.yieldUI();
      }
    } finally { thumbing = false; }
  }

  function fileName(id) {
    const it = kit.items.find((x) => x.id === id);
    return it ? it.file.name : '';
  }

  function draw() {
    const grid = $('pageGrid');
    const many = new Set(entries.map((e) => e.item).filter((x) => x != null)).size > 1;
    grid.innerHTML = entries.map((e, i) => {
      const style = e.rot ? ` style="transform:rotate(${e.rot}deg)"` : '';
      const bs = e.blank ? (() => { const k = 136 / Math.max(e.blank[0], e.blank[1]); return `width:${Math.round(e.blank[0] * k)}px;height:${Math.round(e.blank[1] * k)}px;${e.rot ? `transform:rotate(${e.rot}deg)` : ''}`; })() : '';
      const pic = e.blank ? `<div class="pg-blank" style="${bs}"></div>` : e.thumb && e.thumb !== 'none' ? `<img src="${e.thumb}" alt=""${style}>` : '<span class="hint">…</span>';
      const sub = e.blank ? 'blank' : `${many ? esc(fileName(e.item)) + ' · ' : ''}p ${e.page + 1}`;
      return `<div class="pg-card" draggable="true" data-key="${e.key}" tabindex="0">
        <div class="pg-btns"><button type="button" data-a="rot" title="Rotate" aria-label="Rotate">↻</button><button type="button" data-a="dup" title="Copy" aria-label="Copy">⧉</button><button type="button" data-a="del" title="Delete" aria-label="Delete">✕</button></div>
        <div class="pg-img">${pic}</div>
        <div class="pg-num" translate="no"><b>${i + 1}</b> · ${sub}</div>
      </div>`;
    }).join('') || '<p class="hint">All pages were removed. Add a file, or click "Start over".</p>';
    $('kitEst').textContent = entries.length ? `${entries.length} page(s) in the new PDF` : '';
  }

  const grid = $('pageGrid');
  grid.addEventListener('click', (ev) => {
    const b = ev.target.closest('button[data-a]');
    if (!b) return;
    const key = Number(b.closest('.pg-card').dataset.key);
    const i = entries.findIndex((x) => x.key === key);
    if (b.dataset.a === 'rot') entries[i].rot = (entries[i].rot + 90) % 360;
    if (b.dataset.a === 'dup') entries.splice(i + 1, 0, { ...entries[i], key: nextKey++ });
    if (b.dataset.a === 'del') entries.splice(i, 1);
    draw();
  });
  grid.addEventListener('dragstart', (ev) => {
    const c = ev.target.closest('.pg-card');
    if (!c) return;
    dragKey = Number(c.dataset.key);
    c.classList.add('dragging');
    ev.dataTransfer.effectAllowed = 'move';
    ev.stopPropagation();
  });
  grid.addEventListener('dragover', (ev) => {
    if (dragKey == null) return;
    ev.preventDefault();
    ev.stopPropagation();
    grid.querySelectorAll('.drop-before').forEach((x) => x.classList.remove('drop-before'));
    const c = ev.target.closest('.pg-card');
    if (c) c.classList.add('drop-before');
  });
  grid.addEventListener('drop', (ev) => {
    if (dragKey == null) return;
    ev.preventDefault();
    ev.stopPropagation();
    const c = ev.target.closest('.pg-card');
    move(dragKey, c ? Number(c.dataset.key) : null);
    dragKey = null;
  });
  grid.addEventListener('dragend', () => { dragKey = null; draw(); });
  // keyboard: arrows move the focused page
  grid.addEventListener('keydown', (ev) => {
    const c = ev.target.closest('.pg-card');
    if (!c || !['ArrowLeft', 'ArrowRight', 'Delete'].includes(ev.key)) return;
    const key = Number(c.dataset.key);
    const i = entries.findIndex((x) => x.key === key);
    if (ev.key === 'Delete') entries.splice(i, 1);
    else {
      const j = Math.max(0, Math.min(entries.length - 1, i + ((ev.key === 'ArrowRight') !== (document.dir === 'rtl') ? 1 : -1)));
      const [e] = entries.splice(i, 1);
      entries.splice(j, 0, e);
    }
    draw();
    const again = grid.querySelector(`.pg-card[data-key="${key}"]`);
    if (again) again.focus();
    ev.preventDefault();
  });

  // touch screens: press and hold a page, then drag it
  let hold = null;
  grid.addEventListener('touchstart', (ev) => {
    const c = ev.target.closest('.pg-card');
    if (!c || ev.target.closest('button') || ev.touches.length > 1) return;
    const t = ev.touches[0];
    hold = { key: Number(c.dataset.key), x: t.clientX, y: t.clientY, on: false, card: c };
    hold.timer = setTimeout(() => { if (hold) { hold.on = true; c.classList.add('dragging'); if (navigator.vibrate) navigator.vibrate(15); } }, 350);
  }, { passive: true });
  grid.addEventListener('touchmove', (ev) => {
    if (!hold) return;
    const t = ev.touches[0];
    if (!hold.on) {
      if (Math.abs(t.clientX - hold.x) + Math.abs(t.clientY - hold.y) > 10) { clearTimeout(hold.timer); hold = null; }
      return;
    }
    ev.preventDefault();
    grid.querySelectorAll('.drop-before').forEach((x) => x.classList.remove('drop-before'));
    const under = document.elementFromPoint(t.clientX, t.clientY);
    const c = under && under.closest('.pg-card');
    if (c && c !== hold.card) { c.classList.add('drop-before'); hold.before = Number(c.dataset.key); } else hold.before = undefined;
  }, { passive: false });
  grid.addEventListener('touchend', () => {
    if (!hold) return;
    clearTimeout(hold.timer);
    if (hold.on) { if (hold.before !== undefined) move(hold.key, hold.before); else draw(); }
    hold = null;
  });

  function move(from, before) {
    const i = entries.findIndex((x) => x.key === from);
    const [e] = entries.splice(i, 1);
    const j = before == null ? entries.length : entries.findIndex((x) => x.key === before);
    entries.splice(j === -1 ? entries.length : j, 0, e);
    draw();
  }

  $('rotAllL').addEventListener('click', () => { entries.forEach((e) => { e.rot = (e.rot + 270) % 360; }); draw(); });
  $('rotAllR').addEventListener('click', () => { entries.forEach((e) => { e.rot = (e.rot + 90) % 360; }); draw(); });
  $('reverse').addEventListener('click', () => { entries.reverse(); draw(); });
  $('addBlank').addEventListener('click', () => {
    const last = entries[entries.length - 1];
    let size = [595.28, 841.89];
    const it = last && last.item != null && kit.items.find((x) => x.id === last.item);
    if (last && last.blank) size = last.blank;
    else if (it && it.size0) size = it.size0;
    entries.push({ key: nextKey++, item: null, page: -1, rot: 0, blank: size, thumb: null });
    draw();
    grid.lastElementChild.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  async function run(items, ui) {
    const m = await FM.mupdf();
    if (!entries.length) throw new Error('There are no pages left. Add a file, or click "Start over".');
    const out = new m.PDFDocument();
    const maps = new Map();
    const srcs = new Map();
    for (const [i, e] of entries.entries()) {
      if (i % 20 === 0) { ui.progress(i, entries.length, `page ${i + 1} of ${entries.length}`); await ui.yield(); }
      if (e.blank) {
        out.insertPage(-1, out.addPage([0, 0, e.blank[0], e.blank[1]], e.rot, {}, ''));
        continue;
      }
      const it = items.find((x) => x.id === e.item);
      if (!srcs.has(e.item)) { srcs.set(e.item, await FM.openPdf(it.file)); maps.set(e.item, out.newGraftMap()); }
      maps.get(e.item).graftPage(-1, srcs.get(e.item), e.page);
      if (e.rot) {
        const page = out.loadPage(out.countPages() - 1);
        P.setRotation(page, P.getRotation(page) + e.rot);
      }
    }
    let name = $('outName').value.trim() || 'organized.pdf';
    if (!/\.pdf$/i.test(name)) name += '.pdf';
    const bytes = out.saveToBuffer('garbage=4,compress').asUint8Array().slice();
    ui.progress(1, 1);
    return [{ name: FMKit.safeName(name), bytes, type: 'application/pdf', note: `${entries.length} page(s)` }];
  }

  kit = FMKit.init({
    key: 'pages', accept: 'pdf', runLabel: 'Save PDF', makes: 'pdf', busyTitle: 'Saving…', view: 'rows',
    run,
    onItems: (items) => { sync(items); },
    doneTitle: () => 'Your new PDF is ready',
  });
})();
