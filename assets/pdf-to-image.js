/* PDF to JPG / PNG / WebP / TIFF at a chosen DPI, colour / grey / black & white, or the pictures inside. */
(() => {
  'use strict';
  const P = window.PdfOps;
  const { $, formatBytes } = FM;
  const val = (name) => (document.querySelector(`input[name="${name}"]:checked`) || {}).value;
  const MAX_PIXELS = 120e6; // one page; above this the browser runs out of memory

  function settings() {
    const dpiSel = val('dpi');
    let dpi = dpiSel === 'custom' ? Number($('dpiCustom').value) || 150 : Number(dpiSel);
    dpi = Math.max(20, Math.min(1200, dpi));
    return {
      mode: val('mode'), format: val('format'), dpi, color: val('color'),
      quality: Number($('quality').value), pages: $('optPages').value,
      pattern: $('namePattern').value.trim() || '{name}-{page}',
      tiffMulti: $('tiffMulti').checked, alpha: $('alpha').checked,
    };
  }

  function paint() {
    const s = settings();
    $('dpiCustomRow').hidden = val('dpi') !== 'custom';
    $('qualityOpt').hidden = !(s.format === 'jpg' || s.format === 'webp');
    $('qVal').textContent = s.quality;
    $('tiffMultiRow').hidden = s.format !== 'tiff' || s.mode !== 'pages';
    $('alphaRow').hidden = !(s.format === 'png' || s.format === 'webp') || s.mode !== 'pages';
    $('dpiOpt').hidden = s.mode !== 'pages';
    $('colorOpt').hidden = false;
  }

  // ---------- encoders ----------
  function rgba(pix) {
    const w = pix.getWidth(); const h = pix.getHeight();
    const n = pix.getNumberOfComponents() + (pix.getAlpha() ? 1 : 0);
    const stride = pix.getStride();
    const src = pix.getPixels();
    const out = new ImageData(w, h);
    const d = out.data;
    for (let y = 0; y < h; y++) {
      let si = y * stride; let di = y * w * 4;
      for (let x = 0; x < w; x++, si += n, di += 4) {
        if (n >= 3) { d[di] = src[si]; d[di + 1] = src[si + 1]; d[di + 2] = src[si + 2]; d[di + 3] = n === 4 ? src[si + 3] : 255; }
        else { d[di] = d[di + 1] = d[di + 2] = src[si]; d[di + 3] = n === 2 ? src[si + 1] : 255; }
      }
    }
    return out;
  }
  async function webp(pix, quality) {
    const img = rgba(pix);
    const c = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(img.width, img.height) : Object.assign(document.createElement('canvas'), { width: img.width, height: img.height });
    c.getContext('2d').putImageData(img, 0, 0);
    if (c.convertToBlob) return c.convertToBlob({ type: 'image/webp', quality: quality / 100 });
    return new Promise((r) => c.toBlob(r, 'image/webp', quality / 100));
  }
  async function deflate(u8) {
    const stream = new Blob([u8]).stream().pipeThrough(new CompressionStream('deflate'));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }
  /** Tightly packed rows (no stride padding) of a pixmap without alpha. */
  function packed(pix) {
    const w = pix.getWidth(); const h = pix.getHeight(); const n = pix.getNumberOfComponents();
    const stride = pix.getStride(); const src = pix.getPixels();
    if (stride === w * n) return new Uint8Array(src.slice().buffer);
    const out = new Uint8Array(w * h * n);
    for (let y = 0; y < h; y++) out.set(src.subarray(y * stride, y * stride + w * n), y * w * n);
    return out;
  }
  /** Baseline TIFF, Deflate compressed, one IFD per page. pages: [{w, h, ch, data, dpi}] */
  function tiff(pages) {
    const parts = [];
    let offset = 8;
    const header = new DataView(new ArrayBuffer(8));
    header.setUint16(0, 0x4949, true); header.setUint16(2, 42, true);
    parts.push(header);
    const ifdOffsets = [];
    const pending = [];
    for (const pg of pages) {
      const dataOff = offset;
      parts.push(pg.data);
      offset += pg.data.length + (pg.data.length % 2);
      if (pg.data.length % 2) parts.push(new Uint8Array(1));
      const tags = [
        [256, 4, 1, pg.w], [257, 4, 1, pg.h], [258, 3, pg.ch, pg.ch === 3 ? 'bps' : 8], [259, 3, 1, 8], [262, 3, 1, pg.ch === 3 ? 2 : 1],
        [273, 4, 1, dataOff], [277, 3, 1, pg.ch], [278, 4, 1, pg.h], [279, 4, 1, pg.data.length],
        [282, 5, 1, 'xres'], [283, 5, 1, 'yres'], [284, 3, 1, 1], [296, 3, 1, 2],
      ];
      const ifdSize = 2 + tags.length * 12 + 4;
      const extraOff = offset + ifdSize;
      const extra = new DataView(new ArrayBuffer(6 + 16));
      extra.setUint16(0, 8, true); extra.setUint16(2, 8, true); extra.setUint16(4, 8, true);
      extra.setUint32(6, pg.dpi, true); extra.setUint32(10, 1, true); extra.setUint32(14, pg.dpi, true); extra.setUint32(18, 1, true);
      const ifd = new DataView(new ArrayBuffer(ifdSize));
      ifd.setUint16(0, tags.length, true);
      tags.forEach(([tag, type, count, v], i) => {
        const p = 2 + i * 12;
        ifd.setUint16(p, tag, true); ifd.setUint16(p + 2, type, true); ifd.setUint32(p + 4, count, true);
        if (v === 'bps') ifd.setUint32(p + 8, extraOff, true);
        else if (v === 'xres') ifd.setUint32(p + 8, extraOff + 6, true);
        else if (v === 'yres') ifd.setUint32(p + 8, extraOff + 14, true);
        else if (type === 3) ifd.setUint16(p + 8, v, true);
        else ifd.setUint32(p + 8, v, true);
      });
      ifdOffsets.push(offset);
      pending.push(ifd);
      parts.push(ifd, extra);
      offset += ifdSize + 22;
    }
    header.setUint32(4, ifdOffsets[0], true);
    pending.forEach((ifd, i) => ifd.setUint32(ifd.byteLength - 4, ifdOffsets[i + 1] || 0, true));
    return new Blob(parts, { type: 'image/tiff' });
  }

  async function encode(pix, s) {
    if (s.format === 'jpg') return new Blob([pix.asJPEG(s.quality, false).slice()], { type: 'image/jpeg' });
    if (s.format === 'png') return new Blob([pix.asPNG().slice()], { type: 'image/png' });
    if (s.format === 'webp') return webp(pix, s.quality);
    return tiff([await tiffPage(pix, s.dpi)]);
  }
  async function tiffPage(pix, dpi) {
    let p = pix;
    if (p.getAlpha()) p = p.convertToColorSpace(p.getColorSpace() || window.__m.ColorSpace.DeviceRGB, false);
    return { w: p.getWidth(), h: p.getHeight(), ch: p.getNumberOfComponents(), data: await deflate(packed(p)), dpi: Math.round(dpi) };
  }

  const pad = (n, total) => String(n).padStart(String(total).length, '0');
  const nameFor = (s, base, page, total, ext) => FMKit.safeName(s.pattern.replace(/\{name\}/g, base).replace(/\{page\}/g, pad(page, total)).replace(/\{total\}/g, total)) + '.' + ext;
  const EXT = { jpg: 'jpg', png: 'png', webp: 'webp', tiff: 'tif' };

  function pagesIn(spec, count) {
    try { return P.parsePages(spec, count); } catch (e) {
      if (/outside/.test(e.message)) return P.parsePages(spec, 100000).filter((i) => i < count);
      throw e;
    }
  }

  /** Pixel size and DPI actually used for a page (lowered when the page would be too big for memory). */
  function fitDpi(page, dpi) {
    const b = page.getBounds();
    const w = ((b[2] - b[0]) / 72) * dpi; const h = ((b[3] - b[1]) / 72) * dpi;
    if (w * h <= MAX_PIXELS) return { dpi, w: Math.round(w), h: Math.round(h), lowered: false };
    const d = Math.floor(dpi * Math.sqrt(MAX_PIXELS / (w * h)));
    return { dpi: d, w: Math.round(((b[2] - b[0]) / 72) * d), h: Math.round(((b[3] - b[1]) / 72) * d), lowered: true };
  }

  // ---------- pictures inside ----------
  function pageImages(page) {
    const refs = [];
    const seen = new Set();
    const visit = (res, depth) => {
      if (!res || res.isNull() || depth > 4) return;
      const xo = res.get('XObject');
      if (!xo || xo.isNull()) return;
      xo.forEach((ref) => {
        if (!ref.isIndirect() || seen.has(ref.asIndirect())) return;
        seen.add(ref.asIndirect());
        const sub = ref.get('Subtype');
        if (sub.isName() && sub.asName() === 'Image') refs.push(ref);
        else if (sub.isName() && sub.asName() === 'Form') visit(ref.get('Resources'), depth + 1);
      });
    };
    visit(page.getObject().getInheritable('Resources'), 0);
    return refs;
  }

  async function run(items, ui) {
    const m = await FM.mupdf();
    window.__m = m;
    const s = settings();
    const out = [];
    let lowered = 0;
    const totalPages = items.reduce((t, it) => t + it.pages, 0);
    let done = 0;
    for (const it of items) {
      const doc = await FM.openPdf(it.file);
      const base = FMKit.baseOf(it.file.name);
      const count = doc.countPages();
      const idx = pagesIn(s.pages, count);
      if (s.mode === 'extract') {
        const seen = new Set();
        let k = 0;
        for (const i of idx) {
          ui.progress(done++, totalPages, `${it.file.name} · page ${i + 1}`);
          await ui.yield();
          for (const ref of pageImages(doc.loadPage(i))) {
            const n = ref.asIndirect();
            if (seen.has(n)) continue;
            seen.add(n);
            const w0 = ref.get('Width').asNumber(); const h0 = ref.get('Height').asNumber();
            if (w0 * h0 < 32 * 32) continue;
            k++;
            const filter = ref.get('Filter');
            const csObj = ref.get('ColorSpace');
            const raw = s.format === 'jpg' && s.color === 'color' && filter.isName() && filter.asName() === 'DCTDecode'
              && csObj.isName() && /^Device(RGB|Gray)$/.test(csObj.asName()) && ref.get('Decode').isNull();
            let blob;
            if (raw) blob = new Blob([ref.readRawStream().asUint8Array().slice()], { type: 'image/jpeg' });
            else {
              let pix = doc.loadImage(ref).toPixmap();
              const cs = pix.getColorSpace();
              if (s.color !== 'color') pix = pix.convertToColorSpace(m.ColorSpace.DeviceGray, false);
              else if (cs && !cs.isRGB() && !cs.isGray()) pix = pix.convertToColorSpace(m.ColorSpace.DeviceRGB, false);
              if (s.color === 'bw') { const px = pix.getPixels(); for (let j = 0; j < px.length; j++) px[j] = px[j] < 160 ? 0 : 255; }
              if (pix.getAlpha() && (s.format === 'jpg' || s.format === 'tiff')) pix = pix.convertToColorSpace(pix.getColorSpace(), false);
              blob = await encode(pix, { ...s, dpi: 72 });
            }
            out.push({ name: FMKit.safeName(`${base}-image-${pad(k, 99)}`) + '.' + EXT[s.format], blob, folder: it.folder });
          }
        }
        continue;
      }
      const tiffPages = [];
      for (const i of idx) {
        ui.progress(done++, totalPages, `${it.file.name} · page ${i + 1} of ${count}`);
        await ui.yield();
        const page = doc.loadPage(i);
        const f = fitDpi(page, s.dpi);
        if (f.lowered) lowered++;
        const alpha = s.alpha && (s.format === 'png' || s.format === 'webp');
        const pix = P.render(m, page, f.dpi, s.color, alpha);
        if (s.format === 'tiff' && s.tiffMulti) { tiffPages.push(await tiffPage(pix, f.dpi)); continue; }
        const blob = await encode(pix, { ...s, dpi: f.dpi });
        out.push({ name: nameFor(s, base, i + 1, count, EXT[s.format]), blob, folder: it.folder, note: f.lowered ? `${f.dpi} DPI` : '', noteKind: 'warn' });
      }
      if (tiffPages.length) out.push({ name: FMKit.safeName(base) + '.tif', blob: tiff(tiffPages), folder: it.folder });
    }
    ui.progress(1, 1);
    if (lowered) FM.toast(`${lowered} very large page(s) were made at a lower DPI so your browser has enough memory.`);
    if (!out.length && s.mode === 'extract') throw new Error('No pictures were found inside these PDFs. Choose "Every page" to turn the pages into images.');
    return out;
  }

  // ---------- estimate: render the first page with these settings ----------
  async function estimate(items, stale) {
    paint();
    const s = settings();
    const it = items[0];
    if (!it) return '';
    const total = items.reduce((t, x) => { try { return t + pagesIn(s.pages, x.pages).length; } catch { return t; } }, 0);
    if (s.mode === 'extract') return `Pictures from ${total} page(s)`;
    const m = await FM.mupdf();
    const doc = await FM.openPdf(it.file);
    if (stale()) return '';
    const page = doc.loadPage(Math.min(doc.countPages() - 1, pagesIn(s.pages, doc.countPages())[0] || 0));
    const f = fitDpi(page, s.dpi);
    const px = f.w * f.h;
    const scale = px > 8e6 ? Math.sqrt(8e6 / px) : 1;
    const pix = P.render(m, page, f.dpi * scale, s.color, s.alpha && s.format !== 'jpg');
    if (stale()) return '';
    const blob = await encode(pix, { ...s, format: s.format === 'tiff' ? 'tiff' : s.format });
    const bytes = blob.size / (scale * scale);
    const label = s.format === 'tiff' && s.tiffMulti ? `${items.length} TIFF file(s)` : `${total} image(s)`;
    const all = s.format === 'tiff' && s.tiffMulti ? bytes * total : bytes * total;
    return `${label} · ${f.w} × ${f.h} px each · about ${formatBytes(all)} in all`;
  }

  FMKit.init({
    key: 'pdf2img', accept: 'pdf', runLabel: 'Convert to images', makes: 'image', busyTitle: 'Converting…',
    run, estimate,
    zipName: () => 'images',
    doneTitle: (outs) => (outs.length === 1 ? 'Your image is ready' : `${outs.length} images are ready`),
    preview(outs, el) {
      const imgs = outs.filter((x) => /image\/(jpeg|png|webp)/.test(x.blob.type)).slice(0, 8);
      if (!imgs.length) return;
      el.innerHTML = `<div class="thumb-strip">${imgs.map((x) => `<img src="${URL.createObjectURL(x.blob)}" alt="" loading="lazy">`).join('')}</div>`;
    },
  });
  document.getElementById('kitOpts').addEventListener('change', paint);
  paint();
})();
