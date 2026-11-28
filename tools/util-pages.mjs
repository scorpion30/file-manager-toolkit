// Writes the everyday tool pages (no files: text, unit converters, Hijri dates, QR codes) from one template.
// Run from the repo root:  node tools/util-pages.mjs && node tools/layout.mjs && node tools/build.mjs
// Edit the page text here, not in the .html files (they are overwritten).
import fs from 'node:fs';
import vm from 'node:vm';
import { CATS, icon } from './catalog.mjs';

const catName = (k) => CATS.find((c) => c.key === k).name;
const sb = {}; sb.globalThis = sb; vm.createContext(sb);
vm.runInContext(fs.readFileSync('assets/units-data.js', 'utf8'), sb);
const { U, convert, fmt } = sb.FMUnits;

const seg = (name, items) => `<div class="seg${items.length > 4 ? " wrap" : ""}" role="radiogroup">${items.map(([v, l, on]) =>
  `<label><input type="radio" name="${name}" value="${v}"${on ? ' checked' : ''}><span>${l}</span></label>`).join('')}</div>`;

// ------------------------------------------------------------------ bodies
function textBody(counter) {
  const stats = [['c', 'Characters with spaces'], ['cn', 'Characters without spaces'], ['w', 'Words'], ['s', 'Sentences'], ['l', 'Lines'], ['r', 'Reading time']]
    .map(([k, l]) => `<div><b id="st-${k}" translate="no">0</b><span>${l}</span></div>`).join('');
  const btn = (a, l) => `<button type="button" class="btn" data-tx="${a}">${l}</button>`;
  return `<section class="panel util-box tx${counter ? ' tx-counter' : ''}">
      ${counter ? `<div class="tx-stats">${stats}</div>` : ''}
      <textarea id="txIn" dir="auto" spellcheck="false" placeholder="Type or paste your text here" aria-label="Your text"></textarea>
      <div class="tx-groups">
        <div><h3>Change case</h3><div class="tx-btns">${btn('upper', 'UPPERCASE')}${btn('lower', 'lowercase')}${btn('title', 'Title Case')}${btn('sentence', 'Sentence case')}${btn('swap', 'Swap case')}${btn('camel', 'camelCase')}${btn('snake', 'snake_case')}${btn('kebab', 'kebab-case')}</div></div>
        <div><h3>Clean up</h3><div class="tx-btns">${btn('spaces', 'Remove extra spaces')}${btn('breaks', 'Remove line breaks')}${btn('empty', 'Remove empty lines')}${btn('dupes', 'Remove duplicate lines')}${btn('sort', 'Sort lines A → Z')}${btn('tashkeel', 'Remove Arabic diacritics')}</div></div>
        ${counter ? '' : `<div class="tx-count"><h3>Counter</h3><div class="tx-stats">${stats}</div></div>`}
      </div>
      <div class="tx-foot">
        <button type="button" class="btn primary" id="txCopy">Copy text</button>
        <button type="button" class="btn" id="txSave">Download .txt</button>
        <button type="button" class="btn ghost" id="txUndo" disabled>Undo</button>
        <button type="button" class="btn ghost" id="txClear">Clear</button>
        <span class="tx-msg" id="txMsg" role="status"></span>
      </div>
    </section>`;
}

function convBody(c) {
  const tabs = c.hub ? `<div class="conv-tabs">${seg('convCat', [...Object.entries(U).map(([k, v], i) => [k, v.name, i === 0]), ['date', 'Hijri date']])}</div>` : '';
  return `<section class="panel util-box conv" id="conv" data-cat="${c.cat}" data-from="${c.from}" data-to="${c.to}"${c.hub ? ' data-hub="1"' : ''}>
      ${tabs}
      <div id="convMain">
      <div class="conv-row">
        <label class="conv-side"><input type="text" inputmode="decimal" id="convA" value="1" dir="ltr" aria-label="Value to convert"><select id="convUA" aria-label="From"></select></label>
        <button type="button" class="conv-swap" id="convSwap" aria-label="Swap units" title="Swap units">⇄</button>
        <label class="conv-side"><input type="text" inputmode="decimal" id="convB" dir="ltr" aria-label="Result"><select id="convUB" aria-label="To"></select></label>
      </div>
      <p class="conv-formula" id="convFormula" dir="ltr" translate="no"></p>
      <div class="conv-all"><h3>The same value in every unit</h3><ul id="convAll"></ul></div>
      </div>
      ${c.hub ? `<div id="convDate" class="hj" hidden>${hijriInner()}</div>` : ''}
    </section>
    ${c.hub ? popularLinks() : ''}`;
}

function convTable(c) {
  if (!c.table) return '';
  const rows = (from, to, vals) => vals.map((v) => `<tr><td>${fmt(v)}</td><td>${fmt(convert(c.cat, from, to, v))}</td></tr>`).join('');
  const th = (u) => `<th><span>${U[c.cat].units[u].name}</span> <span translate="no">(${U[c.cat].units[u].sym})</span></th>`;
  const t = (from, to, vals) => `<table class="conv-tbl" dir="ltr"><thead><tr>${th(from)}${th(to)}</tr></thead><tbody translate="no">${rows(from, to, vals)}</tbody></table>`;
  return `<section class="panel conv-tables">
      <h2>Conversion tables</h2>
      <p class="conv-formula" dir="ltr" translate="no">1 ${U[c.cat].units[c.from].sym} = ${fmt(convert(c.cat, c.from, c.to, 1))} ${U[c.cat].units[c.to].sym} · 1 ${U[c.cat].units[c.to].sym} = ${fmt(convert(c.cat, c.to, c.from, 1))} ${U[c.cat].units[c.from].sym}</p>
      <div class="conv-tbls">${t(c.from, c.to, c.table)}${t(c.to, c.from, c.table2 || c.table)}</div>
    </section>`;
}

function hijriBody() {
  return `<section class="panel util-box hj">${hijriInner()}</section>`;
}
function hijriInner() {
  return `
      <div class="hj-today" id="hjToday" aria-live="polite"></div>
      <div class="hj-grid">
        <div class="hj-card">
          <h2>Gregorian to Hijri</h2>
          <input type="date" id="gIn" aria-label="Gregorian date">
          <div class="hj-out" id="gOut"></div>
        </div>
        <div class="hj-card">
          <h2>Hijri to Gregorian</h2>
          <div class="hj-in">
            <input type="number" id="hD" min="1" max="30" placeholder="Day" aria-label="Hijri day">
            <select id="hM" aria-label="Hijri month"></select>
            <input type="number" id="hY" min="1300" max="1600" placeholder="Year" aria-label="Hijri year">
          </div>
          <div class="hj-out" id="hOut"></div>
        </div>
      </div>
      <div class="opt"><span class="opt-label">Calendar</span>${seg('hjCal', [['islamic-umalqura', 'Umm al-Qura (Saudi Arabia)', true], ['islamic-civil', 'Standard (civil)']])}</div>
      <p class="hint">Some countries start a month one day earlier or later, after the moon is sighted.</p>`;
}

// Links from the unit converter to the single-conversion pages (they are not in the menus any more).
function popularLinks() {
  const L = [['kg-to-lbs.html', 'Kg to Lbs'], ['cm-to-inches.html', 'Cm to Inches'], ['meters-to-feet.html', 'Meters to Feet'], ['km-to-miles.html', 'Km to Miles'], ['sqm-to-sqft.html', 'Square Meters to Square Feet'], ['feddan-to-sqm.html', 'Feddan to Square Meters'], ['celsius-to-fahrenheit.html', 'Celsius to Fahrenheit'], ['liters-to-gallons.html', 'Liters to Gallons'], ['hijri-converter.html', 'Hijri Date Converter']];
  return `<section class="conv-popular"><h2>Popular conversions, with ready tables</h2><div class="chips">${L.map(([h, n]) => `<a class="chip" href="${h}">${n}</a>`).join('')}</div></section>`;
}

function qrBody() {
  const f = (t, html) => `<div class="qr-fields" data-qt="${t}"${t === 'url' ? '' : ' hidden'}>${html}</div>`;
  const inp = (id, l, type = 'text', ph = '', extra = '') => `<label class="opt"><span class="opt-label">${l}</span><input type="${type}" id="${id}" placeholder="${ph}"${extra}></label>`;
  return `<section class="util-split qr">
      <div class="panel">
        ${seg('qrType', [['url', 'Link', true], ['text', 'Text'], ['wifi', 'Wi-Fi'], ['wa', 'WhatsApp'], ['tel', 'Phone'], ['email', 'Email'], ['vcard', 'Contact']])}
        ${f('url', inp('qUrl', 'Link', 'url', 'https://example.com', ' dir="ltr" value="https://filemanagertoolkit.com"'))}
        ${f('text', '<label class="opt"><span class="opt-label">Text</span><textarea id="qText" rows="4" dir="auto" placeholder="Any text"></textarea></label>')}
        ${f('wifi', inp('qSsid', 'Network name', 'text', '', ' dir="auto"') + inp('qPass', 'Password', 'text', '', ' dir="ltr"') + `<div class="opt"><span class="opt-label">Security</span>${seg('qEnc', [['WPA', 'WPA/WPA2', true], ['WEP', 'WEP'], ['nopass', 'None']])}</div><label class="check"><input type="checkbox" id="qHidden"> Hidden network</label>`)}
        ${f('wa', inp('qWaNum', 'Phone number with country code', 'tel', '971501234567', ' dir="ltr"') + '<label class="opt"><span class="opt-label">Message (optional)</span><textarea id="qWaMsg" rows="3" dir="auto"></textarea></label>')}
        ${f('tel', inp('qTel', 'Phone number', 'tel', '+971501234567', ' dir="ltr"'))}
        ${f('email', inp('qMail', 'Email address', 'email', 'name@example.com', ' dir="ltr"') + inp('qSubj', 'Subject (optional)', 'text', '', ' dir="auto"') + '<label class="opt"><span class="opt-label">Message (optional)</span><textarea id="qBody" rows="3" dir="auto"></textarea></label>')}
        ${f('vcard', inp('qName', 'Full name', 'text', '', ' dir="auto"') + inp('qOrg', 'Company', 'text', '', ' dir="auto"') + inp('qTitle', 'Job title', 'text', '', ' dir="auto"') + inp('qPhone', 'Phone', 'tel', '', ' dir="ltr"') + inp('qVmail', 'Email', 'email', '', ' dir="ltr"') + inp('qWeb', 'Website', 'url', '', ' dir="ltr"'))}
        <details class="more qr-style" open>
          <summary>Style</summary>
          <div class="qr-colors">
            <label class="opt"><span class="opt-label">Colour</span><input type="color" id="qFg" value="#111827"></label>
            <label class="opt"><span class="opt-label">Background</span><input type="color" id="qBg" value="#ffffff"></label>
            <label class="check"><input type="checkbox" id="qTransparent"> Transparent background</label>
          </div>
          <div class="opt"><span class="opt-label">Size</span>${seg('qSize', [['512', '512 px'], ['1024', '1024 px', true], ['2048', '2048 px']])}</div>
          <div class="opt"><span class="opt-label">Error correction</span>${seg('qEc', [['L', 'Low'], ['M', 'Medium', true], ['Q', 'Good'], ['H', 'High']])}</div>
          <div class="opt"><span class="opt-label">Logo in the middle (optional)</span><div class="inline"><button type="button" class="btn" id="qLogoBtn">Choose a logo</button><button type="button" class="btn ghost" id="qLogoDel" hidden>Remove logo</button></div><input type="file" id="qLogo" accept="image/*" hidden></div>
        </details>
      </div>
      <div class="panel qr-out">
        <div class="qr-stage"><canvas id="qrCanvas" width="1024" height="1024" aria-label="QR code preview"></canvas></div>
        <p class="qr-note" id="qrNote" role="status"></p>
        <div class="dl-row">
          <button type="button" class="btn primary" id="qPng">Download PNG</button>
          <button type="button" class="btn" id="qSvg">Download SVG</button>
          <button type="button" class="btn ghost" id="qCopy">Copy image</button>
        </div>
        <p class="hint">The QR code holds your link or text itself, not a redirect, so it keeps working forever. Test it with your phone camera before you print.</p>
      </div>
    </section>`;
}

const num = (id, val = '', extra = '') => `<input type="text" inputmode="decimal" id="${id}" value="${val}" dir="ltr" translate="no" autocomplete="off"${extra}>`;

function percentBody() {
  const card = (k, q, out = '') => `<div class="pc-card" data-pc="${k}"><p class="pc-q">${q}</p><output class="pc-out" id="pc-${k}" role="status">${out}</output></div>`;
  return `<section class="pc-grid">
      ${card('of', `<span>What is</span> ${num('pcOfA', '15')} <span>% of</span> ${num('pcOfB', '200')}<span>?</span>`)}
      ${card('what', `${num('pcWhatA', '30')} <span>is what percent of</span> ${num('pcWhatB', '200')}<span>?</span>`)}
      ${card('change', `<span>Percentage change from</span> ${num('pcChA', '80')} <span>to</span> ${num('pcChB', '100')}`)}
      ${card('inc', `${num('pcIncA', '200')} <span>increased by</span> ${num('pcIncB', '10')} <span>%</span>`)}
      ${card('dec', `${num('pcDecA', '200')} <span>decreased by</span> ${num('pcDecB', '10')} <span>%</span>`)}
      ${card('disc', `<span>Price</span> ${num('pcDiscA', '250')} <span>with a discount of</span> ${num('pcDiscB', '20')} <span>%</span>`)}
    </section>
    <p class="hint pc-hint">Click a result to copy it.</p>`;
}

function vatBody() {
  const rates = [['5', 'UAE, Oman'], ['10', 'Bahrain'], ['14', 'Egypt'], ['15', 'Saudi Arabia'], ['16', 'Jordan'], ['20', 'UK, Morocco']];
  const res = (id, l) => `<button type="button" class="vat-res" id="${id}" data-copy=""><span>${l}</span><b dir="ltr" translate="no">0.00</b></button>`;
  return `<section class="panel util-box vat">
      ${seg('vatMode', [['add', 'Add VAT', true], ['remove', 'Remove VAT (the price includes VAT)']])}
      <div class="vat-in">
        <label class="opt"><span class="opt-label">Amount</span>${num('vAmt', '1000')}</label>
        <label class="opt vat-rate"><span class="opt-label">VAT rate (%)</span>${num('vRate', '5')}</label>
      </div>
      <div class="vat-rates" role="group" aria-label="VAT rate">${rates.map(([r, c]) => `<button type="button" class="chip" data-rate="${r}"><b translate="no">${r}%</b><small>${c}</small></button>`).join('')}</div>
      <div class="vat-out">
        ${res('vNet', 'Amount without VAT')}
        ${res('vVat', 'VAT')}
        ${res('vTot', 'Total with VAT')}
      </div>
      <p class="vat-formula" id="vFormula" dir="ltr" translate="no"></p>
      <p class="hint">Click a number to copy it. Need a full invoice? <a href="invoice-generator.html">Make one with the Invoice Generator</a>.</p>
    </section>`;
}

function passwordBody() {
  const chk = (id, l, on = true) => `<label class="check"><input type="checkbox" id="${id}"${on ? ' checked' : ''}> ${l}</label>`;
  return `<section class="panel util-box pw">
      <div class="pw-out">
        <input type="text" id="pwOut" readonly dir="ltr" translate="no" aria-label="Your new password" spellcheck="false">
        <button type="button" class="btn ghost pw-new" id="pwNew" aria-label="New password" title="New password">↻</button>
        <button type="button" class="btn primary" id="pwCopy">Copy</button>
      </div>
      <div class="pw-meter" aria-hidden="true"><i id="pwBar"></i></div>
      <p class="pw-strength" id="pwStrength" role="status"></p>
      <label class="opt pw-len"><span class="opt-label">Length</span><input type="range" id="pwLen" min="6" max="64" value="16"><b id="pwLenV" translate="no">16</b></label>
      <div class="pw-checks">
        ${chk('pwUp', 'Uppercase (A–Z)')}${chk('pwLow', 'Lowercase (a–z)')}${chk('pwNum', 'Numbers (0–9)')}${chk('pwSym', 'Symbols (!@#$…)')}${chk('pwSimilar', 'Avoid look-alike characters (O 0 l 1 I)', false)}
      </div>
      <div class="pw-more"><h3>More passwords</h3><ul id="pwList"></ul></div>
    </section>`;
}

function invoiceBody() {
  const inp = (id, l, type = 'text', extra = '') => `<label class="opt"><span class="opt-label">${l}</span><input type="${type}" id="${id}" dir="auto"${extra}></label>`;
  const area = (id, l, rows = 2) => `<label class="opt"><span class="opt-label">${l}</span><textarea id="${id}" rows="${rows}" dir="auto"></textarea></label>`;
  const cur = ['AED', 'SAR', 'EGP', 'KWD', 'QAR', 'BHD', 'OMR', 'JOD', 'USD', 'EUR', 'GBP'];
  return `<section class="util-split inv">
      <div class="panel inv-form">
        <fieldset><legend>Invoice</legend>
          <div class="opt"><span class="opt-label">Invoice language</span>${seg('invLang', [['en', 'English'], ['ar', 'العربية'], ['both', 'English + العربية']])}</div>
          <div class="inv-row2">
            ${inp('iNo', 'Invoice number', 'text', ' value="INV-0001"')}
            <label class="opt"><span class="opt-label">Currency</span><select id="iCur" translate="no">${cur.map((c) => `<option>${c}</option>`).join('')}</select></label>
          </div>
          <div class="inv-row2">
            ${inp('iDate', 'Date', 'date')}
            ${inp('iDue', 'Due date (optional)', 'date')}
          </div>
        </fieldset>
        <fieldset><legend>From (your business)</legend>
          ${inp('sName', 'Business name')}
          ${area('sAddr', 'Address')}
          <div class="inv-row2">${inp('sTrn', 'Tax number (TRN)')}${inp('sPhone', 'Phone', 'tel')}</div>
          ${inp('sMail', 'Email', 'email')}
          <div class="opt"><span class="opt-label">Logo (optional)</span><div class="inline"><button type="button" class="btn" id="sLogoBtn">Choose a logo</button><button type="button" class="btn ghost" id="sLogoDel" hidden>Remove logo</button></div><input type="file" id="sLogo" accept="image/*" hidden></div>
        </fieldset>
        <fieldset><legend>Bill to</legend>
          ${inp('cName', 'Customer name')}
          ${area('cAddr', 'Address')}
          ${inp('cTrn', 'Customer tax number (optional)')}
        </fieldset>
        <fieldset><legend>Items</legend>
          <div class="inv-items" id="iItems"></div>
          <button type="button" class="btn" id="iAdd">+ Add item</button>
          <div class="inv-row2">
            <label class="opt"><span class="opt-label">Discount (amount)</span>${num('iDisc', '0')}</label>
            <label class="opt"><span class="opt-label">VAT rate (%)</span>${num('iVat', '5')}</label>
          </div>
          ${area('iNotes', 'Notes or payment terms (optional)', 3)}
        </fieldset>
      </div>
      <div class="inv-side">
        <div class="inv-paper" id="invPaper" translate="no"></div>
        <div class="dl-row">
          <button type="button" class="btn primary" id="iPdf">Download PDF</button>
          <button type="button" class="btn" id="iNew">New invoice</button>
          <button type="button" class="btn ghost" id="iReset">Clear all</button>
        </div>
        <p class="hint">Download PDF opens the print window: choose <b>Save as PDF</b>. Your details are kept in this browser for next time, never uploaded.</p>
      </div>
    </section>`;
}

// ------------------------------------------------------------------ pages
const convHow = ['<b>Type a number</b> in either box. The other box updates as you type.', '<b>Pick other units</b> from the lists, or press ⇄ to swap them.', '<b>Copy any result</b>: click a value in the list to copy it.'];
const convFaqCommon = ['Is this converter free?', 'Yes, free and without sign-up. It works in your browser, even offline once the page has loaded.'];
const lin = (a, b, step = 1) => Array.from({ length: Math.floor((b - a) / step) + 1 }, (_, i) => +(a + i * step).toFixed(4));

const PAGES = [
  {
    file: 'text-case.html', script: 'textcase.js', cat: 'text', icon: 'textcase',
    title: 'Text Case Converter: UPPERCASE, lowercase, Title Case, Free | File Manager Toolkit',
    desc: 'Change text to UPPERCASE, lowercase, Title Case, Sentence case, camelCase or snake_case. Remove extra spaces, line breaks, duplicate lines and Arabic diacritics. Free, nothing is uploaded.',
    h1: 'Text Case Converter', sub: 'Change the case, clean up spaces and lines, and count words and characters.',
    body: textBody(false),
    howto: ['<b>Paste or type</b> your text in the box.', '<b>Click a button</b>: UPPERCASE, lowercase, Title Case, or a clean-up like removing extra spaces.', '<b>Copy the result</b> or download it as a .txt file. Undo goes back one step.'],
    faq: [
      ['What is Title Case?', 'Every word starts with a capital letter, like a book title: "The Quick Brown Fox". Sentence case only capitalises the first word of each sentence.'],
      ['Can it remove the diacritics from Arabic text?', 'Yes. "Remove Arabic diacritics" takes out the tashkeel (fatha, damma, kasra, shadda and the rest) and the tatweel, and keeps the letters.'],
      ['Can it count words and characters?', 'Yes. The Counter shows characters with and without spaces, words, sentences, lines and reading time, and updates as you type.'],
      ['Is my text sent anywhere?', 'No. Everything happens in your browser. Nothing is uploaded or saved.'],
    ],
  },
  {
    file: 'word-counter.html', script: 'textcase.js', cat: 'text', icon: 'counter',
    title: 'Word Counter: Count Words and Characters Online, Free | File Manager Toolkit',
    desc: 'Count words, characters (with and without spaces), sentences, lines and reading time as you type. Works for English, Arabic and every language. Free, nothing is uploaded.',
    h1: 'Word Counter', sub: 'Words, characters, sentences and reading time, as you type.',
    body: textBody(true),
    howto: ['<b>Paste or type</b> your text in the box.', '<b>Read the counts</b> at the top: they update as you type.', '<b>Clean up</b> the text with the buttons below if you need to, then copy it.'],
    faq: [
      ['Does it count Arabic words correctly?', 'Yes. Words are counted by the spaces between them, so Arabic, English and mixed text are all counted the same way.'],
      ['How is reading time worked out?', 'At about 200 words a minute, a normal reading speed for most people.'],
      ['Is my text sent anywhere?', 'No. Everything happens in your browser. Nothing is uploaded or saved.'],
    ],
  },
  {
    file: 'unit-converter.html', cat: 'units', icon: 'units', conv: { cat: 'length', from: 'm', to: 'ft', hub: true }, extraScripts: ['hijri.js'],
    title: 'Unit Converter: Length, Weight, Area, Volume, Temperature, Speed | File Manager Toolkit',
    desc: 'Convert length, weight, area, volume, temperature and speed: metres, feet, kilograms, pounds, square metres, feddan, litres, gallons, °C and °F. Free, instant, no ads in the way.',
    h1: 'Unit Converter', sub: 'Length, weight, area, volume, temperature, speed and Hijri dates, in one place.',
    faq: [
      ['Which units are included?', 'Metric and imperial units for length, weight, area, volume, temperature and speed, plus feddan, qirat and dunam for land.'],
      ['Can it convert Hijri dates?', 'Yes. Open the Hijri date tab to change a Gregorian date to Hijri or back, with today’s date in both calendars.'],
      convFaqCommon,
    ],
  },
  {
    file: 'kg-to-lbs.html', cat: 'units', icon: 'weight', conv: { cat: 'mass', from: 'kg', to: 'lb', table: [...lin(1, 20), 25, 30, 40, 50, 60, 70, 75, 80, 90, 100] },
    title: 'Kg to Lbs Converter: Kilograms to Pounds, with Table | File Manager Toolkit',
    desc: 'Convert kilograms to pounds (kg to lbs) and pounds to kg instantly. 1 kg = 2.20462 lb. Ready conversion table from 1 to 100 kg. Free.',
    h1: 'Kg to Lbs', sub: 'Kilograms to pounds and back. 1 kg = 2.20462 lb.',
    faq: [
      ['How many pounds are in a kilogram?', 'One kilogram is 2.20462 pounds. To change kg to lbs, multiply by 2.20462. To change lbs to kg, multiply by 0.453592.'],
      convFaqCommon,
    ],
  },
  {
    file: 'cm-to-inches.html', cat: 'units', icon: 'length', conv: { cat: 'length', from: 'cm', to: 'in', table: [...lin(1, 30), 40, 50, 60, 70, 80, 90, 100, 150, 200] },
    title: 'Cm to Inches Converter: Centimetres to Inches, with Table | File Manager Toolkit',
    desc: 'Convert centimetres to inches (cm to in) and inches to cm instantly. 1 inch = 2.54 cm. Ready conversion table. Free.',
    h1: 'Cm to Inches', sub: 'Centimetres to inches and back. 1 inch = 2.54 cm.',
    faq: [
      ['How many centimetres are in an inch?', 'One inch is exactly 2.54 cm. To change cm to inches, divide by 2.54.'],
      convFaqCommon,
    ],
  },
  {
    file: 'meters-to-feet.html', cat: 'units', icon: 'length', conv: { cat: 'length', from: 'm', to: 'ft', table: [...lin(1, 20), 25, 30, 40, 50, 75, 100, 200, 500, 1000] },
    title: 'Meters to Feet Converter: m to ft, with Table | File Manager Toolkit',
    desc: 'Convert metres to feet (m to ft) and feet to metres instantly. 1 m = 3.28084 ft. Ready conversion table, feet and inches too. Free.',
    h1: 'Meters to Feet', sub: 'Metres to feet and back. 1 m = 3.28084 ft.',
    faq: [
      ['How many feet are in a metre?', 'One metre is 3.28084 feet. One foot is exactly 0.3048 metres.'],
      ['How do I write metres in feet and inches?', 'Type the metres: under the result you also get feet and inches, like 1.8 m = 5 ft 10.9 in.'],
      convFaqCommon,
    ],
  },
  {
    file: 'km-to-miles.html', cat: 'units', icon: 'length', conv: { cat: 'length', from: 'km', to: 'mi', table: [1, 2, 3, 4, 5, 10, 15, 20, 21.0975, 25, 30, 40, 42.195, 50, 60, 70, 80, 90, 100, 120, 150, 200, 500, 1000] },
    title: 'Km to Miles Converter: Kilometres to Miles, with Table | File Manager Toolkit',
    desc: 'Convert kilometres to miles (km to mi) and miles to km instantly. 1 km = 0.621371 mi. Ready table with 5K, 10K, half and full marathon. Free.',
    h1: 'Km to Miles', sub: 'Kilometres to miles and back. 1 km = 0.621371 mi.',
    faq: [
      ['How many miles is a kilometre?', 'One kilometre is 0.621371 miles. One mile is 1.609344 km.'],
      convFaqCommon,
    ],
  },
  {
    file: 'sqm-to-sqft.html', cat: 'units', icon: 'area', conv: { cat: 'area', from: 'm2', to: 'ft2', table: [1, 5, 10, 20, 25, 30, 40, 50, 60, 70, 75, 80, 90, 100, 120, 150, 200, 250, 300, 400, 500, 750, 1000], table2: [10, 50, 100, 200, 300, 500, 750, 1000, 1200, 1500, 2000, 2500, 3000, 5000, 10000] },
    title: 'Square Meters to Square Feet: m² to ft² Converter, with Table | File Manager Toolkit',
    desc: 'Convert square metres to square feet (sqm to sqft) and back, for flats, villas, plots and floor plans. 1 m² = 10.7639 ft². Ready table. Free.',
    h1: 'Square Meters to Square Feet', sub: 'm² to ft² and back. 1 m² = 10.7639 ft².',
    faq: [
      ['How many square feet are in a square metre?', 'One square metre is 10.7639 square feet. To change ft² to m², multiply by 0.092903.'],
      ['Why do property listings use square feet?', 'In the UAE, the USA and the UK flats are usually sold by the square foot. Type the size here to see it in square metres.'],
      convFaqCommon,
    ],
  },
  {
    file: 'feddan-to-sqm.html', cat: 'units', icon: 'area', conv: { cat: 'area', from: 'feddan', to: 'm2', table: [0.25, 0.5, 1, 2, 3, 4, 5, 10, 20, 50, 100] },
    title: 'Feddan to Square Meters: Feddan, Qirat, Dunam, Acre Converter | File Manager Toolkit',
    desc: 'How many square metres in a feddan? 1 feddan = 4,200.83 m² = 24 qirat. Convert feddan, qirat, dunam, acre and hectare to square metres and back. Free.',
    h1: 'Feddan to Square Meters', sub: '1 feddan = 4,200.83 m² = 24 qirat. Dunam, acre and hectare too.',
    faq: [
      ['How many square metres is one feddan?', 'One feddan is 4,200.83 square metres, the same as 24 qirat. One qirat is about 175 m².'],
      ['What is a dunam?', 'A dunam is 1,000 square metres in most countries that use it today.'],
      convFaqCommon,
    ],
  },
  {
    file: 'celsius-to-fahrenheit.html', cat: 'units', icon: 'temp', conv: { cat: 'temp', from: 'c', to: 'f', table: [-40, -30, -20, -10, -5, 0, 5, 10, 15, 20, 25, 30, 35, 36.6, 37, 38, 39, 40, 45, 50, 60, 70, 80, 90, 100, 180, 200], table2: [0, 32, 50, 68, 77, 86, 95, 98.6, 100, 104, 212, 350, 400] },
    title: 'Celsius to Fahrenheit Converter: °C to °F, with Formula and Table | File Manager Toolkit',
    desc: 'Convert Celsius to Fahrenheit (°C to °F) and Fahrenheit to Celsius instantly. Formula: °F = °C × 9/5 + 32. Ready table for weather, body and oven temperatures. Free.',
    h1: 'Celsius to Fahrenheit', sub: '°C to °F and back. °F = °C × 9/5 + 32.',
    faq: [
      ['What is the formula?', 'Fahrenheit = Celsius × 9 ÷ 5 + 32. Celsius = (Fahrenheit − 32) × 5 ÷ 9.'],
      ['What is normal body temperature in Fahrenheit?', 'About 37 °C, which is 98.6 °F.'],
      convFaqCommon,
    ],
  },
  {
    file: 'liters-to-gallons.html', cat: 'units', icon: 'volume', conv: { cat: 'volume', from: 'l', to: 'galus', table: [1, 2, 3, 4, 5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 100, 200, 500, 1000] },
    title: 'Liters to Gallons Converter: L to US and UK Gallons | File Manager Toolkit',
    desc: 'Convert litres to gallons (US or UK) and gallons to litres instantly. 1 US gallon = 3.78541 L, 1 UK gallon = 4.54609 L. Ready table. Free.',
    h1: 'Liters to Gallons', sub: 'Litres to US or UK gallons and back.',
    faq: [
      ['Is a US gallon the same as a UK gallon?', 'No. A US gallon is 3.785 litres and a UK (imperial) gallon is 4.546 litres. Pick the one you need from the list.'],
      convFaqCommon,
    ],
  },
  {
    file: 'hijri-converter.html', script: 'hijri.js', cat: 'units', icon: 'hijri',
    title: 'Hijri Date Converter: Hijri to Gregorian and Back, Today’s Hijri Date | File Manager Toolkit',
    desc: 'Convert Hijri dates to Gregorian and Gregorian to Hijri with the Umm al-Qura calendar. See today’s Hijri date and the day of the week. Free.',
    h1: 'Hijri Date Converter', sub: 'Hijri to Gregorian and back, with today’s date in both calendars.',
    body: hijriBody(),
    howto: ['<b>Today’s date</b> is shown at the top in both calendars.', '<b>Pick a Gregorian date</b> to see it in Hijri, or type a Hijri day, month and year to see it in Gregorian.', '<b>Choose the calendar</b>: Umm al-Qura, used in Saudi Arabia, or the standard civil one.'],
    faq: [
      ['Why can my country’s date differ by one day?', 'The Hijri month starts when the new moon is seen, and some countries announce it a day earlier or later than the Umm al-Qura calendar.'],
      ['Which years does it cover?', 'Hijri years 1300 to 1600 (about 1882 to 2174) with Umm al-Qura.'],
      ['Is it free?', 'Yes, free and without sign-up. It works in your browser.'],
    ],
  },
  {
    file: 'percentage-calculator.html', script: 'calc.js', cat: 'calc', icon: 'percent',
    title: 'Percentage Calculator: X% of Y, Increase, Decrease, Discount | File Manager Toolkit',
    desc: 'Work out X% of Y, what percent one number is of another, percentage increase or decrease and the price after a discount. Answers as you type. Free.',
    h1: 'Percentage Calculator', sub: 'X% of Y, what percent, increase, decrease and discounts. Answers as you type.',
    body: percentBody(),
    howto: ['<b>Pick the question</b> that matches yours: X% of Y, what percent, change, increase, decrease or discount.', '<b>Type your numbers</b>. The answer shows straight away.', '<b>Click the answer</b> to copy it.'],
    faq: [
      ['How do I work out a percentage of a number?', 'Multiply the number by the percentage and divide by 100. 15% of 200 = 200 × 15 ÷ 100 = 30.'],
      ['How is percentage change worked out?', '(New − Old) ÷ Old × 100. From 80 to 100 is (100 − 80) ÷ 80 × 100 = 25% up.'],
      ['How do I work out a discount?', 'Price × (1 − discount ÷ 100). 250 with 20% off is 250 × 0.8 = 200, so you save 50.'],
    ],
  },
  {
    file: 'vat-calculator.html', script: 'calc.js', cat: 'calc', icon: 'vat',
    title: 'VAT Calculator: Add or Remove VAT, 5%, 14%, 15% | File Manager Toolkit',
    desc: 'Add VAT to a price or take VAT out of a total. UAE and Oman 5%, Bahrain 10%, Egypt 14%, Saudi Arabia 15%, or any rate. Free, instant.',
    h1: 'VAT Calculator', sub: 'Add VAT to a price or take it out of a total. Any rate.',
    body: vatBody(),
    howto: ['<b>Choose</b> Add VAT, or Remove VAT if your price already includes it.', '<b>Type the amount</b> and pick the rate: 5%, 14%, 15% or your own.', '<b>Read</b> the amount without VAT, the VAT and the total. Click a number to copy it.'],
    faq: [
      ['How do I add VAT to a price?', 'Multiply by 1 + rate ÷ 100. With 5% VAT, 1,000 becomes 1,000 × 1.05 = 1,050.'],
      ['How do I take VAT out of a price that includes it?', 'Divide by 1 + rate ÷ 100. A total of 1,050 with 5% VAT is 1,050 ÷ 1.05 = 1,000 before VAT, so the VAT is 50.'],
      ['What are the VAT rates in the Arab countries?', 'UAE and Oman 5%, Bahrain 10%, Egypt 14%, Saudi Arabia 15%, Jordan 16% (sales tax). Kuwait and Qatar have no VAT yet. Check with your tax office for special rates.'],
    ],
  },
  {
    file: 'invoice-generator.html', script: 'invoice.js', extraScripts: ['words.js'], cat: 'generate', icon: 'invoice',
    title: 'Free Invoice Generator: Arabic and English, VAT, Total in Words | File Manager Toolkit',
    desc: 'Make a clean invoice or tax invoice in English, Arabic or both, with VAT, discount, your logo and the total in words (tafqeet). Save it as PDF. Free, no sign-up, nothing uploaded.',
    h1: 'Invoice Generator', sub: 'A clean invoice with VAT and the total in words, in Arabic or English. Save it as PDF.',
    body: invoiceBody(),
    howto: ['<b>Fill in your business and your customer</b>. Your own details are remembered for next time.', '<b>Add the items</b>, the discount and the VAT rate. Totals and the amount in words update as you type.', '<b>Download PDF</b> and choose Save as PDF in the print window. New invoice moves to the next number.'],
    faq: [
      ['Is it a tax invoice?', 'When the VAT rate is above 0 the title becomes "Tax invoice" with your tax number. It is not connected to e-invoicing systems like ZATCA in Saudi Arabia or the ETA in Egypt, so use it where a printed or PDF invoice is accepted.'],
      ['Can it write the total in Arabic words?', 'Yes. The total is written in words (tafqeet) in Arabic, English or both, with the currency, for example "فقط ألف وخمسون درهماً إماراتياً لا غير".'],
      ['Are my invoices uploaded?', 'No. Everything stays in your browser. Your business details are kept on this device so you do not type them again.'],
    ],
  },
  {
    file: 'password-generator.html', script: 'password.js', cat: 'generate', icon: 'password',
    title: 'Password Generator: Strong Random Passwords, Free | File Manager Toolkit',
    desc: 'Make strong random passwords with letters, numbers and symbols, any length up to 64. Made in your browser with secure randomness: nothing is sent or saved. Free.',
    h1: 'Password Generator', sub: 'Strong random passwords, made in your browser. Nothing is sent or saved.',
    body: passwordBody(),
    howto: ['<b>Pick the length</b>: 16 or more is a good choice.', '<b>Choose the characters</b>: upper and lower case, numbers and symbols.', '<b>Copy</b> the password, or click one from the list below. Press ↻ for a new one.'],
    faq: [
      ['Is it safe to make a password here?', 'Yes. The password is made in your browser with crypto.getRandomValues, the secure random generator built into it. It is never sent anywhere or saved.'],
      ['How long should a password be?', 'At least 12 characters, and 16 or more for email and banking. Length matters more than symbols.'],
      ['How do I remember it?', 'Use a password manager, like the one built into your browser or phone. Use a different password for every site.'],
    ],
  },
  {
    file: 'qr-code.html', script: 'qr.js', cat: 'generate', icon: 'qr',
    title: 'Free QR Code Generator: Links, Wi-Fi, WhatsApp, No Expiry | File Manager Toolkit',
    desc: 'Make QR codes for links, text, Wi-Fi, WhatsApp, phone, email and contact cards. Add your colours and logo, download PNG or SVG. Free forever, no sign-up, they never expire.',
    h1: 'QR Code Generator', sub: 'Links, Wi-Fi, WhatsApp and contacts. Free forever: these QR codes never expire.',
    body: qrBody(),
    howto: ['<b>Pick what the QR code opens</b>: a link, Wi-Fi, WhatsApp, a phone number, an email or a contact card.', '<b>Fill in the details</b>. Change the colours or add your logo if you like.', '<b>Download</b> the PNG for screens or the SVG for printing at any size.'],
    faq: [
      ['Do these QR codes expire?', 'Never. The QR code holds your link or text itself. Some sites make "dynamic" QR codes that go through their server and stop working when you stop paying. These don’t.'],
      ['Can I add my logo?', 'Yes. Choose a logo and it is placed in the middle. Error correction is set to High so the code still scans.'],
      ['How does the Wi-Fi QR code work?', 'Guests point their phone camera at it and join your network without typing the password.'],
    ],
  },
];

// ------------------------------------------------------------------ template
function page(p) {
  const conv = p.conv;
  const body = conv ? convBody(conv) : p.body;
  const howto = p.howto || convHow;
  const scripts = conv ? ['units-data.js', 'units.js', ...(p.extraScripts || [])] : [...(p.extraScripts || []), p.script];
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

  <main class="kit util cat-${p.cat}">
    <div class="tool-head">
      <div>
        <div class="crumb"><a href="./">All tools</a> / <a href="./#${p.cat}">${catName(p.cat)}</a></div>
        <div class="tool-title">
          <span class="tool-icon cat-${p.cat}">${icon(p.icon)}</span>
          <div><h1>${p.h1}</h1><p>${p.sub}</p></div>
        </div>
      </div>
    </div>

    ${body}
    ${conv ? convTable(conv) : ''}

    <section class="kit-about">
      <div>
        <h2>How to use ${p.h1}</h2>
        <ol>${howto.map((h) => `<li>${h}</li>`).join('')}</ol>
      </div>
      <div>
        <h2>Questions</h2>
        ${p.faq.map(([q, a]) => `<details><summary>${q}</summary><p>${a}</p></details>`).join('\n        ')}
      </div>
    </section>
  </main>

  <footer class="site-footer"></footer>

  <script src="assets/common.js"></script>
${scripts.map((s) => `  <script src="assets/${s}"></script>`).join('\n')}
</body>
</html>
`;
}

const only = process.argv.slice(2);
for (const p of PAGES) {
  if (only.length && !only.includes(p.file)) continue;
  fs.writeFileSync(p.file, page(p));
}
console.log(`util-pages: wrote ${only.length || PAGES.length} page(s)`);
export { PAGES };
