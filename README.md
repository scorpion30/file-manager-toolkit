# File Manager Toolkit

Free online file tools that run entirely in the browser. Files are never uploaded.

## Tools

| Tool | What it does |
|---|---|
| Rename Files | Prefix/suffix, find & replace, manual edit, delete, undo, export to Excel |
| Files to Excel | List every file in a folder tree; sheets per folder or per type, summary counts |
| Organize Files | Move/copy files into folders by type or keyword, with a log file |
| Merge PDF | Combine PDFs in a chosen order |
| Split PDF | Page ranges (1-3,5,8-10), every page, or picked pages into one file |
| PDF to Excel | Draw areas, read their text from many PDFs (OCR for scanned, English/Arabic), export or insert into an existing workbook |
| Rename from Title Block | Read the drawing number/title from each PDF and rename the file after it (OCR for scans), with undo |
| Comment Sheet | Read review comments (PDF annotations) into an Excel comment response sheet: sheet no., comment, author, date, snapshot of the spot |
| Pre-flight Check | Before an issue: duplicate drawing numbers, file name vs title block, missing drawings and revision mismatches against the Excel drawing list |
| Edit PDF Text | Find & replace text inside an area across many PDFs, keeping font, size and angle |

PDF work uses [MuPDF.js](https://mupdf.com/) (AGPL) and OCR uses [Tesseract.js](https://tesseract.projectnaptha.com/).

## Languages

English and Arabic (right-to-left). The switch is in the header; `assets/i18n.js` holds the translations.

Each page also exists in Arabic under `ar/`, generated from the English page so search engines see Arabic text. After editing any page (or adding words to `assets/i18n.js`), rebuild:

```bash
node tools/build.mjs
```

It rewrites `ar/*.html`, the SEO block in each English page (canonical, hreflang, Open Graph), `sitemap.xml` and `robots.txt`, and lists any text that has no Arabic yet. `node tools/build.mjs --og` also redraws the share images in `assets/og/` (needs Chrome or Edge). Never edit `ar/` by hand. A new page must be added to `PAGES` in `tools/build.mjs`.

## Guides

`guides/*.html` are how-to pages written for what people search (one per tool), linked from the footer, the home FAQ and each tool page. Their Arabic text lives in `tools/guides-ar.mjs` (used only by the build, so it is not downloaded on every page); the build also adds HowTo and FAQPage JSON-LD from each page's steps and FAQ, and swaps `assets/guides/*-en.webp` screenshots for the `-ar` ones. `node tools/build.mjs --og-new` draws share images only for pages that have none yet.

## Feedback and usage sheet

`assets/backend.js` adds the Feedback button on every page and logs one anonymous row per visit (page, seconds, button ids, referrer). Both go to a Google Sheet through the Apps Script web app in `tools/backend/` (deployed with `clasp`; `.clasp.json` is kept out of git). In the sheet: Dashboard = summary, Feedback = messages, Usage = visits. To answer someone, type in "Your reply": it is e-mailed within 5 minutes (or right away with the menu Feedback > Send replies). Messages without an e-mail get a note and cannot be answered.

## Visitor counter

`assets/analytics.js` loads Google Analytics 4 once `GA_ID` is set in it. It counts page views, donate clicks and main tool buttons, and is off on localhost.

## Browser support

- **Chrome / Edge (desktop):** renames and deletes files directly in the chosen folder (File System Access API).
- **Firefox / Safari:** preview, export to Excel, and download renamed copies as a ZIP.

## Run locally

```bash
python -m http.server 8765
```

Then open http://localhost:8765.

## Hosting

Static site, published with GitHub Pages from the `main` branch root at https://filemanagertoolkit.com (the `CNAME` file sets the domain; DNS is at Porkbun).
