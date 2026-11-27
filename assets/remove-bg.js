/* Remove background: an AI model (ORMBG, Apache-2.0) finds the subject in each photo, in the browser.
 * The model is downloaded once (about 45 MB, or 88 MB on WebGPU) and cached by the browser. Nothing is uploaded. */
(() => {
  'use strict';
  const { $ } = FM;
  const TRANSFORMERS = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.1/dist/transformers.min.js';
  const MODEL = 'onnx-community/ormbg-ONNX';
  const MAX_PX = 5000; // longest side kept; bigger photos are scaled down to stay inside the browser's memory
  const val = (name) => (document.querySelector(`input[name="${name}"]:checked`) || {}).value;

  let segPromise = null;
  async function hasWebGPU() {
    try { return !!(navigator.gpu && await navigator.gpu.requestAdapter()); } catch { return false; }
  }
  /** Loads the model once. onStatus(text, fraction) reports the download. */
  function segmenter(onStatus) {
    if (segPromise) return segPromise;
    segPromise = (async () => {
      const T = await import(TRANSFORMERS);
      const files = new Map();
      const progress_callback = (p) => {
        if (p.status === 'progress' && p.total) {
          files.set(p.file, [p.loaded, p.total]);
          let a = 0; let b = 0;
          files.forEach(([l, t]) => { a += l; b += t; });
          onStatus(`Downloading the AI model, first time only: ${Math.round(a / 1048576)} of ${Math.round(b / 1048576)} MB`, a / b);
        }
      };
      const tryLoad = (device, dtype) => T.pipeline('background-removal', MODEL, { device, dtype, progress_callback });
      let pipe;
      if (await hasWebGPU()) {
        try { pipe = await tryLoad('webgpu', 'fp16'); } catch (e) { console.warn('WebGPU failed, using WASM', e); }
      }
      if (!pipe) pipe = await tryLoad('wasm', 'q8');
      return { pipe, RawImage: T.RawImage };
    })();
    segPromise.catch(() => { segPromise = null; });
    return segPromise;
  }

  /** The photo drawn upright on a canvas, no bigger than MAX_PX. */
  async function loadPhoto(file) {
    const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const k = Math.min(1, MAX_PX / Math.max(bmp.width, bmp.height));
    const w = Math.max(1, Math.round(bmp.width * k)); const h = Math.max(1, Math.round(bmp.height * k));
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    c.getContext('2d').drawImage(bmp, 0, 0, w, h);
    bmp.close();
    return c;
  }

  /** Subject box from the mask (alpha > 24), with a small margin. */
  function bbox(alpha, w, h) {
    let x0 = w; let y0 = h; let x1 = -1; let y1 = -1;
    for (let y = 0; y < h; y++) {
      const row = y * w;
      for (let x = 0; x < w; x++) {
        if (alpha[row + x] > 24) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      }
    }
    if (x1 < 0) return null;
    const pad = Math.round(Math.max(x1 - x0, y1 - y0) * 0.03);
    x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad);
    x1 = Math.min(w - 1, x1 + pad); y1 = Math.min(h - 1, y1 + pad);
    return { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
  }

  function settings() {
    const format = val('format');
    let bg = val('bg');
    if (format === 'jpg' && bg === 'none') bg = 'white';
    return { bg, color: $('bgColor').value, format, edge: val('edge'), crop: $('cropSubject').checked };
  }

  function paint() {
    $('bgColorRow').hidden = val('bg') !== 'color';
    $('jpgNote').hidden = !(val('format') === 'jpg' && val('bg') === 'none');
  }

  async function run(items, ui) {
    const s = settings();
    ui.progress(0, 1, 'Starting the AI model…');
    const { pipe, RawImage } = await segmenter((text, f) => ui.progress(f, 1, text));
    const out = [];
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      ui.progress(i, items.length, `Finding the subject: ${it.file.name}`);
      await ui.yield();
      const photo = await loadPhoto(it.file);
      const { width: w, height: h } = photo;
      const ctx = photo.getContext('2d', { willReadFrequently: true });
      const data = ctx.getImageData(0, 0, w, h);
      const raw = new RawImage(data.data, w, h, 4);
      const res = await pipe(raw);
      const cut = Array.isArray(res) ? res[0] : res;
      // The result is RGBA at the photo's size; its alpha channel is the mask.
      const mask = new Uint8ClampedArray(w * h);
      const ch = cut.channels || 4;
      const src = cut.data;
      if (cut.width === w && cut.height === h) {
        for (let p = 0, q = ch - 1; p < mask.length; p++, q += ch) mask[p] = src[q];
      } else {
        // resize the mask with a canvas if the model returned another size
        const mc = new OffscreenCanvas(cut.width, cut.height);
        const md = new ImageData(cut.width, cut.height);
        for (let p = 0, q = ch - 1; p < cut.width * cut.height; p++, q += ch) md.data[p * 4 + 3] = src[q];
        mc.getContext('2d').putImageData(md, 0, 0);
        const big = new OffscreenCanvas(w, h); const bctx = big.getContext('2d');
        bctx.drawImage(mc, 0, 0, w, h);
        const bd = bctx.getImageData(0, 0, w, h).data;
        for (let p = 0; p < mask.length; p++) mask[p] = bd[p * 4 + 3];
      }
      if (s.edge === 'sharp') for (let p = 0; p < mask.length; p++) mask[p] = mask[p] > 127 ? 255 : 0;
      for (let p = 0; p < mask.length; p++) data.data[p * 4 + 3] = mask[p];
      ctx.putImageData(data, 0, 0);

      const box = s.crop ? bbox(mask, w, h) : null;
      const r = box || { x: 0, y: 0, w, h };
      const outC = document.createElement('canvas');
      outC.width = r.w; outC.height = r.h;
      const octx = outC.getContext('2d');
      if (s.bg !== 'none') { octx.fillStyle = s.bg === 'white' ? '#ffffff' : s.color; octx.fillRect(0, 0, r.w, r.h); }
      octx.drawImage(photo, r.x, r.y, r.w, r.h, 0, 0, r.w, r.h);
      const type = { png: 'image/png', webp: 'image/webp', jpg: 'image/jpeg' }[s.format];
      const blob = await new Promise((ok) => outC.toBlob(ok, type, 0.92));
      const thumbC = document.createElement('canvas');
      const tk = Math.min(1, 96 / Math.max(r.w, r.h));
      thumbC.width = Math.max(1, Math.round(r.w * tk)); thumbC.height = Math.max(1, Math.round(r.h * tk));
      thumbC.getContext('2d').drawImage(outC, 0, 0, thumbC.width, thumbC.height);
      out.push({
        name: FMKit.safeName(`${FMKit.baseOf(it.file.name)}-no-bg.${s.format}`), blob, type, folder: it.folder || '',
        thumb: thumbC.toDataURL('image/png'), url: URL.createObjectURL(blob), before: it.file,
      });
    }
    ui.progress(1, 1);
    return out;
  }

  function preview(outputs, el) {
    el.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'rbg-grid' + (outputs.length === 1 ? ' one' : '');
    outputs.slice(0, 6).forEach((o) => {
      const fig = document.createElement('figure');
      fig.className = 'rbg-pair';
      const before = URL.createObjectURL(o.before);
      fig.innerHTML = `<div class="rbg-before"><img src="${before}" alt=""><span>Before</span></div><div class="rbg-after"><img src="${o.url}" alt=""><span>After</span></div>`;
      grid.appendChild(fig);
    });
    el.appendChild(grid);
  }

  FMKit.init({
    key: 'removebg', accept: 'image', runLabel: 'Remove background', makes: 'image', busyTitle: 'Removing the background…',
    run, preview,
    zipName: () => 'no-background',
    doneTitle: (o) => (o.length === 1 ? 'Background removed' : `Background removed from ${o.length} photos`),
    estimate: async (items) => { paint(); return `${items.length} photo(s)`; },
  });
  $('kitOpts').addEventListener('change', paint);
  $('kitOpts').addEventListener('input', paint);
  paint();
  window.__removebg = { segmenter };
})();
