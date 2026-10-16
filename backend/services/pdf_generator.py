from __future__ import annotations

import io
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.utils import ImageReader
from reportlab.platypus import (HRFlowable, Image, Paragraph, SimpleDocTemplate,
                                Spacer, Table, TableStyle)

from services.fonts import pdf_font, register_fonts
from templates import build_layout

SCALES = (1.0, 0.93, 0.86, 0.79, 0.72, 0.65, 0.58)
ALIGN = {"left": TA_LEFT, "center": TA_CENTER, "right": TA_RIGHT}
HALIGN = {"left": "LEFT", "center": "CENTER", "right": "RIGHT"}


def _para(text, family, size, *, bold=False, italic=False, align="left", color="#111827", scale=1.0):
    st = ParagraphStyle("x", fontName=pdf_font(family, bold, italic), fontSize=size * scale,
                        leading=size * scale * 1.28, alignment=ALIGN[align],
                        textColor=colors.HexColor(color), splitLongWords=1)
    return Paragraph(escape(text).replace("\n", "<br/>"), st)


def _flowables(spec, blocks, data, scale, frame_w):
    fam, accent = spec["font"], spec["accent"]
    logo = data["institution"]["logo"]
    logo_size = data["institution"]["logo_size"]
    out = []
    for b in blocks:
        t = b["t"]
        if t == "spacer":
            out.append(Spacer(1, b["h"] * scale))
        elif t == "text":
            text = b["text"].upper() if b["caps"] else b["text"]
            if b["before"]:
                out.append(Spacer(1, b["before"] * scale))
            out.append(_para(text, fam, b["size"], bold=b["bold"], italic=b["italic"],
                             align=b["align"], color=b["color"], scale=scale))
            if b["after"]:
                out.append(Spacer(1, b["after"] * scale))
        elif t == "rule":
            if b["before"]:
                out.append(Spacer(1, b["before"] * scale))
            out.append(HRFlowable(width=f"{b['width'] * 100:.0f}%", thickness=b["thickness"] * scale,
                                  color=colors.HexColor(b["color"]), hAlign=HALIGN[b["align"]],
                                  spaceBefore=0, spaceAfter=0))
            if b["after"]:
                out.append(Spacer(1, b["after"] * scale))
        elif t == "logo" and logo:
            ratio = logo_size[0] / logo_size[1]
            h = b["max_h"] * scale
            w = h * ratio
            if w > frame_w * 0.5:
                w, h = frame_w * 0.5, frame_w * 0.5 / ratio
            img = Image(io.BytesIO(logo), width=w, height=h)
            img.hAlign = HALIGN[b["align"]]
            out.append(img)
            out.append(Spacer(1, b["after"] * scale))
        elif t == "columns":
            size = b["size"]
            gap = 24
            cw = (frame_w - gap) / 2
            heads, bodies = [], []
            for c in b["cols"]:
                heads.append(_para(c["heading"].upper(), fam, size - 1.5, bold=True, color=accent, scale=scale))
                bodies.append([_para(x, fam, size, bold=bd, scale=scale) for x, bd in c["lines"]])
            tbl = Table([[heads[0], "", heads[1]], [bodies[0], "", bodies[1]]],
                        colWidths=[cw, gap, cw], hAlign="LEFT")
            tbl.setStyle(TableStyle([
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 0), ("BOTTOMPADDING", (0, 0), (-1, 0), 4 * scale),
                ("TOPPADDING", (0, 1), (-1, 1), 5 * scale),
                ("LINEBELOW", (0, 0), (0, 0), 0.8, colors.HexColor(accent)),
                ("LINEBELOW", (2, 0), (2, 0), 0.8, colors.HexColor(accent)),
            ]))
            out.append(tbl)
        elif t == "members":
            size = b["size"]
            has_role = any(m["role"] for m in b["members"])
            head = ["#", "Name", "Student ID"] + (["Role"] if has_role else [])
            rows = [[_para(h, fam, size - 1, bold=True, color=accent, scale=scale) for h in head]]
            for i, m in enumerate(b["members"], 1):
                cells = [str(i), m["name"], m["student_id"]] + ([m["role"]] if has_role else [])
                rows.append([_para(c, fam, size, scale=scale) for c in cells])
            widths = [0.07, 0.43, 0.25, 0.25] if has_role else [0.08, 0.55, 0.37]
            tbl = Table(rows, colWidths=[w * frame_w for w in widths], hAlign="LEFT", repeatRows=1)
            tbl.setStyle(TableStyle([
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LINEBELOW", (0, 0), (-1, 0), 1, colors.HexColor(accent)),
                ("LINEBELOW", (0, 1), (-1, -1), 0.4, colors.HexColor("#D1D5DB")),
                ("TOPPADDING", (0, 0), (-1, -1), 3.5 * scale), ("BOTTOMPADDING", (0, 0), (-1, -1), 3.5 * scale),
                ("LEFTPADDING", (0, 0), (-1, -1), 4), ("RIGHTPADDING", (0, 0), (-1, -1), 4),
            ]))
            out.append(tbl)
        elif t == "kv":
            size = b["size"]
            rows = [[_para(k.upper(), fam, size - 2, bold=True, color=accent, scale=scale),
                     _para(v, fam, size, scale=scale)] for k, v in b["rows"]]
            tbl = Table(rows, colWidths=[0.28 * frame_w, 0.72 * frame_w], hAlign="LEFT")
            tbl.setStyle(TableStyle([
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LINEBELOW", (0, 0), (-1, -1), 0.4, colors.HexColor("#E5E7EB")),
                ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 4),
                ("TOPPADDING", (0, 0), (-1, -1), 5 * scale), ("BOTTOMPADDING", (0, 0), (-1, -1), 5 * scale),
            ]))
            out.append(tbl)
    return out


def _build(data, scale):
    register_fonts()
    spec, blocks = build_layout(data)
    margin = 72 if spec["border"] != "none" else 57
    frame_w = A4[0] - 2 * margin
    pages = []

    def decorate(canvas, doc):
        pages.append(1)
        canvas.saveState()
        acc = colors.HexColor(spec["accent"])
        w, h = A4
        if spec["border"] == "thin":
            canvas.setStrokeColor(acc); canvas.setLineWidth(1)
            canvas.rect(30, 30, w - 60, h - 60)
        elif spec["border"] == "double":
            canvas.setStrokeColor(acc); canvas.setLineWidth(2.4)
            canvas.rect(26, 26, w - 52, h - 52)
            canvas.setLineWidth(0.7)
            canvas.rect(32, 32, w - 64, h - 64)
        if spec["footer"]:
            canvas.setFont(pdf_font(spec["font"], False, False), 9)
            canvas.setFillColor(colors.HexColor("#6B7280"))
            canvas.drawCentredString(w / 2, 42, spec["footer"])
        canvas.restoreState()

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, leftMargin=margin, rightMargin=margin,
                            topMargin=margin, bottomMargin=margin + (8 if spec["footer"] else 0),
                            title=spec["title"], author="", creator="CoverCraft")
    doc.build(_flowables(spec, blocks, data, scale, frame_w), onFirstPage=decorate, onLaterPages=decorate)
    return buf.getvalue(), len(pages)


def render_pdf(data):
    """Return (pdf_bytes, scale_used, page_count). Shrinks content until it fits one A4 page."""
    result = None
    for s in SCALES:
        pdf, pages = _build(data, s)
        result = (pdf, s, pages)
        if pages == 1:
            break
    return result


def generate_pdf(data):
    return render_pdf(data)[0]
