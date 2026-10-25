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
    canvas.pageMap = { scale, x: bbox[0], y: bbox[1] }; // canvas pixel → page: (px + x) / scale
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
   * Returns {values: string[], ocr: boolean[], pages}.
   */
  async function readAreas(file, rects, opts) {
    const doc = await FM.openPdf(file);
    const count = doc.countPages();
    if (opts.pageIndex >= count) throw new Error(`has only ${count} page(s)`);
    return { ...(await readPage(doc.loadPage(opts.pageIndex), rects, opts)), pages: count };
  }

  // ---------- anchors: the label printed next to each box ----------
  // Sheets in one set do not always share a layout: on some the title block sits elsewhere.
  // Each box remembers the label just above it on the page it was drawn on ("DRAWING TITLE:",
  // "REVISION NO."); on a page where that label is found somewhere else, the box moves with it.
  const norm = (s) => String(s || '').toUpperCase().replace(/[^A-Z0-9؀-ۿ]/g, '');

  /** Text runs (lines split at wide gaps) with their boxes in page units. */
  function textRuns(chars, rect) {
    const runs = [];
    for (const line of PdfView.linesInRect(chars, rect)) {
      let run = null;
      for (const ch of line) {
        if (run && (ch.along - ch.width / 2) - run.end > (ch.size || 10) * 2) run = null;
        if (!run) { run = { text: '', x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity, end: 0 }; runs.push(run); }
        run.text += ch.c;
        run.x0 = Math.min(run.x0, ch.x0); run.y0 = Math.min(run.y0, ch.y0);
        run.x1 = Math.max(run.x1, ch.x1); run.y1 = Math.max(run.y1, ch.y1);
        run.end = ch.along + ch.width / 2;
      }
    }
    return runs.filter((r) => /[A-Z؀-ۿ]/i.test(r.text) && norm(r.text).length >= 2);
  }

  /** Finds the label above each box on the page the boxes were drawn on: [{key, x, y} | null]. */
  async function learnAnchors(page, rects, opts) {
    const m = await FM.mupdf();
    const chars = PdfView.pageChars(page);
    const [, , pw, ph] = page.getBounds();
    const anchors = [];
    for (const r of rects) {
      const [x0, y0, x1, y1] = PdfView.toPageRect(page, r);
      const h = y1 - y0;
      const strip = [Math.max(0, x0 - (x1 - x0) * 0.3), Math.max(0, y0 - Math.max(h * 1.5, 18)), Math.min(pw, x1), Math.min(ph, y0 + h * 0.35)];
      let runs = textRuns(chars, strip);
      if (!runs.length && opts.ocr !== false) {
        try {
          const w = await ocrWorker(opts.lang, 'text', opts.onOcrLoading);
          const canvas = renderArea(m, page, strip, opts.dpi);
          const { data } = await w.recognize(canvas, {}, { blocks: true });
          const k = canvas.pageMap;
          runs = (data.blocks || []).flatMap((b) => b.paragraphs).flatMap((p) => p.lines)
            .filter((l) => l.confidence > 50 && norm(l.text).length >= 2)
            .map((l) => ({ text: l.text.trim(), x0: (l.bbox.x0 + k.x) / k.scale, y1: (l.bbox.y1 + k.y) / k.scale }));
        } catch { runs = []; }
      }
      // the label is the run sitting lowest above the top of the box (or, failing that, just inside it)
      const lowest = (list) => list.sort((p, q) => q.y1 - p.y1)[0];
      const label = lowest(runs.filter((l) => l.y1 <= y0 + 3)) || lowest(runs.filter((l) => l.y1 <= y0 + h * 0.35));
      anchors.push(label && norm(label.text).length >= 4 ? { key: norm(label.text), x: label.x0, y: label.y1 } : null);
    }
    return anchors;
  }

  /** How far a label moved on this page, or null when it is not there (or too far to trust). */
  function shiftFor(runs, a, page) {
    const [, , pw, ph] = page.getBounds();
    let best = null;
    for (const run of runs) {
      const k = norm(run.text);
      if (!k.startsWith(a.key) && !(a.key.startsWith(k) && k.length >= a.key.length * 0.8)) continue;
      const dx = run.x0 - a.x, dy = run.y1 - a.y;
      const d = Math.hypot(dx, dy);
      if (!best || d < best.d) best = { d, dx, dy };
    }
    return best && best.d < Math.hypot(pw, ph) * 0.25 ? best : null;
  }

  /**
   * Reads every area on an already open page. opts.anchors (from learnAnchors) moves a box
   * with its label. Returns {values, ocr, moved, labelOnly}: labelOnly marks a box that only
   * caught (part of) its own label, which is reported as not read.
   */
  async function readPage(page, rects, opts) {
    const m = await FM.mupdf();
    const chars = PdfView.pageChars(page);
    const runs = opts.anchors && opts.anchors.some(Boolean) && chars.length ? textRuns(chars, page.getBounds()) : [];
    const values = [];
    const ocr = [];
    const moved = [];
    const labelOnly = [];
    for (const [i, r] of rects.entries()) {
      let pageRect = PdfView.toPageRect(page, r);
      const a = opts.anchors && opts.anchors[i];
      const s = a && runs.length ? shiftFor(runs, a, page) : null;
      if (s && s.d > 2) pageRect = [pageRect[0] + s.dx, pageRect[1] + s.dy, pageRect[2] + s.dx, pageRect[3] + s.dy];
      let text = clean(PdfView.textInRect(chars, pageRect), opts);
      let usedOcr = false;
      if (!text && opts.ocr !== false) {
        const w = await ocrWorker(opts.lang, opts.mode, opts.onOcrLoading);
        const { data } = await w.recognize(renderArea(m, page, pageRect, opts.dpi));
        text = clean(data.text, opts);
        usedOcr = true;
      }
      const onlyLabel = !!(a && norm(text).length >= 2 && a.key.includes(norm(text)));
      values.push(onlyLabel ? '' : text);
      ocr.push(usedOcr);
      moved.push(!!(s && s.d > 2));
      labelOnly.push(onlyLabel);
    }
    return { values, ocr, moved, labelOnly };
  }

  window.PdfRead = { readAreas, readPage, learnAnchors, clean };
})();
