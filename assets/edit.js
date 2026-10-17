/* Edit PDF Text: find & replace text inside one area across many PDFs (MuPDF).
 * Port of the desktop app's "Batch Text Edit": characters are matched one by one
 * (ignoring spaces) so CAD/Revit exports with odd glyph spacing still match. */
(() => {
  'use strict';
  const { $, esc, toast } = FM;

  const BASE14 = {
    Helvetica: ['Helvetica', 'Helvetica-Bold', 'Helvetica-Oblique', 'Helvetica-BoldOblique'],
    Times: ['Times-Roman', 'Times-Bold', 'Times-Italic', 'Times-BoldItalic'],
    Courier: ['Courier', 'Courier-Bold', 'Courier-Oblique', 'Courier-BoldOblique'],
  };
  const ANGLE_DIR = { 0: [1, 0], 90: [0, -1], 180: [-1, 0], 270: [0, 1] };

  const state = { files: [], viewingId: null, fontFile: null, busy: false };
  let nextId = 1;
  const view = new PdfView($('viewer'), { maxRects: 1, onRectsChange: renderArea });

  // ---------- files ----------
  function addEntries(entries) {
    const added = entries.map((e) => ({ id: nextId++, status: '', statusClass: '', ...e }));
    state.files.push(...added);
    renderFiles();
    if (state.viewingId === null && added.length) showFile(added[0].id);
  }

  function renderFiles() {
    $('fileList').innerHTML = state.files.map((f) => `<li data-id="${f.id}" class="${f.id === state.viewingId ? 'viewing' : ''}">
      <span class="fname">${esc(f.file.name)}</span><span class="st ${f.statusClass}">${esc(f.status)}</span>
      <button class="icon-btn danger" data-act="remove" title="Remove">✕</button></li>`).join('');
    $('filesHint').textContent = state.files.length ? `${state.files.length} file(s). Click one to show it.` : 'Click a file to show it on the right.';
    $('saveOverwrite').disabled = !state.files.length || state.files.some((f) => !f.handle);
    if ($('saveOverwrite').disabled && $('saveOverwrite').checked) document.querySelector('input[name="save"][value="download"]').checked = true;
  }

  const pageIndex = () => Math.max(0, (parseInt($('pageNo').value, 10) || 1) - 1);

  async function showFile(id) {
    const f = state.files.find((x) => x.id === id);
    if (!f) return;
    state.viewingId = id;
    renderFiles();
    try {
      const doc = await FM.openPdf(await currentFile(f));
      view.setPage(doc.loadPage(Math.min(pageIndex(), doc.countPages() - 1)));
      view._doc = doc;
    } catch (e) { toast(`${f.file.name}: ${e.message}`, 'error'); }
  }

  /** Re-reads files that have a handle, so a file edited in place is shown fresh. */
  async function currentFile(f) {
    return f.handle ? f.handle.getFile() : f.file;
  }

  $('fileList').addEventListener('click', (e) => {
    const li = e.target.closest('li');
    if (!li) return;
    const id = Number(li.dataset.id);
    if (e.target.dataset.act === 'remove') {
      state.files = state.files.filter((f) => f.id !== id);
      if (state.viewingId === id) { state.viewingId = null; if (state.files.length) showFile(state.files[0].id); else view.clear(); }
      renderFiles();
      return;
    }
    showFile(id);
  });
  $('pageNo').addEventListener('change', () => state.viewingId !== null && showFile(state.viewingId));

  function renderArea() {
    $('areaLabel').textContent = view.rects.length ? 'Area set. Draw again to change it.' : 'No area yet.';
  }
  $('drawBtn').onclick = () => view.startDraw();

  // ---------- matching ----------
  /** Matches inside the area, line by line in reading order (spaces ignored). */
  function findMatches(chars, find, matchCase, area) {
    const norm = (t) => (matchCase ? t : t.toLowerCase());
    const target = norm(find).replace(/\s+/g, '');
    if (!target) return [];
    const out = [];
    for (const line of PdfView.linesInRect(chars, area)) {
      const compact = line.filter((c) => !/\s/.test(c.c));
      const str = compact.map((c) => norm(c.c)).join('');
      let from = 0;
      for (;;) {
        const idx = str.indexOf(target, from);
        if (idx === -1) break;
        const span = compact.slice(idx, idx + target.length);
        const rect = [
          Math.min(...span.map((c) => c.x0)), Math.min(...span.map((c) => c.y0)),
          Math.max(...span.map((c) => c.x1)), Math.max(...span.map((c) => c.y1)),
        ];
        out.push({ rect, first: span[0], last: span[span.length - 1], text: span.map((c) => c.c).join('') });
        from = idx + target.length;
      }
    }
    return out;
  }

  function log(msg, cls = '') {
    const el = $('log');
    el.hidden = false;
    el.insertAdjacentHTML('beforeend', `<span class="${cls}">${esc(msg)}</span>\n`);
    el.scrollTop = el.scrollHeight;
  }

  function checkInputs() {
    if (!state.files.length) { toast('Add PDF files first.'); return false; }
    if (!view.rects.length) { toast('Draw the area first.'); return false; }
    if (!$('findText').value) { toast('Type the text to find.'); return false; }
    return true;
  }

  async function forEachPage(fn) {
    $('log').innerHTML = '';
    $('progress').hidden = false;
    $('progress').max = state.files.length;
    for (const [i, f] of state.files.entries()) {
      try {
        const doc = await FM.openPdf(await currentFile(f));
        if (pageIndex() >= doc.countPages()) throw new Error(`has only ${doc.countPages()} page(s)`);
        const page = doc.loadPage(pageIndex());
        const area = PdfView.toPageRect(page, view.rects[0]);
        await fn(f, doc, page, area, i);
      } catch (e) {
        f.status = 'error';
        f.statusClass = 'bad';
        log(`(${i + 1}/${state.files.length}) ${f.file.name}: ERROR - ${e.message}`, 'bad');
      }
      $('progress').value = i + 1;
      renderFiles();
      await new Promise((r) => setTimeout(r));
    }
  }

  function noMatchMessage(chars, area) {
    const raw = PdfView.textInRect(chars, area).trim();
    return raw ? `0 match(es). Text found in box: "${raw}"`
      : '0 match(es). NO TEXT LAYER in this box (likely an outline/image field, not editable text)';
  }

  $('previewBtn').onclick = async () => {
    if (!checkInputs() || state.busy) return;
    state.busy = true;
    let total = 0;
    await forEachPage((f, doc, page, area, i) => {
      const chars = PdfView.pageChars(page);
      const n = findMatches(chars, $('findText').value, $('matchCase').checked, area).length;
      total += n;
      f.status = n ? `${n} match` : '0';
      f.statusClass = n ? 'ok' : 'bad';
      log(`(${i + 1}/${state.files.length}) ${f.file.name}: ${n ? n + ' match(es)' : noMatchMessage(chars, area)}`, n ? '' : 'bad');
    });
    log(`Preview complete — ${total} total match(es) across ${state.files.length} file(s).`, 'good');
    state.busy = false;
  };

  // ---------- replacing ----------
  function pdfNum(n) { return (Math.round(n * 10000) / 10000).toString(); }

  /** Chooses the font for one match. Returns {key, ref, font, simple}. */
  function resolveFont(m, doc, cache, first) {
    const mode = $('font').value;
    if (mode === 'file') {
      if (!cache.custom) {
        const font = new m.Font('Custom', state.fontFile.bytes);
        cache.custom = { font, ref: doc.addFont(font), simple: false };
      }
      return cache.custom;
    }
    let family = mode;
    if (mode === 'auto') {
      const name = (first.font || '').toLowerCase();
      family = /courier|mono|consol/.test(name) || first.mono ? 'Courier'
        : /times|georgia|serif|garamond/.test(name.replace('sans', '')) || (first.serif && !/sans|arial|helv|calibri/.test(name)) ? 'Times'
          : 'Helvetica';
    }
    const bold = $('forceBold').checked || (mode === 'auto' && first.bold);
    const italic = $('forceItalic').checked || (mode === 'auto' && first.italic);
    const fontName = BASE14[family][(bold ? 1 : 0) + (italic ? 2 : 0)];
    if (!cache[fontName]) {
      const font = new m.Font(fontName);
      cache[fontName] = { font, ref: doc.addSimpleFont(font, 'Latin'), simple: true };
    }
    return cache[fontName];
  }

  function encodeText(fontInfo, text) {
    if (fontInfo.simple) {
      if (/[^\x20-\x7e -ÿ]/.test(text)) {
        throw new Error('The replacement has letters the standard fonts can\'t show. Choose a font file (.ttf) instead.');
      }
      return '(' + text.replace(/[\\()]/g, '\\$&') + ')';
    }
    return '<' + [...text].map((ch) => fontInfo.font.encodeCharacter(ch.codePointAt(0)).toString(16).padStart(4, '0')).join('') + '>';
  }

  function textWidth(fontInfo, text) {
    let w = 0;
    for (const ch of text) w += fontInfo.font.advanceGlyph(fontInfo.font.encodeCharacter(ch.codePointAt(0)));
    return w;
  }

  function colorOps(color) {
    if (Array.isArray(color)) {
      if (color.length === 3) return `${color.map(pdfNum).join(' ')} rg`;
      if (color.length === 1) return `${pdfNum(color[0])} g`;
      if (color.length === 4) return `${color.map(pdfNum).join(' ')} k`;
    }
    return '0 g';
  }

  function replaceOnPage(m, doc, page, matches, replace) {
    // Work out fonts, sizes and positions before the old text is removed.
    const cache = {};
    const manual = parseFloat($('size').value);
    const angle = $('angle').value;
    const plans = matches.map((mt) => {
      const fontInfo = resolveFont(m, doc, cache, mt.first);
      let u = angle === 'auto' ? mt.first.dir : ANGLE_DIR[angle];
      const len = Math.hypot(u[0], u[1]) || 1;
      u = [u[0] / len, u[1] / len];
      const v = [-u[1], u[0]]; // "down" for the text, in page coordinates
      // Where the old text started and ended along its line, and its baseline.
      const start = (mt.first.along ?? mt.first.cx * u[0] + mt.first.cy * u[1]) - (mt.first.width ?? 0) / 2;
      const end = (mt.last.along ?? mt.last.cx * u[0] + mt.last.cy * u[1]) + (mt.last.width ?? 0) / 2;
      const baseline = mt.first.origin[0] * v[0] + mt.first.origin[1] * v[1];
      const size = Number.isFinite(manual) && manual > 0 ? manual : mt.first.size;
      // How much narrower (or wider) the original font is than the font we draw with,
      // so e.g. Arial Narrow is matched by squeezing Helvetica horizontally.
      const natural = textWidth(fontInfo, mt.text) * mt.first.size;
      let hscale = natural > 0 ? (end - start) / natural : 1;
      if (!(hscale > 0.5 && hscale < 1.3) || Math.abs(hscale - 1) < 0.04) hscale = 1;
      return { mt, fontInfo, size, u, v, start, end, baseline, hscale };
    });

    for (const { mt } of plans) {
      const annot = page.createAnnotation('Redact');
      annot.setRect(mt.rect);
    }
    page.applyRedactions(false, m.PDFPage.REDACT_IMAGE_NONE, m.PDFPage.REDACT_LINE_ART_NONE, m.PDFPage.REDACT_TEXT_REMOVE);

    if (!replace) return; // replacing with nothing just removes the text

    const pageObj = page.getObject();
    let res = pageObj.get('Resources');
    if (res.isNull()) {
      res = pageObj.getInheritable('Resources');
      if (res.isNull()) res = doc.newDictionary();
      pageObj.put('Resources', res);
    }
    let fonts = res.get('Font');
    if (fonts.isNull()) { fonts = doc.newDictionary(); res.put('Font', fonts); }

    const inv = m.Matrix.invert(page.getTransform());
    let ops = '';
    let n = 0;
    const keys = new Map();
    for (const p of plans) {
      if (!keys.has(p.fontInfo)) {
        let key;
        do { key = `FMEd${++n}`; } while (!fonts.get(key).isNull());
        fonts.put(key, p.fontInfo.ref);
        keys.set(p.fontInfo, key);
      }
      const room = p.end - p.start;
      const em = textWidth(p.fontInfo, replace);
      let { size, hscale } = p;
      // Longer text: first squeeze it a little more (keeps the letter height), then shrink.
      if (em * size * hscale > room * 1.02) {
        const squeezed = room / (em * size);
        if (squeezed >= p.hscale * 0.7) hscale = squeezed;
        else {
          hscale = p.hscale * 0.7;
          while (em * size * hscale > room * 1.02 && size > 4) size -= 0.25;
        }
      }
      const width = em * size * hscale;
      const along = (p.start + p.end) / 2 - width / 2; // centred where the old text was
      const ox = p.u[0] * along + p.v[0] * p.baseline;
      const oy = p.u[1] * along + p.v[1] * p.baseline;
      const tm = m.Matrix.concat([p.u[0], p.u[1], -p.v[0], -p.v[1], ox, oy], inv);
      ops += `BT /${keys.get(p.fontInfo)} ${pdfNum(size)} Tf ${pdfNum(hscale * 100)} Tz ${tm.map(pdfNum).join(' ')} Tm ` +
        `${colorOps(p.mt.first.color)} ${encodeText(p.fontInfo, replace)} Tj ET\n`;
    }

    // Wrap the existing content in q/Q so its graphics state can't affect the new text.
    const contents = pageObj.get('Contents');
    const arr = doc.newArray();
    arr.push(doc.addStream('q\n', {}));
    if (contents.isArray()) contents.forEach((c) => arr.push(c));
    else if (!contents.isNull()) arr.push(contents);
    arr.push(doc.addStream('\nQ\n' + ops, {}));
    pageObj.put('Contents', arr);
  }

  $('applyBtn').onclick = async () => {
    if (!checkInputs() || state.busy) return;
    const find = $('findText').value;
    const replace = $('replaceText').value;
    const mode = document.querySelector('input[name="save"]:checked').value;
    if ($('font').value === 'file' && !state.fontFile) { toast('Choose the font file first.'); return; }
    const sizeRaw = $('size').value.trim();
    if (sizeRaw && sizeRaw.toLowerCase() !== 'auto' && !(parseFloat(sizeRaw) > 0)) { toast('Size must be a number or “Auto”.', 'error'); return; }

    // Pick the output folder now, while the click still allows opening a picker.
    let outFolder = null;
    if (mode === 'folder') {
      if (!FM.canDirectAccess) { toast('Saving into a folder needs Chrome or Edge.'); return; }
      try { outFolder = await window.showDirectoryPicker({ id: 'edit-out', mode: 'readwrite' }); } catch (e) {
        if (e.name !== 'AbortError') toast(e.message, 'error');
        return;
      }
    }
    const ok = await FM.dialog(mode === 'overwrite'
      ? { title: 'Overwrite original files?', html: `<p>This will permanently overwrite <b>${state.files.length}</b> original PDF file(s). This cannot be undone.</p>`, okText: 'Overwrite', okClass: 'danger-solid' }
      : { title: 'Replace text?', html: `<p>Replace “${esc(find)}” with “${esc(replace)}” inside the area in <b>${state.files.length}</b> file(s)?</p>`, okText: 'Replace', okClass: 'success' });
    if (!ok) return;

    state.busy = true;
    $('applyBtn').disabled = true;
    const m = await FM.mupdf();
    const outputs = [];
    const suffix = $('suffix').value.trim() || '_edited';
    await forEachPage(async (f, doc, page, area, i) => {
      const chars = PdfView.pageChars(page);
      const matches = findMatches(chars, find, $('matchCase').checked, area);
      if (!matches.length) {
        f.status = '0';
        f.statusClass = 'bad';
        log(`(${i + 1}/${state.files.length}) ${f.file.name}: no matches. ${noMatchMessage(chars, area).replace(/^0 match\(es\)\. /, '')}`, 'bad');
        return;
      }
      replaceOnPage(m, doc, page, matches, replace);
      const bytes = doc.saveToBuffer('garbage=4,compress').asUint8Array();
      const { base } = FM.splitName(f.file.name);
      if (mode === 'download') outputs.push([`${base}${suffix}.pdf`, bytes]);
      else if (mode === 'folder') await writeFile(await outFolder.getFileHandle(f.file.name, { create: true }), bytes);
      else {
        if (!(await FM.ensurePermission(f.root || f.handle))) throw new Error('Permission to edit the file was not given');
        await writeFile(f.handle, bytes);
      }
      f.status = `✓ ${matches.length}`;
      f.statusClass = 'ok';
      log(`(${i + 1}/${state.files.length}) ${f.file.name}: replaced ${matches.length} occurrence(s)`);
    });

    if (outputs.length === 1) {
      FM.downloadBlob(new Blob([outputs[0][1]], { type: 'application/pdf' }), outputs[0][0]);
    } else if (outputs.length > 1) {
      const JSZip = await FM.jszip();
      const zip = new JSZip();
      outputs.forEach(([name, bytes]) => zip.file(name, bytes));
      FM.downloadBlob(await zip.generateAsync({ type: 'blob' }), 'edited_pdfs.zip');
    }
    log('Batch text edit complete.', 'good');
    state.busy = false;
    $('applyBtn').disabled = false;
    if (mode === 'overwrite' && state.viewingId !== null) showFile(state.viewingId);
  };

  async function writeFile(handle, bytes) {
    const w = await handle.createWritable();
    await w.write(bytes);
    await w.close();
  }

  // ---------- font file ----------
  $('font').addEventListener('change', async (e) => {
    if (e.target.value !== 'file') { $('fontFileLabel').hidden = true; return; }
    const file = await new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.ttf,.otf,.ttc';
      input.addEventListener('change', () => resolve(input.files[0]));
      input.addEventListener('cancel', () => resolve(null));
      input.click();
    });
    if (!file) { if (!state.fontFile) e.target.value = 'auto'; return; }
    state.fontFile = { name: file.name, bytes: new Uint8Array(await file.arrayBuffer()) };
    $('fontFileLabel').hidden = false;
    $('fontFileLabel').textContent = `Font: ${file.name}`;
  });

  // ---------- adding files ----------
  $('addFilesBtn').onclick = async () => {
    if (window.showOpenFilePicker) {
      try {
        const handles = await window.showOpenFilePicker({ id: 'edit-pdfs', multiple: true, types: [{ description: 'PDF', accept: { 'application/pdf': ['.pdf'] } }] });
        addEntries(await Promise.all(handles.map(async (handle) => ({ handle, file: await handle.getFile() }))));
      } catch (e) { if (e.name !== 'AbortError') toast(e.message, 'error'); }
      return;
    }
    const files = await FM.choosePdfFiles();
    if (files.length) addEntries(files.map((file) => ({ file })));
  };
  $('addFolderBtn').onclick = async () => {
    try {
      const source = await FM.pickFolder({ write: true, id: 'edit-folder' });
      if (!source) return;
      const listing = source.mode === 'fs' ? await FM.scanDirectory(source.handle) : FM.scanFileList(source.fileList);
      const pdfs = listing.files.filter((f) => /\.pdf$/i.test(f.name));
      if (!pdfs.length) { toast('No PDF files in that folder.'); return; }
      addEntries(await Promise.all(pdfs.map(async (f) => ({ file: await FM.fileOf(f), handle: f.handle, root: source.handle }))));
    } catch (e) { toast(e.message, 'error'); }
  };
  $('clearBtn').onclick = () => { state.files = []; state.viewingId = null; view.clear(); renderFiles(); };
  FM.wireDropzone(document.querySelector('main'), (files) => addEntries(files.map((file) => ({ file }))));
  if (!FM.canDirectAccess) $('saveFolder').disabled = true;
  renderFiles();

  window.__fmEdit = { addEntries, view, state };
})();
