/* MIDP Check: compares every received file (any type) with the deliverables listed in the MIDP or the
 * discipline TIDPs (Excel). Reports missing deliverables, files not in the MIDP, revisions that differ
 * from the list, and names that break an optional naming rule. Everything runs in the browser. */
(() => {
  'use strict';
  const { $, esc, collator } = FM;
  const ar = document.documentElement.lang === 'ar';
  const L = (en, arText) => (ar ? arText : en);

  const state = {
    lists: [],   // {id, fileName, label, wb, sheet, headers:[{col,name}], rows:[[...]], headerRow, noCol, revCol, titleCol, discCol}
    folders: [], // {name, files:[{name, base, ext, folder}]}
    result: null,
  };
  let nextId = 1;

  // ---------- helpers ----------
  const cellText = (v) => {
    if (v == null) return '';
    if (typeof v === 'object') {
      if (v.richText) return v.richText.map((t) => t.text).join('');
      if ('result' in v) return cellText(v.result);
      if ('text' in v) return String(v.text);
      if (v instanceof Date) return v.toISOString().slice(0, 10);
    }
    return String(v);
  };
  const key = (s) => String(s || '').toUpperCase().replace(/\s+/g, '').trim();
  const SEP = /[\s_.\-()[\]]/;

  function guessColumn(headers, patterns) {
    for (const re of patterns) {
      const h = headers.find((x) => re.test(x.name));
      if (h) return h.col;
    }
    return '';
  }

  /** Reads one worksheet: finds the header row (the top row with the most text cells) and the data rows. */
  function readSheet(ws) {
    const rows = [];
    ws.eachRow({ includeEmpty: false }, (row, n) => { rows[n] = row.values; });
    let headerRow = 1;
    let best = -1;
    for (let n = 1; n <= Math.min(20, rows.length - 1); n++) {
      const count = (rows[n] || []).filter((v) => cellText(v).trim() && Number.isNaN(Number(cellText(v)))).length;
      if (count > best) { best = count; headerRow = n; }
    }
    const headers = [];
    (rows[headerRow] || []).forEach((v, col) => { const t = cellText(v).trim(); if (t) headers.push({ col, name: t }); });
    const data = rows.slice(headerRow + 1).filter(Boolean);
    return { headers, data, headerRow };
  }

  function pickSheet(list, name) {
    const ws = list.wb.getWorksheet(name);
    const { headers, data, headerRow } = readSheet(ws);
    Object.assign(list, { sheet: name, headers, rows: data, headerRow });
    list.noCol = guessColumn(headers, [/file\s*name/i, /container|document\s*(no|number|id|code)/i, /doc\.?\s*(no|number)/i, /drawing\s*(no|number)/i, /^(no\.?|number|ref)/i, /رقم|اسم الملف/]);
    list.revCol = guessColumn(headers, [/^rev/i, /revision/i, /الإصدار|المراجعة/]);
    list.titleCol = guessColumn(headers, [/title/i, /description/i, /name$/i, /العنوان|الوصف/]);
    list.discCol = guessColumn(headers, [/discipline/i, /role/i, /originator/i, /التخصص|القسم/]);
  }

  // ---------- step 1: lists ----------
  function renderLists() {
    const host = $('lists');
    host.innerHTML = state.lists.map((l) => {
      const opts = (sel) => ['<option value="">—</option>', ...l.headers.map((h) => `<option value="${h.col}"${String(h.col) === String(sel) ? ' selected' : ''}>${esc(h.name)}</option>`)].join('');
      const sheets = l.wb.worksheets.map((w) => `<option${w.name === l.sheet ? ' selected' : ''}>${esc(w.name)}</option>`).join('');
      const count = l.noCol ? l.rows.filter((r) => cellText(r[l.noCol]).trim()).length : 0;
      return `<div class="midp-list" data-id="${l.id}">
        <div class="midp-list-head"><b>${esc(l.fileName)}</b><span class="spacer"></span><button class="icon-btn danger" data-remove="${l.id}" title="${L('Remove', 'إزالة')}">✕</button></div>
        <div class="midp-grid">
          <div class="field"><label>${L('Discipline / TIDP name', 'اسم القسم / الـ TIDP')}</label><input type="text" data-k="label" value="${esc(l.label)}"></div>
          <div class="field"><label>${L('Sheet', 'الورقة')}</label><select data-k="sheet">${sheets}</select></div>
          <div class="field"><label>${L('Document number column', 'عمود رقم المستند')}</label><select data-k="noCol">${opts(l.noCol)}</select></div>
          <div class="field"><label>${L('Revision column', 'عمود الـ Revision')}</label><select data-k="revCol">${opts(l.revCol)}</select></div>
          <div class="field"><label>${L('Title column', 'عمود العنوان')}</label><select data-k="titleCol">${opts(l.titleCol)}</select></div>
          <div class="field"><label>${L('Discipline column (optional)', 'عمود القسم (اختياري)')}</label><select data-k="discCol">${opts(l.discCol)}</select></div>
        </div>
        <p class="hint">${L(`${count} deliverables found`, `${count} مستند في القائمة`)}</p>
      </div>`;
    }).join('');
    const total = state.lists.reduce((s, l) => s + (l.noCol ? l.rows.filter((r) => cellText(r[l.noCol]).trim()).length : 0), 0);
    $('listsSummary').textContent = state.lists.length ? L(`${state.lists.length} file(s), ${total} deliverables`, `${state.lists.length} ملف، ${total} مستند`) : '';
  }

  $('lists').addEventListener('change', (e) => {
    const box = e.target.closest('.midp-list');
    if (!box) return;
    const l = state.lists.find((x) => x.id === Number(box.dataset.id));
    const k = e.target.dataset.k;
    if (k === 'sheet') pickSheet(l, e.target.value);
    else if (k === 'label') l.label = e.target.value;
    else l[k] = e.target.value;
    renderLists();
  });
  $('lists').addEventListener('click', (e) => {
    const id = e.target.closest('[data-remove]')?.dataset.remove;
    if (!id) return;
    state.lists = state.lists.filter((l) => l.id !== Number(id));
    renderLists();
  });

  $('addListBtn').addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xlsm';
    input.multiple = true;
    input.addEventListener('change', async () => {
      const ExcelJS = await FM.excel();
      for (const file of input.files) {
        try {
          const wb = new ExcelJS.Workbook();
          await wb.xlsx.load(await file.arrayBuffer());
          const list = { id: nextId++, fileName: file.name, label: file.name.replace(/\.[^.]+$/, ''), wb };
          // Prefer a sheet whose name mentions MIDP/TIDP/register, else the first one.
          const ws = wb.worksheets.find((w) => /midp|tidp|register|deliverable|list/i.test(w.name)) || wb.worksheets[0];
          pickSheet(list, ws.name);
          state.lists.push(list);
        } catch (err) {
          FM.toast(L(`Could not read ${file.name}`, `ماقدرناش نقرأ ${file.name}`), 'error');
        }
      }
      renderLists();
    });
    input.click();
  });

  // ---------- step 2: folders ----------
  function renderFolders() {
    const n = state.folders.reduce((s, f) => s + f.files.length, 0);
    $('foldersLine').hidden = !state.folders.length;
    $('fileCount').textContent = n;
    $('foldersText').textContent = L(`files in ${state.folders.length} folder(s)`, `ملف في ${state.folders.length} فولدر`);
    $('folderList').innerHTML = state.folders.map((f, i) => `<li><span class="fname">📁 ${esc(f.name)}</span><span class="st">${f.files.length}</span><button class="icon-btn danger" data-folder="${i}">✕</button></li>`).join('');
  }
  $('addFolderBtn').addEventListener('click', async () => {
    const picked = await FM.pickFolder({ id: 'midp' });
    if (!picked) return;
    const listing = picked.mode === 'fs' ? await FM.scanDirectory(picked.handle) : FM.scanFileList(picked.fileList);
    const sub = $('optSub').checked;
    const files = listing.files.filter((f) => (sub || !f.folder) && !/^(~\$|\.|desktop\.ini$|thumbs\.db$)/i.test(f.name))
      .map((f) => ({ name: f.name, base: f.base, ext: (f.ext || '').replace(/^\./, '').toLowerCase(), folder: (listing.rootName + (f.folder ? '/' + f.folder : '')) }));
    state.folders.push({ name: listing.rootName, files });
    renderFolders();
  });
  $('folderList').addEventListener('click', (e) => {
    const i = e.target.closest('[data-folder]')?.dataset.folder;
    if (i == null) return;
    state.folders.splice(Number(i), 1);
    renderFolders();
  });
  $('clearFoldersBtn').addEventListener('click', () => { state.folders = []; renderFolders(); });

  // ---------- step 3: check ----------
  function check() {
    const revInName = $('optRev').checked;
    const rule = $('ruleOn').checked ? { sep: $('ruleSep').value || '-', n: Number($('ruleFields').value) || 0 } : null;
    const ruleOk = (name) => !rule || name.split(rule.sep).length === rule.n;

    // Deliverables from all lists.
    const items = [];
    const seenNos = new Map();
    for (const l of state.lists) {
      if (!l.noCol) continue;
      for (const r of l.rows) {
        const no = cellText(r[l.noCol]).trim();
        if (!no) continue;
        const it = {
          no, k: key(no),
          rev: l.revCol ? cellText(r[l.revCol]).trim() : '',
          title: l.titleCol ? cellText(r[l.titleCol]).trim() : '',
          disc: (l.discCol ? cellText(r[l.discCol]).trim() : '') || l.label,
          files: [], problems: [],
        };
        it.dupInList = seenNos.has(it.k);
        seenNos.set(it.k, (seenNos.get(it.k) || 0) + 1);
        items.push(it);
      }
    }
    // Longest numbers first so "A-101" does not swallow "A-1011".
    const byLength = [...items].sort((a, b) => b.k.length - a.k.length);
    const byKey = new Map(items.map((it) => [it.k, it]));

    const allFiles = state.folders.flatMap((f) => f.files);
    const extra = [];
    for (const f of allFiles) {
      const b = key(f.base);
      let it = byKey.get(b);
      let suffix = '';
      if (!it) {
        it = byLength.find((x) => b.startsWith(x.k) && SEP.test(f.base.charAt(x.no.replace(/\s+/g, '').length) || ' '));
        if (it) suffix = f.base.slice(it.no.replace(/\s+/g, '').length);
      }
      if (!it) { extra.push({ ...f, problem: ruleOk(f.base) ? L('Not in the MIDP', 'مش موجود في الـ MIDP') : L('Not in the MIDP · breaks the naming rule', 'مش في الـ MIDP · مخالف لقاعدة التسمية') }); continue; }
      it.files.push({ ...f, suffix });
    }

    let missing = 0; let wrongRev = 0; let dupFiles = 0; let badNames = 0; let dupList = 0;
    for (const it of items) {
      if (!it.files.length) { it.problems.push(L('Missing', 'ناقص')); missing++; }
      const exts = it.files.map((f) => f.ext);
      if (exts.length !== new Set(exts).size) { it.problems.push(L('Same format received twice', 'نفس الصيغة مستلمة مرتين')); dupFiles++; }
      if (revInName && it.rev && it.files.length) {
        const re = new RegExp(`(^|[\\s_.\\-()\\[\\]])${it.rev.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[\\s_.\\-()\\[\\]])`, 'i');
        const bad = it.files.filter((f) => !re.test(f.suffix || ''));
        if (bad.length) { it.problems.push(L(`Revision is not ${it.rev}`, `الـ Revision مش ${it.rev}`)); it.wrongRev = true; wrongRev++; }
      }
      if (rule && !ruleOk(it.no)) { it.problems.push(L('Breaks the naming rule', 'مخالف لقاعدة التسمية')); badNames++; }
      if (it.dupInList) { it.problems.push(L('Listed twice in the MIDP', 'مكرر في الـ MIDP')); dupList++; }
    }

    const received = items.filter((it) => it.files.length).length;
    const discs = new Map();
    for (const it of items) {
      const d = discs.get(it.disc) || { expected: 0, received: 0, missing: 0, rev: 0 };
      d.expected++;
      if (it.files.length) d.received++; else d.missing++;
      if (it.wrongRev) d.rev++;
      discs.set(it.disc, d);
    }

    const checks = [
      { ok: !missing, text: missing ? L(`${missing} deliverable(s) in the MIDP have no file`, `${missing} مستند في الـ MIDP ملهوش ملف`) : L(`All ${items.length} deliverables were received`, `كل الـ ${items.length} مستند وصلوا`) },
      { ok: !extra.length, text: extra.length ? L(`${extra.length} file(s) are not in the MIDP`, `${extra.length} ملف مش موجود في الـ MIDP`) : L('Every received file is in the MIDP', 'كل الملفات المستلمة موجودة في الـ MIDP') },
    ];
    if (revInName) checks.push({ ok: !wrongRev, text: wrongRev ? L(`${wrongRev} deliverable(s) have a different revision in the file name`, `${wrongRev} مستند الـ Revision في اسمه مختلف عن القائمة`) : L('All revisions match the MIDP', 'كل الـ Revisions مطابقة للـ MIDP') });
    if (dupFiles) checks.push({ warn: true, text: L(`${dupFiles} deliverable(s) were received twice in the same format`, `${dupFiles} مستند وصل مرتين بنفس الصيغة`) });
    if (dupList) checks.push({ warn: true, text: L(`${dupList} document number(s) are listed more than once in the MIDP/TIDPs`, `${dupList} رقم مستند مكرر في الـ MIDP / TIDPs`) });
    if (rule) {
      const badFiles = extra.filter((e) => /naming|التسمية/.test(e.problem)).length;
      checks.push({ ok: !badNames && !badFiles, text: badNames || badFiles ? L(`${badNames + badFiles} name(s) break the naming rule`, `${badNames + badFiles} اسم مخالف لقاعدة التسمية`) : L('All names follow the naming rule', 'كل الأسامي ماشية على قاعدة التسمية') });
    }
    state.result = { items, extra, discs, checks, received, missing };
    return state.result;
  }

  function renderResult() {
    const r = state.result;
    const problems = r.checks.filter((c) => !c.ok && !c.info).length;
    $('verdict').textContent = !r.items.length ? L('Add a deliverables list first', 'ضيف قائمة المستندات الأول')
      : problems ? L(`${r.received} of ${r.items.length} deliverables received · ${problems} thing(s) to fix`, `وصل ${r.received} من ${r.items.length} مستند · ${problems} حاجة محتاجة تتصلح`)
      : L(`All ${r.items.length} deliverables received, nothing to fix`, `كل الـ ${r.items.length} مستند وصلوا، ومفيش حاجة تتصلح`);
    $('checks').innerHTML = r.checks.map((c) => `<li class="${c.warn ? 'warn' : c.ok ? 'ok' : 'bad'}"><span class="mark">${c.warn ? '!' : c.ok ? '✓' : '✕'}</span>${esc(c.text)}</li>`).join('');
    $('discRows').innerHTML = [...r.discs].sort((a, b) => collator.compare(a[0], b[0])).map(([name, d]) =>
      `<tr><td>${esc(name)}</td><td>${d.expected}</td><td>${d.received}</td><td class="${d.missing ? 'bad-cell' : ''}">${d.missing}</td><td class="${d.rev ? 'bad-cell' : ''}">${d.rev}</td></tr>`).join('');
    renderRows();
    $('extraPanel').hidden = !r.extra.length;
    $('extraRows').innerHTML = r.extra.map((f) => `<tr><td>${esc(f.name)}</td><td>${esc(f.folder)}</td><td>${esc(f.problem)}</td></tr>`).join('');
  }
  function renderRows() {
    const only = $('onlyProblems').checked;
    const rows = state.result.items.filter((it) => !only || it.problems.length);
    $('rows').innerHTML = rows.slice(0, 3000).map((it) => `<tr>
      <td>${esc(it.no)}</td><td>${esc(it.title)}</td><td>${esc(it.disc)}</td><td>${esc(it.rev)}</td>
      <td>${it.files.map((f) => `<span class="tag ext-tag">${esc(f.ext.toUpperCase())}</span>`).join('') || '—'}</td>
      <td class="${it.problems.length ? 'bad-cell' : 'ok-cell'}">${esc(it.problems.join(' · ') || L('OK', 'تمام'))}</td></tr>`).join('');
  }
  $('onlyProblems').addEventListener('change', () => state.result && renderRows());

  $('exportBtn').addEventListener('click', async () => {
    const r = state.result;
    if (!r) return;
    const ExcelJS = await FM.excel();
    const wb = new ExcelJS.Workbook();
    const sum = wb.addWorksheet('Summary');
    sum.columns = [{ header: 'Check', key: 'c', width: 70 }, { header: 'Result', key: 'r', width: 14 }];
    r.checks.forEach((c) => sum.addRow({ c: c.text, r: c.warn ? 'Warning' : c.ok ? 'OK' : 'Problem' }));
    FM.styleHeaderRow(sum);
    const disc = wb.addWorksheet('By discipline');
    disc.columns = [{ header: 'Discipline / TIDP', key: 'd', width: 34 }, { header: 'Expected', key: 'e', width: 12 }, { header: 'Received', key: 'r', width: 12 }, { header: 'Missing', key: 'm', width: 12 }, { header: 'Wrong revision', key: 'w', width: 16 }];
    for (const [name, d] of r.discs) disc.addRow({ d: name, e: d.expected, r: d.received, m: d.missing, w: d.rev });
    FM.styleHeaderRow(disc);
    const del = wb.addWorksheet('Deliverables');
    del.columns = [{ header: 'Document No.', key: 'no', width: 34 }, { header: 'Title', key: 't', width: 40 }, { header: 'Discipline', key: 'd', width: 22 }, { header: 'Rev.', key: 'rev', width: 8 }, { header: 'Files received', key: 'f', width: 50 }, { header: 'Status', key: 's', width: 40 }];
    for (const it of r.items) del.addRow({ no: it.no, t: it.title, d: it.disc, rev: it.rev, f: it.files.map((f) => f.name).join('\n'), s: it.problems.join('; ') || 'OK' });
    FM.styleHeaderRow(del);
    const ex = wb.addWorksheet('Not in MIDP');
    ex.columns = [{ header: 'File', key: 'f', width: 50 }, { header: 'Folder', key: 'p', width: 50 }, { header: 'Problem', key: 'x', width: 40 }];
    for (const f of r.extra) ex.addRow({ f: f.name, p: f.folder, x: f.problem });
    FM.styleHeaderRow(ex);
    await FM.downloadWorkbook(wb, 'MIDP check.xlsx');
  });

  FM.wizard({
    canEnter: (i) => {
      if (i >= 1 && !state.lists.some((l) => l.noCol)) { FM.toast(L('Add an Excel list and pick its document number column first.', 'ضيف ملف Excel واختار عمود رقم المستند الأول.'), 'error'); return false; }
      if (i >= 2 && !state.folders.length) { FM.toast(L('Add at least one folder of received files.', 'ضيف فولدر واحد على الأقل فيه الملفات المستلمة.'), 'error'); return false; }
      return true;
    },
    onEnter: (i) => { if (i === 2) { check(); renderResult(); } },
  });
})();
