/* Crop PDF: draw the area to keep on page 1 (or type the margins in mm), or trim the white margins
 * of every page on its own. Sets the CropBox, so every reader shows and prints only that area. */
(() => {
  'use strict';
  const P = window.PdfOps;
  const { $ } = FM;
  const val = (name) => (document.querySelector(`input[name="${name}"]:checked`) || {}).value;
  const MM = 72 / 25.4;
  const IDS = ['mTop', 'mBottom', 'mLeft', 'mRight'];

  let kit;
  let first = null; // { id, W, H } of the page shown

  function pagesIn(spec, count) {
    if (!spec.trim()) return [...Array(count).keys()];
    try { return P.parsePages(spec, count); } catch (e) {
      if (/outside/.test(e.message)) return P.parsePages(spec, 100000).filter((i) => i < count);
      throw e;
    }
  }
  const margins = () => IDS.map((id) => Math.max(0, Number($(id).value) || 0) * MM); // t, b, l, r in points

  function paint() {
    const trim = val('mode') === 'trim';
    $('drawOpt').hidden = trim;
    $('trimOpt').hidden = !trim;
    $('cropStage').hidden = trim;
    showRect();
  }

  // ---------- page 1 picture + drawn rectangle ----------
  async function showFirst(items) {
    const it = items.find((x) => !x.error && !x.locked);
    if (!it) { first = null; $('cropImg').removeAttribute('src'); return; }
    if (first && first.id === it.id) return;
    if (loadingId === it.id) return; // already being drawn
    loadingId = it.id;
    try { await drawFirst(it); } catch { /* the file changed meanwhile */ } finally { if (loadingId === it.id) loadingId = null; }
  }
  let loadingId = null;
  async function drawFirst(it) {
    const m = await FM.mupdf();
    const doc = m.Document.openDocument(new Uint8Array(await it.file.arrayBuffer()), 'application/pdf');
    const page = doc.loadPage(0);
    const b = page.getBounds();
    const W = b[2] - b[0]; const H = b[3] - b[1];
    const k = 1000 / Math.max(W, H);
    const pix = page.toPixmap(m.Matrix.scale(k, k), m.ColorSpace.DeviceRGB, false, true);
    const img = $('cropImg');
    if (img.src) URL.revokeObjectURL(img.src);
    img.src = URL.createObjectURL(new Blob([pix.asPNG().slice()], { type: 'image/png' }));
    await img.decode();
    first = { id: it.id, W, H };
    $('cropHint').textContent = `Drag on the page to draw the area to keep. Page 1 is ${Math.round(W / MM)} × ${Math.round(H / MM)} mm.`;
    showRect();
  }

  function showRect() {
    const r = $('cropRect');
    const [t, b, l, rr] = margins();
    if (!first || (t + b + l + rr === 0)) { r.hidden = true; return; }
    r.hidden = false;
    r.style.left = `${(l / first.W) * 100}%`;
    r.style.top = `${(t / first.H) * 100}%`;
    r.style.width = `${Math.max(0, (1 - (l + rr) / first.W)) * 100}%`;
    r.style.height = `${Math.max(0, (1 - (t + b) / first.H)) * 100}%`;
  }

  let dragStart = null;
  const wrap = $('cropWrap');
  const at = (e) => {
    const box = $('cropImg').getBoundingClientRect();
    return [Math.min(1, Math.max(0, (e.clientX - box.left) / box.width)), Math.min(1, Math.max(0, (e.clientY - box.top) / box.height))];
  };
  wrap.addEventListener('pointerdown', (e) => {
    if (!first) return;
    dragStart = at(e);
    wrap.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  wrap.addEventListener('pointermove', (e) => {
    if (!dragStart) return;
    const p = at(e);
    const x0 = Math.min(dragStart[0], p[0]); const x1 = Math.max(dragStart[0], p[0]);
    const y0 = Math.min(dragStart[1], p[1]); const y1 = Math.max(dragStart[1], p[1]);
    const mm = (v) => Math.round((v / MM) * 10) / 10;
    $('mTop').value = mm(y0 * first.H);
    $('mBottom').value = mm((1 - y1) * first.H);
    $('mLeft').value = mm(x0 * first.W);
    $('mRight').value = mm((1 - x1) * first.W);
    showRect();
  });
  const end = () => { if (dragStart) { dragStart = null; $('kitOpts').dispatchEvent(new Event('change')); } };
  wrap.addEventListener('pointerup', end);
  wrap.addEventListener('pointercancel', end);

  // ---------- cropping ----------
  /** Puts a CropBox from a rectangle in visual space (x0, y0, x1, y1, origin bottom-left). */
  function setCrop(m, doc, page, x0, y0, x1, y1) {
    const { M } = P.pageSpace(m, page);
    const pts = [[x0, y0], [x1, y0], [x0, y1], [x1, y1]].map(([x, y]) => [M[0] * x + M[2] * y + M[4], M[1] * x + M[3] * y + M[5]]);
    const xs = pts.map((p) => p[0]); const ys = pts.map((p) => p[1]);
    const arr = doc.newArray();
    [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)].forEach((v) => arr.push(Math.round(v * 1000) / 1000));
    page.getObject().put('CropBox', arr);
  }

  /** Box of the non-white content in visual space, or null for an empty page. */
  function contentBox(m, page, W, H) {
    const k = Math.min(1, 1600 / Math.max(W, H)); // about 72 DPI, at most 1600 px
    const pix = page.toPixmap(m.Matrix.scale(k, k), m.ColorSpace.DeviceGray, false, true);
    const w = pix.getWidth(); const h = pix.getHeight(); const px = pix.getPixels();
    let x0 = w; let y0 = h; let x1 = -1; let y1 = -1;
    for (let y = 0; y < h; y++) {
      const row = y * w;
      for (let x = 0; x < w; x++) {
        if (px[row + x] < 235) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      }
    }
    if (x1 < 0) return null;
    return [x0 / k, H - (y1 + 1) / k, (x1 + 1) / k, H - y0 / k];
  }

  async function run(items, ui) {
    const m = await FM.mupdf();
    const trim = val('mode') === 'trim';
    const [t, b, l, r] = margins();
    if (!trim && t + b + l + r === 0) throw new Error('Drag on the page to draw the area to keep, or type the margins to cut.');
    const pad = Math.max(0, Number($('pad').value) || 0) * MM;
    const out = [];
    for (const [k, it] of items.entries()) {
      const doc = await FM.openPdf(it.file);
      const n = doc.countPages();
      const list = pagesIn($('optPages').value, n);
      let done = 0; let skipped = 0;
      for (const [j, i] of list.entries()) {
        if (j % (trim ? 4 : 50) === 0) { ui.progress(k + j / list.length, items.length, `${it.file.name} · page ${i + 1} of ${n}`); await ui.yield(); }
        const page = doc.loadPage(i);
        const { W, H } = P.pageSpace(m, page);
        let box;
        if (trim) {
          const c = contentBox(m, page, W, H);
          if (!c) { skipped++; continue; }
          box = [Math.max(0, c[0] - pad), Math.max(0, c[1] - pad), Math.min(W, c[2] + pad), Math.min(H, c[3] + pad)];
        } else {
          box = [l, b, W - r, H - t];
        }
        if (box[2] - box[0] < 10 || box[3] - box[1] < 10) { skipped++; continue; }
        setCrop(m, doc, page, ...box);
        done++;
      }
      const bytes = doc.saveToBuffer('garbage=1,compress').asUint8Array().slice();
      out.push({
        name: FMKit.safeName(FMKit.baseOf(it.file.name) + '-cropped.pdf'), bytes, type: 'application/pdf', folder: it.folder,
        note: `${done} page(s) cropped${skipped ? `, ${skipped} left as they were` : ''}`, noteKind: done ? 'good' : 'warn',
      });
    }
    ui.progress(1, 1);
    return out;
  }

  kit = FMKit.init({
    key: 'crop', accept: 'pdf', runLabel: 'Crop PDF', makes: 'pdf', busyTitle: 'Cropping…',
    run,
    zipName: () => 'cropped',
    onItems: (items) => { showFirst(items); },
    onOptions: () => paint(),
  });
  IDS.forEach((id) => $(id).addEventListener('input', showRect));
  paint();
})();
