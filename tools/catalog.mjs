// Every tool on the site.
// tools/layout.mjs uses it for the header menu ("All tools"), the home grid and the footer.
// Category colours are in assets/style.css (.cat-<key>).

export const CATS = [
  { key: 'organize', name: 'Organize PDF' },
  { key: 'optimize', name: 'Optimize PDF' },
  { key: 'convert', name: 'Convert' },
  { key: 'edit', name: 'Edit & review' },
  { key: 'security', name: 'PDF security' },
  { key: 'files', name: 'File tools' },
  { key: 'eng', name: 'For engineers' },
];

const I = {
  merge: '<rect x="3" y="3" width="8" height="11" rx="1"/><rect x="13" y="10" width="8" height="11" rx="1"/><path d="M7 14v3a2 2 0 0 0 2 2h4"/>',
  split: '<rect x="6" y="3" width="12" height="18" rx="1"/><path d="M2 12h5M17 12h5"/>',
  pages: '<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="9" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 17.5h7M17.5 14v7"/>',
  rotate: '<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>',
  compress: '<path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8Z"/><path d="M14 3v5h5"/><path d="M12 10v3M12 17v1M10 11.5l2 2 2-2M10 16.5l2-2 2 2"/>',
  ocr: '<path d="M4 7V4h3M17 4h3v3M20 17v3h-3M7 20H4v-3"/><path d="M8 9h8M8 12h8M8 15h5"/>',
  removebg: '<path d="M4 20 20 4"/><circle cx="9" cy="8" r="3"/><path d="M4 19c1-3 3-5 5-5"/><path d="M14 20h6v-6" stroke-dasharray="2 2"/>',
  toword: '<path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8Z"/><path d="M14 3v5h5"/><path d="m8 11 1.5 6 2.5-4.5 2.5 4.5L16 11"/>',
  toimg: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 17-5-5-9 8"/>',
  topdf: '<path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8Z"/><path d="M14 3v5h5"/><path d="m8 17 3-4 2 2 1.5-1.5L17 17Z"/>',
  numbers: '<path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8Z"/><path d="M14 3v5h5"/><path d="M10 15.5l1.5-1.5v5M10 19h3"/>',
  watermark: '<path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8Z"/><path d="M14 3v5h5"/><path d="m8 17 8-6"/>',
  crop: '<path d="M6 2v14a2 2 0 0 0 2 2h14"/><path d="M18 22V8a2 2 0 0 0-2-2H2"/>',
  edit: '<path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h5"/><path d="M14 3v5h5"/><path d="M19.5 12.5a1.8 1.8 0 0 1 2.5 2.5L16 21l-3 .5.5-3Z"/>',
  compare: '<rect x="3" y="4" width="8" height="16" rx="1"/><rect x="13" y="4" width="8" height="16" rx="1"/><path d="M6 9h2M16 9h2M6 13h2M15 13h4"/>',
  protect: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  unlock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 7.5-2"/>',
  rename: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  list: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/>',
  organize: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/><path d="M8 13h8M12 9v8"/>',
  titleblock: '<path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9Z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
  splitrename: '<rect x="3" y="3" width="8" height="18" rx="1"/><path d="M14 7h7M14 12h7M14 17h4"/>',
  extract: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 9v12"/><path d="M13 13h5M13 17h3"/>',
  comments: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z"/><path d="M8 9h8M8 13h5"/>',
  preflight: '<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
  midp: '<path d="M4 4h10l6 6v10H4Z"/><path d="M14 4v6h6"/><path d="m8 15 2.5 2.5L16 12"/>',
};
export const icon = (k) => `<svg viewBox="0 0 24 24" aria-hidden="true">${I[k]}</svg>`;

// drop: what a home card accepts when a folder / files are dropped on it (home.js).
// Order = what people search for most first. unique: true = tools other PDF sites
// (iLovePDF and the like) don't have; the home grid shows them in their own group with a NEW badge.
export const TOOLS = [
  { href: 'merge.html', cat: 'organize', icon: 'merge', name: 'Merge PDF', desc: 'Combine PDFs, or a whole folder with its subfolders, into one file with a bookmark for each.', drop: 'pdf' },
  { href: 'pdf-to-word.html', cat: 'convert', icon: 'toword', name: 'PDF to Word', desc: 'Editable Word files from PDFs, scanned ones too. Arabic stays right-to-left.', drop: 'pdf' },
  { href: 'compress.html', cat: 'optimize', icon: 'compress', name: 'Compress PDF', desc: 'Make PDFs smaller. Pick a target size, like under 2 MB for email.', drop: 'pdf' },
  { href: 'pdf-to-image.html', cat: 'convert', icon: 'toimg', name: 'PDF to JPG', desc: 'Pages to JPG, PNG, WebP or TIFF, at the resolution you choose.', drop: 'pdf' },
  { href: 'remove-bg.html', cat: 'convert', icon: 'removebg', name: 'Remove Background', desc: 'Cut the background out of photos with AI. Transparent PNG, white or any colour.', drop: 'image' },
  { href: 'image-to-pdf.html', cat: 'convert', icon: 'topdf', name: 'JPG to PDF', desc: 'Photos and images to PDF: one file, or one per image or folder.', drop: 'image' },
  { href: 'split.html', cat: 'organize', icon: 'split', name: 'Split PDF', desc: 'By page ranges, every few pages, file size or bookmarks.', drop: 'pdf' },
  { href: 'rotate.html', cat: 'organize', icon: 'rotate', name: 'Rotate PDF', desc: 'Turn pages the right way in many files at once, or only the landscape ones.', drop: 'pdf' },
  { href: 'unlock.html', cat: 'security', icon: 'unlock', name: 'Unlock PDF', desc: 'Remove the password and restrictions from PDFs you can open.', drop: 'pdf' },
  { href: 'protect.html', cat: 'security', icon: 'protect', name: 'Protect PDF', desc: 'Add a password, and choose whether people can print, copy or edit.', drop: 'pdf' },
  { href: 'watermark.html', cat: 'edit', icon: 'watermark', name: 'Add Watermark', desc: 'Stamp text in any language, or a logo, on every page.', drop: 'pdf' },
  { href: 'page-numbers.html', cat: 'edit', icon: 'numbers', name: 'Add Page Numbers', desc: 'Page numbers or Bates numbers, on many PDFs at once.', drop: 'pdf' },
  { href: 'pages.html', cat: 'organize', icon: 'pages', name: 'Organize Pages', desc: 'See every page. Drag to reorder, rotate, delete or add blank pages.', drop: 'pdf' },
  { href: 'ocr.html', cat: 'optimize', icon: 'ocr', name: 'OCR PDF', desc: 'Make scanned PDFs searchable and copyable, in English and Arabic.', drop: 'pdf' },
  { href: 'crop.html', cat: 'edit', icon: 'crop', name: 'Crop PDF', desc: 'Draw the area to keep, or trim the white margins automatically.', drop: 'pdf' },
  { href: 'compare.html', cat: 'edit', icon: 'compare', name: 'Compare PDF', desc: 'Two versions laid over each other: what was removed and what was added.' },
  { href: 'rename.html', cat: 'files', icon: 'rename', name: 'Rename Files', desc: 'Prefix, suffix, find and replace in hundreds of names, with undo.', drop: 'folder', unique: true },
  { href: 'edit.html', cat: 'edit', icon: 'edit', name: 'Edit PDF Text', desc: 'Replace a value inside an area, across many PDFs at once.', drop: 'pdf', unique: true },
  { href: 'list.html', cat: 'files', icon: 'list', name: 'Files to Excel', desc: 'Every file in a folder and its subfolders, listed in Excel.', drop: 'folder', unique: true },
  { href: 'organize.html', cat: 'files', icon: 'organize', name: 'Organize Files', desc: 'Move or copy files into folders by type or by a word in the name.', drop: 'folder', unique: true },
  { href: 'splitrename.html', cat: 'eng', icon: 'splitrename', name: 'Split & Rename PDF', desc: 'One PDF per sheet from a combined set, named from each title block.', unique: true },
  { href: 'titleblock.html', cat: 'eng', icon: 'titleblock', name: 'Rename from Title Block', desc: 'Name each PDF drawing after the number and title in its title block.', drop: 'folder', unique: true },
  { href: 'extract.html', cat: 'eng', icon: 'extract', name: 'PDF to Excel', desc: 'Read the same boxes from every drawing into a spreadsheet. OCR included.', drop: 'pdf', unique: true },
  { href: 'comments.html', cat: 'eng', icon: 'comments', name: 'PDF Comments to Excel', desc: 'Review comments to an Excel response sheet, with a picture of each.', unique: true },
  { href: 'preflight.html', cat: 'eng', icon: 'preflight', name: 'Pre-flight Check', desc: 'Duplicate numbers, wrong names and missing drawings, before you send.', unique: true },
  { href: 'midp.html', cat: 'eng', icon: 'midp', name: 'MIDP Check', desc: 'A whole submission against the MIDP and TIDPs: missing, extra, wrong revisions.', unique: true },
];

export const byHref = (href) => TOOLS.find((t) => t.href === href);
