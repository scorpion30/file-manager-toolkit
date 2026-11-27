/* Tool kit: the shared page flow of the PDF tools.
 *   1. pick files or a whole folder (or drop them, or get them from the previous tool)
 *   2. see every file (thumbnail, pages, size), set the options in the side panel
 *   3. run, then download one file / a ZIP, save into a folder, or send the result to another tool
 * A tool page calls FMKit.init({...}) with its own run() function. Needs common.js (window.FM). */
(() => {
  'use strict';
  const { $, esc, toast, formatBytes } = FM;
  const ar = () => document.documentElement.lang === 'ar';

  const ACCEPT = {
    pdf: { re: /\.pdf$/i, input: 'application/pdf,.pdf', label: 'PDF' },
    image: { re: /\.(jpe?g|png|webp|gif|bmp|avif|tiff?|jfif)$/i, input: 'image/*,.jpg,.jpeg,.png,.webp,.gif,.bmp,.tif,.tiff,.avif', label: 'image' },
  };
  // Tools a result can be sent to, by the type of file it makes.
  const NEXT_TOOLS = {
    pdf: [
      ['merge.html', 'Merge PDF', 'merge', 'organize'], ['compress.html', 'Compress PDF', 'compress', 'optimize'],
      ['page-numbers.html', 'Add Page Numbers', 'numbers', 'edit'], ['watermark.html', 'Add Watermark', 'watermark', 'edit'],
      ['protect.html', 'Protect PDF', 'protect', 'security'], ['pdf-to-image.html', 'PDF to JPG', 'toimg', 'convert'],
      ['split.html', 'Split PDF', 'split', 'organize'], ['pages.html', 'Organize Pages', 'pages', 'organize'],
      ['rotate.html', 'Rotate PDF', 'rotate', 'organize'], ['ocr.html', 'OCR PDF', 'ocr', 'optimize'], ['pdf-to-word.html', 'PDF to Word', 'toword', 'convert'], ['crop.html', 'Crop PDF', 'crop', 'edit'],
    ],
    image: [['image-to-pdf.html', 'JPG to PDF', 'topdf', 'convert'], ['remove-bg.html', 'Remove Background', 'removebg', 'convert']],
  };
  const ICONS = {
    merge: '<rect x="3" y="3" width="8" height="11" rx="1"/><rect x="13" y="10" width="8" height="11" rx="1"/><path d="M7 14v3a2 2 0 0 0 2 2h4"/>',
    split: '<rect x="6" y="3" width="12" height="18" rx="1"/><path d="M2 12h5M17 12h5"/>',
    pages: '<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="9" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 17.5h7M17.5 14v7"/>',
    rotate: '<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>',
    compress: '<path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8Z"/><path d="M14 3v5h5"/><path d="M12 10v3M12 17v1M10 11.5l2 2 2-2M10 16.5l2-2 2 2"/>',
    removebg: '<path d="M4 20 20 4"/><circle cx="9" cy="8" r="3"/><path d="M4 19c1-3 3-5 5-5"/><path d="M14 20h6v-6" stroke-dasharray="2 2"/>',
    toword: '<path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8Z"/><path d="M14 3v5h5"/><path d="m8 11 1.5 6 2.5-4.5 2.5 4.5L16 11"/>',
    ocr: '<path d="M4 7V4h3M17 4h3v3M20 17v3h-3M7 20H4v-3"/><path d="M8 9h8M8 12h8M8 15h5"/>',
    toimg: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 17-5-5-9 8"/>',
    topdf: '<path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8Z"/><path d="M14 3v5h5"/><path d="m8 17 3-4 2 2 1.5-1.5L17 17Z"/>',
    numbers: '<path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8Z"/><path d="M14 3v5h5"/><path d="M10 15.5l1.5-1.5v5M10 19h3"/>',
    watermark: '<path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8Z"/><path d="M14 3v5h5"/><path d="m8 17 8-6"/>',
    protect: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    crop: '<path d="M6 2v14a2 2 0 0 0 2 2h14"/><path d="M18 22V8a2 2 0 0 0-2-2H2"/>',
  };
  const svg = (k) => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[k] || ''}</svg>`;

  // Lets the page repaint between steps. A MessageChannel is used rather than setTimeout, which
  // background tabs slow down to once a second.
  const yq = [];
  const ych = new MessageChannel();
  ych.port1.onmessage = () => { const r = yq.shift(); if (r) r(); };
  const yieldUI = () => new Promise((r) => { yq.push(r); ych.port2.postMessage(0); });
  const extOf = (n) => (n.match(/\.([^.]+)$/) || ['', ''])[1].toLowerCase();
  const baseOf = (n) => n.replace(/\.[^.]+$/, '');
  /** A safe file name: no characters Windows refuses. */
  const safeName = (n) => n.replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_').replace(/\s+$/, '').slice(0, 180) || 'file';

  // ---------- handing files from one tool to the next (IndexedDB, same store as FM.saveHandoff) ----------
  function db() {
    return new Promise((resolve, reject) => {
      const r = indexedDB.open('fm-drop', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('h');
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
  }
  async function putFiles(files) {
    const d = await db();
    await new Promise((resolve, reject) => {
      const tx = d.transaction('h', 'readwrite');
      tx.objectStore('h').put({ at: Date.now(), files }, 'kit');
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
    d.close();
  }
  async function takeFiles() {
    const params = new URLSearchParams(location.search);
    if (!params.has('from')) return null;
    params.delete('from');
    const qs = params.toString();
    history.replaceState(null, '', location.pathname + (qs ? '?' + qs : '') + location.hash);
    try {
      const d = await db();
      const rec = await new Promise((resolve, reject) => {
        const tx = d.transaction('h', 'readwrite');
        const st = tx.objectStore('h');
        const g = st.get('kit');
        g.onsuccess = () => { st.delete('kit'); resolve(g.result); };
        g.onerror = () => reject(g.error);
      });
      d.close();
      if (!rec || Date.now() - rec.at > 30 * 60000) return null;
      return rec.files.map((f) => ({ file: new File([f.blob], f.name, { type: f.blob.type }), folder: f.folder || '' }));
    } catch { return null; }
  }

  // ---------- reading folders ----------
  async function filesFromHandles(handles, re) {
    const out = [];
    const walk = async (dir, path) => {
      const entries = [];
      try { for await (const e of dir.values()) entries.push(e); } catch { return; }
      for (const e of entries) {
        if (e.kind === 'file') { if (re.test(e.name)) out.push({ file: await e.getFile(), folder: path }); }
        else await walk(e, path ? path + '/' + e.name : e.name);
      }
    };
    for (const h of handles) {
      if (h.kind === 'directory') await walk(h, '');
      else if (re.test(h.name)) out.push({ file: await h.getFile(), folder: '' });
    }
    return out;
  }

  // ---------- downloads ----------
  async function zipOutputs(outputs, onProgress) {
    const JSZip = await FM.jszip();
    const zip = new JSZip();
    const used = new Set();
    for (const o of outputs) {
      let p = (o.folder ? o.folder + '/' : '') + o.name;
      let k = 2;
      while (used.has(p.toLowerCase())) { p = (o.folder ? o.folder + '/' : '') + baseOf(o.name) + ` (${k++}).` + extOf(o.name); }
      used.add(p.toLowerCase());
      zip.file(p, o.blob);
    }
    return zip.generateAsync({ type: 'blob', compression: 'STORE' }, (meta) => onProgress && onProgress(meta.percent));
  }
  async function saveToFolder(outputs) {
    const dir = await window.showDirectoryPicker({ id: 'fm-save', mode: 'readwrite' });
    let n = 0;
    for (const o of outputs) {
      let d = dir;
      for (const part of (o.folder || '').split('/').filter(Boolean)) d = await d.getDirectoryHandle(safeName(part), { create: true });
      const fh = await d.getFileHandle(safeName(o.name), { create: true });
      const w = await fh.createWritable();
      await w.write(o.blob);
      await w.close();
      n++;
    }
    return { n, name: dir.name };
  }

  // ---------- the page ----------
  /**
   * opts:
   *  key            short name for the usage log
   *  accept         'pdf' | 'image'
   *  multiple       more than one file (default true)
   *  view           'grid' (thumbnails, default) | 'rows'
   *  sortable       drag to reorder (default: true when multiple)
   *  allowLocked    keep password-protected PDFs (Unlock PDF)
   *  runLabel       text of the main button
   *  options        the side panel element is #kitOpts in the page; onOptions() is called when it changes
   *  estimate(items) -> string | Promise<string>   short line under the main button
   *  validate(items) -> true | message
   *  run(items, ui) -> outputs [{name, blob | bytes, type, folder, note, noteKind, thumb}]
   *  doneTitle(outputs, items) / doneText(outputs, items)
   *  preview(outputs, el)  optional extra result view
   *  makes          'pdf' | 'image' | null   which tools to suggest next
   *  onItems(items) after the list changes
   */
  function init(opts) {
    const o = Object.assign({ multiple: true, view: 'grid', accept: 'pdf', makes: 'pdf', runLabel: 'Start' }, opts);
    if (o.sortable == null) o.sortable = o.multiple;
    const acc = ACCEPT[o.accept];
    const root = document.querySelector('main.kit');
    const els = {
      drop: $('kitDrop'), work: $('kitWork'), busy: $('kitBusy'), done: $('kitDone'),
      list: $('kitFiles'), count: $('kitCount'), run: $('kitRun'), est: $('kitEst'), opts: $('kitOpts'),
    };
    let items = [];
    let nextId = 1;
    let outputs = [];
    let estTimer = null;
    let estToken = 0;
    let dragId = null;
    let busy = false;

    const log = (k) => FM.log(o.key + '-' + k);

    // ----- loading files -----
    async function loadItem(it) {
      if (o.accept === 'pdf') {
        try {
          const m = await FM.mupdf();
          const bytes = new Uint8Array(await it.file.arrayBuffer());
          let doc;
          try { doc = m.Document.openDocument(bytes, 'application/pdf'); } catch { throw new Error('Not a valid PDF file'); }
          if (doc.needsPassword()) {
            it.locked = true;
            if (!o.allowLocked) throw new Error('Password-protected. Unlock it first with Unlock PDF.');
            it.pages = null;
          } else {
            it.pages = doc.countPages();
            const page = doc.loadPage(0);
            const b = page.getBounds();
            it.size0 = [b[2] - b[0], b[3] - b[1]];
            const s = 180 / Math.max(it.size0[0], it.size0[1]);
            const pix = page.toPixmap(m.Matrix.scale(s, s), m.ColorSpace.DeviceRGB, false, true);
            it.thumb = URL.createObjectURL(new Blob([pix.asPNG().slice()], { type: 'image/png' }));
            if (doc.getMetaData('encryption') && doc.getMetaData('encryption') !== 'None') it.restricted = true;
          }
        } catch (e) { it.error = e.message; }
      } else {
        it.thumb = URL.createObjectURL(it.file);
      }
      if (o.load) { try { await o.load(it); } catch (e) { it.error = it.error || e.message; } }
      it.loaded = true;
    }

    async function addFiles(list) {
      const fresh = list.filter((x) => acc.re.test(x.file.name)).map((x) => ({ id: nextId++, file: x.file, folder: x.folder || '', pages: null, loaded: false }));
      if (!fresh.length) { toast(o.accept === 'pdf' ? 'No PDF files there.' : 'No images there.'); return; }
      if (!o.multiple) { items.forEach(drop); items = []; fresh.length = 1; }
      items.push(...fresh);
      showWork();
      render();
      for (const it of fresh) { await loadItem(it); render(); }
      onChange();
    }
    function drop(it) { if (it.thumb) URL.revokeObjectURL(it.thumb); }

    function showWork() {
      const has = items.length > 0;
      els.drop.hidden = has;
      els.work.hidden = !has;
      els.done.hidden = true;
      els.busy.hidden = true;
    }

    // ----- list -----
    function render() {
      const pages = items.reduce((s, it) => s + (it.pages || 0), 0);
      const total = items.reduce((s, it) => s + it.file.size, 0);
      els.count.textContent = o.accept === 'pdf'
        ? `${items.length} file(s) · ${pages} page(s) · ${formatBytes(total)}`
        : `${items.length} image(s) · ${formatBytes(total)}`;
      els.list.className = 'kit-files' + (o.view === 'rows' ? ' rows' : '');
      els.list.innerHTML = items.map((it, i) => `<li class="kit-file" data-id="${it.id}" ${o.sortable ? 'draggable="true"' : ''}>
        ${o.multiple ? `<span class="kf-idx">${i + 1}</span>` : ''}
        <div class="kit-thumb">${it.thumb ? `<img src="${it.thumb}" alt="" loading="lazy" style="${it.rot ? `transform:rotate(${it.rot}deg)` : ''}">` : `<span class="ph">${it.loaded ? (it.locked ? '🔒' : '') : '…'}</span>`}</div>
        <div class="kf-info">
          <div class="fname" translate="no" title="${esc(it.file.name)}">${esc(it.file.name)}</div>
          ${it.folder ? `<div class="kit-folder" translate="no">📁 ${esc(it.folder)}</div>` : ''}
          <div class="meta">${it.pages != null ? `${it.pages} p · ` : ''}${formatBytes(it.file.size)}${it.locked ? ' · 🔒' : ''}</div>
          ${it.error ? `<div class="err">${esc(it.error)}</div>` : ''}
        </div>
        <div class="kf-btns">${o.itemButtons ? o.itemButtons(it) : ''}<button type="button" data-act="remove" title="Remove" aria-label="Remove">✕</button></div>
      </li>`).join('');
      if (o.onItems) o.onItems(items);
    }

    els.list.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-act]');
      if (!b) return;
      const id = Number(b.closest('.kit-file').dataset.id);
      const it = items.find((x) => x.id === id);
      if (b.dataset.act === 'remove') {
        drop(it);
        items = items.filter((x) => x.id !== id);
        if (!items.length) { showWork(); return; }
      } else if (o.onItemAction) o.onItemAction(b.dataset.act, it);
      render();
      onChange();
    });
    if (o.sortable) {
      els.list.addEventListener('dragstart', (e) => {
        const li = e.target.closest('.kit-file');
        if (!li) return;
        dragId = Number(li.dataset.id);
        li.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
      });
      els.list.addEventListener('dragover', (e) => {
        if (dragId === null) return;
        e.preventDefault();
        e.stopPropagation();
        els.list.querySelectorAll('.drop-before').forEach((x) => x.classList.remove('drop-before'));
        const li = e.target.closest('.kit-file');
        if (li) li.classList.add('drop-before');
      });
      els.list.addEventListener('drop', (e) => {
        if (dragId === null) return;
        e.preventDefault();
        e.stopPropagation();
        const li = e.target.closest('.kit-file');
        const from = items.findIndex((x) => x.id === dragId);
        const [moved] = items.splice(from, 1);
        const to = li ? items.findIndex((x) => x.id === Number(li.dataset.id)) : items.length;
        items.splice(to === -1 ? items.length : to, 0, moved);
        dragId = null;
        render();
        onChange();
      });
      els.list.addEventListener('dragend', () => { dragId = null; render(); });
    }

    // ----- sort -----
    const sortSel = $('kitSort');
    if (sortSel) {
      sortSel.addEventListener('change', () => {
        const v = sortSel.value;
        const key = (it) => (it.folder ? it.folder + '/' : '') + it.file.name;
        if (v === 'name') items.sort((a, b) => FM.collator.compare(key(a), key(b)));
        if (v === 'name-desc') items.sort((a, b) => FM.collator.compare(key(b), key(a)));
        if (v === 'date') items.sort((a, b) => a.file.lastModified - b.file.lastModified);
        if (v === 'date-desc') items.sort((a, b) => b.file.lastModified - a.file.lastModified);
        if (v === 'size') items.sort((a, b) => a.file.size - b.file.size);
        render();
        onChange();
      });
    }

    // ----- options + estimate -----
    function onChange() {
      if (o.onOptions) o.onOptions(items);
      if (!o.estimate) return;
      clearTimeout(estTimer);
      const token = ++estToken;
      estTimer = setTimeout(async () => {
        if (!items.length) { els.est.textContent = ''; return; }
        try {
          const txt = await o.estimate(items.filter((x) => !x.error), () => token !== estToken);
          if (token === estToken) els.est.textContent = txt || '';
        } catch (e) { if (token === estToken) els.est.textContent = ''; }
      }, 250);
    }
    if (els.opts) {
      els.opts.addEventListener('input', onChange);
      els.opts.addEventListener('change', onChange);
    }

    // ----- run -----
    function setBusy(on, title) {
      busy = on;
      els.busy.hidden = !on;
      els.work.hidden = on;
      if (on) {
        $('kitBusyTitle').textContent = title || 'Working…';
        $('kitBar').style.width = '0%';
        $('kitBusyText').textContent = '';
        els.busy.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
    const ui = {
      progress(done, total, text) {
        $('kitBar').style.width = Math.round((100 * done) / Math.max(1, total)) + '%';
        if (text != null) $('kitBusyText').textContent = text;
      },
      yield: yieldUI,
      safeName, baseOf, extOf,
    };

    els.run.addEventListener('click', async () => {
      if (busy) return;
      const good = items.filter((x) => !x.error && x.loaded);
      if (!good.length) { toast(items.length ? 'Wait until the files are read, or remove the ones with errors.' : 'Add files first.'); return; }
      if (o.validate) {
        const v = o.validate(good);
        if (v !== true) { toast(v); return; }
      }
      setBusy(true, o.busyTitle || 'Working…');
      log('run');
      const t0 = performance.now();
      try {
        const res = await o.run(good, ui);
        outputs = res.map((x) => ({ ...x, blob: x.blob || new Blob([x.bytes], { type: x.type || 'application/octet-stream' }) }));
        outputs.forEach((x) => { delete x.bytes; });
        if (!outputs.length) throw new Error(o.emptyMessage || 'Nothing was made. Check the options.');
        showDone(good, performance.now() - t0);
        log('done');
      } catch (e) {
        console.error(e);
        setBusy(false);
        toast((e && e.message) || String(e), 'error');
      }
    });

    // ----- result -----
    function showDone(good, ms) {
      busy = false;
      els.busy.hidden = true;
      els.work.hidden = true;
      els.done.hidden = false;
      const totalOut = outputs.reduce((s, x) => s + x.blob.size, 0);
      $('kitDoneTitle').textContent = o.doneTitle ? o.doneTitle(outputs, good) : (outputs.length === 1 ? 'Your file is ready' : `${outputs.length} files are ready`);
      $('kitDoneText').textContent = o.doneText ? o.doneText(outputs, good) : `${formatBytes(totalOut)} · done in ${(ms / 1000).toFixed(1)} s, on your computer`;
      const row = $('kitDl');
      const single = outputs.length === 1;
      row.innerHTML = `<button type="button" class="btn primary lg" data-dl="main">⬇ <span>${single ? 'Download' : 'Download all (ZIP)'}</span></button>
        ${!single && FM.canDirectAccess ? '<button type="button" class="btn lg" data-dl="folder">📁 <span>Save into a folder</span></button>' : ''}
        ${single && FM.canDirectAccess ? '<button type="button" class="btn lg" data-dl="folder">📁 <span>Save into a folder</span></button>' : ''}`;
      $('kitOut').innerHTML = outputs.length > 1 || outputs[0].note ? outputs.map((x, i) => `<li>
          ${x.thumb ? `<img src="${x.thumb}" alt="">` : ''}
          <span class="o-name" translate="no">${esc((x.folder ? x.folder + '/' : '') + x.name)}</span>
          ${x.note ? `<span class="${x.noteKind === 'warn' ? 'o-warn' : 'o-good'}">${esc(x.note)}</span>` : ''}
          <span class="o-size">${formatBytes(x.blob.size)}</span>
          <button type="button" class="btn o-dl" data-one="${i}">Download</button></li>`).join('') : '';
      $('kitOut').hidden = !$('kitOut').innerHTML;
      const pv = $('kitPreview');
      if (pv) { pv.innerHTML = ''; if (o.preview) o.preview(outputs, pv, good); }
      // next tools
      const next = (NEXT_TOOLS[o.makes] || []).filter(([href]) => !location.pathname.endsWith('/' + href) && !(location.pathname.endsWith('/') && href === 'index.html'));
      $('kitNext').hidden = !next.length;
      $('kitNextChips').innerHTML = next.slice(0, 8).map(([href, name, ic, cat]) => `<button type="button" data-next="${href}"><span class="mi cat-${cat}">${svg(ic)}</span><span>${name}</span></button>`).join('');
      els.done.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    els.done.addEventListener('click', async (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      try {
        if (b.dataset.dl === 'main') {
          if (outputs.length === 1) FM.downloadBlob(outputs[0].blob, outputs[0].name);
          else {
            b.disabled = true;
            const zip = await zipOutputs(outputs);
            FM.downloadBlob(zip, (o.zipName ? o.zipName(outputs) : o.key) + '.zip');
            b.disabled = false;
          }
          log('download');
        } else if (b.dataset.dl === 'folder') {
          const r = await saveToFolder(outputs);
          toast(`Saved ${r.n} file(s) into “${r.name}”.`, 'success');
          log('save-folder');
        } else if (b.dataset.one != null) {
          const x = outputs[Number(b.dataset.one)];
          FM.downloadBlob(x.blob, x.name);
        } else if (b.dataset.next) {
          await putFiles(outputs.map((x) => ({ blob: x.blob, name: x.name, folder: x.folder || '' })));
          log('next-' + b.dataset.next.replace('.html', ''));
          location.href = b.dataset.next + '?from=' + o.key;
        } else if (b.id === 'kitBack') {
          showWork();
          render();
        } else if (b.id === 'kitRestart') {
          items.forEach(drop);
          items = [];
          outputs = [];
          showWork();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } catch (err) {
        if (err && err.name === 'AbortError') return;
        toast((err && err.message) || String(err), 'error');
        b.disabled = false;
      }
    });

    // ----- picking -----
    function chooseFiles() {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = acc.input;
      input.multiple = o.multiple;
      input.addEventListener('change', () => { if (input.files.length) addFiles([...input.files].map((file) => ({ file }))); });
      input.click();
    }
    async function chooseFolder() {
      try {
        const src = await FM.pickFolder({ id: 'kit-' + o.accept });
        if (!src) return;
        let list;
        if (src.mode === 'fs') list = await filesFromHandles([src.handle], acc.re);
        else list = [...src.fileList].filter((f) => acc.re.test(f.name)).map((f) => ({ file: f, folder: (f.webkitRelativePath || '').split('/').slice(1, -1).join('/') }));
        list.sort((a, b) => FM.collator.compare(a.folder, b.folder) || FM.collator.compare(a.file.name, b.file.name));
        log('folder');
        addFiles(list);
      } catch (e) { toast(e.message, 'error'); }
    }
    root.querySelectorAll('[data-kit="files"]').forEach((b) => b.addEventListener('click', chooseFiles));
    root.querySelectorAll('[data-kit="folder"]').forEach((b) => { if (!o.multiple) b.hidden = true; else b.addEventListener('click', chooseFolder); });
    root.querySelectorAll('[data-kit="clear"]').forEach((b) => b.addEventListener('click', () => { items.forEach(drop); items = []; showWork(); }));

    // Drop files or folders anywhere on the page.
    const hasFiles = (e) => [...((e.dataTransfer && e.dataTransfer.types) || [])].includes('Files');
    document.addEventListener('dragover', (e) => { if (hasFiles(e) && dragId === null) { e.preventDefault(); els.drop.classList.add('dragover'); } });
    document.addEventListener('dragleave', (e) => { if (!e.relatedTarget) els.drop.classList.remove('dragover'); });
    document.addEventListener('drop', async (e) => {
      if (!hasFiles(e) || dragId !== null) return;
      e.preventDefault();
      els.drop.classList.remove('dragover');
      if (busy) return;
      const dt = e.dataTransfer;
      const canHandles = dt.items && dt.items.length && 'getAsFileSystemHandle' in DataTransferItem.prototype;
      if (canHandles) {
        const pending = [...dt.items].filter((i) => i.kind === 'file').map((i) => i.getAsFileSystemHandle().catch(() => null));
        const handles = (await Promise.all(pending)).filter(Boolean);
        const list = await filesFromHandles(handles, acc.re);
        addFiles(list);
      } else addFiles([...dt.files].map((file) => ({ file })));
    });

    // Files handed over by another tool, or a folder dropped on the home page.
    (async () => {
      const handed = await takeFiles();
      if (handed && handed.length) { addFiles(handed); log('from-tool'); return; }
      FM.useDropped(async (handles) => addFiles(await filesFromHandles(handles, acc.re)));
    })();

    const api = {
      get items() { return items; },
      get outputs() { return outputs; },
      refresh: () => { render(); onChange(); },
      render, onChange, addFiles,
    };
    window.__kit = api;
    return api;
  }

  /**
   * Text drawn by the browser as a PNG, for writing on PDF pages in any language (Arabic is joined
   * and right-to-left). Returns { bytes, w, h } in pixels; draw it at w/scale x h/scale points.
   */
  async function textPng(text, { size = 40, color = '#000000', bold = false, scale = 4 } = {}) {
    const font = `${bold ? '700' : '400'} ${size * scale}px "Noto Sans Arabic", "Segoe UI", Tahoma, Arial, sans-serif`;
    try { await document.fonts.load(font, text); } catch { /* use what is there */ }
    const c = document.createElement('canvas');
    const ctx = c.getContext('2d');
    ctx.font = font;
    const mt = ctx.measureText(text);
    const w = Math.ceil(mt.width + size * scale * 0.2);
    const h = Math.ceil(size * scale * 1.35);
    c.width = Math.max(1, w); c.height = h;
    const ctx2 = c.getContext('2d');
    ctx2.font = font;
    ctx2.fillStyle = color;
    ctx2.textBaseline = 'middle';
    ctx2.direction = /[֐-ࣿ]/.test(text) ? 'rtl' : 'ltr';
    ctx2.textAlign = 'center';
    ctx2.fillText(text, w / 2, h / 2);
    const blob = await new Promise((r) => c.toBlob(r, 'image/png'));
    return { bytes: new Uint8Array(await blob.arrayBuffer()), w, h, scale };
  }
  const hexRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);

  window.FMKit = { init, safeName, baseOf, extOf, yieldUI, zipOutputs, textPng, hexRgb };
})();
