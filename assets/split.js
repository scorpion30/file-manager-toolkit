/* Split PDF: by page ranges, every page, or picked pages into one file (MuPDF). */
(() => {
  'use strict';
  const { $, esc, toast, formatBytes } = FM;

  let current = null; // {file, pages}

  async function setFile(file) {
    try {
      const doc = await FM.openPdf(file);
      current = { file, pages: doc.countPages() };
    } catch (e) {
      toast(`${file.name}: ${e.message}`, 'error');
      return;
    }
    $('dropzone').hidden = true;
    $('workspace').hidden = false;
    $('fileLabel').innerHTML = `${esc(file.name)} <span class="hint" style="display:inline">· ${current.pages} page(s) · ${formatBytes(file.size)}</span>`;
    updateHint();
  }

  const mode = () => document.querySelector('input[name="mode"]:checked').value;

  function updateHint() {
    $('ranges').disabled = mode() === 'each';
    $('rangeHint').textContent = mode() === 'each'
      ? `Will create ${current.pages} files.`
      : `Pages 1 to ${current.pages}. Separate ranges with commas.`;
  }

  /** Same rules as the desktop app: "1-3,5,8-10". */
  function parseRanges(text, count) {
    const ranges = [];
    for (let part of text.split(',')) {
      part = part.trim();
      if (!part) continue;
      const m = part.match(/^(\d+)\s*(?:-\s*(\d+))?$/);
      if (!m) throw new Error(`“${part}” is not a page or range.`);
      const start = Number(m[1]);
      const end = m[2] ? Number(m[2]) : start;
      if (start < 1 || end > count || start > end) throw new Error(`Invalid range “${part}” for a ${count}-page document.`);
      ranges.push([start, end]);
    }
    if (!ranges.length) throw new Error('Type the pages to take, e.g. 1-3,5,8-10');
    return ranges;
  }

  $('splitBtn').onclick = async () => {
    if (!current) return;
    let ranges;
    try {
      ranges = mode() === 'each'
        ? Array.from({ length: current.pages }, (_, i) => [i + 1, i + 1])
        : parseRanges($('ranges').value, current.pages);
    } catch (e) { toast(e.message, 'error'); return; }

    // Ask for the folder first, while we still have the click's permission to open a picker.
    let folder = null;
    if (document.querySelector('input[name="out"]:checked').value === 'folder') {
      if (!FM.canDirectAccess) { toast('Saving into a folder needs Chrome or Edge. Choose “Download”.'); return; }
      try {
        folder = await window.showDirectoryPicker({ id: 'split-out', mode: 'readwrite' });
      } catch (e) {
        if (e.name !== 'AbortError') toast(e.message, 'error');
        return;
      }
    }

    const btn = $('splitBtn');
    btn.disabled = true;
    try {
      const m = await FM.mupdf();
      const src = await FM.openPdf(current.file);
      const base = FM.splitName(current.file.name).base;
      const outputs = []; // [name, Uint8Array]
      const build = (pageNumbers) => {
        const out = new m.PDFDocument();
        pageNumbers.forEach((p) => out.graftPage(-1, src, p - 1));
        // Copy out of MuPDF's WASM memory: a plain view can be freed or moved before it is written.
        const buf = out.saveToBuffer('garbage=4,compress');
        const bytes = buf.asUint8Array().slice();
        buf.destroy();
        return bytes;
      };
      const label = (s, e) => (s === e ? `p${s}` : `p${s}-${e}`);

      if (mode() === 'one') {
        const pages = ranges.flatMap(([s, e]) => Array.from({ length: e - s + 1 }, (_, i) => s + i));
        outputs.push([`${base}_${ranges.map(([s, e]) => label(s, e)).join('_')}.pdf`.slice(0, 200), build(pages)]);
      } else {
        for (const [i, [s, e]] of ranges.entries()) {
          btn.textContent = `Splitting… ${i + 1}/${ranges.length}`;
          await new Promise((r) => setTimeout(r));
          outputs.push([`${base}_${label(s, e)}.pdf`, build(Array.from({ length: e - s + 1 }, (_, k) => s + k))]);
        }
      }

      if (folder) {
        for (const [name, bytes] of outputs) {
          const h = await folder.getFileHandle(name, { create: true });
          const w = await h.createWritable();
          await w.write(bytes);
          await w.close();
        }
        toast(`Saved ${outputs.length} file(s) into “${folder.name}”.`, 'success');
      } else if (outputs.length === 1) {
        FM.downloadBlob(new Blob([outputs[0][1]], { type: 'application/pdf' }), outputs[0][0]);
      } else {
        btn.textContent = 'Zipping…';
        const JSZip = await FM.jszip();
        const zip = new JSZip();
        outputs.forEach(([name, bytes]) => zip.file(name, bytes));
        FM.downloadBlob(await zip.generateAsync({ type: 'blob' }), `${base}_split.zip`);
        toast(`Created ${outputs.length} files.`, 'success');
      }
    } catch (e) {
      toast('Could not split: ' + e.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Split PDF';
    }
  };

  const choose = async () => { const [f] = await FM.choosePdfFiles(false); if (f) setFile(f); };
  $('chooseBtn').onclick = choose;
  $('otherBtn').onclick = choose;
  document.querySelectorAll('input[name="mode"]').forEach((r) => r.addEventListener('change', updateHint));
  FM.wireDropzone($('dropzone'), (files) => setFile(files[0]));
  FM.wireDropzone($('workspace'), (files) => setFile(files[0]));
  if (!FM.canDirectAccess) $('outFolder').disabled = true;

  window.__fmSetFile = setFile;
})();
