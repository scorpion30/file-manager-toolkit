/* Rotate PDF: all pages, only landscape / portrait ones, or chosen pages; per-file turn buttons. */
(() => {
  'use strict';
  const P = window.PdfOps;
  const { $ } = FM;
  const val = (name) => (document.querySelector(`input[name="${name}"]:checked`) || {}).value;

  let kit;
  function syncAll() {
    const a = Number(val('angle'));
    kit.items.forEach((it) => { it.rot = a; });
    kit.render();
  }
  function paint() { $('optPages').hidden = val('which') !== 'pick'; }

  function pagesIn(spec, count) {
    try { return P.parsePages(spec, count); } catch (e) {
      if (/outside/.test(e.message)) return P.parsePages(spec, 100000).filter((i) => i < count);
      throw e;
    }
  }

  async function run(items, ui) {
    const m = await FM.mupdf();
    const which = val('which');
    const out = [];
    for (const [k, it] of items.entries()) {
      ui.progress(k, items.length, it.file.name);
      await ui.yield();
      const doc = await FM.openPdf(it.file);
      const n = doc.countPages();
      const pick = which === 'pick' ? new Set(pagesIn($('optPages').value, n)) : null;
      const deg = ((it.rot == null ? Number(val('angle')) : it.rot) % 360 + 360) % 360;
      let turned = 0;
      for (let i = 0; i < n; i++) {
        if (pick && !pick.has(i)) continue;
        const page = doc.loadPage(i);
        if (which === 'landscape' || which === 'portrait') {
          const b = page.getBounds();
          const land = b[2] - b[0] > b[3] - b[1];
          if ((which === 'landscape') !== land) continue;
        }
        if (deg) { P.setRotation(page, P.getRotation(page) + deg); turned++; }
      }
      const bytes = doc.saveToBuffer('garbage=1,compress').asUint8Array().slice();
      out.push({ name: FMKit.safeName(FMKit.baseOf(it.file.name) + '-rotated.pdf'), bytes, type: 'application/pdf', folder: it.folder, note: `${turned} page(s) turned`, noteKind: turned ? 'good' : 'warn' });
    }
    ui.progress(1, 1);
    return out;
  }

  kit = FMKit.init({
    key: 'rotate', accept: 'pdf', runLabel: 'Rotate PDF', makes: 'pdf', busyTitle: 'Rotating…',
    run,
    zipName: () => 'rotated',
    itemButtons: () => '<button type="button" data-act="turn" title="Turn this file 90° more" aria-label="Turn this file">↻</button>',
    onItemAction(act, it) { if (act === 'turn') it.rot = ((it.rot == null ? Number(val('angle')) : it.rot) + 90) % 360; },
    load: async (it) => { it.rot = Number(val('angle')); },
  });
  document.querySelectorAll('input[name="angle"]').forEach((r) => r.addEventListener('change', syncAll));
  $('kitOpts').addEventListener('change', paint);
  paint();
})();
