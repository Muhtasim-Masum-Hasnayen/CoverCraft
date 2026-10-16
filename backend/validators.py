"""Validation + normalisation. Pure Python (no web framework) so it is easy to test."""
from __future__ import annotations

import datetime as dt
import re
import unicodedata
from typing import Any

from services.logo_processor import LogoError, process_logo

DOCUMENT_TYPES = {
    "assignment": "Assignment",
    "homework": "Homework",
    "lab_report": "Lab Report",
    "project_report": "Project Report",
    "research_paper": "Research Paper",
    "internship_report": "Internship Report",
    "thesis": "Thesis",
    "case_study": "Case Study",
    "seminar_report": "Seminar Report",
    "other": "Academic Document",
}
TEMPLATE_IDS = [
    "classic", "modern_minimal", "corporate",
    "elegant_border", "lab_report", "research_thesis",
]
FONTS = ["Times New Roman", "Arial", "DejaVu Sans"]
BORDERS = ["auto", "none", "thin", "double"]
DENSITIES = ["compact", "normal", "relaxed"]
MAX_MEMBERS = 12
COLOR_RE = re.compile(r"^#[0-9a-fA-F]{6}$")
_CTRL = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")


class ValidationFailure(Exception):
    def __init__(self, errors: dict[str, str]):
        super().__init__("Validation failed")
        self.errors = errors


def _clean(value: Any) -> str:
    if value is None:
        return ""
    if not isinstance(value, str):
        value = str(value)
    value = _CTRL.sub("", value).replace("\r\n", "\n").replace("\r", "\n")
    return re.sub(r"[ \t]+", " ", value).strip()


class _Reader:
    def __init__(self, errors: dict[str, str]):
        self.errors = errors

    def text(self, src: dict, key: str, path: str, *, required=False,
             max_len=120, multiline=False) -> str:
        v = _clean(src.get(key))
        if not multiline:
            v = re.sub(r"\s*\n\s*", " ", v)
        if required and not v:
            self.errors[path] = "This field is required."
        elif len(v) > max_len:
            self.errors[path] = f"Must be at most {max_len} characters."
        return v

    def section(self, payload: dict, key: str) -> dict:
        v = payload.get(key)
        if v is None:
            return {}
        if not isinstance(v, dict):
            self.errors[key] = "Must be an object."
            return {}
        return v


def normalize(payload: Any) -> dict:
    """Validate a raw request payload and return the shared normalised structure."""
    if not isinstance(payload, dict):
        raise ValidationFailure({"_": "Request body must be a JSON object."})
    errors: dict[str, str] = {}
    r = _Reader(errors)

    # ---- document -------------------------------------------------------
    d = r.section(payload, "document")
    dtype = _clean(d.get("type")) or "assignment"
    if dtype not in DOCUMENT_TYPES:
        errors["document.type"] = "Unsupported document type."
    title = r.text(d, "title", "document.title", required=True, max_len=300)
    subtitle = r.text(d, "subtitle", "document.subtitle", max_len=300)
    course_code = r.text(d, "course_code", "document.course_code", max_len=30)
    course_title = r.text(d, "course_title", "document.course_title", max_len=150)
    term = r.text(d, "term", "document.term", max_len=40)
    section = r.text(d, "section", "document.section", max_len=30)
    year = r.text(d, "academic_year", "document.academic_year", max_len=20)
    notes = r.text(d, "notes", "document.notes", max_len=400, multiline=True)
    raw_date = _clean(d.get("submission_date"))
    date_obj = None
    if not raw_date:
        errors["document.submission_date"] = "This field is required."
    else:
        try:
            date_obj = dt.date.fromisoformat(raw_date)
        except ValueError:
            errors["document.submission_date"] = "Use the format YYYY-MM-DD."

    # ---- institution ----------------------------------------------------
    i = r.section(payload, "institution")
    inst = {
        "name": r.text(i, "name", "institution.name", required=True, max_len=200),
        "faculty": r.text(i, "faculty", "institution.faculty", max_len=150),
        "department": r.text(i, "department", "institution.department", required=True, max_len=150),
        "program": r.text(i, "program", "institution.program", max_len=150),
        "address": r.text(i, "address", "institution.address", max_len=250),
        "logo": None,
        "logo_size": None,
    }
    logo_raw = i.get("logo_base64")
    if logo_raw:
        try:
            inst["logo"], inst["logo_size"] = process_logo(logo_raw)
        except LogoError as exc:
            errors["institution.logo"] = str(exc)

    # ---- submitted to ---------------------------------------------------
    t = r.section(payload, "submitted_to")
    to = {
        "name": r.text(t, "name", "submitted_to.name", required=True, max_len=150),
        "designation": r.text(t, "designation", "submitted_to.designation", max_len=150),
        "department": r.text(t, "department", "submitted_to.department", max_len=150),
        "institution": r.text(t, "institution", "submitted_to.institution", max_len=200),
    }

    # ---- submitted by ---------------------------------------------------
    b = r.section(payload, "submitted_by")
    mode = _clean(b.get("mode")) or "individual"
    if mode not in ("individual", "group"):
        errors["submitted_by.mode"] = "Must be 'individual' or 'group'."
    raw_members = b.get("members")
    members: list[dict] = []
    if not isinstance(raw_members, list) or not raw_members:
        errors["submitted_by.members"] = "Add at least one student."
    elif len(raw_members) > MAX_MEMBERS:
        errors["submitted_by.members"] = f"At most {MAX_MEMBERS} members are allowed."
    else:
        if mode == "individual" and len(raw_members) != 1:
            errors["submitted_by.members"] = "Individual submission must have exactly one student."
        for idx, m in enumerate(raw_members):
            if not isinstance(m, dict):
                errors[f"submitted_by.members.{idx}"] = "Invalid member."
                continue
            p = f"submitted_by.members.{idx}"
            members.append({
                "name": r.text(m, "name", f"{p}.name", required=True, max_len=120),
                "student_id": r.text(m, "student_id", f"{p}.student_id", required=True, max_len=40),
                "role": r.text(m, "role", f"{p}.role", max_len=60),
            })
    by = {
        "mode": mode,
        "members": members,
        "department": r.text(b, "department", "submitted_by.department", max_len=150),
        "program": r.text(b, "program", "submitted_by.program", max_len=150),
        "term": r.text(b, "term", "submitted_by.term", max_len=40),
        "section": r.text(b, "section", "submitted_by.section", max_len=30),
        "batch": r.text(b, "batch", "submitted_by.batch", max_len=30),
    }

    # ---- design ---------------------------------------------------------
    g = r.section(payload, "design")
    template_id = _clean(g.get("template_id")) or "classic"
    if template_id not in TEMPLATE_IDS:
        errors["design.template_id"] = "Unknown template."
    accent = _clean(g.get("accent")) or "#0E4D92"
    if not COLOR_RE.match(accent):
        errors["design.accent"] = "Use a hex colour like #0E4D92."
    font = _clean(g.get("font")) or "Times New Roman"
    if font not in FONTS:
        errors["design.font"] = "Unsupported font."
    border = _clean(g.get("border")) or "auto"
    if border not in BORDERS:
        errors["design.border"] = "Unsupported border style."
    density = _clean(g.get("density")) or "normal"
    if density not in DENSITIES:
        errors["design.density"] = "Unsupported density."
    design = {
        "template_id": template_id,
        "accent": accent.upper(),
        "font": font,
        "show_logo": bool(g.get("show_logo", True)),
        "show_header": bool(g.get("show_header", True)),
        "border": border,
        "density": density,
        "footer": r.text(g, "footer", "design.footer", max_len=150),
    }

    if errors:
        raise ValidationFailure(errors)

    # Sensible fallbacks, applied only after validation succeeded.
    by["department"] = by["department"] or inst["department"]
    by["program"] = by["program"] or inst["program"]
    by["term"] = by["term"] or term
    by["section"] = by["section"] or section

    return {
        "document": {
            "type": dtype, "type_label": DOCUMENT_TYPES[dtype], "title": title,
            "subtitle": subtitle, "course_code": course_code, "course_title": course_title,
            "term": term, "section": section, "academic_year": year, "notes": notes,
            "submission_date": date_obj.isoformat(),
            "submission_date_text": f"{date_obj.day} {date_obj.strftime('%B %Y')}",
        },
        "institution": inst,
        "submitted_to": to,
        "submitted_by": by,
        "design": design,
    }


def safe_filename(title: str, type_label: str, ext: str) -> str:
    """ASCII-only, path-safe filename such as Software_Testing_Assignment_Cover.pdf"""
    def slug(s: str) -> str:
        s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
        s = re.sub(r"[^A-Za-z0-9]+", "_", s).strip("_")
        return s

    title_slug = slug(title)[:50].strip("_")
    type_slug = slug(type_label)
    parts = [p for p in (title_slug, type_slug) if p]
    if title_slug and type_slug and type_slug.lower() in title_slug.lower():
        parts = [title_slug]
    base = "_".join(parts + ["Cover"]) if parts else "Cover_Page"
    return f"{base[:80]}.{ext}"
