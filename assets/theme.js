/* Light/dark mode. Loaded in <head> so the saved theme applies before the page paints. */
(() => {
  const KEY = 'fm-theme';
  const root = document.documentElement;
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === 'light' || saved === 'dark') root.dataset.theme = saved;
  } catch { /* storage blocked: follow the system setting */ }

  const icons = {
    dark: '<svg viewBox="0 0 24 24"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/></svg>',
    light: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  };
  const isDark = () => (root.dataset.theme
    ? root.dataset.theme === 'dark'
    : window.matchMedia('(prefers-color-scheme: dark)').matches);
  const paint = () => {
    document.querySelectorAll('[data-theme-toggle]').forEach((b) => {
      b.innerHTML = isDark() ? icons.light : icons.dark;
      b.title = isDark() ? 'Light mode' : 'Dark mode';
    });
  };

  document.addEventListener('click', (e) => {
    if (!e.target.closest('[data-theme-toggle]')) return;
    const next = isDark() ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem(KEY, next); } catch { /* ignore */ }
    paint();
  });
  document.addEventListener('DOMContentLoaded', paint);
  // "All tools" menu in the header: opens on click, closes on Escape or a click outside.
  document.addEventListener('click', (e) => {
    document.querySelectorAll('.mega-btn').forEach((b) => {
      const wrap = b.closest('.mega-wrap');
      const wasOpen = b.getAttribute('aria-expanded') === 'true';
      let open = false;
      if (e.target.closest('.mega-btn') === b) open = !wasOpen;
      else if (wrap.contains(e.target)) open = wasOpen && !e.target.closest('a');
      b.setAttribute('aria-expanded', open ? 'true' : 'false');
      const menu = document.getElementById(b.getAttribute('aria-controls'));
      if (menu) menu.hidden = !open;
    });
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    document.querySelectorAll('.mega-btn[aria-expanded="true"]').forEach((b) => {
      b.setAttribute('aria-expanded', 'false');
      document.getElementById(b.getAttribute('aria-controls')).hidden = true;
      b.focus();
    });
  });

  // Offline: the service worker keeps every page and library you have used, so tools also work without internet.
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    addEventListener('load', () => {
      const base = (document.querySelector('script[src*="theme.js"]')?.getAttribute('src') || 'assets/theme.js').replace(/assets\/theme\.js.*$/, '');
      navigator.serviceWorker.register(base + 'sw.js').catch(() => {});
    });
  }
})();
