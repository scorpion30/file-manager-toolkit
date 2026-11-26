// Writes the tool pages that use the shared tool kit (assets/kit.js) from one template.
// Run from the repo root:  node tools/kit-pages.mjs && node tools/layout.mjs && node tools/build.mjs
// Edit the page text and options here, not in the .html files (they are overwritten).
import fs from 'node:fs';
import { CATS, icon } from './catalog.mjs';

const catName = (k) => CATS.find((c) => c.key === k).name;

const seg = (name, items, { wrap = false } = {}) => `<div class="seg${wrap ? ' wrap' : ''}" role="radiogroup">${items.map(([v, label, small, checked]) =>
  `<label><input type="radio" name="${name}" value="${v}"${checked ? ' checked' : ''}><span>${label}</span>${small != null ? `<small data-for="${name}-${v}">${small}</small>` : ''}</label>`).join('')}</div>`;
const opt = (label, body, attrs = '') => `<div class="opt"${attrs}><span class="opt-label">${label}</span>${body}</div>`;
const posgrid = (name, def) => `<div class="posgrid" role="radiogroup" aria-label="Position">${['tl', 'tc', 'tr', 'ml', 'mc', 'mr', 'bl', 'bc', 'br'].map((p) =>
  `<label title="${{ tl: 'Top left', tc: 'Top centre', tr: 'Top right', ml: 'Middle left', mc: 'Centre', mr: 'Middle right', bl: 'Bottom left', bc: 'Bottom centre', br: 'Bottom right' }[p]}"><input type="radio" name="${name}" value="${p}"${p === def ? ' checked' : ''}></label>`).join('')}</div>`;
const pagesField = (id = 'optPages', label = 'Pages') => opt(label, `<input type="text" id="${id}" dir="ltr" placeholder="All pages, or e.g. 1-3, 5, 8-">`);
const sortSelect = `<select id="kitSort" aria-label="Sort files"><option value="">Sort…</option><option value="name">Name A → Z</option><option value="name-desc">Name Z → A</option><option value="date">Oldest first</option><option value="date-desc">Newest first</option><option value="size">Smallest first</option></select>`;

const PAGES = [
  // ---------------------------------------------------------------- PDF to image
  {
    file: 'pdf-to-image.html', script: 'pdf-to-image.js', cat: 'convert', icon: 'toimg',
    title: 'PDF to JPG, PNG, WebP or TIFF at any DPI, Free | File Manager Toolkit',
    desc: 'Convert PDF pages to JPG, PNG, WebP or TIFF images at the resolution you choose: 72, 150, 300, 600 DPI or your own. Colour, grey or black and white. Free, no upload, no file limit.',
    h1: 'PDF to JPG', sub: 'Turn PDF pages into images at the resolution you need, or take out the pictures inside.',
    pick: 'Select PDF files', runLabel: 'Convert to images', sort: true,
    options: [
      opt('Convert', seg('mode', [['pages', 'Every page', null, true], ['extract', 'Pictures inside']])),
      opt('Format', seg('format', [['jpg', 'JPG', null, true], ['png', 'PNG'], ['webp', 'WebP'], ['tiff', 'TIFF']])),
      opt('Resolution', seg('dpi', [['72', '72', 'screen'], ['150', '150', 'email', true], ['300', '300', 'print'], ['600', '600', 'archive'], ['custom', 'Other', 'DPI']], { wrap: true })
        + '<div class="inline" id="dpiCustomRow" hidden><input type="number" id="dpiCustom" min="20" max="1200" step="1" value="200" aria-label="DPI"><span class="hint">DPI (20 to 1200)</span></div>', ' id="dpiOpt"'),
      opt('Colour', seg('color', [['color', 'Colour', null, true], ['gray', 'Grey'], ['bw', 'Black & white']]), ' id="colorOpt"'),
      opt('Quality <span id="qVal" class="hint" style="display:inline">85</span>', '<input type="range" id="quality" min="20" max="100" value="85" aria-label="Quality">', ' id="qualityOpt"'),
      pagesField(),
      `<details class="more"><summary>More options</summary><div>
        ${opt('File names', '<input type="text" id="namePattern" dir="ltr" value="{name}-{page}"><p class="hint">{name} = PDF name, {page} = page number, {total} = page count</p>')}
        <label class="check" id="tiffMultiRow"><input type="checkbox" id="tiffMulti"> One multi-page TIFF for each PDF</label>
        <label class="check" id="alphaRow"><input type="checkbox" id="alpha"> Transparent background (PNG and WebP)</label>
      </div></details>`,
    ],
    howto: ['<b>Select your PDFs</b>, or a whole folder. They open in your browser and are not uploaded.', '<b>Choose the format and resolution.</b> 150 DPI is good for email and screens, 300 DPI for printing.', '<b>Convert</b>, then download the images as a ZIP or save them straight into a folder.'],
    faq: [
      ['What DPI should I choose?', '72 DPI for screens and slides, 150 DPI for email and documents, 300 DPI for printing, 600 DPI for archives and fine drawings. The size of each image is shown before you convert.'],
      ['Which format is best?', 'JPG is small and good for photos and scans. PNG is sharp for text and drawings. WebP is smaller than both. TIFF is for printing and archives, and can hold all pages in one file.'],
      ['Is there a limit on files or pages?', 'No. Everything runs on your computer, so there is no file count or size limit, only your computer\'s memory for very large pages.'],
      ['Can I get the pictures out of a PDF instead of whole pages?', 'Yes. Choose "Pictures inside" to save every photo and image in the PDF at its original size.'],
    ],
  },
  // ---------------------------------------------------------------- images to PDF
  {
    file: 'image-to-pdf.html', script: 'image-to-pdf.js', cat: 'convert', icon: 'topdf', accept: 'image',
    title: 'JPG to PDF: Images and Photos to PDF, Free, No Upload | File Manager Toolkit',
    desc: 'Convert JPG, PNG, WebP and other images to PDF: one PDF, one per image, or one per folder. Page size, orientation and margins. Phone photos are turned the right way. Free and private.',
    h1: 'JPG to PDF', sub: 'Photos, scans and screenshots to PDF, in the order you want.',
    pick: 'Select images', runLabel: 'Convert to PDF', sort: true,
    options: [
      opt('Page size', seg('size', [['fit', 'Same as image', null, true], ['a4', 'A4'], ['a3', 'A3'], ['letter', 'Letter']], { wrap: true })),
      opt('Orientation', seg('orient', [['auto', 'Auto', null, true], ['portrait', 'Portrait'], ['landscape', 'Landscape']]), ' id="orientOpt"'),
      opt('Margin', seg('margin', [['0', 'None', null, true], ['20', 'Small'], ['45', 'Big']])),
      opt('Make', seg('output', [['one', 'One PDF', null, true], ['each', 'A PDF per image'], ['folder', 'A PDF per folder']], { wrap: true })),
      opt('Image quality', seg('quality', [['original', 'Original', 'no change', true], ['small', 'Smaller file', '150 DPI']])),
      opt('File name', '<input type="text" id="outName" value="images.pdf">', ' id="outNameOpt"'),
    ],
    howto: ['<b>Select your images</b> or a folder of them. JPG, PNG, WebP, GIF, BMP and TIFF all work.', '<b>Put them in order</b> by dragging, or sort by name or date.', '<b>Choose the page size and margins</b>, then convert and download the PDF.'],
    faq: [
      ['Will my phone photos be sideways?', 'No. The rotation saved by the phone camera is read, so every photo is placed the right way up.'],
      ['Does converting lower the quality?', 'Not with "Original": JPG photos are placed in the PDF exactly as they are. "Smaller file" reduces them to 150 DPI for email.'],
      ['Can I make one PDF for each folder?', 'Yes. Select a folder with subfolders and choose "A PDF per folder": each folder becomes its own PDF.'],
    ],
  },
  // ---------------------------------------------------------------- compress
  {
    file: 'compress.html', script: 'compress.js', cat: 'optimize', icon: 'compress',
    title: 'Compress PDF to a Target Size (e.g. under 2 MB), Free | File Manager Toolkit',
    desc: 'Make PDF files smaller. Pick a level or a target size like 2 MB for email, and see the size of each level before you save. Many files at once, no upload, no limit.',
    h1: 'Compress PDF', sub: 'Make PDFs smaller for email and uploads, and see the new size before you save.',
    pick: 'Select PDF files', runLabel: 'Compress PDF',
    options: [
      opt('Compression', `<div class="seg wrap lv-seg" role="radiogroup">
        <label><input type="radio" name="level" value="light"><span>Light</span><small data-for="level-light">best quality</small></label>
        <label><input type="radio" name="level" value="recommended" checked><span>Recommended</span><small data-for="level-recommended">good quality</small></label>
        <label><input type="radio" name="level" value="strong"><span>Strong</span><small data-for="level-strong">smallest</small></label>
        <label><input type="radio" name="level" value="target"><span>Target size</span><small>you choose</small></label></div>
        <p class="hint" id="lvHint">The size each level gives is worked out for your first file.</p>`),
      opt('Target size per file', '<div class="inline"><input type="number" id="targetMb" min="0.1" step="0.1" value="2"><span>MB</span></div>', ' id="targetOpt" hidden'),
      `<details class="more"><summary>More options</summary><div>
        <label class="check"><input type="checkbox" id="optGray"> Convert pictures to grey (smaller)</label>
        <label class="check"><input type="checkbox" id="optMeta"> Remove document details (author, title, keywords)</label>
      </div></details>`,
    ],
    howto: ['<b>Select your PDFs</b>, or a folder of them.', '<b>Pick a level, or type a target size</b> such as 2 MB. The size each level gives is shown before you start.', '<b>Compress</b> and download, or save the smaller files into a folder.'],
    faq: [
      ['How much smaller will my PDF get?', 'It depends on what is inside. Scans and photos shrink a lot, often by 60 to 90 percent. PDFs that are mostly text or CAD lines are already small and change little.'],
      ['Can I compress a PDF to under 2 MB?', 'Yes. Choose "Target size" and type 2. The tool tries stronger settings until the file fits, and tells you if it cannot get that small.'],
      ['Does it lower the quality of text and drawings?', 'No. Only pictures and scans are made smaller. Text, lines and vector drawings stay sharp.'],
    ],
  },
  // ---------------------------------------------------------------- rotate
  {
    file: 'rotate.html', script: 'rotate.js', cat: 'organize', icon: 'rotate',
    title: 'Rotate PDF Pages, Many Files at Once, Free | File Manager Toolkit',
    desc: 'Rotate PDF pages and save them that way: all pages, only the landscape or portrait ones, or the pages you choose, in many files at once. Free, no upload.',
    h1: 'Rotate PDF', sub: 'Turn pages the right way and save them, in many files at once.',
    pick: 'Select PDF files', runLabel: 'Rotate PDF',
    options: [
      opt('Rotate', seg('angle', [['90', '↻ 90° right', null, true], ['180', '180°'], ['270', '↺ 90° left']])),
      opt('Which pages', seg('which', [['all', 'All', null, true], ['landscape', 'Landscape'], ['portrait', 'Portrait'], ['pick', 'Choose…']], { wrap: true })
        + '<input type="text" id="optPages" dir="ltr" placeholder="e.g. 1-3, 5" hidden>'),
      '<p class="hint">You can also turn one file only with the ↻ button on its picture.</p>',
    ],
    howto: ['<b>Select your PDFs.</b>', '<b>Choose the angle</b> and which pages: all of them, only landscape or portrait pages, or a list.', '<b>Rotate</b> and download. The pages are saved turned, so they open the right way everywhere.'],
    faq: [
      ['Is the rotation saved?', 'Yes. The new orientation is saved in the PDF, so it opens the right way in every reader and prints that way.'],
      ['Can I rotate only the landscape pages?', 'Yes. Choose "Landscape" to turn only pages that are wider than tall, for example drawings in a report.'],
    ],
  },
  // ---------------------------------------------------------------- page numbers
  {
    file: 'page-numbers.html', script: 'page-numbers.js', cat: 'edit', icon: 'numbers',
    title: 'Add Page Numbers or Bates Numbers to PDF, Free | File Manager Toolkit',
    desc: 'Add page numbers to PDF files: position, format (Page 1 of 10), first number, pages to skip, or Bates numbering across many files. Free, no upload, no limit.',
    h1: 'Add Page Numbers', sub: 'Page numbers or Bates numbers, on one PDF or hundreds.',
    pick: 'Select PDF files', runLabel: 'Add page numbers', sort: true,
    options: [
      opt('Position', `<div class="inline">${posgrid('pos', 'bc')}<span class="hint">Where the number goes on the page</span></div>`),
      opt('Text', `<select id="fmt"><option value="{n}">1</option><option value="Page {n}">Page 1</option><option value="Page {n} of {total}" selected>Page 1 of 10</option><option value="{n} / {total}">1 / 10</option><option value="- {n} -">- 1 -</option><option value="custom">Custom…</option></select>
        <input type="text" id="fmtCustom" value="{file} - page {n}" hidden><p class="hint" id="fmtHint" hidden>{n} = number, {total} = last number, {file} = file name</p>`),
      opt('First number', '<input type="number" id="startAt" value="1" min="0">'),
      opt('Pages to number', '<input type="text" id="optPages" dir="ltr" placeholder="All pages, or e.g. 2-"><label class="check"><input type="checkbox" id="skipFirst"> Skip the first page (cover)</label>'),
      `<details class="more"><summary>More options</summary><div>
        ${opt('Size and colour', '<div class="inline"><input type="number" id="fontSize" value="11" min="5" max="72" aria-label="Font size"><span class="hint">pt</span><input type="color" class="color-in" id="color" value="#000000" aria-label="Colour"><label class="check"><input type="checkbox" id="bold"> Bold</label></div>')}
        ${opt('Distance from the edge', '<div class="inline"><input type="number" id="margin" value="10" min="0" max="80"><span class="hint">mm</span></div>')}
        <label class="check"><input type="checkbox" id="mirror"> Double-sided: swap left and right on even pages</label>
        <label class="check"><input type="checkbox" id="bates"> Bates numbering: continue the numbers across all files</label>
        <div class="row2" id="batesRow" hidden><label>Prefix<input type="text" id="batesPrefix" value="DOC-" dir="ltr"></label><label>Digits<input type="number" id="batesDigits" value="6" min="1" max="12"></label></div>
      </div></details>`,
    ],
    howto: ['<b>Select your PDFs</b>, or a folder.', '<b>Choose where the number goes</b> and how it reads, like "Page 1 of 10".', '<b>Add the numbers</b> and download.'],
    faq: [
      ['Can I skip the cover page?', 'Yes. Tick "Skip the first page", or type the pages to number, like 2- for page 2 to the end. Set the first number to choose where counting starts.'],
      ['What is Bates numbering?', 'One running number across a whole set of documents, with a prefix, such as DOC-000001 to DOC-000250. It is used for legal and contract documents and for document control.'],
      ['Can I number many PDFs at once?', 'Yes. Select as many files as you like, or a whole folder. Each file gets its own numbers, or one running number with Bates numbering.'],
    ],
  },
  // ---------------------------------------------------------------- watermark
  {
    file: 'watermark.html', script: 'watermark.js', cat: 'edit', icon: 'watermark',
    title: 'Add Watermark to PDF: Text in Any Language or Logo, Free | File Manager Toolkit',
    desc: 'Stamp a text or image watermark on PDF pages: CONFIDENTIAL, DRAFT, your logo, in any language including Arabic. Position, size, angle and transparency. Many files at once, no upload.',
    h1: 'Add Watermark', sub: 'Stamp a word or your logo on every page: DRAFT, CONFIDENTIAL, any language.',
    pick: 'Select PDF files', runLabel: 'Add watermark',
    options: [
      opt('Watermark', seg('kind', [['text', 'Text', null, true], ['image', 'Image or logo']])),
      opt('Text', '<input type="text" id="wmText" value="CONFIDENTIAL"><div class="inline"><input type="color" class="color-in" id="wmColor" value="#d62828" aria-label="Colour"><label class="check"><input type="checkbox" id="wmBold" checked> Bold</label></div>', ' id="textOpt"'),
      opt('Image', '<div class="inline"><button type="button" class="btn" id="wmPick">Choose image…</button><span class="hint" id="wmImgName">PNG or JPG</span></div>', ' id="imageOpt" hidden'),
      opt('Position', `<div class="inline">${posgrid('pos', 'mc')}<label class="check"><input type="checkbox" id="tile"> Repeat across the page</label></div>`),
      opt('Size <span class="hint" id="sizeVal" style="display:inline">50%</span> <span class="hint" style="display:inline">of the page width</span>', '<input type="range" id="size" min="5" max="100" value="50">'),
      opt('Angle', seg('angle', [['0', '0°'], ['45', '45°', null, true], ['90', '90°'], ['-45', '-45°']])),
      opt('Opacity <span class="hint" id="opVal" style="display:inline">30%</span>', '<input type="range" id="opacity" min="5" max="100" value="30" aria-label="Opacity">'),
      `<details class="more"><summary>More options</summary><div>
        ${opt('Layer', seg('layer', [['over', 'Over the content', null, true], ['under', 'Under the content']]))}
        ${pagesField()}
      </div></details>`,
    ],
    howto: ['<b>Select your PDFs.</b>', '<b>Type the text or choose your logo</b>, then set the position, size, angle and transparency. The preview shows the first page.', '<b>Add the watermark</b> and download.'],
    faq: [
      ['Can I write the watermark in Arabic?', 'Yes. Any language works, including Arabic, with the letters joined correctly.'],
      ['Over or under the content?', '"Over" is always visible. "Under" sits behind text and drawings like a light background, but it can be hidden on scanned pages, which are pictures.'],
    ],
    previewBox: true,
  },
  // ---------------------------------------------------------------- crop
  {
    file: 'crop.html', script: 'crop.js', cat: 'edit', icon: 'crop',
    title: 'Crop PDF Pages or Trim White Margins, Free | File Manager Toolkit',
    desc: 'Crop PDF pages by drawing the area to keep, or trim the white margins of every page automatically. Many files at once, free, no upload.',
    h1: 'Crop PDF', sub: 'Draw the area to keep, or trim the white margins automatically.',
    pick: 'Select PDF files', runLabel: 'Crop PDF',
    options: [
      opt('How', seg('mode', [['draw', 'Draw the area', null, true], ['trim', 'Trim white margins']])),
      opt('Margins to cut (mm)', '<div class="row2"><label>Top<input type="number" id="mTop" value="0" min="0" step="1"></label><label>Bottom<input type="number" id="mBottom" value="0" min="0" step="1"></label><label>Left<input type="number" id="mLeft" value="0" min="0" step="1"></label><label>Right<input type="number" id="mRight" value="0" min="0" step="1"></label></div><p class="hint">Drag on the page to draw the area to keep.</p>', ' id="drawOpt"'),
      opt('Space to keep around the content', '<div class="inline"><input type="number" id="pad" value="5" min="0" max="50"><span class="hint">mm</span></div>', ' id="trimOpt" hidden'),
      pagesField(),
    ],
    howto: ['<b>Select your PDFs.</b>', '<b>Drag a box</b> on the page around what you want to keep, or choose "Trim white margins".', '<b>Crop</b> and download.'],
    faq: [
      ['Is the cropped part deleted?', 'It is hidden: every PDF reader shows and prints only the area you kept. The original content is still inside the file.'],
      ['Can I trim different margins on each page?', 'Yes. "Trim white margins" finds the content on each page separately and cuts around it.'],
    ],
    cropBox: true,
  },
  // ---------------------------------------------------------------- protect
  {
    file: 'protect.html', script: 'protect.js', cat: 'security', icon: 'protect',
    title: 'Protect PDF with a Password (AES-256), Free, No Upload | File Manager Toolkit',
    desc: 'Add a password to PDF files with AES-256 encryption, and choose whether people can print, copy or edit. Many files at once. Your files and passwords never leave your computer.',
    h1: 'Protect PDF', sub: 'Lock PDFs with a password, and choose what people can do with them.',
    pick: 'Select PDF files', runLabel: 'Protect PDF',
    options: [
      opt('Password', '<input type="password" id="pw1" autocomplete="new-password" placeholder="Password"><input type="password" id="pw2" autocomplete="new-password" placeholder="Type it again"><label class="check"><input type="checkbox" id="showPw"> Show the password</label>'),
      opt('People who open it can', '<label class="check"><input type="checkbox" id="pPrint" checked> Print</label><label class="check"><input type="checkbox" id="pCopy" checked> Copy text and images</label><label class="check"><input type="checkbox" id="pAnnot" checked> Add comments and fill forms</label><label class="check"><input type="checkbox" id="pEdit"> Edit, and add or remove pages</label>'),
      `<details class="more"><summary>More options</summary><div>
        ${opt('Encryption', seg('enc', [['aes-256', 'AES-256', 'recommended', true], ['aes-128', 'AES-128', 'older readers']]))}
        ${opt('Owner password', '<input type="password" id="pwOwner" autocomplete="new-password" placeholder="Optional"><p class="hint">Lets you change the permissions later. Without it, a random one is used.</p>')}
      </div></details>`,
    ],
    howto: ['<b>Select your PDFs</b>, or a folder.', '<b>Type a password</b> and choose what people may do: print, copy, edit.', '<b>Protect</b> and download. The PDFs ask for the password when opened.'],
    faq: [
      ['Is my password sent anywhere?', 'No. The files are encrypted in your browser. Neither the files nor the password leave your computer.'],
      ['How strong is the protection?', 'AES-256, the strongest encryption PDF supports. Use a long password: it cannot be recovered if you forget it.'],
    ],
  },
  // ---------------------------------------------------------------- unlock
  {
    file: 'unlock.html', script: 'unlock.js', cat: 'security', icon: 'unlock',
    title: 'Unlock PDF: Remove Password and Restrictions, Free | File Manager Toolkit',
    desc: 'Remove the password and the print, copy and edit restrictions from PDF files you are allowed to open. Many files at once, free, nothing uploaded.',
    h1: 'Unlock PDF', sub: 'Remove the password and the print, copy and edit restrictions from your PDFs.',
    pick: 'Select PDF files', runLabel: 'Unlock PDF', allowLocked: true,
    options: [
      opt('Password', '<input type="password" id="pw" autocomplete="off" placeholder="Only if the PDF asks for one"><label class="check"><input type="checkbox" id="showPw"> Show the password</label><p class="hint">Files marked 🔒 need the password to open. Files that only block printing or copying are unlocked without one.</p>'),
    ],
    howto: ['<b>Select the protected PDFs.</b>', '<b>Type the password</b> if they ask for one when you open them.', '<b>Unlock</b> and download PDFs that open, print and copy freely.'],
    faq: [
      ['Can it open a PDF without knowing the password?', 'No. You need the password that opens the file. Restrictions on printing, copying or editing are removed without it.'],
      ['Only unlock files you are allowed to', 'Use this for your own files, or files whose owner allows it.'],
    ],
  },
  // ---------------------------------------------------------------- OCR
  {
    file: 'ocr.html', script: 'ocr.js', cat: 'optimize', icon: 'ocr',
    title: 'OCR PDF: Make Scanned PDFs Searchable, English and Arabic, Free | File Manager Toolkit',
    desc: 'Turn scanned PDFs into searchable PDFs you can copy text from. English, Arabic and other languages. Many files and pages, free, no upload, no limit.',
    h1: 'OCR PDF', sub: 'Make scanned PDFs searchable and copyable, in Arabic, English and more.',
    pick: 'Select PDF files', runLabel: 'Make searchable',
    options: [
      opt('Languages in the document', `<div class="row2">
        <label class="check"><input type="checkbox" name="lang" value="eng" checked> English</label>
        <label class="check"><input type="checkbox" name="lang" value="ara" checked> Arabic</label>
        <label class="check"><input type="checkbox" name="lang" value="fra"> French</label>
        <label class="check"><input type="checkbox" name="lang" value="deu"> German</label>
        <label class="check"><input type="checkbox" name="lang" value="spa"> Spanish</label>
        <label class="check"><input type="checkbox" name="lang" value="urd"> Urdu</label>
        <label class="check"><input type="checkbox" name="lang" value="hin"> Hindi</label>
        <label class="check"><input type="checkbox" name="lang" value="tur"> Turkish</label></div>`),
      opt('Accuracy', seg('dpi', [['200', 'Fast', '200 DPI'], ['300', 'Accurate', '300 DPI', true]])),
      pagesField(),
      '<label class="check"><input type="checkbox" id="skipText" checked> Skip pages that already have text</label>',
      '<p class="hint">The first run downloads the reading engine and language files (a few MB), then it works offline.</p>',
    ],
    howto: ['<b>Select your scanned PDFs.</b>', '<b>Tick the languages</b> written in them.', '<b>Make searchable</b>. The pages look the same, but you can now search, select and copy the text.'],
    faq: [
      ['Does the PDF look different after OCR?', 'No. The pages stay exactly as they were. An invisible text layer is added on top, so you can search and copy.'],
      ['Does it read Arabic?', 'Yes. Tick Arabic, or both Arabic and English for mixed documents.'],
      ['Is there a page limit?', 'No. Long documents just take longer, because the reading happens on your own computer.'],
    ],
  },
  // ---------------------------------------------------------------- merge
  {
    file: 'merge.html', script: 'merge.js', cat: 'organize', icon: 'merge',
    title: 'Merge PDF Files and Folders, with Bookmarks, Free, No Upload | File Manager Toolkit',
    desc: 'Combine PDF files, or a whole folder with its subfolders, into one PDF. Natural sorting, a bookmark for each file, a clickable table of contents. Free, no upload, no limit.',
    h1: 'Merge PDF', sub: 'Combine PDFs, or a whole folder with its subfolders, into one file.',
    pick: 'Select PDF files', runLabel: 'Merge PDF', sort: true, view: 'rows',
    options: [
      opt('Bookmarks', seg('bm', [['file', 'One per file', null, true], ['folder', 'By folder'], ['none', 'None']])),
      '<label class="check"><input type="checkbox" id="keepBm" checked> Keep the bookmarks inside each file</label>',
      '<label class="check"><input type="checkbox" id="toc"> Add a table of contents page</label>',
      `<details class="more"><summary>More options</summary><div>
        <label class="check"><input type="checkbox" id="footer"> Print the file name at the bottom of each page</label>
        <label class="check"><input type="checkbox" id="blank"> Double-sided printing: add a blank page after files with an odd number of pages</label>
      </div></details>`,
      opt('File name', '<input type="text" id="outName" value="merged.pdf">'),
    ],
    howto: ['<b>Select your PDFs, or a whole folder</b>. Files in subfolders are included, in natural order (2 before 10).', '<b>Drag to change the order</b>, or sort by name or date.', '<b>Merge</b>. Every file gets a bookmark, so the combined PDF is easy to move around.'],
    faq: [
      ['Can I merge all the PDFs in a folder and its subfolders?', 'Yes. Select the folder: every PDF inside, at any depth, is added in folder order, and you can make a bookmark for each folder.'],
      ['Will "file 10" come after "file 2"?', 'Yes. Names are sorted the way people count, not letter by letter.'],
      ['Is there a limit on the number of files?', 'No. Hundreds of files are fine.'],
    ],
    guide: ['guides/merge-pdf-without-uploading.html', 'How to merge PDF files without uploading them'],
  },
  // ---------------------------------------------------------------- split
  {
    file: 'split.html', script: 'split.js', cat: 'organize', icon: 'split',
    title: 'Split PDF by Pages, Every N Pages, Size or Bookmarks, Free | File Manager Toolkit',
    desc: 'Split PDF files by page ranges, every few pages, file size (like 10 MB parts) or bookmarks, or extract pages into a new PDF. Free, many files at once, no upload.',
    h1: 'Split PDF', sub: 'Split by page ranges, every few pages, file size or bookmarks.',
    pick: 'Select PDF files', runLabel: 'Split PDF',
    options: [
      opt('Split', seg('mode', [['ranges', 'Page ranges', null, true], ['every', 'Every N pages'], ['size', 'By file size'], ['bookmarks', 'By bookmarks'], ['extract', 'Extract pages'], ['each', 'Every page']], { wrap: true })),
      opt('Ranges', '<input type="text" id="ranges" dir="ltr" value="1-3, 4-" placeholder="e.g. 1-3, 4-6, 7-"><p class="hint">A file for each range. "4-" means page 4 to the end.</p>', ' data-mode="ranges"'),
      opt('Pages per file', '<input type="number" id="everyN" value="2" min="1">', ' data-mode="every" hidden'),
      opt('Largest file size', '<div class="inline"><input type="number" id="maxMb" value="10" min="0.1" step="0.1"><span>MB</span></div>', ' data-mode="size" hidden'),
      opt('Bookmark level', seg('bmLevel', [['1', 'Top level', null, true], ['2', 'Second level']]) + '<p class="hint">A file for each bookmark, named after it.</p>', ' data-mode="bookmarks" hidden'),
      opt('Pages to extract', '<input type="text" id="extractPages" dir="ltr" placeholder="e.g. 1, 3, 5-7"><p class="hint">Copied into one new PDF, in this order.</p>', ' data-mode="extract" hidden'),
      opt('File names', '<input type="text" id="namePattern" dir="ltr" value="{name}-{part}"><p class="hint">{name} = PDF name, {part} = part number or bookmark, {pages} = page range</p>'),
    ],
    howto: ['<b>Select your PDF</b> (or several: each is split the same way).', '<b>Choose how to split</b>: page ranges, every few pages, a size limit for email, or the bookmarks.', '<b>Split</b> and download the parts as a ZIP or into a folder.'],
    faq: [
      ['Can I split a PDF into parts under 10 MB?', 'Yes. Choose "By file size" and type 10. Each part is kept under that size, without cutting a page in half.'],
      ['Can I split a PDF by chapters?', 'Yes, if the PDF has bookmarks: choose "By bookmarks" and every chapter becomes its own file, named after it.'],
    ],
    guide: ['guides/split-pdf-drawing-set-into-sheets.html', 'Split a PDF drawing set into one file per sheet'],
  },
  // ---------------------------------------------------------------- organize pages
  {
    file: 'pages.html', script: 'pages.js', cat: 'organize', icon: 'pages',
    title: 'Organize PDF Pages: Reorder, Rotate, Delete, Add, Free | File Manager Toolkit',
    desc: 'See every page of your PDFs. Drag pages to reorder them, rotate, delete, duplicate or add blank pages, and combine pages from several PDFs. Free, no upload.',
    h1: 'Organize Pages', sub: 'See every page. Drag to reorder, rotate, delete, or add blank pages.',
    pick: 'Select PDF files', runLabel: 'Save PDF', view: 'rows',
    options: [
      opt('All pages', '<div class="inline"><button type="button" class="btn" id="rotAllL">↺ Rotate all</button><button type="button" class="btn" id="rotAllR">↻ Rotate all</button></div><div class="inline"><button type="button" class="btn" id="reverse">Reverse order</button><button type="button" class="btn" id="addBlank">+ Blank page</button></div>'),
      '<p class="hint">Drag a page to move it. Use the buttons on a page to rotate, copy or delete it.</p>',
      opt('File name', '<input type="text" id="outName" value="organized.pdf">'),
    ],
    howto: ['<b>Select one or more PDFs</b>. All their pages appear as pictures.', '<b>Drag pages</b> into the order you want, rotate or delete them, or add a blank page.', '<b>Save</b> the new PDF.'],
    faq: [
      ['Can I combine pages from different PDFs?', 'Yes. Add several PDFs: all their pages appear together, and you can mix them in any order.'],
      ['Can I undo a deleted page?', 'Click "Start over", or add the file again. Nothing changes in your original files.'],
    ],
    pageGrid: true,
  },
  // ---------------------------------------------------------------- compare
  {
    file: 'compare.html', script: 'compare.js', cat: 'edit', icon: 'compare',
    title: 'Compare Two PDFs: See What Changed, Free, No Upload | File Manager Toolkit',
    desc: 'Compare two versions of a PDF, drawing or document. Removed parts in red, added parts in green, side by side or overlaid, plus the text that changed and a PDF report. Free, no upload.',
    h1: 'Compare PDF', sub: 'Two versions of a document or drawing: see exactly what was removed and what was added.',
    pick: 'Select the two PDFs', runLabel: 'Download the report',
    options: [
      opt('Show', seg('view', [['overlay', 'Overlay', null, true], ['side', 'Side by side']])),
      opt('Sensitivity', seg('sens', [['low', 'Low', 'ignores tiny shifts'], ['normal', 'Normal', null, true], ['high', 'High', 'every pixel']])),
      '<label class="check"><input type="checkbox" id="cmpText" checked> Compare the text too</label>',
      '<p class="hint">The first file is the old version, the second the new one. Drag to swap them.</p>',
    ],
    howto: ['<b>Select the two versions</b> of the PDF: the old one first, then the new one.', '<b>Look at each page</b>: removed parts are red, added parts are green. Switch to side by side if you prefer.', '<b>Download the report</b>: a PDF with every changed page marked, to send or file.'],
    faq: [
      ['Does it work for drawings?', 'Yes. Drawings are compared as pictures, line by line, so moved walls, new dimensions and deleted notes all show. It works for scanned pages too.'],
      ['What if the pages are different sizes?', 'The new page is scaled to the old page, so a drawing printed to a different paper size still lines up.'],
      ['Are my files uploaded?', 'No. Both PDFs are compared in your browser.'],
    ],
    compare: true,
  },
];

// ------------------------------------------------------------------ template
function page(p) {
  const accept = p.accept || 'pdf';
  const cat = p.cat;
  const big = icon(p.icon).replace('<svg ', '<svg class="icon" width="60" height="60" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" ');
  return `<!doctype html>
<html lang="en" data-lang-page="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${p.title}</title>
  <meta name="description" content="${p.desc}">
  <!-- seo:start -->
  <!-- seo:end -->
  <link rel="icon" href="assets/favicon.ico">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Manrope:wght@600;700;800&display=swap">
  <link rel="stylesheet" href="assets/style.css">
  <script src="assets/theme.js"></script>
  <script src="assets/i18n.js"></script>
</head>
<body>
  <header class="site-header"></header>

  <main class="kit cat-${cat}" data-accept="${accept}">
    <div class="tool-head">
      <div>
        <div class="crumb"><a href="./">All tools</a> / <a href="./#${cat}">${catName(cat)}</a></div>
        <div class="tool-title">
          <span class="tool-icon cat-${cat}">${icon(p.icon)}</span>
          <div><h1>${p.h1}</h1><p>${p.sub}</p></div>
        </div>
      </div>
    </div>

    <section class="dropzone" id="kitDrop">
      ${big}
      <div class="kit-pick" style="margin-top:14px">
        <button type="button" class="btn primary lg" data-kit="files">${p.pick}</button>
        <button type="button" class="btn lg" data-kit="folder">📁 Select a folder</button>
      </div>
      <p class="hint kit-drop-note">or drop ${accept === 'pdf' ? 'PDF files' : 'images'} or a folder here</p>
      <div class="kit-limits"><span>Nothing is uploaded</span><span>No limit on files or size</span><span>Free, no sign-up</span></div>
    </section>

    <section class="kit-work" id="kitWork" hidden>
      <div class="panel kit-main">
        <div class="kit-toolbar">
          <b id="kitCount"></b><span class="spacer"></span>
          ${p.sort ? sortSelect : ''}
          <button type="button" class="btn" data-kit="files">+ Add files</button>
          <button type="button" class="btn" data-kit="folder">+ Folder</button>
          <button type="button" class="btn ghost" data-kit="clear">Clear</button>
        </div>
        <ul class="kit-files" id="kitFiles"></ul>
        ${p.previewBox ? '<div class="kit-preview live-preview" id="livePreview" aria-label="Preview of the first page"></div>' : ''}
        ${p.cropBox ? '<div class="crop-stage" id="cropStage"><p class="hint" id="cropHint">Drag on the page to draw the area to keep.</p><div class="crop-wrap" id="cropWrap"><img id="cropImg" alt=""><div class="crop-rect" id="cropRect" hidden></div></div></div>' : ''}
        ${p.pageGrid ? '<div class="page-grid" id="pageGrid"></div>' : ''}
        ${p.compare ? '<div class="cmp-view" id="cmpView"></div>' : ''}
      </div>
      <aside class="panel kit-side">
        <div class="kit-opts" id="kitOpts">
          <h2>Options</h2>
          ${p.options.join('\n          ')}
        </div>
        <div class="kit-run-box">
          <button type="button" class="btn kit-run" id="kitRun">${p.runLabel}</button>
          <p class="kit-est" id="kitEst"></p>
        </div>
      </aside>
    </section>

    <section class="panel kit-busy" id="kitBusy" hidden>
      <h2 id="kitBusyTitle">Working…</h2>
      <div class="kit-bar"><i id="kitBar"></i></div>
      <p id="kitBusyText"></p>
    </section>

    <section class="panel kit-done" id="kitDone" hidden>
      <div class="ok-ico">✓</div>
      <h2 id="kitDoneTitle"></h2>
      <p class="sum" id="kitDoneText"></p>
      <div class="dl-row" id="kitDl"></div>
      <div class="kit-preview" id="kitPreview"></div>
      <ul class="kit-out" id="kitOut" hidden></ul>
      <div class="kit-again"><button type="button" class="btn ghost" id="kitBack">← Change the options</button> <button type="button" class="btn ghost" id="kitRestart">Start over with other files</button></div>
      <div class="kit-next" id="kitNext"><b>Continue with the result</b><div class="chips" id="kitNextChips"></div></div>
    </section>

    <section class="kit-about">
      <div>
        <h2>How to use ${p.h1}</h2>
        <ol>${p.howto.map((h) => `<li>${h}</li>`).join('')}</ol>
        ${p.guide ? `<p class="hint" style="margin-top:14px">Step-by-step guide: <a href="${p.guide[0]}">${p.guide[1]}</a></p>` : ''}
      </div>
      <div>
        <h2>Questions</h2>
        ${p.faq.map(([q, a]) => `<details><summary>${q}</summary><p>${a}</p></details>`).join('\n        ')}
      </div>
    </section>
  </main>

  <footer class="site-footer"></footer>

  <script src="assets/common.js"></script>
  <script src="assets/pdfops.js"></script>
  <script src="assets/kit.js"></script>
  <script src="assets/${p.script}"></script>
</body>
</html>
`;
}

const only = process.argv.slice(2);
for (const p of PAGES) {
  if (only.length && !only.includes(p.file)) continue;
  fs.writeFileSync(p.file, page(p));
}
console.log(`kit-pages: wrote ${only.length || PAGES.length} page(s)`);
export { PAGES };
