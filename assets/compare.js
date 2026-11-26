/* Compare PDF: two versions page by page. Pages are compared as pictures (works for drawings and
 * scans): removed parts red, added parts green, changed areas boxed. The words that changed are
 * listed too, and a PDF report can be downloaded. */
(() => {
  'use strict';
  const P = window.PdfOps;
  const { $, esc } = FM;
  const val = (name) => (document.querySelector(`input[name="${name}"]:checked`) || {}).value;
  const LONG = 1400; // pixels on the long side of a compared page

  let kit;
  let job = null; // { key, a, b, n, pages: [result], cur }
  let token = 0;

  const SENS = { low: { dark: 190, grow: 2 }, normal: { dark: 210, grow: 1 }, high: { dark: 235, grow: 0 } };

  function pair() {
    const good = kit.items.filter((x) => x.loaded && !x.error && !x.locked);
    return good.length === 2 ? good : null;
  }

  async function openBoth(a, b) {
    const m = await FM.mupdf();
    const open = async (it) => m.Document.openDocument(new Uint8Array(await it.file.arrayBuffer()), 'application/pdf');
    return { m, A: await open(a), B: await open(b) };
  }

  /** Gray pixels of a page at w x h (the old page's size in pixels). */
  function gray(m, page, w, h) {
    const b = page.getBounds();
    const pix = page.toPixmap(m.Matrix.scale(w / (b[2] - b[0]), h / (b[3] - b[1])), m.ColorSpace.DeviceGray, false, true);
    const W = pix.getWidth(); const H = pix.getHeight(); const src = pix.getPixels();
    if (W === w && H === h) return src.slice();
    const out = new Uint8Array(w * h).fill(255); // rounding can differ by a pixel
    for (let y = 0; y < Math.min(h, H); y++) out.set(src.subarray(y * W, y * W + Math.min(w, W)), y * w);
    return out;
  }

  /** Dark pixels as 0/1, grown by r pixels (so a 1-pixel shift is not a change). */
  function mask(g, w, h, dark, r) {
    const m = new Uint8Array(w * h);
    for (let i = 0; i < m.length; i++) m[i] = g[i] < dark ? 1 : 0;
    if (!r) return { m, grown: m };
    // separable max filter
    const t = new Uint8Array(w * h); const grown = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) {
      const row = y * w;
      for (let x = 0; x < w; x++) {
        let v = 0;
        for (let d = -r; d <= r && !v; d++) { const xx = x + d; if (xx >= 0 && xx < w) v = m[row + xx]; }
        t[row + x] = v;
      }
    }
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let v = 0;
        for (let d = -r; d <= r && !v; d++) { const yy = y + d; if (yy >= 0 && yy < h) v = t[yy * w + x]; }
        grown[y * w + x] = v;
      }
    }
    return { m, grown };
  }

  /** Boxes around the changed areas, from a coarse grid of changed cells. */
  function boxes(diff, w, h) {
    const C = 16;
    const cw = Math.ceil(w / C); const ch = Math.ceil(h / C);
    const cells = new Uint16Array(cw * ch);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (diff[y * w + x]) cells[((y / C) | 0) * cw + ((x / C) | 0)]++;
    const on = new Uint8Array(cw * ch);
    for (let i = 0; i < on.length; i++) on[i] = cells[i] >= 3 ? 1 : 0;
    const seen = new Uint8Array(cw * ch);
    const out = [];
    for (let i = 0; i < on.length; i++) {
      if (!on[i] || seen[i]) continue;
      let x0 = cw; let y0 = ch; let x1 = 0; let y1 = 0;
      const stack = [i]; seen[i] = 1;
      while (stack.length) {
        const k = stack.pop(); const cx = k % cw; const cy = (k / cw) | 0;
        x0 = Math.min(x0, cx); x1 = Math.max(x1, cx); y0 = Math.min(y0, cy); y1 = Math.max(y1, cy);
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) { // join areas less than 2 cells apart
            const nx = cx + dx; const ny = cy + dy;
            if (nx < 0 || ny < 0 || nx >= cw || ny >= ch) continue;
            const j = ny * cw + nx;
            if (on[j] && !seen[j]) { seen[j] = 1; stack.push(j); }
          }
        }
      }
      out.push([x0 * C - 6, y0 * C - 6, (x1 + 1) * C + 6, (y1 + 1) * C + 6]);
    }
    return out;
  }

  const toUrl = (c) => new Promise((r) => c.toBlob((b) => r(URL.createObjectURL(b)), 'image/png'));

  /** Compares one page: pictures (overlay, old, new), share of the page changed, boxes, words. */
  async function comparePage(m, A, B, i, s) {
    const pa = i < A.countPages() ? A.loadPage(i) : null;
    const pb = i < B.countPages() ? B.loadPage(i) : null;
    const ref = pa || pb;
    const b = ref.getBounds();
    const k = LONG / Math.max(b[2] - b[0], b[3] - b[1]);
    const w = Math.round((b[2] - b[0]) * k); const h = Math.round((b[3] - b[1]) * k);
    const ga = pa ? gray(m, pa, w, h) : new Uint8Array(w * h).fill(255);
    const gb = pb ? gray(m, pb, w, h) : new Uint8Array(w * h).fill(255);
    const { dark, grow } = SENS[s.sens];
    const ma = mask(ga, w, h, dark, grow); const mb = mask(gb, w, h, dark, grow);
    const over = new ImageData(w, h); const oldI = new ImageData(w, h); const newI = new ImageData(w, h);
    const diff = new Uint8Array(w * h);
    let removed = 0; let added = 0; let ink = 0;
    const put = (img, j, r, g, bl) => { img.data[j] = r; img.data[j + 1] = g; img.data[j + 2] = bl; img.data[j + 3] = 255; };
    for (let p = 0; p < w * h; p++) {
      const j = p * 4;
      const a = ma.m[p]; const bb = mb.m[p];
      const rem = a && !mb.grown[p]; const add = bb && !ma.grown[p];
      if (a || bb) ink++;
      if (rem) { removed++; diff[p] = 1; } else if (add) { added++; diff[p] = 1; }
      // overlay
      if (rem) put(over, j, 222, 38, 38);
      else if (add) put(over, j, 22, 163, 74);
      else { const v = Math.min(ga[p], gb[p]); const l = 255 - (255 - v) * 0.55; put(over, j, l, l, l); }
      // the two pages with their own marks
      if (rem) put(oldI, j, 222, 38, 38); else put(oldI, j, ga[p], ga[p], ga[p]);
      if (add) put(newI, j, 22, 163, 74); else put(newI, j, gb[p], gb[p], gb[p]);
    }
    const bx = boxes(diff, w, h);
    const draw = async (img) => {
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      const ctx = c.getContext('2d');
      ctx.putImageData(img, 0, 0);
      ctx.strokeStyle = 'rgba(245,130,32,.95)'; ctx.lineWidth = 3; ctx.setLineDash([10, 6]);
      bx.forEach(([x0, y0, x1, y1]) => ctx.strokeRect(x0, y0, x1 - x0, y1 - y0));
      const url = await toUrl(c);
      c.width = 0; c.height = 0; // free the memory now: only the picture is kept
      return { url };
    };
    const res = {
      i, w, h, removed, added, pct: ink ? ((removed + added) / ink) * 100 : 0, boxes: bx.length,
      only: !pa ? 'new' : !pb ? 'old' : '', size: [b[2] - b[0], b[3] - b[1]],
      over: await draw(over), old: await draw(oldI), neu: await draw(newI),
    };
    if (s.text && pa && pb) res.words = textDiff(pa.toStructuredText('').asText(), pb.toStructuredText('').asText());
    return res;
  }

  /** Word diff [['=', 'w'], ['-', 'w'], ['+', 'w']] by longest common subsequence. */
  function textDiff(ta, tb) {
    const a = ta.split(/\s+/).filter(Boolean); const b = tb.split(/\s+/).filter(Boolean);
    if (!a.length && !b.length) return null;
    if (a.length * b.length > 6e6) { // too long for a full diff: words that appear only on one side
      const sa = new Set(a); const sb = new Set(b);
      return [...a.filter((x) => !sb.has(x)).map((x) => ['-', x]), ...b.filter((x) => !sa.has(x)).map((x) => ['+', x])];
    }
    const n = a.length; const mm = b.length;
    const L = Array.from({ length: n + 1 }, () => new Uint16Array(mm + 1));
    for (let x = n - 1; x >= 0; x--) for (let y = mm - 1; y >= 0; y--) L[x][y] = a[x] === b[y] ? L[x + 1][y + 1] + 1 : Math.max(L[x + 1][y], L[x][y + 1]);
    const out = []; let x = 0; let y = 0;
    while (x < n && y < mm) {
      if (a[x] === b[y]) { out.push(['=', a[x]]); x++; y++; } else if (L[x + 1][y] >= L[x][y + 1]) out.push(['-', a[x++]]); else out.push(['+', b[y++]]);
    }
    while (x < n) out.push(['-', a[x++]]);
    while (y < mm) out.push(['+', b[y++]]);
    return out;
  }

  /** Only the changes, with a few words around each for context. */
  function wordsHtml(words) {
    if (!words) return '';
    const ch = words.map((w) => w[0] !== '=');
    if (!ch.some(Boolean)) return '<p class="hint">The text is the same.</p>';
    const keep = words.map((_, i) => ch.slice(Math.max(0, i - 4), i + 5).some(Boolean));
    let html = ''; let gap = false;
    words.forEach(([t, w], i) => {
      if (!keep[i]) { if (!gap) { html += ' … '; gap = true; } return; }
      gap = false;
      html += t === '-' ? `<del>${esc(w)}</del> ` : t === '+' ? `<ins>${esc(w)}</ins> ` : `${esc(w)} `;
    });
    return `<div class="cmp-text" dir="auto">${html}</div>`;
  }

  const settings = () => ({ sens: val('sens'), text: $('cmpText').checked, view: val('view') });

  // ---------- comparing every page, in the background ----------
  async function start() {
    const p = pair();
    const box = $('cmpView');
    if (!p) {
      job = null;
      const n = kit.items.filter((x) => !x.error).length;
      box.innerHTML = n ? `<p class="hint">${n < 2 ? 'Add the second PDF (the new version).' : 'Keep only two PDFs: the old version and the new one.'}</p>` : '';
      return;
    }
    const s = settings();
    const key = `${p[0].id}|${p[1].id}|${s.sens}|${s.text}`;
    if (job && job.key === key) { show(); return; }
    const my = ++token;
    const { m, A, B } = await openBoth(p[0], p[1]);
    const n = Math.max(A.countPages(), B.countPages());
    job = { key, a: p[0], b: p[1], n, pages: [], cur: 0, nA: A.countPages(), nB: B.countPages() };
    show();
    for (let i = 0; i < n; i++) {
      if (my !== token) return;
      await FMKit.yieldUI();
      const r = await comparePage(m, A, B, i, s);
      if (my !== token) return;
      job.pages[i] = r;
      show();
    }
  }

  function show() {
    const box = $('cmpView');
    if (!job) return;
    const s = settings();
    const done = job.pages.filter(Boolean);
    const changed = done.filter((r) => r.removed + r.added > 0 && (r.boxes || r.only));
    const btns = Array.from({ length: job.n }, (_, i) => {
      const r = job.pages[i];
      const cls = [i === job.cur ? 'on' : '', r && (r.boxes || r.only) ? 'diff' : ''].join(' ');
      return `<button type="button" class="btn ${cls}" data-p="${i}" ${r ? '' : 'disabled'}>${i + 1}</button>`;
    }).join('');
    const r = job.pages[job.cur];
    let body = '<p class="hint">Comparing…</p>';
    if (r) {
      const stat = r.only ? `This page is only in the ${r.only} version.`
        : r.boxes ? `${r.boxes} changed area${r.boxes > 1 ? 's' : ''} · ${r.pct < 0.1 ? 'less than 0.1' : r.pct.toFixed(1)}% of the drawing changed`
          : 'No visible change on this page.';
      body = `<p class="cmp-stats"><b>Page ${r.i + 1}</b> · ${stat}</p>`
        + (s.view === 'overlay' ? `<img src="${r.over.url}" alt="Page ${r.i + 1}, old and new laid over each other">`
          : `<div class="cmp-pair"><figure><figcaption class="hint">Old · ${esc(job.a.file.name)}</figcaption><img src="${r.old.url}" alt=""></figure><figure><figcaption class="hint">New · ${esc(job.b.file.name)}</figcaption><img src="${r.neu.url}" alt=""></figure></div>`)
        + (r.words ? wordsHtml(r.words) : '');
    }
    const pagesNote = job.nA !== job.nB ? ` · the old PDF has ${job.nA} pages, the new one ${job.nB}` : '';
    box.innerHTML = `<div class="cmp-legend"><span><i style="background:#de2626"></i>Removed (only in the old version)</span><span><i style="background:#16a34a"></i>Added (only in the new version)</span><span><i style="border:2px dashed #f58220"></i>Changed area</span></div>
      <p class="hint">${done.length < job.n ? `Comparing page ${done.length + 1} of ${job.n}…` : `${changed.length} of ${job.n} page(s) changed`}${pagesNote}</p>
      <div class="cmp-pages">${btns}</div>${body}`;
    $('kitEst').textContent = done.length < job.n ? '' : `${changed.length} changed page(s) in the report`;
  }

  $('cmpView').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-p]');
    if (!b || !job) return;
    job.cur = Number(b.dataset.p);
    show();
  });

  // ---------- report ----------
  async function run(items, ui) {
    if (!pair()) throw new Error('Select exactly two PDFs: the old version and the new one.');
    while (!job || job.pages.filter(Boolean).length < job.n) {
      const d = job ? job.pages.filter(Boolean).length : 0;
      ui.progress(d, job ? job.n : 1, 'Comparing the pages…');
      await new Promise((r) => setTimeout(r, 150));
    }
    const m = await FM.mupdf();
    const out = new m.PDFDocument();
    const changed = job.pages.filter((r) => r.boxes || r.only);
    // summary page
    const W = 595.28; const H = 841.89;
    out.insertPage(-1, out.addPage([0, 0, W, H], 0, {}, ''));
    const sp = out.loadPage(0);
    const line = async (text, y, size = 11, bold = false, color = '#111111') => {
      if (P.isLatin(text)) { P.drawText(m, out, sp, { text, x: 56, y, size, bold, color: FMKit.hexRgb(color) }); return; }
      const png = await FMKit.textPng(text, { size, color, bold });
      const w = png.w / png.scale; const h = png.h / png.scale;
      P.drawImage(m, out, sp, out.addImage(new m.Image(png.bytes)), { x: 56, y: y + size * 0.36 - h / 2, w, h });
    };
    await line('Comparison report', H - 80, 22, true);
    await line(`Old: ${job.a.file.name}`, H - 115);
    await line(`New: ${job.b.file.name}`, H - 133);
    await line(`${changed.length} of ${job.n} page(s) changed. Red = removed, green = added.`, H - 160, 11, true);
    let y = H - 190;
    for (const r of job.pages) {
      if (y < 60) break;
      const t = r.only ? `Page ${r.i + 1}: only in the ${r.only} version` : r.boxes ? `Page ${r.i + 1}: ${r.boxes} changed area(s), ${r.pct < 0.1 ? '<0.1' : r.pct.toFixed(1)}%` : `Page ${r.i + 1}: no change`;
      await line(t, y, 10, false, r.boxes || r.only ? '#b91c1c' : '#555555');
      y -= 16;
    }
    await line('Made with File Manager Toolkit - filemanagertoolkit.com', 40, 8, false, '#888888');
    for (const [k, r] of changed.entries()) {
      ui.progress(k, changed.length, `Page ${r.i + 1}`);
      await ui.yield();
      const im = new Image();
      im.src = r.over.url;
      await im.decode();
      const c = document.createElement('canvas');
      c.width = im.naturalWidth; c.height = im.naturalHeight;
      c.getContext('2d').drawImage(im, 0, 0);
      const blob = await new Promise((res) => c.toBlob(res, 'image/jpeg', 0.85));
      c.width = 0;
      const img = out.addImage(new m.Image(new Uint8Array(await blob.arrayBuffer())));
      const [pw, ph] = r.size;
      out.insertPage(-1, out.addPage([0, 0, pw, ph], 0, {}, ''));
      const page = out.loadPage(out.countPages() - 1);
      P.drawImage(m, out, page, img, { x: 0, y: 0, w: pw, h: ph });
      P.drawText(m, out, page, { text: `Page ${r.i + 1}${r.only ? ` - only in the ${r.only} version` : ` - ${r.boxes} changed area(s)`}`, x: 14, y: ph - 22, size: Math.max(9, pw / 70), bold: true, color: [0.72, 0.1, 0.1], background: [1, 1, 1] });
    }
    const bytes = out.saveToBuffer('garbage=4,compress').asUint8Array().slice();
    ui.progress(1, 1);
    return [{ name: FMKit.safeName(`compare-${FMKit.baseOf(job.a.file.name)}-vs-${FMKit.baseOf(job.b.file.name)}.pdf`), bytes, type: 'application/pdf', note: `${changed.length} changed page(s)` }];
  }

  kit = FMKit.init({
    key: 'compare', accept: 'pdf', runLabel: 'Download the report', makes: null, busyTitle: 'Making the report…',
    run,
    validate: () => (pair() ? true : 'Select exactly two PDFs: the old version and the new one.'),
    itemButtons: (it) => {
      const i = kit ? kit.items.indexOf(it) : -1;
      return i === 0 ? '<span class="cmp-tag old">Old</span>' : i === 1 ? '<span class="cmp-tag new">New</span>' : '';
    },
    onItems: () => { start(); },
    onOptions: () => { start(); },
    doneTitle: () => 'Your comparison report is ready',
  });
})();
