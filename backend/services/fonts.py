"""Bundled TrueType fonts (metric-compatible with Times New Roman / Arial)."""
from pathlib import Path

from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

FONT_DIR = Path(__file__).resolve().parent.parent / "fonts"

FAMILIES = {
    "Times New Roman": ("LiberationSerif-Regular", "LiberationSerif-Bold", "LiberationSerif-Italic", "LiberationSerif-BoldItalic"),
    "Arial": ("LiberationSans-Regular", "LiberationSans-Bold", "LiberationSans-Italic", "LiberationSans-BoldItalic"),
    "DejaVu Sans": ("DejaVuSans", "DejaVuSans-Bold", "DejaVuSans-Oblique", "DejaVuSans-BoldOblique"),
}
# Font used inside .docx when the chosen face may be missing on the user's machine.
DOCX_FONT = {"Times New Roman": "Times New Roman", "Arial": "Arial", "DejaVu Sans": "Verdana"}

_registered = False


def register_fonts():
    global _registered
    if _registered:
        return
    for fam, files in FAMILIES.items():
        for style, fname in zip(("r", "b", "i", "bi"), files):
            pdfmetrics.registerFont(TTFont(f"{fam}-{style}", str(FONT_DIR / f"{fname}.ttf")))
        pdfmetrics.registerFontFamily(fam, normal=f"{fam}-r", bold=f"{fam}-b", italic=f"{fam}-i", boldItalic=f"{fam}-bi")
    _registered = True


def pdf_font(family, bold, italic):
    return f"{family}-{'b' if bold else ''}{'i' if italic else ''}" if (bold or italic) else f"{family}-r"
