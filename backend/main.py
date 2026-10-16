"""CoverCraft API (FastAPI). Guest mode only: stateless, nothing is stored."""
from __future__ import annotations

import logging
import os
from urllib.parse import quote

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response

from schemas import CoverRequest, HealthResponse
from services.docx_generator import generate_docx
from services.pdf_generator import generate_pdf, render_pdf
from templates import build_layout, template_catalog
from validators import ValidationFailure, normalize, safe_filename

VERSION = "0.1.0"
MAX_BODY_BYTES = int(os.getenv("MAX_BODY_BYTES", str(3 * 1024 * 1024)))
PDF_MIME = "application/pdf"
DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("covercraft")  # never log request bodies (student data)

app = FastAPI(title="CoverCraft API", version=VERSION, docs_url="/api/docs", openapi_url="/api/openapi.json")

origins = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",") if o.strip()]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_methods=["GET", "POST", "OPTIONS"],
                   allow_headers=["Content-Type"], expose_headers=["Content-Disposition"])


@app.middleware("http")
async def limit_body(request: Request, call_next):
    declared = request.headers.get("content-length")
    if declared and declared.isdigit() and int(declared) > MAX_BODY_BYTES:
        return JSONResponse({"detail": {"message": "Request is too large.", "errors": {}}}, status_code=413)
    return await call_next(request)


@app.exception_handler(ValidationFailure)
async def on_validation(_: Request, exc: ValidationFailure):
    return JSONResponse({"detail": {"message": "Please fix the highlighted fields.", "errors": exc.errors}}, status_code=422)


@app.exception_handler(Exception)
async def on_error(_: Request, exc: Exception):
    log.error("unhandled error: %s", type(exc).__name__)  # type only, no payload / trace to client
    return JSONResponse({"detail": {"message": "Something went wrong while generating the document.", "errors": {}}}, status_code=500)


def _download(content: bytes, mime: str, filename: str) -> Response:
    disp = f"attachment; filename=\"{filename}\"; filename*=UTF-8''{quote(filename)}"
    return Response(content, media_type=mime, headers={"Content-Disposition": disp, "Cache-Control": "no-store"})


@app.get("/api/health", response_model=HealthResponse)
def health():
    return {"status": "ok", "version": VERSION}


@app.get("/api/templates")
def templates():
    return {"templates": template_catalog()}


@app.post("/api/preview-data")
def preview_data(req: CoverRequest):
    data = normalize(req.model_dump())
    data["institution"]["logo"] = None  # raw bytes are not JSON-serialisable; preview uses the client copy
    return data


@app.post("/api/preview-layout")
def preview_layout(req: CoverRequest):
    """Renderer-independent layout blocks, so the browser preview matches the PDF/DOCX."""
    data = normalize(req.model_dump())
    spec, blocks = build_layout(data)
    _, scale, pages = render_pdf(data)
    return {"spec": spec, "blocks": blocks, "scale": scale, "pages": pages,
            "logo_size": data["institution"]["logo_size"]}


@app.post("/api/generate/pdf")
def generate_pdf_endpoint(req: CoverRequest):
    data = normalize(req.model_dump())
    name = safe_filename(data["document"]["title"], data["document"]["type_label"], "pdf")
    return _download(generate_pdf(data), PDF_MIME, name)


@app.post("/api/generate/docx")
def generate_docx_endpoint(req: CoverRequest):
    data = normalize(req.model_dump())
    name = safe_filename(data["document"]["title"], data["document"]["type_label"], "docx")
    return _download(generate_docx(data), DOCX_MIME, name)
