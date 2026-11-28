/* Unit converters (unit-converter.html, kg-to-lbs.html, ...): two boxes that update each other, a swap button,
 * and the value in every unit of the category. Unit data: assets/units-data.js (window.FMUnits). */
(() => {
  const $ = (id) => document.getElementById(id);
  const root = $('conv');
  if (!root || !window.FMUnits) return;
  const { U, convert, fmt } = window.FMUnits;
  const DEFAULTS = { length: ['m', 'ft'], mass: ['kg', 'lb'], area: ['m2', 'ft2'], volume: ['l', 'galus'], temp: ['c', 'f'], speed: ['kmh', 'mph'] };
  let cat = root.dataset.cat;
  const a = $('convA'), b = $('convB'), ua = $('convUA'), ub = $('convUB');

  // Accepts 1,234.5 · 1234,5 · Arabic-Indic digits ١٢٣٫٥
  function parse(s) {
    s = String(s).trim().replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
      .replace(/٫/g, '.').replace(/[\s٬']/g, '');
    if (s.includes(',') && !s.includes('.')) s = /,\d{3}$/.test(s) && !/^-?0,/.test(s) ? s.replace(/,/g, '') : s.replace(',', '.');
    else s = s.replace(/,/g, '');
    if (!/^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(s)) return NaN;
    return Number(s);
  }

  // Unit names through the page dictionary (the lists are marked translate="no" so they are not translated twice).
  const T = (s) => (window.FMLang && FMLang.t ? FMLang.t(s) : s);
  function fill(sel, val) {
    sel.setAttribute('translate', 'no');
    sel.innerHTML = Object.entries(U[cat].units).map(([k, u]) => `<option value="${k}">${T(u.name)} (${u.sym})</option>`).join('');
    sel.value = val;
  }

  function feetInches(m) {
    const totalIn = m / 0.0254;
    let ft = Math.floor(totalIn / 12);
    let inch = Math.round((totalIn - ft * 12) * 10) / 10;
    if (inch >= 12) { ft += 1; inch = 0; }
    return `${ft} ft ${inch} in`;
  }

  function render(from) {
    const src = from === 'b' ? b : a;
    const v = parse(src.value);
    const [fu, tu] = from === 'b' ? [ub.value, ua.value] : [ua.value, ub.value];
    const out = from === 'b' ? a : b;
    if (!isFinite(v)) { if (src.value.trim()) out.value = ''; list(NaN); return; }
    out.value = fmt(convert(cat, fu, tu, v));
    const s = U[cat].units;
    let f = `1 ${s[ua.value].sym} = ${fmt(convert(cat, ua.value, ub.value, 1))} ${s[ub.value].sym}`;
    if (cat === 'temp') f = ua.value === 'c' && ub.value === 'f' ? '°F = °C × 9/5 + 32' : ua.value === 'f' && ub.value === 'c' ? '°C = (°F − 32) × 5/9' : `${fmt(v)} ${s[fu].sym} = ${out.value} ${s[tu].sym}`;
    const aVal = parse(a.value);
    if (cat === 'length' && isFinite(aVal) && (ua.value === 'm' || ub.value === 'ft' || ua.value === 'cm')) f += ` · ${fmt(aVal)} ${s[ua.value].sym} = ${feetInches(convert(cat, ua.value, 'm', aVal))}`;
    $('convFormula').textContent = f;
    list(aVal);
  }

  function list(v) {
    const ul = $('convAll');
    if (!isFinite(v)) { ul.innerHTML = ''; return; }
    ul.innerHTML = Object.entries(U[cat].units).filter(([k]) => k !== ua.value).map(([k, u]) => {
      const val = fmt(convert(cat, ua.value, k, v));
      return `<li><button type="button" data-copy="${val}" title="Copy"><b dir="ltr" translate="no">${val} ${u.sym}</b><span>${u.name}</span></button></li>`;
    }).join('');
  }

  $('convAll').addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-copy]');
    if (!btn) return;
    try { await navigator.clipboard.writeText(btn.dataset.copy.replace(/,/g, '')); } catch { return; }
    btn.classList.add('copied'); setTimeout(() => btn.classList.remove('copied'), 900);
    if (window.FM && FM.toast) FM.toast('Copied');
  });

  a.addEventListener('input', () => render('a'));
  b.addEventListener('input', () => render('b'));
  ua.addEventListener('change', () => render('a'));
  ub.addEventListener('change', () => render('a'));
  $('convSwap').addEventListener('click', () => {
    const t = ua.value; ua.value = ub.value; ub.value = t;
    a.value = b.value || a.value;
    render('a');
  });
  // The hub page also has a "Hijri date" tab (assets/hijri.js runs inside #convDate).
  function showTab(v) {
    const date = v === 'date';
    if ($('convMain')) $('convMain').hidden = date;
    if ($('convDate')) $('convDate').hidden = !date;
    if (date) return;
    cat = v;
    fill(ua, DEFAULTS[cat][0]); fill(ub, DEFAULTS[cat][1]);
    a.value = cat === 'temp' ? '25' : '1';
    render('a');
  }
  document.querySelectorAll('input[name="convCat"]').forEach((r) => r.addEventListener('change', () => {
    showTab(r.value);
    try { history.replaceState(null, '', r.value === 'length' ? location.pathname : '#' + r.value); } catch { /* ignore */ }
  }));

  fill(ua, root.dataset.from); fill(ub, root.dataset.to);
  render('a');
  // unit-converter.html#date (or #mass, #area…) opens that tab
  const start = location.hash.slice(1);
  const tab = start && document.querySelector(`input[name="convCat"][value="${CSS.escape(start)}"]`);
  if (tab) { tab.checked = true; showTab(start); }
  window.__units = { parse, render };
})();
