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
// - More languages (fr/, es/, pt/, id/, tr/, hi/): the main tool pages only (CORE below), translated with
//   the dictionaries in assets/lang/<code>.js. Links to pages that are not translated go to the English page.
//   Text still missing from a dictionary is listed in tools/lang-missing/<code>.json.
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
// Google cuts titles at about 60 characters and shows the site name on its own,
// so a long title drops the " | File Manager Toolkit" ending and keeps the words people search for.
const seoTitle = (t) => (t.length > 60 && t.endsWith(` | ${BRAND}`) ? t.slice(0, -(BRAND.length + 3)) : t);

// Languages besides English and Arabic, and the pages built in them.
const LANGS = { fr: 'fr_FR', es: 'es_ES', pt: 'pt_BR', id: 'id_ID', tr: 'tr_TR', hi: 'hi_IN' };
const CORE = new Set(['index.html', 'merge.html', 'compress.html', 'pdf-to-word.html', 'pdf-to-image.html', 'image-to-pdf.html',
  'split.html', 'rotate.html', 'unlock.html', 'protect.html', 'watermark.html', 'page-numbers.html', 'pages.html', 'ocr.html',
  'crop.html', 'compare.html', 'remove-bg.html',
  'text-case.html', 'word-counter.html', 'unit-converter.html', 'kg-to-lbs.html', 'cm-to-inches.html', 'meters-to-feet.html', 'km-to-miles.html',
  'sqm-to-sqft.html', 'feddan-to-sqm.html', 'celsius-to-fahrenheit.html', 'liters-to-gallons.html', 'hijri-converter.html', 'qr-code.html',
  'percentage-calculator.html', 'vat-calculator.html', 'invoice-generator.html', 'password-generator.html']);
const LOCALE = { en: 'en_US', ar: 'ar_AR', ...LANGS };
const FONTS = { ar: 'Noto+Sans+Arabic', hi: 'Noto+Sans+Devanagari' };
const langsOf = (file) => ['en', 'ar', ...(CORE.has(file) ? Object.keys(LANGS) : [])];

// cat = colour of the share image: files (blue), pdf (red), qa (green).
const PAGES = [
  {
    file: 'index.html', cat: 'files',
    en: { title: `${BRAND} – Free PDF and file tools, no upload`, name: BRAND, pitch: 'Every PDF and file tool you need. Nothing uploaded.' },
    ar: {
      title: `أدوات PDF والملفات مجاناً بدون رفع | ${BRAND}`, name: BRAND, pitch: 'كل أدوات PDF والملفات اللي محتاجها. من غير ما ترفع حاجة.',
      desc: 'كل أدوات PDF والملفات مجاناً: دمج وتقسيم وضغط PDF، تحويل PDF إلى JPG والعكس، ترقيم الصفحات، علامة مائية، حماية وفك حماية، OCR عربي، مقارنة ملفين، وإعادة تسمية الملفات بالجملة. كل شيء يعمل داخل متصفحك وملفاتك لا تُرفع.',
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
    en: { title: `Export Folder File Names to Excel (with Subfolders), Free | ${BRAND}`, name: 'Files to Excel', pitch: 'Every file in a folder tree, in one Excel workbook' },
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
    file: 'splitrename.html', cat: 'pdf',
    en: { title: `Split PDF and Rename Pages from Title Block, Free | ${BRAND}`, name: 'Split & Rename PDF', pitch: 'One PDF per sheet, named from its title block' },
    ar: {
      title: `تقسيم PDF وتسمية كل لوحة من الـ Title Block مجاناً | ${BRAND}`, name: 'تقسيم وتسمية PDF', pitch: 'ملف PDF لكل لوحة باسمها من الـ Title Block',
      desc: 'قسّم ملف PDF مجمّع فيه لوحات كثيرة إلى ملف لكل لوحة، باسم رقم اللوحة والـ Revision المقروء من جدول العنوان. مجاني، بدون رفع ملفات.',
    },
  },
  {
    file: 'merge.html', cat: 'pdf',
    en: { title: `Merge PDF Files and Folders, with Bookmarks, Free, No Upload | ${BRAND}`, name: 'Merge PDF', pitch: 'Files or whole folders, with bookmarks and a table of contents' },
    ar: {
      title: `دمج ملفات PDF وفولدرات كاملة مع إشارات مرجعية مجاناً | ${BRAND}`, name: 'دمج PDF', pitch: 'ملفات أو فولدرات كاملة، مع إشارات مرجعية وفهرس',
      desc: 'اجمع ملفات PDF، أو فولدر كامل بفولدراته الفرعية، في ملف واحد. ترتيب طبيعي للأسماء، إشارة مرجعية لكل ملف، وفهرس قابل للضغط. مجاني وبدون رفع وبلا حدود.',
    },
  },
  {
    file: 'split.html', cat: 'pdf',
    en: { title: `Split PDF by Pages, Every N Pages, Size or Bookmarks, Free | ${BRAND}`, name: 'Split PDF', pitch: 'By page ranges, every few pages, file size or bookmarks' },
    ar: {
      title: `تقسيم PDF حسب الصفحات أو الحجم أو الإشارات المرجعية مجاناً | ${BRAND}`, name: 'تقسيم PDF', pitch: 'حسب الصفحات، كل عدد صفحات، الحجم أو الإشارات المرجعية',
      desc: 'قسّم ملفات PDF حسب نطاقات صفحات، أو كل عدد من الصفحات، أو حجم الملف (مثل أجزاء أقل من 10 ميجا)، أو الإشارات المرجعية، أو استخرج صفحات في ملف جديد. مجاني وبدون رفع.',
    },
  },
  {
    file: 'pages.html', cat: 'pdf',
    en: { title: `Organize PDF Pages: Reorder, Rotate, Delete, Add, Free | ${BRAND}`, name: 'Organize Pages', pitch: 'Drag pages to reorder, rotate, delete or add blanks' },
    ar: {
      title: `ترتيب صفحات PDF: تحريك وتدوير وحذف وإضافة مجاناً | ${BRAND}`, name: 'ترتيب الصفحات', pitch: 'اسحب الصفحات لترتيبها، دوّرها، احذفها أو أضف صفحات فارغة',
      desc: 'شوف كل صفحات ملفات PDF. اسحب الصفحات لترتيبها، دوّر أو احذف أو كرر صفحات، أضف صفحات فارغة، واجمع صفحات من أكثر من ملف. مجاني وبدون رفع.',
    },
  },
  {
    file: 'rotate.html', cat: 'pdf',
    en: { title: `Rotate PDF Pages, Many Files at Once, Free | ${BRAND}`, name: 'Rotate PDF', pitch: 'All pages, only landscape or portrait, or the pages you choose' },
    ar: {
      title: `تدوير صفحات PDF وحفظها مجاناً | ${BRAND}`, name: 'تدوير PDF', pitch: 'كل الصفحات، أو العرضية أو الطولية فقط، أو صفحات تختارها',
      desc: 'دوّر صفحات PDF واحفظها بالاتجاه الصحيح: كل الصفحات، أو العرضية أو الطولية فقط، أو صفحات تختارها، في ملفات كثيرة مرة واحدة. مجاني وبدون رفع.',
    },
  },
  {
    file: 'compress.html', cat: 'pdf',
    en: { title: `Compress PDF to a Target Size (e.g. under 2 MB), Free | ${BRAND}`, name: 'Compress PDF', pitch: 'See the size of each level before you save' },
    ar: {
      title: `ضغط ملفات PDF مع معرفة الحجم الجديد قبل الحفظ مجاناً | ${BRAND}`, name: 'ضغط PDF', pitch: 'اعرف حجم كل مستوى قبل ما تحفظ',
      desc: 'صغّر حجم ملفات PDF بثلاثة مستويات أو لحجم تحدده مثل 2 ميجا، وشوف الحجم الجديد قبل الحفظ. النصوص والرسومات تفضل حادة. ملفات كثيرة مرة واحدة، مجاني وبدون رفع.',
    },
  },
  {
    file: 'pdf-to-word.html', cat: 'pdf',
    en: { title: `PDF to Word with Arabic Support, Scanned PDFs too, Free | ${BRAND}`, name: 'PDF to Word', pitch: 'Editable Word files, scanned PDFs and Arabic included' },
    ar: {
      title: `تحويل PDF إلى Word يدعم اللغة العربية، حتى الملفات الممسوحة، مجاناً | ${BRAND}`, name: 'PDF إلى Word', pitch: 'ملف Word تقدر تعدّل فيه، حتى لو الـ PDF ممسوح، والعربي مظبوط',
      desc: 'حوّل PDF إلى ملف Word قابل للتعديل (.docx) مجاناً، حتى الملفات الممسوحة ضوئياً. النص العربي يطلع من اليمين للشمال وبالترتيب الصحيح. بدون رفع وبدون تسجيل وبلا حد للصفحات.',
    },
  },
  {
    file: 'remove-bg.html', cat: 'files',
    en: { title: `Remove Background from Images, Free and Private, No Upload | ${BRAND}`, name: 'Remove Background', pitch: 'Transparent PNG in one click, photos never uploaded' },
    ar: {
      title: `إزالة خلفية الصور مجاناً وبدون رفع | ${BRAND}`, name: 'إزالة الخلفية', pitch: 'صورة PNG شفافة بضغطة واحدة، وصورك ما بتترفعش',
      desc: 'شيل خلفية الصور تلقائياً بالذكاء الاصطناعي اللي بيشتغل جوه المتصفح. PNG شفاف أو أبيض أو أي لون. صور كتير مرة واحدة وبالحجم الكامل، مجاني وبدون رفع وبدون تسجيل.',
    },
  },
  // ---------- everyday tools (tools/util-pages.mjs) ----------
  {
    file: 'text-case.html', cat: 'files',
    en: { title: `Text Case Converter: UPPERCASE, lowercase, Title Case, Free | ${BRAND}`, name: 'Text Case Converter', pitch: 'UPPERCASE, lowercase and Title Case in one click' },
    ar: {
      title: `تحويل حالة الأحرف الإنجليزية: كبيرة وصغيرة مجاناً | ${BRAND}`, name: 'تحويل حالة الأحرف', pitch: 'UPPERCASE وlowercase وTitle Case بضغطة واحدة',
      desc: 'حوّل النص لحروف كبيرة UPPERCASE أو صغيرة lowercase أو Title Case أو Sentence case أو camelCase. وشيل المسافات الزيادة وفواصل الأسطر والأسطر المكررة والتشكيل من النص العربي. مجاني والنص ما بيترفعش.',
    },
  },
  {
    file: 'word-counter.html', cat: 'files',
    en: { title: `Word Counter: Count Words and Characters Online, Free | ${BRAND}`, name: 'Word Counter', pitch: 'Words, characters and reading time as you type' },
    ar: {
      title: `عداد الكلمات والحروف أونلاين مجاناً | ${BRAND}`, name: 'عداد الكلمات', pitch: 'كلمات وحروف وجمل ووقت قراءة وأنت بتكتب',
      desc: 'اعرف عدد الكلمات والحروف (بالمسافات ومن غيرها) والجمل والأسطر ووقت القراءة وأنت بتكتب. بيشتغل مع العربي والإنجليزي وكل اللغات. مجاني والنص ما بيترفعش.',
    },
  },
  {
    file: 'unit-converter.html', cat: 'files',
    en: { title: `Unit Converter: Length, Weight, Area, Volume, Temperature, Speed | ${BRAND}`, name: 'Unit Converter', pitch: 'Length, weight, area, volume, temperature and speed' },
    ar: {
      title: `محول الوحدات: الطول والوزن والمساحة والحرارة | ${BRAND}`, name: 'محول الوحدات', pitch: 'طول ووزن ومساحة وحجم وحرارة وسرعة في مكان واحد',
      desc: 'حوّل الطول والوزن والمساحة والحجم والحرارة والسرعة: متر وقدم وكيلو وباوند ومتر مربع وفدان ولتر وجالون ودرجات مئوية وفهرنهايت. مجاني وفوري.',
    },
  },
  {
    file: 'kg-to-lbs.html', cat: 'files',
    en: { title: `Kg to Lbs Converter: Kilograms to Pounds, with Table | ${BRAND}`, name: 'Kg to Lbs', pitch: '1 kg = 2.20462 lb, with a ready table' },
    ar: {
      title: `تحويل كيلو إلى باوند (kg to lbs) مع جدول | ${BRAND}`, name: 'كيلو إلى باوند', pitch: '1 كيلو = 2.20462 باوند، مع جدول جاهز',
      desc: 'حوّل الكيلوجرام إلى باوند والباوند إلى كيلو فوراً. 1 كيلو = 2.20462 باوند، مع جدول جاهز من 1 لـ 100 كيلو. مجاني.',
    },
  },
  {
    file: 'cm-to-inches.html', cat: 'files',
    en: { title: `Cm to Inches Converter: Centimetres to Inches, with Table | ${BRAND}`, name: 'Cm to Inches', pitch: '1 inch = 2.54 cm, with a ready table' },
    ar: {
      title: `تحويل سم إلى إنش (cm to inches) مع جدول | ${BRAND}`, name: 'سم إلى إنش', pitch: '1 إنش = 2.54 سم، مع جدول جاهز',
      desc: 'حوّل السنتيمتر إلى إنش والإنش إلى سنتيمتر فوراً. 1 إنش = 2.54 سم، مع جدول تحويل جاهز. مجاني.',
    },
  },
  {
    file: 'meters-to-feet.html', cat: 'files',
    en: { title: `Meters to Feet Converter: m to ft, with Table | ${BRAND}`, name: 'Meters to Feet', pitch: '1 m = 3.28084 ft, feet and inches too' },
    ar: {
      title: `تحويل متر إلى قدم (m to ft) مع جدول | ${BRAND}`, name: 'متر إلى قدم', pitch: '1 متر = 3.28084 قدم، وبالقدم والإنش كمان',
      desc: 'حوّل المتر إلى قدم والقدم إلى متر فوراً. 1 متر = 3.28084 قدم، مع جدول جاهز وبالقدم والإنش كمان. مجاني.',
    },
  },
  {
    file: 'km-to-miles.html', cat: 'files',
    en: { title: `Km to Miles Converter: Kilometres to Miles, with Table | ${BRAND}`, name: 'Km to Miles', pitch: '1 km = 0.621371 mi, with a ready table' },
    ar: {
      title: `تحويل كيلومتر إلى ميل (km to miles) مع جدول | ${BRAND}`, name: 'كيلومتر إلى ميل', pitch: '1 كم = 0.621371 ميل، مع جدول جاهز',
      desc: 'حوّل الكيلومتر إلى ميل والميل إلى كيلومتر فوراً. 1 كم = 0.621371 ميل، مع جدول فيه 5 و10 كم ونص الماراثون والماراثون. مجاني.',
    },
  },
  {
    file: 'sqm-to-sqft.html', cat: 'files',
    en: { title: `Square Meters to Square Feet: m² to ft² Converter, with Table | ${BRAND}`, name: 'Square Meters to Square Feet', pitch: '1 m² = 10.7639 ft², for flats, plots and plans' },
    ar: {
      title: `تحويل متر مربع إلى قدم مربع (m² to ft²) مع جدول | ${BRAND}`, name: 'متر مربع إلى قدم مربع', pitch: '1 م² = 10.7639 قدم²، للشقق والأراضي والمخططات',
      desc: 'حوّل المتر المربع إلى قدم مربع والعكس للشقق والفلل والأراضي والمخططات. 1 م² = 10.7639 قدم²، مع جدول جاهز. مجاني.',
    },
  },
  {
    file: 'feddan-to-sqm.html', cat: 'files',
    en: { title: `Feddan to Square Meters: Feddan, Qirat, Dunam, Acre Converter | ${BRAND}`, name: 'Feddan to Square Meters', pitch: '1 feddan = 4,200.83 m² = 24 qirat' },
    ar: {
      title: `الفدان كم متر؟ تحويل فدان وقيراط إلى متر مربع | ${BRAND}`, name: 'فدان إلى متر مربع', pitch: '1 فدان = 4,200.83 م² = 24 قيراط',
      desc: 'الفدان كم متر مربع؟ 1 فدان = 4,200.83 م² = 24 قيراط. حوّل الفدان والقيراط والدونم والإيكر والهكتار إلى متر مربع والعكس. مجاني.',
    },
  },
  {
    file: 'celsius-to-fahrenheit.html', cat: 'files',
    en: { title: `Celsius to Fahrenheit Converter: °C to °F, with Formula and Table | ${BRAND}`, name: 'Celsius to Fahrenheit', pitch: '°F = °C × 9/5 + 32, with a ready table' },
    ar: {
      title: `تحويل مئوية إلى فهرنهايت (°C to °F) مع القانون | ${BRAND}`, name: 'مئوية إلى فهرنهايت', pitch: '°F = °C × 9/5 + 32، مع جدول جاهز',
      desc: 'حوّل درجة الحرارة من مئوية إلى فهرنهايت والعكس فوراً. القانون: °F = °C × 9/5 + 32، مع جدول للطقس وحرارة الجسم والفرن. مجاني.',
    },
  },
  {
    file: 'liters-to-gallons.html', cat: 'files',
    en: { title: `Liters to Gallons Converter: L to US and UK Gallons | ${BRAND}`, name: 'Liters to Gallons', pitch: 'Litres to US or UK gallons and back' },
    ar: {
      title: `تحويل لتر إلى جالون أمريكي وبريطاني | ${BRAND}`, name: 'لتر إلى جالون', pitch: 'لتر إلى جالون أمريكي أو بريطاني والعكس',
      desc: 'حوّل اللتر إلى جالون (أمريكي أو بريطاني) والجالون إلى لتر فوراً. 1 جالون أمريكي = 3.78541 لتر، و1 جالون بريطاني = 4.54609 لتر. مجاني.',
    },
  },
  {
    file: 'hijri-converter.html', cat: 'qa',
    en: { title: `Hijri Date Converter: Hijri to Gregorian and Back, Today’s Hijri Date | ${BRAND}`, name: 'Hijri Date Converter', pitch: 'Hijri to Gregorian and back, and today’s date' },
    ar: {
      title: `تحويل التاريخ من هجري إلى ميلادي والعكس | ${BRAND}`, name: 'تحويل التاريخ الهجري', pitch: 'هجري وميلادي، وتاريخ النهارده بالتقويمين',
      desc: 'حوّل التاريخ من هجري لميلادي ومن ميلادي لهجري بتقويم أم القرى، واعرف تاريخ النهارده هجري ويوم الأسبوع. مجاني.',
    },
  },
  {
    file: 'percentage-calculator.html', cat: 'qa',
    en: { title: `Percentage Calculator: X% of Y, Increase, Decrease, Discount | ${BRAND}`, name: 'Percentage Calculator', pitch: 'Percentages and discounts, answered as you type' },
    ar: {
      title: `حاسبة النسبة المئوية: نسبة من رقم، زيادة، نقص، خصم | ${BRAND}`, name: 'حاسبة النسبة المئوية', pitch: 'النسب والخصومات، والإجابة وأنت بتكتب',
      desc: 'احسب كام في المية من رقم، والرقم ده يمثل كام في المية من رقم تاني، ونسبة الزيادة أو النقص، والسعر بعد الخصم. الإجابة بتظهر وأنت بتكتب. مجاني.',
    },
  },
  {
    file: 'vat-calculator.html', cat: 'qa',
    en: { title: `VAT Calculator: Add or Remove VAT, 5%, 14%, 15% | ${BRAND}`, name: 'VAT Calculator', pitch: 'Add VAT or take it out, any rate' },
    ar: {
      title: `حاسبة ضريبة القيمة المضافة: إضافة أو استخراج الضريبة 5% و14% و15% | ${BRAND}`, name: 'حاسبة ضريبة القيمة المضافة', pitch: 'ضيف الضريبة أو طلّعها من السعر، بأي نسبة',
      desc: 'ضيف ضريبة القيمة المضافة على السعر أو استخرجها من الإجمالي. الإمارات وعُمان 5%، البحرين 10%، مصر 14%، السعودية 15%، أو أي نسبة. مجاني وفوري.',
    },
  },
  {
    file: 'invoice-generator.html', cat: 'qa',
    en: { title: `Free Invoice Generator: Arabic and English, VAT, Total in Words | ${BRAND}`, name: 'Invoice Generator', pitch: 'Invoices with VAT and the total in words, saved as PDF' },
    ar: {
      title: `عمل فاتورة مجاناً: عربي وإنجليزي، ضريبة، تفقيط المبلغ | ${BRAND}`, name: 'إنشاء فاتورة', pitch: 'فاتورة بالضريبة والمبلغ بالحروف، وتحفظها PDF',
      desc: 'اعمل فاتورة أو فاتورة ضريبية بالعربي أو الإنجليزي أو الاتنين، بالضريبة والخصم واللوجو والمبلغ بالحروف (تفقيط). احفظها PDF. مجاني ومن غير تسجيل ومن غير رفع أي حاجة.',
    },
  },
  {
    file: 'password-generator.html', cat: 'qa',
    en: { title: `Password Generator: Strong Random Passwords, Free | ${BRAND}`, name: 'Password Generator', pitch: 'Strong random passwords, nothing sent or saved' },
    ar: {
      title: `مولّد كلمات السر: باسورد قوي وعشوائي مجاناً | ${BRAND}`, name: 'مولّد كلمات السر', pitch: 'باسوردات قوية وعشوائية، ولا حاجة بتتبعت أو بتتحفظ',
      desc: 'اعمل باسورد قوي وعشوائي بحروف وأرقام ورموز وبأي طول لحد 64. بيتعمل في المتصفح بعشوائية آمنة ومش بيتبعت أو بيتحفظ في أي مكان. مجاني.',
    },
  },
  {
    file: 'qr-code.html', cat: 'qa',
    en: { title: `Free QR Code Generator: Links, Wi-Fi, WhatsApp, No Expiry | ${BRAND}`, name: 'QR Code Generator', pitch: 'Free QR codes that never expire' },
    ar: {
      title: `إنشاء QR Code مجاناً: رابط وواي فاي وواتساب | ${BRAND}`, name: 'إنشاء QR Code', pitch: 'QR Code مجاني ما بينتهيش أبداً',
      desc: 'اعمل QR Code لرابط أو نص أو واي فاي أو واتساب أو رقم تليفون أو إيميل أو كارت تواصل. غيّر الألوان وحط اللوجو ونزّله PNG أو SVG. مجاني للأبد وبدون تسجيل وما بينتهيش.',
    },
  },
  {
    file: 'hijri-date-today.html', cat: 'qa',
    en: { title: `Today’s Hijri Date: What Is the Islamic Date Today? | ${BRAND}`, name: 'Today’s Hijri Date', pitch: 'The Islamic date today, and the Gregorian date' },
    ar: {
      title: `التاريخ الهجري اليوم وتاريخ اليوم ميلادي | ${BRAND}`, name: 'التاريخ الهجري اليوم', pitch: 'تاريخ اليوم هجري وميلادي ويوم الأسبوع',
      desc: 'التاريخ الهجري اليوم بتقويم أم القرى، مع تاريخ اليوم الميلادي ويوم الأسبوع. وحوّل أي تاريخ من هجري لميلادي والعكس. مجاني.',
    },
  },
  {
    file: 'vat-calculator-uae.html', cat: 'qa',
    en: { title: `UAE VAT Calculator 5%: Add or Remove VAT in AED | ${BRAND}`, name: 'UAE VAT Calculator (5%)', pitch: 'Add or remove 5% VAT, in dirhams' },
    ar: {
      title: `حاسبة الضريبة الإمارات 5%: إضافة أو استخراج الضريبة | ${BRAND}`, name: 'حاسبة الضريبة في الإمارات (5%)', pitch: 'ضيف 5% ضريبة أو طلّعها من السعر بالدرهم',
      desc: 'احسب ضريبة القيمة المضافة في الإمارات 5%: ضيفها على السعر أو استخرجها من الإجمالي بالدرهم. المبلغ قبل الضريبة والضريبة والإجمالي وأنت بتكتب. مجاني.',
    },
  },
  {
    file: 'vat-calculator-saudi.html', cat: 'qa',
    en: { title: `Saudi VAT Calculator 15%: Add or Remove VAT in SAR | ${BRAND}`, name: 'Saudi VAT Calculator (15%)', pitch: 'Add or remove 15% VAT, in riyals' },
    ar: {
      title: `حاسبة الضريبة السعودية 15%: إضافة أو استخراج الضريبة | ${BRAND}`, name: 'حاسبة الضريبة في السعودية (15%)', pitch: 'ضيف 15% ضريبة أو طلّعها من السعر بالريال',
      desc: 'حاسبة ضريبة القيمة المضافة في السعودية 15%: ضيف الضريبة على السعر أو استخرجها من الإجمالي بالريال. المبلغ قبل الضريبة والضريبة والإجمالي وأنت بتكتب. مجاني.',
    },
  },
  {
    file: 'vat-calculator-egypt.html', cat: 'qa',
    en: { title: `Egypt VAT Calculator 14%: Add or Remove VAT in EGP | ${BRAND}`, name: 'Egypt VAT Calculator (14%)', pitch: 'Add or remove 14% VAT, in Egyptian pounds' },
    ar: {
      title: `حاسبة ضريبة القيمة المضافة مصر 14% | ${BRAND}`, name: 'حاسبة الضريبة في مصر (14%)', pitch: 'ضيف 14% ضريبة أو طلّعها من السعر بالجنيه',
      desc: 'احسب ضريبة القيمة المضافة في مصر 14%: ضيفها على السعر أو استخرجها من الإجمالي بالجنيه. المبلغ قبل الضريبة والضريبة والإجمالي وأنت بتكتب. مجاني.',
    },
  },
  {
    file: 'sqft-to-sqm.html', cat: 'files',
    en: { title: `Square Feet to Square Meters: ft² to m² Converter, with Table | ${BRAND}`, name: 'Square Feet to Square Meters', pitch: '1 ft² = 0.092903 m², with a ready table' },
    ar: {
      title: `تحويل قدم مربع إلى متر مربع (sqft to m²) مع جدول | ${BRAND}`, name: 'قدم مربع إلى متر مربع', pitch: '1 قدم² = 0.092903 م²، مع جدول جاهز',
      desc: 'حوّل القدم المربع إلى متر مربع والعكس للشقق والفلل والمكاتب. 1 قدم² = 0.092903 م²، مع جدول جاهز من 100 لـ 10,000 قدم مربع. مجاني.',
    },
  },
  {
    file: 'lbs-to-kg.html', cat: 'files',
    en: { title: `Lbs to Kg Converter: Pounds to Kilograms, with Table | ${BRAND}`, name: 'Lbs to Kg', pitch: '1 lb = 0.453592 kg, with a ready table' },
    ar: {
      title: `تحويل باوند إلى كيلو (lbs to kg) مع جدول | ${BRAND}`, name: 'باوند إلى كيلو', pitch: '1 باوند = 0.453592 كجم، مع جدول جاهز',
      desc: 'حوّل الباوند إلى كيلوجرام والكيلو إلى باوند فوراً. 1 باوند = 0.453592 كجم، مع جدول جاهز من 1 لـ 300 باوند. مجاني.',
    },
  },
  {
    file: 'inches-to-cm.html', cat: 'files',
    en: { title: `Inches to Cm Converter: Inches to Centimetres, with Table | ${BRAND}`, name: 'Inches to Cm', pitch: '1 inch = 2.54 cm, with a ready table' },
    ar: {
      title: `تحويل إنش إلى سم (inches to cm) مع جدول | ${BRAND}`, name: 'إنش إلى سم', pitch: '1 إنش = 2.54 سم، مع جدول جاهز',
      desc: 'حوّل الإنش (البوصة) إلى سنتيمتر والسم إلى إنش فوراً. 1 إنش = 2.54 سم، مع جدول جاهز ومقاسات الشاشات. مجاني.',
    },
  },
  {
    file: 'feet-to-meters.html', cat: 'files',
    en: { title: `Feet to Meters Converter: ft to m, with Table | ${BRAND}`, name: 'Feet to Meters', pitch: '1 ft = 0.3048 m, with a ready table' },
    ar: {
      title: `تحويل قدم إلى متر (ft to m) مع جدول | ${BRAND}`, name: 'قدم إلى متر', pitch: '1 قدم = 0.3048 متر، مع جدول جاهز',
      desc: 'حوّل القدم إلى متر والمتر إلى قدم فوراً. 1 قدم = 0.3048 متر، مع جدول تحويل جاهز. مجاني.',
    },
  },
  {
    file: 'miles-to-km.html', cat: 'files',
    en: { title: `Miles to Km Converter: Miles to Kilometres, with Table | ${BRAND}`, name: 'Miles to Km', pitch: '1 mile = 1.609344 km, with a ready table' },
    ar: {
      title: `تحويل ميل إلى كيلومتر (miles to km) مع جدول | ${BRAND}`, name: 'ميل إلى كيلومتر', pitch: '1 ميل = 1.609344 كم، مع جدول جاهز',
      desc: 'حوّل الميل إلى كيلومتر والكيلومتر إلى ميل فوراً. 1 ميل = 1.609344 كم، مع جدول جاهز وتحويل mph إلى كم/س. مجاني.',
    },
  },
  {
    file: 'fahrenheit-to-celsius.html', cat: 'files',
    en: { title: `Fahrenheit to Celsius Converter: °F to °C, with Formula and Table | ${BRAND}`, name: 'Fahrenheit to Celsius', pitch: '°C = (°F − 32) × 5/9, with a ready table' },
    ar: {
      title: `تحويل فهرنهايت إلى مئوية (°F to °C) مع القانون | ${BRAND}`, name: 'فهرنهايت إلى مئوية', pitch: '°C = (°F − 32) × 5/9، مع جدول جاهز',
      desc: 'حوّل درجة الحرارة من فهرنهايت إلى مئوية والعكس فوراً. القانون: °C = (°F − 32) × 5/9، مع جدول للحرارة والطقس والفرن. مجاني.',
    },
  },
  {
    file: 'qirat-to-sqm.html', cat: 'files',
    en: { title: `Qirat to Square Meters: How Many m² in a Qirat? | ${BRAND}`, name: 'Qirat to Square Meters', pitch: '1 qirat = 175.03 m², 24 qirat = 1 feddan' },
    ar: {
      title: `القيراط كم متر؟ تحويل قيراط إلى متر مربع مع جدول | ${BRAND}`, name: 'قيراط إلى متر مربع', pitch: '1 قيراط = 175.03 م²، و24 قيراط = فدان',
      desc: 'القيراط كم متر مربع؟ 1 قيراط = 175.03 م²، و24 قيراط = 1 فدان. حوّل القيراط إلى متر مربع والعكس مع جدول جاهز. مجاني.',
    },
  },
  {
    file: 'ocr.html', cat: 'pdf',
    en: { title: `OCR PDF: Make Scanned PDFs Searchable, English and Arabic, Free | ${BRAND}`, name: 'OCR PDF', pitch: 'Scanned PDFs you can search and copy, in Arabic and English' },
    ar: {
      title: `OCR لملفات PDF الممسوحة: عربي وإنجليزي مجاناً | ${BRAND}`, name: 'OCR لملفات PDF', pitch: 'ملفات ممسوحة تقدر تبحث فيها وتنسخ منها، عربي وإنجليزي',
      desc: 'حوّل ملفات PDF الممسوحة ضوئياً إلى ملفات يمكن البحث فيها ونسخ النص منها، بالعربي والإنجليزي ولغات أخرى. ملفات وصفحات كثيرة، مجاني وبدون رفع وبلا حدود.',
    },
  },
  {
    file: 'pdf-to-image.html', cat: 'pdf',
    en: { title: `PDF to JPG, PNG, WebP or TIFF at any DPI, Free | ${BRAND}`, name: 'PDF to JPG', pitch: 'JPG, PNG, WebP or TIFF, at the resolution you choose' },
    ar: {
      title: `تحويل PDF إلى JPG أو PNG أو TIFF بأي دقة مجاناً | ${BRAND}`, name: 'PDF إلى صور', pitch: 'JPG أو PNG أو WebP أو TIFF بالدقة اللي تختارها',
      desc: 'حوّل صفحات PDF إلى صور JPG أو PNG أو WebP أو TIFF بالدقة التي تختارها من 72 إلى 600 DPI، ملون أو رمادي، أو استخرج الصور الموجودة داخل الملف. مجاني وبدون رفع.',
    },
  },
  {
    file: 'image-to-pdf.html', cat: 'pdf',
    en: { title: `JPG to PDF: Images and Photos to PDF, Free, No Upload | ${BRAND}`, name: 'Images to PDF', pitch: 'Photos and scans into one PDF, or one per folder' },
    ar: {
      title: `تحويل الصور JPG إلى PDF مجاناً بدون رفع | ${BRAND}`, name: 'صور إلى PDF', pitch: 'الصور والممسوحات في ملف PDF واحد، أو ملف لكل فولدر',
      desc: 'حوّل صور JPG و PNG وغيرها إلى PDF: مقاس الصفحة، الاتجاه، الهوامش، ملف واحد أو ملف لكل صورة أو لكل فولدر. صور الموبايل تتعدل اتجاهها تلقائياً. مجاني وبدون رفع.',
    },
  },
  {
    file: 'page-numbers.html', cat: 'pdf',
    en: { title: `Add Page Numbers or Bates Numbers to PDF, Free | ${BRAND}`, name: 'Add Page Numbers', pitch: 'Page numbers or Bates numbers, on one PDF or hundreds' },
    ar: {
      title: `إضافة أرقام الصفحات أو ترقيم Bates لملفات PDF مجاناً | ${BRAND}`, name: 'ترقيم الصفحات', pitch: 'أرقام صفحات أو ترقيم Bates، لملف واحد أو مئات الملفات',
      desc: 'أضف أرقام الصفحات لملفات PDF: المكان، الشكل (صفحة 1 من 10)، رقم البداية، الصفحات المستثناة، أو ترقيم Bates متصل عبر ملفات كثيرة. مجاني وبدون رفع وبلا حدود.',
    },
  },
  {
    file: 'watermark.html', cat: 'pdf',
    en: { title: `Add Watermark to PDF: Text in Any Language or Logo, Free | ${BRAND}`, name: 'Add Watermark', pitch: 'A word or your logo on every page, in any language' },
    ar: {
      title: `إضافة علامة مائية لملفات PDF: نص بأي لغة أو لوجو مجاناً | ${BRAND}`, name: 'علامة مائية', pitch: 'كلمة أو اللوجو بتاعك على كل صفحة، بأي لغة',
      desc: 'اطبع علامة مائية نصية أو صورة على صفحات PDF: سري، مسودة، اللوجو بتاعك، بأي لغة منها العربي. المكان والحجم والزاوية والشفافية. ملفات كثيرة مرة واحدة، بدون رفع.',
    },
  },
  {
    file: 'crop.html', cat: 'pdf',
    en: { title: `Crop PDF Pages or Trim White Margins, Free | ${BRAND}`, name: 'Crop PDF', pitch: 'Draw the area to keep, or trim the white margins' },
    ar: {
      title: `قص صفحات PDF أو إزالة الهوامش البيضاء مجاناً | ${BRAND}`, name: 'قص PDF', pitch: 'ارسم الجزء اللي عايز تحتفظ بيه، أو شيل الهوامش البيضاء',
      desc: 'قص صفحات PDF برسم المنطقة التي تريد الاحتفاظ بها، أو أزل الهوامش البيضاء من كل صفحة تلقائياً. ملفات كثيرة مرة واحدة، مجاني وبدون رفع.',
    },
  },
  {
    file: 'compare.html', cat: 'qa',
    en: { title: `Compare Two PDFs: See What Changed, Free, No Upload | ${BRAND}`, name: 'Compare PDF', pitch: 'What was removed and what was added, page by page' },
    ar: {
      title: `مقارنة ملفين PDF ومعرفة التغييرات مجاناً | ${BRAND}`, name: 'مقارنة PDF', pitch: 'اللي اتشال واللي اتضاف، صفحة صفحة',
      desc: 'قارن نسختين من ملف PDF أو لوحة: الأجزاء المحذوفة بالأحمر والمضافة بالأخضر، فوق بعض أو جنب بعض، مع النص اللي اتغير وتقرير PDF. مجاني وبدون رفع.',
    },
  },
  {
    file: 'protect.html', cat: 'files',
    en: { title: `Protect PDF with a Password (AES-256), Free, No Upload | ${BRAND}`, name: 'Protect PDF', pitch: 'A password and permissions, on many PDFs at once' },
    ar: {
      title: `حماية ملفات PDF بكلمة سر (AES-256) مجاناً بدون رفع | ${BRAND}`, name: 'حماية PDF', pitch: 'كلمة سر وصلاحيات، لملفات كثيرة مرة واحدة',
      desc: 'أضف كلمة سر لملفات PDF بتشفير AES-256، واختار هل يقدر الناس يطبعوا أو ينسخوا أو يعدلوا. ملفات كثيرة مرة واحدة. ملفاتك وكلمات السر لا تخرج من جهازك.',
    },
  },
  {
    file: 'unlock.html', cat: 'files',
    en: { title: `Unlock PDF: Remove Password and Restrictions, Free | ${BRAND}`, name: 'Unlock PDF', pitch: 'Remove the password and the print, copy and edit locks' },
    ar: {
      title: `فك حماية PDF: إزالة كلمة السر والقيود مجاناً | ${BRAND}`, name: 'فك حماية PDF', pitch: 'شيل كلمة السر وقيود الطباعة والنسخ والتعديل',
      desc: 'أزل كلمة السر وقيود الطباعة والنسخ والتعديل من ملفات PDF المسموح لك بفتحها. ملفات كثيرة مرة واحدة، مجاني وبدون رفع.',
    },
  },
  {
    file: 'extract.html', cat: 'pdf',
    en: { title: `PDF Drawings to Excel: Drawing Register from Title Blocks | ${BRAND}`, name: 'PDF to Excel', pitch: 'Read the same boxes from every drawing into Excel' },
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
    en: { title: `PDF Comments to Excel (Bluebeam, Acrobat): Response Sheet | ${BRAND}`, name: 'PDF Comments to Excel', pitch: 'Client PDF comments to an Excel comment response sheet' },
    ar: {
      title: `تحويل تعليقات PDF إلى جدول تعليقات Excel | ${BRAND}`, name: 'تعليقات PDF إلى Excel', pitch: 'تعليقات العميل على الـ PDF في جدول Excel',
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
  {
    file: 'midp.html', cat: 'qa',
    en: { title: `MIDP Check: submission vs MIDP and TIDPs (ISO 19650) | ${BRAND}`, name: 'MIDP Check', pitch: 'Check a whole submission against the MIDP' },
    ar: {
      title: `مراجعة الـ MIDP: ملفات التسليم مقابل الـ MIDP والـ TIDP | ${BRAND}`, name: 'مراجعة الـ MIDP', pitch: 'راجع التسليم كله على الـ MIDP',
      desc: 'راجع كل ملفات التسليم (رسومات وموديلز وتقارير) على الـ MIDP وملفات الـ TIDP لكل الأقسام: المستندات الناقصة، والملفات الزيادة، والـ Revision المختلف، والأسامي المخالفة لقاعدة التسمية. بيشتغل في المتصفح من غير رفع ملفات.',
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
    en: { title: `List Files in a Folder to Excel: Export All File Names (Free) | ${BRAND}`, name: 'Folder file list to Excel', pitch: 'Every file in a folder tree, in one workbook' },
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
  {
    file: 'guides/split-pdf-drawing-set-into-sheets.html', cat: 'pdf', guide: true,
    en: { title: `Split a PDF Drawing Set into Sheets by Drawing Number (Free) | ${BRAND}`, name: 'Split a PDF drawing set', pitch: 'One PDF per sheet, named from its title block' },
    ar: {
      title: `تقسيم ملف PDF للوحات إلى ملف لكل لوحة باسم رقمها | ${BRAND}`, name: 'تقسيم ملف لوحات PDF', pitch: 'ملف PDF لكل لوحة، باسمه من جدول العنوان',
      desc: 'قسّم ملف PDF واحد فيه كل اللوحات إلى ملف منفصل لكل لوحة، باسم رقم اللوحة والمراجعة من جدول العنوان، مع قائمة لوحات في Excel. مجاني وبدون رفع.',
    },
  },
  {
    file: 'guides/edit-title-block-text-in-pdf.html', cat: 'pdf', guide: true,
    en: { title: `Change Title Block Text in Many PDF Drawings Without CAD | ${BRAND}`, name: 'Edit title block text in PDFs', pitch: 'A date or revision on the whole set, no CAD' },
    ar: {
      title: `تعديل نص جدول العنوان في ملفات PDF كثيرة بدون CAD | ${BRAND}`, name: 'تعديل جدول العنوان في PDF', pitch: 'التاريخ أو المراجعة على كل اللوحات بدون CAD',
      desc: 'غيّر التاريخ أو المراجعة أو الحالة في جدول العنوان لكل لوحات PDF مرة واحدة، بدون الرجوع إلى AutoCAD أو Revit. مجاني، يعمل في المتصفح وبدون رفع.',
    },
  },
  {
    file: 'guides/check-submission-against-midp-iso-19650.html', cat: 'qa', guide: true,
    en: { title: `Check a Submission Against the MIDP and ISO 19650 Naming (Free) | ${BRAND}`, name: 'MIDP and ISO 19650 check', pitch: 'Missing, extra, wrong revision and wrong names' },
    ar: {
      title: `مراجعة التسليم على الـ MIDP وقاعدة تسمية ISO 19650 | ${BRAND}`, name: 'مراجعة MIDP و ISO 19650', pitch: 'الناقص والزيادة والمراجعة الخطأ والأسماء الخطأ',
      desc: 'راجع كل ملفات التسليم على الـ MIDP والـ TIDP: المستندات الناقصة، والملفات الزيادة، والمراجعات المختلفة، والأسماء المخالفة لقاعدة تسمية ISO 19650. مجاني وبدون رفع.',
    },
  },
  {
    file: 'guides/drawing-register-template-excel.html', cat: 'pdf', guide: true,
    en: { title: `Free Drawing Register Template for Excel (Download) | ${BRAND}`, name: 'Drawing register template', pitch: 'Free Excel template, or filled from your PDFs' },
    ar: {
      title: `نموذج Drawing Register على Excel مجاناً (قائمة اللوحات) | ${BRAND}`, name: 'نموذج قائمة اللوحات', pitch: 'نموذج Excel مجاني، أو يتملى من ملفات الـ PDF',
      desc: 'نزّل نموذج Drawing Register (قائمة اللوحات) على Excel مجاناً: رقم اللوحة والعنوان وتاريخ كل Revision وحالة ISO 19650. أو املاه تلقائياً من ملفات الـ PDF بتاعتك.',
    },
  },
  {
    file: 'guides/document-transmittal-template-excel.html', cat: 'files', guide: true,
    en: { title: `Free Document Transmittal Template for Excel (Download) | ${BRAND}`, name: 'Transmittal template', pitch: 'Free Excel transmittal, list filled from your folder' },
    ar: {
      title: `نموذج Transmittal على Excel مجاناً (خطاب إرسال المستندات) | ${BRAND}`, name: 'نموذج Transmittal', pitch: 'نموذج Transmittal مجاني، والقائمة تتملى من الفولدر',
      desc: 'نزّل نموذج Document Transmittal على Excel مجاناً، فيه ترقيم تلقائي والغرض من الإرسال والتوقيعات. واملا قائمة المستندات من الفولدر أو من الـ Title Block في ثواني.',
    },
  },
  {
    file: 'guides/export-bluebeam-markups-to-excel.html', cat: 'qa', guide: true,
    en: { title: `Export Bluebeam or Any PDF Comments to Excel (Free) | ${BRAND}`, name: 'Bluebeam / PDF comments to Excel', pitch: 'A response sheet from any reviewed PDF' },
    ar: {
      title: `تصدير تعليقات Bluebeam أو أي ملف PDF إلى Excel | ${BRAND}`, name: 'تعليقات Bluebeam و PDF إلى Excel', pitch: 'جدول رد على التعليقات من أي ملف PDF',
      desc: 'صدّر تعليقات أي ملف PDF، من Bluebeam أو Acrobat أو أي برنامج، إلى جدول رد على التعليقات في Excel، فيه رقم اللوحة وصورة لكل تعليق. مجاني، من غير Revu، والملفات ما بتترفعش.',
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
  vm.createContext(sandbox);
  for (const l of Object.keys(LANGS)) {
    const lf = path.join(ROOT, 'assets/lang', l + '.js');
    if (fs.existsSync(lf)) vm.runInContext(fs.readFileSync(lf, 'utf8'), sandbox);
  }
  vm.runInContext(code, sandbox);
  const t = sandbox.window.FMLang.t;
  return (s, guide, lang = 'ar') => {
    if (lang === 'ar' && guide && Object.prototype.hasOwnProperty.call(GUIDES_AR, s)) return GUIDES_AR[s];
    const out = t(s, lang);
    if (out === s) return lang !== 'ar' && sandbox.window.FMLang.has(s, lang) ? s : null;
    return out;
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

function translateBody(html, tr, missing, guide, lang = 'ar') {
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
        const out = tr(key, guide, lang);
        if (out == null && (guide || lang !== 'ar') && /[A-Za-z]/.test(key)) missing.add(key);
        return out == null ? all : `${pre}${encodeAttr(out)}"`;
      });
    }
    const key = decode(tok).replace(/\s+/g, ' ').trim();
    if (!key || !/[A-Za-z→]/.test(key) || isSkipped(stack)) return tok;
    const out = tr(key, guide, lang);
    if (out == null) { missing.add(key); return tok; }
    const lead = tok.match(/^\s*/)[0];
    const trail = tok.match(/\s*$/)[0];
    return lead + encodeText(out) + trail;
  });
}

// ---------- head blocks ----------

const dirOf = (lang) => (lang === 'en' ? '' : lang + '/');
const urlOf = (file, lang) => SITE + (langsOf(file).includes(lang) ? dirOf(lang) : '') + (file === 'index.html' ? '' : file);
const slug = (file) => file.replace(/\.html$/, '').replace(/\//g, '-');
// One '../' per folder level of a page: '../' for guides/x.html.
const up = (file) => '../'.repeat(file.split('/').length - 1);
const assetsOf = (file, lang) => (lang === 'en' ? '' : '../') + up(file) + 'assets/';

function seoBlock(page, lang, desc, jsonLd) {
  const p = page[lang];
  const assets = assetsOf(page.file, lang);
  // data-switch = where the language button goes, relative, so it also works on a local server.
  const rel = (to) => {
    if (lang === to) return page.file === 'index.html' ? './' : path.posix.basename(page.file);
    const back = (lang === 'en' ? '' : '../') + up(page.file);
    const target = dirOf(to) + (page.file === 'index.html' ? '' : page.file);
    return (back + target) || './';
  };
  const lines = [
    `<link rel="canonical" href="${urlOf(page.file, lang)}">`,
    ...langsOf(page.file).map((l) => `<link rel="alternate" hreflang="${l}" href="${urlOf(page.file, l)}" data-switch="${rel(l)}">`),
    `<link rel="alternate" hreflang="x-default" href="${urlOf(page.file, 'en')}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="${BRAND}">`,
    `<meta property="og:locale" content="${LOCALE[lang]}">`,
    `<meta property="og:title" content="${encodeAttr(seoTitle(p.title))}">`,
    `<meta property="og:description" content="${encodeAttr(desc)}">`,
    `<meta property="og:url" content="${urlOf(page.file, lang)}">`,
    `<meta property="og:image" content="${SITE}assets/og/${slug(page.file)}-${lang === 'ar' ? 'ar' : 'en'}.png">`,
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
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${encodeText(seoTitle(page[lang].title))}</title>`);
  html = html.replace(/(<meta name="description" content=")[^"]*(">)/, `$1${encodeAttr(desc)}$2`);
  const jsonLd = page.guide ? guideJsonLd(html, page, lang, desc) : toolJsonLd(html, page, lang, desc);
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

// Tool pages: WebApplication (free, runs in the browser) + breadcrumb + FAQPage from the page's own
// questions (<details><summary>Q</summary><p>A</p></details>; "More options" boxes have a class and a <div>).
// Home: WebSite + Organization + the list of tools.
function toolJsonLd(html, page, lang, desc) {
  const p = page[lang];
  const url = urlOf(page.file, lang);
  const faq = [...html.matchAll(/<details><summary>([\s\S]*?)<\/summary><p>([\s\S]*?)<\/p><\/details>/g)]
    .map(([, q, a]) => ({ '@type': 'Question', name: plain(q), acceptedAnswer: { '@type': 'Answer', text: plain(a) } }));
  const faqLd = faq.length ? [{ '@context': 'https://schema.org', '@type': 'FAQPage', inLanguage: lang, mainEntity: faq }] : [];
  const org = { '@type': 'Organization', name: BRAND, url: SITE, logo: `${SITE}assets/og/index-en.png` };
  if (page.file === 'index.html') {
    const tools = PAGES.filter((x) => !x.guide && x.file !== 'index.html');
    return [
      { '@context': 'https://schema.org', '@type': 'WebSite', name: BRAND, url, inLanguage: lang, description: desc, publisher: org },
      { '@context': 'https://schema.org', ...org, sameAs: ['https://github.com/scorpion30/file-manager-toolkit'] },
      {
        '@context': 'https://schema.org', '@type': 'ItemList', name: lang === 'ar' ? 'كل الأدوات' : (tr('All tools', false, lang) || 'All tools'),
        itemListElement: tools.map((x, i) => ({ '@type': 'ListItem', position: i + 1, name: (x[lang] || x.en).name, url: urlOf(x.file, lang) })),
      },
      ...faqLd,
    ];
  }
  return [
    {
      '@context': 'https://schema.org', '@type': 'WebApplication', name: p.name, url, description: desc, inLanguage: lang,
      applicationCategory: 'UtilitiesApplication', operatingSystem: 'Any', browserRequirements: 'Requires a modern web browser',
      isAccessibleForFree: true, offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      image: `${SITE}assets/og/${slug(page.file)}-${lang === 'ar' ? 'ar' : 'en'}.png`, publisher: org,
    },
    {
      '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: BRAND, item: urlOf('index.html', lang) },
        { '@type': 'ListItem', position: 2, name: p.name, item: url },
      ],
    },
    ...faqLd,
  ];
}

// ---------- build ----------

const tr = loadTranslator();
const missing = new Set();

// Cache busting: every page links assets/x.css|js?v=<content hash>, so browsers fetch a file again as soon as it changes
// (GitHub Pages lets browsers cache for 10 minutes, which otherwise mixes new pages with old styles).
const assetHash = {};
const hashOf = (rel) => crypto.createHash('sha1').update(fs.readFileSync(path.join(ROOT, 'assets', rel))).digest('hex').slice(0, 8);
for (const f of fs.readdirSync(path.join(ROOT, 'assets'))) {
  if (/\.(css|js)$/.test(f)) assetHash[f] = hashOf(f);
}
for (const l of Object.keys(LANGS)) if (fs.existsSync(path.join(ROOT, 'assets/lang', l + '.js'))) assetHash[`lang/${l}.js`] = hashOf(`lang/${l}.js`);
const unversion = (html) => html.replace(/(assets\/[\w/-]+\.(?:css|js))\?v=[0-9a-f]+/g, '$1');
const version = (html) => html.replace(/(assets\/([\w/-]+\.(?:css|js)))(?=")/g, (m, all, f) => (assetHash[f] ? `${all}?v=${assetHash[f]}` : all));
const missingIn = Object.fromEntries(Object.keys(LANGS).map((l) => [l, new Set()]));

// Links inside a translated page in its own folder: pages that exist in the language stay in the
// folder, all others (guides, tools not translated yet) go back to the English page.
function relink(html) {
  return html.replace(/(<a\b[^>]*?\shref=")([^"]*)"/g, (all, pre, href) => {
    if (/^(?:[a-z]+:|#|\/|\.\.\/)/i.test(href)) return all;
    const pagePart = href.split(/[?#]/)[0].replace(/^\.\//, '');
    if (pagePart === '' || CORE.has(pagePart)) return all;
    return `${pre}../${href.replace(/^\.\//, '')}"`;
  });
}

// Title, name, pitch and description in every language, from the dictionaries.
for (const page of PAGES) {
  for (const l of Object.keys(LANGS)) {
    const t = (s) => (s ? tr(s, false, l) || s : s);
    page[l] = { title: t(page.en.title), name: t(page.en.name), pitch: t(page.en.pitch) };
  }
}
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

  if (!CORE.has(page.file)) continue;
  for (const l of Object.keys(LANGS)) {
    const miss = missingIn[l];
    const lAssets = assetsOf(page.file, l);
    let h = en.replace(/<html[^>]*>/, `<html lang="${l}" data-lang-page="${l}">`);
    h = h.replace(/<body[\s\S]*<\/body>/, (body) => relink(translateBody(body, tr, miss, false, l)));
    const desc = tr(enDesc, false, l);
    if (!desc) miss.add(enDesc);
    if (page[l].title === page.en.title) miss.add(page.en.title);
    page[l].desc = desc || enDesc;
    h = setHead(h, page, l, page[l].desc);
    h = h.split(`href="${enAssets}`).join(`href="${lAssets}`).split(`src="${enAssets}`).join(`src="${lAssets}`);
    h = h.replace(`<script src="${lAssets}i18n.js"></script>`, `<script src="${lAssets}lang/${l}.js"></script>\n  <script src="${lAssets}i18n.js"></script>`);
    if (FONTS[l]) {
      h = h.replace(`<link rel="stylesheet" href="${lAssets}style.css">`,
        `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=${FONTS[l]}:wght@400;500;600;700&display=swap" id="fm-${l}-font">\n  <link rel="stylesheet" href="${lAssets}style.css">`);
    }
    h = h.replace('<head>', `<head>\n  <!-- Generated by tools/build.mjs from ../${page.file} - do not edit. -->`);
    fs.mkdirSync(path.join(ROOT, l), { recursive: true });
    fs.writeFileSync(path.join(ROOT, l, page.file), version(h));
  }
}

const today = new Date().toISOString().slice(0, 10);
const sitemap = ['<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">'];
for (const page of PAGES) {
  const langs = langsOf(page.file);
  for (const lang of langs) {
    sitemap.push('  <url>', `    <loc>${urlOf(page.file, lang)}</loc>`, `    <lastmod>${today}</lastmod>`,
      ...langs.map((l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${urlOf(page.file, l)}"/>`),
      `    <xhtml:link rel="alternate" hreflang="x-default" href="${urlOf(page.file, 'en')}"/>`, '  </url>');
  }
}
sitemap.push('</urlset>', '');
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sitemap.join('\n'));
fs.writeFileSync(path.join(ROOT, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE}sitemap.xml\n`);

console.log(`Built ${PAGES.length} English + ${PAGES.length} Arabic pages, ${CORE.size} pages in each of ${Object.keys(LANGS).join(', ')}, sitemap.xml, robots.txt`);
fs.mkdirSync(path.join(ROOT, 'tools/lang-missing'), { recursive: true });
for (const [l, set] of Object.entries(missingIn)) {
  fs.writeFileSync(path.join(ROOT, 'tools/lang-missing', l + '.json'), JSON.stringify([...set], null, 1) + '\n');
  if (set.size) console.log(`  ${l}: ${set.size} text(s) not translated yet -> tools/lang-missing/${l}.json`);
}
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
