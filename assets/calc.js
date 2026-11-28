/* Calculators: percentage-calculator.html and vat-calculator.html. Answers update as you type; click one to copy it. */
(() => {
  const $ = (id) => document.getElementById(id);
  const T = (s) => (window.FMLang && FMLang.t ? FMLang.t(s) : s);

  // Accepts 1,234.5 · 1234,5 · Arabic-Indic digits ١٢٣٫٥
  function parse(s) {
    s = String(s).trim().replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
      .replace(/٫/g, '.').replace(/[\s٬'%]/g, '');
    if (s.includes(',') && !s.includes('.')) s = /,\d{3}$/.test(s) && !/^-?0,/.test(s) ? s.replace(/,/g, '') : s.replace(',', '.');
    else s = s.replace(/,/g, '');
    if (!/^[-+]?(\d+\.?\d*|\.\d+)$/.test(s)) return NaN;
    return Number(s);
  }
  const fmt = (n, max = 4) => (isFinite(n) ? Number(n.toFixed(max)).toLocaleString('en-US', { maximumFractionDigits: max }) : '');
  const money = (n) => (isFinite(n) ? n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '');
  const b = (v) => `<b dir="ltr" translate="no" data-copy="${String(v).replace(/,/g, '')}">${v}</b>`;
  const sp = (t) => `<span>${T(t)}</span>`;

  async function copy(el) {
    const v = el.dataset.copy;
    if (!v) return;
    try { await navigator.clipboard.writeText(v); } catch { return; }
    el.classList.add('copied'); setTimeout(() => el.classList.remove('copied'), 900);
    if (window.FM && FM.toast) FM.toast(T('Copied'));
  }
  document.addEventListener('click', (e) => { const el = e.target.closest('[data-copy]'); if (el && el.closest('main')) copy(el); });

  // ---------------- percentage
  if (document.querySelector('[data-pc]')) {
    const v = (id) => parse($(id).value);
    const CALC = {
      of: () => { const r = (v('pcOfA') * v('pcOfB')) / 100; return isFinite(r) ? `= ${b(fmt(r))}` : ''; },
      what: () => { const B = v('pcWhatB'); const r = (v('pcWhatA') / B) * 100; return isFinite(r) && B ? `= ${b(fmt(r) + '%')}` : ''; },
      change: () => {
        const A = v('pcChA'), r = ((v('pcChB') - A) / Math.abs(A)) * 100;
        if (!isFinite(r) || !A) return '';
        return `= ${b((r > 0 ? '+' : '') + fmt(r) + '%')} ${sp(r > 0 ? 'increase' : r < 0 ? 'decrease' : 'no change')}`;
      },
      inc: () => { const r = v('pcIncA') * (1 + v('pcIncB') / 100); return isFinite(r) ? `= ${b(fmt(r))}` : ''; },
      dec: () => { const r = v('pcDecA') * (1 - v('pcDecB') / 100); return isFinite(r) ? `= ${b(fmt(r))}` : ''; },
      disc: () => {
        const P = v('pcDiscA'), D = v('pcDiscB');
        if (!isFinite(P) || !isFinite(D)) return '';
        return `${sp('You pay')} ${b(fmt(P * (1 - D / 100), 2))} · ${sp('you save')} ${b(fmt((P * D) / 100, 2))}`;
      },
    };
    const run = () => { for (const [k, f] of Object.entries(CALC)) $('pc-' + k).innerHTML = f(); };
    document.querySelectorAll('[data-pc] input').forEach((i) => i.addEventListener('input', run));
    run();
    window.__calc = { parse, CALC };
  }

  // ---------------- VAT
  if ($('vAmt')) {
    const mode = () => document.querySelector('input[name="vatMode"]:checked').value;
    function run() {
      const a = parse($('vAmt').value), r = parse($('vRate').value);
      document.querySelectorAll('.vat-rates .chip').forEach((c) => c.classList.toggle('on', +c.dataset.rate === r));
      const set = (id, n) => { const el = $(id); el.querySelector('b').textContent = isFinite(n) ? money(n) : '–'; el.dataset.copy = isFinite(n) ? n.toFixed(2) : ''; };
      if (!isFinite(a) || !isFinite(r) || r < 0) { ['vNet', 'vVat', 'vTot'].forEach((id) => set(id, NaN)); $('vFormula').textContent = ''; return; }
      const k = 1 + r / 100;
      const net = mode() === 'add' ? a : a / k;
      const tot = mode() === 'add' ? a * k : a;
      set('vNet', net); set('vVat', tot - net); set('vTot', tot);
      $('vFormula').textContent = mode() === 'add' ? `${money(a)} × ${fmt(k, 4)} = ${money(tot)}` : `${money(a)} ÷ ${fmt(k, 4)} = ${money(net)}`;
    }
    $('vAmt').addEventListener('input', run);
    $('vRate').addEventListener('input', run);
    document.querySelectorAll('input[name="vatMode"]').forEach((i) => i.addEventListener('change', run));
    document.querySelectorAll('.vat-rates .chip').forEach((c) => c.addEventListener('click', () => { $('vRate').value = c.dataset.rate; run(); }));
    run();
    window.__calc = { parse, run };
  }
})();
