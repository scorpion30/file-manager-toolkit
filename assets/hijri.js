/* Hijri Date Converter (hijri-converter.html). Uses the browser's own Islamic calendars (Intl):
 * islamic-umalqura (Saudi Arabia's official calendar) or islamic-civil (the standard tabular one).
 * Month and day names are separate text so the page dictionaries translate them. */
(() => {
  const $ = (id) => document.getElementById(id);
  if (!$('hjToday')) return;
  const HM = ['Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani', 'Jumada al-Ula', 'Jumada al-Akhirah', 'Rajab', 'Shaban', 'Ramadan', 'Shawwal', 'Dhu al-Qadah', 'Dhu al-Hijjah'];
  const GM = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const WD = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const DAY = 86400000;
  let cal = 'islamic-umalqura';
  const fmts = {};

  function hijri(ms) {
    const f = fmts[cal] || (fmts[cal] = new Intl.DateTimeFormat(`en-u-ca-${cal}-nu-latn`, { timeZone: 'UTC', day: 'numeric', month: 'numeric', year: 'numeric' }));
    const p = Object.fromEntries(f.formatToParts(new Date(ms)).map((x) => [x.type, x.value]));
    return { d: +p.day, m: +p.month, y: parseInt(p.year || p.relatedYear, 10) };
  }
  function toGregorian(d, m, y) {
    const guess = Date.UTC(622, 6, 19, 12) + ((y - 1) * 354.36667 + (m - 1) * 29.5306 + (d - 1)) * DAY;
    for (let off = 0; off <= 45; off++) {
      for (const s of off ? [off, -off] : [0]) {
        const ms = guess + s * DAY;
        const h = hijri(ms);
        if (h.d === d && h.m === m && h.y === y) return ms;
      }
    }
    return null;
  }

  const sp = (t) => `<span>${t}</span>`;
  const T = (x) => (window.FMLang && FMLang.t ? FMLang.t(x) : x);
  const C = document.documentElement.lang === 'ar' ? '،' : ',';
  const num = (n) => `<b translate="no">${n}</b>`;
  const gText = (ms) => { const t = new Date(ms); return `${sp(WD[t.getUTCDay()])}${C} ${num(t.getUTCDate())} ${sp(GM[t.getUTCMonth()])} ${num(t.getUTCFullYear())}`; };
  const hText = (ms) => { const h = hijri(ms); return `${sp(WD[new Date(ms).getUTCDay()])}${C} ${num(h.d)} ${sp(HM[h.m - 1])} ${num(h.y)} ${sp('AH')}`; };
  const iso = (ms) => new Date(ms).toISOString().slice(0, 10);

  function today() {
    const n = new Date();
    const ms = Date.UTC(n.getFullYear(), n.getMonth(), n.getDate(), 12);
    $('hjToday').innerHTML = `<div class="hj-label">${sp('Today')}</div><div class="hj-big">${hText(ms)}</div><div class="hj-sub">${gText(ms)}</div>`;
    return ms;
  }
  function fromG() {
    const v = $('gIn').value;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) { $('gOut').innerHTML = ''; return; }
    const [y, m, d] = v.split('-').map(Number);
    const ms = Date.UTC(y, m - 1, d, 12);
    $('gOut').innerHTML = `<div class="hj-big">${hText(ms)}</div>`;
  }
  function fromH() {
    const d = +$('hD').value, m = +$('hM').value, y = +$('hY').value;
    const out = $('hOut');
    if (!d || !m || !y) { out.innerHTML = ''; return; }
    if (d < 1 || d > 30 || y < 1 || y > 9999) { out.innerHTML = `<p class="hj-err">${sp('Check the day and year.')}</p>`; return; }
    const ms = toGregorian(d, m, y);
    if (ms == null) {
      out.innerHTML = `<p class="hj-err">${d === 30 && toGregorian(29, m, y) != null ? sp('This month has only 29 days in this calendar.') : sp('Check the day and year.')}</p>`;
      return;
    }
    out.innerHTML = `<div class="hj-big">${gText(ms)}</div><div class="hj-sub" dir="ltr" translate="no">${iso(ms)}</div>`;
  }
  function all() { today(); fromG(); fromH(); }

  $('hM').setAttribute('translate', 'no');
  $('hM').innerHTML = HM.map((n, i) => `<option value="${i + 1}">${i + 1}. ${T(n)}</option>`).join('');
  const ms = today();
  const h = hijri(ms);
  $('gIn').value = iso(ms);
  $('hD').value = h.d; $('hM').value = h.m; $('hY').value = h.y;
  ['gIn'].forEach((id) => $(id).addEventListener('input', fromG));
  ['hD', 'hM', 'hY'].forEach((id) => $(id).addEventListener('input', fromH));
  document.querySelectorAll('input[name="hjCal"]').forEach((r) => r.addEventListener('change', () => { cal = r.value; all(); }));
  all();
  window.__hijri = { hijri, toGregorian };
})();
