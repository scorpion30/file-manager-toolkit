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
})();
