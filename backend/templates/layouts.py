"""Template definitions.

Each template turns the normalised document into a *page spec* plus a list of
renderer-independent *blocks*. The PDF (ReportLab) and DOCX (python-docx)
renderers both consume the same blocks, so layouts stay consistent.

Block types:
  text    {text,size,bold,italic,align,color,before,after,caps}
  spacer  {h}
  rule    {color,thickness,width(0-1),align,before,after}
  logo    {max_h,align,after}
  columns {cols:[{heading,lines:[(text,bold)]}], size}
  members {members,heading,size}
  kv      {rows:[(label,value)],size}
"""
from __future__ import annotations

INK = "#111827"
MUTED = "#4B5563"
DENSITY = {"compact": 0.8, "normal": 1.0, "relaxed": 1.25}

TEMPLATES = {
    "classic": {"name": "Classic Academic", "category": "Formal",
                "description": "Centered institution header, traditional serif typography and clear Submitted To / By sections.",
                "font": "Times New Roman", "accent": "#0E4D92", "border": "none"},
    "modern_minimal": {"name": "Modern Minimal", "category": "Minimal",
                "description": "Left-aligned, large title, generous whitespace and a subtle accent.",
                "font": "Arial", "accent": "#0891B2", "border": "none"},
    "corporate": {"name": "Corporate Report", "category": "Professional",
                "description": "Bold accent bar, structured information table and strong typographic hierarchy.",
                "font": "Arial", "accent": "#1E3A8A", "border": "none"},
    "elegant_border": {"name": "Elegant Border", "category": "Formal",
                "description": "Double page border with centered, balanced details.",
                "font": "Times New Roman", "accent": "#7C2D12", "border": "double"},
    "lab_report": {"name": "Technical Lab Report", "category": "Technical",
                "description": "Course code and title emphasised; built for CSE, engineering and science labs.",
                "font": "Arial", "accent": "#0F766E", "border": "none"},
    "research_thesis": {"name": "Research & Thesis", "category": "Research",
                "description": "Formal hierarchy with author and supervisor blocks and room for long titles.",
                "font": "Times New Roman", "accent": "#1F2937", "border": "none"},
}


def template_catalog():
    return [{"id": k, "name": v["name"], "category": v["category"],
             "description": v["description"], "default_font": v["font"],
             "default_accent": v["accent"], "default_border": v["border"]}
            for k, v in TEMPLATES.items()]


# ---------------------------------------------------------------- helpers
def T(text, size, *, bold=False, italic=False, align="left", color=INK,
      before=0, after=0, caps=False):
    if not text:
        return []
    return [{"t": "text", "text": text, "size": size, "bold": bold, "italic": italic,
             "align": align, "color": color, "before": before, "after": after, "caps": caps}]


def SP(h):
    return [{"t": "spacer", "h": h}]


def RULE(color, thickness=1, width=1.0, align="center", before=0, after=0):
    return [{"t": "rule", "color": color, "thickness": thickness, "width": width,
             "align": align, "before": before, "after": after}]


def title_size(title, big, mid, small):
    n = len(title)
    return big if n <= 60 else mid if n <= 130 else small


def logo_block(data, max_h, align, after=8):
    inst, design = data["institution"], data["design"]
    if design["show_logo"] and inst["logo"]:
        return [{"t": "logo", "max_h": max_h, "align": align, "after": after}]
    return []


def course_line(doc):
    code, name = doc["course_code"], doc["course_title"]
    return f"{code} \u2013 {name}" if code and name else code or name


def term_line(doc):
    bits = [doc["term"], f"Section {doc['section']}" if doc["section"] else "", doc["academic_year"]]
    return " \u00b7 ".join(b for b in bits if b)


def to_lines(data):
    t = data["submitted_to"]
    dept = t["department"] or ""
    return [(x, i == 0) for i, x in enumerate(
        [y for y in (t["name"], t["designation"], dept, t["institution"]) if y])]


def by_lines(data):
    by = data["submitted_by"]
    lines = []
    if by["mode"] == "individual":
        m = by["members"][0]
        lines += [(m["name"], True), (f"ID: {m['student_id']}", False)]
    else:
        lines.append((f"Group of {len(by['members'])}", True))
    for x in (by["program"], by["department"],
              f"Semester: {by['term']}" if by["term"] else "",
              f"Section: {by['section']}" if by["section"] else "",
              f"Batch: {by['batch']}" if by["batch"] else ""):
        if x:
            lines.append((x, False))
    return lines


def parties(data, accent, layout, align="left", size=11.5):
    """Submitted To / Submitted By. layout: 'columns' or 'stacked'."""
    by = data["submitted_by"]
    group = by["mode"] == "group"
    out = []
    if layout == "columns":
        out.append({"t": "columns", "size": size, "cols": [
            {"heading": "Submitted To", "lines": to_lines(data)},
            {"heading": "Submitted By", "lines": by_lines(data)}]})
        if group:
            out += SP(10)
            out.append({"t": "members", "members": by["members"], "heading": "Group Members", "size": size - 0.5})
        return out
    for heading, lines in (("Submitted To", to_lines(data)), ("Submitted By", by_lines(data))):
        out += T(heading, size - 1, bold=True, color=accent, align=align, caps=True, before=4, after=3)
        for text, bold in lines:
            out += T(text, size + (0.5 if bold else 0), bold=bold, align=align, after=1)
        if heading == "Submitted By" and group:
            out += SP(4)
            for m in by["members"]:
                s = f"{m['name']} ({m['student_id']})" + (f" \u2013 {m['role']}" if m["role"] else "")
                out += T(s, size, align=align, after=1)
        out += SP(10)
    return out


def date_text(doc):
    return f"Date of Submission: {doc['submission_date_text']}"


def notes_block(doc, align):
    return T(doc["notes"], 10, italic=True, color=MUTED, align=align, before=14)


def inst_header(data, align, name_size, accent=INK, logo_h=80):
    inst, d = data["institution"], data["design"]
    out = logo_block(data, logo_h, align)
    if d["show_header"]:
        out += T(inst["name"], name_size, bold=True, align=align, caps=True, color=accent, after=3)
        out += T(inst["faculty"], name_size - 7, align=align, after=1)
        out += T(inst["department"], name_size - 6, bold=True, align=align, after=1)
        out += T(inst["address"], 10, color=MUTED, align=align, after=1)
    return out


# -------------------------------------------------------------- templates
def _classic(data, a):
    doc = data["document"]
    b = [*SP(6), *inst_header(data, "center", 20, a)]
    b += RULE(a, 1.2, 1.0, before=12, after=26)
    b += T(doc["type_label"], 13, bold=True, color=a, align="center", caps=True, after=10)
    b += T(doc["title"], title_size(doc["title"], 26, 21, 17), bold=True, align="center", after=6)
    b += T(doc["subtitle"], 14, italic=True, align="center", color=MUTED, after=16)
    b += T(course_line(doc), 14, bold=True, align="center", before=6, after=3)
    b += T(term_line(doc), 12, align="center", color=MUTED)
    b += SP(44) + parties(data, a, "columns", size=12) + SP(36)
    b += T(date_text(doc), 12, bold=True, align="center")
    b += notes_block(doc, "center")
    return b


def _minimal(data, a):
    doc = data["document"]
    b = logo_block(data, 46, "left", after=6)
    if data["design"]["show_header"]:
        b += T(data["institution"]["name"], 12, bold=True, after=1)
        b += T(data["institution"]["department"], 10.5, color=MUTED)
    b += SP(80)
    b += T(doc["type_label"], 11, bold=True, color=a, caps=True, after=10)
    b += T(doc["title"], title_size(doc["title"], 34, 26, 20), bold=True, after=8)
    b += T(doc["subtitle"], 14, color=MUTED, after=12)
    b += RULE(a, 3, 0.15, align="left", before=6, after=14)
    b += T(course_line(doc), 12.5, bold=True, after=2)
    b += T(term_line(doc), 11, color=MUTED)
    b += SP(60) + parties(data, a, "columns", size=11)
    b += SP(30) + T(date_text(doc), 11, color=MUTED)
    b += notes_block(doc, "left")
    return b


def _corporate(data, a):
    doc, inst = data["document"], data["institution"]
    b = RULE(a, 12, 1.0, before=0, after=16)
    b += logo_block(data, 56, "left", after=6)
    if data["design"]["show_header"]:
        b += T(inst["name"], 15, bold=True, after=2)
        b += T(inst["faculty"], 10.5, color=MUTED, after=1)
        b += T(inst["department"], 11, color=MUTED)
    b += SP(48)
    b += T(doc["type_label"], 12, bold=True, color=a, caps=True, after=6)
    b += T(doc["title"], title_size(doc["title"], 28, 22, 18), bold=True, after=6)
    b += T(doc["subtitle"], 14, color=MUTED, after=4)
    b += RULE("#D1D5DB", 1, 1.0, align="left", before=10, after=12)
    rows = [("Course", course_line(doc)), ("Term", doc["term"]),
            ("Section", doc["section"]), ("Academic Year", doc["academic_year"]),
            ("Submission Date", doc["submission_date_text"])]
    b.append({"t": "kv", "rows": [r for r in rows if r[1]], "size": 11.5})
    b += SP(30) + parties(data, a, "columns", size=11.5)
    b += notes_block(doc, "left")
    return b


def _elegant(data, a):
    doc = data["document"]
    b = [*SP(14), *inst_header(data, "center", 18, a, logo_h=76)]
    b += RULE(a, 1, 0.25, before=10, after=30)
    b += T(doc["type_label"], 14, italic=True, color=a, align="center", after=10)
    b += T(doc["title"], title_size(doc["title"], 25, 20, 16), bold=True, align="center", after=6)
    b += T(doc["subtitle"], 13, italic=True, color=MUTED, align="center", after=8)
    b += RULE(a, 1, 0.25, before=6, after=10)
    b += T(course_line(doc), 13, bold=True, align="center", after=2)
    b += T(term_line(doc), 11.5, color=MUTED, align="center")
    b += SP(30) + parties(data, a, "stacked", align="center", size=12)
    b += T(date_text(doc), 12, italic=True, align="center", before=8)
    b += notes_block(doc, "center")
    return b


def _lab(data, a):
    doc = data["document"]
    b = logo_block(data, 58, "center", after=6)
    if data["design"]["show_header"]:
        b += T(data["institution"]["name"], 15, bold=True, align="center", after=1)
        b += T(data["institution"]["department"], 11, color=MUTED, align="center")
    b += RULE(a, 3, 1.0, before=12, after=26)
    b += T(doc["course_code"], 40, bold=True, color=a, align="center", after=2)
    b += T(doc["course_title"], 18, bold=True, align="center", after=14)
    b += T(doc["type_label"], 12, bold=True, color=MUTED, align="center", caps=True, after=8)
    b += RULE("#9CA3AF", 1, 1.0, before=2, after=12)
    b += T(doc["title"], title_size(doc["title"], 21, 18, 15), bold=True, align="center", after=4)
    b += T(doc["subtitle"], 13, color=MUTED, align="center", after=6)
    b += RULE("#9CA3AF", 1, 1.0, before=6, after=10)
    b += T(term_line(doc), 11.5, color=MUTED, align="center")
    b += SP(34) + parties(data, a, "columns", size=11.5) + SP(24)
    b += T(date_text(doc), 12, bold=True, align="center")
    b += notes_block(doc, "center")
    return b


def _thesis(data, a):
    doc, inst, by, to = data["document"], data["institution"], data["submitted_by"], data["submitted_to"]
    b = inst_header(data, "center", 18, a, logo_h=92)
    b += SP(46)
    art = "An" if doc["type_label"][0].lower() in "aeiou" else "A"
    b += T(f"{art} {doc['type_label']}", 12, italic=True, color=a, align="center", after=10)
    b += T(doc["title"], title_size(doc["title"], 25, 21, 17), bold=True, align="center", after=6)
    b += T(doc["subtitle"], 14, italic=True, align="center", color=MUTED, after=10)
    b += T(f"submitted to the Department of {inst['department']}", 12, align="center", color=MUTED, after=2)
    b += T(course_line(doc), 12, align="center", color=MUTED)
    b += SP(34) + T("by", 12, italic=True, align="center", after=8)
    for m in by["members"]:
        b += T(m["name"], 14, bold=True, align="center", after=1)
        b += T(f"ID: {m['student_id']}" + (f" \u2013 {m['role']}" if m["role"] else ""), 11, align="center", color=MUTED, after=5)
    extra = " \u00b7 ".join(x for x in (by["program"], by["term"], f"Section {by['section']}" if by["section"] else "",
                                         f"Batch {by['batch']}" if by["batch"] else "") if x)
    b += T(extra, 11, align="center", color=MUTED, before=4)
    b += SP(30)
    b += T("Supervisor", 11, bold=True, color=a, align="center", caps=True, after=4)
    b += T(to["name"], 14, bold=True, align="center", after=1)
    b += T(to["designation"], 11.5, align="center", after=1)
    b += T(to["department"] or inst["department"], 11.5, align="center", after=1)
    b += T(to["institution"], 11.5, align="center")
    b += SP(30) + T(doc["submission_date_text"], 12, bold=True, align="center")
    b += notes_block(doc, "center")
    return b


_BUILDERS = {"classic": _classic, "modern_minimal": _minimal, "corporate": _corporate,
             "elegant_border": _elegant, "lab_report": _lab, "research_thesis": _thesis}


def build_layout(data):
    """Return (page_spec, blocks) for a normalised document."""
    d = data["design"]
    tpl = TEMPLATES[d["template_id"]]
    blocks = _BUILDERS[d["template_id"]](data, d["accent"])
    # density scales vertical spacing only
    f = DENSITY[d["density"]]
    for blk in blocks:
        for k in ("before", "after", "h"):
            if k in blk:
                blk[k] = blk[k] * f
    border = tpl["border"] if d["border"] == "auto" else d["border"]
    spec = {"border": border, "accent": d["accent"], "font": d["font"],
            "footer": d["footer"], "title": data["document"]["title"]}
    return spec, blocks
