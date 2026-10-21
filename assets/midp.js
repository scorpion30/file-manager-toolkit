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

  // ---------- naming rule (field by field) ----------
  // Each field: {example, len: '3' | '3-5' | '', type: 'any'|'letters'|'digits', fixed: 'ARC, STR' | '', seen: [...]}
  state.ruleFields = [];
  const sepOf = () => $('ruleSep').value || '-';
  const typeOf = (v) => (/^\d+$/.test(v) ? 'digits' : /^[A-Za-z]+$/.test(v) ? 'letters' : 'any');
  /** The part of a file name the rule applies to: drops a trailing revision ("_P02") when names carry one. */
  function ruleName(base) {
    const sep = sepOf();
    if (!$('optRev').checked || sep === '_' || sep === ' ') return base;
    return base.replace(/[_\s]+[^_\s]*$/, '') || base;
  }
  function majority(values) {
    const counts = new Map();
    values.forEach((v) => counts.set(v, (counts.get(v) || 0) + 1));
    let best = null; let n = 0;
    for (const [v, c] of counts) if (c > n) { best = v; n = c; }
    return { value: best, share: values.length ? n / values.length : 0, distinct: [...counts.keys()] };
  }
  function renderRule() {
    const f = state.ruleFields;
    $('ruleTableWrap').hidden = !f.length;
    $('ruleNote').hidden = !f.length;
    const typeOpt = (t) => [['any', L('Any', 'أي حاجة')], ['letters', L('Letters', 'حروف')], ['digits', L('Digits', 'أرقام')]]
      .map(([v, label]) => `<option value="${v}"${v === t ? ' selected' : ''}>${label}</option>`).join('');
    $('ruleRows').innerHTML = f.map((x, i) => `<tr data-i="${i}">
      <td><b>${i + 1}</b></td><td><code>${esc(x.example)}</code></td>
      <td><input type="text" data-k="len" value="${esc(x.len)}" placeholder="${L('any', 'أي طول')}" style="width:70px"></td>
      <td><select data-k="type">${typeOpt(x.type)}</select></td>
      <td><input type="text" data-k="fixed" value="${esc(x.fixed)}" placeholder="${L('changes', 'بتتغيّر')}"></td>
      <td class="hint">${esc(x.seen.slice(0, 6).join(', '))}${x.seen.length > 6 ? L(` +${x.seen.length - 6} more`, ` و${x.seen.length - 6} كمان`) : ''}</td></tr>`).join('');
  }
  $('ruleRows').addEventListener('input', (e) => {
    const i = Number(e.target.closest('tr')?.dataset.i);
    if (Number.isNaN(i) || !e.target.dataset.k) return;
    state.ruleFields[i][e.target.dataset.k] = e.target.value;
  });
  $('ruleSplitBtn').addEventListener('click', () => {
    const ex = $('ruleExample').value.trim();
    if (!ex) { FM.toast(L('Type one correct name first.', 'اكتب اسم واحد صح الأول.'), 'error'); return; }
    state.ruleFields = ex.split(sepOf()).map((v) => ({ example: v, len: String(v.length), type: typeOf(v), fixed: '', seen: [] }));
    $('ruleOn').checked = true;
    renderRule();
  });
  /** Learns each field's length, type and fixed value from the names most files share. */
  $('ruleLearnBtn').addEventListener('click', () => {
    const sep = sepOf();
    let names = state.folders.flatMap((f) => f.files.map((x) => ruleName(x.base)));
    if (!names.length) names = state.lists.flatMap((l) => (l.noCol ? l.rows.map((r) => cellText(r[l.noCol]).trim()).filter(Boolean) : []));
    if (!names.length) { FM.toast(L('Add a folder of received files first.', 'ضيف فولدر الملفات المستلمة الأول.'), 'error'); return; }
    const split = names.map((n) => n.split(sep));
    const count = majority(split.map((p) => p.length)).value;
    const rows = split.filter((p) => p.length === count);
    state.ruleFields = Array.from({ length: count }, (_, i) => {
      const vals = rows.map((p) => p[i]);
      const len = majority(vals.map((v) => v.length));
      const lens = vals.map((v) => v.length);
      const type = majority(vals.map(typeOf));
      const val = majority(vals);
      return {
        example: rows[0][i],
        len: len.share >= 0.8 ? String(len.value) : `${Math.min(...lens)}-${Math.max(...lens)}`,
        type: type.share >= 0.8 ? type.value : 'any',
        fixed: val.share >= 0.8 && rows.length > 1 ? val.value : '',
        seen: val.distinct,
      };
    });
    // Show a name that already follows the learned rule as the example.
    const good = rows.find((p) => !ruleProblems(p.join(sep)).length) || rows[0];
    state.ruleFields.forEach((f, i) => { f.example = good[i]; });
    $('ruleExample').value = good.join(sep);
    $('ruleOn').checked = true;
    renderRule();
    FM.toast(L(`Learned ${count} fields from ${rows.length} of ${names.length} names. Check each field below.`, `اتعلّمنا ${count} خانات من ${rows.length} من ${names.length} اسم. راجع كل خانة تحت.`));
  });

  /** Returns the list of problems of one name against the rule ([] = OK). */
  function ruleProblems(name) {
    const f = state.ruleFields;
    const parts = name.split(sepOf());
    if (parts.length !== f.length) return [L(`Has ${parts.length} fields, should have ${f.length}`, `فيه ${parts.length} خانات، والمفروض ${f.length}`)];
    const out = [];
    parts.forEach((v, i) => {
      const spec = f[i];
      const tag = L(`Field ${i + 1} "${v}"`, `الخانة ${i + 1} "${v}"`);
      const m = String(spec.len).trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/);
      if (m) {
        const lo = Number(m[1]); const hi = Number(m[2] || m[1]);
        if (v.length < lo || v.length > hi) out.push(`${tag}: ${lo === hi ? L(`should be ${lo} characters`, `المفروض ${lo} حروف`) : L(`should be ${lo}-${hi} characters`, `المفروض من ${lo} لـ ${hi} حروف`)}`);
      }
      if (spec.type === 'digits' && !/^\d+$/.test(v)) out.push(`${tag}: ${L('should be digits only', 'المفروض أرقام بس')}`);
      if (spec.type === 'letters' && !/^[A-Za-z]+$/.test(v)) out.push(`${tag}: ${L('should be letters only', 'المفروض حروف بس')}`);
      const allowed = String(spec.fixed).split(',').map((x) => x.trim()).filter(Boolean);
      if (allowed.length && !allowed.some((a) => a.toUpperCase() === v.toUpperCase())) out.push(`${tag}: ${L(`should be ${allowed.join(' or ')}`, `المفروض ${allowed.join(' أو ')}`)}`);
    });
    return out;
  }

  // ---------- step 3: check ----------
  function check() {
    const revInName = $('optRev').checked;
    const rule = $('ruleOn').checked && state.ruleFields.length ? true : null;
    const ruleOk = (name) => !rule || !ruleProblems(ruleName(name)).length;

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
      if (rule && ruleProblems(it.no).length) { it.problems.push(L('Breaks the naming rule', 'مخالف لقاعدة التسمية')); badNames++; }
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

    // Every received file against the naming rule.
    const names = rule ? allFiles.map((f) => ({ ...f, issues: ruleProblems(ruleName(f.base)) })) : [];
    const badFiles = names.filter((n) => n.issues.length).length;

    const checks = !items.length ? [] : [
      { ok: !missing, text: missing ? L(`${missing} deliverable(s) in the MIDP have no file`, `${missing} مستند في الـ MIDP ملهوش ملف`) : L(`All ${items.length} deliverables were received`, `كل الـ ${items.length} مستند وصلوا`) },
      { ok: !extra.length, text: extra.length ? L(`${extra.length} file(s) are not in the MIDP`, `${extra.length} ملف مش موجود في الـ MIDP`) : L('Every received file is in the MIDP', 'كل الملفات المستلمة موجودة في الـ MIDP') },
    ];
    if (revInName) checks.push({ ok: !wrongRev, text: wrongRev ? L(`${wrongRev} deliverable(s) have a different revision in the file name`, `${wrongRev} مستند الـ Revision في اسمه مختلف عن القائمة`) : L('All revisions match the MIDP', 'كل الـ Revisions مطابقة للـ MIDP') });
    if (dupFiles) checks.push({ warn: true, text: L(`${dupFiles} deliverable(s) were received twice in the same format`, `${dupFiles} مستند وصل مرتين بنفس الصيغة`) });
    if (dupList) checks.push({ warn: true, text: L(`${dupList} document number(s) are listed more than once in the MIDP/TIDPs`, `${dupList} رقم مستند مكرر في الـ MIDP / TIDPs`) });
    if (rule) {
      checks.push({ ok: !badFiles, text: badFiles ? L(`${badFiles} of ${names.length} file name(s) break the naming rule`, `${badFiles} من ${names.length} ملف اسمه مخالف لقاعدة التسمية`) : L(`All ${names.length} file names follow the naming rule`, `كل الـ ${names.length} ملف أساميهم ماشية على قاعدة التسمية`) });
      if (badNames) checks.push({ ok: false, text: L(`${badNames} document number(s) in the MIDP break the naming rule`, `${badNames} رقم مستند في الـ MIDP مخالف لقاعدة التسمية`) });
    }
    state.result = { items, extra, discs, checks, received, missing, names, badFiles };
    return state.result;
  }

  function renderResult() {
    const r = state.result;
    const problems = r.checks.filter((c) => !c.ok && !c.info).length;
    $('verdict').textContent = !r.items.length ? (r.badFiles ? L(`${r.badFiles} of ${r.names.length} file names need fixing`, `${r.badFiles} من ${r.names.length} اسم ملف محتاجين يتصلحوا`) : L(`All ${r.names.length} file names are correct`, `كل الـ ${r.names.length} اسم ملف مظبوطين`))
      : problems ? L(`${r.received} of ${r.items.length} deliverables received · ${problems} thing(s) to fix`, `وصل ${r.received} من ${r.items.length} مستند · ${problems} حاجة محتاجة تتصلح`)
      : L(`All ${r.items.length} deliverables received, nothing to fix`, `كل الـ ${r.items.length} مستند وصلوا، ومفيش حاجة تتصلح`);
    $('checks').innerHTML = r.checks.map((c) => `<li class="${c.warn ? 'warn' : c.ok ? 'ok' : 'bad'}"><span class="mark">${c.warn ? '!' : c.ok ? '✓' : '✕'}</span>${esc(c.text)}</li>`).join('');
    $('discRows').innerHTML = [...r.discs].sort((a, b) => collator.compare(a[0], b[0])).map(([name, d]) =>
      `<tr><td>${esc(name)}</td><td>${d.expected}</td><td>${d.received}</td><td class="${d.missing ? 'bad-cell' : ''}">${d.missing}</td><td class="${d.rev ? 'bad-cell' : ''}">${d.rev}</td></tr>`).join('');
    $('discPanel').hidden = !r.items.length;
    $('delPanel').hidden = !r.items.length;
    renderRows();
    renderNames();
    $('extraPanel').hidden = !r.items.length || !r.extra.length;
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
  function renderNames() {
    const r = state.result;
    $('namesPanel').hidden = !r.names.length;
    const only = $('onlyBadNames').checked;
    $('nameRows').innerHTML = r.names.filter((n) => !only || n.issues.length).slice(0, 3000).map((n) => `<tr>
      <td>${esc(n.name)}</td><td>${esc(n.folder)}</td>
      <td class="${n.issues.length ? 'bad-cell' : 'ok-cell'}">${n.issues.map(esc).join('<br>') || L('OK', 'تمام')}</td></tr>`).join('');
  }
  $('onlyProblems').addEventListener('change', () => state.result && renderRows());
  $('onlyBadNames').addEventListener('change', () => state.result && renderNames());

  $('exportBtn').addEventListener('click', async () => {
    const r = state.result;
    if (!r) return;
    const ExcelJS = await FM.excel();
    const wb = new ExcelJS.Workbook();
    const sum = wb.addWorksheet('Summary');
    sum.columns = [{ header: 'Check', key: 'c', width: 70 }, { header: 'Result', key: 'r', width: 14 }];
    r.checks.forEach((c) => sum.addRow({ c: c.text, r: c.warn ? 'Warning' : c.ok ? 'OK' : 'Problem' }));
    FM.styleHeaderRow(sum);
    if (r.items.length) {
      const disc = wb.addWorksheet('By discipline');
      disc.columns = [{ header: 'Discipline / TIDP', key: 'd', width: 34 }, { header: 'Expected', key: 'e', width: 12 }, { header: 'Received', key: 'r', width: 12 }, { header: 'Missing', key: 'm', width: 12 }, { header: 'Wrong revision', key: 'w', width: 16 }];
      for (const [name, d] of r.discs) disc.addRow({ d: name, e: d.expected, r: d.received, m: d.missing, w: d.rev });
      FM.styleHeaderRow(disc);
    }
    if (r.names.length) {
      const nm = wb.addWorksheet('File names');
      const fields = state.ruleFields.map((_, i) => ({ header: `Field ${i + 1}`, key: `f${i}`, width: 12 }));
      nm.columns = [{ header: 'File', key: 'file', width: 46 }, { header: 'Folder', key: 'folder', width: 34 }, ...fields, { header: 'Result', key: 'res', width: 10 }, { header: 'What is wrong', key: 'why', width: 60 }];
      for (const n of r.names) {
        const parts = ruleName(n.base).split(sepOf());
        const row = nm.addRow({ file: n.name, folder: n.folder, ...Object.fromEntries(parts.slice(0, fields.length).map((v, i) => [`f${i}`, v])), res: n.issues.length ? 'Wrong' : 'OK', why: n.issues.join('\n') });
        // Colour the fields that break the rule.
        n.issues.forEach((t) => { const m = t.match(/(\d+)/); if (m && parts.length === fields.length) row.getCell(`f${Number(m[1]) - 1}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFADBD8' } }; });
        row.getCell('res').font = { bold: true, color: { argb: n.issues.length ? 'FFC0392B' : 'FF198754' } };
      }
      FM.styleHeaderRow(nm);
    }
    if (!r.items.length) { await FM.downloadWorkbook(wb, 'MIDP check.xlsx'); return; }
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
      if (i >= 2 && !state.lists.some((l) => l.noCol) && !($('ruleOn').checked && state.ruleFields.length)) { FM.toast(L('Add an Excel list in step 1, or set up the naming rule.', 'ضيف ملف Excel في الخطوة 1، أو اعمل قاعدة التسمية.'), 'error'); return false; }
      if (i >= 2 && !state.folders.length) { FM.toast(L('Add at least one folder of received files.', 'ضيف فولدر واحد على الأقل فيه الملفات المستلمة.'), 'error'); return false; }
      return true;
    },
    onEnter: (i) => { if (i === 2) { check(); renderResult(); } },
  });
})();
