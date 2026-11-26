/* Images to PDF: page size, orientation, margins; one PDF, one per image or one per folder.
 * JPG photos go in unchanged (no quality loss); phone photos are turned by their EXIF rotation. */
(() => {
  'use strict';
  const { $ } = FM;
  const val = (name) => (document.querySelector(`input[name="${name}"]:checked`) || {}).value;
  const SIZES = { a4: [595.28, 841.89], a3: [841.89, 1190.55], letter: [612, 792] };

  function paint() {
    $('orientOpt').hidden = val('size') === 'fit';
    $('outNameOpt').hidden = val('output') !== 'one';
  }

  /** EXIF orientation of a JPEG (1 = normal), or 1 when there is none. */
  function exifOrientation(buf) {
    const v = new DataView(buf);
    if (v.byteLength < 4 || v.getUint16(0) !== 0xffd8) return 1;
    let p = 2;
    while (p + 4 < v.byteLength) {
      const marker = v.getUint16(p);
      const len = v.getUint16(p + 2);
      if (marker === 0xffe1 && v.getUint32(p + 4) === 0x45786966) {
        const t = p + 10;
        const le = v.getUint16(t) === 0x4949;
        const ifd = t + v.getUint32(t + 4, le);
        const n = v.getUint16(ifd, le);
        for (let i = 0; i < n; i++) {
          const e = ifd + 2 + i * 12;
          if (v.getUint16(e, le) === 0x0112) return v.getUint16(e + 8, le) || 1;
        }
        return 1;
      }
      if ((marker & 0xff00) !== 0xff00 || marker === 0xffda) break;
      p += 2 + len;
    }
    return 1;
  }

  const isJpeg = (b) => b.length > 3 && b[0] === 0xff && b[1] === 0xd8;
  const isPng = (b) => b.length > 8 && b[0] === 0x89 && b[1] === 0x50;
  const isGif = (b) => b.length > 3 && b[0] === 0x47 && b[1] === 0x49;
  const isBmp = (b) => b.length > 2 && b[0] === 0x42 && b[1] === 0x4d;
  const isTiff = (b) => b.length > 3 && ((b[0] === 0x49 && b[1] === 0x49) || (b[0] === 0x4d && b[1] === 0x4d));

  /** Draws the image (turned by EXIF) on a canvas, scaled to at most maxPx on its long side. */
  async function viaCanvas(file, maxPx) {
    const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const scale = maxPx ? Math.min(1, maxPx / Math.max(bmp.width, bmp.height)) : 1;
    const w = Math.max(1, Math.round(bmp.width * scale)); const h = Math.max(1, Math.round(bmp.height * scale));
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    ctx.drawImage(bmp, 0, 0, w, h);
    bmp.close();
    let alpha = false;
    if (!/jpe?g$/i.test(file.name)) {
      const d = ctx.getImageData(0, 0, w, h).data;
      for (let i = 3; i < d.length; i += 16) { if (d[i] < 250) { alpha = true; break; } }
    }
    if (!alpha) { ctx.globalCompositeOperation = 'destination-over'; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h); }
    const blob = await new Promise((r) => c.toBlob(r, alpha ? 'image/png' : 'image/jpeg', 0.88));
    return { bytes: new Uint8Array(await blob.arrayBuffer()), w, h };
  }

  async function imageFor(m, it, small) {
    const buf = await it.file.arrayBuffer();
    const b = new Uint8Array(buf);
    const orient = isJpeg(b) ? exifOrientation(buf) : 1;
    const native = (isJpeg(b) && orient === 1) || isPng(b) || isGif(b) || isBmp(b) || isTiff(b);
    let img = null;
    let px = null;
    if (native) {
      try { img = new m.Image(b); px = [img.getWidth(), img.getHeight()]; } catch { img = null; }
    }
    if (!img) {
      const c = await viaCanvas(it.file, 0);
      img = new m.Image(c.bytes);
      px = [c.w, c.h];
    }
    let dpi = img.getXResolution();
    if (!dpi || dpi < 50 || dpi > 1200) dpi = 96;
    return { img, px, dpi, file: it.file, small };
  }

  function layout(im, s) {
    const margin = Number(s.margin);
    const natural = [(im.px[0] / im.dpi) * 72, (im.px[1] / im.dpi) * 72];
    let page;
    if (s.size === 'fit') page = [natural[0] + 2 * margin, natural[1] + 2 * margin];
    else {
      const [a, b] = SIZES[s.size];
      const land = s.orient === 'landscape' || (s.orient === 'auto' && im.px[0] > im.px[1]);
      page = land ? [b, a] : [a, b];
    }
    const boxW = page[0] - 2 * margin; const boxH = page[1] - 2 * margin;
    const k = s.size === 'fit' ? 1 : Math.min(boxW / natural[0], boxH / natural[1]);
    const w = natural[0] * k; const h = natural[1] * k;
    return { page, w, h, x: (page[0] - w) / 2, y: (page[1] - h) / 2 };
  }

  async function run(items, ui) {
    const m = await FM.mupdf();
    const s = { size: val('size'), orient: val('orient'), margin: val('margin'), output: val('output'), quality: val('quality') };
    const groups = new Map();
    if (s.output === 'one') groups.set('', items);
    else if (s.output === 'each') items.forEach((it, i) => groups.set(i, [it]));
    else items.forEach((it) => { const k = it.folder || ''; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(it); });
    const out = [];
    let done = 0;
    for (const [key, list] of groups) {
      const doc = new m.PDFDocument();
      for (const it of list) {
        ui.progress(done++, items.length, it.file.name);
        await ui.yield();
        let im = await imageFor(m, it);
        let L = layout(im, s);
        if (s.quality === 'small') {
          const maxPx = Math.round((Math.max(L.w, L.h) / 72) * 150);
          if (Math.max(im.px[0], im.px[1]) > maxPx * 1.1 || !/jpe?g$/i.test(it.file.name)) {
            const c = await viaCanvas(it.file, maxPx);
            const keep = { px: im.px, dpi: im.dpi };
            im = { img: new m.Image(c.bytes), px: [c.w, c.h], dpi: keep.dpi * (c.w / keep.px[0]) };
            L = layout(im, s);
          }
        }
        const ref = doc.addImage(im.img);
        const res = doc.addObject({ XObject: { Im0: ref } });
        const n = (v) => String(Math.round(v * 1000) / 1000);
        const page = doc.addPage([0, 0, L.page[0], L.page[1]], 0, res, `q ${n(L.w)} 0 0 ${n(L.h)} ${n(L.x)} ${n(L.y)} cm /Im0 Do Q`);
        doc.insertPage(-1, page);
      }
      let name;
      if (s.output === 'one') { name = $('outName').value.trim() || 'images.pdf'; if (!/\.pdf$/i.test(name)) name += '.pdf'; }
      else if (s.output === 'each') name = FMKit.baseOf(list[0].file.name) + '.pdf';
      else name = (key ? key.split('/').pop() : 'images') + '.pdf';
      const bytes = doc.saveToBuffer('garbage=4,compress').asUint8Array().slice();
      const folder = s.output === 'each' ? list[0].folder : s.output === 'folder' ? key.split('/').slice(0, -1).join('/') : '';
      out.push({ name: FMKit.safeName(name), bytes, type: 'application/pdf', folder, note: `${list.length} image(s)` });
    }
    ui.progress(1, 1);
    return out;
  }

  FMKit.init({
    key: 'img2pdf', accept: 'image', runLabel: 'Convert to PDF', makes: 'pdf', busyTitle: 'Making your PDF…',
    run,
    zipName: () => 'pdfs',
    estimate: async (items) => { paint(); return `${items.length} image(s) → ${val('output') === 'one' ? '1 PDF' : val('output') === 'each' ? `${items.length} PDFs` : `${new Set(items.map((i) => i.folder)).size} PDF(s)`}`; },
  });
  $('kitOpts').addEventListener('change', paint);
  paint();
})();
