/* Invoice generator (invoice-generator.html): form on one side, a live A4 invoice on the other.
 * The invoice itself is in English, Arabic or both (its own labels, not the page language), with VAT,
 * discount, logo and the total in words (assets/words.js). "Download PDF" prints only the invoice:
 * the browser's Save as PDF keeps Arabic text sharp and selectable.
 * Everything is kept in localStorage on this device; nothing is uploaded. */
(() => {
  const $ = (id) => document.getElementById(id);
  const paper = $('invPaper');
  if (!paper || !window.FMWords) return;
  const T = (s) => (window.FMLang && FMLang.t ? FMLang.t(s) : s);
  const KEY = 'fm-invoice-v1';
  const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const lines = (s) => esc(s).replace(/\n/g, '<br>');

  const L = {
    en: { inv: 'Invoice', tax: 'Tax invoice', no: 'Invoice No.', date: 'Date', due: 'Due date', to: 'Bill to', trn: 'TRN', tel: 'Tel', mail: 'Email',
      desc: 'Description', qty: 'Qty', price: 'Unit price', amt: 'Amount', sub: 'Subtotal', disc: 'Discount', vat: 'VAT', total: 'Total',
      words: 'Amount in words', notes: 'Notes', thanks: 'Thank you for your business.', phS: 'Your business name', phC: 'Customer name', phI: 'Item' },
    ar: { inv: 'فاتورة', tax: 'فاتورة ضريبية', no: 'رقم الفاتورة', date: 'التاريخ', due: 'تاريخ الاستحقاق', to: 'فاتورة إلى', trn: 'الرقم الضريبي', tel: 'هاتف', mail: 'البريد',
      desc: 'الوصف', qty: 'الكمية', price: 'سعر الوحدة', amt: 'المبلغ', sub: 'المجموع', disc: 'الخصم', vat: 'ضريبة القيمة المضافة', total: 'الإجمالي',
      words: 'المبلغ بالحروف', notes: 'ملاحظات', thanks: 'شكراً لتعاملكم معنا.', phS: 'اسم نشاطك التجاري', phC: 'اسم العميل', phI: 'صنف' },
  };

  function parse(s) {
    s = String(s ?? '').trim().replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/٫/g, '.').replace(/[\s٬]/g, '');
    if (s.includes(',') && !s.includes('.')) s = /,\d{3}$/.test(s) ? s.replace(/,/g, '') : s.replace(',', '.');
    else s = s.replace(/,/g, '');
    const n = Number(s);
    return s === '' || !isFinite(n) ? 0 : n;
  }
  const today = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };
  const dmy = (iso) => (/^\d{4}-\d{2}-\d{2}$/.test(iso || '') ? iso.split('-').reverse().join('/') : '');

  // ---------------- state
  const blankItem = () => ({ d: '', q: '1', p: '' });
  const pageAr = document.documentElement.lang === 'ar';
  let S = { lang: pageAr ? 'ar' : 'en', no: 'INV-0001', date: today(), due: '', cur: 'AED', s: {}, c: {}, items: [blankItem()], disc: '0', vat: '5', notes: '' };
  try { const saved = JSON.parse(localStorage.getItem(KEY) || 'null'); if (saved) S = { ...S, ...saved, s: saved.s || {}, c: saved.c || {} }; } catch { /* ignore */ }
  if (!S.items || !S.items.length) S.items = [blankItem()];
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { /* full or blocked */ } };

  // form field id -> [object, key]
  const FIELDS = { iNo: [S, 'no'], iDate: [S, 'date'], iDue: [S, 'due'], iCur: [S, 'cur'], iDisc: [S, 'disc'], iVat: [S, 'vat'], iNotes: [S, 'notes'],
    sName: ['s', 'name'], sAddr: ['s', 'addr'], sTrn: ['s', 'trn'], sPhone: ['s', 'phone'], sMail: ['s', 'mail'],
    cName: ['c', 'name'], cAddr: ['c', 'addr'], cTrn: ['c', 'trn'] };
  const target = (o) => (o === 's' ? S.s : o === 'c' ? S.c : S);
  function fillForm() {
    for (const [id, [o, k]] of Object.entries(FIELDS)) $(id).value = target(o)[k] ?? '';
    const r = document.querySelector(`input[name="invLang"][value="${S.lang}"]`);
    if (r) r.checked = true;
    $('sLogoDel').hidden = !S.s.logo;
    drawItems();
  }

  // ---------------- items
  function drawItems() {
    $('iItems').innerHTML = S.items.map((it, i) => `<div class="inv-item" data-i="${i}">
        <input data-k="d" dir="auto" value="${esc(it.d)}" placeholder="${esc(T('Description'))}" aria-label="${esc(T('Description'))}">
        <input data-k="q" inputmode="decimal" dir="ltr" value="${esc(it.q)}" placeholder="${esc(T('Qty'))}" aria-label="${esc(T('Qty'))}">
        <input data-k="p" inputmode="decimal" dir="ltr" value="${esc(it.p)}" placeholder="${esc(T('Price'))}" aria-label="${esc(T('Price'))}">
        <button type="button" class="inv-del" aria-label="${esc(T('Remove item'))}" title="${esc(T('Remove item'))}"${S.items.length < 2 ? ' disabled' : ''}>×</button>
      </div>`).join('');
  }
  $('iItems').addEventListener('input', (e) => {
    const row = e.target.closest('.inv-item');
    if (!row || !e.target.dataset.k) return;
    S.items[+row.dataset.i][e.target.dataset.k] = e.target.value;
    update();
  });
  $('iItems').addEventListener('click', (e) => {
    const del = e.target.closest('.inv-del');
    if (!del || S.items.length < 2) return;
    S.items.splice(+del.closest('.inv-item').dataset.i, 1);
    drawItems(); update();
  });
  $('iAdd').addEventListener('click', () => {
    S.items.push(blankItem()); drawItems(); update();
    const rows = $('iItems').querySelectorAll('.inv-item');
    rows[rows.length - 1].querySelector('input').focus();
  });

  // ---------------- totals
  function totals() {
    const dec = (FMWords.CUR[S.cur] || { dec: 2 }).dec;
    const r = (n) => Math.round(n * 10 ** dec) / 10 ** dec;
    const rows = S.items.map((it) => ({ ...it, line: r(parse(it.q) * parse(it.p)) }));
    const sub = r(rows.reduce((a, x) => a + x.line, 0));
    const disc = Math.min(r(parse(S.disc)), sub);
    const rate = parse(S.vat);
    const vat = r(((sub - disc) * rate) / 100);
    return { rows, sub, disc, rate, vat, total: r(sub - disc + vat), dec };
  }

  // ---------------- invoice
  function render() {
    const t = totals();
    const m = (n) => n.toLocaleString('en-US', { minimumFractionDigits: t.dec, maximumFractionDigits: t.dec });
    const both = S.lang === 'both';
    const lg = both ? 'en' : S.lang;
    const lab = (k) => (both ? `${L.en[k]} <span class="ip-ar" dir="rtl">${L.ar[k]}</span>` : L[lg][k]);
    const ph = (k) => `<span class="ip-ph">${both ? L.en[k] : L[lg][k]}</span>`;
    const isTax = t.rate > 0;
    const s = S.s, c = S.c;
    const meta = [['no', esc(S.no)], ['date', dmy(S.date)], ['due', dmy(S.due)]].filter(([, v]) => v)
      .map(([k, v]) => `<tr><th>${lab(k)}</th><td dir="ltr">${v}</td></tr>`).join('');
    const items = t.rows.filter((x) => x.d.trim() || parse(x.p)).map((x, i) => `<tr>
        <td class="n">${i + 1}</td><td class="d" dir="auto">${x.d.trim() ? lines(x.d) : ph('phI')}</td>
        <td class="n" dir="ltr">${esc(x.q)}</td><td class="n" dir="ltr">${m(parse(x.p))}</td><td class="n" dir="ltr">${m(x.line)}</td></tr>`).join('')
      || `<tr><td class="n">1</td><td class="d">${ph('phI')}</td><td class="n">1</td><td class="n">${m(0)}</td><td class="n">${m(0)}</td></tr>`;
    const words = t.total ? [] : ['<p>—</p>'];
    if (t.total && S.lang !== 'ar') words.push(`<p dir="ltr">${esc(FMWords.en(t.total, S.cur))}</p>`);
    if (t.total && S.lang !== 'en') words.push(`<p dir="rtl" lang="ar">${esc(FMWords.ar(t.total, S.cur))}</p>`);
    const title = both ? `${isTax ? L.en.tax : L.en.inv}<span class="ip-ar" dir="rtl">${isTax ? L.ar.tax : L.ar.inv}</span>` : L[lg][isTax ? 'tax' : 'inv'];
    paper.dir = S.lang === 'ar' ? 'rtl' : 'ltr';
    paper.innerHTML = `<div class="ip">
      <div class="ip-head">
        <div class="ip-from">
          ${s.logo ? `<img class="ip-logo" src="${s.logo}" alt="">` : ''}
          <div class="ip-name" dir="auto">${s.name ? esc(s.name) : ph('phS')}</div>
          ${s.addr ? `<div dir="auto">${lines(s.addr)}</div>` : ''}
          ${s.trn ? `<div>${lab('trn')}: <span dir="ltr">${esc(s.trn)}</span></div>` : ''}
          ${s.phone || s.mail ? `<div dir="ltr" class="ip-contact">${[s.phone, s.mail].filter(Boolean).map(esc).join(' · ')}</div>` : ''}
        </div>
        <div class="ip-title"><h2>${title}</h2><table class="ip-meta">${meta}</table></div>
      </div>
      <div class="ip-to">
        <div class="ip-lbl">${lab('to')}</div>
        <div class="ip-cname" dir="auto">${c.name ? esc(c.name) : ph('phC')}</div>
        ${c.addr ? `<div dir="auto">${lines(c.addr)}</div>` : ''}
        ${c.trn ? `<div>${lab('trn')}: <span dir="ltr">${esc(c.trn)}</span></div>` : ''}
      </div>
      <table class="ip-items">
        <thead><tr><th class="n">#</th><th class="d">${lab('desc')}</th><th class="n">${lab('qty')}</th><th class="n">${lab('price')}</th><th class="n">${lab('amt')}</th></tr></thead>
        <tbody>${items}</tbody>
      </table>
      <div class="ip-bottom">
        <div class="ip-words"><div class="ip-lbl">${lab('words')}</div>${words.join('')}</div>
        <table class="ip-sum">
          <tr><th>${lab('sub')}</th><td dir="ltr">${m(t.sub)}</td></tr>
          ${t.disc ? `<tr><th>${lab('disc')}</th><td dir="ltr">−${m(t.disc)}</td></tr>` : ''}
          ${isTax ? `<tr><th>${lab('vat')} <span dir="ltr">${t.rate}%</span></th><td dir="ltr">${m(t.vat)}</td></tr>` : ''}
          <tr class="ip-total"><th>${lab('total')}</th><td dir="ltr">${esc(S.cur)} ${m(t.total)}</td></tr>
        </table>
      </div>
      ${S.notes.trim() ? `<div class="ip-notes"><div class="ip-lbl">${lab('notes')}</div><div dir="auto">${lines(S.notes)}</div></div>` : ''}
      <div class="ip-foot">${both ? `${L.en.thanks} · <span lang="ar" dir="rtl">${L.ar.thanks}</span>` : L[lg].thanks}</div>
    </div>`;
  }
  function update() { save(); render(); }

  // ---------------- form events
  for (const [id, [o, k]] of Object.entries(FIELDS)) {
    $(id).addEventListener('input', () => { target(o)[k] = $(id).value; update(); });
  }
  document.querySelectorAll('input[name="invLang"]').forEach((r) => r.addEventListener('change', () => { S.lang = r.value; update(); }));

  $('sLogoBtn').addEventListener('click', () => $('sLogo').click());
  $('sLogo').addEventListener('change', () => {
    const f = $('sLogo').files[0];
    $('sLogo').value = '';
    if (!f) return;
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, 400 / Math.max(img.width, img.height));
      const cv = document.createElement('canvas');
      cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k);
      cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
      S.s.logo = cv.toDataURL('image/png');
      URL.revokeObjectURL(img.src);
      $('sLogoDel').hidden = false;
      update();
    };
    img.src = URL.createObjectURL(f);
  });
  $('sLogoDel').addEventListener('click', () => { delete S.s.logo; $('sLogoDel').hidden = true; update(); });

  // Next number: INV-0007 -> INV-0008 (keeps the zeros)
  const nextNo = (no) => (/\d+(?!.*\d)/.test(no) ? no.replace(/(\d+)(?!.*\d)/, (d) => String(+d + 1).padStart(d.length, '0')) : no + '-2');
  $('iNew').addEventListener('click', () => {
    S.no = nextNo(S.no || 'INV-0000');
    S.date = today(); S.due = ''; S.c = {}; S.items = [blankItem()]; S.disc = '0';
    fillForm(); update();
    $('cName').focus();
  });
  $('iReset').addEventListener('click', () => {
    if (!confirm(T('Clear everything, including your business details?'))) return;
    try { localStorage.removeItem(KEY); } catch { /* ignore */ }
    location.reload();
  });

  // Print only the invoice; the PDF gets the invoice number as its file name.
  $('iPdf').addEventListener('click', () => {
    document.getElementById('invPrint')?.remove();
    const box = document.createElement('div');
    box.id = 'invPrint';
    box.dir = paper.dir;
    box.innerHTML = paper.innerHTML;
    document.body.append(box);
    document.documentElement.classList.add('inv-printing');
    const title = document.title;
    document.title = (S.lang === 'ar' ? 'فاتورة' : 'Invoice') + ' ' + (S.no || '').replace(/[\\/:*?"<>|]/g, '-');
    const done = () => { box.remove(); document.documentElement.classList.remove('inv-printing'); document.title = title; window.removeEventListener('afterprint', done); };
    window.addEventListener('afterprint', done);
    window.print();
    if (window.FMlog) window.FMlog('invoice-pdf');
  });

  fillForm();
  render();
  window.__invoice = { totals, nextNo, get state() { return S; } };
})();
