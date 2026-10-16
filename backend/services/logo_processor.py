"""Logo validation: decode in memory, verify real image content, normalise to PNG."""
from __future__ import annotations

import base64
import binascii
import io

from PIL import Image, UnidentifiedImageError

MAX_BYTES = 2 * 1024 * 1024
MAX_SIDE_PX = 4000
OUT_MAX_SIDE_PX = 600
ALLOWED_FORMATS = {"PNG", "JPEG"}

Image.MAX_IMAGE_PIXELS = MAX_SIDE_PX * MAX_SIDE_PX  # decompression-bomb guard


class LogoError(ValueError):
    pass


def process_logo(raw):
    """Return (png_bytes, (width_px, height_px)). Raises LogoError on any problem."""
    if not isinstance(raw, str):
        raise LogoError("Logo must be a base64 string.")
    if raw.startswith("data:"):
        head, _, raw = raw.partition(",")
        if "svg" in head.lower():
            raise LogoError("SVG logos are not supported. Use PNG or JPEG.")
    raw = raw.strip()
    if len(raw) > MAX_BYTES * 4 // 3 + 16:
        raise LogoError("Logo is too large (max 2 MB).")
    try:
        data = base64.b64decode(raw, validate=True)
    except (binascii.Error, ValueError):
        raise LogoError("Logo data is not valid base64.")
    if not data or len(data) > MAX_BYTES:
        raise LogoError("Logo is empty or too large (max 2 MB).")
    try:
        with Image.open(io.BytesIO(data)) as probe:
            fmt = probe.format
            probe.verify()
        if fmt not in ALLOWED_FORMATS:
            raise LogoError("Only PNG and JPEG logos are supported.")
        with Image.open(io.BytesIO(data)) as img:
            if max(img.size) > MAX_SIDE_PX or min(img.size) < 8:
                raise LogoError("Logo dimensions must be between 8 and 4000 pixels.")
            img = img.convert("RGBA")
            bg = Image.new("RGBA", img.size, (255, 255, 255, 255))
            img = Image.alpha_composite(bg, img).convert("RGB")
            img.thumbnail((OUT_MAX_SIDE_PX, OUT_MAX_SIDE_PX))
            out = io.BytesIO()
            img.save(out, format="PNG", optimize=True)
            return out.getvalue(), img.size
    except LogoError:
        raise
    except (UnidentifiedImageError, OSError, SyntaxError, Image.DecompressionBombError, ValueError):
        raise LogoError("Logo is corrupted or not a supported image.")
