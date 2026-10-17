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
| Edit PDF Text | Find & replace text inside an area across many PDFs, keeping font, size and angle |

PDF work uses [MuPDF.js](https://mupdf.com/) (AGPL) and OCR uses [Tesseract.js](https://tesseract.projectnaptha.com/).

## Languages

English and Arabic (right-to-left). The switch is in the header; `assets/i18n.js` holds the translations.

## Browser support

- **Chrome / Edge (desktop):** renames and deletes files directly in the chosen folder (File System Access API).
- **Firefox / Safari:** preview, export to Excel, and download renamed copies as a ZIP.

## Run locally

```bash
python -m http.server 8765
```

Then open http://localhost:8765.

## Hosting

Static site, published with GitHub Pages from the `main` branch root.
