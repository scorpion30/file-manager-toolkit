/* Watermark: text (any language) or an image, 9 positions or repeated across the page, size as a
 * share of the page width, angle, opacity, over or under the content. Live preview of page 1. */
(() => {
  'use strict';
  const P = window.PdfOps;
  const { $ } = FM;
  const num = P.num;
  const val = (name) => (document.querySelector(`input[name="${name}"]:checked`) || {}).value;

  let wmImage = null; // { bytes, w, h, url, name }
  let kit;

  function settings() {
    return {
      kind: val('kind'), text: $('wmText').value, color: $('wmColor').value, bold: $('wmBold').checked,
      pos: val('pos'), tile: $('tile').checked, size: Number($('size').value) / 100, angle: Number(val('angle')),
      opacity: Number($('opacity').value) / 100, under: val('layer') === 'under',
    };
  }

  function paint() {
    const s = settings();
    $('textOpt').hidden = s.kind !== 'text';
    $('imageOpt').hidden = s.kind !== 'image';
    $('sizeVal').textContent = `${Math.round(s.size * 100)}%`;
    $('opVal').textContent = `${Math.round(s.opacity * 100)}%`;
    document.querySelector('.posgrid').classList.toggle('off', s.tile);
  }

  /** Centres (in page space) where the stamp goes; w, h = stamp size before turning. */
  function places(s, W, H, w, h) {
    const r = (s.angle * Math.PI) / 180;
    const bw = Math.abs(w * Math.cos(r)) + Math.abs(h * Math.sin(r));
    const bh = Math.abs(w * Math.sin(r)) + Math.abs(h * Math.cos(r));
    if (s.tile) {
      const sx = bw * 1.15 + W * 0.03; const sy = bh * 1.05 + H * 0.03;
      const out = [];
      let row = 0;
      for (let y = sy / 2; y < H + sy / 2; y += sy, row++) {
        for (let x = (row % 2 ? sx : sx / 2) - sx / 2; x < W + sx / 2; x += sx) out.push([x, y]);
      }
      return out;
    }
    const m = Math.min(W, H) * 0.05;
    const col = s.pos[1]; const rw = s.pos[0];
    const x = col === 'l' ? m + bw / 2 : col === 'r' ? W - m - bw / 2 : W / 2;
    const y = rw === 't' ? H - m - bh / 2 : rw === 'b' ? m + bh / 2 : H / 2;
    return [[x, y]];
  }

  /** The stamp's picture (for text in other languages, and for logos). */
  async function stampPicture(s) {
    if (s.kind === 'image') return wmImage;
    const png = await FMKit.textPng(s.text, { size: 60, color: s.color, bold: s.bold, scale: 3 });
    return { bytes: png.bytes, w: png.w, h: png.h };
  }

  async function run(items, ui) {
    const m = await FM.mupdf();
    const s = settings();
    if (s.kind === 'text' && !s.text.trim()) throw new Error('Type the watermark text.');
    if (s.kind === 'image' && !wmImage) throw new Error('Choose the image for the watermark.');
    const latin = s.kind === 'text' && P.isLatin(s.text);
    const pic = latin ? null : await stampPicture(s);
    const out = [];
    for (const [k, it] of items.entries()) {
      const doc = await FM.openPdf(it.file);
      const n = doc.countPages();
      const list = pagesIn($('optPages').value, n);
      const font = latin ? P.helvetica(m, doc, s.bold) : null;
      const img = pic ? doc.addImage(new m.Image(pic.bytes)) : null;
      const gs = s.opacity < 1 ? P.opacityState(doc, s.opacity) : null;
      for (const [j, i] of list.entries()) {
        if (j % 10 === 0) { ui.progress(k + j / list.length, items.length, `${it.file.name} · page ${i + 1} of ${n}`); await ui.yield(); }
        const page = doc.loadPage(i);
        const pageObj = page.getObject();
        const { W, H } = P.pageSpace(m, page);
        const target = W * s.size * (s.tile ? 0.5 : 1);
        let ops = gs ? `/${P.addResource(doc, pageObj, 'ExtGState', gs)} gs\n` : '';
        const r = (s.angle * Math.PI) / 180;
        const rot = `${num(Math.cos(r))} ${num(Math.sin(r))} ${num(-Math.sin(r))} ${num(Math.cos(r))}`;
        if (latin) {
          const fname = P.addResource(doc, pageObj, 'Font', font.ref);
          const size = target / (P.textWidth(font.font, s.text, 1) || 1);
          const w = target; const h = size * 0.72;
          const [cr, cg, cb] = FMKit.hexRgb(s.color);
          for (const [x, y] of places(s, W, H, w, h)) {
            ops += `q ${rot} ${num(x)} ${num(y)} cm BT /${fname} ${num(size)} Tf ${num(cr)} ${num(cg)} ${num(cb)} rg ${num(-w / 2)} ${num(-h / 2)} Td ${P.pdfStr(s.text)} Tj ET Q\n`;
          }
        } else {
          const name = P.addResource(doc, pageObj, 'XObject', img);
          const w = target; const h = (target * pic.h) / pic.w;
          for (const [x, y] of places(s, W, H, w, h)) {
            ops += `q ${rot} ${num(x)} ${num(y)} cm ${num(w)} 0 0 ${num(h)} ${num(-w / 2)} ${num(-h / 2)} cm /${name} Do Q\n`;
          }
        }
        P.appendContent(m, doc, page, ops, { under: s.under });
      }
      const bytes = doc.saveToBuffer('garbage=1,compress').asUint8Array().slice();
      out.push({ name: FMKit.safeName(FMKit.baseOf(it.file.name) + '-watermarked.pdf'), bytes, type: 'application/pdf', folder: it.folder, note: `${list.length} page(s)` });
    }
    ui.progress(1, 1);
    return out;
  }

  function pagesIn(spec, count) {
    if (!spec.trim()) return [...Array(count).keys()];
    try { return P.parsePages(spec, count); } catch (e) {
      if (/outside/.test(e.message)) return P.parsePages(spec, 100000).filter((i) => i < count);
      throw e;
    }
  }

  // ---------- live preview ----------
  let pv = { id: null, img: null, W: 0, H: 0 };
  let pvToken = 0;
  async function preview() {
    const box = $('livePreview');
    const it = kit && kit.items.find((x) => !x.error && !x.locked);
    if (!it) { box.innerHTML = ''; return; }
    const token = ++pvToken;
    if (pv.id !== it.id) {
      const m = await FM.mupdf();
      const doc = m.Document.openDocument(new Uint8Array(await it.file.arrayBuffer()), 'application/pdf');
      const page = doc.loadPage(0);
      const b = page.getBounds();
      const W = b[2] - b[0]; const H = b[3] - b[1];
      const k = 900 / Math.max(W, H);
      const pix = page.toPixmap(m.Matrix.scale(k, k), m.ColorSpace.DeviceRGB, false, true);
      const img = new Image();
      img.src = URL.createObjectURL(new Blob([pix.asPNG().slice()], { type: 'image/png' }));
      await img.decode();
      if (pv.img) URL.revokeObjectURL(pv.img.src);
      pv = { id: it.id, img, W, H };
    }
    if (token !== pvToken) return;
    const s = settings();
    let c = box.querySelector('canvas');
    if (!c) { box.innerHTML = '<canvas></canvas><p class="hint">Preview of page 1</p>'; c = box.querySelector('canvas'); }
    c.width = pv.img.naturalWidth; c.height = pv.img.naturalHeight;
    const ctx = c.getContext('2d');
    ctx.drawImage(pv.img, 0, 0);
    const k = c.width / pv.W;
    const target = pv.W * s.size * (s.tile ? 0.5 : 1);
    let draw = null; let w = target; let h;
    if (s.kind === 'text') {
      if (!s.text.trim()) return;
      const fam = P.isLatin(s.text) ? 'Helvetica, Arial, sans-serif' : '"Segoe UI", Tahoma, Arial, sans-serif';
      ctx.font = `${s.bold ? 700 : 400} 100px ${fam}`;
      const fs = (100 * target) / (ctx.measureText(s.text).width || 1);
      h = fs * 0.72;
      draw = () => {
        ctx.font = `${s.bold ? 700 : 400} ${fs * k}px ${fam}`;
        ctx.fillStyle = s.color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(s.text, 0, 0);
      };
    } else {
      if (!wmImage) return;
      h = (target * wmImage.h) / wmImage.w;
      const im = wmImage.el;
      draw = () => ctx.drawImage(im, (-w * k) / 2, (-h * k) / 2, w * k, h * k);
    }
    ctx.globalAlpha = s.opacity;
    for (const [x, y] of places(s, pv.W, pv.H, w, h)) {
      ctx.save();
      ctx.translate(x * k, c.height - y * k);
      ctx.rotate((-s.angle * Math.PI) / 180);
      draw();
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  // ---------- image picker ----------
  const picker = document.createElement('input');
  picker.type = 'file';
  picker.accept = 'image/png,image/jpeg,image/webp';
  picker.addEventListener('change', async () => {
    const f = picker.files[0];
    picker.value = '';
    if (!f) return;
    // through a canvas: any format becomes a PNG that keeps transparency
    const bmp = await createImageBitmap(f);
    const c = document.createElement('canvas');
    c.width = bmp.width; c.height = bmp.height;
    c.getContext('2d').drawImage(bmp, 0, 0);
    bmp.close();
    const blob = await new Promise((r) => c.toBlob(r, 'image/png'));
    const el = new Image();
    el.src = URL.createObjectURL(blob);
    await el.decode();
    wmImage = { bytes: new Uint8Array(await blob.arrayBuffer()), w: c.width, h: c.height, el, name: f.name };
    $('wmImgName').textContent = f.name;
    preview();
  });
  $('wmPick').addEventListener('click', () => picker.click());

  kit = FMKit.init({
    key: 'watermark', accept: 'pdf', runLabel: 'Add watermark', makes: 'pdf', busyTitle: 'Adding the watermark…',
    run,
    zipName: () => 'watermarked',
    onItems: () => { preview().catch(() => {}); },
    onOptions: () => { paint(); preview().catch(() => {}); },
  });
  window.__wm = { setImage: async (blob, name) => { picker.dispatchEvent(new Event('x')); const dt = new DataTransfer(); dt.items.add(new File([blob], name || 'logo.png', { type: blob.type })); picker.files = dt.files; picker.dispatchEvent(new Event('change')); } };
  paint();
})();
