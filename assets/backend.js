/* Feedback button + anonymous usage log, both sent to the site's Google Sheet
 * (Apps Script web app, source in tools/backend.gs). Off until ENDPOINT is filled in.
 *
 * Usage log: one row per page visit - page, language, seconds on the page, which buttons
 * were pressed (by id), where the visitor came from, and a random visitor number kept in
 * this browser so returning visitors can be counted. No names, no file names, no files.
 * Feedback: what the visitor types; the e-mail is optional and only used to reply. */
(() => {
  'use strict';
  const ENDPOINT = 'https://script.google.com/macros/s/AKfycbwOQ4Pxxbh48n5vvSuQliU3XUt7eYPAn0j7EfWz8D3u07ByQVKleONhLfNXs8pPNnMsIQ/exec';
  const local = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  const ar = document.documentElement.lang === 'ar';
  const page = location.pathname.replace(/^.*\/file-manager-toolkit\//, '/').replace(/index\.html$/, '') || '/';

  function send(data, beacon) {
    if (!ENDPOINT) return Promise.resolve(false);
    const body = JSON.stringify(data);
    // text/plain keeps it a "simple" request: no CORS preflight, which Apps Script cannot answer.
    if (beacon && navigator.sendBeacon) return Promise.resolve(navigator.sendBeacon(ENDPOINT, new Blob([body], { type: 'text/plain' })));
    return fetch(ENDPOINT, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body })
      .then(() => true, () => false);
  }

  // ---------- usage log ----------
  let visitor = '';
  let isNew = false;
  try {
    visitor = localStorage.getItem('fm-visitor') || '';
    if (!visitor) {
      visitor = Math.random().toString(36).slice(2, 10);
      isNew = true;
      localStorage.setItem('fm-visitor', visitor);
    }
  } catch { /* private mode: counted as new each time */ }

  const started = Date.now();
  const actions = [];
  document.addEventListener('click', (e) => {
    const el = e.target.closest('button, a');
    if (!el || el.closest('.fb-panel')) return;
    let key = el.id || (el.hasAttribute('data-next') ? 'next' : '') || (el.hasAttribute('data-back') ? 'back' : '');
    if (!key && el.tagName === 'A') {
      const href = el.getAttribute('href') || '';
      if (/paypal/.test(href)) key = 'donate';
      else if (/\.html|^\.\/?$|^\.\.\/$/.test(href)) key = 'go:' + href.replace(/^\.\.?\//, '').replace(/#.*/, '');
    }
    if (el.hasAttribute('data-lang-toggle')) key = 'lang';
    if (el.hasAttribute('data-theme-toggle')) key = 'theme';
    if (key && actions.length < 60) actions.push(key);
  }, { capture: true });
  // Tools note milestones too (e.g. 'list:sample-export'), shown with the buttons in the sheet.
  window.FMlog = (key) => { if (actions.length < 60) actions.push(page + ':' + key); };

  let logged = false;
  function logVisit() {
    if (logged || local) return;
    logged = true;
    let ref = '';
    try { ref = document.referrer ? new URL(document.referrer).hostname : ''; } catch { /* ignore */ }
    if (ref === location.hostname) ref = '(site)';
    send({
      kind: 'usage', visitor, isNew, page, lang: ar ? 'ar' : 'en',
      seconds: Math.round((Date.now() - started) / 1000), actions: actions.join(' '),
      referrer: ref, mobile: matchMedia('(max-width: 700px)').matches,
    }, true);
  }
  addEventListener('pagehide', logVisit);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') logVisit(); });

  // ---------- feedback button ----------
  const T = ar ? {
    button: 'رأيك', title: 'رأيك يهمنا',
    lead: 'قابلتك مشكلة، أو عندك اقتراح، أو محتاج أداة مخصوصة لمكتبك؟ اكتب لنا.',
    type: 'الموضوع', types: [['problem', 'مشكلة في أداة'], ['idea', 'اقتراح أو أداة جديدة'], ['office', 'محتاج أداة لمكتبي'], ['thanks', 'شكر']],
    message: 'رسالتك', name: 'اسمك (اختياري)', email: 'إيميلك (اختياري، لو عايز رد)',
    privacy: 'الإيميل بيُستخدم للرد عليك بس. ملفاتك عمرها ما بتتبعت.',
    send: 'إرسال', cancel: 'إلغاء', sending: 'جاري الإرسال…',
    thanks: 'وصلتنا رسالتك، شكراً!', thanksReply: 'هنرد عليك على إيميلك قريب.',
    empty: 'اكتب رسالتك الأول.', badEmail: 'الإيميل مش مكتوب صح.', failed: 'ماقدرناش نبعت. جرّب تاني.',
    off: 'الإرسال مش شغال لسه.',
  } : {
    button: 'Feedback', title: 'Tell us what you think',
    lead: 'Hit a problem, have an idea, or need a custom tool for your office? Write to us.',
    type: 'Topic', types: [['problem', 'Problem with a tool'], ['idea', 'Idea or new tool'], ['office', 'Custom tool for my office'], ['thanks', 'Thanks']],
    message: 'Your message', name: 'Your name (optional)', email: 'Your e-mail (optional, if you want a reply)',
    privacy: 'Your e-mail is only used to reply to you. Your files are never sent.',
    send: 'Send', cancel: 'Cancel', sending: 'Sending…',
    thanks: 'Got it, thank you!', thanksReply: "We'll reply to your e-mail soon.",
    empty: 'Please write a message first.', badEmail: 'That e-mail does not look right.', failed: 'Could not send. Please try again.',
    off: 'Sending is not switched on yet.',
  };

  function el(tag, attrs = {}, kids = []) {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'text') n.textContent = v; else n.setAttribute(k, v);
    }
    for (const k of kids) n.append(k);
    return n;
  }

  function buildPanel() {
    const select = el('select', { id: 'fbType' }, T.types.map(([v, t]) => el('option', { value: v, text: t })));
    const msg = el('textarea', { id: 'fbMsg', rows: '5', maxlength: '3000' });
    const name = el('input', { id: 'fbName', type: 'text', maxlength: '100', autocomplete: 'name' });
    const email = el('input', { id: 'fbEmail', type: 'email', maxlength: '200', autocomplete: 'email', dir: 'ltr' });
    const trap = el('input', { name: 'website', tabindex: '-1', autocomplete: 'off', class: 'fb-trap', 'aria-hidden': 'true' });
    const note = el('p', { class: 'fb-note', role: 'status' });
    const sendBtn = el('button', { type: 'submit', class: 'btn primary', text: T.send });
    const cancelBtn = el('button', { type: 'button', class: 'btn', text: T.cancel });
    const form = el('form', { class: 'fb-panel', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'fbTitle', translate: 'no' }, [
      el('h3', { id: 'fbTitle', text: T.title }),
      el('p', { class: 'fb-lead', text: T.lead }),
      el('label', { for: 'fbType', text: T.type }), select,
      el('label', { for: 'fbMsg', text: T.message }), msg,
      el('label', { for: 'fbName', text: T.name }), name,
      el('label', { for: 'fbEmail', text: T.email }), email, trap,
      el('p', { class: 'fb-privacy', text: T.privacy }),
      note,
      el('div', { class: 'fb-actions' }, [cancelBtn, sendBtn]),
    ]);
    const overlay = el('div', { class: 'fb-overlay', hidden: '' }, [form]);

    const close = () => { overlay.hidden = true; opener.focus(); };
    cancelBtn.addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    overlay.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const text = msg.value.trim();
      const mail = email.value.trim();
      if (!text) { note.textContent = T.empty; msg.focus(); return; }
      if (mail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) { note.textContent = T.badEmail; email.focus(); return; }
      if (trap.value) { close(); return; }
      if (!ENDPOINT) { note.textContent = T.off; return; }
      sendBtn.disabled = true;
      note.textContent = T.sending;
      const ok = await send({ kind: 'feedback', type: select.value, message: text, name: name.value.trim(), email: mail, page, lang: ar ? 'ar' : 'en', visitor });
      sendBtn.disabled = false;
      if (!ok) { note.textContent = T.failed; return; }
      form.replaceChildren(
        el('h3', { text: T.thanks }),
        el('p', { class: 'fb-lead', text: mail ? T.thanksReply : '' }),
        el('div', { class: 'fb-actions' }, [Object.assign(el('button', { type: 'button', class: 'btn primary', text: 'OK' }), { onclick: close })]),
      );
    });

    document.body.append(overlay);
    return { overlay, msg, select };
  }

  let panel = null;
  const opener = el('button', { type: 'button', class: 'fb-open', translate: 'no', 'aria-haspopup': 'dialog' }, [
    el('span', { 'aria-hidden': 'true', text: '💬' }), ` ${T.button}`,
  ]);
  function open(type) {
    if (!panel) panel = buildPanel();
    if (type) panel.select.value = type;
    panel.overlay.hidden = false;
    panel.msg.focus();
  }
  opener.addEventListener('click', () => open());
  // Any link or button with data-feedback="office" (etc.) opens the form on that topic.
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-feedback]');
    if (!t) return;
    e.preventDefault();
    open(t.getAttribute('data-feedback'));
  });
  document.addEventListener('DOMContentLoaded', () => document.body.append(opener));
})();
