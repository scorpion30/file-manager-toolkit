# File Manager Toolkit

Free online file tools that run entirely in the browser. Files are never uploaded.

## Tools

| Tool | Status |
|---|---|
| Rename Files: prefix/suffix, find & replace, manual edit, delete, undo, export to Excel | ✅ Ready |
| Organize Files | Coming soon |
| Merge PDF / Split PDF | Coming soon |
| PDF to Excel (OCR, Arabic & English) | Coming soon |
| Edit PDF Text | Coming soon |

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
