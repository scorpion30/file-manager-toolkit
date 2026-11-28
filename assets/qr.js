/* QR Code Generator (qr-code.html): static QR codes (the data is in the code itself, so they never expire).
 * Encoder: qrcode-generator 1.4.4 (MIT, Kazuhiko Arase) from jsDelivr. Text is encoded as UTF-8, so Arabic works. */
(() => {
  const $ = (id) => document.getElementById(id);
  const canvas = $('qrCanvas');
  if (!canvas) return;
  const LIB = 'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js';
  const radio = (n) => (document.querySelector(`input[name="${n}"]:checked`) || {}).value;
  const val = (id) => ($(id) ? $(id).value.trim() : '');
  let logo = null; // HTMLImageElement
  let last = null; // { qr, n, data }

  // ---------- what goes inside ----------
  const wifiEsc = (s) => s.replace(/([\\;,:"])/g, '\\$1');
  function payload() {
    switch (radio('qrType')) {
      case 'url': { let u = val('qUrl'); if (u && !/^[a-z][a-z0-9+.-]*:/i.test(u) && /\./.test(u)) u = 'https://' + u; return u; }
      case 'text': return $('qText').value;
      case 'wifi': {
        const s = val('qSsid'); if (!s) return '';
        const enc = radio('qEnc');
        return `WIFI:T:${enc};S:${wifiEsc(s)};${enc === 'nopass' ? '' : `P:${wifiEsc($('qPass').value)};`}${$('qHidden').checked ? 'H:true;' : ''};`;
      }
      case 'wa': { const n = val('qWaNum').replace(/\D/g, ''); if (!n) return ''; const m = $('qWaMsg').value.trim(); return `https://wa.me/${n}${m ? '?text=' + encodeURIComponent(m) : ''}`; }
      case 'tel': { const t = val('qTel').replace(/[^\d+]/g, ''); return t ? 'tel:' + t : ''; }
      case 'email': {
        const m = val('qMail'); if (!m) return '';
        const q = [['subject', val('qSubj')], ['body', $('qBody').value.trim()]].filter(([, v]) => v).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
        return `mailto:${m}${q ? '?' + q : ''}`;
      }
      case 'vcard': {
        const name = val('qName'); if (!name) return '';
        const esc = (s) => s.replace(/([\\;,])/g, '\\$1');
        return ['BEGIN:VCARD', 'VERSION:3.0', `N:${esc(name)};;;;`, `FN:${esc(name)}`,
          val('qOrg') && `ORG:${esc(val('qOrg'))}`, val('qTitle') && `TITLE:${esc(val('qTitle'))}`,
          val('qPhone') && `TEL;TYPE=CELL:${val('qPhone')}`, val('qVmail') && `EMAIL:${val('qVmail')}`,
          val('qWeb') && `URL:${val('qWeb')}`, 'END:VCARD'].filter(Boolean).join('\r\n');
      }
      default: return '';
    }
  }

  // ---------- drawing ----------
  const utf8 = (s) => unescape(encodeURIComponent(s));
  const lum = (hex) => { const n = parseInt(hex.slice(1), 16); const c = [n >> 16, (n >> 8) & 255, n & 255].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
  const note = (s, bad) => { const el = $('qrNote'); el.textContent = s; el.classList.toggle('bad', !!bad); };

  function build() {
    const data = payload();
    if (!data) { last = null; draw(); note('Fill in the details to make your QR code.'); return; }
    const ec = logo ? 'H' : radio('qEc');
    try {
      const qr = window.qrcode(0, ec);
      qr.addData(utf8(data));
      qr.make();
      last = { qr, n: qr.getModuleCount(), data };
    } catch {
      last = null; draw(); note('Too much text for one QR code. Make it shorter.', true); return;
    }
    draw();
    const fg = $('qFg').value, bg = $('qBg').value;
    if (!$('qTransparent').checked && lum(fg) > lum(bg)) note('Light code on a dark background: some phones cannot read it. Dark on light scans best.', true);
    else if (!$('qTransparent').checked && (Math.max(lum(fg), lum(bg)) + 0.05) / (Math.min(lum(fg), lum(bg)) + 0.05) < 3) note('The colours are too close. Use more contrast so phones can read it.', true);
    else note(logo ? 'Ready. With a logo, test it with your phone camera before printing.' : 'Ready. Point your phone camera at it to test.');
  }

  function draw() {
    const size = +radio('qSize') || 1024;
    const ctx = canvas.getContext('2d');
    if (!last) { canvas.width = canvas.height = 256; ctx.clearRect(0, 0, 256, 256); canvas.classList.add('empty'); return; }
    canvas.classList.remove('empty');
    const { qr, n } = last;
    const quiet = 4;
    const cell = Math.max(1, Math.floor(size / (n + quiet * 2)));
    const px = cell * (n + quiet * 2);
    canvas.width = canvas.height = px;
    ctx.clearRect(0, 0, px, px);
    if (!$('qTransparent').checked) { ctx.fillStyle = $('qBg').value; ctx.fillRect(0, 0, px, px); }
    ctx.fillStyle = $('qFg').value;
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) ctx.fillRect((c + quiet) * cell, (r + quiet) * cell, cell, cell);
    if (logo) {
      const box = Math.round(px * 0.22), pad = Math.round(box * 0.12), x = (px - box) / 2;
      ctx.fillStyle = $('qTransparent').checked ? '#ffffff' : $('qBg').value;
      roundRect(ctx, x - pad, x - pad, box + pad * 2, box + pad * 2, pad);
      const s = Math.min(box / logo.width, box / logo.height);
      const w = logo.width * s, h = logo.height * s;
      ctx.drawImage(logo, (px - w) / 2, (px - h) / 2, w, h);
    }
  }
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); ctx.fill();
  }

  function svg() {
    const { qr, n } = last;
    const q = 4, s = n + q * 2;
    let d = '';
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) d += `M${c + q} ${r + q}h1v1h-1z`;
    let extra = '';
    if (logo) {
      const box = s * 0.22, pad = box * 0.12, x = (s - box) / 2;
      const cv = document.createElement('canvas'); cv.width = logo.width; cv.height = logo.height; cv.getContext('2d').drawImage(logo, 0, 0);
      const sc = Math.min(box / logo.width, box / logo.height), w = logo.width * sc, h = logo.height * sc;
      extra = `<rect x="${x - pad}" y="${x - pad}" width="${box + pad * 2}" height="${box + pad * 2}" rx="${pad}" fill="${$('qTransparent').checked ? '#ffffff' : $('qBg').value}"/><image href="${cv.toDataURL('image/png')}" x="${(s - w) / 2}" y="${(s - h) / 2}" width="${w}" height="${h}"/>`;
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${s} ${s}" shape-rendering="crispEdges">${$('qTransparent').checked ? '' : `<rect width="${s}" height="${s}" fill="${$('qBg').value}"/>`}<path d="${d}" fill="${$('qFg').value}"/>${extra}</svg>`;
  }

  const fileName = () => 'qr-code-' + (radio('qrType') || 'code');
  const save = (blob, ext) => { if (window.FM && FM.downloadBlob) FM.downloadBlob(blob, `${fileName()}.${ext}`); };

  // ---------- events ----------
  let timer;
  const later = () => { clearTimeout(timer); timer = setTimeout(build, 120); };
  document.querySelectorAll('.qr input, .qr textarea').forEach((el) => el.addEventListener('input', later));
  document.querySelectorAll('input[name="qrType"]').forEach((r) => r.addEventListener('change', () => {
    document.querySelectorAll('.qr-fields').forEach((f) => { f.hidden = f.dataset.qt !== r.value; });
    build();
  }));
  document.querySelectorAll('input[name="qSize"], input[name="qEc"], input[name="qEnc"]').forEach((r) => r.addEventListener('change', build));
  $('qLogoBtn').addEventListener('click', () => $('qLogo').click());
  $('qLogo').addEventListener('change', () => {
    const f = $('qLogo').files[0]; if (!f) return;
    const img = new Image();
    img.onload = () => { logo = img; $('qLogoDel').hidden = false; build(); };
    img.src = URL.createObjectURL(f);
  });
  $('qLogoDel').addEventListener('click', () => { logo = null; $('qLogo').value = ''; $('qLogoDel').hidden = true; build(); });
  $('qPng').addEventListener('click', () => { if (last) canvas.toBlob((b) => save(b, 'png'), 'image/png'); });
  $('qSvg').addEventListener('click', () => { if (last) save(new Blob([svg()], { type: 'image/svg+xml' }), 'svg'); });
  $('qCopy').addEventListener('click', () => {
    if (!last) return;
    canvas.toBlob(async (b) => {
      try { await navigator.clipboard.write([new ClipboardItem({ 'image/png': b })]); window.FM && FM.toast && FM.toast('Copied'); }
      catch { window.FM && FM.toast && FM.toast('Your browser cannot copy images. Download the PNG instead.'); }
    }, 'image/png');
  });

  note('Loading…');
  (window.FM ? FM.loadScript(LIB) : Promise.reject(new Error('no FM'))).then(build).catch(() => note('Could not load a required library. Check your internet connection.', true));
  window.__qr = { payload, build, svg };
})();
