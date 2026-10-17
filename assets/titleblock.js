/* Rename from Title Block: read areas of each PDF and rename the file after them. */
(() => {
  'use strict';
  const { $, esc, toast } = FM;
  const INVALID = /[\\/:*?"<>|\x00-\x1f]/g;
  const RESERVED = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;

  const state = {
    source: null,       // {mode:'fs', handle} | {mode:'input', fileList}
    rootName: '',
    all: [],            // every PDF found: {id, name, base, ext, folder, dirHandle, handle, file}
    files: [],          // PDFs in scope (subfolders option)
    viewingId: null,
    rows: [],           // {f, values, ocr, error, newBase, checked, note}
    undo: null,
    busy: false,
  };
  let nextId = 1;
  const AREA_NAMES = ['Drawing No', 'Title', 'Revision'];
  const view = new PdfView($('viewer'), { onRectsChange: renderRects, dragDraws: true, newLabel: (i) => AREA_NAMES[i] || `Area ${i + 1}` });
  const folderLabel = (path) => (path ? state.rootName + '/' + path : state.rootName);

  // ---------- folder ----------
  async function load(source) {
    state.source = source;
    try {
      const listing = source.mode === 'fs' ? await FM.scanDirectory(source.handle) : FM.scanFileList(source.fileList);
      state.rootName = listing.rootName;
      state.all = listing.files.filter((f) => /\.pdf$/i.test(f.name)).map((f) => ({ id: nextId++, ...f }));
    } catch (e) { toast(e.message, 'error'); return; }
    state.rows = [];
    state.undo = null;
    applyScope();
    if (!state.files.length) toast('No PDF files in that folder.');
  }

  function applyScope() {
    state.files = $('optSub').checked ? state.all : state.all.filter((f) => f.folder === '');
    state.viewingId = null;
    renderFiles();
    renderResults();
    if (state.files.length) showFile(state.files[0].id); else view.clear();
  }

  function renderFiles() {
    $('filesCard').hidden = !state.source;
    $('fileCount').textContent = state.files.length;
    $('filesHint').textContent = `PDF files found in “${state.rootName}”`;
    $('fileList').innerHTML = state.files.slice(0, 500).map((f) => `<li data-id="${f.id}">
      <span class="fname">${esc(f.folder ? f.folder + '/' + f.name : f.name)}</span></li>`).join('');
    $('previewFile').innerHTML = state.files.slice(0, 500).map((f) =>
      `<option value="${f.id}" ${f.id === state.viewingId ? 'selected' : ''}>${esc(f.folder ? f.folder + '/' + f.name : f.name)}</option>`).join('');
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
  $('optSub').addEventListener('change', () => state.source && applyScope());
  $('pageNo').addEventListener('change', () => state.viewingId !== null && showFile(state.viewingId));

  // ---------- areas & pattern ----------
  function renderRects() {
    $('noAreas').hidden = view.rects.length > 0;
    $('clearRectsBtn').hidden = view.rects.length === 0;
    $('rectList').innerHTML = view.rects.map((r, i) => `<li data-i="${i}">
      <span class="num">${i + 1}</span>
      <input type="text" value="${esc(r.label)}" aria-label="Name for area ${i + 1}">
      <button class="icon-btn" data-act="redraw" title="Draw again">✎</button>
      <button class="icon-btn danger" data-act="remove" title="Remove">✕</button></li>`).join('');
    $('tokens').innerHTML = view.rects.map((r, i) => `<button class="chip" data-token="{${i + 1}}">+ ${esc(r.label || `{${i + 1}}`)}</button>`).join('') +
      '<button class="chip" data-token="{name}">+ {name}</button>';
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
  $('tokens').addEventListener('click', (e) => {
    const token = e.target.closest('[data-token]')?.dataset.token;
    if (!token) return;
    const input = $('pattern');
    const at = input.selectionStart ?? input.value.length;
    input.value = input.value.slice(0, at) + token + input.value.slice(input.selectionEnd ?? at);
    input.focus();
    rebuildNames();
  });
  $('clearRectsBtn').onclick = () => { view.setRects([]); renderRects(); };
  $('pattern').addEventListener('input', rebuildNames);
  $('optUpper').addEventListener('change', rebuildNames);
  $('optDupes').addEventListener('change', rebuildNames);
  renderRects();

  // ---------- reading ----------
  function log(msg, cls = '') {
    const el = $('log');
    el.hidden = false;
    el.insertAdjacentHTML('beforeend', `<span class="${cls}">${esc(msg)}</span>\n`);
    el.scrollTop = el.scrollHeight;
  }

  // What the current names were read from; reading again is needed when this changes.
  const signature = () => JSON.stringify([state.files.map((f) => f.id), view.rects.map((r) => [r.x1, r.y1, r.x2, r.y2]), pageIndex()]);
  let lastRead = '';

  async function readNames() {
    if (!state.files.length || !view.rects.length || state.busy) return;
    state.busy = true;
    const btn = $('readBtn');
    btn.disabled = true;
    $('log').innerHTML = '';
    $('progress').hidden = false;
    $('progress').max = state.files.length;
    const rects = view.rects.slice();
    const opts = {
      pageIndex: pageIndex(),
      lang: $('ocrLang').value,
      dpi: Number($('ocrDpi').value),
      mode: $('ocrMode').value,
      upper: false,
      dedupe: true,
      onOcrLoading: (lang) => log(`Loading OCR (${lang})… first time can take a minute.`),
    };
    state.rows = [];
    for (const [n, f] of state.files.entries()) {
      btn.textContent = `Reading… ${n + 1}/${state.files.length}`;
      state.progressText = `Reading… ${n + 1}/${state.files.length}`;
      const row = { f, values: [], ocr: [], error: '', newBase: '', checked: true, note: '' };
      try {
        Object.assign(row, await PdfRead.readAreas(await FM.fileOf(f), rects, opts));
      } catch (e) {
        row.error = e.message;
        log(`${f.name}: ${e.message}`, 'bad');
      }
      state.rows.push(row);
      $('progress').value = n + 1;
      if (n % 5 === 4 || n === state.files.length - 1) rebuildNames();
      await new Promise((r) => setTimeout(r));
    }
    log(`Read ${state.rows.length} file(s).`, 'good');
    state.busy = false;
    btn.disabled = false;
    btn.textContent = 'Read again';
    state.progressText = '';
    lastRead = signature();
    renderResults();
  }
  $('readBtn').onclick = readNames;

  // ---------- names ----------
  function buildBase(row) {
    let name = $('pattern').value.replace(/\{(\d+)\}/g, (_, i) => row.values[i - 1] || '')
      .replace(/\{name\}/gi, row.f.base);
    if ($('optUpper').checked) name = name.toUpperCase();
    return name.replace(INVALID, '-').replace(/\s+/g, ' ').replace(/^[\s-]+|[\s.-]+$/g, '');
  }

  /** Recomputes every new name, then resolves duplicates inside each folder. */
  function rebuildNames() {
    const taken = new Map(); // folder -> Set(lowercase names that will exist)
    const keyOf = (folder) => { if (!taken.has(folder)) taken.set(folder, new Set()); return taken.get(folder); };
    // Files that are not being renamed keep their names.
    const renaming = new Set();
    for (const row of state.rows) {
      if (!row.edited) row.newBase = buildBase(row);
      if (row.checked && row.newBase && row.newBase !== row.f.base) renaming.add(row.f.id);
    }
    for (const f of state.all) if (!renaming.has(f.id)) keyOf(f.folder).add(f.name.toLowerCase());
    for (const row of state.rows) {
      row.note = '';
      row.final = row.newBase;
      if (row.error) { row.note = 'error'; continue; }
      if (!row.newBase) { row.note = 'nothing read'; continue; }
      if (RESERVED.test(row.newBase)) { row.note = 'reserved name'; continue; }
      if (!renaming.has(row.f.id)) { if (row.newBase === row.f.base) row.note = 'same name'; continue; }
      const set = keyOf(row.f.folder);
      let candidate = row.newBase;
      if (set.has((candidate + row.f.ext).toLowerCase())) {
        if (!$('optDupes').checked) { row.note = 'duplicate'; continue; }
        let k = 2;
        while (set.has(`${row.newBase} (${k})${row.f.ext}`.toLowerCase())) k++;
        candidate = `${row.newBase} (${k})`;
        row.note = 'renumbered';
      }
      set.add((candidate + row.f.ext).toLowerCase());
      row.final = candidate;
    }
    renderResults();
  }

  const willRename = (row) => row.checked && row.final && row.final !== row.f.base &&
    !['error', 'nothing read', 'reserved name', 'duplicate', 'same name'].includes(row.note);

  function renderResults() {
    $('rows').innerHTML = state.rows.map((row, i) => {
      const ok = willRename(row);
      const noteClass = ok ? (row.note === 'renumbered' ? 'warn' : '') : 'bad';
      return `<tr data-i="${i}" class="${ok ? 'changed' : ''}">
        <td class="sel"><input type="checkbox" data-act="check" ${row.checked ? 'checked' : ''}></td>
        <td class="cur-name">${esc(row.f.name)}</td>
        <td class="name" data-act="edit">${esc(row.final || '')}${row.f.ext ? `<span class="ext-tail">${esc(row.f.ext)}</span>` : ''}<button class="edit-btn" data-act="edit" title="Edit name">✎</button></td>
        <td class="folder">${esc(folderLabel(row.f.folder))}</td>
        <td class="note ${noteClass}">${row.ocr.some(Boolean) ? '<span class="tag">OCR</span>' : ''}${esc(row.note)}</td>
      </tr>`;
    }).join('');
    const count = state.rows.filter(willRename).length;
    $('status').innerHTML = (state.progressText ? `<span><b>${esc(state.progressText)}</b></span>` : '') +
      `<span>Files read: <b>${state.rows.length}</b></span><span class="pending">Will be renamed: <b>${count}</b></span>`;
    const first = state.rows.find((r) => r.final);
    $('examplePreview').textContent = first ? first.final + first.f.ext : '—';
    $('applyBtn').disabled = !count || state.busy;
    $('applyBtn').textContent = state.source && state.source.mode !== 'fs' ? 'Download renamed (ZIP)' : 'Apply Rename';
    $('undoBtn').hidden = !state.undo;
    const checked = state.rows.filter((r) => r.checked).length;
    $('headCheck').checked = state.rows.length > 0 && checked === state.rows.length;
    $('headCheck').indeterminate = checked > 0 && checked < state.rows.length;
  }

  $('rows').addEventListener('click', (e) => {
    const tr = e.target.closest('tr');
    if (!tr) return;
    const row = state.rows[Number(tr.dataset.i)];
    if (e.target.dataset.act === 'check') { row.checked = e.target.checked; rebuildNames(); }
    else if (e.target.classList.contains('edit-btn')) startEdit(tr, row);
  });
  $('rows').addEventListener('dblclick', (e) => {
    const td = e.target.closest('td.name');
    if (td) startEdit(td.parentElement, state.rows[Number(td.parentElement.dataset.i)]);
  });
  $('headCheck').addEventListener('change', (e) => { state.rows.forEach((r) => { r.checked = e.target.checked; }); rebuildNames(); });

  function startEdit(tr, row) {
    const td = tr.querySelector('td.name');
    if (td.querySelector('input')) return;
    td.innerHTML = '';
    const input = document.createElement('input');
    input.type = 'text';
    input.value = row.final || row.newBase;
    td.appendChild(input);
    input.focus();
    input.select();
    let done = false;
    const finish = (save) => {
      if (done) return;
      done = true;
      if (save) { row.newBase = input.value.replace(INVALID, '-').trim(); row.edited = true; row.checked = true; }
      rebuildNames();
    };
    input.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') finish(true); if (ev.key === 'Escape') finish(false); });
    input.addEventListener('blur', () => finish(true));
  }

  // ---------- applying ----------
  async function exists(dir, name) {
    try { await dir.getFileHandle(name); return true; } catch { return false; }
  }

  async function moveTo(f, name) {
    if (await exists(f.dirHandle, name)) throw new Error(`“${name}” already exists in this folder`);
    if (typeof f.handle.move === 'function') {
      try { await f.handle.move(name); return; } catch (e) {
        if (!['NotSupportedError', 'TypeError', 'InvalidModificationError'].includes(e.name)) throw e;
      }
    }
    const oldName = f.handle.name;
    const src = await f.handle.getFile();
    const nh = await f.dirHandle.getFileHandle(name, { create: true });
    const w = await nh.createWritable();
    await w.write(src);
    await w.close();
    await f.dirHandle.removeEntry(oldName);
    f.handle = nh;
  }

  /** items: [{f, target}] where target is the new base name. Returns undo list. */
  async function renameAll(items) {
    if (!(await FM.ensurePermission(state.source.handle))) { toast('Permission to edit the folder was not given.', 'error'); return []; }
    const current = new Map();
    for (const f of state.all) {
      if (!current.has(f.folder)) current.set(f.folder, new Set());
      current.get(f.folder).add(f.name.toLowerCase());
    }
    const stamp = Date.now().toString(36);
    const viaTemp = [];
    const direct = [];
    for (const it of items) (current.get(it.f.folder).has((it.target + it.f.ext).toLowerCase()) ? viaTemp : direct).push(it);
    const done = [];
    const failed = [];
    const finish = (it) => {
      done.push({ id: it.f.id, prevBase: it.f.base });
      it.f.base = it.target;
      it.f.name = it.target + it.f.ext;
    };
    // Names already used by another file in the batch go through a temporary name first.
    for (const [i, it] of viaTemp.entries()) {
      try { await moveTo(it.f, `~fm-${stamp}-${i}${it.f.ext}`); it.temp = true; } catch (e) { failed.push([it.f.name, e.message]); }
    }
    for (const it of direct) {
      try { await moveTo(it.f, it.target + it.f.ext); finish(it); } catch (e) { failed.push([it.f.name, e.message]); }
    }
    for (const it of viaTemp) {
      if (!it.temp) continue;
      try { await moveTo(it.f, it.target + it.f.ext); finish(it); } catch (e) {
        failed.push([it.f.name, e.message]);
        try { await moveTo(it.f, it.f.name); } catch { /* left on its temporary name */ }
      }
    }
    if (done.length) toast(`Renamed ${done.length} file(s).`, 'success');
    if (failed.length) {
      await FM.dialog({
        title: `${failed.length} file(s) could not be renamed`,
        html: `<p>The file may be open in another program, or the folder is read-only.</p><ul class="preview-list">${failed.slice(0, 30)
          .map(([n, m]) => `<li>${esc(n)}<br><small>${esc(m)}</small></li>`).join('')}</ul>`,
        cancel: false,
      });
    }
    return done;
  }

  $('applyBtn').onclick = async () => {
    const list = state.rows.filter(willRename);
    if (!list.length) return;
    if (state.source.mode !== 'fs') { await downloadZip(); return; }
    const ok = await FM.dialog({
      title: `Rename ${list.length} file(s)?`,
      html: `<ul class="preview-list">${list.slice(0, 40).map((r) =>
        `<li><span class="from">${esc(r.f.name)}</span><span class="arrow">→</span>${esc(r.final + r.f.ext)}</li>`).join('')}</ul>${list.length > 40 ? `<p>…and ${list.length - 40} more.</p>` : ''}`,
      okText: 'Rename files',
      okClass: 'success',
    });
    if (!ok) return;
    state.busy = true;
    renderResults();
    const done = await renameAll(list.map((r) => ({ f: r.f, target: r.final })));
    state.busy = false;
    if (done.length) {
      state.undo = done;
      const renamed = new Set(done.map((d) => d.id));
      state.rows = state.rows.filter((r) => !renamed.has(r.f.id));
    }
    rebuildNames();
  };

  $('undoBtn').onclick = async () => {
    if (!state.undo) return;
    const ok = await FM.dialog({ title: 'Undo last rename?', html: `<p>${state.undo.length} file(s) will get their previous names back.</p>`, okText: 'Undo' });
    if (!ok) return;
    const byId = new Map(state.all.map((f) => [f.id, f]));
    const items = state.undo.map((u) => ({ f: byId.get(u.id), target: u.prevBase })).filter((it) => it.f);
    await renameAll(items);
    state.undo = null;
    renderFiles();
    rebuildNames();
  };

  async function downloadZip() {
    const list = state.rows.filter(willRename);
    try {
      const JSZip = await FM.jszip();
      const zip = new JSZip();
      for (const r of list) zip.file((r.f.folder ? r.f.folder + '/' : '') + r.final + r.f.ext, r.f.file);
      FM.downloadBlob(await zip.generateAsync({ type: 'blob' }), `${state.rootName}-renamed.zip`);
    } catch (e) { toast(e.message, 'error'); }
  }

  $('exportBtn').onclick = async () => {
    if (!state.rows.length) return;
    try {
      const ExcelJS = await FM.excel();
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('Rename list');
      const labels = view.rects.map((r, i) => r.label || `Area ${i + 1}`);
      ws.columns = [
        { header: 'Current name', key: 'cur', width: 40 },
        { header: 'New name', key: 'new', width: 40 },
        { header: 'Folder', key: 'folder', width: 30 },
        ...labels.map((l, i) => ({ header: l, key: 'a' + i, width: 24 })),
        { header: 'Note', key: 'note', width: 16 },
      ];
      for (const r of state.rows) {
        const row = { cur: r.f.name, new: r.final ? r.final + r.f.ext : '', folder: folderLabel(r.f.folder), note: r.note };
        labels.forEach((_, i) => { row['a' + i] = r.values[i] || ''; });
        ws.addRow(row);
      }
      FM.styleHeaderRow(ws);
      ws.views = [{ state: 'frozen', ySplit: 1 }];
      await FM.downloadWorkbook(wb, `${state.rootName}-rename-list.xlsx`);
    } catch (e) { toast(e.message, 'error'); }
  };

  $('pickBtn').onclick = async () => {
    try {
      const source = await FM.pickFolder({ write: true, id: 'titleblock' });
      if (source) await load(source);
    } catch (e) { toast(e.message, 'error'); }
  };
  if (!FM.canDirectAccess) $('fallbackNotice').hidden = false;

  const steps = FM.wizard({
    canEnter: (i) => {
      if (i >= 1 && !state.files.length) return 'Choose a folder with PDF files first.';
      if (i >= 2 && !view.rects.length) return 'Draw a box around the drawing number first.';
      return true;
    },
    onEnter: (i) => {
      if (i === 1) view.layout();
      if (i === 2) {
        renderRects();
        if (signature() !== lastRead) readNames(); else rebuildNames();
      }
    },
  });
  renderFiles();

  window.__fmTitleblock = { load: (handle) => load({ mode: 'fs', handle }), view, state, rebuildNames, steps };
})();
