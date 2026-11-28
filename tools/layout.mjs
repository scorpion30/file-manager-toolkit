// Writes the parts every English page shares, from tools/catalog.mjs:
//   - the header, with the "All tools" menu
//   - the footer, with every tool
//   - the tool grid on the home page (between <!-- grid:start --> and <!-- grid:end -->)
// Run from the repo root, before tools/build.mjs:   node tools/layout.mjs
import fs from 'node:fs';
import path from 'node:path';
import { CATS, TOOLS as ALL_TOOLS, icon, byHref, EVERYDAY } from './catalog.mjs';

// Tools shown in the menus and on the home page (hidden ones are search landing pages only).
const TOOLS = ALL_TOOLS.filter((t) => !t.hidden);

const ROOT = process.cwd();
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function header(up) {
  const cols = CATS.map((c) => {
    const links = TOOLS.filter((t) => t.cat === c.key)
      .map((t) => `<a href="${up}${t.href}"><span class="mi cat-${t.cat}">${icon(t.icon)}</span>${esc(t.name)}</a>`).join('');
    return `<div class="mega-col"><h4>${esc(c.name)}${EVERYDAY.includes(c.key) ? '<span class="mini-new">New</span>' : ''}</h4>${links}</div>`;
  }).join('\n          ');
  return `<header class="site-header">
    <div class="inner">
      <a class="brand" href="${up || './'}"><img src="${up}assets/favicon.ico" alt="">File Manager <span>Toolkit</span></a>
      <nav>
        <a href="${up}merge.html" class="hide-md">Merge PDF</a>
        <a href="${up}split.html" class="hide-md">Split PDF</a>
        <a href="${up}compress.html" class="hide-md">Compress PDF</a>
        <a href="${up}pdf-to-image.html" class="hide-md">PDF to JPG</a>
        <div class="mega-wrap">
          <button class="mega-btn" type="button" aria-expanded="false" aria-controls="megaMenu">All tools <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button>
          <div class="mega" id="megaMenu" hidden>
          ${cols}
          </div>
        </div>
        <button class="theme-btn" type="button" data-theme-toggle aria-label="Switch light or dark mode"></button>
        <a class="donate-btn" href="https://www.paypal.com/paypalme/FileManagerApp/5" target="_blank" rel="noopener">♥ Donate</a>
      </nav>
    </div>
  </header>`;
}

// The guide links come from the current home footer, so new guides only need adding there.
const home = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const guideLinks = [...home.matchAll(/<a href="(guides\/[^"]+)">([^<]+)<\/a>/g)]
  .filter((m, i, all) => all.findIndex((x) => x[1] === m[1]) === i);

function footer(up) {
  const col = (title, keys) => `<div class="f-col"><h4>${title}</h4>${TOOLS.filter((t) => keys.includes(t.cat)).map((t) => `<a href="${up}${t.href}">${esc(t.name)}</a>`).join('')}</div>`;
  const guides = guideLinks.map(([, href, text]) => `<a href="${up}${href}">${text}</a>`).join('');
  return `<footer class="site-footer">
    <div class="inner">
      <div class="f-brand">
        <a class="brand" href="${up || './'}"><img src="${up}assets/favicon.ico" alt="">File Manager <span>Toolkit</span></a>
        <p>Free PDF and file tools that run in your browser. No upload, no sign-up, no limits.</p>
      </div>
      ${col('PDF tools', ['organize', 'optimize'])}
      ${col('Convert &amp; edit', ['convert', 'edit'])}
      ${col('Security &amp; files', ['security', 'files'])}
      ${col('For engineers', ['eng'])}
      ${col('Everyday tools', EVERYDAY)}
      <div class="f-col"><h4>Guides</h4>${guides}<h4 style="margin-top:14px">About</h4><a href="https://www.paypal.com/paypalme/FileManagerApp/5" target="_blank" rel="noopener">Donate</a><a href="https://github.com/scorpion30/file-manager-toolkit" target="_blank" rel="noopener">Source code</a></div>
    </div>
    <div class="f-bottom">© File Manager Toolkit · All processing happens locally in your browser.</div>
  </footer>`;
}

// Home grid, split in two side by side:
//   left  - the tools people search for most (what every PDF site has)
//   right - our own tools that other PDF sites don't have, in a highlighted column with NEW badges
// On phones the right column moves above the grid and scrolls sideways.
function grid() {
  const card = (t) => `<a class="tool-card cat-${t.cat}${t.unique ? ' unique' : ''}" href="${t.href}" data-cat="${t.cat}"${t.unique ? ' data-unique="1"' : ''}${t.drop ? ` data-drop="${t.drop}"` : ''}>
          ${t.unique || EVERYDAY.includes(t.cat) ? '<span class="badge new-badge">New</span>' : ''}<span class="icon">${icon(t.icon)}</span>
          <h3>${esc(t.name)}</h3>
          <p>${esc(t.desc)}</p>
        </a>`;
  const popular = TOOLS.filter((t) => !t.unique && !EVERYDAY.includes(t.cat)).map(card).join('\n        ');
  const everyday = TOOLS.filter((t) => EVERYDAY.includes(t.cat)).map(card).join('\n          ');
  const unique = TOOLS.filter((t) => t.unique).map(card).join('\n          ');
  return `<!-- grid:start -->
      ${big()}
      <div class="tools-split">
      <div class="tool-grid all-tools main-tools">
        ${popular}
        <a class="tool-card request" href="#feedback" data-feedback="idea" data-cat="request">
          <span class="icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg></span>
          <h3>Need another tool?</h3>
          <p>Tell us what you still do by hand. The most requested tools get built next.</p>
        </a>
      </div>
      <aside class="only-here-col" aria-labelledby="onlyHereTitle">
        <div class="only-head">
          <h2 id="onlyHereTitle"><span aria-hidden="true">✦</span> Only on File Manager Toolkit</h2>
          <p>Tools you won't find on other PDF sites: whole folders, file names, Excel lists and drawing checks.</p>
        </div>
        <div class="tool-grid all-tools unique-list">
          ${unique}
        </div>
      </aside>
      </div>
      <section class="everyday" id="everyday" aria-labelledby="everydayTitle">
        <div class="everyday-head">
          <h2 id="everydayTitle">Everyday tools</h2>
          <p>Invoices, VAT and percentages, QR codes, passwords, unit converters, Hijri dates and text. Free, instant, nothing to install.</p>
        </div>
        <div class="tool-grid all-tools everyday-list">
          ${everyday}
        </div>
      </section>
      <!-- grid:end -->`;
}

// Three big coloured buttons between the search box and the grid, for the everyday tools people look for most.
const BIG = [
  ['text-case.html', 'Text tools', 'Change case, clean up, count words and characters'],
  ['qr-code.html', 'QR Code Generator', 'Links, Wi-Fi, WhatsApp. Never expires'],
  ['unit-converter.html', 'Unit Converter', 'Length, weight, area, temperature, Hijri dates'],
];
function big() {
  return `<div class="big-tools" id="bigTools">
        ${BIG.map(([href, name, sub]) => { const t = byHref(href); return `<a class="big-tool cat-${t.cat}" href="${href}"><span class="bt-icon">${icon(t.icon)}</span><span class="bt-text"><b>${name}</b><small>${sub}</small></span><span class="bt-go" aria-hidden="true">→</span></a>`; }).join('\n        ')}
      </div>`;
}

// "Related tools" at the end of every tool page: the others in its category, then the most used ones.
const POPULAR = ['merge.html', 'pdf-to-word.html', 'remove-bg.html', 'compress.html', 'split.html', 'pdf-to-image.html', 'pages.html', 'rename.html', 'watermark.html', 'ocr.html'];
function related(file) {
  const me = byHref(file);
  const picks = [...TOOLS.filter((t) => t.cat === me.cat && t.href !== file), ...POPULAR.map(byHref)]
    .filter((t, i, all) => t.href !== file && all.findIndex((x) => x.href === t.href) === i).slice(0, 6);
  const cards = picks.map((t) => `<a class="tool-card cat-${t.cat}" href="${t.href}">
          <span class="icon">${icon(t.icon)}</span>
          <h3>${esc(t.name)}</h3>
          <p>${esc(t.desc)}</p>
        </a>`).join('\n        ');
  return `<!-- related:start -->
    <section class="related-tools">
      <h2>Related tools</h2>
      <div class="tool-grid">
        ${cards}
      </div>
    </section>
    <!-- related:end -->`;
}

const pages = [
  ...fs.readdirSync(ROOT).filter((f) => f.endsWith('.html')).map((f) => ({ file: f, up: '' })),
  ...fs.readdirSync(path.join(ROOT, 'guides')).filter((f) => f.endsWith('.html')).map((f) => ({ file: 'guides/' + f, up: '../' })),
];
let n = 0;
for (const { file, up } of pages) {
  const p = path.join(ROOT, file);
  let html = fs.readFileSync(p, 'utf8');
  if (!html.includes('<header class="site-header">')) continue;
  const before = html;
  html = html.replace(/<header class="site-header">[\s\S]*?<\/header>/, header(up));
  html = html.replace(/<footer class="site-footer">[\s\S]*?<\/footer>/, footer(up));
  if (file === 'index.html') html = html.replace(/<!-- grid:start -->[\s\S]*?<!-- grid:end -->/, grid()).replace(/\n?\s*<!-- quick:start -->[\s\S]*?<!-- quick:end -->/, '');
  else if (byHref(file)) {
    html = html.replace(/\n?\s*<!-- related:start -->[\s\S]*?<!-- related:end -->/, '');
    html = html.replace(/(\n\s*)<\/main>/, (m, ws) => `\n    ${related(file)}${ws}</main>`);
  }
  if (html !== before) { fs.writeFileSync(p, html); n++; }
}
console.log(`layout: updated ${n} page(s), ${TOOLS.length} tools`);
