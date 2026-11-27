/* PDF to Word: turns PDF pages into an editable .docx. Pages with real text are read directly;
 * scanned pages are read with Tesseract (Arabic, English and more). Arabic paragraphs are written
 * right-to-left, so they open the right way round in Word. Nothing is uploaded. */
(() => {
  'use strict';
  const P = window.PdfOps;
  const { $ } = FM;
  const val = (name) => (document.querySelector(`input[name="${name}"]:checked`) || {}).value;
  const langs = () => [...document.querySelectorAll('input[name="lang"]:checked')].map((x) => x.value);

  function pagesIn(spec, count) {
    if (!spec.trim()) return [...Array(count).keys()];
    try { return P.parsePages(spec, count); } catch (e) {
      if (/outside/.test(e.message)) return P.parsePages(spec, 100000).filter((i) => i < count);
      throw e;
    }
  }

  // ---------------------------------------------------------------- text helpers
  const RTL_CHARS = /[֐-ࣿיִ-﷿ﹰ-﻿]/g;
  const LTR_CHARS = /[A-Za-zÀ-ɏ]/g;
  const isRtl = (s) => (s.match(RTL_CHARS) || []).length > (s.match(LTR_CHARS) || []).length;
  // Arabic presentation forms = text stored in visual order (shaped glyphs, right to left already laid out).
  const PRES_FORMS = /[ﭐ-﷿ﹰ-﻿]/;

  /** A line of PDF text stored as shaped Arabic glyphs in visual order → normal Arabic in reading order. */
  function fixVisualArabic(s) {
    if (!PRES_FORMS.test(s)) return s;
    const norm = s.normalize('NFKC');
    // Reverse the whole line, then turn runs of Latin letters and digits back the right way.
    const rev = [...norm].reverse().join('');
    return rev.replace(/[A-Za-z0-9À-ɏ@#%&+\-=/.,:;'"()[\]{}<>_ ]*[A-Za-z0-9À-ɏ][A-Za-z0-9À-ɏ@#%&+\-=/.,:;'"_]*/g,
      (run) => [...run].reverse().join(''));
  }

  // Bidi control marks (Tesseract wraps Latin words in Arabic lines with them) and control characters.
  const clean = (s) => s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F‎‏‪-‮⁦-⁩]/g, '').replace(/\s+/g, ' ').trim();
  const MARKS = /[ً-ٰٟۖ-ۭ]/;

  /** Sorts the letters of a right-to-left line by their position, then turns Latin and number runs back. */
  function rtlLine(chars) {
    const s = chars.slice().sort((a, b) => b.x1 - a.x1 || a.i - b.i).map((c) => c.c).join('');
    return s.replace(/[A-Za-z0-9À-ɏ][A-Za-z0-9À-ɏ@#%&+\-=/.,:_' ]*[A-Za-z0-9À-ɏ]|[A-Za-z0-9À-ɏ]/g,
      (run) => [...run].reverse().join(''));
  }

  /** Signs that an Arabic text layer is damaged (common in PDFs from browsers and design programs):
   *  lam-alef stored backwards, marks split off their letter, shaped glyphs, numbers glued to words. */
  function looksBroken(text) {
    if (PRES_FORMS.test(text)) return true;
    const bad = (text.match(/(^|\s)ا[أإآ]ل|\s[ً-ٟ]|[ء-ي][0-9]|[0-9][ء-ي]/g) || []).length;
    return bad >= 2;
  }

  // ---------------------------------------------------------------- reading a page
  /** Pages that have a real text layer: lines rebuilt letter by letter, so Arabic comes out in order. */
  function readTextLayer(page) {
    const st = page.toStructuredText('preserve-whitespace');
    const lines = [];
    let cur = null; let i = 0;
    st.walk({
      beginLine(bbox) { cur = { bbox, chars: [], size: 0, bold: true }; },
      onChar(c, origin, font, size, quad) {
        const x0 = Math.min(quad[0], quad[6]); const x1 = Math.max(quad[2], quad[4]);
        cur.chars.push({ c, x0, x1, i: i++ });
        if (c.trim()) {
          cur.size = Math.max(cur.size, size);
          const name = (font && font.getName && font.getName()) || '';
          if (!(font && font.isBold && font.isBold()) && !/bold|black|heavy/i.test(name)) cur.bold = false;
        }
      },
      endLine() { if (cur && cur.chars.length) lines.push(cur); cur = null; },
    });
    const out = [];
    for (const ln of lines) {
      const raw = ln.chars.map((c) => c.c).join('');
      const text = clean(fixVisualArabic(isRtl(raw) ? rtlLine(ln.chars) : raw)).replace(new RegExp(` (${MARKS.source})`, 'g'), '$1');
      if (!text) continue;
      const [x0, y0, x1, y1] = ln.bbox;
      out.push({ text, x0, x1, y0, y1, size: ln.size || (y1 - y0) * 0.8, bold: ln.bold });
    }
    return groupLines(out);
  }

  /** Lines (top to bottom, with boxes in points) → paragraphs. A new paragraph starts after a bigger
   *  gap, a change of text size, or a line that stops well short of the margin. */
  function groupLines(lines, sizeJump = 0.18) {
    if (!lines.length) return [];
    lines.sort((a, b) => a.y0 - b.y0 || b.x1 - a.x1);
    const hs = lines.map((l) => l.y1 - l.y0).sort((a, b) => a - b);
    const lh = hs[Math.floor(hs.length / 2)] || 10;
    const left = Math.min(...lines.map((l) => l.x0));
    const right = Math.max(...lines.map((l) => l.x1));
    const width = right - left || 1;
    const paras = [];
    let cur = null; let prev = null;
    for (const l of lines) {
      const rtl = isRtl(l.text);
      let split = !cur;
      if (!split) {
        const gap = l.y0 - prev.y1;
        const prevShort = isRtl(prev.text) ? prev.x0 - left > width * 0.18 : right - prev.x1 > width * 0.18;
        split = gap > lh * 0.75 || gap < -lh * 0.3 || prevShort || l.para !== prev.para
          || Math.abs(l.size - cur.size) > Math.max(1.2, cur.size * sizeJump) || rtl !== cur.rtl;
      }
      if (split) {
        // A short line in the middle of the text area, like a title, stays centred.
        const center = lines.length > 2 && (l.x1 - l.x0) < width * 0.7 && Math.abs((l.x0 + l.x1) / 2 - (left + right) / 2) < width * 0.05;
        cur = { lines: [], sizes: [], size: l.size, bold: l.bold, y: l.y0, rtl, center };
        paras.push(cur);
      }
      cur.lines.push(l.text);
      cur.sizes.push(l.size);
      cur.bold = cur.bold && l.bold;
      prev = l;
    }
    const mid = (a) => a.slice().sort((x, y) => x - y)[Math.floor(a.length / 2)];
    return paras.map((p) => ({ text: joinLines(p.lines), size: mid(p.sizes), bold: p.bold, y: p.y, center: p.center }));
  }

  /** Joins the lines of one paragraph; a hyphen at the end of a Latin line joins the word. */
  function joinLines(lines) {
    let out = '';
    for (const l of lines) {
      if (!out) { out = l; continue; }
      if (/[A-Za-z]-$/.test(out)) out = out.slice(0, -1) + l;
      else out += ' ' + l;
    }
    return out;
  }

  const workers = {};
  async function getWorker(lang, ui, psm) {
    const key = lang + (psm || '');
    if (workers[key]) return workers[key];
    ui.progress(0, 1, 'Loading the reading engine and language files (first time only)…');
    const Tesseract = await FM.tesseract();
    const w = await Tesseract.createWorker(lang, 1);
    if (psm) await w.setParameters({ tessedit_pageseg_mode: psm });
    workers[key] = w;
    return w;
  }

  /** Scanned pages: lines from Tesseract, grouped into paragraphs. Sizes are in points.
   *  In Arabic lines, a Latin "word" read with low confidence is almost always a misread Arabic
   *  word, so that spot is read again in Arabic only. */
  async function readScan(m, page, ctx) {
    const { dpi, lang } = ctx;
    const png = new Blob([P.render(m, page, dpi, 'gray').asPNG().slice()], { type: 'image/png' });
    const { data } = await ctx.w.recognize(png, {}, { text: true, blocks: true });
    const px2pt = 72 / dpi;
    const recheck = lang.includes('ara') && lang !== 'ara';
    let bmp = null;
    const lines = [];
    let pi = 0;
    for (const b of data.blocks || []) {
      for (const p of b.paragraphs || []) {
        pi++;
        for (const l of p.lines || []) {
          if (l.confidence != null && l.confidence < 30) continue;
          let words = (l.words || []).map((x) => ({ text: clean(x.text), conf: x.confidence, bbox: x.bbox }));
          const lineText = words.map((x) => x.text).join(' ');
          if (recheck && isRtl(lineText)) {
            for (const wd of words) {
              if (!/[A-Za-z]/.test(wd.text) || wd.conf >= 75 || /@|\d/.test(wd.text)) continue;
              if (!bmp) bmp = await createImageBitmap(png);
              const pad = Math.round((l.bbox.y1 - l.bbox.y0) * 0.25);
              const x = Math.max(0, wd.bbox.x0 - pad); const y = Math.max(0, l.bbox.y0 - pad);
              const cw = Math.min(bmp.width - x, wd.bbox.x1 - wd.bbox.x0 + 2 * pad); const ch = Math.min(bmp.height - y, l.bbox.y1 - l.bbox.y0 + 2 * pad);
              const c = new OffscreenCanvas(cw, ch);
              const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, cw, ch);
              g.drawImage(bmp, x, y, cw, ch, 0, 0, cw, ch);
              const aw = await getWorker('ara', ctx.ui, '7');
              const r = await aw.recognize(await c.convertToBlob({ type: 'image/png' }));
              const t = clean(r.data.text || '');
              wd.text = t && isRtl(t) ? t : '';
              wd.reread = true;
            }
            // Re-read words that sat next to each other were an LTR run: put them back right to left.
            for (let a = 0; a < words.length; a++) {
              if (!words[a].reread) continue;
              let z = a; while (z + 1 < words.length && words[z + 1].reread) z++;
              const run = words.slice(a, z + 1).sort((p, q) => q.bbox.x1 - p.bbox.x1);
              words.splice(a, run.length, ...run);
              a = z;
            }
            words = words.filter((x) => x.text);
          }
          const text = words.map((x) => x.text).join(' ');
          if (!text) continue;
          const bb = l.bbox;
          lines.push({ text, x0: bb.x0 * px2pt, x1: bb.x1 * px2pt, y0: bb.y0 * px2pt, y1: bb.y1 * px2pt,
            // A line box is a bit taller than the letters; ~0.75 of it is close to the font size.
            size: (bb.y1 - bb.y0) * px2pt * 0.75, bold: false, para: pi });
        }
      }
    }
    if (bmp) bmp.close();
    // OCR line boxes change height with tall letters and marks, so only a big jump means a new size.
    const paras = groupLines(lines, 0.35);
    return { paras, words: paras.reduce((s, p) => s + p.text.split(/\s+/).length, 0) };
  }

  // ---------------------------------------------------------------- writing the .docx
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  /** Body sizes become 12 pt in Word; headings keep their size relative to the body. */
  function sizeMap(allParas) {
    const weights = [];
    for (const p of allParas) weights.push([p.size, p.text.length]);
    weights.sort((a, b) => a[0] - b[0]);
    const total = weights.reduce((s, x) => s + x[1], 0);
    let acc = 0; let body = 11;
    for (const [s, n] of weights) { acc += n; if (acc >= total / 2) { body = s; break; } }
    return (s) => {
      const r = s / (body || 11);
      if (r < 1.2) return { pt: r < 0.8 ? 10 : 12, heading: false };
      return { pt: Math.min(28, Math.round(12 * r)), heading: true };
    };
  }

  function paraXml(p, size, font) {
    const rtl = isRtl(p.text);
    const half = Math.round(size.pt * 2);
    // Arabic letters look smaller than Latin ones at the same size, so Arabic gets 2 pt more.
    const halfCs = half + 4;
    const bold = p.bold || size.heading;
    const rPr = `<w:rPr><w:rFonts w:ascii="${font}" w:hAnsi="${font}" w:cs="${font}"/>${bold ? '<w:b/><w:bCs/>' : ''}${rtl ? '<w:rtl/>' : ''}<w:sz w:val="${half}"/><w:szCs w:val="${halfCs}"/></w:rPr>`;
    const pPr = `<w:pPr>${rtl ? '<w:bidi/>' : ''}<w:spacing w:after="${size.heading ? 160 : 120}" w:line="276" w:lineRule="auto"/>${size.heading ? '<w:keepNext/>' : ''}${p.center ? '<w:jc w:val="center"/>' : ''}</w:pPr>`;
    return `<w:p>${pPr}<w:r>${rPr}<w:t xml:space="preserve">${esc(p.text)}</w:t></w:r></w:p>`;
  }

  async function buildDocx(pages, { breaks, font, title }) {
    const all = pages.flat();
    const sz = sizeMap(all.length ? all : [{ size: 11, text: 'x' }]);
    const rtlDoc = all.filter((p) => isRtl(p.text)).reduce((s, p) => s + p.text.length, 0) > all.reduce((s, p) => s + p.text.length, 0) / 2;
    let body = '';
    pages.forEach((paras, i) => {
      if (i && breaks) body += '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
      for (const p of paras) body += paraXml(p, sz(p.size), font);
      if (!paras.length) body += '<w:p/>';
    });
    const sect = `<w:sectPr>${rtlDoc ? '<w:bidi/>' : ''}<w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="567" w:footer="567" w:gutter="0"/></w:sectPr>`;
    const doc = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}${sect}</w:body></w:document>`;
    const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="${font}" w:hAnsi="${font}" w:cs="${font}" w:eastAsia="${font}"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:lang w:val="en-US" w:bidi="ar-SA"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="120" w:line="276" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style></w:styles>`;
    const JSZip = await FM.jszip();
    const zip = new JSZip();
    zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>`);
    zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>`);
    zip.file('word/_rels/document.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`);
    zip.file('word/document.xml', doc);
    zip.file('word/styles.xml', styles);
    zip.file('docProps/core.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${esc(title)}</dc:title><dc:creator>File Manager Toolkit</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">${new Date().toISOString().slice(0, 19)}Z</dcterms:created></cp:coreProperties>`);
    return zip.generateAsync({ type: 'blob', compression: 'DEFLATE', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  }

  // ---------------------------------------------------------------- run
  async function run(items, ui) {
    const mode = val('read');
    const lang = langs().join('+');
    if (mode !== 'text' && !lang) throw new Error('Tick at least one language.');
    const m = await FM.mupdf();
    const dpi = Number(val('dpi'));
    const breaks = $('pageBreaks').checked;
    const font = $('font').value;
    const ctx = { dpi, lang, ui, w: null };
    const out = [];
    for (const [k, it] of items.entries()) {
      const doc = await FM.openPdf(it.file);
      const n = doc.countPages();
      const list = pagesIn($('optPages').value, n);
      const pages = [];
      let scanned = 0; let typed = 0; let words = 0; let empty = 0; let fixed = 0;
      for (const [j, i] of list.entries()) {
        ui.progress(k + j / list.length, items.length, `${it.file.name} · page ${i + 1} of ${n}`);
        await ui.yield();
        const page = doc.loadPage(i);
        const layer = page.toStructuredText('').asText();
        const hasText = layer.replace(/\s/g, '').length > 30;
        let paras = null;
        if (mode === 'text' || (mode === 'auto' && hasText)) {
          paras = readTextLayer(page);
          // Arabic text layers are often damaged; reading the page itself gives cleaner text.
          if (mode === 'auto' && isRtl(layer) && looksBroken(paras.map((p) => p.text).join(' '))) { paras = null; fixed++; }
          else { typed++; words += paras.reduce((s, p) => s + p.text.split(/\s+/).length, 0); }
        }
        if (!paras) {
          if (!ctx.w) ctx.w = await getWorker(lang, ui);
          ui.progress(k + j / list.length, items.length, `${it.file.name} · reading page ${i + 1} of ${n}`);
          const r = await readScan(m, page, ctx);
          paras = r.paras; words += r.words; scanned++;
        }
        paras.sort((a, b) => a.y - b.y);
        if (!paras.length) empty++;
        pages.push(paras);
      }
      const base = FMKit.baseOf(it.file.name);
      const blob = await buildDocx(pages, { breaks, font, title: base });
      const bits = [];
      if (typed) bits.push(`${typed} page(s) with text`);
      if (scanned - fixed) bits.push(`${scanned - fixed} scanned page(s) read`);
      if (fixed) bits.push(`${fixed} Arabic page(s) re-read for clean text`);
      if (empty) bits.push(`${empty} with nothing to read`);
      out.push({ name: FMKit.safeName(base + '.docx'), blob, folder: it.folder, note: bits.join(', '), noteKind: words ? 'good' : 'warn', words });
    }
    ui.progress(1, 1);
    return out;
  }

  FMKit.init({
    key: 'pdf2word', accept: 'pdf', runLabel: 'Convert to Word', makes: null, busyTitle: 'Reading the pages…',
    run,
    zipName: () => 'word',
    doneText: (outs) => {
      const words = outs.reduce((s, x) => s + (x.words || 0), 0);
      return words ? `About ${words.toLocaleString('en')} words. Open the file in Word, Google Docs or LibreOffice and edit it.` : 'No text was found. Try "Read every page" with the right language ticked.';
    },
    estimate: async (items) => {
      const pages = items.reduce((s, it) => s + (it.pages || 0), 0);
      if (!pages) return '';
      if (val('read') === 'text') return `${pages} page(s) · a few seconds`;
      const sec = Math.max(1, Math.round(pages * (val('dpi') === '300' ? 4 : 2.5)));
      return `${pages} page(s) · up to ${sec < 90 ? `${sec} seconds` : `${Math.round(sec / 60)} minutes`} if they are scanned`;
    },
    onOptions: () => {
      const scan = val('read') !== 'text';
      for (const id of ['langOpt', 'dpiOpt']) { const el = $(id); if (el) el.hidden = !scan; }
    },
  });

  // Exposed for the browser tests.
  window.__pdf2word = { fixVisualArabic, isRtl, buildDocx, readTextLayer, looksBroken };
})();
