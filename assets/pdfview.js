/* PDF page viewer with zoom, pan and rectangle drawing. Rectangles are stored as
 * fractions (0-1) of the page so they apply to every PDF with the same layout,
 * exactly like the desktop app's percent-based areas. */
(() => {
  'use strict';
  const MAX_PIXELS = 36e6;

  class PdfView {
    constructor(container, { onRectsChange = () => {}, maxRects = Infinity, dragDraws = false, newLabel = (i) => `Rectangle ${i + 1}` } = {}) {
      this.el = container;
      this.onRectsChange = onRectsChange;
      this.maxRects = maxRects;
      this.dragDraws = dragDraws; // plain drag on the page draws an area (shift-drag pans)
      this.newLabel = newLabel;
      this.rects = [];          // {x1,y1,x2,y2,label}
      this.page = null;
      this.zoom = 1;
      this.drawing = null;      // index being drawn/redrawn, or 'new'
      this.renderTimer = null;

      container.classList.add('pdfview');
      container.innerHTML = `
        <div class="pv-bar">
          <button class="icon-btn" data-z="out" title="Zoom out">−</button>
          <span class="pv-zoom">100%</span>
          <button class="icon-btn" data-z="in" title="Zoom in">+</button>
          <button class="btn ghost" data-z="fit">Fit</button>
          <span class="pv-hint"></span>
          <span class="pv-tip">${dragDraws ? 'Drag on the drawing to mark an area · Mouse wheel to zoom · Shift + drag to move' : ''}</span>
        </div>
        <div class="pv-scroll"><div class="pv-stage"><canvas></canvas><div class="pv-layer"></div></div>
          <div class="pv-empty">Add a PDF to see it here</div></div>`;
      this.scroll = container.querySelector('.pv-scroll');
      this.stage = container.querySelector('.pv-stage');
      this.canvas = container.querySelector('canvas');
      this.layer = container.querySelector('.pv-layer');
      this.hint = container.querySelector('.pv-hint');
      this.stage.hidden = true;
      if (dragDraws) this.stage.classList.add('drawing');

      container.querySelector('.pv-bar').addEventListener('click', (e) => {
        const z = e.target.dataset.z;
        if (z === 'in') this.setZoom(this.zoom * 1.25);
        if (z === 'out') this.setZoom(this.zoom / 1.25);
        if (z === 'fit') this.setZoom(1);
      });
      this.scroll.addEventListener('wheel', (e) => {
        if (!this.page) return;
        e.preventDefault();
        const r = this.scroll.getBoundingClientRect();
        this.setZoom(this.zoom * (e.deltaY < 0 ? 1.15 : 1 / 1.15), e.clientX - r.left, e.clientY - r.top);
      }, { passive: false });
      this.stage.addEventListener('pointerdown', (e) => this.onDown(e));
      window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && this.drawing !== null) this.cancelDraw(); });
      new ResizeObserver(() => this.layout()).observe(this.scroll);
    }

    /** page: a MuPDF Page. */
    setPage(page) {
      this.page = page;
      const [x0, y0, x1, y1] = page.getBounds();
      this.pageW = x1 - x0;
      this.pageH = y1 - y0;
      this.el.querySelector('.pv-empty').hidden = true;
      this.stage.hidden = false;
      this.zoom = 1;
      this.layout();
    }

    clear() {
      this.page = null;
      this.stage.hidden = true;
      this.el.querySelector('.pv-empty').hidden = false;
    }

    /** Width at 100%: the whole page fits in the view, so the title block is visible straight away. */
    baseWidth() {
      const byWidth = this.scroll.clientWidth - 24;
      const byHeight = (this.scroll.clientHeight - 24) * (this.pageW / this.pageH);
      return Math.max(200, Math.min(byWidth, byHeight > 100 ? byHeight : byWidth));
    }

    layout() {
      if (!this.page) return;
      const w = this.baseWidth() * this.zoom;
      const h = w * (this.pageH / this.pageW);
      this.stage.style.width = w + 'px';
      this.stage.style.height = h + 'px';
      this.el.querySelector('.pv-zoom').textContent = Math.round(this.zoom * 100) + '%';
      this.drawRects();
      clearTimeout(this.renderTimer);
      this.renderTimer = setTimeout(() => this.render(), 120);
    }

    setZoom(z, cx, cy) {
      z = Math.min(20, Math.max(1, z));
      const ratio = z / this.zoom;
      if (cx === undefined) { cx = this.scroll.clientWidth / 2; cy = this.scroll.clientHeight / 2; }
      const sx = (this.scroll.scrollLeft + cx) * ratio - cx;
      const sy = (this.scroll.scrollTop + cy) * ratio - cy;
      this.zoom = z;
      this.layout();
      this.scroll.scrollLeft = sx;
      this.scroll.scrollTop = sy;
    }

    async render() {
      if (!this.page) return;
      const m = await FM.mupdf();
      const dpr = window.devicePixelRatio || 1;
      let w = this.stage.clientWidth * dpr;
      let scale = w / this.pageW;
      if (w * w * (this.pageH / this.pageW) > MAX_PIXELS) {
        scale = Math.sqrt(MAX_PIXELS / (this.pageW * this.pageH));
      }
      const pix = this.page.toPixmap(m.Matrix.scale(scale, scale), m.ColorSpace.DeviceRGB, false);
      const pw = pix.getWidth();
      const ph = pix.getHeight();
      const src = pix.getPixels();
      const img = new ImageData(pw, ph);
      for (let i = 0, j = 0; i < src.length; i += 3, j += 4) {
        img.data[j] = src[i];
        img.data[j + 1] = src[i + 1];
        img.data[j + 2] = src[i + 2];
        img.data[j + 3] = 255;
      }
      this.canvas.width = pw;
      this.canvas.height = ph;
      this.canvas.getContext('2d').putImageData(img, 0, 0);
      pix.destroy?.();
    }

    // ---------- rectangles ----------
    setRects(rects) {
      this.rects = rects;
      this.drawRects();
    }

    drawRects() {
      this.layer.innerHTML = this.rects.map((r, i) => `<div class="pv-rect${this.drawing === i ? ' active' : ''}"
        style="left:${r.x1 * 100}%;top:${r.y1 * 100}%;width:${(r.x2 - r.x1) * 100}%;height:${(r.y2 - r.y1) * 100}%">
        <span>${i + 1}</span></div>`).join('');
    }

    /** Start drawing: index = existing rect to redraw, or undefined for a new one. */
    startDraw(index) {
      if (!this.page) { FM.toast('Add a PDF first.'); return; }
      if (index === undefined && this.rects.length >= this.maxRects) {
        index = this.rects.length - 1;
      }
      this.drawing = index === undefined ? 'new' : index;
      this.stage.classList.add('drawing');
      this.hint.textContent = 'Drag on the page to draw the area. Esc to cancel.';
      this.drawRects();
    }

    cancelDraw() {
      this.drawing = null;
      if (!this.dragDraws) this.stage.classList.remove('drawing');
      this.hint.textContent = '';
      this.drawRects();
    }

    onDown(e) {
      if (!this.page) return;
      const box = this.stage.getBoundingClientRect();
      const fx = (cx) => Math.min(1, Math.max(0, (cx - box.left) / box.width));
      const fy = (cy) => Math.min(1, Math.max(0, (cy - box.top) / box.height));

      if (this.drawing === null && this.dragDraws && e.button === 0 && !e.shiftKey) {
        this.drawing = this.rects.length >= this.maxRects ? this.rects.length - 1 : 'new';
      }
      if (this.drawing === null) {
        // Pan with the mouse.
        const sx = e.clientX, sy = e.clientY, sl = this.scroll.scrollLeft, st = this.scroll.scrollTop;
        const move = (ev) => { this.scroll.scrollLeft = sl - (ev.clientX - sx); this.scroll.scrollTop = st - (ev.clientY - sy); };
        const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up);
        return;
      }

      e.preventDefault();
      const x0 = fx(e.clientX), y0 = fy(e.clientY);
      const ghost = document.createElement('div');
      ghost.className = 'pv-rect active';
      this.layer.appendChild(ghost);
      let x1 = x0, y1 = y0;
      const place = () => {
        ghost.style.left = Math.min(x0, x1) * 100 + '%';
        ghost.style.top = Math.min(y0, y1) * 100 + '%';
        ghost.style.width = Math.abs(x1 - x0) * 100 + '%';
        ghost.style.height = Math.abs(y1 - y0) * 100 + '%';
      };
      const move = (ev) => { x1 = fx(ev.clientX); y1 = fy(ev.clientY); place(); };
      const up = () => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        ghost.remove();
        if (Math.abs(x1 - x0) < 0.002 || Math.abs(y1 - y0) < 0.002) return; // a click, keep waiting
        const rect = { x1: Math.min(x0, x1), y1: Math.min(y0, y1), x2: Math.max(x0, x1), y2: Math.max(y0, y1) };
        if (this.drawing === 'new') {
          rect.label = this.newLabel(this.rects.length);
          this.rects.push(rect);
        } else {
          rect.label = this.rects[this.drawing].label;
          this.rects[this.drawing] = rect;
        }
        this.cancelDraw();
        this.onRectsChange(this.rects);
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
    }
  }

  /** Converts a fraction rect to page coordinates for a MuPDF page. */
  PdfView.toPageRect = (page, r) => {
    const [x0, y0, x1, y1] = page.getBounds();
    const w = x1 - x0, h = y1 - y0;
    return [x0 + r.x1 * w, y0 + r.y1 * h, x0 + r.x2 * w, y0 + r.y2 * h];
  };

  /**
   * Every character on a page with its box, line number, font and size, read
   * character by character so CAD/Revit exports with odd spacing still match.
   */
  PdfView.pageChars = (page) => {
    const chars = [];
    let line = -1;
    let dir = [1, 0];
    page.toStructuredText('preserve-whitespace').walk({
      beginLine(bbox, wmode, direction) { line++; dir = direction; },
      onChar(c, origin, font, size, q, color) {
        const xs = [q[0], q[2], q[4], q[6]];
        const ys = [q[1], q[3], q[5], q[7]];
        chars.push({
          c, line, dir, size, origin, color,
          font: font.getName(), bold: font.isBold(), italic: font.isItalic(), serif: font.isSerif(), mono: font.isMono(),
          x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys),
          cx: (q[0] + q[2] + q[4] + q[6]) / 4, cy: (q[1] + q[3] + q[5] + q[7]) / 4,
        });
      },
    });
    return chars;
  };

  /**
   * Characters whose centres fall inside rect, grouped into lines by where they sit
   * on the page (not by their order inside the file), each line ordered along its
   * reading direction. Text added later (e.g. by an edit) lands in its visual place.
   */
  PdfView.linesInRect = (chars, [x0, y0, x1, y1]) => {
    const groups = [];
    for (const ch of chars) {
      if (ch.cx < x0 || ch.cx > x1 || ch.cy < y0 || ch.cy > y1) continue;
      const len = Math.hypot(ch.dir[0], ch.dir[1]) || 1;
      const ux = ch.dir[0] / len, uy = ch.dir[1] / len;
      const base = ch.origin[0] * -uy + ch.origin[1] * ux; // distance across the text direction
      const size = ch.size || 10;
      let g = groups.find((gr) => Math.abs(gr.ux - ux) < 0.2 && Math.abs(gr.uy - uy) < 0.2 &&
        Math.abs(gr.base - base) < Math.max(gr.size, size) * 0.5);
      if (!g) { g = { ux, uy, base, size, items: [] }; groups.push(g); }
      ch.along = ch.cx * ux + ch.cy * uy;
      ch.width = Math.abs(ch.x1 - ch.x0) * Math.abs(ux) + Math.abs(ch.y1 - ch.y0) * Math.abs(uy);
      g.items.push(ch);
    }
    groups.sort((a, b) => a.base - b.base);
    return groups.map((g) => {
      // CAD/Revit exports often draw the same text twice on top of itself (to look
      // bolder, or as two layers). A letter sitting on an identical letter counts once.
      const out = [];
      for (const ch of g.items.sort((a, b) => a.along - b.along)) {
        const dup = out.slice(-4).some((o) => o.c === ch.c &&
          Math.abs(o.along - ch.along) < Math.max(o.width, ch.width, (ch.size || 10) * 0.2) * 0.4);
        if (!dup) out.push(ch);
      }
      return out;
    });
  };

  /** Text inside rect [x0,y0,x1,y1] in reading order; lines joined by a space. */
  PdfView.textInRect = (chars, rect) => PdfView.linesInRect(chars, rect).map((line) => {
    let out = '';
    let prev = null;
    for (const ch of line) {
      // A visible gap with no space character between two letters is a word break.
      if (prev && !/\s/.test(ch.c) && !/\s/.test(prev.c) &&
        (ch.along - ch.width / 2) - (prev.along + prev.width / 2) > (ch.size || 10) * 0.3) out += ' ';
      out += ch.c;
      prev = ch;
    }
    return out.trim();
  }).filter(Boolean).join(' ');

  window.PdfView = PdfView;
})();
