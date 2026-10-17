/* Files to Excel: list every file in a folder tree and export it. */
(() => {
  'use strict';
  const { $, esc, collator, toast, formatBytes } = FM;
  const RENDER_STEP = 500;

  const state = {
    source: null,          // {mode:'fs', handle} | {mode:'input', fileList}
    rootName: '',
    files: [],             // {name, base, ext, folder, handle|file, size, modified}
    folders: [],
    include: 'all',
    selectedFolders: new Set(),
    extSelected: new Set(),
    knownExts: new Set(),
    visible: [],
    renderLimit: RENDER_STEP,
    infoReady: false,
  };

  const extKey = (f) => f.ext.toLowerCase();
  const folderLabel = (path) => (path ? state.rootName + '/' + path : state.rootName);

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
      state.rootName = listing.rootName;
      state.files = listing.files;
      state.folders = listing.folders;
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
    state.infoReady = false;

    $('workspace').hidden = false;
    $('folderName').textContent = state.rootName;
    $('rescanBtn').hidden = source.mode !== 'fs';
    refresh();
    loadInfo();
  }

  /** Reads size and date for every file in the background (needed for the table and Excel). */
  async function loadInfo() {
    const files = state.files;
    let i = 0;
    const worker = async () => {
      while (i < files.length) {
        const f = files[i++];
        try {
          const file = await FM.fileOf(f);
          f.size = file.size;
          f.modified = file.lastModified;
        } catch { f.size = null; f.modified = null; }
      }
    };
    await Promise.all(Array.from({ length: 8 }, worker));
    if (files !== state.files) return; // a different folder was loaded meanwhile
    state.infoReady = true;
    render();
  }

  // ---------- view ----------
  function refresh() {
    const term = $('nameFind').value.toLowerCase();
    state.visible = state.files.filter((f) =>
      FM.inScope(f.folder, state.include, state.selectedFolders) &&
      state.extSelected.has(extKey(f)) &&
      (!term || f.name.toLowerCase().includes(term)));
    render();
  }

  function render() {
    $('rows').innerHTML = state.visible.slice(0, state.renderLimit).map((f) => `<tr>
      <td class="name">${esc(f.base)}</td>
      <td class="ext">${esc(f.ext)}</td>
      <td class="folder">${esc(folderLabel(f.folder))}</td>
      <td class="ext">${f.size == null ? '' : formatBytes(f.size)}</td>
      <td class="orig">${f.modified ? new Date(f.modified).toLocaleString() : ''}</td>
    </tr>`).join('');
    $('emptyMsg').hidden = state.visible.length > 0;
    const remaining = state.visible.length - state.renderLimit;
    $('moreWrap').hidden = remaining <= 0;
    if (remaining > 0) $('moreBtn').textContent = `Show more (${remaining} remaining)`;

    const folders = new Set(state.visible.map((f) => f.folder)).size;
    const total = state.visible.reduce((s, f) => s + (f.size || 0), 0);
    $('status').innerHTML = [
      `<span>Files: <b>${state.visible.length}</b> of ${state.files.length}</span>`,
      `<span>Folders: <b>${folders}</b></span>`,
      state.infoReady ? `<span>Total size: <b>${formatBytes(total)}</b></span>` : '<span>Reading sizes…</span>',
    ].join('');
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

  // ---------- export ----------
  function fullPath(f) {
    const prefix = $('pathPrefix').value.trim().replace(/[\\/]+$/, '');
    const rel = [state.rootName, f.folder, f.name].filter(Boolean).join('/');
    if (!prefix) return rel;
    const sep = prefix.includes('\\') || /^[a-z]:$/i.test(prefix) ? '\\' : '/';
    return prefix + sep + rel.split('/').join(sep);
  }

  $('exportBtn').onclick = async () => {
    const list = state.visible;
    if (!list.length) { toast('No files to export.'); return; }
    const wantSummary = $('optSummary').checked;
    const wantAll = $('optAll').checked;
    const splitBy = $('splitBy').value;
    if (!wantSummary && !wantAll && splitBy === 'none') { toast('Choose at least one kind of sheet.'); return; }

    const btn = $('exportBtn');
    btn.disabled = true;
    btn.textContent = 'Preparing…';
    try {
      const ExcelJS = await FM.excel();
      if (!state.infoReady) {
        btn.textContent = 'Reading file details…';
        while (!state.infoReady) await new Promise((r) => setTimeout(r, 200));
      }
      const wb = new ExcelJS.Workbook();
      const used = new Set();
      const columns = [
        { header: 'File Name', key: 'name', width: 42 },
        { header: 'Extension', key: 'ext', width: 11 },
        { header: 'Folder', key: 'folder', width: 40 },
      ];
      if ($('colPath').checked) columns.push({ header: 'Path', key: 'path', width: 70 });
      if ($('colSize').checked) columns.push({ header: 'Size (KB)', key: 'size', width: 12, style: { numFmt: '#,##0.0' } });
      if ($('colDate').checked) columns.push({ header: 'Date Modified', key: 'date', width: 20, style: { numFmt: 'yyyy-mm-dd hh:mm:ss' } });

      const rowOf = (f) => ({
        name: f.base,
        ext: f.ext,
        folder: folderLabel(f.folder),
        path: fullPath(f),
        size: f.size == null ? null : f.size / 1024,
        date: FM.excelDate(f.modified),
      });
      const addListSheet = (title, files) => {
        const ws = wb.addWorksheet(FM.safeSheetName(title, used));
        ws.columns = columns.map((c) => ({ ...c }));
        files.forEach((f) => ws.addRow(rowOf(f)));
        FM.styleHeaderRow(ws);
        ws.views = [{ state: 'frozen', ySplit: 1 }];
        ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: columns.length } };
        return ws.name;
      };

      const groupBy = (keyFn) => {
        const m = new Map();
        for (const f of list) {
          const k = keyFn(f);
          if (!m.has(k)) m.set(k, []);
          m.get(k).push(f);
        }
        return m;
      };
      const byFolder = groupBy((f) => f.folder);
      const exts = [...new Set(list.map(extKey))].sort(collator.compare);

      // Reserve the sheet order: Summary, All Files, then the split sheets.
      const summary = wantSummary ? wb.addWorksheet(FM.safeSheetName('Summary', used)) : null;
      if (wantAll) addListSheet('All Files', list);
      const folderSheets = new Map();
      if (splitBy === 'folder') {
        for (const [folder, files] of byFolder) folderSheets.set(folder, addListSheet(folderLabel(folder), files));
      } else if (splitBy === 'type') {
        for (const [ext, files] of [...groupBy(extKey)].sort((a, b) => collator.compare(a[0], b[0]))) {
          addListSheet(ext ? ext.slice(1).toUpperCase() : 'No extension', files);
        }
      }

      if (summary) {
        summary.columns = [
          { header: 'Folder', key: 'folder', width: 50 },
          ...exts.map((e) => ({ header: e || '(none)', key: 'x' + e, width: 10 })),
          { header: 'Total', key: 'total', width: 10 },
          { header: 'Size (MB)', key: 'size', width: 12, style: { numFmt: '#,##0.00' } },
        ];
        const totals = { folder: 'Total', total: 0, size: 0 };
        exts.forEach((e) => { totals['x' + e] = 0; });
        for (const [folder, files] of byFolder) {
          const row = { folder: folderLabel(folder), total: files.length, size: 0 };
          exts.forEach((e) => { row['x' + e] = 0; });
          for (const f of files) {
            row['x' + extKey(f)]++;
            totals['x' + extKey(f)]++;
            row.size += (f.size || 0) / 1048576;
          }
          totals.total += files.length;
          totals.size += row.size;
          const r = summary.addRow(row);
          if (folderSheets.has(folder)) {
            r.getCell('folder').value = { text: row.folder, hyperlink: `#'${folderSheets.get(folder).replace(/'/g, "''")}'!A1` };
            r.getCell('folder').font = { color: { argb: 'FF2F6FDE' }, underline: true };
          }
        }
        summary.addRow(totals).font = { bold: true };
        FM.styleHeaderRow(summary);
        summary.views = [{ state: 'frozen', ySplit: 1 }];
      }

      await FM.downloadWorkbook(wb, `${state.rootName}-files.xlsx`);
      toast('Excel file downloaded.', 'success');
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Export to Excel';
    }
  };

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

  $('nameFind').addEventListener('input', () => { state.renderLimit = RENDER_STEP; refresh(); });
  $('moreBtn').onclick = () => { state.renderLimit += RENDER_STEP * 2; render(); };

  const pick = async () => {
    try {
      const source = await FM.pickFolder({ id: 'files-to-excel' });
      if (source) await load(source);
    } catch (e) { toast(e.message, 'error'); }
  };
  $('pickBtn').onclick = pick;
  $('changeFolderBtn').onclick = pick;
  $('rescanBtn').onclick = () => state.source && load(state.source);

  // Lets automated tests feed in a directory handle.
  window.__fmLoadDirectoryHandle = (handle) => load({ mode: 'fs', handle });
})();
