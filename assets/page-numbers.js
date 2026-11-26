/* Add page numbers: 9 positions, formats ("Page 1 of 10"), first number, pages to skip,
 * double-sided mirroring and Bates numbering across many files. Any language in the text. */
(() => {
  'use strict';
  const P = window.PdfOps;
  const { $ } = FM;
  const val = (name) => (document.querySelector(`input[name="${name}"]:checked`) || {}).value;
  const MM = 72 / 25.4;

  function paint() {
    const custom = $('fmt').value === 'custom';
    $('fmtCustom').hidden = !custom;
    $('fmtHint').hidden = !custom;
    $('batesRow').hidden = !$('bates').checked;
  }

  function pagesIn(spec, count) {
    if (!spec.trim()) return [...Array(count).keys()];
    try { return P.parsePages(spec, count); } catch (e) {
      if (/outside/.test(e.message)) return P.parsePages(spec, 100000).filter((i) => i < count);
      throw e;
    }
  }

  /** Anchor point and alignment for a position code like "bc" on a W x H page. */
  function anchor(pos, W, H, margin, size, mirror) {
    let col = pos[1];
    if (mirror) col = col === 'l' ? 'r' : col === 'r' ? 'l' : col;
    const x = col === 'l' ? margin : col === 'r' ? W - margin : W / 2;
    const y = pos[0] === 't' ? H - margin - size * 0.8 : pos[0] === 'b' ? margin : H / 2 - size * 0.36;
    return { x, y, align: col === 'l' ? 'left' : col === 'r' ? 'right' : 'center' };
  }

  /** Writes a line of text, in Helvetica when it can, otherwise as a crisp picture of the text. */
  async function stamp(m, doc, page, text, { x, y, align, size, color, bold }) {
    if (P.isLatin(text)) {
      P.drawText(m, doc, page, { text, x, y, size, color: FMKit.hexRgb(color), align, bold });
      return;
    }
    const png = await FMKit.textPng(text, { size, color, bold });
    const w = png.w / png.scale; const h = png.h / png.scale;
    const ref = doc.addImage(new m.Image(png.bytes));
    const left = align === 'left' ? x : align === 'right' ? x - w : x - w / 2;
    P.drawImage(m, doc, page, ref, { x: left - size * 0.1, y: y + size * 0.36 - h / 2, w, h });
  }

  const label = (fmt, n, total, file) => fmt.replace(/\{n\}/g, n).replace(/\{total\}/g, total).replace(/\{file\}/g, file);

  async function run(items, ui) {
    const m = await FM.mupdf();
    const fmt = $('fmt').value === 'custom' ? $('fmtCustom').value : $('fmt').value;
    if (!fmt.trim()) throw new Error('Type the text for the page numbers.');
    const s = {
      pos: val('pos'), start: Math.round(Number($('startAt').value) || 0), size: Math.max(5, Number($('fontSize').value) || 11),
      color: $('color').value, bold: $('bold').checked, margin: (Number($('margin').value) || 0) * MM,
      mirror: $('mirror').checked, bates: $('bates').checked, prefix: $('batesPrefix').value, digits: Math.max(1, Number($('batesDigits').value) || 6),
    };
    let bates = s.start;
    const out = [];
    for (const [k, it] of items.entries()) {
      const doc = await FM.openPdf(it.file);
      const n = doc.countPages();
      let list = pagesIn($('optPages').value, n);
      if ($('skipFirst').checked) list = list.filter((i) => i !== 0);
      const total = s.start + list.length - 1;
      const base = FMKit.baseOf(it.file.name);
      const first = bates;
      for (const [j, i] of list.entries()) {
        if (j % 20 === 0) { ui.progress(k + j / list.length, items.length, `${it.file.name} · page ${i + 1} of ${n}`); await ui.yield(); }
        const page = doc.loadPage(i);
        const { W, H } = P.pageSpace(m, page);
        const text = s.bates ? s.prefix + String(bates++).padStart(s.digits, '0') : label(fmt, s.start + j, total, base);
        const a = anchor(s.pos, W, H, s.margin, s.size, s.mirror && i % 2 === 1);
        await stamp(m, doc, page, text, { ...a, size: s.size, color: s.color, bold: s.bold });
      }
      const bytes = doc.saveToBuffer('garbage=1,compress').asUint8Array().slice();
      const note = s.bates && list.length
        ? `${s.prefix}${String(first).padStart(s.digits, '0')} – ${s.prefix}${String(bates - 1).padStart(s.digits, '0')}`
        : `${list.length} page(s) numbered`;
      out.push({ name: FMKit.safeName(base + '-numbered.pdf'), bytes, type: 'application/pdf', folder: it.folder, note, noteKind: list.length ? 'good' : 'warn' });
    }
    ui.progress(1, 1);
    return out;
  }

  FMKit.init({
    key: 'pagenum', accept: 'pdf', runLabel: 'Add page numbers', makes: 'pdf', busyTitle: 'Numbering pages…',
    run,
    zipName: () => 'numbered',
    estimate: async (items) => {
      paint();
      if (!$('bates').checked) return '';
      const pages = items.reduce((t, it) => t + (it.pages || 0), 0);
      const st = Math.round(Number($('startAt').value) || 0);
      const d = Math.max(1, Number($('batesDigits').value) || 6);
      const p = $('batesPrefix').value;
      return pages ? `${p}${String(st).padStart(d, '0')} to about ${p}${String(st + pages - 1).padStart(d, '0')}` : '';
    },
  });
  $('kitOpts').addEventListener('change', paint);
  $('kitOpts').addEventListener('input', paint);
  paint();
})();
