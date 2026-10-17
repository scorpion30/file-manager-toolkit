/* Organize Files: move or copy files into folders by type or keyword. */
(() => {
  'use strict';
  const { $, esc, collator, toast } = FM;
  const RENDER_STEP = 500;

  const state = {
    source: null,
    rootName: '',
    files: [],
    folders: [],
    include: 'current',
    selectedFolders: new Set(),
    extSelected: new Set(),
    knownExts: new Set(),
    visible: [],
    renderLimit: RENDER_STEP,
    destHandle: null,
    busy: false,
  };

  const extKey = (f) => f.ext.toLowerCase();
  const folderLabel = (path) => (path ? state.rootName + '/' + path : state.rootName);
  const destMode = () => document.querySelector('input[name="dest"]:checked').value;
  const action = () => document.querySelector('input[name="action"]:checked').value;
  const INVALID = /[\\/:*?"<>|\x00-\x1f]/;

  function targetFolderFor(f) {
    const custom = $('targetName').value.trim();
    if (custom) return custom;
    return f.ext ? f.ext.slice(1).toUpperCase() : 'NO_EXTENSION';
  }

  function destBaseLabel() {
    if (destMode() === 'other') return state.destHandle ? state.destHandle.name : '(choose a folder)';
    return state.rootName;
  }

  // ---------- loading ----------
  async function load(source) {
    state.source = source;
    $('startScreen').hidden = true;
    $('workspace').hidden = true;
    $('scanning').hidden = false;
    $('scanText').textContent = 'Reading folder…';
    try {
      const listing = source.mode === 'fs'
        ? await FM.scanDirectory(source.handle, (n) => { $('scanText').textContent = `Reading folder… ${n} files`; })
        : FM.scanFileList(source.fileList);
      Object.assign(state, { rootName: listing.rootName, files: listing.files, folders: listing.folders });
    } catch (e) {
      toast(e.message, 'error');
      $('startScreen').hidden = false;
      return;
    } finally {
      $('scanning').hidden = true;
    }
    const keys = new Set(state.files.map(extKey));
    for (const k of keys) if (!state.knownExts.has(k)) state.extSelected.add(k);
    state.knownExts = keys;
    state.renderLimit = RENDER_STEP;
    $('workspace').hidden = false;
    $('folderName').textContent = state.rootName;
    $('rescanBtn').hidden = source.mode !== 'fs';
    refresh();
  }

  // ---------- view ----------
  function refresh() {
    const keywords = $('keywords').value.split(',').map((k) => k.trim().toLowerCase()).filter(Boolean);
    state.visible = state.files.filter((f) =>
      FM.inScope(f.folder, state.include, state.selectedFolders) &&
      state.extSelected.has(extKey(f)) &&
      keywords.every((k) => f.name.toLowerCase().includes(k)));
    render();
  }

  function render() {
    const base = destBaseLabel();
    $('rows').innerHTML = state.visible.slice(0, state.renderLimit).map((f) => `<tr>
      <td class="name">${esc(f.name)}</td>
      <td class="folder">${esc(folderLabel(f.folder))}</td>
      <td class="folder">${esc(base + '/' + targetFolderFor(f))}</td>
    </tr>`).join('');
    $('emptyMsg').hidden = state.visible.length > 0;
    const remaining = state.visible.length - state.renderLimit;
    $('moreWrap').hidden = remaining <= 0;
    if (remaining > 0) $('moreBtn').textContent = `Show more (${remaining} remaining)`;
    const targets = new Set(state.visible.map(targetFolderFor)).size;
    $('status').innerHTML = `<span>Files to ${action()}: <b>${state.visible.length}</b></span><span>Into folders: <b>${targets}</b></span>`;
    $('startBtn').disabled = !state.visible.length || state.busy;
    $('startBtn').textContent = state.source && state.source.mode !== 'fs' ? 'Download organized (ZIP)' : 'Start Organizing';
    $('destName').textContent = state.destHandle ? state.destHandle.name : '';
    extFilter.update();
  }

  function scopeExtCounts() {
    const counts = new Map();
    for (const f of state.files) {
      if (!FM.inScope(f.folder, state.include, state.selectedFolders)) continue;
      counts.set(extKey(f), (counts.get(extKey(f)) || 0) + 1);
    }
    return new Map([...counts].sort((a, b) => collator.compare(a[0], b[0])));
  }

  const extFilter = FM.extensionFilter({
    button: $('extBtn'),
    popover: $('extPopover'),
    label: $('extLabel'),
    getCounts: scopeExtCounts,
    selected: state.extSelected,
    onChange: () => { state.renderLimit = RENDER_STEP; refresh(); },
  });

  // ---------- run ----------
  async function exists(dir, name) {
    try { await dir.getFileHandle(name); return true; } catch { return false; }
  }

  /** Picks "name.ext", then "name_1.ext", "name_2.ext"… like the desktop app. */
  async function freeName(dir, f, taken) {
    let candidate = f.name;
    let n = 1;
    while (taken.has(candidate.toLowerCase()) || (await exists(dir, candidate))) {
      candidate = `${f.base}_${n++}${f.ext}`;
    }
    taken.add(candidate.toLowerCase());
    return candidate;
  }

  async function copyInto(f, dir, name) {
    const src = await f.handle.getFile();
    const nh = await dir.getFileHandle(name, { create: true });
    const w = await nh.createWritable();
    await w.write(src);
    await w.close();
    return nh;
  }

  async function moveInto(f, dir, name) {
    if (typeof f.handle.move === 'function') {
      try {
        await f.handle.move(dir, name);
        return;
      } catch (e) {
        if (!['NotSupportedError', 'TypeError', 'InvalidModificationError'].includes(e.name)) throw e;
      }
    }
    await copyInto(f, dir, name);
    await f.dirHandle.removeEntry(f.handle.name);
  }

  $('startBtn').onclick = async () => {
    const list = state.visible.slice();
    if (!list.length) return;
    const custom = $('targetName').value.trim();
    if (custom && (INVALID.test(custom) || /[ .]$/.test(custom))) {
      toast('The folder name cannot contain \\ / : * ? " < > | or end with a space or dot.', 'error');
      return;
    }
    if (state.source.mode !== 'fs') { await downloadZip(list); return; }
    if (destMode() === 'other' && !state.destHandle) { toast('Choose the destination folder first.'); return; }

    const verb = action() === 'move' ? 'Move' : 'Copy';
    const groups = new Map();
    list.forEach((f) => groups.set(targetFolderFor(f), (groups.get(targetFolderFor(f)) || 0) + 1));
    const ok = await FM.dialog({
      title: `${verb} ${list.length} file(s)?`,
      html: `<p>Into <b>${esc(destBaseLabel())}</b>:</p><ul class="preview-list">${[...groups]
        .map(([g, n]) => `<li>📁 ${esc(g)} <span class="from">— ${n} file(s)</span></li>`).join('')}</ul>`,
      okText: verb + ' files',
      okClass: 'success',
    });
    if (!ok) return;

    const destBase = destMode() === 'other' ? state.destHandle : state.source.handle;
    if (!(await FM.ensurePermission(destBase)) || !(await FM.ensurePermission(state.source.handle))) {
      toast('Permission to edit the folder was not given.', 'error');
      return;
    }

    state.busy = true;
    render();
    const btn = $('startBtn');
    const done = [];
    const failed = [];
    const dirCache = new Map();
    const takenByDir = new Map();
    for (const [i, f] of list.entries()) {
      btn.textContent = `${verb === 'Move' ? 'Moving' : 'Copying'}… ${i + 1}/${list.length}`;
      try {
        const folderName = targetFolderFor(f);
        if (!dirCache.has(folderName)) {
          dirCache.set(folderName, await destBase.getDirectoryHandle(folderName, { create: true }));
          takenByDir.set(folderName, new Set());
        }
        const dir = dirCache.get(folderName);
        if (await dir.isSameEntry(f.dirHandle)) continue; // already in the right folder
        const name = await freeName(dir, f, takenByDir.get(folderName));
        if (action() === 'move') await moveInto(f, dir, name);
        else await copyInto(f, dir, name);
        done.push([folderLabel(f.folder) + '/' + f.name, destBase.name + '/' + folderName + '/' + name]);
      } catch (e) {
        failed.push([f.name, e.message]);
      }
    }

    let logName = '';
    if (done.length && $('saveLog').checked) {
      try {
        const now = new Date();
        const pad = (n) => String(n).padStart(2, '0');
        const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
        logName = `file_log_${stamp}.txt`;
        const text = [
          `Action: ${action() === 'move' ? 'Moved' : 'Copied'}`,
          `Date: ${now.toLocaleString()}`,
          `Source Folder: ${state.rootName}`,
          `Destination: ${destBase.name}`,
          `Selected Extensions: ${[...new Set(list.map(extKey))].sort().join(', ')}`,
          '',
          ...done.map(([a, b]) => `${a} -> ${b}`),
        ].join('\r\n');
        const h = await destBase.getFileHandle(logName, { create: true });
        const w = await h.createWritable();
        await w.write(text);
        await w.close();
      } catch { logName = ''; }
    }

    state.busy = false;
    await FM.dialog({
      title: failed.length ? 'Finished with some problems' : 'Done',
      html: `<p>${action() === 'move' ? 'Moved' : 'Copied'} <b>${done.length}</b> file(s).${logName ? ` Log saved as <b>${esc(logName)}</b>.` : ''}</p>` +
        (list.length - done.length - failed.length ? `<p>${list.length - done.length - failed.length} file(s) were already in the right folder.</p>` : '') +
        (failed.length ? `<p>${failed.length} file(s) failed:</p><ul class="preview-list">${failed.slice(0, 30)
          .map(([n, m]) => `<li>${esc(n)}<br><small>${esc(m)}</small></li>`).join('')}</ul>` : ''),
      cancel: false,
    });
    await load(state.source);
  };

  async function downloadZip(list) {
    const ok = await FM.dialog({
      title: 'Download organized files',
      html: `<p>Your browser can't move files on your computer, so a ZIP will be created with <b>${list.length}</b> file(s) sorted into folders.</p>`,
      okText: 'Create ZIP',
    });
    if (!ok) return;
    state.busy = true;
    render();
    try {
      const JSZip = await FM.jszip();
      const zip = new JSZip();
      const taken = new Map();
      for (const f of list) {
        const folder = targetFolderFor(f);
        if (!taken.has(folder)) taken.set(folder, new Set());
        const used = taken.get(folder);
        let name = f.name;
        let n = 1;
        while (used.has(name.toLowerCase())) name = `${f.base}_${n++}${f.ext}`;
        used.add(name.toLowerCase());
        zip.file(folder + '/' + name, f.file);
      }
      FM.downloadBlob(await zip.generateAsync({ type: 'blob' }), `${state.rootName}-organized.zip`);
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      state.busy = false;
      render();
    }
  }

  // ---------- controls ----------
  $('includeMode').addEventListener('change', async (e) => {
    if (e.target.value === 'select') {
      if (state.folders.length <= 1) { toast('This folder has no subfolders.'); e.target.value = state.include; return; }
      const chosen = await FM.chooseFolders(state.folders, state.rootName, state.selectedFolders);
      if (!chosen) { e.target.value = state.include; return; }
      state.selectedFolders = chosen;
    }
    state.include = e.target.value;
    state.renderLimit = RENDER_STEP;
    refresh();
  });
  $('keywords').addEventListener('input', refresh);
  $('targetName').addEventListener('input', render);
  document.querySelectorAll('input[name="dest"], input[name="action"]').forEach((r) => r.addEventListener('change', render));
  $('moreBtn').onclick = () => { state.renderLimit += RENDER_STEP * 2; render(); };

  $('destBtn').onclick = async () => {
    if (!FM.canDirectAccess) { toast('Choosing another folder needs Chrome or Edge.'); return; }
    try {
      state.destHandle = await window.showDirectoryPicker({ id: 'organize-dest', mode: 'readwrite' });
      document.querySelector('input[name="dest"][value="other"]').checked = true;
      render();
    } catch (e) {
      if (e.name !== 'AbortError') toast(e.message, 'error');
    }
  };

  const pick = async () => {
    try {
      const source = await FM.pickFolder({ write: true, id: 'organize' });
      if (source) await load(source);
    } catch (e) { toast(e.message, 'error'); }
  };
  $('pickBtn').onclick = pick;
  $('changeFolderBtn').onclick = pick;
  $('rescanBtn').onclick = () => state.source && load(state.source);

  if (!FM.canDirectAccess) {
    $('fallbackNotice').hidden = false;
    $('destBtn').disabled = true;
  }

  window.__fmLoadDirectoryHandle = (handle) => load({ mode: 'fs', handle });
  window.__fmSetDestination = (handle) => { state.destHandle = handle; document.querySelector('input[name="dest"][value="other"]').checked = true; render(); };
})();
