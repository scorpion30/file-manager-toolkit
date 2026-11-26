/* Protect PDF: password (AES-256 / AES-128) and permissions, for many files at once. */
(() => {
  'use strict';
  const { $ } = FM;
  const val = (name) => (document.querySelector(`input[name="${name}"]:checked`) || {}).value;

  /** PDF permission flags (the /P value) from the ticked boxes. */
  function permissions() {
    let p = 0xFFFFF0C0 | 512; // reserved bits + accessibility (screen readers) always allowed
    if ($('pPrint').checked) p |= 4 | 2048;
    if ($('pCopy').checked) p |= 16;
    if ($('pEdit').checked) p |= 8 | 1024;
    if ($('pAnnot').checked) p |= 32 | 256;
    return p | 0;
  }
  const randomPw = () => Array.from(crypto.getRandomValues(new Uint8Array(18)), (b) => b.toString(16).padStart(2, '0')).join('');
  // mupdf's option string is comma separated: a password cannot contain a comma.
  const clean = (pw) => pw.replace(/,/g, '');

  async function run(items, ui) {
    const m = await FM.mupdf();
    const pw = $('pw1').value;
    const owner = $('pwOwner').value || randomPw();
    const opts = `encrypt=${val('enc')},user-password=${clean(pw)},owner-password=${clean(owner)},permissions=${permissions()},garbage=1,compress`;
    const out = [];
    for (const [k, it] of items.entries()) {
      ui.progress(k, items.length, it.file.name);
      await ui.yield();
      const doc = await FM.openPdf(it.file);
      const bytes = doc.saveToBuffer(opts).asUint8Array().slice();
      out.push({ name: FMKit.safeName(FMKit.baseOf(it.file.name) + '-protected.pdf'), bytes, type: 'application/pdf', folder: it.folder });
    }
    ui.progress(1, 1);
    return out;
  }

  FMKit.init({
    key: 'protect', accept: 'pdf', runLabel: 'Protect PDF', makes: null, busyTitle: 'Encrypting…',
    run,
    zipName: () => 'protected',
    validate() {
      const a = $('pw1').value;
      if (!a) return 'Type a password.';
      if (a.includes(',')) return 'The password cannot contain a comma (,).';
      if (a !== $('pw2').value) return 'The two passwords are not the same.';
      if ($('pwOwner').value.includes(',')) return 'The owner password cannot contain a comma (,).';
      return true;
    },
    doneText: () => 'Keep the password safe: it cannot be recovered.',
  });
  $('showPw').addEventListener('change', (e) => {
    ['pw1', 'pw2', 'pwOwner'].forEach((id) => { $(id).type = e.target.checked ? 'text' : 'password'; });
  });
})();
