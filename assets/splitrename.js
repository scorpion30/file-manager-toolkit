/* Split & Rename PDF: split one combined drawing set into a PDF per sheet, each named
 * after the areas read from its own title block (drawing number, revision…). */
(() => {
  'use strict';
  const { $, esc, toast } = FM;
  const INVALID = /[\\/:*?"<>|\x00-\x1f]/g;
  const RESERVED = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;
  const SAMPLE_FILE = 'Tower-A-Submission.pdf';

  const state = {
    source: '',         // 'file' | 'sample'
    file: null,
    base: '',
    doc: null,
    count: 0,
    viewIndex: 0,
    pages: [],          // per page: {values, ocr, error}
    edits: new Map(),   // page index -> name typed by the user
    unchecked: new Set(), // first page of groups the user unticked
    groups: [],         // output files: {start, end, name, final, values, note, ocr}
    busy: false,
  };
  const AREA_NAMES = ['Drawing No', 'Revision', 'Title'];
  const view = new PdfView($('viewer'), { onRectsChange: renderRects, dragDraws: true, newLabel: (i) => AREA_NAMES[i] || `Area ${i + 1}` });

  // ---------- file ----------
  async function load(file, source) {
    let doc;
    try { doc = await FM.openPdf(file); } catch (e) { toast(`${file.name}: ${e.message}`, 'error'); return; }
    Object.assign(state, { source, file, doc, base: FM.splitName(file.name).base, count: doc.countPages(), pages: [], groups: [] });
    state.edits.clear();
    state.unchecked.clear();
    lastRead = '';
    $('fileCard').hidden = false;
    $('pageCount').textContent = state.count;
    $('fileHint').textContent = `pages in “${file.name}”`;
    $('sampleGuide').hidden = source !== 'sample';
    $('sampleDone').hidden = true;
    renderResults();
    // The example's first page is a cover, so show the first drawing.
    showPage(source === 'sample' ? 1 : 0);
    if (source === 'sample') { view.setRects([]); renderRects(); steps.go(1); } else FM.log('own-file');
  }

  function showPage(i) {
    if (!state.doc) return;
    state.viewIndex = Math.max(0, Math.min(state.count - 1, i));
    $('pageNo').value = state.viewIndex + 1;
    $('pageOf').textContent = `/ ${state.count}`;
    try { view.setPage(state.doc.loadPage(state.viewIndex)); } catch (e) { toast(e.message, 'error'); }
  }
  $('prevPage').onclick = () => showPage(state.viewIndex - 1);
  $('nextPage').onclick = () => showPage(state.viewIndex + 1);
  $('pageNo').addEventListener('change', () => showPage((parseInt($('pageNo').value, 10) || 1) - 1));

  $('pickBtn').onclick = async () => { const [f] = await FM.choosePdfFiles(false); if (f) load(f, 'file'); };
  FM.wireDropzone($('dropzone'), (files) => load(files[0], 'file'));

  // ---------- areas & pattern ----------
  function renderRects() {
    $('noAreas').hidden = view.rects.length > 0;
    $('clearRectsBtn').hidden = view.rects.length === 0;
    $('rectList').innerHTML = view.rects.map((r, i) => `<li data-i="${i}">
      <span class="num">${i + 1}</span>
      <input type="text" value="${esc(r.label)}" aria-label="Name for area ${i + 1}">
      <button class="icon-btn" data-act="redraw" title="Draw again">✎</button>
      <button class="icon-btn danger" data-act="remove" title="Remove">✕</button></li>`).join('');
    $('tokens').innerHTML = view.rects.map((r, i) => `<button class="chip" data-token="{${i + 1}}">+ ${esc(r.label || `{${i + 1}}`)}</button>`).join('');
  }
  $('rectList').addEventListener('input', (e) => {
    view.rects[Number(e.target.closest('li').dataset.i)].label = e.target.value;
  });
  $('rectList').addEventListener('change', renderRects);
  $('rectList').addEventListener('click', (e) => {
    const act = e.target.dataset.act;
    if (!act) return;
    const i = Number(e.target.closest('li').dataset.i);
    if (act === 'remove') { view.rects.splice(i, 1); view.drawRects(); renderRects(); }
    if (act === 'redraw') view.startDraw(i);
  });
  const insertToken = (e) => {
    const token = e.target.closest('[data-token]')?.dataset.token;
    if (!token) return;
    const input = $('pattern');
    const at = input.selectionStart ?? input.value.length;
    input.value = input.value.slice(0, at) + token + input.value.slice(input.selectionEnd ?? at);
    input.focus();
    input.setSelectionRange(at + token.length, at + token.length);
    rebuild();
  };
  $('tokens').addEventListener('click', insertToken);
  $('seps').addEventListener('click', insertToken);
  $('clearRectsBtn').onclick = () => { view.setRects([]); renderRects(); };
  $('pattern').addEventListener('input', rebuild);
  ['optGroup', 'optSkip', 'optDupes', 'optUpper'].forEach((id) => $(id).addEventListener('change', rebuild));
  renderRects();

  // ---------- reading ----------
  function log(msg, cls = '') {
    const el = $('log');
    el.hidden = false;
    el.insertAdjacentHTML('beforeend', `<span class="${cls}">${esc(msg)}</span>\n`);
    el.scrollTop = el.scrollHeight;
  }

  const signature = () => JSON.stringify([state.file && state.file.name, state.count, view.rects.map((r) => [r.x1, r.y1, r.x2, r.y2]), $('ocrUse').value]);
  let lastRead = '';

  async function readAll() {
    if (!state.doc || !view.rects.length || state.busy) return;
    state.busy = true;
    const btn = $('readBtn');
    btn.disabled = true;
    $('log').innerHTML = '';
    $('log').hidden = true;
    $('progress').hidden = false;
    $('progress').max = state.count;
    const rects = view.rects.slice();
    const opts = {
      lang: $('ocrLang').value,
      dpi: Number($('ocrDpi').value),
      mode: $('ocrMode').value,
      upper: false,
      dedupe: true,
      ocr: $('ocrUse').value === 'always',
      onOcrLoading: (lang) => log(`Loading OCR (${lang})… first time can take a minute.`),
    };
    try {
      // Automatic: a drawing set exported from CAD/Revit has real text, so OCR is only
      // needed when the boxes on the page you marked have none (a scanned set).
      if ($('ocrUse').value === 'auto') {
        const probe = await PdfRead.readPage(state.doc.loadPage(state.viewIndex), rects, { ...opts, ocr: false });
        opts.ocr = !probe.values.some(Boolean);
      }
    } catch { /* read as set */ }
    try {
      opts.anchors = await PdfRead.learnAnchors(state.doc.loadPage(state.viewIndex), rects, { ...opts, ocr: $('ocrUse').value !== 'never' });
      const found = opts.anchors.filter(Boolean).length;
      if (found) log(`Boxes follow their labels on sheets with another layout (${found} of ${rects.length} found).`, 'good');
    } catch { opts.anchors = null; }
    state.pages = [];
    state.edits.clear();
    state.unchecked.clear();
    for (let i = 0; i < state.count; i++) {
      state.progressText = `Reading… ${i + 1}/${state.count}`;
      const row = { values: [], ocr: [], error: '' };
      try {
        Object.assign(row, await PdfRead.readPage(state.doc.loadPage(i), rects, opts));
      } catch (e) {
        row.error = e.message;
        log(`Page ${i + 1}: ${e.message}`, 'bad');
      }
      state.pages.push(row);
      $('progress').value = i + 1;
      if (i % 10 === 9 || i === state.count - 1) rebuild();
      await new Promise((r) => setTimeout(r));
    }
    state.busy = false;
    state.progressText = '';
    btn.disabled = false;
    $('progress').hidden = true;
    lastRead = signature();
    rebuild();
  }
  $('readBtn').onclick = readAll;

  // ---------- names & groups ----------
  const clean = (s) => s.replace(INVALID, '-').replace(/\s+/g, ' ').replace(/^[\s-]+|[\s.-]+$/g, '');

  function nameOf(i) {
    if (state.edits.has(i)) return state.edits.get(i);
    const page = state.pages[i];
    if (!page || page.error || !page.values.some(Boolean)) return '';
    let name = $('pattern').value.replace(/\{(\d+)\}/g, (_, k) => page.values[k - 1] || '');
    if ($('optUpper').checked) name = name.toUpperCase();
    return clean(name);
  }

  /** A page to look at: a box caught only its label, or one part of the name came out empty. */
  function needsCheck(i) {
    if (state.edits.has(i)) return false;
    const page = state.pages[i];
    if (!page || page.error) return false;
    if ((page.labelOnly || []).some(Boolean)) return true;
    const used = [...$('pattern').value.matchAll(/\{(\d+)\}/g)].map((t) => page.values[t[1] - 1] || '');
    return used.some(Boolean) && used.some((v) => !v);
  }

  /** Turns the pages into output files: names, pages in a row with one name, duplicates. */
  function rebuild() {
    const groups = [];
    for (let i = 0; i < state.pages.length; i++) {
      const name = nameOf(i);
      const check = needsCheck(i);
      const last = groups[groups.length - 1];
      // Only pages with a full, sure name join the one before: never several unread sheets in one file.
      if ($('optGroup').checked && last && last.end === i - 1 && name && !check && !last.check && last.name === name) last.end = i;
      else groups.push({ start: i, end: i, name, check, values: state.pages[i].values, ocr: state.pages[i].ocr.some(Boolean), error: state.pages[i].error });
    }
    const taken = new Set();
    for (const g of groups) {
      g.note = '';
      g.final = g.name;
      if (g.error) { g.note = 'error'; continue; }
      // A half-read name ("C" for "<title>-C") would mislead: name it after the page and flag it.
      if (g.check) { g.final = `${state.base}_p${pageLabel(g)}`; g.note = 'check this page'; }
      if (!g.final) {
        if ($('optSkip').checked) { g.note = 'left out'; continue; }
        g.final = `${state.base}_p${pageLabel(g)}`;
        g.note = 'nothing read';
      }
      if (RESERVED.test(g.final)) { g.note = 'reserved name'; continue; }
      if (taken.has(g.final.toLowerCase())) {
        if (!$('optDupes').checked) { g.note = 'duplicate'; continue; }
        let k = 2;
        while (taken.has(`${g.final} (${k})`.toLowerCase())) k++;
        g.final = `${g.final} (${k})`;
        g.note = 'renumbered';
      }
      taken.add(g.final.toLowerCase());
    }
    state.groups = groups;
    renderResults();
  }

  const pageLabel = (g) => (g.start === g.end ? `${g.start + 1}` : `${g.start + 1}-${g.end + 1}`);
  const blocked = (g) => ['error', 'left out', 'reserved name', 'duplicate'].includes(g.note);
  const willSplit = (g) => !blocked(g) && !!g.final && !state.unchecked.has(g.start);

  function renderResults() {
    $('rows').innerHTML = state.groups.map((g, i) => {
      const ok = willSplit(g);
      const noteClass = blocked(g) ? 'bad' : (g.note ? 'warn' : '');
      return `<tr data-i="${i}" class="${ok ? 'changed' : ''}">
        <td class="sel"><input type="checkbox" data-act="check" ${ok ? 'checked' : ''} ${blocked(g) ? 'disabled' : ''}></td>
        <td class="pages">${pageLabel(g)}</td>
        <td class="name">${g.final ? esc(g.final) + '<span class="ext-tail">.pdf</span>' : '<span class="hint">—</span>'}<button class="edit-btn" data-act="edit" title="Edit name">✎</button></td>
        <td class="folder">${esc(g.values.filter(Boolean).join(' · '))}</td>
        <td class="note ${noteClass}">${g.ocr ? '<span class="tag">OCR</span>' : ''}${esc(g.note)}</td>
      </tr>`;
    }).join('');
    const files = state.groups.filter(willSplit).length;
    const left = state.groups.filter((g) => g.note === 'left out').reduce((n, g) => n + g.end - g.start + 1, 0);
    $('status').innerHTML = (state.progressText ? `<span><b>${esc(state.progressText)}</b></span>` : '') +
      `<span>Pages read: <b>${state.pages.length}</b></span><span class="pending">Files to create: <b>${files}</b></span>` +
      (left ? `<span>Pages left out: <b>${left}</b></span>` : '');
    const first = state.groups.find(willSplit);
    $('examplePreview').textContent = first ? first.final + '.pdf' : '—';
    $('splitBtn').disabled = !files || state.busy;
    $('splitBtn').textContent = $('optFolder').checked ? 'Split & save to folder' : 'Split & download (ZIP)';
    const checkable = state.groups.filter((g) => !blocked(g));
    const checked = checkable.filter(willSplit).length;
    $('headCheck').checked = checkable.length > 0 && checked === checkable.length;
    $('headCheck').indeterminate = checked > 0 && checked < checkable.length;
  }

  $('rows').addEventListener('click', (e) => {
    const tr = e.target.closest('tr');
    if (!tr) return;
    const g = state.groups[Number(tr.dataset.i)];
    if (e.target.dataset.act === 'check') {
      if (e.target.checked) state.unchecked.delete(g.start); else state.unchecked.add(g.start);
      renderResults();
    } else if (e.target.dataset.act === 'edit') startEdit(tr, g);
  });
  $('rows').addEventListener('dblclick', (e) => {
    const td = e.target.closest('td.name');
    if (td) startEdit(td.parentElement, state.groups[Number(td.parentElement.dataset.i)]);
  });
  $('headCheck').addEventListener('change', (e) => {
    for (const g of state.groups) if (e.target.checked) state.unchecked.delete(g.start); else state.unchecked.add(g.start);
    renderResults();
  });
  $('optFolder').addEventListener('change', renderResults);

  function startEdit(tr, g) {
    const td = tr.querySelector('td.name');
    if (td.querySelector('input')) return;
    td.innerHTML = '';
    const input = document.createElement('input');
    input.type = 'text';
    input.value = g.final || g.name;
    td.appendChild(input);
    input.focus();
    input.select();
    let done = false;
    const finish = (save) => {
      if (done) return;
      done = true;
      if (save) {
        // The typed name applies to every page of this file.
        const name = clean(input.value);
        for (let i = g.start; i <= g.end; i++) state.edits.set(i, name);
        state.unchecked.delete(g.start);
      }
      rebuild();
    };
    input.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') finish(true); if (ev.key === 'Escape') finish(false); });
    input.addEventListener('blur', () => finish(true));
  }

  // ---------- drawing register ----------
  async function registerBuffer() {
    const ExcelJS = await FM.excel();
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Drawing register');
    const labels = view.rects.map((r, i) => r.label || `Area ${i + 1}`);
    ws.columns = [
      { header: 'File name', key: 'file', width: 40 },
      { header: 'Pages', key: 'pages', width: 10 },
      ...labels.map((l, i) => ({ header: l, key: 'a' + i, width: 24 })),
      { header: 'Note', key: 'note', width: 16 },
    ];
    for (const g of state.groups) {
      const row = { file: willSplit(g) ? g.final + '.pdf' : '', pages: pageLabel(g), note: g.note };
      labels.forEach((_, i) => { row['a' + i] = g.values[i] || ''; });
      ws.addRow(row);
    }
    FM.styleHeaderRow(ws);
    ws.views = [{ state: 'frozen', ySplit: 1 }];
    return new Uint8Array(await wb.xlsx.writeBuffer());
  }
  const registerName = () => `${state.base} - drawing register.xlsx`;

  $('exportBtn').onclick = async () => {
    if (!state.groups.length) return;
    try {
      FM.downloadBlob(new Blob([await registerBuffer()], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), registerName());
    } catch (e) { toast(e.message, 'error'); }
  };

  // ---------- splitting ----------
  $('splitBtn').onclick = async () => {
    const list = state.groups.filter(willSplit);
    if (!list.length || state.busy) return;

    // Ask for the folder first, while we still have the click's permission to open a picker.
    let folder = null;
    if ($('optFolder').checked) {
      if (!FM.canDirectAccess) { toast('Saving into a folder needs Chrome or Edge. Untick it to download a ZIP.'); return; }
      try { folder = await window.showDirectoryPicker({ id: 'splitrename-out', mode: 'readwrite' }); } catch (e) {
        if (e.name !== 'AbortError') toast(e.message, 'error');
        return;
      }
    }

    const btn = $('splitBtn');
    state.busy = true;
    btn.disabled = true;
    try {
      const m = await FM.mupdf();
      const outputs = []; // [name, Uint8Array]
      for (const [n, g] of list.entries()) {
        btn.textContent = `Splitting… ${n + 1}/${list.length}`;
        await new Promise((r) => setTimeout(r));
        const out = new m.PDFDocument();
        for (let p = g.start; p <= g.end; p++) out.graftPage(-1, state.doc, p);
        // Copy out of MuPDF's WASM memory: a plain view can be freed or moved before it is written.
        const buf = out.saveToBuffer('garbage=4,compress');
        outputs.push([g.final + '.pdf', buf.asUint8Array().slice()]);
        buf.destroy();
      }
      if ($('optRegister').checked) outputs.push([registerName(), await registerBuffer()]);

      if (folder) {
        const existing = [];
        for (const [name] of outputs) { try { await folder.getFileHandle(name); existing.push(name); } catch { /* new */ } }
        if (existing.length) {
          const ok = await FM.dialog({
            title: `${existing.length} file(s) already exist in “${folder.name}”`,
            html: `<p>They will be replaced.</p><ul class="preview-list">${existing.slice(0, 20).map((n) => `<li>${esc(n)}</li>`).join('')}</ul>`,
            okText: 'Replace them',
          });
          if (!ok) return;
        }
        for (const [name, bytes] of outputs) {
          const h = await folder.getFileHandle(name, { create: true });
          const w = await h.createWritable();
          await w.write(bytes);
          await w.close();
        }
        toast(`Saved ${list.length} PDF file(s) into “${folder.name}”.`, 'success');
      } else {
        btn.textContent = 'Zipping…';
        const JSZip = await FM.jszip();
        const zip = new JSZip();
        outputs.forEach(([name, bytes]) => zip.file(name, bytes));
        FM.downloadBlob(await zip.generateAsync({ type: 'blob' }), `${state.base} - split.zip`);
        toast(`Created ${list.length} PDF file(s).`, 'success');
      }
      FM.log(state.source === 'sample' ? 'sample-split' : 'own-split');
      if (state.source === 'sample') finishSample(list);
    } catch (e) {
      toast('Could not split: ' + e.message, 'error');
    } finally {
      state.busy = false;
      renderResults();
    }
  };

  // ---------- example file ----------
  async function loadSample() {
    try {
      $('sampleBtn').disabled = true;
      const url = new URL('assets/samples/' + SAMPLE_FILE, document.querySelector('script[src*="common.js"]').src.replace(/assets\/common\.js.*$/, '')).href;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Could not load the example files. Check your connection and try again.');
      await load(new File([await res.blob()], SAMPLE_FILE, { type: 'application/pdf' }), 'sample');
    } catch (e) { toast(e.message, 'error'); } finally { $('sampleBtn').disabled = false; }
  }
  $('sampleBtn').onclick = loadSample;
  $('sampleMarkBtn').onclick = () => {
    FM.log('sample-mark');
    view.setRects([{ ...FM.SAMPLE_BOXES.no }, { ...FM.SAMPLE_BOXES.rev, label: 'Revision' }]);
    renderRects();
    $('pattern').value = '{1}_{2}';
    steps.go(2);
  };

  function finishSample(list) {
    const multi = list.find((g) => g.end > g.start);
    FM.sampleDone($('sampleDone'), {
      title: `${list.length} drawings split from one PDF, each named from its title block.`,
      points: [
        `For example, page ${list[0].start + 1} is now “${list[0].final}.pdf”`,
        multi ? `Pages ${pageLabel(multi)} have the same drawing number, so they went into one file` : 'Every sheet got its own file',
        'The cover page had no title block, so it was left out. The ZIP has a drawing register in Excel too',
      ],
      ownText: 'Now split your own PDF',
      onOwn: () => { FM.log('sample-own'); steps.go(0); $('pickBtn').click(); },
    });
  }

  const steps = FM.wizard({
    canEnter: (i) => {
      if (i >= 1 && !state.doc) return 'Choose a PDF first.';
      if (i >= 2 && !view.rects.length) return 'Draw a box around the drawing number first.';
      return true;
    },
    onEnter: (i) => {
      if (i === 1) view.layout();
      if (i === 2) {
        renderRects();
        if (state.source === 'sample' && view.rects.length > 1 && $('pattern').value === '{1}') $('pattern').value = '{1}_{2}';
        if (signature() !== lastRead) readAll(); else rebuild();
      }
    },
  });
  if (new URLSearchParams(location.search).has('example')) loadSample();

  window.__fmSplitRename = { load: (file) => load(file, 'file'), view, state, steps };
})();
