/* Split PDF: page ranges, every N pages, parts under a file size, one file per bookmark, extract
 * chosen pages, or every page. File names from a pattern. Many PDFs at once. */
(() => {
  'use strict';
  const P = window.PdfOps;
  const { $, formatBytes } = FM;
  const val = (name) => (document.querySelector(`input[name="${name}"]:checked`) || {}).value;

  function paint() {
    const mode = val('mode');
    document.querySelectorAll('#kitOpts [data-mode]').forEach((el) => { el.hidden = el.dataset.mode !== mode; });
  }

  const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
  /** "1-3, 5" from 0-based page numbers, in their order. */
  const label = (pages) => {
    const out = [];
    for (let i = 0; i < pages.length;) {
      let j = i;
      while (j + 1 < pages.length && pages[j + 1] === pages[j] + 1) j++;
      out.push(i === j ? String(pages[i] + 1) : `${pages[i] + 1}-${pages[j] + 1}`);
      i = j + 1;
    }
    return out.join(', ');
  };

  /** Bookmarks at the chosen level as [{title, page}], sorted by page. */
  function bookmarks(doc, level) {
    let list = [];
    try { list = doc.loadOutline() || []; } catch { list = []; }
    if (level === 2) list = list.flatMap((o) => (o.down && o.down.length ? o.down : [o]));
    return list.filter((o) => o.page != null && o.page >= 0).map((o) => ({ title: o.title || '', page: o.page })).sort((a, b) => a.page - b.page);
  }

  /** Parts: [{pages: [0-based], part: 'label'}] for one document. */
  function plan(doc, n, mode) {
    if (mode === 'each') return range(0, n - 1).map((p) => ({ pages: [p] }));
    if (mode === 'every') {
      const k = Math.max(1, Math.round(Number($('everyN').value) || 1));
      const parts = [];
      for (let a = 0; a < n; a += k) parts.push({ pages: range(a, Math.min(n, a + k) - 1) });
      return parts;
    }
    if (mode === 'ranges') {
      const specs = $('ranges').value.split(',').map((x) => x.trim()).filter(Boolean);
      if (!specs.length) throw new Error('Type the page ranges, for example 1-3, 4-');
      const parts = [];
      for (const sp of specs) {
        let pages;
        try { pages = P.parsePages(sp, n); } catch (e) {
          if (!/outside/.test(e.message)) throw e;
          pages = P.parsePages(sp, 100000).filter((i) => i < n);
        }
        if (pages.length) parts.push({ pages });
      }
      return parts;
    }
    if (mode === 'extract') {
      if (!$('extractPages').value.trim()) throw new Error('Type the pages to extract, for example 1, 3, 5-7');
      let pages;
      try { pages = P.parsePages($('extractPages').value, n); } catch (e) {
        if (!/outside/.test(e.message)) throw e;
        pages = P.parsePages($('extractPages').value, 100000).filter((i) => i < n);
      }
      return pages.length ? [{ pages, part: 'extract' }] : [];
    }
    if (mode === 'bookmarks') {
      const bm = bookmarks(doc, Number(val('bmLevel')));
      if (!bm.length) return null;
      const parts = [];
      if (bm[0].page > 0) parts.push({ pages: range(0, bm[0].page - 1), part: 'start' });
      bm.forEach((b, i) => {
        const end = i + 1 < bm.length ? bm[i + 1].page - 1 : n - 1;
        if (end >= b.page) parts.push({ pages: range(b.page, end), part: b.title });
        else if (parts.length && parts[parts.length - 1].pages[0] === b.page) { /* same page as the previous one */ }
      });
      return parts;
    }
    return [];
  }

  function build(m, src, pages) {
    const out = new m.PDFDocument();
    const map = out.newGraftMap();
    pages.forEach((p) => map.graftPage(-1, src, p));
    return out.saveToBuffer('garbage=4,compress').asUint8Array().slice();
  }

  /** Parts under maxBytes each, without cutting a page: grows each part, then narrows it down. */
  async function bySize(m, src, n, maxBytes, ui, report) {
    const parts = [];
    const avg = Math.max(1, (await src.__size) / n);
    let start = 0;
    while (start < n) {
      const left = n - start;
      const fits = (k) => { const b = build(m, src, range(start, start + k - 1)); return b.length <= maxBytes ? b : null; };
      let good = 1; let goodBytes = fits(1);
      if (!goodBytes) { // one page is already bigger than the limit: it gets its own file
        parts.push({ pages: [start], bytes: build(m, src, [start]), over: true });
        start += 1;
        continue;
      }
      let bad = left + 1;
      let k = Math.min(left, Math.max(2, Math.floor(maxBytes / avg)));
      // grow while it fits, then narrow down between the last size that fits and the first that does not
      while (k > good && k < bad) {
        await ui.yield();
        report(start);
        const b = fits(k);
        if (!b) { bad = k; break; }
        good = k; goodBytes = b;
        if (k === left) break;
        k = Math.min(left, k * 2);
      }
      while (bad - good > 1) {
        const mid = Math.floor((good + bad) / 2);
        await ui.yield();
        const b = fits(mid);
        if (b) { good = mid; goodBytes = b; } else bad = mid;
      }
      parts.push({ pages: range(start, start + good - 1), bytes: goodBytes });
      start += good;
    }
    return parts;
  }

  async function run(items, ui) {
    const m = await FM.mupdf();
    const mode = val('mode');
    const pattern = $('namePattern').value.trim() || '{name}-{part}';
    const out = [];
    const noBookmarks = [];
    for (const [k, it] of items.entries()) {
      ui.progress(k, items.length, it.file.name);
      await ui.yield();
      const src = await FM.openPdf(it.file);
      src.__size = it.file.size;
      const n = src.countPages();
      const base = FMKit.baseOf(it.file.name);
      let parts;
      if (mode === 'size') {
        const max = Number($('maxMb').value) * 1024 * 1024;
        if (!(max > 0)) throw new Error('Type the largest size for each part, for example 10 MB.');
        parts = await bySize(m, src, n, max, ui, (p) => ui.progress(k + p / n, items.length, `${it.file.name} · page ${p + 1} of ${n}`));
      } else {
        parts = plan(src, n, mode);
        if (parts === null) { noBookmarks.push(it.file.name); continue; }
      }
      const width = String(parts.length).length;
      for (const [j, part] of parts.entries()) {
        if (j % 5 === 0) { ui.progress(k + j / parts.length, items.length, `${it.file.name} · part ${j + 1} of ${parts.length}`); await ui.yield(); }
        const bytes = part.bytes || build(m, src, part.pages);
        const partName = part.part && part.part !== 'extract' ? part.part : String(j + 1).padStart(Math.max(2, width), '0');
        let name = pattern.replace(/\{name\}/g, base).replace(/\{part\}/g, part.part === 'extract' ? 'pages' : partName).replace(/\{pages\}/g, label(part.pages));
        name = FMKit.safeName(name.replace(/\.pdf$/i, '') + '.pdf');
        out.push({
          name, bytes, type: 'application/pdf', folder: it.folder,
          note: `${part.pages.length === 1 ? 'page' : 'pages'} ${label(part.pages)} · ${formatBytes(bytes.length)}${part.over ? ' · one page is over the limit' : ''}`,
          noteKind: part.over ? 'warn' : '',
        });
      }
    }
    ui.progress(1, 1);
    if (noBookmarks.length && !out.length) throw new Error(`${noBookmarks.join(', ')} has no bookmarks. Choose another way to split.`);
    if (noBookmarks.length) FM.toast(`No bookmarks, not split: ${noBookmarks.join(', ')}`, 'error');
    if (!out.length) throw new Error('No pages matched. Check the page numbers.');
    // names must be unique inside one folder
    const seen = new Map();
    for (const o of out) {
      const key = (o.folder || '') + '/' + o.name.toLowerCase();
      const c = seen.get(key) || 0;
      seen.set(key, c + 1);
      if (c) o.name = o.name.replace(/\.pdf$/i, ` (${c + 1}).pdf`);
    }
    return out;
  }

  FMKit.init({
    key: 'split', accept: 'pdf', runLabel: 'Split PDF', makes: 'pdf', busyTitle: 'Splitting…',
    run,
    zipName: () => 'split',
    estimate: async (items) => {
      paint();
      const mode = val('mode');
      const it = items[0];
      if (!it || !it.pages) return '';
      const n = it.pages;
      let parts = null;
      if (mode === 'each') parts = n;
      else if (mode === 'every') parts = Math.ceil(n / Math.max(1, Math.round(Number($('everyN').value) || 1)));
      else if (mode === 'ranges') parts = $('ranges').value.split(',').filter((x) => x.trim()).length;
      else if (mode === 'extract') parts = 1;
      else if (mode === 'size') { const max = Number($('maxMb').value) * 1048576; parts = max > 0 ? `about ${Math.max(1, Math.ceil(it.file.size / max))}` : null; }
      if (parts == null) return '';
      return `${items.length > 1 ? 'Each PDF' : it.file.name.length > 30 ? 'This PDF' : it.file.name} → ${parts} file(s)`;
    },
  });
  $('kitOpts').addEventListener('change', paint);
  paint();
})();
