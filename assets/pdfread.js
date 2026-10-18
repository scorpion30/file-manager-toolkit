/* Reads the text inside drawn areas of a PDF page: real PDF text first, OCR (Tesseract)
 * when an area has no text layer. Shared by PDF to Excel and Rename from Title Block. */
(() => {
  'use strict';
  // Same character set as the desktop app: digits, A-Z without O and Q, dash, underscore.
  const CODE_WHITELIST = '0123456789ABCDEFGHIJKLMNPRSTUVWXYZ-_';
  const MAX_OCR_PIXELS = 40e6;

  /** Renders one area at the OCR DPI and returns a black/white canvas (Otsu threshold). */
  function renderArea(m, page, pageRect, dpi) {
    let scale = dpi / 72;
    const [x0, y0, x1, y1] = pageRect;
    const area = (x1 - x0) * (y1 - y0) * scale * scale;
    if (area > MAX_OCR_PIXELS) scale *= Math.sqrt(MAX_OCR_PIXELS / area);
    const bbox = [Math.floor(x0 * scale), Math.floor(y0 * scale), Math.ceil(x1 * scale), Math.ceil(y1 * scale)];
    const pix = new m.Pixmap(m.ColorSpace.DeviceGray, bbox, false);
    pix.clear(255);
    // The pixmap's bbox already selects the area; the page is scaled once, by run().
    const dev = new m.DrawDevice(m.Matrix.identity, pix);
    page.run(dev, m.Matrix.scale(scale, scale));
    dev.close();
    const w = pix.getWidth();
    const h = pix.getHeight();
    const gray = pix.getPixels();
    const stride = pix.getStride();

    const hist = new Array(256).fill(0);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) hist[gray[y * stride + x]]++;
    const total = w * h;
    let sum = 0;
    for (let i = 0; i < 256; i++) sum += i * hist[i];
    let sumB = 0, wB = 0, best = 0, threshold = 128;
    for (let i = 0; i < 256; i++) {
      wB += hist[i];
      if (!wB) continue;
      const wF = total - wB;
      if (!wF) break;
      sumB += i * hist[i];
      const mB = sumB / wB, mF = (sum - sumB) / wF;
      const between = wB * wF * (mB - mF) ** 2;
      if (between > best) { best = between; threshold = i; }
    }

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    const img = ctx.createImageData(w, h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const v = gray[y * stride + x] > threshold ? 255 : 0;
        const j = (y * w + x) * 4;
        img.data[j] = img.data[j + 1] = img.data[j + 2] = v;
        img.data[j + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    pix.destroy?.();
    return canvas;
  }

  let worker = null;
  let workerKey = '';

  async function ocrWorker(lang, mode, onLoading) {
    const key = lang + '|' + mode;
    if (worker && workerKey === key) return worker;
    if (worker) await worker.terminate();
    if (onLoading) onLoading(lang);
    const Tesseract = await FM.tesseract();
    worker = await Tesseract.createWorker(lang, 1);
    await worker.setParameters({
      tessedit_pageseg_mode: '6',
      tessedit_char_whitelist: mode === 'codes' ? CODE_WHITELIST : '',
      preserve_interword_spaces: '1',
    });
    workerKey = key;
    return worker;
  }

  /** Normalises extracted text the way the desktop app did. */
  function clean(text, { upper = true, dedupe = true } = {}) {
    let t = String(text ?? '')
      .replace(/[‐-—]/g, '-')
      .replace(/ /g, ' ')
      .replace(/[​-‍﻿]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (upper) t = t.toUpperCase();
    if (dedupe) t = FM.removeDuplicateWords(t);
    return t;
  }

  /**
   * Reads every area on one page of a PDF file.
   * opts: {pageIndex, lang, dpi, mode, upper, dedupe, onOcrLoading}
   * Returns {values: string[], ocr: boolean[]}.
   */
  async function readAreas(file, rects, opts) {
    const m = await FM.mupdf();
    const doc = await FM.openPdf(file);
    const count = doc.countPages();
    if (opts.pageIndex >= count) throw new Error(`has only ${count} page(s)`);
    const page = doc.loadPage(opts.pageIndex);
    const chars = PdfView.pageChars(page);
    const values = [];
    const ocr = [];
    for (const r of rects) {
      const pageRect = PdfView.toPageRect(page, r);
      let text = clean(PdfView.textInRect(chars, pageRect), opts);
      let usedOcr = false;
      if (!text) {
        const w = await ocrWorker(opts.lang, opts.mode, opts.onOcrLoading);
        const { data } = await w.recognize(renderArea(m, page, pageRect, opts.dpi));
        text = clean(data.text, opts);
        usedOcr = true;
      }
      values.push(text);
      ocr.push(usedOcr);
    }
    return { values, ocr, pages: count };
  }

  window.PdfRead = { readAreas, clean };
})();
