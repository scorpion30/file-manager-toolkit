"""Makes the example drawings in assets/samples/ (made-up A3 sheets with a title block).
Used by "Use example files" on Rename from Title Block and PDF to Excel.
Run from the repo root: python tools/make-samples.py   (needs PyMuPDF)"""
import os
import fitz

OUT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'samples')
W, H = 1190, 842  # A3 landscape, points
SHEETS = [
    ('A-101', 'GROUND FLOOR PLAN', '02'), ('A-102', 'FIRST FLOOR PLAN', '02'),
    ('A-103', 'TYPICAL FLOOR PLAN', '01'), ('A-104', 'ROOF PLAN', '03'),
    ('A-201', 'SECTION A-A', '02'), ('A-202', 'SECTION B-B', '01'),
    ('A-301', 'NORTH ELEVATION', '02'), ('A-302', 'EAST ELEVATION', '04'),
]
# Title block boxes (also used by the tools' "Mark it for me"), as fractions of the page.
TB = fitz.Rect(820, 600, 1170, 822)
NAVY = (0.09, 0.14, 0.24)
GREY = (0.45, 0.48, 0.55)
LINE = (0.55, 0.6, 0.68)


def plan(page, i):
    """A simple made-up drawing so the sheet looks like a drawing."""
    ox, oy = 70, 70
    for k in range(9):  # grid
        x = ox + k * 85
        page.draw_line((x, oy - 20), (x, 560), color=LINE, width=0.4, dashes='[6 3] 0')
        page.insert_text((x - 4, oy - 26), chr(65 + k), fontsize=9, fontname='helv', color=GREY)
    for k in range(6):
        y = oy + k * 95
        page.draw_line((ox - 20, y), (ox + 700, y), color=LINE, width=0.4, dashes='[6 3] 0')
        page.insert_text((ox - 34, y + 3), str(k + 1), fontsize=9, fontname='helv', color=GREY)
    page.draw_rect(fitz.Rect(ox, oy, ox + 680, oy + 475), color=NAVY, width=2.2)
    walls = [(ox + 170, oy, ox + 170, oy + 300), (ox + 340, oy + 95, ox + 340, oy + 475),
             (ox, oy + 190, ox + 340, oy + 190), (ox + 340, oy + 285, ox + 680, oy + 285),
             (ox + 510, oy, ox + 510, oy + 285)]
    for x1, y1, x2, y2 in walls[: 3 + i % 3]:
        page.draw_line((x1, y1), (x2, y2), color=NAVY, width=1.4)
    for k in range(12):  # stair
        page.draw_line((ox + 560, oy + 320 + k * 10), (ox + 640, oy + 320 + k * 10), color=NAVY, width=0.5)


def make(no, title, rev):
    doc = fitz.open()
    page = doc.new_page(width=W, height=H)
    page.draw_rect(fitz.Rect(20, 20, W - 20, H - 20), color=NAVY, width=1.5)
    plan(page, int(no[-1]))
    page.insert_text((70, 600), f'{title}  -  SCALE 1:100', fontsize=13, fontname='hebo', color=NAVY)
    # title block
    page.draw_rect(TB, color=NAVY, width=1.5)
    for y in (650, 700, 760):
        page.draw_line((TB.x0, y), (TB.x1, y), color=NAVY, width=0.8)
    page.draw_line((1000, 760), (1000, TB.y1), color=NAVY, width=0.8)
    page.draw_line((1070, 760), (1070, TB.y1), color=NAVY, width=0.8)
    label = dict(fontsize=7, fontname='helv', color=GREY)
    page.insert_text((828, 614), 'PROJECT', **label)
    page.insert_text((828, 638), 'TOWER A - RESIDENTIAL BUILDING', fontsize=11, fontname='hebo', color=NAVY)
    page.insert_text((828, 664), 'CLIENT', **label)
    page.insert_text((828, 688), 'EXAMPLE DEVELOPMENTS LLC', fontsize=10, fontname='helv', color=NAVY)
    page.insert_text((828, 714), 'DRAWING TITLE', **label)
    page.insert_text((828, 744), title, fontsize=15, fontname='hebo', color=NAVY)
    page.insert_text((828, 774), 'DRAWING NO.', **label)
    page.insert_text((828, 808), no, fontsize=22, fontname='hebo', color=NAVY)
    page.insert_text((1008, 774), 'REV', **label)
    page.insert_text((1012, 808), rev, fontsize=22, fontname='hebo', color=NAVY)
    page.insert_text((1078, 774), 'SCALE / DATE', **label)
    page.insert_text((1078, 794), '1:100', fontsize=10, fontname='helv', color=NAVY)
    page.insert_text((1078, 810), '2026-10-15', fontsize=8, fontname='helv', color=NAVY)
    return doc


os.makedirs(OUT, exist_ok=True)
for n, (no, title, rev) in enumerate(SHEETS, 1):
    make(no, title, rev).save(os.path.join(OUT, f'Sheet_{n:03d}.pdf'), garbage=4, deflate=True)
print('boxes as fractions: no', [round(v, 4) for v in (825 / W, 782 / H, 995 / W, 818 / H)],
      'title', [round(v, 4) for v in (825 / W, 722 / H, 1165 / W, 756 / H)],
      'rev', [round(v, 4) for v in (1003 / W, 782 / H, 1067 / W, 818 / H)])
