/* PDF operations shared by the tool pages (MuPDF). No page / DOM code here, so the same file
 * runs in the browser (window.PdfOps) and in Node for tests (globalThis.PdfOps).
 * Every function takes the mupdf module `m` as its first argument. */
(function (root) {
  'use strict';
  const P = {};

  // ---------- page numbers typed by people: "1-3, 5, 8-" ----------
  /** Returns 0-based page indexes, in the order typed, without duplicates. Empty = all pages. */
  P.parsePages = function (spec, count) {
    const text = String(spec || '').trim();
    if (!text || /^all$/i.test(text)) return Array.from({ length: count }, (_, i) => i);
    const out = [];
    const seen = new Set();
    for (let part of text.split(/[,،;]/)) {
      part = part.trim().toLowerCase();
      if (!part) continue;
      let a; let b;
      if (part === 'last') { a = b = count; } else {
        const mm = part.match(/^(\d+|last)?\s*(?:-|–|to)\s*(\d+|last)?$/) || part.match(/^(\d+)$/);
        if (!mm) throw new Error(`“${part}” is not a page or range.`);
        const num = (v, d) => (v === undefined ? d : v === 'last' ? count : Number(v));
        if (mm.length === 2 || mm[0] === mm[1]) { a = b = Number(mm[1]); } else { a = num(mm[1], 1); b = num(mm[2], count); }
      }
      if (a < 1 || b < 1 || a > count || b > count) throw new Error(`Pages go from 1 to ${count}: “${part}” is outside.`);
      const step = a <= b ? 1 : -1;
      for (let p = a; step > 0 ? p <= b : p >= b; p += step) {
        if (!seen.has(p)) { seen.add(p); out.push(p - 1); }
      }
    }
    if (!out.length) throw new Error('No pages selected.');
    return out;
  };

  // ---------- drawing on top of (or under) a page ----------
  /**
   * The page as people see it: W x H, origin bottom-left, y up, rotation already applied.
   * M turns those coordinates into the page's own PDF coordinates (for a "cm" operator).
   */
  P.pageSpace = function (m, page) {
    const b = page.getBounds();
    const W = b[2] - b[0];
    const H = b[3] - b[1];
    const flip = [1, 0, 0, -1, b[0], b[3]];
    const M = m.Matrix.concat(flip, m.Matrix.invert(page.getTransform()));
    return { W, H, M };
  };

  const num = (v) => (Math.abs(v) < 1e-6 ? '0' : String(Math.round(v * 10000) / 10000));
  P.num = num;

  /** Adds a resource (Font / XObject / ExtGState) to the page itself and returns its name. */
  P.addResource = function (doc, pageObj, kind, ref) {
    let res = pageObj.get('Resources');
    if (!res || res.isNull()) {
      const inherited = pageObj.getInheritable('Resources');
      res = doc.newDictionary();
      if (inherited && !inherited.isNull()) inherited.forEach((v, k) => res.put(k, v));
      pageObj.put('Resources', res);
    }
    let dict = res.get(kind);
    if (!dict || dict.isNull()) { dict = doc.newDictionary(); res.put(kind, dict); }
    let i = 1;
    while (!dict.get('FMT' + i).isNull()) i++;
    const name = 'FMT' + i;
    dict.put(name, ref);
    return name;
  };

  /**
   * Appends PDF operators drawn in the page's visual space (see pageSpace).
   * under = true puts them below the existing content (a background stamp).
   */
  const isMark = (o) => { try { return o.isStream() && o.readStream().asString() === 'q\n'; } catch { return false; } };
  P.appendContent = function (m, doc, page, ops, { under = false } = {}) {
    const pageObj = page.getObject();
    const { M } = P.pageSpace(m, page);
    const body = `q ${M.map(num).join(' ')} cm\n${ops}\nQ\n`;
    const old = pageObj.get('Contents');
    const arr = doc.newArray();
    const push = (o) => { if (o.isArray()) o.forEach((x) => arr.push(x)); else arr.push(o); };
    if (under) {
      arr.push(doc.addStream(body, {}));
      if (old && !old.isNull()) push(old);
    } else if (old && old.isArray() && old.length > 1 && isMark(old.get(0))) {
      // the old content is already wrapped in q / Q by an earlier stamp: just add this one
      old.forEach((x) => arr.push(x));
      arr.push(doc.addStream(body, {}));
    } else {
      arr.push(doc.addStream('q\n', {}));
      if (old && !old.isNull()) push(old);
      arr.push(doc.addStream('Q\n' + body, {}));
    }
    pageObj.put('Contents', arr);
  };

  // ---------- text with the built-in Helvetica (Latin letters, digits, common symbols) ----------
  P.isLatin = (s) => /^[\x20-\x7e]*$/.test(s);
  P.pdfStr = (s) => '(' + String(s).replace(/[\\()]/g, (c) => '\\' + c) + ')';
  const fonts = new WeakMap();
  P.helvetica = function (m, doc, bold = false) {
    let f = fonts.get(doc);
    if (!f) { f = {}; fonts.set(doc, f); }
    const key = bold ? 'b' : 'r';
    if (!f[key]) {
      const font = new m.Font(bold ? 'Helvetica-Bold' : 'Helvetica');
      f[key] = { font, ref: doc.addSimpleFont(font) };
    }
    return f[key];
  };
  P.textWidth = function (font, text, size) {
    let w = 0;
    for (const ch of text) w += font.advanceGlyph(font.encodeCharacter(ch.codePointAt(0)), 0);
    return w * size;
  };
  P.opacityState = function (doc, alpha) {
    return doc.addObject({ Type: doc.newName('ExtGState'), ca: alpha, CA: alpha });
  };
  const rgb = (c) => c.map((v) => num(v)).join(' ');

  /**
   * Draws one line of Latin text. x, y = anchor in visual space; align: 'left' | 'center' | 'right'
   * around x; angle in degrees, counter-clockwise, around the anchor.
   */
  P.drawText = function (m, doc, page, { text, x, y, size = 12, color = [0, 0, 0], align = 'left', angle = 0, opacity = 1, bold = false, under = false, background = null, middle = false }) {
    const pageObj = page.getObject();
    const { font, ref } = P.helvetica(m, doc, bold);
    const fname = P.addResource(doc, pageObj, 'Font', ref);
    const w = P.textWidth(font, text, size);
    const dx = align === 'center' ? -w / 2 : align === 'right' ? -w : 0;
    const dy = middle ? -size * 0.36 : 0;
    const r = (angle * Math.PI) / 180;
    const c = Math.cos(r); const s = Math.sin(r);
    let ops = '';
    if (opacity < 1) ops += `/${P.addResource(doc, pageObj, 'ExtGState', P.opacityState(doc, opacity))} gs\n`;
    ops += `${num(c)} ${num(s)} ${num(-s)} ${num(c)} ${num(x)} ${num(y)} cm\n`;
    if (background) ops += `${rgb(background)} rg ${num(dx - size * 0.3)} ${num(-size * 0.28)} ${num(w + size * 0.6)} ${num(size * 1.12)} re f\n`;
    ops += `BT /${fname} ${num(size)} Tf ${rgb(color)} rg ${num(dx)} ${num(dy)} Td ${P.pdfStr(text)} Tj ET`;
    P.appendContent(m, doc, page, ops, { under });
    return w;
  };

  /** Draws an image XObject (ref from doc.addImage) with its lower-left corner at x, y. */
  P.drawImage = function (m, doc, page, imgRef, { x, y, w, h, angle = 0, opacity = 1, under = false, cx = null, cy = null }) {
    const pageObj = page.getObject();
    const name = P.addResource(doc, pageObj, 'XObject', imgRef);
    let ops = '';
    if (opacity < 1) ops += `/${P.addResource(doc, pageObj, 'ExtGState', P.opacityState(doc, opacity))} gs\n`;
    if (angle) {
      // rotate around the image centre (or cx, cy)
      const r = (angle * Math.PI) / 180;
      const c = Math.cos(r); const s = Math.sin(r);
      const ox = cx == null ? x + w / 2 : cx;
      const oy = cy == null ? y + h / 2 : cy;
      ops += `1 0 0 1 ${num(ox)} ${num(oy)} cm ${num(c)} ${num(s)} ${num(-s)} ${num(c)} 0 0 cm 1 0 0 1 ${num(-ox)} ${num(-oy)} cm\n`;
    }
    ops += `${num(w)} 0 0 ${num(h)} ${num(x)} ${num(y)} cm /${name} Do`;
    P.appendContent(m, doc, page, ops, { under });
  };

  // ---------- page rotation ----------
  P.getRotation = (page) => {
    const r = page.getObject().getInheritable('Rotate');
    return r && !r.isNull() ? ((r.asNumber() % 360) + 360) % 360 : 0;
  };
  P.setRotation = (page, deg) => { page.getObject().put('Rotate', ((deg % 360) + 360) % 360); };

  // ---------- rendering ----------
  /** mode: 'color' | 'gray' | 'bw'. Returns a Pixmap at `dpi` (white background unless alpha). */
  P.render = function (m, page, dpi, mode = 'color', alpha = false) {
    const s = dpi / 72;
    const cs = mode === 'color' ? m.ColorSpace.DeviceRGB : m.ColorSpace.DeviceGray;
    const pix = page.toPixmap(m.Matrix.scale(s, s), cs, alpha, true);
    if (mode === 'bw') {
      const px = pix.getPixels();
      const n = pix.getNumberOfComponents() + (pix.getAlpha() ? 1 : 0);
      for (let i = 0; i < px.length; i += n) px[i] = px[i] < 160 ? 0 : 255;
    }
    pix.setResolution(Math.round(dpi), Math.round(dpi));
    return pix;
  };

  /** Draws an Image into a new w x h pixmap on white. */
  P.imagePixmap = function (m, img, w, h, gray = false) {
    const pix = new m.Pixmap(gray ? m.ColorSpace.DeviceGray : m.ColorSpace.DeviceRGB, [0, 0, w, h], false);
    pix.clear(255);
    const dev = new m.DrawDevice(m.Matrix.identity, pix);
    dev.fillImage(img, [w, 0, 0, h, 0, 0], 1);
    dev.close();
    return pix;
  };

  // ---------- compression: re-save big images as smaller JPEGs ----------
  /** Largest page side (in points) each image object is drawn on, by object number. */
  function imageUse(doc) {
    const use = new Map();
    let maxSide = 0;
    const visit = (res, side, depth, seen) => {
      if (!res || res.isNull() || depth > 4) return;
      const xo = res.get('XObject');
      if (!xo || xo.isNull()) return;
      xo.forEach((ref) => {
        if (!ref.isIndirect()) return;
        const n = ref.asIndirect();
        const o = ref;
        const sub = o.get('Subtype');
        if (sub.isName() && sub.asName() === 'Image') use.set(n, Math.max(use.get(n) || 0, side));
        else if (sub.isName() && sub.asName() === 'Form' && !seen.has(n)) { seen.add(n); visit(o.get('Resources'), side, depth + 1, seen); }
      });
    };
    const count = doc.countPages();
    for (let i = 0; i < count; i++) {
      const page = doc.loadPage(i);
      const b = page.getBounds();
      const side = Math.max(b[2] - b[0], b[3] - b[1]);
      maxSide = Math.max(maxSide, side);
      visit(page.getObject().getInheritable('Resources'), side, 0, new Set());
    }
    return { use, maxSide: maxSide || 842 };
  }

  /**
   * Re-encodes images larger than `dpi` (judged against the page they are drawn on) as JPEG at
   * `quality`, optionally in grey. Keeps the old image when the new one is not smaller.
   * onProgress(done, total) is called per image. Returns { images, replaced }.
   */
  P.compressImages = async function (m, doc, { dpi = 150, quality = 70, gray = false, onProgress = null, yieldEvery = null } = {}) {
    const { use, maxSide } = imageUse(doc);
    const nums = [];
    for (let i = 1; i < doc.countObjects(); i++) {
      const o = doc.newIndirect(i);
      let ok = false;
      try { ok = o.isStream() && o.get('Subtype').isName() && o.get('Subtype').asName() === 'Image'; } catch { ok = false; }
      if (ok) nums.push(i);
    }
    let replaced = 0;
    for (const [k, n] of nums.entries()) {
      if (onProgress) onProgress(k, nums.length);
      if (yieldEvery) await yieldEvery();
      const ref = doc.newIndirect(n);
      const o = ref;
      try {
        if (o.get('ImageMask').isBoolean() && o.get('ImageMask').asBoolean()) continue;
        const mask = o.get('Mask');
        if (mask && mask.isArray()) continue;
        const bpc = o.get('BitsPerComponent');
        if (bpc.isNumber() && bpc.asNumber() === 1) continue; // line-art scans: JPEG would make them bigger and blurry
        const w0 = o.get('Width').asNumber();
        const h0 = o.get('Height').asNumber();
        if (w0 * h0 < 64 * 64) continue;
        const side = use.get(n) || maxSide;
        const maxPx = Math.max(16, Math.round((side / 72) * dpi));
        const scale = Math.min(1, maxPx / Math.max(w0, h0));
        const w = Math.max(1, Math.round(w0 * scale));
        const h = Math.max(1, Math.round(h0 * scale));
        const img = doc.loadImage(ref);
        const cs = img.getColorSpace();
        const isGray = gray || (cs && cs.isGray && cs.isGray());
        const pix = P.imagePixmap(m, img, w, h, isGray);
        const jpg = pix.asJPEG(quality, false);
        const oldLen = o.readRawStream().length;
        if (jpg.length >= oldLen * 0.92 && scale === 1 && !gray) continue;
        if (jpg.length >= oldLen) continue;
        o.writeRawStream(jpg);
        o.put('Filter', doc.newName('DCTDecode'));
        o.delete('DecodeParms');
        o.delete('Decode');
        o.put('Width', w);
        o.put('Height', h);
        o.put('BitsPerComponent', 8);
        o.put('ColorSpace', doc.newName(isGray ? 'DeviceGray' : 'DeviceRGB'));
        replaced++;
      } catch { /* leave this image as it is */ }
    }
    if (onProgress) onProgress(nums.length, nums.length);
    return { images: nums.length, replaced };
  };

  P.SAVE = 'garbage=4,compress,compress-fonts,compress-images,objstms';

  // ---------- bookmarks ----------
  /** items: [{title, page (0-based), children: [...]}] written as the document outline. */
  P.writeOutline = function (m, doc, items) {
    const it = doc.outlineIterator();
    const uri = (p) => doc.formatLinkURI({ chapter: 0, page: p, type: 'Fit', x: 0, y: 0, width: 0, height: 0, zoom: 0 });
    const add = (list) => {
      for (const item of list) {
        it.insert({ title: item.title, uri: uri(item.page), open: false });
        if (item.children && item.children.length) {
          it.prev();
          if (it.down() !== 0) { /* fresh child list */ }
          add(item.children);
          it.up();
          it.next();
        }
      }
    };
    add(items);
  };

  root.PdfOps = P;
})(typeof window !== 'undefined' ? window : globalThis);
