/* PDF to Excel: read text inside drawn areas from many PDFs (MuPDF + Tesseract OCR). */
(() => {
  'use strict';
  const { $, esc, toast } = FM;

  const state = {
    files: [],          // {id, file, status, statusClass}
    viewingId: null,
    results: [],        // {fileId, name, values: [], ocr: []}
    labels: [],         // column names at processing time
    existing: null,     // {file, handle?}
    busy: false,
  };
  let nextId = 1;

  const view = new PdfView($('viewer'), { onRectsChange: renderRects, dragDraws: true, newLabel: (i) => `Column ${i + 1}` });

  // ---------- files ----------
  function addFiles(files) {
    if (!state.sample) FM.log('own-files');
    const added = files.map((file) => ({ id: nextId++, file, status: '', statusClass: '' }));
    state.files.push(...added);
    renderFiles();
    if (state.viewingId === null && added.length) showFile(added[0].id);
  }

  function renderFiles() {
    $('fileList').innerHTML = state.files.map((f) => `<li data-id="${f.id}">
      <span class="fname">${esc(f.file.name)}</span>
      <span class="st ${f.statusClass}">${esc(f.status)}</span>
      <button class="icon-btn danger" data-act="remove" title="Remove">✕</button></li>`).join('');
    $('filesCard').hidden = state.files.length === 0;
    $('fileCount').textContent = state.files.length;
    $('previewFile').innerHTML = state.files.map((f) =>
      `<option value="${f.id}" ${f.id === state.viewingId ? 'selected' : ''}>${esc(f.file.name)}</option>`).join('');
  }

  function pageIndex() {
    const n = parseInt($('pageNo').value, 10);
    return Number.isFinite(n) && n > 0 ? n - 1 : 0;
  }

  async function showFile(id) {
    const f = state.files.find((x) => x.id === id);
    if (!f) return;
    state.viewingId = id;
    renderFiles();
    try {
      const doc = await FM.openPdf(f.file);
      const idx = Math.min(pageIndex(), doc.countPages() - 1);
      view.setPage(doc.loadPage(idx));
      view._doc = doc; // keep the document alive while its page is shown
    } catch (e) {
      toast(`${f.file.name}: ${e.message}`, 'error');
    }
  }

  $('fileList').addEventListener('click', (e) => {
    const li = e.target.closest('li');
    if (!li) return;
    const id = Number(li.dataset.id);
    if (e.target.dataset.act === 'remove') {
      state.files = state.files.filter((f) => f.id !== id);
      if (state.viewingId === id) {
        state.viewingId = null;
        if (state.files.length) showFile(state.files[0].id); else view.clear();
      }
      renderFiles();
    }
  });
  $('previewFile').addEventListener('change', (e) => showFile(Number(e.target.value)));

  $('pageNo').addEventListener('change', () => { if (state.viewingId !== null) showFile(state.viewingId); });

  // ---------- areas ----------
  function renderRects() {
    $('noAreas').hidden = view.rects.length > 0;
    $('clearRectsBtn').hidden = view.rects.length === 0;
    $('rectList').innerHTML = view.rects.map((r, i) => `<li data-i="${i}">
      <span class="num">${i + 1}</span>
      <input type="text" value="${esc(r.label)}" placeholder="Column name, e.g. Drawing No" aria-label="Column name for area ${i + 1}">
      <button class="icon-btn" data-act="redraw" title="Draw again">✎</button>
      <button class="icon-btn danger" data-act="remove" title="Remove">✕</button></li>`).join('');
  }
  $('rectList').addEventListener('input', (e) => {
    const i = Number(e.target.closest('li').dataset.i);
    view.rects[i].label = e.target.value;
  });
  $('rectList').addEventListener('click', (e) => {
    const act = e.target.dataset.act;
    if (!act) return;
    const i = Number(e.target.closest('li').dataset.i);
    if (act === 'remove') { view.rects.splice(i, 1); view.drawRects(); renderRects(); }
    if (act === 'redraw') view.startDraw(i);
  });
  $('clearRectsBtn').onclick = () => { view.setRects([]); renderRects(); };

  // ---------- reading ----------
  function log(msg, cls = '') {
    const el = $('log');
    el.hidden = false;
    el.insertAdjacentHTML('beforeend', `<span class="${cls}">${esc(msg)}</span>\n`);
    el.scrollTop = el.scrollHeight;
  }

  // What the current results were read from; reading again is needed when this changes.
  const signature = () => JSON.stringify([state.files.map((f) => f.id), view.rects.map((r) => [r.x1, r.y1, r.x2, r.y2]), pageIndex()]);
  let lastRead = '';

  async function process() {
    if (state.busy) return;
    const rects = view.rects.slice();
    if (!rects.length) { toast('Draw at least one area first.'); return; }
    if (!state.files.length) { toast('Add PDF files first.'); return; }
    state.busy = true;
    const btn = $('processBtn');
    btn.disabled = true;
    $('log').innerHTML = '';
    $('progress').hidden = false;
    $('progress').max = state.files.length;
    $('progress').value = 0;
    state.labels = rects.map((r, i) => r.label.trim() || `Rectangle ${i + 1}`);
    state.results = [];
    const opts = {
      pageIndex: pageIndex(),
      lang: $('ocrLang').value,
      dpi: Number($('ocrDpi').value),
      mode: $('ocrMode').value,
      upper: $('optUpper').checked,
      dedupe: $('optDedupe').checked,
      onOcrLoading: (lang) => log(`Loading OCR (${lang})… first time can take a minute.`),
    };
    try {
      for (const [n, f] of state.files.entries()) {
        btn.textContent = `Processing… ${n + 1}/${state.files.length}`;
        try {
          const { values, ocr } = await PdfRead.readAreas(f.file, rects, opts);
          state.results.push({ fileId: f.id, name: f.file.name, values, ocr });
          f.status = '✓';
          f.statusClass = 'ok';
          log(`(${n + 1}/${state.files.length}) ${f.file.name}`);
        } catch (e) {
          f.status = 'error';
          f.statusClass = 'bad';
          state.results.push({ fileId: f.id, name: f.file.name, values: rects.map(() => ''), ocr: rects.map(() => false), error: e.message });
          log(`(${n + 1}/${state.files.length}) ${f.file.name}: ${e.message}`, 'bad');
        }
        $('progress').value = n + 1;
        renderFiles();
        renderResults();
        await new Promise((r) => setTimeout(r));
      }
      log('Processing complete!', 'good');
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      state.busy = false;
      btn.disabled = false;
      btn.textContent = 'Read again';
      lastRead = signature();
    }
  }
  $('processBtn').onclick = process;

  // ---------- results ----------
  const baseName = (name) => FM.splitName(name).base;
  const matches = (r) => FM.cleanText(r.values[0]) === FM.cleanText(baseName(r.name));

  function renderResults() {
    const compare = $('optCompare').checked;
    $('resHead').innerHTML = `<tr><th>#</th><th>File</th>${state.labels.map((l) => `<th>${esc(l)}</th>`).join('')}${compare ? '<th>Match</th>' : ''}</tr>`;
    $('resBody').innerHTML = state.results.map((r, i) => `<tr data-i="${i}">
      <td class="ext">${i + 1}</td>
      <td class="folder">${esc(r.name)}${r.error ? `<br><span class="err">${esc(r.error)}</span>` : ''}</td>
      ${r.values.map((v, j) => `<td contenteditable="plaintext-only" data-j="${j}" class="${r.ocr[j] ? 'ocr' : ''} ${v ? '' : 'empty-cell'}">${esc(v)}</td>`).join('')}
      ${compare ? `<td class="${matches(r) ? '' : 'nomatch'}">${matches(r) ? 'Yes' : 'No'}</td>` : ''}
    </tr>`).join('');
  }
  $('resBody').addEventListener('input', (e) => {
    const td = e.target.closest('td[data-j]');
    if (!td) return;
    const r = state.results[Number(td.parentElement.dataset.i)];
    r.values[Number(td.dataset.j)] = td.textContent.trim();
  });
  $('resBody').addEventListener('focusout', () => renderResults());
  $('optCompare').addEventListener('change', renderResults);

  // ---------- export ----------
  function parseCell(ref) {
    const mm = String(ref).trim().toUpperCase().match(/^([A-Z]{1,3})\s*(\d+)$/);
    if (!mm) return null;
    let col = 0;
    for (const ch of mm[1]) col = col * 26 + (ch.charCodeAt(0) - 64);
    return { col, row: Number(mm[2]) };
  }

  $('existingBtn').onclick = async () => {
    try {
      if (window.showOpenFilePicker) {
        const [handle] = await window.showOpenFilePicker({
          id: 'extract-excel',
          types: [{ description: 'Excel', accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] } }],
        });
        state.existing = { handle, file: await handle.getFile() };
      } else {
        const file = await new Promise((resolve) => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = '.xlsx';
          input.addEventListener('change', () => resolve(input.files[0]));
          input.click();
        });
        if (!file) return;
        state.existing = { file };
      }
    } catch (e) {
      if (e.name !== 'AbortError') toast(e.message, 'error');
      return;
    }
    renderExisting();
  };
  $('existingClear').onclick = () => { state.existing = null; renderExisting(); };
  function renderExisting() {
    const ex = state.existing;
    $('existingLabel').textContent = ex
      ? `Will add to “${ex.file.name}”${ex.handle ? ' and save it in place' : ' and download the updated copy'}.`
      : 'A new Excel file will be created.';
    $('existingClear').hidden = !ex;
    $('insertWrap').hidden = !ex;
  }

  $('exportBtn').onclick = async () => {
    if (!state.results.length) { toast('Process the PDFs first.'); return; }
    const start = parseCell($('startCell').value);
    if (!start) { toast('Start cell must look like A1 or C5.', 'error'); return; }
    let sheetName = $('sheetName').value.trim() || 'Sheet1';
    const header = $('optHeader').checked;
    const withName = $('optFilename').checked;
    const compare = $('optCompare').checked;
    const insert = state.existing && $('optInsert').checked;

    try {
      const ExcelJS = await FM.excel();
      const wb = new ExcelJS.Workbook();
      if (state.existing) {
        const file = state.existing.handle ? await state.existing.handle.getFile() : state.existing.file;
        await wb.xlsx.load(await file.arrayBuffer());
      }
      let ws = wb.getWorksheet(sheetName);
      if (ws && !insert) {
        const replace = await FM.dialog({
          title: `Sheet “${sheetName}” already exists`,
          html: '<p>Replace it, or keep it and add the data in a new sheet?</p>',
          okText: 'Replace', okClass: 'danger-solid', cancelText: 'New sheet',
        });
        if (replace) { wb.removeWorksheet(ws.id); ws = null; } else {
          let i = 1;
          while (wb.getWorksheet(`${sheetName}_${i}`)) i++;
          sheetName = `${sheetName}_${i}`;
          ws = null;
        }
      }
      if (!ws) ws = wb.addWorksheet(sheetName);

      const cols = [];
      if (withName) cols.push({ title: 'PDF Filename', get: (r) => r.name, width: 36 });
      state.labels.forEach((l, j) => cols.push({ title: l, get: (r) => r.values[j], width: 24, data: j === 0 }));
      if (withName) cols.push({ title: 'File Name (no extension)', get: (r) => FM.cleanText(baseName(r.name)), width: 30 });
      if (compare) cols.push({ title: 'Match', get: (r) => (matches(r) ? 'Yes' : 'No'), width: 9 });

      let row = start.row;
      const headerEmpty = cols.every((c, k) => ws.getCell(row, start.col + k).value == null);
      if (header && (!insert || headerEmpty)) {
        cols.forEach((c, k) => {
          const cell = ws.getCell(row, start.col + k);
          cell.value = c.title;
          cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F81BD' } };
        });
        row++;
      } else if (header) {
        row++;
      }
      for (const r of state.results) {
        cols.forEach((c, k) => {
          const v = c.get(r);
          if (insert && (v === '' || v == null)) return; // insert mode leaves existing cells alone
          ws.getCell(row, start.col + k).value = v;
        });
        if (compare && !matches(r)) {
          const k = cols.findIndex((c) => c.data);
          const cell = ws.getCell(row, start.col + k);
          cell.font = { color: { argb: 'FFFF0000' } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } };
        }
        row++;
      }
      cols.forEach((c, k) => {
        const col = ws.getColumn(start.col + k);
        if (!col.width || col.width < c.width) col.width = c.width;
      });

      const buf = await wb.xlsx.writeBuffer();
      if (state.existing && state.existing.handle) {
        if (!(await FM.ensurePermission(state.existing.handle))) throw new Error('Permission to save the Excel file was not given.');
        const w = await state.existing.handle.createWritable();
        await w.write(buf);
        await w.close();
        toast(`Saved into “${state.existing.file.name}”, sheet “${sheetName}”.`, 'success');
      } else {
        const name = state.existing ? state.existing.file.name : (state.sample ? 'Drawing register.xlsx' : 'extracted_data.xlsx');
        FM.downloadBlob(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), name);
        toast('Excel file downloaded.', 'success');
        if (state.sample) finishSample(); else FM.log('own-export');
      }
    } catch (e) {
      toast('Export failed: ' + e.message, 'error');
    }
  };

  // ---------- wiring ----------
  // ---------- example files ----------
  async function loadSample() {
    try {
      $('sampleBtn').disabled = true;
      const files = await FM.samplePdfs();
      state.files = [];
      state.viewingId = null;
      state.sample = true;
      addFiles(files);
      view.setRects([]);
      renderRects();
      $('sampleGuide').hidden = false;
      $('sampleDone').hidden = true;
      steps.go(1);
    } catch (e) { toast(e.message, 'error'); } finally { $('sampleBtn').disabled = false; }
  }
  $('sampleBtn').onclick = loadSample;
  $('sampleMarkBtn').onclick = () => {
    FM.log('sample-mark');
    const b = FM.SAMPLE_BOXES;
    view.setRects([{ ...b.no }, { ...b.title }, { ...b.rev }]);
    renderRects();
    steps.go(2);
  };
  function finishSample() {
    $('sampleGuide2').hidden = true;
    $('exportBtn').classList.remove('pulse');
    FM.log('sample-export');
    FM.sampleDone($('sampleDone'), {
      title: 'Your drawing register is ready. Open it from your downloads.',
      points: [
        `One row for each of the ${state.results.length} drawings, one column for each box you drew`,
        'The values are read from the title block of every PDF: no typing',
        'Works the same on hundreds of drawings, and can add to your own Excel sheet',
      ],
      ownText: 'Now read your own drawings',
      onOwn: () => { FM.log('sample-own'); state.sample = false; $('clearBtn').click(); steps.go(0); },
    });
  }

  $('addFilesBtn').onclick = async () => { const f = await FM.choosePdfFiles(); if (f.length) addFiles(f); };
  $('addFolderBtn').onclick = async () => {
    try {
      const f = await FM.choosePdfFolder();
      if (f.length) addFiles(f); else toast('No PDF files in that folder.');
    } catch (e) { toast(e.message, 'error'); }
  };
  $('clearBtn').onclick = () => {
    state.sample = false;
    $('sampleGuide').hidden = true;
    $('sampleGuide2').hidden = true;
    state.files = [];
    state.viewingId = null;
    view.clear();
    renderFiles();
  };
  FM.wireDropzone(document.querySelector('main'), addFiles);
  renderFiles();
  renderRects();

  const steps = FM.wizard({
    canEnter: (i) => {
      if (i >= 1 && !state.files.length) return 'Add at least one PDF first.';
      if (i >= 2 && !view.rects.length) return 'Draw at least one area on the drawing first.';
      return true;
    },
    onEnter: (i) => {
      if (i === 1 && state.viewingId === null && state.files.length) showFile(state.files[0].id);
      if (i === 1) view.layout();
      if (i === 2) {
        // Column names may have changed without needing a new read.
        state.labels = view.rects.map((r, k) => r.label.trim() || `Column ${k + 1}`);
        if (signature() !== lastRead) process(); else renderResults();
        $('sampleGuide2').hidden = !state.sample;
        $('exportBtn').classList.toggle('pulse', !!state.sample);
      }
    },
  });
  if (new URLSearchParams(location.search).has('example')) loadSample();

  window.__fmExtract = { addFiles, view, state, steps };
})();
