/* Merge PDF: combine PDFs in a chosen order (MuPDF). */
(() => {
  'use strict';
  const { $, esc, toast, formatBytes } = FM;

  let items = [];   // {id, file, pages, error}
  let nextId = 1;
  let dragId = null;

  async function addFiles(files) {
    const added = files.map((file) => ({ id: nextId++, file, pages: null, error: '' }));
    items.push(...added);
    render();
    for (const it of added) {
      try {
        const doc = await FM.openPdf(it.file);
        it.pages = doc.countPages();
      } catch (e) {
        it.error = e.message;
      }
      render();
    }
  }

  function render() {
    $('workspace').hidden = items.length === 0;
    const pages = items.reduce((s, it) => s + (it.pages || 0), 0);
    $('countLabel').textContent = `${items.length} file(s) · ${pages} page(s)`;
    $('fileList').innerHTML = items.map((it, i) => `<li draggable="true" data-id="${it.id}">
      <span class="grip" title="Drag to reorder">⋮⋮</span>
      <span class="idx">${i + 1}</span>
      <span class="fname">${esc(it.file.name)}${it.error ? `<br><span class="err">${esc(it.error)}</span>` : ''}</span>
      <span class="meta">${it.pages == null ? (it.error ? '' : '…') : it.pages + ' p'} · ${formatBytes(it.file.size)}</span>
      <button class="icon-btn" data-act="up" title="Move up" ${i === 0 ? 'disabled' : ''}>↑</button>
      <button class="icon-btn" data-act="down" title="Move down" ${i === items.length - 1 ? 'disabled' : ''}>↓</button>
      <button class="icon-btn danger" data-act="remove" title="Remove">✕</button>
    </li>`).join('');
  }

  $('fileList').addEventListener('click', (e) => {
    const act = e.target.dataset.act;
    if (!act) return;
    const id = Number(e.target.closest('li').dataset.id);
    const i = items.findIndex((it) => it.id === id);
    if (act === 'remove') items.splice(i, 1);
    if (act === 'up' && i > 0) [items[i - 1], items[i]] = [items[i], items[i - 1]];
    if (act === 'down' && i < items.length - 1) [items[i + 1], items[i]] = [items[i], items[i + 1]];
    render();
  });

  // Drag to reorder
  $('fileList').addEventListener('dragstart', (e) => {
    const li = e.target.closest('li');
    dragId = Number(li.dataset.id);
    li.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
  });
  $('fileList').addEventListener('dragover', (e) => {
    if (dragId === null) return;
    e.preventDefault();
    e.stopPropagation();
    document.querySelectorAll('.drop-before').forEach((x) => x.classList.remove('drop-before'));
    const li = e.target.closest('li');
    if (li) li.classList.add('drop-before');
  });
  $('fileList').addEventListener('drop', (e) => {
    if (dragId === null) return;
    e.preventDefault();
    e.stopPropagation();
    const li = e.target.closest('li');
    const from = items.findIndex((it) => it.id === dragId);
    const [moved] = items.splice(from, 1);
    const to = li ? items.findIndex((it) => it.id === Number(li.dataset.id)) : items.length;
    items.splice(to === -1 ? items.length : to, 0, moved);
    dragId = null;
    render();
  });
  $('fileList').addEventListener('dragend', () => { dragId = null; render(); });

  $('mergeBtn').onclick = async () => {
    const good = items.filter((it) => !it.error);
    if (good.length < 2) { toast('Add at least 2 PDF files.'); return; }
    let name = $('outName').value.trim() || 'combined.pdf';
    if (!/\.pdf$/i.test(name)) name += '.pdf';
    const btn = $('mergeBtn');
    btn.disabled = true;
    try {
      const m = await FM.mupdf();
      const out = new m.PDFDocument();
      for (const [i, it] of good.entries()) {
        btn.textContent = `Merging… ${i + 1}/${good.length}`;
        await new Promise((r) => setTimeout(r)); // let the label repaint
        const src = await FM.openPdf(it.file);
        const n = src.countPages();
        for (let p = 0; p < n; p++) out.graftPage(-1, src, p);
      }
      btn.textContent = 'Saving…';
      const buf = out.saveToBuffer('garbage=4,compress').asUint8Array();
      FM.downloadBlob(new Blob([buf], { type: 'application/pdf' }), name);
      toast(`Merged ${good.length} files into ${name}.`, 'success');
    } catch (e) {
      toast('Could not merge: ' + e.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Merge PDF';
    }
  };

  const chooseFiles = async () => { const f = await FM.choosePdfFiles(); if (f.length) addFiles(f); };
  $('addFilesBtn').onclick = chooseFiles;
  $('moreFilesBtn').onclick = chooseFiles;
  $('addFolderBtn').onclick = async () => {
    try {
      const f = await FM.choosePdfFolder();
      if (f.length) addFiles(f); else toast('No PDF files in that folder.');
    } catch (e) { toast(e.message, 'error'); }
  };
  $('sortBtn').onclick = () => { items.sort((a, b) => FM.collator.compare(a.file.name, b.file.name)); render(); };
  $('clearBtn').onclick = () => { items = []; render(); };
  FM.wireDropzone($('dropzone'), addFiles);
  FM.wireDropzone($('workspace'), addFiles);

  window.__fmAddFiles = addFiles;
})();
