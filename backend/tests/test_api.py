"""HTTP-layer tests. Skipped automatically when fastapi/httpx are not installed."""
import io, unittest, zipfile

try:
    from fastapi.testclient import TestClient
    from main import app
    HAVE = True
except Exception:  # pragma: no cover
    HAVE = False

from tests.sample_data import sample


@unittest.skipUnless(HAVE, "fastapi / httpx not installed")
class ApiTests(unittest.TestCase):
    def setUp(self):
        self.c = TestClient(app, raise_server_exceptions=False)

    def test_health(self):
        r = self.c.get("/api/health"); self.assertEqual(r.status_code, 200); self.assertEqual(r.json()["status"], "ok")

    def test_templates(self):
        r = self.c.get("/api/templates"); self.assertGreaterEqual(len(r.json()["templates"]), 6)

    def test_pdf_download(self):
        r = self.c.post("/api/generate/pdf", json=sample())
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.headers["content-type"], "application/pdf")
        self.assertIn("Software_Testing", r.headers["content-disposition"])
        self.assertTrue(r.content.startswith(b"%PDF"))

    def test_docx_download(self):
        r = self.c.post("/api/generate/docx", json=sample())
        self.assertEqual(r.status_code, 200)
        self.assertIn("wordprocessingml", r.headers["content-type"])
        self.assertTrue(zipfile.is_zipfile(io.BytesIO(r.content)))

    def test_validation_error_shape(self):
        r = self.c.post("/api/generate/pdf", json={"document": {}})
        self.assertEqual(r.status_code, 422)
        self.assertIn("document.title", r.json()["detail"]["errors"])

    def test_bad_template_and_oversize(self):
        self.assertEqual(self.c.post("/api/generate/pdf", json=sample(design={"template_id": "x"})).status_code, 422)
        r = self.c.post("/api/generate/pdf", content=b"{" + b" " * (4 * 1024 * 1024) + b"}",
                        headers={"content-type": "application/json"})
        self.assertEqual(r.status_code, 413)

    def test_preview_data(self):
        r = self.c.post("/api/preview-data", json=sample()); self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()["document"]["title"], sample()["document"]["title"])

    def test_preview_layout(self):
        r = self.c.post("/api/preview-layout", json=sample())
        self.assertEqual(r.status_code, 200)
        j = r.json(); self.assertEqual(j["pages"], 1); self.assertTrue(j["blocks"])
