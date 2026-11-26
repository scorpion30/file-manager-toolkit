/* OCR PDF: reads scanned pages with Tesseract (Arabic, English and more) and lays an invisible text
 * layer over each page, so the PDF can be searched and copied. The pages themselves are not touched. */
(() => {
  'use strict';
  const P = window.PdfOps;
  const { $ } = FM;
  const val = (name) => (document.querySelector(`input[name="${name}"]:checked`) || {}).value;

  function pagesIn(spec, count) {
    if (!spec.trim()) return [...Array(count).keys()];
    try { return P.parsePages(spec, count); } catch (e) {
      if (/outside/.test(e.message)) return P.parsePages(spec, 100000).filter((i) => i < count);
      throw e;
    }
  }
  const langs = () => [...document.querySelectorAll('input[name="lang"]:checked')].map((x) => x.value);

  let worker = null; let workerLang = '';
  async function getWorker(lang, ui) {
    if (worker && workerLang === lang) return worker;
    if (worker) { await worker.terminate(); worker = null; }
    ui.progress(0, 1, 'Loading the reading engine and language files (first time only)…');
    const Tesseract = await FM.tesseract();
    worker = await Tesseract.createWorker(lang, 1);
    workerLang = lang;
    return worker;
  }

  /** Concatenated content stream(s) of a page object. */
  function contentOf(pageObj) {
    const c = pageObj.get('Contents');
    if (!c || c.isNull()) return '';
    if (c.isArray()) { let s = ''; c.forEach((x) => { s += x.readStream().asString() + '\n'; }); return s; }
    return c.readStream().asString();
  }

  /** Puts Tesseract's text-only page (an invisible text layer) over a page of doc, scaled to fit. */
  function addTextLayer(m, doc, page, textPdf) {
    const src = new m.PDFDocument(textPdf);
    const sp = src.findPage(0);
    const box = sp.getInheritable('MediaBox');
    const tw = box.get(2).asNumber() - box.get(0).asNumber();
    const th = box.get(3).asNumber() - box.get(1).asNumber();
    const content = contentOf(sp);
    if (!/Tj|TJ/.test(content)) return 0; // nothing was read on this page
    const res = doc.graftObject(sp.getInheritable('Resources'));
    const bbox = doc.newArray();
    [0, 0, tw, th].forEach((v) => bbox.push(v));
    const dict = doc.newDictionary();
    dict.put('Type', doc.newName('XObject'));
    dict.put('Subtype', doc.newName('Form'));
    dict.put('BBox', bbox);
    dict.put('Resources', res);
    const form = doc.addStream(content, dict);
    const name = P.addResource(doc, page.getObject(), 'XObject', form);
    const { W, H } = P.pageSpace(m, page);
    P.appendContent(m, doc, page, `${P.num(W / tw)} 0 0 ${P.num(H / th)} 0 0 cm /${name} Do`);
    return 1;
  }

  async function run(items, ui) {
    const lang = langs().join('+');
    if (!lang) throw new Error('Tick at least one language.');
    const m = await FM.mupdf();
    const dpi = Number(val('dpi'));
    const skip = $('skipText').checked;
    const w = await getWorker(lang, ui);
    const out = [];
    for (const [k, it] of items.entries()) {
      const doc = await FM.openPdf(it.file);
      const n = doc.countPages();
      const list = pagesIn($('optPages').value, n);
      let read = 0; let had = 0; let words = 0;
      for (const [j, i] of list.entries()) {
        ui.progress(k + j / list.length, items.length, `${it.file.name} · reading page ${i + 1} of ${n}`);
        await ui.yield();
        const page = doc.loadPage(i);
        if (skip && page.toStructuredText('').asText().replace(/\s/g, '').length > 30) { had++; continue; }
        const png = P.render(m, page, dpi, 'gray').asPNG().slice();
        const { data } = await w.recognize(new Blob([png], { type: 'image/png' }), { pdfTitle: 'ocr', pdfTextOnly: true }, { pdf: true, text: true });
        words += (data.text || '').split(/\s+/).filter(Boolean).length;
        read += addTextLayer(m, doc, page, new Uint8Array(data.pdf));
      }
      const bytes = doc.saveToBuffer('garbage=1,compress').asUint8Array().slice();
      let note = `${read} page(s) made searchable`;
      if (had) note += `, ${had} already had text`;
      out.push({ name: FMKit.safeName(FMKit.baseOf(it.file.name) + '-searchable.pdf'), bytes, type: 'application/pdf', folder: it.folder, note, noteKind: read ? 'good' : 'warn', words });
    }
    ui.progress(1, 1);
    return out;
  }

  FMKit.init({
    key: 'ocr', accept: 'pdf', runLabel: 'Make searchable', makes: 'pdf', busyTitle: 'Reading the pages…',
    run,
    zipName: () => 'searchable',
    doneText: (outs) => {
      const words = outs.reduce((s, x) => s + (x.words || 0), 0);
      return words ? `About ${words.toLocaleString('en')} words found. Open the PDF and press Ctrl+F to search it.` : 'No new text was found.';
    },
    estimate: async (items) => {
      const pages = items.reduce((s, it) => s + (it.pages || 0), 0);
      const sec = Math.max(1, Math.round(pages * (val('dpi') === '300' ? 4 : 2.5)));
      return pages ? `${pages} page(s) · about ${sec < 90 ? `${sec} seconds` : `${Math.round(sec / 60)} minutes`}` : '';
    },
  });
})();
