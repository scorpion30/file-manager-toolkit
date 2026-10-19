// Builds the search-engine side of the site. Run from the repo root after editing any page:
//
//   node tools/build.mjs          pages, Arabic copies, sitemap.xml, robots.txt
//   node tools/build.mjs --og     the same + share images in assets/og/ (needs Chrome or Edge)
//   node tools/build.mjs --og-new only the share images that do not exist yet
//
// What it does:
// - English pages (*.html): writes the block between <!-- seo:start --> and <!-- seo:end -->
//   (canonical, hreflang, Open Graph, analytics) and marks <html data-lang-page="en">.
// - Arabic pages (ar/*.html): generated from the English page, with the text translated by the
//   dictionary in assets/i18n.js, so Arabic text is in the HTML itself and search engines see it.
//   Never edit ar/ by hand: it is overwritten on every run.
// - Guides (guides/*.html, guide: true): the same, with their Arabic text in tools/guides-ar.mjs (a
//   dictionary used only here, so the long guide text is not loaded on every page), the screenshots
//   swapped for the -ar ones, and FAQPage / HowTo JSON-LD built from the page's own FAQ and steps.
// - sitemap.xml and robots.txt.

import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import GUIDES_AR from './guides-ar.mjs';

const ROOT = process.cwd();
const SITE = 'https://filemanagertoolkit.com/';
const BRAND = 'File Manager Toolkit';

// cat = colour of the share image: files (blue), pdf (red), qa (green).
const PAGES = [
  {
    file: 'index.html', cat: 'files',
    en: { title: `${BRAND} – Free bulk file and PDF tools for engineers`, name: BRAND, pitch: 'Bulk file and PDF tools for engineers and architects' },
    ar: {
      title: `أدوات ملفات و PDF مجانية للمهندسين | ${BRAND}`, name: BRAND, pitch: 'أدوات ملفات و PDF بالجملة للمهندسين والمعماريين',
      desc: 'أدوات مجانية أونلاين لإعادة تسمية الملفات بالجملة، وتحويل قائمة الملفات إلى Excel، وترتيب الملفات، ودمج وتقسيم وقراءة وتعديل ملفات PDF. كل شيء يعمل داخل متصفحك وملفاتك لا تُرفع لأي سيرفر.',
    },
  },
  {
    file: 'rename.html', cat: 'files',
    en: { title: `Rename Files in Bulk Online, Free | ${BRAND}`, name: 'Rename Files', pitch: 'Rename thousands of files in seconds' },
    ar: {
      title: `إعادة تسمية الملفات دفعة واحدة مجاناً | ${BRAND}`, name: 'إعادة تسمية الملفات', pitch: 'غيّر أسماء آلاف الملفات في ثوانٍ',
      desc: 'غيّر أسماء آلاف الملفات مرة واحدة: إضافة بادئة أو لاحقة، بحث واستبدال، تعديل يدوي، حذف وتراجع، وتصدير القائمة إلى Excel. يعمل في المتصفح بدون رفع ملفات.',
    },
  },
  {
    file: 'list.html', cat: 'files',
    en: { title: `List Folder Files to Excel, Free | ${BRAND}`, name: 'Files to Excel', pitch: 'Every file in a folder tree, in one Excel workbook' },
    ar: {
      title: `قائمة ملفات الفولدر إلى Excel مجاناً | ${BRAND}`, name: 'قائمة الملفات إلى Excel', pitch: 'كل ملفات الفولدر وفولدراته الفرعية في ملف Excel',
      desc: 'اعرض كل الملفات داخل فولدر وكل الفولدرات الفرعية، وصدّرها إلى Excel بورقة لكل فولدر أو لكل نوع ملف مع ملخص بالأعداد.',
    },
  },
  {
    file: 'organize.html', cat: 'files',
    en: { title: `Organize Files into Folders by Type | ${BRAND}`, name: 'Organize Files', pitch: 'Sort files into folders by type or keyword' },
    ar: {
      title: `ترتيب الملفات في فولدرات حسب النوع | ${BRAND}`, name: 'تنظيم الملفات', pitch: 'رتّب الملفات في فولدرات حسب النوع أو كلمة في الاسم',
      desc: 'انقل أو انسخ الملفات إلى فولدرات حسب نوعها (PDF و DWG وغيرها) أو حسب كلمة في اسم الملف، في نفس الفولدر أو فولدر آخر.',
    },
  },
  {
    file: 'titleblock.html', cat: 'pdf',
    en: { title: `Rename PDF Drawings from Title Block, Free | ${BRAND}`, name: 'Rename from Title Block', pitch: 'Name PDF drawings after their title block' },
    ar: {
      title: `تسمية ملفات اللوحات PDF من جدول العنوان (Title Block) | ${BRAND}`, name: 'التسمية من الـ Title Block', pitch: 'سمِّ ملفات اللوحات من جدول العنوان تلقائياً',
      desc: 'سمِّ ملفات اللوحات الهندسية PDF تلقائياً من رقم اللوحة وعنوانها في جدول العنوان. يقرأ نص الـ PDF أو اللوحات الممسوحة ضوئياً بتقنية OCR عربي وإنجليزي.',
    },
  },
  {
    file: 'merge.html', cat: 'pdf',
    en: { title: `Merge PDF Files Free, No Upload | ${BRAND}`, name: 'Merge PDF', pitch: 'Combine PDFs in the order you choose' },
    ar: {
      title: `دمج ملفات PDF مجاناً بدون رفع | ${BRAND}`, name: 'دمج PDF', pitch: 'اجمع ملفات PDF في ملف واحد بالترتيب الذي تختاره',
      desc: 'اجمع عدة ملفات PDF في ملف واحد بالترتيب الذي تختاره. مجاني وآمن: يعمل داخل متصفحك وملفاتك لا تُرفع.',
    },
  },
  {
    file: 'split.html', cat: 'pdf',
    en: { title: `Split PDF by Page Ranges, Free | ${BRAND}`, name: 'Split PDF', pitch: 'Split by page ranges or into single pages' },
    ar: {
      title: `تقسيم ملف PDF حسب الصفحات مجاناً | ${BRAND}`, name: 'تقسيم PDF', pitch: 'قسّم الملف حسب الصفحات أو صفحة صفحة',
      desc: 'قسّم ملف PDF حسب نطاقات صفحات مثل 1-3، 5، 8-10، أو كل صفحة في ملف. مجاني وآمن: يعمل داخل متصفحك.',
    },
  },
  {
    file: 'extract.html', cat: 'pdf',
    en: { title: `PDF to Excel from Drawing Areas (OCR) | ${BRAND}`, name: 'PDF to Excel', pitch: 'Read the same boxes from every drawing into Excel' },
    ar: {
      title: `تحويل PDF إلى Excel من مناطق في اللوحة (OCR عربي) | ${BRAND}`, name: 'PDF إلى Excel', pitch: 'اقرأ نفس الخانات من كل اللوحات إلى Excel',
      desc: 'ارسم مربعات على اللوحة واقرأ النص داخلها من عشرات ملفات PDF إلى جدول Excel. يدعم نص الـ PDF والملفات الممسوحة ضوئياً بالعربي والإنجليزي.',
    },
  },
  {
    file: 'edit.html', cat: 'pdf',
    en: { title: `Edit Text in Many PDFs at Once | ${BRAND}`, name: 'Edit PDF Text', pitch: 'Replace a title block value across many PDFs' },
    ar: {
      title: `تعديل نص داخل ملفات PDF كثيرة مرة واحدة | ${BRAND}`, name: 'تعديل نص PDF', pitch: 'غيّر قيمة في جدول العنوان في ملفات كثيرة مرة واحدة',
      desc: 'ابحث واستبدل نصاً داخل منطقة محددة في ملفات PDF كثيرة، مثل خانة في جدول العنوان، مع الحفاظ على الخط والحجم والزاوية.',
    },
  },
  {
    file: 'comments.html', cat: 'qa',
    en: { title: `PDF Comments to Excel Comment Sheet | ${BRAND}`, name: 'Comment Sheet', pitch: 'Client PDF comments to an Excel comment sheet' },
    ar: {
      title: `تحويل تعليقات PDF إلى جدول تعليقات Excel | ${BRAND}`, name: 'جدول التعليقات', pitch: 'تعليقات العميل على الـ PDF في جدول Excel',
      desc: 'حوّل تعليقات المراجعة في ملفات PDF إلى جدول رد على التعليقات في Excel: رقم اللوحة، التعليق، الكاتب، التاريخ وصورة لمكان التعليق.',
    },
  },
  {
    file: 'preflight.html', cat: 'qa',
    en: { title: `Drawing Issue Pre-flight Check | ${BRAND}`, name: 'Pre-flight Check', pitch: 'Catch drawing issue mistakes before you send' },
    ar: {
      title: `فحص إصدار اللوحات قبل الإرسال | ${BRAND}`, name: 'فحص قبل التسليم', pitch: 'اكتشف أخطاء إصدار اللوحات قبل إرساله',
      desc: 'افحص إصدار اللوحات قبل إرساله: أرقام لوحات مكررة، أسماء ملفات لا تطابق جدول العنوان، لوحات ناقصة ومراجعات لا تطابق قائمة اللوحات في Excel.',
    },
  },
  // ----- guides: how-to pages written for what people search, one per tool -----
  {
    file: 'guides/rename-pdf-drawings-from-title-block.html', cat: 'pdf', guide: true,
    en: { title: `How to Rename PDF Drawings from the Title Block (Free) | ${BRAND}`, name: 'Rename PDF drawings', pitch: 'From the title block, a whole folder at once' },
    ar: {
      title: `طريقة إعادة تسمية ملفات PDF للوحات من جدول العنوان تلقائياً | ${BRAND}`, name: 'إعادة تسمية ملفات PDF', pitch: 'من جدول العنوان، لمجلد كامل مرة واحدة',
      desc: 'شرح خطوة بخطوة لإعادة تسمية مئات ملفات PDF للوحات تلقائياً برقم اللوحة وعنوانها من جدول العنوان (Title Block). مجاني، يقرأ اللوحات الممسوحة ضوئياً، والملفات لا تُرفع.',
    },
  },
  {
    file: 'guides/pdf-drawings-to-excel-drawing-register.html', cat: 'pdf', guide: true,
    en: { title: `Make a Drawing Register in Excel from PDF Drawings (Free) | ${BRAND}`, name: 'Drawing register from PDFs', pitch: 'Number, title and revision of every sheet in Excel' },
    ar: {
      title: `تحويل PDF إلى Excel: عمل قائمة لوحات من ملفات PDF | ${BRAND}`, name: 'قائمة لوحات من PDF', pitch: 'رقم وعنوان ومراجعة كل لوحة في Excel',
      desc: 'استخرج رقم اللوحة والعنوان والمراجعة من كل ملفات PDF إلى جدول Excel واحد. تحويل PDF إلى Excel مجاناً مع OCR عربي وإنجليزي، والملفات لا تُرفع.',
    },
  },
  {
    file: 'guides/merge-pdf-without-uploading.html', cat: 'pdf', guide: true,
    en: { title: `How to Merge PDF Files Without Uploading Them (Free) | ${BRAND}`, name: 'Merge PDF without uploading', pitch: 'Your files never leave your computer' },
    ar: {
      title: `دمج ملفات PDF في ملف واحد بدون رفع على الإنترنت | ${BRAND}`, name: 'دمج PDF بدون رفع', pitch: 'ملفاتك لا تخرج من جهازك',
      desc: 'اجمع عدة ملفات PDF في ملف واحد بالترتيب الذي تختاره داخل متصفحك. بدون رفع الملفات، بدون حد لعدد الملفات وبدون حساب. شرح خطوة بخطوة.',
    },
  },
  {
    file: 'guides/list-folder-files-to-excel.html', cat: 'files', guide: true,
    en: { title: `List All Files in a Folder and Subfolders to Excel (Free) | ${BRAND}`, name: 'Folder file list to Excel', pitch: 'Every file in a folder tree, in one workbook' },
    ar: {
      title: `نسخ أسماء الملفات من مجلد إلى Excel مع المجلدات الفرعية | ${BRAND}`, name: 'أسماء الملفات إلى Excel', pitch: 'كل ملفات المجلد والمجلدات الفرعية في ملف واحد',
      desc: 'صدّر أسماء كل الملفات في مجلد (فولدر) وكل المجلدات الفرعية إلى Excel مع المجلد والنوع والحجم والتاريخ. بدون VBA أو Power Query وبدون رفع. شرح خطوة بخطوة.',
    },
  },
  {
    file: 'guides/export-pdf-comments-to-excel.html', cat: 'qa', guide: true,
    en: { title: `Export PDF Comments to Excel as a Comment Response Sheet | ${BRAND}`, name: 'PDF comments to Excel', pitch: 'A comment response sheet with a snapshot of each spot' },
    ar: {
      title: `تصدير تعليقات PDF إلى Excel (جدول الرد على التعليقات) | ${BRAND}`, name: 'تعليقات PDF إلى Excel', pitch: 'جدول رد على التعليقات مع صورة لمكان كل تعليق',
      desc: 'حوّل تعليقات المراجعة على لوحات PDF إلى جدول رد على التعليقات في Excel: رقم اللوحة، التعليق، الكاتب، التاريخ وصورة لمكان كل تعليق. مجاني وبدون رفع.',
    },
  },
];

// ---------- translation, using the same dictionary as the live switch ----------

function loadTranslator() {
  const code = fs.readFileSync(path.join(ROOT, 'assets/i18n.js'), 'utf8');
  const noop = () => {};
  const sandbox = {
    localStorage: { getItem: () => 'ar', setItem: noop },
    navigator: { language: 'ar' },
    location: { replace: noop, hash: '' },
    MutationObserver: class { observe() {} },
    NodeFilter: {},
    document: {
      documentElement: { getAttribute: () => null },
      addEventListener: noop,
      querySelector: () => null,
      querySelectorAll: () => [],
    },
  };
  sandbox.window = sandbox;
  vm.runInNewContext(code, sandbox);
  const t = sandbox.window.FMLang.t;
  return (s, guide) => {
    if (guide && Object.prototype.hasOwnProperty.call(GUIDES_AR, s)) return GUIDES_AR[s];
    const out = t(s);
    return out === s ? null : out;
  };
}

const decode = (s) => s.replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
const encodeText = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const encodeAttr = (s) => encodeText(s).replace(/"/g, '&quot;');

const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);

function parseTag(raw) {
  const m = raw.match(/^<(\/?)([a-zA-Z][\w-]*)/);
  const attr = (n) => {
    const a = raw.match(new RegExp(`\\s${n}\\s*=\\s*"([^"]*)"`));
    return a ? a[1] : null;
  };
  return {
    closing: m[1] === '/',
    tag: m[2].toLowerCase(),
    cls: new Set((attr('class') || '').split(/\s+/).filter(Boolean)),
    id: attr('id'),
    translateNo: attr('translate') === 'no',
    selfClosing: /\/>$/.test(raw),
  };
}

// Mirrors SKIP / ALLOW_INSIDE_SKIP in assets/i18n.js for the markup found in the static pages.
const SKIP_CLASSES = ['brand', 'fname', 'preview-list', 'folder-name', 'pv-rect'];
const SKIP_TD = ['name', 'orig', 'cur-name', 'folder', 'comment', 'sheet'];
function isSkipped(stack) {
  for (let i = stack.length - 1; i >= 0; i--) {
    const e = stack[i];
    if (e.cls.has('err') || e.cls.has('edit-btn')) return false;
  }
  return stack.some((e, i) => e.translateNo
    || SKIP_CLASSES.some((c) => e.cls.has(c))
    || (e.cls.has('mock-row') && !e.cls.has('head'))
    || e.id === 'folderName' || e.id === 'fileLabel'
    || (e.tag === 'td' && SKIP_TD.some((c) => e.cls.has(c)))
    || (e.tag === 'b' && stack.slice(0, i).some((p) => p.cls.has('mock-chip'))));
}

function translateBody(html, tr, missing, guide) {
  const re = /<!--[\s\S]*?-->|<(script|style|textarea|code)\b[\s\S]*?<\/\1>|<\/?[a-zA-Z][^>]*>|[^<]+/g;
  const stack = [];
  return html.replace(re, (tok, raw) => {
    if (tok.startsWith('<!--') || raw) return tok;
    if (tok.startsWith('<')) {
      const t = parseTag(tok);
      if (t.closing) {
        const at = stack.map((e) => e.tag).lastIndexOf(t.tag);
        if (at >= 0) stack.length = at;
        return tok;
      }
      if (!VOID.has(t.tag) && !t.selfClosing) stack.push(t);
      if (isSkipped(stack)) return tok;
      return tok.replace(/(\s(?:placeholder|title|aria-label|alt)\s*=\s*")([^"]*)"/g, (all, pre, v) => {
        const key = decode(v).replace(/\s+/g, ' ').trim();
        if (!key) return all;
        const out = tr(key, guide);
        if (out == null && guide && /[A-Za-z]/.test(key)) missing.add(key);
        return out == null ? all : `${pre}${encodeAttr(out)}"`;
      });
    }
    const key = decode(tok).replace(/\s+/g, ' ').trim();
    if (!key || !/[A-Za-z→]/.test(key) || isSkipped(stack)) return tok;
    const out = tr(key, guide);
    if (out == null) { missing.add(key); return tok; }
    const lead = tok.match(/^\s*/)[0];
    const trail = tok.match(/\s*$/)[0];
    return lead + encodeText(out) + trail;
  });
}

// ---------- head blocks ----------

const urlOf = (file, lang) => SITE + (lang === 'ar' ? 'ar/' : '') + (file === 'index.html' ? '' : file);
const slug = (file) => file.replace(/\.html$/, '').replace(/\//g, '-');
// One '../' per folder level of a page: '../' for guides/x.html.
const up = (file) => '../'.repeat(file.split('/').length - 1);
const assetsOf = (file, lang) => (lang === 'ar' ? '../' : '') + up(file) + 'assets/';

function seoBlock(page, lang, desc, jsonLd) {
  const p = page[lang];
  const assets = assetsOf(page.file, lang);
  // data-switch = where the language button goes, relative, so it also works on a local server.
  const rel = (to) => {
    if (page.file === 'index.html') return lang === to ? './' : (to === 'ar' ? 'ar/' : '../');
    if (lang === to) return path.posix.basename(page.file);
    return (to === 'ar' ? up(page.file) + 'ar/' : '../' + up(page.file)) + page.file;
  };
  const lines = [
    `<link rel="canonical" href="${urlOf(page.file, lang)}">`,
    `<link rel="alternate" hreflang="en" href="${urlOf(page.file, 'en')}" data-switch="${rel('en')}">`,
    `<link rel="alternate" hreflang="ar" href="${urlOf(page.file, 'ar')}" data-switch="${rel('ar')}">`,
    `<link rel="alternate" hreflang="x-default" href="${urlOf(page.file, 'en')}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="${BRAND}">`,
    `<meta property="og:locale" content="${lang === 'ar' ? 'ar_AR' : 'en_US'}">`,
    `<meta property="og:title" content="${encodeAttr(p.title)}">`,
    `<meta property="og:description" content="${encodeAttr(desc)}">`,
    `<meta property="og:url" content="${urlOf(page.file, lang)}">`,
    `<meta property="og:image" content="${SITE}assets/og/${slug(page.file)}-${lang}.png">`,
    `<meta property="og:image:width" content="1200">`,
    `<meta property="og:image:height" content="630">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<script src="${assets}analytics.js" defer></script>`,
    `<script src="${assets}backend.js" defer></script>`,
    ...(jsonLd || []).map((d) => `<script type="application/ld+json">${JSON.stringify(d).replace(/</g, '\\u003c')}</script>`),
  ];
  return `<!-- seo:start -->\n  ${lines.join('\n  ')}\n  <!-- seo:end -->`;
}

function setHead(html, page, lang, desc) {
  html = html.replace(/\n?\s*<!-- seo:start -->[\s\S]*?<!-- seo:end -->/, '');
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${encodeText(page[lang].title)}</title>`);
  html = html.replace(/(<meta name="description" content=")[^"]*(">)/, `$1${encodeAttr(desc)}$2`);
  const jsonLd = page.guide ? guideJsonLd(html, page, lang, desc) : null;
  return html.replace(/(<meta name="description"[^>]*>)/, (m) => `${m}\n  ${seoBlock(page, lang, desc, jsonLd)}`);
}

// HowTo and FAQPage data, read from the page itself (after translation), so it always matches
// what visitors see: <ol class="guide-steps"><li><h3>Step</h3><p>Text</p></li> and
// <div class="guide-faq"><details><summary>Question</summary><p>Answer</p></details>.
const plain = (h) => decode(h.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
function guideJsonLd(html, page, lang, desc) {
  const pick = (re) => (html.match(re) || [])[1] || '';
  const steps = [...pick(/<ol class="guide-steps">([\s\S]*?)<\/ol>/).matchAll(/<li><h3>([\s\S]*?)<\/h3><p>([\s\S]*?)<\/p><\/li>/g)]
    .map(([, name, text], i) => ({ '@type': 'HowToStep', position: i + 1, name: plain(name), text: plain(text) }));
  const faq = [...pick(/<div class="guide-faq">([\s\S]*?)<\/div>/).matchAll(/<summary>([\s\S]*?)<\/summary><p>([\s\S]*?)<\/p>/g)]
    .map(([, q, a]) => ({ '@type': 'Question', name: plain(q), acceptedAnswer: { '@type': 'Answer', text: plain(a) } }));
  const img = pick(/<img src="[^"]*assets\/guides\/([^"]+)"/);
  const tool = plain(pick(/<a class="btn primary lg" href="[^"]*">([\s\S]*?)<\/a>/)).replace(/\s*[→←]$/, '');
  return [
    {
      '@context': 'https://schema.org', '@type': 'HowTo', name: plain(pick(/<h1>([\s\S]*?)<\/h1>/)), description: desc, inLanguage: lang,
      ...(img ? { image: `${SITE}assets/guides/${img}` } : {}), tool: { '@type': 'HowToTool', name: tool }, step: steps,
    },
    { '@context': 'https://schema.org', '@type': 'FAQPage', inLanguage: lang, mainEntity: faq },
  ];
}

// ---------- build ----------

const tr = loadTranslator();
const missing = new Set();

// Cache busting: every page links assets/x.css|js?v=<content hash>, so browsers fetch a file again as soon as it changes
// (GitHub Pages lets browsers cache for 10 minutes, which otherwise mixes new pages with old styles).
const assetHash = {};
for (const f of fs.readdirSync(path.join(ROOT, 'assets'))) {
  if (/\.(css|js)$/.test(f)) assetHash[f] = crypto.createHash('sha1').update(fs.readFileSync(path.join(ROOT, 'assets', f))).digest('hex').slice(0, 8);
}
const unversion = (html) => html.replace(/(assets\/[\w-]+\.(?:css|js))\?v=[0-9a-f]+/g, '$1');
const version = (html) => html.replace(/(assets\/([\w-]+\.(?:css|js)))(?=")/g, (m, all, f) => (assetHash[f] ? `${all}?v=${assetHash[f]}` : all));
fs.mkdirSync(path.join(ROOT, 'ar'), { recursive: true });

for (const page of PAGES) {
  const file = path.join(ROOT, page.file);
  let en = unversion(fs.readFileSync(file, 'utf8'));
  const enDesc = decode(en.match(/<meta name="description" content="([^"]*)"/)[1]);
  page.en.desc = enDesc;
  en = en.replace(/<html[^>]*>/, '<html lang="en" data-lang-page="en">');
  en = setHead(en, page, 'en', enDesc);
  fs.writeFileSync(file, version(en));

  const enAssets = assetsOf(page.file, 'en');
  const arAssets = assetsOf(page.file, 'ar');
  let ar = en.replace(/<html[^>]*>/, '<html lang="ar" dir="rtl" data-lang-page="ar">');
  ar = ar.replace(/<body[\s\S]*<\/body>/, (body) => translateBody(body, tr, missing, page.guide));
  if (page.guide) ar = ar.replace(/(assets\/guides\/[\w-]+)-en\.webp/g, '$1-ar.webp');
  ar = setHead(ar, page, 'ar', page.ar.desc);
  ar = ar.split(`href="${enAssets}`).join(`href="${arAssets}`).split(`src="${enAssets}`).join(`src="${arAssets}`);
  ar = ar.replace(`<link rel="stylesheet" href="${arAssets}style.css">`,
    `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;500;600;700&display=swap" id="fm-ar-font">\n  <link rel="stylesheet" href="${arAssets}style.css">`);
  ar = ar.replace('<head>', `<head>\n  <!-- Generated by tools/build.mjs from ${up(page.file)}../${page.file} - do not edit. -->`);
  fs.mkdirSync(path.dirname(path.join(ROOT, 'ar', page.file)), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'ar', page.file), version(ar));
}

const today = new Date().toISOString().slice(0, 10);
const sitemap = ['<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">'];
for (const page of PAGES) {
  for (const lang of ['en', 'ar']) {
    sitemap.push('  <url>', `    <loc>${urlOf(page.file, lang)}</loc>`, `    <lastmod>${today}</lastmod>`,
      `    <xhtml:link rel="alternate" hreflang="en" href="${urlOf(page.file, 'en')}"/>`,
      `    <xhtml:link rel="alternate" hreflang="ar" href="${urlOf(page.file, 'ar')}"/>`,
      `    <xhtml:link rel="alternate" hreflang="x-default" href="${urlOf(page.file, 'en')}"/>`, '  </url>');
  }
}
sitemap.push('</urlset>', '');
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sitemap.join('\n'));
fs.writeFileSync(path.join(ROOT, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE}sitemap.xml\n`);

console.log(`Built ${PAGES.length} English + ${PAGES.length} Arabic pages, sitemap.xml, robots.txt`);
if (missing.size) {
  console.log(`\nText with no Arabic in assets/i18n.js (${missing.size}), left in English:`);
  for (const m of missing) console.log('  - ' + m);
}

// ---------- share images ----------

const ogNew = process.argv.includes('--og-new');
if (process.argv.includes('--og') || ogNew) {
  const browsers = [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    '/usr/bin/google-chrome', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ];
  const browser = browsers.find((b) => fs.existsSync(b));
  if (!browser) throw new Error('Chrome or Edge not found for --og');
  const outDir = path.join(ROOT, 'assets/og');
  fs.mkdirSync(outDir, { recursive: true });
  const template = pathToFileURL(path.join(ROOT, 'tools/og.html')).href;
  for (const page of PAGES) {
    for (const lang of ['en', 'ar']) {
      const q = new URLSearchParams({ lang, cat: page.cat, name: page[lang].name, pitch: page[lang].pitch, home: page.file === 'index.html' ? '1' : '' });
      const out = path.join(outDir, `${slug(page.file)}-${lang}.png`);
      if (ogNew && fs.existsSync(out)) continue;
      execFileSync(browser, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1',
        '--window-size=1200,630', '--virtual-time-budget=8000', `--screenshot=${out}`, `${template}?${q}`], { stdio: 'ignore' });
      console.log('  og ' + path.relative(ROOT, out));
    }
  }
}
