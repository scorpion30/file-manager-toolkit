/* Comment Sheet: read review comments (PDF annotations) and build an Excel comment
 * response sheet with sheet number, comment, author, date and a snapshot of the spot. */
(() => {
  'use strict';
  const { $, esc, toast } = FM;
  // Annotation types that are never review comments on their own.
  const SKIP_TYPES = new Set(['Popup', 'Link', 'Widget', 'Redact', 'PrinterMark', 'TrapNet', 'Watermark', 'Screen', 'Movie', 'Sound', 'RichMedia', '3D', 'Projection']);
  const SNAP_MAX_PX = 640;

  const state = {
    files: [],        // {id, file, pages, comments: [], error}
    viewingId: null,
    rows: [],         // one per comment shown in the sheet
    busy: false,
  };
  let nextId = 1;
  const sheetCache = new Map(); // "fileId:page" -> {values}
  const view = new PdfView($('viewer'), { onRectsChange: renderRects, dragDraws: true, maxRects: 2, newLabel: (i) => ['Sheet No', 'Title'][i] });

  // ---------- reading comments ----------
  const safe = (fn, fallback = '') => { try { const v = fn(); return v == null ? fallback : v; } catch { return fallback; } };
  const validDate = (d) => d instanceof Date && !Number.isNaN(d.getTime()) && d.getFullYear() > 1980;
  const stripHtml = (h) => { const div = document.createElement('div'); div.innerHTML = h; return div.textContent || ''; };

  async function scanFile(f) {
    try {
      const doc = await FM.openPdf(f.file);
      f.pages = doc.countPages();
      const all = [];
      for (let p = 0; p < f.pages; p++) {
        const page = doc.loadPage(p);
        for (const a of page.getAnnotations()) {
          const type = safe(() => a.getType());
          if (SKIP_TYPES.has(type)) continue;
          const obj = a.getObject();
          const irt = safe(() => obj.get('IRT'), null);
          let text = safe(() => a.getContents());
          if (!text && safe(() => a.hasRichContents(), false)) text = stripHtml(safe(() => a.getRichContents()));
          const mod = safe(() => a.getModificationDate(), null);
          const created = safe(() => a.getCreationDate(), null);
          const box = safe(() => a.getBounds(), null);
          if (!box) continue;
          // Callouts point somewhere else than their text box: include that spot in the snapshot.
          const pts = [];
          if (safe(() => a.hasCallout(), false)) {
            (safe(() => a.getCalloutLine(), null) || []).forEach((pt) => pts.push(pt));
          }
          if (safe(() => a.hasLine(), false)) (safe(() => a.getLine(), null) || []).forEach((pt) => pts.push(pt));
          all.push({
            ref: safe(() => obj.asIndirect(), 0),
            irt: irt && !irt.isNull() ? safe(() => irt.asIndirect(), 0) : 0,
            page: p,
            type,
            subject: safe(() => (a.hasSubject() ? a.getSubject() : '')),
            author: safe(() => (a.hasAuthor() ? a.getAuthor() : '')),
            text: String(text || '').replace(/\r\n?/g, '\n').trim(),
            date: validDate(mod) ? mod : validDate(created) ? created : null,
            box,
            pts,
          });
        }
      }
      // Replies (IRT) are attached to the comment they answer.
      const byRef = new Map(all.filter((c) => c.ref).map((c) => [c.ref, c]));
      f.comments = [];
      for (const c of all) {
        const parent = c.irt && byRef.get(c.irt);
        if (parent) (parent.replies = parent.replies || []).push(c);
        else f.comments.push(c);
      }
    } catch (e) {
      f.error = e.message;
      f.comments = [];
    }
  }

  async function addFiles(files) {
    const added = files.map((file) => ({ id: nextId++, file, pages: 0, comments: [], error: '', scanning: true }));
    state.files.push(...added);
    renderFiles();
    for (const f of added) {
      await scanFile(f);
      f.scanning = false;
      renderFiles();
    }
    if (state.viewingId === null) {
      const first = state.files.find((f) => f.comments.length) || state.files[0];
      if (first) showFile(first.id);
    }
  }

  const countComments = (f) => f.comments.filter((c) => c.text || $('optNoText').checked).length;

  function renderFiles() {
    const total = state.files.reduce((s, f) => s + countComments(f), 0);
    $('filesCard').hidden = state.files.length === 0;
    $('fileCount').textContent = state.files.length;
    $('commentCount').textContent = total;
    $('noComments').hidden = !(state.files.length && !state.files.some((f) => f.scanning) && total === 0);
    $('fileList').innerHTML = state.files.map((f) => `<li data-id="${f.id}">
      <span class="fname">${esc(f.file.name)}</span>
      <span class="st ${f.error ? 'bad' : 'ok'}">${f.scanning ? '…' : f.error ? esc(f.error) : `${countComments(f)} 💬`}</span>
      <button class="icon-btn danger" data-act="remove" title="Remove">✕</button></li>`).join('');
    $('previewFile').innerHTML = state.files.map((f) =>
      `<option value="${f.id}" ${f.id === state.viewingId ? 'selected' : ''}>${esc(f.file.name)}</option>`).join('');
  }

  async function showFile(id) {
    const f = state.files.find((x) => x.id === id);
    if (!f) return;
    state.viewingId = id;
    renderFiles();
    try {
      const doc = await FM.openPdf(f.file);
      const firstPage = f.comments.length ? f.comments[0].page : 0;
      view.setPage(doc.loadPage(firstPage));
      view._doc = doc;
    } catch (e) { toast(`${f.file.name}: ${e.message}`, 'error'); }
  }

  $('fileList').addEventListener('click', (e) => {
    if (e.target.dataset.act !== 'remove') return;
    const id = Number(e.target.closest('li').dataset.id);
    state.files = state.files.filter((f) => f.id !== id);
    if (state.viewingId === id) { state.viewingId = null; if (state.files.length) showFile(state.files[0].id); else view.clear(); }
    renderFiles();
  });
  $('previewFile').addEventListener('change', (e) => showFile(Number(e.target.value)));

  // ---------- areas ----------
  function renderRects() {
    $('noAreas').hidden = view.rects.length > 0;
    $('clearRectsBtn').hidden = view.rects.length === 0;
    $('rectList').innerHTML = view.rects.map((r, i) => `<li data-i="${i}">
      <span class="num">${i + 1}</span>
      <input type="text" value="${esc(r.label)}" aria-label="Name for area ${i + 1}">
      <button class="icon-btn danger" data-act="remove" title="Remove">✕</button></li>`).join('');
  }
  $('rectList').addEventListener('input', (e) => { view.rects[Number(e.target.closest('li').dataset.i)].label = e.target.value; });
  $('rectList').addEventListener('click', (e) => {
    if (e.target.dataset.act !== 'remove') return;
    view.rects.splice(Number(e.target.closest('li').dataset.i), 1);
    view.drawRects();
    renderRects();
  });
  $('clearRectsBtn').onclick = () => { view.setRects([]); renderRects(); };

  // ---------- building the sheet ----------
  /** A picture of the commented spot (the markup and what it points at), with some margin. */
  function snapshot(m, page, c) {
    const xs = [c.box[0], c.box[2], ...c.pts.map((p) => p[0])];
    const ys = [c.box[1], c.box[3], ...c.pts.map((p) => p[1])];
    let x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const pad = Math.max(36, Math.max(x1 - x0, y1 - y0) * 0.3);
    x0 -= pad; x1 += pad; y0 -= pad; y1 += pad;
    const grow = (a, b, min) => { const d = min - (b - a); return d > 0 ? [a - d / 2, b + d / 2] : [a, b]; };
    [x0, x1] = grow(x0, x1, 240);
    [y0, y1] = grow(y0, y1, 160);
    const [px0, py0, px1, py1] = page.getBounds();
    x0 = Math.max(px0, x0); y0 = Math.max(py0, y0); x1 = Math.min(px1, x1); y1 = Math.min(py1, y1);
    const scale = Math.min(3, SNAP_MAX_PX / Math.max(x1 - x0, y1 - y0));
    const bbox = [Math.floor(x0 * scale), Math.floor(y0 * scale), Math.ceil(x1 * scale), Math.ceil(y1 * scale)];
    const pix = new m.Pixmap(m.ColorSpace.DeviceRGB, bbox, false);
    pix.clear(255);
    const dev = new m.DrawDevice(m.Matrix.identity, pix);
    page.run(dev, m.Matrix.scale(scale, scale)); // includes the markups themselves
    dev.close();

    // Copy to a canvas and mark the comment: a frame around the markup and a
    // circle on the spot a callout arrow points at.
    const w = pix.getWidth(), h = pix.getHeight(), src = pix.getPixels(), stride = pix.getStride();
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    const img = ctx.createImageData(w, h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const s = y * stride + x * 3, d = (y * w + x) * 4;
        img.data[d] = src[s]; img.data[d + 1] = src[s + 1]; img.data[d + 2] = src[s + 2]; img.data[d + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    pix.destroy?.();
    const tx = (x) => x * scale - bbox[0], ty = (y) => y * scale - bbox[1];
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(245, 130, 32, 0.95)';
    ctx.setLineDash([8, 5]);
    ctx.strokeRect(tx(c.box[0]) - 4, ty(c.box[1]) - 4, (c.box[2] - c.box[0]) * scale + 8, (c.box[3] - c.box[1]) * scale + 8);
    if (c.pts.length) {
      ctx.setLineDash([]);
      ctx.strokeStyle = 'rgba(220, 38, 38, 0.95)';
      ctx.beginPath();
      ctx.arc(tx(c.pts[0][0]), ty(c.pts[0][1]), 14, 0, Math.PI * 2);
      ctx.stroke();
    }
    return new Promise((resolve) => canvas.toBlob(async (blob) => {
      resolve({ png: new Uint8Array(await blob.arrayBuffer()), w, h, url: URL.createObjectURL(blob) });
    }, 'image/png'));
  }

  async function sheetInfo(f, page) {
    if (!view.rects.length) {
      const base = FM.splitName(f.file.name).base;
      return { sheet: f.pages > 1 ? `${base} (p${page + 1})` : base, title: '' };
    }
    const key = `${f.id}:${page}:${JSON.stringify(view.rects.map((r) => [r.x1, r.y1, r.x2, r.y2]))}`;
    if (!sheetCache.has(key)) {
      try {
        const r = await PdfRead.readAreas(f.file, view.rects, { pageIndex: page, lang: 'eng', dpi: 400, mode: 'any', upper: false, dedupe: true });
        sheetCache.set(key, r.values);
      } catch { sheetCache.set(key, []); }
    }
    const v = sheetCache.get(key);
    return { sheet: v[0] || FM.splitName(f.file.name).base, title: v[1] || '' };
  }

  const describe = (c) => c.text || `[${c.subject || c.type}]`;

  async function build() {
    if (state.busy) return;
    state.busy = true;
    const m = await FM.mupdf();
    const list = state.files.flatMap((f) => f.comments.filter((c) => c.text || $('optNoText').checked).map((c) => ({ f, c })));
    $('progress').hidden = false;
    $('progress').max = Math.max(1, list.length);
    state.rows.forEach((r) => r.snap && URL.revokeObjectURL(r.snap.url));
    state.rows = [];
    let doc = null, docFile = null;
    for (const [i, { f, c }] of list.entries()) {
      if (docFile !== f) { doc = await FM.openPdf(f.file); docFile = f; }
      const info = await sheetInfo(f, c.page);
      let text = describe(c);
      if ($('optReplies').checked && c.replies) {
        text += c.replies.map((r) => `\n↳ ${r.author ? r.author + ': ' : ''}${r.text}`).join('');
      }
      state.rows.push({
        checked: true,
        sheet: info.sheet,
        title: info.title,
        page: c.page + 1,
        text,
        author: c.author,
        date: c.date,
        file: f.file.name,
        snap: await snapshot(m, doc.loadPage(c.page), c),
      });
      $('progress').value = i + 1;
      if (i % 10 === 9) { renderRows(); await new Promise((r) => setTimeout(r)); }
    }
    state.busy = false;
    $('progress').hidden = true;
    lastBuilt = signature();
    renderRows();
  }

  const fmtDate = (d) => (d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` : '');

  function renderRows() {
    let n = 0;
    $('rows').innerHTML = state.rows.map((r, i) => `<tr data-i="${i}" class="${r.checked ? '' : 'off'}">
      <td class="sel"><input type="checkbox" data-act="check" ${r.checked ? 'checked' : ''}></td>
      <td class="ext">${r.checked ? ++n : ''}</td>
      <td class="sheet" contenteditable="plaintext-only" data-field="sheet">${esc(r.sheet)}</td>
      <td class="comment" contenteditable="plaintext-only" data-field="text">${esc(r.text)}</td>
      <td class="snap"><img src="${r.snap.url}" alt=""></td>
      <td class="folder">${esc(r.author)}</td>
      <td class="ext">${fmtDate(r.date)}</td>
    </tr>`).join('');
    const sel = state.rows.filter((r) => r.checked).length;
    $('status').innerHTML = `<span>Comments: <b>${state.rows.length}</b></span><span>In the sheet: <b>${sel}</b></span>` +
      (state.busy ? '<span><b>Preparing snapshots…</b></span>' : '');
    $('headCheck').checked = state.rows.length > 0 && sel === state.rows.length;
    $('headCheck').indeterminate = sel > 0 && sel < state.rows.length;
    $('exportBtn').disabled = !sel || state.busy;
  }

  $('rows').addEventListener('click', (e) => {
    if (e.target.dataset.act !== 'check') return;
    state.rows[Number(e.target.closest('tr').dataset.i)].checked = e.target.checked;
    renderRows();
  });
  $('rows').addEventListener('input', (e) => {
    const td = e.target.closest('td[data-field]');
    if (td) state.rows[Number(td.parentElement.dataset.i)][td.dataset.field] = td.textContent;
  });
  $('headCheck').addEventListener('change', (e) => { state.rows.forEach((r) => { r.checked = e.target.checked; }); renderRows(); });
  $('optNoText').addEventListener('change', () => { renderFiles(); build(); });
  $('optReplies').addEventListener('change', build);

  // ---------- Excel ----------
  $('exportBtn').onclick = async () => {
    const rows = state.rows.filter((r) => r.checked);
    if (!rows.length) return;
    try {
      const ExcelJS = await FM.excel();
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('Comment Sheet', { pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 } });
      const withTitle = rows.some((r) => r.title);
      const cols = [
        { header: 'No.', key: 'no', width: 6 },
        { header: 'Sheet No.', key: 'sheet', width: 28 },
        ...(withTitle ? [{ header: 'Sheet Title', key: 'title', width: 28 }] : []),
        { header: 'Comment', key: 'text', width: 50 },
        { header: 'Snapshot', key: 'snap', width: 42 },
        { header: 'Commented By', key: 'author', width: 18 },
        { header: 'Date', key: 'date', width: 12 },
        { header: 'Response', key: 'response', width: 45 },
        { header: 'Status', key: 'status', width: 12 },
      ];
      const thin = { style: 'thin', color: { argb: 'FFB7C0D0' } };
      const border = { top: thin, left: thin, bottom: thin, right: thin };

      // Title block of the sheet
      let r = 1;
      ws.mergeCells(r, 1, r, cols.length);
      ws.getCell(r, 1).value = 'COMMENT RESPONSE SHEET';
      ws.getCell(r, 1).font = { bold: true, size: 16 };
      ws.getRow(r).height = 26;
      r++;
      const info = [['Project', $('hProject').value], ['Reference', $('hRef').value], ['Reviewed by', $('hBy').value], ['Date', fmtDate(new Date())]]
        .filter(([, v]) => v && v.trim());
      for (const [k, v] of info) {
        ws.getCell(r, 1).value = k;
        ws.getCell(r, 1).font = { bold: true };
        ws.mergeCells(r, 2, r, Math.min(4, cols.length));
        ws.getCell(r, 2).value = v;
        r++;
      }
      r++;

      // Table
      const headerRow = r;
      cols.forEach((c, k) => {
        ws.getColumn(k + 1).width = c.width;
        const cell = ws.getCell(r, k + 1);
        cell.value = c.header;
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F81BD' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        cell.border = border;
      });
      ws.getRow(r).height = 22;
      const snapCol = cols.findIndex((c) => c.key === 'snap');
      const colPx = cols[snapCol].width * 7 + 5; // Excel column width in pixels, roughly
      for (const [i, row] of rows.entries()) {
        r++;
        const values = { no: i + 1, sheet: row.sheet, title: row.title, text: row.text, author: row.author, date: row.date ? FM.excelDate(row.date.getTime()) : null, response: '', status: '' };
        cols.forEach((c, k) => {
          const cell = ws.getCell(r, k + 1);
          if (c.key !== 'snap') cell.value = values[c.key] ?? '';
          cell.alignment = { vertical: 'top', wrapText: true, horizontal: c.key === 'no' ? 'center' : undefined };
          cell.border = border;
          if (c.key === 'date') cell.numFmt = 'yyyy-mm-dd';
        });
        // Fit the snapshot inside the cell and size the row to it.
        const maxW = colPx - 10, maxH = 180;
        const k = Math.min(maxW / row.snap.w, maxH / row.snap.h, 1);
        const w = Math.round(row.snap.w * k), h = Math.round(row.snap.h * k);
        ws.getRow(r).height = Math.max(40, (h + 10) * 0.75);
        const id = wb.addImage({ buffer: row.snap.png, extension: 'png' });
        ws.addImage(id, { tl: { col: snapCol + 0.05, row: r - 1 + 0.05 }, ext: { width: w, height: h }, editAs: 'oneCell' });
      }
      ws.views = [{ state: 'frozen', ySplit: headerRow }];
      ws.autoFilter = { from: { row: headerRow, column: 1 }, to: { row: headerRow, column: cols.length } };
      const name = ($('hProject').value.trim() || 'Comment').replace(/[\\/:*?"<>|]+/g, '-');
      await FM.downloadWorkbook(wb, `${name} - Comment Sheet.xlsx`);
      toast('Excel file downloaded.', 'success');
    } catch (e) {
      toast('Export failed: ' + e.message, 'error');
    }
  };

  // ---------- steps ----------
  const signature = () => JSON.stringify([state.files.map((f) => f.id), view.rects.map((r) => [r.x1, r.y1, r.x2, r.y2]), $('optNoText').checked, $('optReplies').checked]);
  let lastBuilt = '';

  const steps = FM.wizard({
    canEnter: (i) => {
      if (i >= 1 && !state.files.length) return 'Add at least one PDF first.';
      if (i >= 1 && state.files.some((f) => f.scanning)) return 'Still reading the comments, one moment…';
      if (i >= 1 && !state.files.some((f) => countComments(f))) return 'No comments were found in these PDFs.';
      return true;
    },
    onEnter: (i) => {
      if (i === 1) view.layout();
      if (i === 2) { if (signature() !== lastBuilt) build(); else renderRows(); }
    },
  });

  $('addFilesBtn').onclick = async () => { const f = await FM.choosePdfFiles(); if (f.length) addFiles(f); };
  $('addFolderBtn').onclick = async () => {
    try {
      const f = await FM.choosePdfFolder();
      if (f.length) addFiles(f); else toast('No PDF files in that folder.');
    } catch (e) { toast(e.message, 'error'); }
  };
  $('clearBtn').onclick = () => { state.files = []; state.viewingId = null; view.clear(); renderFiles(); };
  FM.wireDropzone(document.querySelector('main'), addFiles);
  renderFiles();
  renderRects();

  window.__fmComments = { addFiles, view, state, steps };
})();
