// Lists the English text a language dictionary still needs: the static text of the translated pages
// (from tools/lang-missing/<code>.json, written by build.mjs) plus the text the tools show while they
// run (strings in the core scripts that have an Arabic translation in assets/i18n.js).
//   node tools/lang-worklist.mjs fr   -> tools/lang-missing/fr-all.json
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const lang = process.argv[2];
if (!lang) throw new Error('usage: node tools/lang-worklist.mjs <code>');
const ROOT = process.cwd();
const SCRIPTS = ['common.js', 'kit.js', 'pdfops.js', 'merge.js', 'compress.js', 'pdf-to-word.js', 'pdf-to-image.js', 'image-to-pdf.js',
  'split.js', 'rotate.js', 'unlock.js', 'protect.js', 'watermark.js', 'page-numbers.js', 'pages.js', 'ocr.js', 'crop.js', 'compare.js', 'remove-bg.js',
  'textcase.js', 'units.js', 'hijri.js', 'qr.js', 'calc.js', 'password.js', 'invoice.js'];

// Arabic dictionary keys, read by running i18n.js in a sandbox and exposing AR.
const code = fs.readFileSync(path.join(ROOT, 'assets/i18n.js'), 'utf8').replace("const AR = {", "const AR = window.__AR = {");
const noop = () => {};
const sb = {
  localStorage: { getItem: () => 'en', setItem: noop }, navigator: { language: 'en' }, location: { replace: noop, hash: '' },
  MutationObserver: class { observe() {} }, NodeFilter: {},
  document: { documentElement: { getAttribute: () => null }, addEventListener: noop, querySelector: () => null, querySelectorAll: () => [] },
};
sb.window = sb;
vm.createContext(sb);
const lf = path.join(ROOT, 'assets/lang', lang + '.js');
if (fs.existsSync(lf)) vm.runInContext(fs.readFileSync(lf, 'utf8'), sb);
vm.runInContext(code, sb);
const AR = sb.window.__AR;
const have = (sb.window.FM_LANG_DICTS[lang] || { dict: {} }).dict;

const literals = new Set();
for (const f of SCRIPTS) {
  const p = path.join(ROOT, 'assets', f);
  if (!fs.existsSync(p)) continue;
  const src = fs.readFileSync(p, 'utf8');
  for (const m of src.matchAll(/'((?:[^'\\\n]|\\.)+)'|"((?:[^"\\\n]|\\.)+)"|`([^`$\n]+)`/g)) {
    const s = (m[1] || m[2] || m[3]).replace(/\\'/g, "'").replace(/\s+/g, ' ').trim();
    if (Object.prototype.hasOwnProperty.call(AR, s)) literals.add(s);
  }
}
const staticList = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/lang-missing', lang + '.json'), 'utf8'));
const all = [...new Set([...staticList, ...literals])].filter((s) => !Object.prototype.hasOwnProperty.call(have, s));
fs.writeFileSync(path.join(ROOT, 'tools/lang-missing', lang + '-all.json'), JSON.stringify(all, null, 1) + '\n');
console.log(`${lang}: ${staticList.length} page text + ${literals.size} tool text -> ${all.length} to translate`);
