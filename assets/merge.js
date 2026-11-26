/* Merge PDF (Merge Pro): files or whole folders in natural order, a bookmark per file or per folder,
 * the bookmarks inside each file kept, an optional clickable table of contents, the file name in the
 * footer, and blank pages for double-sided printing. */
(() => {
  'use strict';
  const P = window.PdfOps;
  const { $ } = FM;
  const val = (name) => (document.querySelector(`input[name="${name}"]:checked`) || {}).value;

  /** Writes text in Helvetica, or as a picture of the text for other scripts (Arabic names). */
  async function write(m, doc, page, text, { x, y, size, color = '#000000', align = 'left', bold = false }) {
    if (P.isLatin(text)) return P.drawText(m, doc, page, { text, x, y, size, color: FMKit.hexRgb(color), align, bold });
    const png = await FMKit.textPng(text, { size, color, bold });
    const w = png.w / png.scale; const h = png.h / png.scale;
    const left = align === 'left' ? x - size * 0.1 : align === 'right' ? x - w : x - w / 2;
    P.drawImage(m, doc, page, doc.addImage(new m.Image(png.bytes)), { x: left, y: y + size * 0.36 - h / 2, w, h });
    return w;
  }
  const fit = (s, n) => (s.length > n ? s.slice(0, n - 1) + '…' : s);

  /** Outline items (from loadOutline) with their page numbers moved by `by`. */
  function shifted(list, by) {
    return (list || []).filter((o) => o.page != null && o.page >= 0).map((o) => ({ title: o.title || '', page: o.page + by, children: shifted(o.down, by) }));
  }

  async function run(items, ui) {
    const m = await FM.mupdf();
    const s = { bm: val('bm'), keep: $('keepBm').checked, toc: $('toc').checked, footer: $('footer').checked, blank: $('blank').checked };
    const out = new m.PDFDocument();
    const parts = []; // { title, folder, start, inner }
    for (const [k, it] of items.entries()) {
      ui.progress(k, items.length, it.file.name);
      await ui.yield();
      const src = await FM.openPdf(it.file);
      const n = src.countPages();
      const start = out.countPages();
      const map = out.newGraftMap();
      for (let p = 0; p < n; p++) {
        map.graftPage(-1, src, p);
        if (p % 25 === 24) await ui.yield();
      }
      let inner = [];
      if (s.keep) { try { inner = shifted(src.loadOutline(), start); } catch { inner = []; } }
      parts.push({ title: FMKit.baseOf(it.file.name), folder: it.folder, start, inner });
      if (s.footer) {
        for (let p = 0; p < n; p++) {
          const page = out.loadPage(start + p);
          const { W } = P.pageSpace(m, page);
          await write(m, out, page, it.file.name, { x: W / 2, y: 12, size: 7, color: '#555555', align: 'center' });
        }
      }
      if (s.blank && n % 2 === 1 && k < items.length - 1) {
        const b = out.loadPage(out.countPages() - 1).getBounds();
        out.insertPage(-1, out.addPage([0, 0, b[2] - b[0], b[3] - b[1]], 0, {}, ''));
      }
    }

    // ----- table of contents at the front -----
    let tocPages = 0;
    if (s.toc) {
      const PER = 34; const W = 595.28; const H = 841.89;
      tocPages = Math.ceil(parts.length / PER);
      for (let t = 0; t < tocPages; t++) out.insertPage(t, out.addPage([0, 0, W, H], 0, {}, ''));
      for (let t = 0; t < tocPages; t++) {
        const page = out.loadPage(t);
        let y = H - 72;
        if (t === 0) { await write(m, out, page, 'Contents', { x: 56, y, size: 22, bold: true }); y -= 40; }
        for (const part of parts.slice(t * PER, (t + 1) * PER)) {
          const target = part.start + tocPages;
          const label = fit((part.folder ? part.folder + ' / ' : '') + part.title, 80);
          await write(m, out, page, label, { x: 56, y, size: 10.5 });
          P.drawText(m, out, page, { text: String(target + 1), x: W - 56, y, size: 10.5, align: 'right' });
          P.appendContent(m, out, page, `0.82 0.84 0.88 RG 0.5 w [1 2] 0 d 56 ${P.num(y - 4)} m ${P.num(W - 56)} ${P.num(y - 4)} l S`);
          page.createLink([50, H - y - 13, W - 50, H - y + 5], out.formatLinkURI({ chapter: 0, page: target, type: 'Fit', x: 0, y: 0, width: 0, height: 0, zoom: 0 }));
          y -= 21;
        }
      }
    }

    // ----- bookmarks -----
    const at = (p) => p + tocPages;
    const shift = (list) => list.map((o) => ({ ...o, page: at(o.page), children: shift(o.children) }));
    let outline = [];
    if (s.bm === 'none') outline = s.keep ? shift(parts.flatMap((p) => p.inner)) : [];
    else if (s.bm === 'file') outline = parts.map((p) => ({ title: p.title, page: at(p.start), children: shift(p.inner) }));
    else {
      const root = { children: [], kids: new Map() };
      for (const p of parts) {
        let node = root;
        for (const seg of (p.folder || '').split('/').filter(Boolean)) {
          if (!node.kids.has(seg)) { const nn = { title: seg, page: at(p.start), children: [], kids: new Map() }; node.kids.set(seg, nn); node.children.push(nn); }
          node = node.kids.get(seg);
        }
        node.children.push({ title: p.title, page: at(p.start), children: shift(p.inner) });
      }
      outline = root.children;
    }
    if (s.toc) outline.unshift({ title: 'Contents', page: 0, children: [] });
    if (outline.length) P.writeOutline(m, out, outline);

    ui.progress(0.98, 1, 'Saving…');
    await ui.yield();
    let name = $('outName').value.trim() || 'merged.pdf';
    if (!/\.pdf$/i.test(name)) name += '.pdf';
    const bytes = out.saveToBuffer('garbage=4,compress').asUint8Array().slice();
    ui.progress(1, 1);
    return [{ name: FMKit.safeName(name), bytes, type: 'application/pdf', note: `${items.length} files · ${out.countPages()} pages` }];
  }

  FMKit.init({
    key: 'merge', accept: 'pdf', runLabel: 'Merge PDF', makes: 'pdf', busyTitle: 'Merging…', view: 'rows',
    run,
    validate: (items) => (items.length < 2 ? 'Add at least two PDF files to merge.' : true),
    estimate: async (items) => `${items.length} files → 1 PDF of ${items.reduce((t, it) => t + (it.pages || 0), 0)} pages`,
    doneTitle: () => 'Your PDFs are merged',
  });
})();
