/* Password generator (password-generator.html). Secure randomness from crypto.getRandomValues, with rejection
 * sampling so every character is equally likely. Nothing is sent or saved. */
(() => {
  const $ = (id) => document.getElementById(id);
  if (!$('pwOut')) return;
  const T = (s) => (window.FMLang && FMLang.t ? FMLang.t(s) : s);
  const SETS = { pwUp: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', pwLow: 'abcdefghijklmnopqrstuvwxyz', pwNum: '0123456789', pwSym: '!@#$%^&*()-_=+[]{};:,.?/~' };
  const SIMILAR = /[O0oIl1|]/g;

  function rand(n) { // uniform integer in [0, n)
    const max = Math.floor(0x100000000 / n) * n;
    const a = new Uint32Array(1);
    do crypto.getRandomValues(a); while (a[0] >= max);
    return a[0] % n;
  }
  function sets() {
    const sim = $('pwSimilar').checked;
    return Object.keys(SETS).filter((id) => $(id).checked).map((id) => (sim ? SETS[id].replace(SIMILAR, '') : SETS[id]));
  }
  function make(len, groups) {
    const pool = groups.join('');
    // one from each chosen group, the rest from the whole pool, then shuffle
    const out = groups.map((g) => g[rand(g.length)]);
    while (out.length < len) out.push(pool[rand(pool.length)]);
    for (let i = out.length - 1; i > 0; i--) { const j = rand(i + 1); [out[i], out[j]] = [out[j], out[i]]; }
    return out.join('');
  }
  function strength(len, pool) {
    const bits = len * Math.log2(pool);
    if (bits < 45) return ['Weak', 'weak', 25];
    if (bits < 65) return ['Fair', 'fair', 50];
    if (bits < 90) return ['Strong', 'strong', 78];
    return ['Very strong', 'vstrong', 100];
  }
  function run() {
    const len = +$('pwLen').value;
    $('pwLenV').textContent = len;
    const g = sets();
    if (!g.length) { $('pwUp').checked = true; return run(); }
    $('pwOut').value = make(len, g);
    const [label, cls, w] = strength(len, g.join('').length);
    $('pwBar').style.width = w + '%';
    $('pwBar').className = cls;
    $('pwStrength').innerHTML = `<span>${T(label)}</span>`;
    $('pwStrength').className = 'pw-strength ' + cls;
    $('pwList').innerHTML = Array.from({ length: 5 }, () => make(len, g))
      .map((p) => `<li><button type="button" dir="ltr" translate="no" data-pw="${p.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')}">${p.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</button></li>`).join('');
  }
  async function copy(text, el) {
    try { await navigator.clipboard.writeText(text); } catch { $('pwOut').select(); document.execCommand('copy'); }
    if (el) { el.classList.add('copied'); setTimeout(() => el.classList.remove('copied'), 900); }
    if (window.FM && FM.toast) FM.toast(T('Copied'));
  }
  $('pwCopy').addEventListener('click', () => copy($('pwOut').value, $('pwCopy')));
  $('pwNew').addEventListener('click', run);
  $('pwOut').addEventListener('focus', () => $('pwOut').select());
  $('pwList').addEventListener('click', (e) => { const b = e.target.closest('[data-pw]'); if (b) copy(b.dataset.pw, b); });
  $('pwLen').addEventListener('input', run);
  ['pwUp', 'pwLow', 'pwNum', 'pwSym', 'pwSimilar'].forEach((id) => $(id).addEventListener('change', run));
  run();
  window.__pw = { make, rand, strength };
})();
