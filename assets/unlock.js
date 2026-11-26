/* Unlock PDF: removes the password (when it is known) and the print / copy / edit restrictions. */
(() => {
  'use strict';
  const { $ } = FM;

  async function run(items, ui) {
    const m = await FM.mupdf();
    const pw = $('pw').value;
    const out = [];
    const failed = [];
    for (const [k, it] of items.entries()) {
      ui.progress(k, items.length, it.file.name);
      await ui.yield();
      const doc = m.Document.openDocument(new Uint8Array(await it.file.arrayBuffer()), 'application/pdf');
      const enc = doc.getMetaData('encryption');
      if (doc.needsPassword() && !doc.authenticatePassword(pw)) { failed.push(it.file.name); continue; }
      const bytes = doc.asPDF().saveToBuffer('encrypt=none,garbage=1,compress').asUint8Array().slice();
      out.push({
        name: FMKit.safeName(FMKit.baseOf(it.file.name) + '-unlocked.pdf'), bytes, type: 'application/pdf', folder: it.folder,
        note: !enc || enc === 'None' ? 'was not protected' : it.locked ? 'password removed' : 'restrictions removed', noteKind: !enc || enc === 'None' ? 'warn' : 'good',
      });
    }
    ui.progress(1, 1);
    if (failed.length && !out.length) throw new Error(pw ? `Wrong password for ${failed.join(', ')}.` : 'These PDFs need their password to open. Type it, then try again.');
    if (failed.length) FM.toast(pw ? `Wrong password, not unlocked: ${failed.join(', ')}` : `These need their password to open, not unlocked: ${failed.join(', ')}`, 'error');
    return out;
  }

  FMKit.init({
    key: 'unlock', accept: 'pdf', runLabel: 'Unlock PDF', makes: 'pdf', busyTitle: 'Unlocking…', allowLocked: true,
    run,
    zipName: () => 'unlocked',
  });
  $('showPw').addEventListener('change', (e) => { $('pw').type = e.target.checked ? 'text' : 'password'; });
})();
