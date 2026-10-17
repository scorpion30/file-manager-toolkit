/* Rename Files tool - runs fully in the browser.
 * Direct renaming uses the File System Access API (Chrome / Edge desktop).
 * Other browsers fall back to reading the folder via <input webkitdirectory>
 * and downloading a ZIP of renamed copies. */
(() => {
  'use strict';

  const EXCELJS_URL = 'https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.4.0/exceljs.min.js';
  const JSZIP_URL = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
  const RENDER_STEP = 500;
  const INVALID_CHARS = /[\\/:*?"<>|\x00-\x1f]/;
  const RESERVED = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\..*)?$/i;

  const $ = (id) => document.getElementById(id);
  const canDirectAccess = typeof window.showDirectoryPicker === 'function';

  const state = {
    mode: null,            // 'fs' (direct rename) or 'zip' (fallback)
    rootHandle: null,
    rootName: '',
    files: [],             // {id, base, ext, newBase, folder, dirHandle, handle, file, checked}
    folders: [],           // {path, depth}
    include: 'current',
    selectedFolders: new Set(),
    extSelected: null,     // Set of lower-case ext keys; null = not initialised
    visible: [],
    renderLimit: RENDER_STEP,
    lastClicked: null,
    errors: new Map(),     // id -> message
    undo: null,            // [{id, prevBase}]
    busy: false,
  };
  let nextId = 1;

  // ---------- helpers ----------
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const extKey = (f) => f.ext.toLowerCase();
  const fullName = (f) => f.base + f.ext;
  const newFullName = (f) => f.newBase + f.ext;
  const isChanged = (f) => f.newBase !== f.base;
  const folderLabel = (path) => (path ? state.rootName + '/' + path : state.rootName);
  const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

  function splitName(name) {
    const i = name.lastIndexOf('.');
    if (i <= 0) return { base: name, ext: '' };
    return { base: name.slice(0, i), ext: name.slice(i) };
  }

  function makeFile(name, folder, extra) {
    const { base, ext } = splitName(name);
    return { id: nextId++, base, ext, newBase: base, folder, checked: false, ...extra };
  }

  function toast(msg, kind = '') {
    const el = document.createElement('div');
    el.className = 'toast ' + kind;
    el.textContent = msg;
    $('toasts').appendChild(el);
    setTimeout(() => el.remove(), kind === 'error' ? 7000 : 4000);
  }

  function dialog({ title, html, okText = 'OK', okClass = 'primary', cancel = true }) {
    const dlg = $('dlg');
    $('dlgTitle').textContent = title;
    $('dlgBody').innerHTML = html;
    $('dlgOk').textContent = okText;
    $('dlgOk').className = 'btn ' + okClass;
    $('dlgCancel').hidden = !cancel;
    dlg.showModal();
    $('dlgOk').focus();
    // Resolve from the buttons directly; the dialog 'close' event is not fired reliably everywhere.
    return new Promise((resolve) => {
      const finish = (value) => {
        $('dlgOk').removeEventListener('click', onOk);
        $('dlgCancel').removeEventListener('click', onCancel);
        dlg.removeEventListener('cancel', onEscape);
        if (dlg.open) dlg.close();
        resolve(value);
      };
      const onOk = () => finish(true);
      const onCancel = () => finish(false);
      const onEscape = (e) => { e.preventDefault(); finish(false); };
      $('dlgOk').addEventListener('click', onOk);
      $('dlgCancel').addEventListener('click', onCancel);
      dlg.addEventListener('cancel', onEscape);
    });
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = () => reject(new Error('Could not load a required library. Check your internet connection.'));
      document.head.appendChild(s);
    });
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }

  // ---------- loading a folder ----------
  async function pickFolder() {
    if (canDirectAccess) {
      try {
        const handle = await window.showDirectoryPicker({ id: 'rename-files', mode: 'readwrite' });
        await loadDirectoryHandle(handle);
        return;
      } catch (e) {
        if (e.name === 'AbortError') return;
        if (e.name !== 'SecurityError') { toast(e.message, 'error'); return; }
        // SecurityError (e.g. inside an iframe) - use the fallback picker instead.
      }
    }
    $('folderInput').value = '';
    $('folderInput').click();
  }

  async function loadDirectoryHandle(handle) {
    state.mode = 'fs';
    state.rootHandle = handle;
    state.rootName = handle.name;
    state.undo = null;
    showScanning(true);
    const files = [];
    const folders = [];
    let counter = 0;

    async function walk(dir, path, depth) {
      folders.push({ path, depth });
      let entries;
      try {
        entries = [];
        for await (const entry of dir.values()) entries.push(entry);
      } catch (e) {
        return; // folder we are not allowed to read
      }
      for (const entry of entries) {
        if (entry.kind === 'file') {
          files.push(makeFile(entry.name, path, { dirHandle: dir, handle: entry }));
          if (++counter % 200 === 0) $('scanText').textContent = `Reading folder… ${counter} files`;
        } else {
          await walk(entry, path ? path + '/' + entry.name : entry.name, depth + 1);
        }
      }
    }

    try {
      await walk(handle, '', 0);
    } finally {
      showScanning(false);
    }
    setData(files, folders);
  }

  function loadFromFileList(fileList) {
    const list = Array.from(fileList);
    if (!list.length) { toast('That folder is empty.'); return; }
    state.mode = 'zip';
    state.rootHandle = null;
    state.undo = null;
    const folderSet = new Map();
    const files = [];
    state.rootName = (list[0].webkitRelativePath || list[0].name).split('/')[0];
    for (const file of list) {
      const parts = (file.webkitRelativePath || file.name).split('/');
      const name = parts.pop();
      const folder = parts.slice(1).join('/');
      for (let i = 1; i <= parts.length - 1; i++) {
        const p = parts.slice(1, i + 1).join('/');
        folderSet.set(p, i);
      }
      files.push(makeFile(name, folder, { file }));
    }
    const folders = [{ path: '', depth: 0 }, ...Array.from(folderSet, ([path, depth]) => ({ path, depth }))];
    setData(files, folders);
  }

  function setData(files, folders) {
    files.sort((a, b) => collator.compare(a.folder, b.folder) || collator.compare(fullName(a), fullName(b)));
    folders.sort((a, b) => collator.compare(a.path, b.path));
    state.files = files;
    state.folders = folders;
    state.lastClicked = null;
    state.renderLimit = RENDER_STEP;

    // Keep the user's extension choices across refreshes; new types start selected.
    const keys = new Set(files.map(extKey));
    if (!state.extSelected) {
      state.extSelected = new Set(keys);
    } else {
      const prevAll = state.knownExts ? state.knownExts : new Set();
      for (const k of keys) if (!prevAll.has(k)) state.extSelected.add(k);
    }
    state.knownExts = keys;

    $('startScreen').hidden = true;
    $('workspace').hidden = false;
    $('folderName').textContent = state.rootName;
    $('rescanBtn').hidden = state.mode !== 'fs';
    $('deleteBtn').hidden = state.mode !== 'fs';
    $('selAllBtn').parentElement.querySelector('.spacer').hidden = state.mode !== 'fs';
    $('applyRenameBtn').textContent = state.mode === 'fs' ? 'Apply Rename' : 'Download renamed (ZIP)';
    refresh();
  }

  function showScanning(on) {
    $('scanning').hidden = !on;
    if (on) {
      $('startScreen').hidden = true;
      $('workspace').hidden = true;
      $('scanText').textContent = 'Reading folder…';
    }
  }

  // ---------- filtering ----------
  function inScope(f) {
    if (state.include === 'current') return f.folder === '';
    if (state.include === 'all') return true;
    for (const s of state.selectedFolders) {
      if (s === '' || f.folder === s || f.folder.startsWith(s + '/')) return true;
    }
    return false;
  }

  function computeVisible() {
    const terms = ['psFind', 'frFind', 'delFind']
      .map((id) => $(id).value.toLowerCase())
      .filter(Boolean);
    state.visible = state.files.filter((f) => {
      if (!inScope(f)) return false;
      if (!state.extSelected.has(extKey(f))) return false;
      const name = f.base.toLowerCase();
      return terms.every((t) => name.includes(t));
    });
  }

  function targets() {
    const checked = state.visible.filter((f) => f.checked);
    return checked.length ? checked : state.visible;
  }

  // ---------- validation ----------
  function validate() {
    state.errors.clear();
    const groups = new Map();
    for (const f of state.files) {
      const key = f.folder + '\u0000' + newFullName(f).toLowerCase();
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(f);
    }
    for (const f of state.files) {
      if (!isChanged(f)) continue;
      const name = newFullName(f);
      let err = '';
      if (!f.newBase.trim()) err = 'Name cannot be empty';
      else if (INVALID_CHARS.test(name)) err = 'Name cannot contain \\ / : * ? " < > |';
      else if (/[ .]$/.test(name)) err = 'Name cannot end with a space or a dot';
      else if (RESERVED.test(name)) err = 'This name is reserved by Windows';
      else if (name.length > 255) err = 'Name is too long';
      else if (groups.get(f.folder + '\u0000' + name.toLowerCase()).length > 1) err = 'Another file in this folder has the same name';
      if (err) state.errors.set(f.id, err);
    }
  }

  // ---------- rendering ----------
  function refresh() {
    computeVisible();
    validate();
    render();
  }

  function render() {
    const rows = state.visible.slice(0, state.renderLimit).map((f) => {
      const err = state.errors.get(f.id);
      const cls = [f.checked && 'checked', isChanged(f) && 'changed', err && 'error'].filter(Boolean).join(' ');
      return `<tr data-id="${f.id}" class="${cls}">
        <td class="sel"><input type="checkbox" data-act="check" ${f.checked ? 'checked' : ''} aria-label="Select ${esc(fullName(f))}"></td>
        <td class="name" data-act="edit">${esc(f.newBase)}<button class="edit-btn" data-act="edit" title="Edit name" aria-label="Edit name">✎</button>${err ? `<span class="err">${esc(err)}</span>` : ''}</td>
        <td class="ext">${esc(f.ext)}</td>
        <td class="orig">${esc(f.base)}</td>
        <td class="folder">${esc(folderLabel(f.folder))}</td>
      </tr>`;
    });
    $('rows').innerHTML = rows.join('');
    $('emptyMsg').hidden = state.visible.length > 0;
    const remaining = state.visible.length - state.renderLimit;
    $('moreWrap').hidden = remaining <= 0;
    if (remaining > 0) $('moreBtn').textContent = `Show more (${remaining} remaining)`;
    renderStatus();
  }

  function renderStatus() {
    const pending = state.files.filter(isChanged).length;
    const checked = state.visible.filter((f) => f.checked).length;
    const errors = state.errors.size;
    const filtering = ['psFind', 'frFind', 'delFind'].some((id) => $(id).value);
    const parts = [
      `<span>Files: <b>${state.files.length}</b></span>`,
      `<span>Shown: <b>${state.visible.length}</b></span>`,
      `<span>Selected: <b>${checked}</b></span>`,
      `<span class="pending">Pending renames: <b>${pending}</b></span>`,
    ];
    if (errors) parts.push(`<span class="errors">Problems: <b>${errors}</b></span>`);
    if (filtering) parts.push(`<button class="chip" id="clearFilters">Filtered by name · clear ✕</button>`);
    $('status').innerHTML = parts.join('');
    const clear = $('clearFilters');
    if (clear) clear.onclick = () => { ['psFind', 'frFind', 'delFind'].forEach((id) => { $(id).value = ''; }); refresh(); };

    $('applyRenameBtn').disabled = pending === 0 || state.busy;
    $('resetBtn').disabled = pending === 0 || state.busy;
    $('deleteBtn').disabled = checked === 0 || state.busy;
    $('undoBtn').hidden = !state.undo || state.mode !== 'fs';
    const head = $('headCheck');
    head.checked = state.visible.length > 0 && checked === state.visible.length;
    head.indeterminate = checked > 0 && checked < state.visible.length;
    updateExtLabel();
  }

  function updateExtLabel() {
    const keys = scopeExtCounts();
    const total = keys.size;
    const sel = [...keys.keys()].filter((k) => state.extSelected.has(k)).length;
    $('extLabel').textContent = total === 0 ? 'none' : sel === total ? 'All' : `${sel} of ${total}`;
  }

  function scopeExtCounts() {
    const counts = new Map();
    for (const f of state.files) {
      if (!inScope(f)) continue;
      const k = extKey(f);
      counts.set(k, (counts.get(k) || 0) + 1);
    }
    return new Map([...counts].sort((a, b) => collator.compare(a[0], b[0])));
  }

  // ---------- table interactions ----------
  function fileById(id) {
    return state.files.find((f) => f.id === id);
  }

  $('rows').addEventListener('click', (e) => {
    const tr = e.target.closest('tr');
    if (!tr) return;
    const f = fileById(Number(tr.dataset.id));
    const act = e.target.dataset.act;
    if (act === 'check') {
      const idx = state.visible.indexOf(f);
      const value = e.target.checked;
      if (e.shiftKey && state.lastClicked !== null) {
        const [a, b] = [Math.min(idx, state.lastClicked), Math.max(idx, state.lastClicked)];
        for (let i = a; i <= b; i++) state.visible[i].checked = value;
      } else {
        f.checked = value;
      }
      state.lastClicked = idx;
      render();
    } else if (act === 'edit' && e.target.classList.contains('edit-btn')) {
      startEdit(tr, f);
    }
  });

  $('rows').addEventListener('dblclick', (e) => {
    const td = e.target.closest('td.name');
    if (td) startEdit(td.parentElement, fileById(Number(td.parentElement.dataset.id)));
  });

  function startEdit(tr, f) {
    const td = tr.querySelector('td.name');
    if (td.querySelector('input')) return;
    td.innerHTML = '';
    const input = document.createElement('input');
    input.type = 'text';
    input.value = f.newBase;
    td.appendChild(input);
    input.focus();
    input.select();
    let done = false;
    const finish = (save) => {
      if (done) return;
      done = true;
      if (save) f.newBase = input.value;
      validate();
      render();
    };
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') finish(true);
      if (e.key === 'Escape') finish(false);
    });
    input.addEventListener('blur', () => finish(true));
  }

  $('headCheck').addEventListener('change', (e) => {
    state.visible.forEach((f) => { f.checked = e.target.checked; });
    render();
  });
  $('selAllBtn').onclick = () => { state.visible.forEach((f) => { f.checked = true; }); render(); };
  $('unselAllBtn').onclick = () => { state.files.forEach((f) => { f.checked = false; }); render(); };
  $('moreBtn').onclick = () => { state.renderLimit += RENDER_STEP * 2; render(); };

  ['psFind', 'frFind', 'delFind'].forEach((id) => {
    $(id).addEventListener('input', () => { state.renderLimit = RENDER_STEP; state.lastClicked = null; refresh(); });
  });

  // ---------- rename operations (preview only) ----------
  $('applyPsBtn').onclick = () => {
    const prefix = $('prefix').value;
    const suffix = $('suffix').value;
    if (!prefix && !suffix) { toast('Type a prefix or a suffix first.'); return; }
    const list = targets();
    if (!list.length) { toast('No files to update.'); return; }
    list.forEach((f) => { f.newBase = prefix + f.newBase + suffix; });
    refresh();
    toast(`Updated ${list.length} name(s) in the preview. Click “Apply Rename” to save.`);
  };

  $('applyFrBtn').onclick = () => {
    const find = $('frFind').value;
    const repl = $('frReplace').value;
    if (!find) { toast('Type the text to find first.'); return; }
    const re = new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $('frCase').checked ? 'g' : 'gi');
    let count = 0;
    for (const f of targets()) {
      const next = f.newBase.replace(re, () => repl);
      if (next !== f.newBase) { f.newBase = next; count++; }
    }
    // Clear the Find box so the renamed rows stay visible after replacing.
    $('frFind').value = '';
    refresh();
    toast(count ? `Updated ${count} name(s) in the preview. Click “Apply Rename” to save.` : `No names contain “${find}”.`);
  };

  $('resetBtn').onclick = () => {
    state.files.forEach((f) => { f.newBase = f.base; });
    refresh();
  };

  // ---------- apply rename (disk) ----------
  $('applyRenameBtn').onclick = async () => {
    validate();
    const changed = state.files.filter(isChanged);
    const ok = changed.filter((f) => !state.errors.has(f.id));
    const bad = changed.length - ok.length;
    if (!ok.length) {
      render();
      toast('Fix the names marked in red first.', 'error');
      return;
    }
    if (state.mode === 'zip') { await downloadZip(); return; }

    const sample = ok.slice(0, 40).map((f) =>
      `<li><span class="from">${esc(fullName(f))}</span><span class="arrow">→</span>${esc(newFullName(f))}</li>`).join('');
    const confirmed = await dialog({
      title: `Rename ${ok.length} file(s)?`,
      html: `${bad ? `<p><b>${bad}</b> file(s) with problems will be skipped.</p>` : ''}
        <ul class="preview-list">${sample}</ul>
        ${ok.length > 40 ? `<p style="margin-top:8px">…and ${ok.length - 40} more.</p>` : ''}`,
      okText: 'Rename files',
      okClass: 'success',
    });
    if (!confirmed) return;
    const done = await renameOnDisk(ok);
    if (done.length) state.undo = done;
    renderStatus();
  };

  $('undoBtn').onclick = async () => {
    if (!state.undo) return;
    const items = state.undo.map((u) => ({ f: fileById(u.id), prevBase: u.prevBase })).filter((u) => u.f);
    const confirmed = await dialog({
      title: 'Undo last rename?',
      html: `<p>${items.length} file(s) will get their previous names back.</p>`,
      okText: 'Undo',
    });
    if (!confirmed) return;
    state.files.forEach((f) => { f.newBase = f.base; });
    items.forEach(({ f, prevBase }) => { f.newBase = prevBase; });
    validate();
    const list = items.map((u) => u.f).filter((f) => !state.errors.has(f.id));
    await renameOnDisk(list);
    state.undo = null;
    render();
  };

  async function ensureWritePermission() {
    const opts = { mode: 'readwrite' };
    if (!state.rootHandle.queryPermission) return true;
    if ((await state.rootHandle.queryPermission(opts)) === 'granted') return true;
    return (await state.rootHandle.requestPermission(opts)) === 'granted';
  }

  async function exists(dir, name) {
    try { await dir.getFileHandle(name); return true; } catch { return false; }
  }

  async function moveTo(f, name) {
    if (await exists(f.dirHandle, name)) throw new Error(`“${name}” already exists in this folder`);
    if (typeof f.handle.move === 'function') {
      try {
        await f.handle.move(name);
        return;
      } catch (e) {
        if (e.name !== 'NotSupportedError' && e.name !== 'TypeError' && e.name !== 'InvalidModificationError') throw e;
      }
    }
    // Older browsers: copy to the new name, then remove the old file.
    const oldName = f.handle.name;
    const src = await f.handle.getFile();
    const nh = await f.dirHandle.getFileHandle(name, { create: true });
    const w = await nh.createWritable();
    await w.write(src);
    await w.close();
    await f.dirHandle.removeEntry(oldName);
    f.handle = nh;
  }

  async function renameOnDisk(list) {
    if (!(await ensureWritePermission())) {
      toast('Permission to edit the folder was not given.', 'error');
      return [];
    }
    state.busy = true;
    renderStatus();
    $('applyRenameBtn').textContent = 'Renaming…';

    // Names currently on disk, per folder (lower case for Windows).
    const occupied = new Map();
    for (const f of state.files) {
      if (!occupied.has(f.folder)) occupied.set(f.folder, new Set());
      occupied.get(f.folder).add(fullName(f).toLowerCase());
    }
    const direct = [];
    const viaTemp = [];
    for (const f of list) {
      const target = newFullName(f).toLowerCase();
      (occupied.get(f.folder).has(target) ? viaTemp : direct).push(f);
    }

    const done = [];
    const failed = [];
    const stamp = Date.now().toString(36);
    const temps = new Map();

    // Files whose new name is taken by another file in this batch (e.g. swapping names,
    // or changing only upper/lower case) go through a temporary name first.
    for (const [i, f] of viaTemp.entries()) {
      const tmp = `~fm-${stamp}-${i}${f.ext}`;
      try { await moveTo(f, tmp); temps.set(f.id, tmp); } catch (e) { failed.push([f, e.message]); }
    }
    for (const f of direct) {
      try {
        await moveTo(f, newFullName(f));
        done.push({ id: f.id, prevBase: f.base });
        f.base = f.newBase;
      } catch (e) { failed.push([f, e.message]); }
    }
    for (const f of viaTemp) {
      if (!temps.has(f.id)) continue;
      try {
        await moveTo(f, newFullName(f));
        done.push({ id: f.id, prevBase: f.base });
        f.base = f.newBase;
      } catch (e) {
        failed.push([f, e.message]);
        try { await moveTo(f, fullName(f)); } catch { /* left on its temporary name */ }
      }
    }

    state.busy = false;
    $('applyRenameBtn').textContent = 'Apply Rename';
    refresh();

    if (done.length) toast(`Renamed ${done.length} file(s).`, 'success');
    if (failed.length) {
      const items = failed.slice(0, 30).map(([f, msg]) => `<li>${esc(fullName(f))}<br><small>${esc(msg)}</small></li>`).join('');
      await dialog({
        title: `${failed.length} file(s) could not be renamed`,
        html: `<p>The file may be open in another program, or the folder is read-only.</p><ul class="preview-list">${items}</ul>`,
        cancel: false,
      });
    }
    return done;
  }

  // ---------- ZIP fallback ----------
  async function downloadZip() {
    const list = state.files.filter((f) => inScope(f) && state.extSelected.has(extKey(f)));
    const changed = list.filter(isChanged).length;
    const confirmed = await dialog({
      title: 'Download renamed files',
      html: `<p>Your browser can't rename files in place, so a ZIP will be created with <b>${list.length}</b> file(s)
        (${changed} with new names), keeping the same folder structure.</p>
        <p>For direct renaming, use Google Chrome or Microsoft Edge on a computer.</p>`,
      okText: 'Create ZIP',
    });
    if (!confirmed) return;
    state.busy = true;
    renderStatus();
    try {
      if (!window.JSZip) await loadScript(JSZIP_URL);
      const zip = new window.JSZip();
      const root = zip.folder(state.rootName);
      for (const f of list) {
        const name = state.errors.has(f.id) ? fullName(f) : newFullName(f);
        root.file(f.folder ? f.folder + '/' + name : name, f.file);
      }
      const blob = await zip.generateAsync({ type: 'blob' });
      downloadBlob(blob, `${state.rootName}-renamed.zip`);
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      state.busy = false;
      renderStatus();
    }
  }

  // ---------- delete ----------
  $('deleteBtn').onclick = async () => {
    const list = state.visible.filter((f) => f.checked);
    if (!list.length) return;
    const sample = list.slice(0, 40).map((f) => `<li>${esc(folderLabel(f.folder))}/${esc(fullName(f))}</li>`).join('');
    const confirmed = await dialog({
      title: `Delete ${list.length} file(s)?`,
      html: `<p><b style="color:var(--danger)">Files are deleted permanently. They do not go to the Recycle Bin, and this cannot be undone.</b></p>
        <ul class="preview-list">${sample}</ul>${list.length > 40 ? `<p>…and ${list.length - 40} more.</p>` : ''}`,
      okText: 'Delete permanently',
      okClass: 'danger-solid',
    });
    if (!confirmed) return;
    if (!(await ensureWritePermission())) { toast('Permission to edit the folder was not given.', 'error'); return; }
    const removed = new Set();
    const failed = [];
    for (const f of list) {
      try { await f.dirHandle.removeEntry(f.handle.name); removed.add(f.id); } catch (e) { failed.push(fullName(f) + ': ' + e.message); }
    }
    state.files = state.files.filter((f) => !removed.has(f.id));
    state.undo = null;
    refresh();
    if (removed.size) toast(`Deleted ${removed.size} file(s).`, 'success');
    if (failed.length) toast(`Could not delete ${failed.length} file(s). ${failed[0]}`, 'error');
  };

  // ---------- export to Excel ----------
  function safeSheetName(name, used) {
    let base = name.replace(/[\\/]/g, '_').replace(/[\[\]:*?]/g, '').slice(0, 31) || 'Sheet';
    let candidate = base;
    let n = 2;
    while (used.has(candidate.toLowerCase())) {
      const tag = ` (${n++})`;
      candidate = base.slice(0, 31 - tag.length) + tag;
    }
    used.add(candidate.toLowerCase());
    return candidate;
  }

  async function fileInfo(f) {
    try {
      const file = f.file || (await f.handle.getFile());
      // Excel has no time zones: shift so the sheet shows the local time Windows shows.
      const local = file.lastModified - new Date(file.lastModified).getTimezoneOffset() * 60000;
      return { date: new Date(local), size: file.size };
    } catch {
      return { date: null, size: null };
    }
  }

  $('exportBtn').onclick = async () => {
    const list = state.visible;
    if (!list.length) { toast('No files to export.'); return; }
    const btn = $('exportBtn');
    btn.disabled = true;
    btn.textContent = 'Preparing…';
    try {
      if (!window.ExcelJS) await loadScript(EXCELJS_URL);
      const infos = await Promise.all(list.map(fileInfo));
      const exts = [...new Set(list.map(extKey))].sort(collator.compare);
      const byFolder = new Map();
      list.forEach((f, i) => {
        if (!byFolder.has(f.folder)) byFolder.set(f.folder, []);
        byFolder.get(f.folder).push([f, infos[i]]);
      });

      const wb = new window.ExcelJS.Workbook();
      const styleHeader = (ws) => {
        ws.getRow(1).eachCell((c) => {
          c.font = { bold: true, color: { argb: 'FFFFFFFF' } };
          c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F81BD' } };
        });
        ws.views = [{ state: 'frozen', ySplit: 1 }];
      };

      const summary = wb.addWorksheet('Summary');
      summary.columns = [
        { header: 'Folder', key: 'folder', width: 40 },
        ...exts.map((e) => ({ header: e || '(none)', key: 'x' + e, width: 10 })),
        { header: 'Total', key: 'total', width: 10 },
      ];
      const totals = { folder: 'Total', total: 0 };
      exts.forEach((e) => { totals['x' + e] = 0; });
      for (const [folder, items] of byFolder) {
        const row = { folder: folderLabel(folder), total: items.length };
        exts.forEach((e) => { row['x' + e] = 0; });
        items.forEach(([f]) => { row['x' + extKey(f)]++; totals['x' + extKey(f)]++; });
        totals.total += items.length;
        summary.addRow(row);
      }
      summary.addRow(totals).font = { bold: true };
      styleHeader(summary);

      const used = new Set(['summary']);
      for (const [folder, items] of byFolder) {
        const ws = wb.addWorksheet(safeSheetName(folderLabel(folder), used));
        ws.columns = [
          { header: 'File Name', key: 'name', width: 40 },
          { header: 'Extension', key: 'ext', width: 11 },
          { header: 'Path', key: 'path', width: 60 },
          { header: 'Date Modified', key: 'date', width: 20, style: { numFmt: 'yyyy-mm-dd hh:mm:ss' } },
          { header: 'Size (KB)', key: 'size', width: 11, style: { numFmt: '#,##0.0' } },
        ];
        for (const [f, info] of items) {
          ws.addRow({
            name: f.base,
            ext: f.ext,
            path: folderLabel(f.folder) + '/' + fullName(f),
            date: info.date,
            size: info.size === null ? null : info.size / 1024,
          });
        }
        styleHeader(ws);
      }

      const buf = await wb.xlsx.writeBuffer();
      downloadBlob(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `${state.rootName}-files.xlsx`);
      toast('Excel file downloaded.', 'success');
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Export to Excel';
    }
  };

  // ---------- folder scope & file types ----------
  $('includeMode').addEventListener('change', async (e) => {
    const value = e.target.value;
    if (value === 'select') {
      const chosen = await chooseSubfolders();
      if (!chosen) { e.target.value = state.include; return; }
      state.selectedFolders = chosen;
    }
    state.include = value;
    state.renderLimit = RENDER_STEP;
    refresh();
  });

  async function chooseSubfolders() {
    if (state.folders.length <= 1) {
      toast('This folder has no subfolders.');
      return null;
    }
    const items = state.folders.map((fd) => {
      const name = fd.path ? fd.path.split('/').pop() : `${state.rootName} (everything)`;
      const checked = state.selectedFolders.has(fd.path) ? 'checked' : '';
      return `<label style="padding-left:${fd.depth * 20}px"><input type="checkbox" value="${esc(fd.path)}" ${checked}> ${esc(name)}</label>`;
    }).join('');
    const ok = await dialog({
      title: 'Select subfolders',
      html: `<p>Files in the checked folders (and the folders inside them) will be shown.</p><div class="folder-tree" id="folderTree">${items}</div>`,
      okText: 'Confirm',
    });
    if (!ok) return null;
    const chosen = new Set([...document.querySelectorAll('#folderTree input:checked')].map((i) => i.value));
    if (!chosen.size) { toast('No folders were selected.'); return null; }
    return chosen;
  }

  $('extBtn').addEventListener('click', (e) => {
    e.stopPropagation();
    const pop = $('extPopover');
    if (!pop.hidden) { pop.hidden = true; return; }
    const counts = scopeExtCounts();
    const allOn = [...counts.keys()].every((k) => state.extSelected.has(k));
    pop.innerHTML = `<label><input type="checkbox" data-ext="*" ${allOn ? 'checked' : ''}> <b>All</b></label><hr>` +
      [...counts].map(([k, n]) => `<label><input type="checkbox" data-ext="${esc(k)}" ${state.extSelected.has(k) ? 'checked' : ''}> ${esc(k || '(no extension)')}<span class="count">${n}</span></label>`).join('');
    pop.hidden = false;
  });

  $('extPopover').addEventListener('click', (e) => e.stopPropagation());
  $('extPopover').addEventListener('change', (e) => {
    const key = e.target.dataset.ext;
    if (key === '*') {
      const keys = [...scopeExtCounts().keys()];
      keys.forEach((k) => (e.target.checked ? state.extSelected.add(k) : state.extSelected.delete(k)));
      $('extPopover').querySelectorAll('input').forEach((i) => { i.checked = e.target.checked; });
    } else {
      e.target.checked ? state.extSelected.add(key) : state.extSelected.delete(key);
      const boxes = [...$('extPopover').querySelectorAll('input:not([data-ext="*"])')];
      $('extPopover').querySelector('[data-ext="*"]').checked = boxes.every((b) => b.checked);
    }
    state.renderLimit = RENDER_STEP;
    refresh();
  });
  document.addEventListener('click', () => { $('extPopover').hidden = true; });

  // ---------- start / change folder ----------
  async function confirmDiscard() {
    if (!state.files.some(isChanged)) return true;
    return dialog({
      title: 'Discard pending changes?',
      html: '<p>You have new names that were not applied yet.</p>',
      okText: 'Discard',
      okClass: 'danger-solid',
    });
  }

  $('pickBtn').onclick = pickFolder;
  $('changeFolderBtn').onclick = async () => { if (await confirmDiscard()) pickFolder(); };
  $('rescanBtn').onclick = async () => {
    if (state.rootHandle && (await confirmDiscard())) await loadDirectoryHandle(state.rootHandle);
  };
  $('folderInput').addEventListener('change', (e) => loadFromFileList(e.target.files));

  window.addEventListener('beforeunload', (e) => {
    if (state.files.some(isChanged)) { e.preventDefault(); e.returnValue = ''; }
  });

  if (!canDirectAccess) {
    $('fallbackNotice').hidden = false;
    $('startHint').textContent = 'Your browser will ask you to confirm access to the folder’s files.';
  }

  // Lets automated tests feed in a directory handle (e.g. from the origin-private file system).
  window.__fmLoadDirectoryHandle = loadDirectoryHandle;
})();
