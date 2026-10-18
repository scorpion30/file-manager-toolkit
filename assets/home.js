/* Home page: tool filter (All / File / PDF / Review). The header links #files, #pdf
 * and #review pick the matching filter, so they keep working. */
(() => {
  'use strict';
  const groups = { files: 'files', pdf: 'pdf', review: 'review' };

  function show(filter) {
    document.querySelectorAll('.filter [data-filter]').forEach((b) => {
      const on = b.dataset.filter === filter;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    document.querySelectorAll('.tool-group').forEach((g) => {
      g.hidden = filter !== 'all' && g.id !== filter;
    });
  }

  function fromHash() {
    const id = location.hash.slice(1);
    if (groups[id]) {
      show(id);
      document.querySelector('.tools-head')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.filter [data-filter]').forEach((b) => {
      b.addEventListener('click', () => {
        show(b.dataset.filter);
        history.replaceState(null, '', b.dataset.filter === 'all' ? '#tools' : '#' + b.dataset.filter);
      });
    });
    show('all');
    fromHash();
  });
  addEventListener('hashchange', fromHash);
})();
