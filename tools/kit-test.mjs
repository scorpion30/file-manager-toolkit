// Browser test helpers for the tool kit pages (used while developing, from the dev tools console):
//   const T = await import('/tools/kit-test.mjs');
//   await T.load(['Tower-A-Submission.pdf']);            // sample files from assets/samples
//   await T.set({ format: 'png', dpi: '300' });           // radio names / input ids
//   const outs = await T.run();                           // clicks the main button, waits for the result
export async function load(names, { folder = '', type = 'application/pdf', base = 'assets/samples/' } = {}) {
  const files = [];
  for (const n of names) {
    const b = await (await fetch(base + n)).blob();
    files.push({ file: new File([b], n.split('/').pop(), { type: b.type || type }), folder });
  }
  await window.__kit.addFiles(files);
  await wait(() => window.__kit.items.every((i) => i.loaded), 20000);
  return window.__kit.items.map((i) => ({ name: i.file.name, pages: i.pages, error: i.error || '' }));
}
export async function addBlobs(list) {
  await window.__kit.addFiles(list.map(([blob, name, folder]) => ({ file: new File([blob], name, { type: blob.type }), folder: folder || '' })));
  await wait(() => window.__kit.items.every((i) => i.loaded), 20000);
}
export function set(values) {
  for (const [k, v] of Object.entries(values)) {
    const radio = document.querySelector(`input[name="${k}"][value="${v}"]`);
    if (radio) { radio.checked = true; radio.dispatchEvent(new Event('change', { bubbles: true })); continue; }
    const el = document.getElementById(k);
    if (!el) throw new Error('no option ' + k);
    if (el.type === 'checkbox') el.checked = !!v; else el.value = v;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }
}
export const wait = (fn, ms = 60000) => new Promise((resolve, reject) => {
  const t0 = Date.now();
  const tick = () => {
    let ok = false;
    try { ok = fn(); } catch { ok = false; }
    if (ok) resolve(ok); else if (Date.now() - t0 > ms) reject(new Error('timeout')); else setTimeout(tick, 100);
  };
  tick();
});
export async function run(ms = 120000) {
  const toasts = () => [...document.querySelectorAll('.toast')].map((t) => t.textContent);
  const before = toasts().length;
  document.getElementById('kitRun').click();
  await wait(() => !document.getElementById('kitDone').hidden || (document.getElementById('kitBusy').hidden && toasts().length > before), ms);
  if (document.getElementById('kitDone').hidden) return { error: toasts().slice(before) };
  const outs = window.__kit.outputs;
  return outs.map((o) => ({ name: (o.folder ? o.folder + '/' : '') + o.name, size: o.blob.size, type: o.blob.type, note: o.note || '' }));
}
export function back() { document.getElementById('kitBack').click(); }
export function clear() { document.querySelector('[data-kit="clear"]').click(); }
/** Opens an output PDF with mupdf: page count, sizes, text of page 1, outline. */
export async function inspect(i = 0, password = '') {
  const m = await FM.mupdf();
  const o = window.__kit.outputs[i];
  const doc = m.Document.openDocument(new Uint8Array(await o.blob.arrayBuffer()), 'application/pdf');
  const locked = doc.needsPassword();
  if (locked && password) doc.authenticatePassword(password);
  if (doc.needsPassword() && !password) return { locked, encryption: doc.getMetaData('encryption') };
  const n = doc.countPages();
  const pages = [];
  for (let p = 0; p < Math.min(n, 6); p++) {
    const pg = doc.loadPage(p);
    pages.push({ bounds: pg.getBounds().map(Math.round), text: pg.toStructuredText('').asText().trim().slice(0, 200) });
  }
  return { locked, encryption: doc.getMetaData('encryption'), pages: n, first: pages, outline: doc.loadOutline() };
}
/** Data URL of a rendered page of an output PDF, or of an output image. */
export async function picture(i = 0, page = 0, scale = 0.4) {
  const m = await FM.mupdf();
  const o = window.__kit.outputs[i];
  if (/image\//.test(o.blob.type)) return URL.createObjectURL(o.blob);
  const doc = m.Document.openDocument(new Uint8Array(await o.blob.arrayBuffer()), 'application/pdf');
  const pix = doc.loadPage(page).toPixmap(m.Matrix.scale(scale, scale), m.ColorSpace.DeviceRGB, false, true);
  return URL.createObjectURL(new Blob([pix.asPNG().slice()], { type: 'image/png' }));
}
