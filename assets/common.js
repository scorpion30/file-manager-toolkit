/* Shared helpers for all tool pages. Exposes window.FM. */
(() => {
  'use strict';

  const LIBS = {
    excel: 'https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.4.0/exceljs.min.js',
    zip: 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
    mupdf: 'https://cdn.jsdelivr.net/npm/mupdf@1.28.1/dist/mupdf.js',
    tesseract: 'https://cdn.jsdelivr.net/npm/tesseract.js@7.0.0/dist/tesseract.min.js',
  };

  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
  const canDirectAccess = typeof window.showDirectoryPicker === 'function';

  function splitName(name) {
    const i = name.lastIndexOf('.');
    if (i <= 0) return { base: name, ext: '' };
    return { base: name.slice(0, i), ext: name.slice(i) };
  }

  function formatBytes(n) {
    if (n == null) return '';
    if (n < 1024) return n + ' B';
    const units = ['KB', 'MB', 'GB', 'TB'];
    let i = -1;
    do { n /= 1024; i++; } while (n >= 1024 && i < units.length - 1);
    return n.toFixed(n < 10 ? 1 : 0) + ' ' + units[i];
  }

  // ---------- toast & dialog ----------
  function ensureChrome() {
    if (!$('toasts')) {
      const t = document.createElement('div');
      t.className = 'toasts';
      t.id = 'toasts';
      document.body.appendChild(t);
    }
    if (!$('dlg')) {
      const d = document.createElement('dialog');
      d.id = 'dlg';
      d.innerHTML = `<div class="d-head"><h2 id="dlgTitle"></h2></div>
        <div class="d-body" id="dlgBody"></div>
        <div class="d-foot"><button type="button" class="btn" id="dlgCancel">Cancel</button>
        <button type="button" class="btn primary" id="dlgOk">OK</button></div>`;
      document.body.appendChild(d);
    }
  }

  function toast(msg, kind = '') {
    ensureChrome();
    const el = document.createElement('div');
    el.className = 'toast ' + kind;
    el.textContent = msg;
    $('toasts').appendChild(el);
    setTimeout(() => el.remove(), kind === 'error' ? 7000 : 4000);
  }

  function dialog({ title, html, okText = 'OK', okClass = 'primary', cancel = true, cancelText = 'Cancel' }) {
    ensureChrome();
    const dlg = $('dlg');
    $('dlgTitle').textContent = title;
    $('dlgBody').innerHTML = html;
    $('dlgOk').textContent = okText;
    $('dlgOk').className = 'btn ' + okClass;
    $('dlgCancel').textContent = cancelText;
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

  // ---------- libraries ----------
  const scriptCache = new Map();
  function loadScript(src) {
    if (!scriptCache.has(src)) {
      scriptCache.set(src, new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = src;
        s.onload = resolve;
        s.onerror = () => {
          scriptCache.delete(src);
          reject(new Error('Could not load a required library. Check your internet connection.'));
        };
        document.head.appendChild(s);
      }));
    }
    return scriptCache.get(src);
  }

  async function excel() { await loadScript(LIBS.excel); return window.ExcelJS; }
  async function jszip() { await loadScript(LIBS.zip); return window.JSZip; }
  async function tesseract() { await loadScript(LIBS.tesseract); return window.Tesseract; }
  let mupdfPromise = null;
  function mupdf() {
    if (!mupdfPromise) {
      mupdfPromise = import(LIBS.mupdf).catch((e) => {
        mupdfPromise = null;
        throw new Error('Could not load the PDF engine. Check your internet connection. (' + e.message + ')');
      });
    }
    return mupdfPromise;
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  }

  // ---------- folders ----------
  /** Recursively reads a directory handle. Returns {rootName, files, folders}. */
  async function scanDirectory(handle, onProgress) {
    const files = [];
    const folders = [];
    async function walk(dir, path, depth) {
      folders.push({ path, depth, handle: dir });
      const entries = [];
      try {
        for await (const entry of dir.values()) entries.push(entry);
      } catch {
        return; // folder we are not allowed to read
      }
      for (const entry of entries) {
        if (entry.kind === 'file') {
          files.push({ name: entry.name, ...splitName(entry.name), folder: path, dirHandle: dir, handle: entry });
          if (onProgress && files.length % 200 === 0) onProgress(files.length);
        } else {
          await walk(entry, path ? path + '/' + entry.name : entry.name, depth + 1);
        }
      }
    }
    await walk(handle, '', 0);
    sortListing(files, folders);
    return { rootName: handle.name, files, folders };
  }

  /** Builds the same shape from an <input webkitdirectory> FileList. */
  function scanFileList(fileList) {
    const list = Array.from(fileList);
    const rootName = list.length ? (list[0].webkitRelativePath || list[0].name).split('/')[0] : '';
    const folderMap = new Map([['', 0]]);
    const files = list.map((file) => {
      const parts = (file.webkitRelativePath || file.name).split('/');
      const name = parts.pop();
      for (let i = 1; i < parts.length; i++) folderMap.set(parts.slice(1, i + 1).join('/'), i);
      return { name, ...splitName(name), folder: parts.slice(1).join('/'), file };
    });
    const folders = [...folderMap].map(([path, depth]) => ({ path, depth }));
    sortListing(files, folders);
    return { rootName, files, folders };
  }

  function sortListing(files, folders) {
    files.sort((a, b) => collator.compare(a.folder, b.folder) || collator.compare(a.name, b.name));
    folders.sort((a, b) => collator.compare(a.path, b.path));
  }

  /**
   * Asks the user for a folder. Must be called straight from a click handler.
   * Resolves to {mode: 'fs', handle} or {mode: 'input', fileList}, or null if cancelled.
   */
  function pickFolder({ write = false, id = 'fm' } = {}) {
    const viaInput = () => new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.webkitdirectory = true;
      input.multiple = true;
      input.addEventListener('change', () => resolve(input.files.length ? { mode: 'input', fileList: input.files } : null));
      input.addEventListener('cancel', () => resolve(null));
      input.click();
    });
    if (!canDirectAccess) return viaInput();
    return window.showDirectoryPicker({ id, mode: write ? 'readwrite' : 'read' })
      .then((handle) => ({ mode: 'fs', handle }))
      .catch((e) => {
        if (e.name === 'AbortError') return null;
        if (e.name === 'SecurityError') return viaInput();
        throw e;
      });
  }

  async function ensurePermission(handle, mode = 'readwrite') {
    if (!handle.queryPermission) return true;
    if ((await handle.queryPermission({ mode })) === 'granted') return true;
    return (await handle.requestPermission({ mode })) === 'granted';
  }

  async function fileOf(entry) {
    return entry.file || entry.handle.getFile();
  }

  // ---------- extension filter popover ----------
  /**
   * Wires a "File types" button + popover.
   * getCounts() -> Map(extKey -> count); selected is a Set kept in sync; onChange() after edits.
   */
  function extensionFilter({ button, popover, label, getCounts, selected, onChange }) {
    const update = () => {
      const keys = [...getCounts().keys()];
      const on = keys.filter((k) => selected.has(k)).length;
      label.textContent = keys.length === 0 ? 'none' : on === keys.length ? 'All' : `${on} of ${keys.length}`;
    };
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!popover.hidden) { popover.hidden = true; return; }
      const counts = getCounts();
      const allOn = [...counts.keys()].every((k) => selected.has(k));
      popover.innerHTML = `<label><input type="checkbox" data-ext="*" ${allOn ? 'checked' : ''}> <b>All</b></label><hr>` +
        [...counts].map(([k, n]) => `<label><input type="checkbox" data-ext="${esc(k)}" ${selected.has(k) ? 'checked' : ''}> ${esc(k || '(no extension)')}<span class="count">${n}</span></label>`).join('');
      popover.hidden = false;
    });
    popover.addEventListener('click', (e) => e.stopPropagation());
    popover.addEventListener('change', (e) => {
      const key = e.target.dataset.ext;
      if (key === '*') {
        [...getCounts().keys()].forEach((k) => (e.target.checked ? selected.add(k) : selected.delete(k)));
        popover.querySelectorAll('input').forEach((i) => { i.checked = e.target.checked; });
      } else {
        if (e.target.checked) selected.add(key); else selected.delete(key);
        const boxes = [...popover.querySelectorAll('input:not([data-ext="*"])')];
        popover.querySelector('[data-ext="*"]').checked = boxes.every((b) => b.checked);
      }
      update();
      onChange();
    });
    document.addEventListener('click', () => { popover.hidden = true; });
    return { update };
  }

  /** Dialog listing folders with checkboxes. Resolves to a Set of paths or null. */
  async function chooseFolders(folders, rootName, current) {
    const items = folders.map((fd) => {
      const name = fd.path ? fd.path.split('/').pop() : `${rootName} (everything)`;
      return `<label style="padding-left:${fd.depth * 20}px"><input type="checkbox" value="${esc(fd.path)}" ${current.has(fd.path) ? 'checked' : ''}> ${esc(name)}</label>`;
    }).join('');
    const ok = await dialog({
      title: 'Select folders',
      html: `<p>Files in the checked folders (and the folders inside them) will be included.</p><div class="folder-tree" id="folderTree">${items}</div>`,
      okText: 'Confirm',
    });
    if (!ok) return null;
    const chosen = new Set([...document.querySelectorAll('#folderTree input:checked')].map((i) => i.value));
    if (!chosen.size) { toast('No folders were selected.'); return null; }
    return chosen;
  }

  /** Scope test shared by folder-based tools: 'current' | 'all' | 'select'. */
  function inScope(folder, include, selected) {
    if (include === 'current') return folder === '';
    if (include === 'all') return true;
    for (const s of selected) if (s === '' || folder === s || folder.startsWith(s + '/')) return true;
    return false;
  }

  // ---------- Excel ----------
  function safeSheetName(name, used) {
    const base = name.replace(/[\\/]/g, '_').replace(/[[\]:*?]/g, '').replace(/^'+|'+$/g, '').slice(0, 31) || 'Sheet';
    let candidate = base;
    let n = 2;
    while (used.has(candidate.toLowerCase())) {
      const tag = ` (${n++})`;
      candidate = base.slice(0, 31 - tag.length) + tag;
    }
    used.add(candidate.toLowerCase());
    return candidate;
  }

  function styleHeaderRow(ws, rowNumber = 1) {
    ws.getRow(rowNumber).eachCell((c) => {
      c.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F81BD' } };
    });
  }

  /** Excel has no time zones: shift so the sheet shows the local time Windows shows. */
  function excelDate(ms) {
    if (ms == null) return null;
    return new Date(ms - new Date(ms).getTimezoneOffset() * 60000);
  }

  async function downloadWorkbook(wb, filename) {
    const buf = await wb.xlsx.writeBuffer();
    downloadBlob(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), filename);
  }

  /** Text clean-up used by the old desktop app (dashes, invisible spaces, upper case). */
  function cleanText(text) {
    return String(text ?? '')
      .replace(/[‐-—]/g, '-')
      .replace(/ /g, ' ')
      .replace(/[​-‍﻿]/g, '')
      .replace(/[\t\n\r\x0b\x0c]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toUpperCase();
  }

  function removeDuplicateWords(text) {
    if (!text) return text;
    return [...new Set(text.split(/\s+/))].join(' ');
  }

  // ---------- PDF ----------
  async function openPdf(file) {
    const m = await mupdf();
    const bytes = new Uint8Array(await file.arrayBuffer());
    let doc;
    try {
      doc = m.Document.openDocument(bytes, 'application/pdf');
    } catch (e) {
      throw new Error('Not a valid PDF file');
    }
    if (doc.needsPassword()) throw new Error('This PDF is password-protected');
    return doc.asPDF();
  }

  /** Accepts dropped files on a zone; calls onFiles(File[]) with PDFs only. */
  function wireDropzone(zone, onFiles, accept = /\.pdf$/i) {
    zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('dragover'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('dragover');
      const files = [...e.dataTransfer.files].filter((f) => accept.test(f.name));
      if (files.length) onFiles(files); else toast('Drop PDF files here.');
    });
  }

  /** Opens a file chooser for PDFs. Must be called from a click handler. */
  function choosePdfFiles(multiple = true) {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/pdf,.pdf';
      input.multiple = multiple;
      input.addEventListener('change', () => resolve([...input.files]));
      input.addEventListener('cancel', () => resolve([]));
      input.click();
    });
  }

  /** Lets the user pick a folder and returns all PDFs in it and its subfolders. */
  async function choosePdfFolder() {
    const source = await pickFolder({ id: 'pdf-folder' });
    if (!source) return [];
    const listing = source.mode === 'fs' ? await scanDirectory(source.handle) : scanFileList(source.fileList);
    const pdfs = listing.files.filter((f) => /\.pdf$/i.test(f.name));
    return Promise.all(pdfs.map((f) => fileOf(f)));
  }

  /**
   * Step-by-step pages: `.stepper .step` buttons and `.step-panel` sections in the
   * same order. canEnter(i) returns true, or a message explaining what is missing.
   * Buttons with data-next / data-back move forward and back.
   */
  function wizard({ canEnter = () => true, onEnter = () => {} } = {}) {
    const tabs = [...document.querySelectorAll('.stepper .step')];
    const panels = [...document.querySelectorAll('.step-panel')];
    let current = 0;
    const paint = () => {
      tabs.forEach((t, i) => {
        t.classList.toggle('active', i === current);
        t.classList.toggle('done', i < current);
      });
      panels.forEach((p, i) => { p.hidden = i !== current; });
    };
    const go = (i) => {
      if (i < 0 || i >= panels.length || i === current) return;
      for (let k = current + 1; k <= i; k++) {
        const ok = canEnter(k);
        if (ok !== true) { toast(ok); return; }
      }
      current = i;
      paint();
      // Bring the step bar to the top so the whole step (and the drawing) fits on screen.
      const top = document.querySelector('.stepper').getBoundingClientRect().top + window.scrollY - 70;
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
      onEnter(i);
    };
    tabs.forEach((t, i) => t.addEventListener('click', () => go(i)));
    document.querySelectorAll('[data-next]').forEach((b) => b.addEventListener('click', () => go(current + 1)));
    document.querySelectorAll('[data-back]').forEach((b) => b.addEventListener('click', () => go(current - 1)));
    paint();
    return { go, get current() { return current; } };
  }


  // ---------- example files ("Use example files") ----------
  const log = (key) => { try { window.FMlog && window.FMlog(key); } catch { /* ignore */ } };
  const isPhone = () => matchMedia('(max-width: 700px), (pointer: coarse)').matches;

  /**
   * Shows the "it worked" card after a visitor used the example files.
   * points: short lines about what they got; onOwn: runs the tool on their own files.
   */
  // Made-up A3 drawings in assets/samples (tools/make-samples.py), with where their title block values are.
  const SAMPLE_PDFS = Array.from({ length: 8 }, (_, i) => `Sheet_00${i + 1}.pdf`);
  const SAMPLE_BOXES = {
    no: { x1: 0.6933, y1: 0.9287, x2: 0.8361, y2: 0.9715, label: 'Drawing No' },
    title: { x1: 0.6933, y1: 0.8575, x2: 0.979, y2: 0.8979, label: 'Title' },
    rev: { x1: 0.8429, y1: 0.9287, x2: 0.8966, y2: 0.9715, label: 'Revision' },
  };
  async function samplePdfs() {
    const base = new URL('assets/samples/', document.querySelector('script[src*="common.js"]').src.replace(/assets\/common\.js.*$/, '')).href;
    return Promise.all(SAMPLE_PDFS.map(async (name) => {
      const res = await fetch(base + name);
      if (!res.ok) throw new Error('Could not load the example files. Check your connection and try again.');
      return new File([await res.blob()], name, { type: 'application/pdf', lastModified: Date.now() });
    }));
  }

  function sampleDone(box, { title, points = [], ownText, onOwn }) {
    const link = location.href.split('#')[0].split('?')[0];
    const wa = 'https://wa.me/?text=' + encodeURIComponent(link);
    box.innerHTML = `
      <div class="sd-head"><span class="sd-check">✓</span><h2>${esc(title)}</h2></div>
      <ul>${points.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>
      <div class="sd-actions">
        ${isPhone() ? '' : `<button class="btn primary lg" id="sdOwnBtn">${esc(ownText)}</button>`}
        ${isPhone() ? `<a class="btn primary lg" id="sdWaBtn" href="${wa}" target="_blank" rel="noopener">Send the link to myself on WhatsApp</a>
          <button class="btn lg" id="sdCopyBtn">Copy the link</button>` : ''}
      </div>
      <p class="sd-note">${isPhone()
        ? 'Your own folders work on a computer, in Chrome or Edge. Free, no sign-up.'
        : 'Free, no sign-up. Your files stay on your computer.'}</p>`;
    box.hidden = false;
    const own = box.querySelector('#sdOwnBtn');
    if (own) own.onclick = onOwn;
    const copy = box.querySelector('#sdCopyBtn');
    if (copy) copy.onclick = async () => {
      try { await navigator.clipboard.writeText(link); toast('Link copied.', 'success'); } catch { toast(link); }
    };
    box.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  window.FM = {
    wizard,
    openPdf, wireDropzone, choosePdfFiles, choosePdfFolder,
    $, esc, collator, canDirectAccess, splitName, formatBytes,
    toast, dialog, loadScript, excel, jszip, mupdf, tesseract, downloadBlob,
    scanDirectory, scanFileList, pickFolder, ensurePermission, fileOf,
    extensionFilter, chooseFolders, inScope,
    safeSheetName, styleHeaderRow, excelDate, downloadWorkbook,
    cleanText, removeDuplicateWords,
    log, isPhone, sampleDone, samplePdfs, SAMPLE_BOXES,
  };
})();
