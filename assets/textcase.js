/* Text Case Converter and Word Counter (text-case.html, word-counter.html): case changes, clean-ups and live counts.
 * Everything stays in the page. The text is kept in localStorage so a reload does not lose it. */
(() => {
  const $ = (id) => document.getElementById(id);
  const box = $('txIn');
  if (!box) return;
  const KEY = 'fm-text-' + location.pathname.split('/').pop();
  const undo = [];

  // ---------- counts ----------
  function counts() {
    const t = box.value;
    const words = (t.match(/[^\s]+/g) || []).filter((w) => /[\p{L}\p{N}]/u.test(w.replace(/ـ/g, ''))).length;
    const sentences = t.trim() ? (t.match(/[^.!?؟。\n]+[.!?؟。]+|[^.!?؟。\n]+$/gm) || []).filter((s) => /[\p{L}\p{N}]/u.test(s)).length : 0;
    const lines = t ? t.split(/\r?\n/).length : 0;
    const secs = Math.round(words / 200 * 60); // about 200 words a minute, shown as m:ss
    const read = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
    const set = (k, v) => { const el = $('st-' + k); if (el) el.textContent = typeof v === 'number' ? v.toLocaleString('en-US') : v; };
    set('w', words); set('c', [...t].length); set('cn', [...t.replace(/\s/g, '')].length); set('s', sentences); set('l', lines); set('r', read);
  }

  // ---------- case and clean-up ----------
  const words = (t) => t.replace(/([a-z0-9])([A-Z])/g, '$1 $2').split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  const cap = (w) => w.charAt(0).toLocaleUpperCase() + w.slice(1).toLocaleLowerCase();
  const SMALL = new Set(['a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'in', 'of', 'on', 'or', 'the', 'to', 'vs', 'via']);
  const lines = (t) => t.split(/\r?\n/);
  const OPS = {
    upper: (t) => t.toLocaleUpperCase(),
    lower: (t) => t.toLocaleLowerCase(),
    title: (t) => t.toLocaleLowerCase().replace(/[\p{L}\p{N}][\p{L}\p{N}'’]*/gu, (w, i, all) => {
      const first = i === 0 || /[.!?:\n]\s*$/.test(all.slice(0, i));
      return !first && SMALL.has(w) ? w : cap(w);
    }),
    sentence: (t) => t.toLocaleLowerCase().replace(/(^\s*|[.!?؟]\s+|\n\s*)(\p{L})/gu, (m, a, b) => a + b.toLocaleUpperCase()),
    swap: (t) => [...t].map((c) => (c === c.toLocaleUpperCase() ? c.toLocaleLowerCase() : c.toLocaleUpperCase())).join(''),
    camel: (t) => lines(t).map((l) => words(l).map((w, i) => (i ? cap(w) : w.toLocaleLowerCase())).join('')).join('\n'),
    snake: (t) => lines(t).map((l) => words(l).map((w) => w.toLocaleLowerCase()).join('_')).join('\n'),
    kebab: (t) => lines(t).map((l) => words(l).map((w) => w.toLocaleLowerCase()).join('-')).join('\n'),
    spaces: (t) => lines(t).map((l) => l.replace(/[ \t ]+/g, ' ').trim()).join('\n'),
    breaks: (t) => t.replace(/\s*\r?\n\s*/g, ' ').replace(/ {2,}/g, ' ').trim(),
    empty: (t) => lines(t).filter((l) => l.trim()).join('\n'),
    dupes: (t) => { const seen = new Set(); return lines(t).filter((l) => { const k = l.trim(); if (!k) return true; if (seen.has(k)) return false; seen.add(k); return true; }).join('\n'); },
    sort: (t) => lines(t).sort(new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' }).compare).join('\n'),
    // tashkeel (U+064B-U+065F, U+0670, Quranic marks U+06D6-U+06ED) and tatweel (U+0640)
    tashkeel: (t) => t.replace(/[ً-ٰٟۖ-ۭـ]/g, ''),
  };

  function apply(op) {
    if (!box.value) { box.focus(); return; }
    const next = OPS[op](box.value);
    if (next === box.value) return flash('No change');
    undo.push(box.value);
    if (undo.length > 30) undo.shift();
    box.value = next;
    changed();
    try { window.FMlog && window.FMlog('text-' + op); } catch { /* ignore */ }
  }

  let msgTimer;
  function flash(s) {
    const m = $('txMsg'); m.textContent = s;
    clearTimeout(msgTimer); msgTimer = setTimeout(() => { m.textContent = ''; }, 1800);
  }
  function changed() {
    counts();
    $('txUndo').disabled = !undo.length;
    try { localStorage.setItem(KEY, box.value.slice(0, 200000)); } catch { /* full or blocked */ }
  }

  document.querySelectorAll('[data-tx]').forEach((b) => b.addEventListener('click', () => apply(b.dataset.tx)));
  box.addEventListener('input', changed);
  $('txUndo').addEventListener('click', () => { if (undo.length) { box.value = undo.pop(); changed(); } });
  $('txClear').addEventListener('click', () => { if (!box.value) return; undo.push(box.value); box.value = ''; changed(); box.focus(); });
  $('txCopy').addEventListener('click', async () => {
    if (!box.value) return;
    try { await navigator.clipboard.writeText(box.value); } catch { box.select(); document.execCommand('copy'); }
    flash('Copied');
  });
  $('txSave').addEventListener('click', () => {
    if (!box.value) return;
    const blob = new Blob([box.value], { type: 'text/plain;charset=utf-8' });
    if (window.FM && FM.downloadBlob) FM.downloadBlob(blob, 'text.txt');
    else { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'text.txt'; a.click(); }
  });

  try { box.value = localStorage.getItem(KEY) || ''; } catch { /* blocked */ }
  counts();
  window.__textcase = { OPS };
})();
