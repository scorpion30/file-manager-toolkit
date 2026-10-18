/* Pre-flight Check: read drawing number / revision from each PDF's title block and
 * report duplicates, file-name mismatches, missing drawings and revision mismatches. */
(() => {
  'use strict';
  const { $, esc, toast } = FM;

  const state = {
    source: null,
    rootName: '',
    all: [],          // PDFs found: {id, name, base, ext, folder, handle|file}
    files: [],        // in scope (subfolder option)
    viewingId: null,
    list: null,       // {name, wb, headers:[{col,name}], rows:[values[]]}
    results: [],      // per drawing
    missing: [],      // list entries without a PDF
    checks: [],       // summary lines
    busy: false,
  };
  let nextId = 1;
  const view = new PdfView($('viewer'), {
    onRectsChange: renderRects, dragDraws: true, maxRects: 3,
    newLabel: (i) => ['Drawing No', 'Revision', 'Title'][i],
  });

  const key = (s) => FM.cleanText(s).replace(/\s+/g, '');
  const revKey = (s) => key(s).replace(/^REV(ISION)?[.:\-]?/, '');
  const folderLabel = (f) => (f.folder ? `${f.folder}/${f.name}` : f.name);

  // ---------- drawings ----------
  function setFiles(entries, rootName) {
    state.rootName = rootName;
    state.all = entries.filter((f) => /\.pdf$/i.test(f.name)).map((f) => ({ id: nextId++, ...f }));
    applyScope();
    if (!state.files.length) toast('No PDF files in that folder.');
  }

  function applyScope() {
    state.files = $('optSub').checked ? state.all : state.all.filter((f) => !f.folder);
    state.viewingId = null;
    renderFiles();
    if (state.files.length) showFile(state.files[0].id); else view.clear();
  }

  function renderFiles() {
    $('filesLine').hidden = !state.all.length;
    $('fileCount').textContent = state.files.length;
    $('fileList').innerHTML = state.files.slice(0, 300).map((f) => `<li><span class="fname">${esc(folderLabel(f))}</span></li>`).join('');
    $('previewFile').innerHTML = state.files.slice(0, 500).map((f) =>
      `<option value="${f.id}" ${f.id === state.viewingId ? 'selected' : ''}>${esc(folderLabel(f))}</option>`).join('');
  }

  const pageIndex = () => Math.max(0, (parseInt($('pageNo').value, 10) || 1) - 1);

  async function showFile(id) {
    const f = state.files.find((x) => x.id === id);
    if (!f) return;
    state.viewingId = id;
    renderFiles();
    try {
      const doc = await FM.openPdf(await FM.fileOf(f));
      view.setPage(doc.loadPage(Math.min(pageIndex(), doc.countPages() - 1)));
      view._doc = doc;
    } catch (e) { toast(`${f.name}: ${e.message}`, 'error'); }
  }

  $('previewFile').addEventListener('change', (e) => showFile(Number(e.target.value)));
  $('pageNo').addEventListener('change', () => state.viewingId !== null && showFile(state.viewingId));
  $('optSub').addEventListener('change', () => state.all.length && applyScope());

  $('pickBtn').onclick = async () => {
    try {
      const source = await FM.pickFolder({ id: 'preflight' });
      if (!source) return;
      const listing = source.mode === 'fs' ? await FM.scanDirectory(source.handle) : FM.scanFileList(source.fileList);
      setFiles(listing.files, listing.rootName);
    } catch (e) { toast(e.message, 'error'); }
  };
  $('addFilesBtn').onclick = async () => {
    const files = await FM.choosePdfFiles();
    if (files.length) setFiles(files.map((file) => ({ name: file.name, ...FM.splitName(file.name), folder: '', file })), '');
  };
  FM.wireDropzone(document.querySelector('main'), (files) =>
    setFiles(files.map((file) => ({ name: file.name, ...FM.splitName(file.name), folder: '', file })), ''));

  // ---------- drawing list (Excel) ----------
  const cellText = (v) => {
    if (v == null) return '';
    if (v instanceof Date) return v.toISOString().slice(0, 10);
    if (typeof v === 'object') {
      if (v.richText) return v.richText.map((t) => t.text).join('');
      if ('result' in v) return cellText(v.result);
      if ('text' in v) return String(v.text);
      return '';
    }
    return String(v);
  };

  $('listBtn').onclick = async () => {
    const file = await new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.xlsx';
      input.addEventListener('change', () => resolve(input.files[0]));
      input.addEventListener('cancel', () => resolve(null));
      input.click();
    });
    if (!file) return;
    try {
      const ExcelJS = await FM.excel();
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(await file.arrayBuffer());
      state.list = { name: file.name, wb };
      $('listSheet').innerHTML = wb.worksheets.map((ws) => `<option>${esc(ws.name)}</option>`).join('');
      // Start with the sheet that has the most rows.
      const best = wb.worksheets.reduce((a, b) => (b.rowCount > a.rowCount ? b : a), wb.worksheets[0]);
      $('listSheet').value = best.name;
      readSheet();
    } catch (e) { toast('Could not read the Excel file: ' + e.message, 'error'); }
  };
  $('listClear').onclick = () => { state.list = null; renderList(); };
  $('listSheet').addEventListener('change', readSheet);
  $('listNo').addEventListener('change', renderList);
  $('listRev').addEventListener('change', renderList);

  /** Finds the header row (the first of the top rows with the most text cells) and its columns. */
  function readSheet() {
    const ws = state.list.wb.getWorksheet($('listSheet').value);
    const rows = [];
    ws.eachRow({ includeEmpty: true }, (row, n) => { rows[n] = row.values; });
    let headerRow = 1, bestCount = 0;
    for (let n = 1; n <= Math.min(25, rows.length - 1); n++) {
      const count = (rows[n] || []).filter((v) => cellText(v).trim() && Number.isNaN(Number(cellText(v)))).length;
      if (count > bestCount) { bestCount = count; headerRow = n; }
    }
    const header = rows[headerRow] || [];
    state.list.headers = [];
    header.forEach((v, col) => { const t = cellText(v).trim(); if (t) state.list.headers.push({ col, name: t }); });
    state.list.rows = rows.slice(headerRow + 1).filter(Boolean);
    const opts = state.list.headers.map((h) => `<option value="${h.col}">${esc(h.name)}</option>`).join('');
    $('listNo').innerHTML = opts;
    $('listRev').innerHTML = '<option value="">(none)</option>' + opts;
    const find = (re) => state.list.headers.find((h) => re.test(h.name));
    const no = find(/(dwg|drawing|sheet|doc(ument)?)\s*(no|number|#|ref|code)/i) || find(/^(no\.?|number|ref(erence)?)$/i) || state.list.headers[0];
    const rev = find(/^rev(ision)?\.?$/i) || find(/rev/i);
    if (no) $('listNo').value = no.col;
    $('listRev').value = rev ? rev.col : '';
    renderList();
  }

  function listEntries() {
    if (!state.list || !state.list.rows) return [];
    const noCol = Number($('listNo').value);
    const revCol = $('listRev').value ? Number($('listRev').value) : null;
    return state.list.rows
      .map((r) => ({ no: cellText(r[noCol]).trim(), rev: revCol ? cellText(r[revCol]).trim() : '' }))
      .filter((e) => e.no && /[0-9]/.test(e.no));
  }

  function renderList() {
    $('listOptions').hidden = !state.list;
    $('listClear').hidden = !state.list;
    if (!state.list) return;
    $('listLabel').textContent = `Using “${state.list.name}”.`;
    $('listCount').textContent = `${listEntries().length} drawing(s) in the list.`;
  }

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

  // ---------- the check ----------
  const signature = () => JSON.stringify([state.files.map((f) => f.id), view.rects.map((r) => [r.x1, r.y1, r.x2, r.y2]), pageIndex(),
    state.list ? [state.list.name, $('listSheet').value, $('listNo').value, $('listRev').value] : null]);
  let lastRun = '';

  async function runCheck() {
    if (state.busy) return;
    state.busy = true;
    $('verdict').textContent = 'Checking…';
    $('checks').innerHTML = '';
    $('progress').hidden = false;
    $('progress').max = state.files.length;
    const opts = { pageIndex: pageIndex(), lang: 'eng', dpi: 400, mode: 'any', upper: true, dedupe: true };
    const hasRev = view.rects.length >= 2;
    state.results = [];
    for (const [i, f] of state.files.entries()) {
      const r = { f, no: '', rev: '', title: '', pages: 0, listRev: '', problems: [] };
      try {
        const out = await PdfRead.readAreas(await FM.fileOf(f), view.rects, opts);
        [r.no = '', r.rev = '', r.title = ''] = out.values;
        r.pages = out.pages;
      } catch (e) {
        r.problems.push(`Could not open: ${e.message}`);
      }
      state.results.push(r);
      $('progress').value = i + 1;
      if (i % 5 === 4) await new Promise((res) => setTimeout(res));
    }

    // Duplicates
    const byNo = new Map();
    state.results.forEach((r) => { if (r.no) { const k = key(r.no); byNo.set(k, (byNo.get(k) || 0) + 1); } });
    // Drawing list
    const entries = listEntries();
    const listByNo = new Map(entries.map((e) => [key(e.no), e]));
    const pdfNos = new Set(state.results.filter((r) => r.no).map((r) => key(r.no)));

    const counts = { unread: 0, dup: 0, name: 0, notInList: 0, rev: 0, noRev: 0, multi: 0 };
    for (const r of state.results) {
      if (r.problems.length) continue;
      if (!r.no) { r.problems.push('Drawing number could not be read'); counts.unread++; continue; }
      const k = key(r.no);
      if (byNo.get(k) > 1) { r.problems.push('Same drawing number as another file'); counts.dup++; }
      if (!key(r.f.base).includes(k)) { r.problems.push('File name does not match the drawing number'); counts.name++; }
      if (hasRev && !r.rev) { r.problems.push('Revision could not be read'); counts.noRev++; }
      if (r.pages > 1) { r.problems.push(`File has ${r.pages} pages`); counts.multi++; }
      if (state.list) {
        const e = listByNo.get(k);
        if (!e) { r.problems.push('Not in the drawing list'); counts.notInList++; } else {
          r.listRev = e.rev;
          if (hasRev && e.rev && r.rev && revKey(e.rev) !== revKey(r.rev)) { r.problems.push('Revision differs from the drawing list'); counts.rev++; }
        }
      }
    }
    state.missing = state.list ? entries.filter((e) => !pdfNos.has(key(e.no))) : [];

    const dupNumbers = [...byNo.values()].filter((n) => n > 1).length;
    state.checks = [
      { ok: !counts.unread, text: counts.unread ? `${counts.unread} drawing(s): the drawing number could not be read` : 'Every drawing number was read' },
      { ok: !dupNumbers, text: dupNumbers ? `${dupNumbers} drawing number(s) are used by more than one file` : 'No duplicate drawing numbers' },
      { ok: !counts.name, text: counts.name ? `${counts.name} file name(s) don't match the drawing number in the title block` : 'All file names match the title block' },
    ];
    if (hasRev) state.checks.push({ ok: !counts.noRev, text: counts.noRev ? `${counts.noRev} drawing(s): the revision could not be read` : 'Every revision was read' });
    if (state.list) {
      state.checks.push({ ok: !state.missing.length, text: state.missing.length ? `${state.missing.length} drawing(s) in the list have no PDF` : 'Every drawing in the list has a PDF' });
      state.checks.push({ ok: !counts.notInList, text: counts.notInList ? `${counts.notInList} PDF(s) are not in the drawing list` : 'Every PDF is in the drawing list' });
      if (hasRev) state.checks.push({ ok: !counts.rev, text: counts.rev ? `${counts.rev} revision(s) differ from the drawing list` : 'All revisions match the drawing list' });
    } else {
      state.checks.push({ info: true, text: 'Add your drawing list in step 1 to also check missing drawings and revisions.' });
    }
    if (counts.multi) state.checks.push({ warn: true, text: `${counts.multi} file(s) have more than one page (only page ${pageIndex() + 1} was checked)` });

    state.busy = false;
    $('progress').hidden = true;
    lastRun = signature();
    renderReport();
  }

  function renderReport() {
    const problems = state.results.filter((r) => r.problems.length).length + state.missing.length;
    $('verdict').textContent = problems ? `${problems} problem(s) to check before sending` : '✓ Ready to send. No problems found.';
    $('verdict').className = problems ? 'verdict bad' : 'verdict ok';
    $('checks').innerHTML = state.checks.map((c) =>
      `<li class="${c.info ? 'info' : c.warn ? 'warn' : c.ok ? 'ok' : 'bad'}"><span class="mark">${c.info ? 'i' : c.warn ? '!' : c.ok ? '✓' : '✕'}</span>${esc(c.text)}</li>`).join('');
    const only = $('onlyProblems').checked;
    $('rows').innerHTML = state.results.filter((r) => !only || r.problems.length).map((r) => `<tr class="${r.problems.length ? 'has-problem' : ''}">
      <td class="cur-name">${esc(folderLabel(r.f))}</td>
      <td class="folder">${esc(r.no)}</td>
      <td class="ext">${esc(r.rev)}</td>
      <td class="ext">${esc(r.listRev)}</td>
      <td class="note ${r.problems.length ? 'bad' : ''}">${r.problems.length ? r.problems.map((p) => `<div>${esc(p)}</div>`).join('') : '<span class="ok-mark">✓</span>'}</td>
    </tr>`).join('');
    $('missingPanel').hidden = !state.missing.length;
    $('missingRows').innerHTML = state.missing.map((e) => `<tr><td class="folder">${esc(e.no)}</td><td class="ext">${esc(e.rev)}</td></tr>`).join('');
  }
  $('onlyProblems').addEventListener('change', renderReport);

  // ---------- report to Excel ----------
  $('exportBtn').onclick = async () => {
    if (!state.results.length) return;
    try {
      const ExcelJS = await FM.excel();
      const wb = new ExcelJS.Workbook();
      const sum = wb.addWorksheet('Summary');
      sum.columns = [{ header: 'Check', key: 'c', width: 70 }, { header: 'Result', key: 'r', width: 12 }];
      state.checks.forEach((c) => {
        const row = sum.addRow({ c: c.text, r: c.info ? '' : c.warn ? 'Warning' : c.ok ? 'OK' : 'Problem' });
        if (!c.ok && !c.info) row.getCell(2).font = { bold: true, color: { argb: c.warn ? 'FFB7791F' : 'FFD63C3C' } };
      });
      FM.styleHeaderRow(sum);

      const ws = wb.addWorksheet('Drawings');
      ws.columns = [
        { header: 'File', key: 'file', width: 50 },
        { header: 'Drawing No. (title block)', key: 'no', width: 36 },
        { header: 'Rev.', key: 'rev', width: 8 },
        { header: 'Rev. in list', key: 'listRev', width: 12 },
        { header: 'Title', key: 'title', width: 40 },
        { header: 'Problems', key: 'problems', width: 60 },
      ];
      state.results.forEach((r) => {
        const row = ws.addRow({ file: folderLabel(r.f), no: r.no, rev: r.rev, listRev: r.listRev, title: r.title, problems: r.problems.join('\n') });
        row.alignment = { vertical: 'top', wrapText: true };
        if (r.problems.length) row.getCell('problems').font = { color: { argb: 'FFD63C3C' } };
      });
      FM.styleHeaderRow(ws);
      ws.views = [{ state: 'frozen', ySplit: 1 }];
      ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: 6 } };

      if (state.missing.length) {
        const ms = wb.addWorksheet('Missing PDFs');
        ms.columns = [{ header: 'Drawing No. (list)', key: 'no', width: 40 }, { header: 'Rev. in list', key: 'rev', width: 12 }];
        state.missing.forEach((e) => ms.addRow(e));
        FM.styleHeaderRow(ms);
      }
      await FM.downloadWorkbook(wb, `${state.rootName || 'Issue'} - Pre-flight report.xlsx`);
      toast('Excel file downloaded.', 'success');
    } catch (e) { toast('Export failed: ' + e.message, 'error'); }
  };

  // ---------- steps ----------
  const steps = FM.wizard({
    canEnter: (i) => {
      if (i >= 1 && !state.files.length) return 'Choose the folder with the drawings first.';
      if (i >= 2 && !view.rects.length) return 'Draw a box around the drawing number first.';
      return true;
    },
    onEnter: (i) => {
      if (i === 1) view.layout();
      if (i === 2) { if (signature() !== lastRun) runCheck(); else renderReport(); }
    },
  });
  renderFiles();
  renderRects();
  renderList();

  window.__fmPreflight = {
    setFiles, view, state, steps,
    useList: async (file) => { const ExcelJS = await FM.excel(); const wb = new ExcelJS.Workbook(); await wb.xlsx.load(await file.arrayBuffer()); state.list = { name: file.name, wb }; $('listSheet').innerHTML = wb.worksheets.map((ws) => `<option>${esc(ws.name)}</option>`).join(''); readSheet(); },
  };
})();
