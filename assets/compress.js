/* Compress PDF: three levels or a target size. The size each level gives is worked out for the
 * first file before anything is saved. Pictures are made smaller; text and vector drawings stay. */
(() => {
  'use strict';
  const P = window.PdfOps;
  const { $, formatBytes } = FM;
  const val = (name) => (document.querySelector(`input[name="${name}"]:checked`) || {}).value;
  const LEVELS = { light: { dpi: 200, quality: 80 }, recommended: { dpi: 150, quality: 65 }, strong: { dpi: 96, quality: 45 } };
  const LADDER = [[220, 85], [200, 78], [150, 70], [150, 60], [120, 55], [96, 45], [80, 40], [72, 35], [60, 30]];

  async function compressBytes(m, bytes, { dpi, quality, gray, meta }, onProgress, yieldFn) {
    const doc = new m.PDFDocument(bytes.slice());
    await P.compressImages(m, doc, { dpi, quality, gray, onProgress, yieldEvery: yieldFn });
    if (meta) {
      const trailer = doc.getTrailer();
      trailer.delete('Info');
      const rootObj = trailer.get('Root');
      if (rootObj && !rootObj.isNull()) rootObj.delete('Metadata');
    }
    return doc.saveToBuffer(P.SAVE).asUint8Array().slice();
  }

  function paint() {
    $('targetOpt').hidden = val('level') !== 'target';
  }
  const opts = () => ({ gray: $('optGray').checked, meta: $('optMeta').checked });

  // ---------- size of each level, for the first file ----------
  let estKey = '';
  async function estimate(items, stale) {
    paint();
    const it = items[0];
    if (!it) return '';
    const o = opts();
    const key = it.id + '|' + o.gray + o.meta;
    const total = items.reduce((s, x) => s + x.file.size, 0);
    const line = items.length > 1 ? `${items.length} files · ${formatBytes(total)} now` : `${formatBytes(total)} now`;
    if (key === estKey) return line;
    if (it.file.size > 80e6) { $('lvHint').textContent = 'This file is large: the new size is shown when it is done.'; return line; }
    $('lvHint').textContent = 'Working out the size of each level…';
    document.querySelectorAll('[data-for^="level-"]').forEach((s) => { s.dataset.orig = s.dataset.orig || s.textContent; });
    const m = await FM.mupdf();
    const bytes = new Uint8Array(await it.file.arrayBuffer());
    for (const [lv, p] of Object.entries(LEVELS)) {
      if (stale()) return line;
      await FMKit.yieldUI();
      const out = await compressBytes(m, bytes, { ...p, ...o }, null, FMKit.yieldUI);
      if (stale()) return line;
      const pct = Math.round((1 - out.length / bytes.length) * 100);
      const small = document.querySelector(`[data-for="level-${lv}"]`);
      small.textContent = pct > 1 ? `${formatBytes(out.length)} · −${pct}%` : 'no smaller';
    }
    estKey = key;
    $('lvHint').textContent = items.length > 1 ? `Sizes for ${it.file.name}. The other files are done the same way.` : 'Sizes for your file, worked out on your computer.';
    return line;
  }

  async function run(items, ui) {
    const m = await FM.mupdf();
    const level = val('level');
    const o = opts();
    const target = Number($('targetMb').value) * 1024 * 1024;
    if (level === 'target' && !(target > 0)) throw new Error('Type the size you need, for example 2 MB.');
    const out = [];
    for (const [i, it] of items.entries()) {
      const bytes = new Uint8Array(await it.file.arrayBuffer());
      const step = (d, n) => ui.progress(i + (n ? d / n : 0), items.length, `${it.file.name}${n ? ` · picture ${Math.min(d + 1, n)} of ${n}` : ''}`);
      step(0, 0);
      await ui.yield();
      let best = null;
      let reached = true;
      if (level !== 'target') {
        best = await compressBytes(m, bytes, { ...LEVELS[level], ...o }, step, ui.yield);
      } else if (bytes.length <= target && !o.gray && !o.meta) {
        best = bytes;
      } else {
        reached = false;
        for (const [dpi, quality] of LADDER) {
          const r = await compressBytes(m, bytes, { dpi, quality, ...o }, step, ui.yield);
          if (!best || r.length < best.length) best = r;
          if (r.length <= target) { reached = true; best = r; break; }
        }
      }
      let note; let kind = 'good'; let data = best;
      if (best.length >= bytes.length && !(o.gray || o.meta)) { data = bytes; note = 'already small, kept as it was'; kind = 'warn'; }
      else note = `−${Math.max(0, Math.round((1 - best.length / bytes.length) * 100))}% (was ${formatBytes(bytes.length)})`;
      if (level === 'target' && !reached) { note = `smallest possible: ${formatBytes(data.length)}`; kind = 'warn'; }
      out.push({ name: FMKit.safeName(FMKit.baseOf(it.file.name) + '-compressed.pdf'), bytes: data, type: 'application/pdf', folder: it.folder, note, noteKind: kind, before: bytes.length });
    }
    ui.progress(1, 1);
    return out;
  }

  FMKit.init({
    key: 'compress', accept: 'pdf', runLabel: 'Compress PDF', makes: 'pdf', busyTitle: 'Compressing…',
    run, estimate,
    zipName: () => 'compressed',
    doneTitle: (outs) => {
      const before = outs.reduce((s, x) => s + x.before, 0);
      const after = outs.reduce((s, x) => s + x.blob.size, 0);
      const pct = Math.round((1 - after / before) * 100);
      return pct > 0 ? `Your PDF${outs.length > 1 ? 's are' : ' is'} ${pct}% smaller` : 'Done';
    },
    doneText: (outs) => `${formatBytes(outs.reduce((s, x) => s + x.before, 0))} → ${formatBytes(outs.reduce((s, x) => s + x.blob.size, 0))}`,
  });
  $('kitOpts').addEventListener('change', (e) => { if (e.target.id === 'optGray' || e.target.id === 'optMeta') estKey = ''; paint(); });
  paint();
})();
