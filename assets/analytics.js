/* Visitor counter (Google Analytics 4). Off until GA_ID is filled in.
 * Only page views and a few clicks are counted. Files never pass through here:
 * they are opened by the browser on the user's own computer. */
(() => {
  'use strict';
  const GA_ID = ''; // e.g. 'G-XXXXXXXXXX' from analytics.google.com
  if (!GA_ID || location.hostname === 'localhost' || location.hostname === '127.0.0.1') return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', GA_ID, { content_group: document.documentElement.lang === 'ar' ? 'ar' : 'en' });

  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(s);

  // Which buttons people press: donate links, and the main action buttons of each tool.
  document.addEventListener('click', (e) => {
    const el = e.target.closest('a, button');
    if (!el) return;
    if (el.matches('a[href*="paypal"]')) {
      window.gtag('event', 'donate_click', { page: location.pathname });
    } else if (el.matches('.btn.primary, [data-next]')) {
      window.gtag('event', 'tool_action', { page: location.pathname, label: (el.textContent || '').trim().slice(0, 40) });
    }
  }, { capture: true });
})();
