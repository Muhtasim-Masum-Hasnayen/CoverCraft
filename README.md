# CoverCraft — Milestone 1 (guest mode)

Guest mode only. No login, payments, AI writing or cloud storage.
Live : https://cover-craft-chi.vercel.app
## Status
- Backend (tested here): validation, 6 templates, PDF (ReportLab) + DOCX (python-docx), logo validation, filename sanitising. 28 tests run and pass; 8 API tests are skipped here because fastapi/httpx could not be installed offline.
- Written but NOT run or built here: `backend/main.py` (FastAPI) and the whole `frontend/` (Next.js). No npm install, type-check or `next build` has been done, so expect to fix small errors on first run.
- Not done: deployment (Vercel/Render), frontend tests, Bengali PDF, print preview, rate limiting.

## Run locally (two terminals)
Backend:

    cd backend
    python -m venv .venv && source .venv/bin/activate    # Windows: .venv\Scripts\activate
    pip install -r requirements-dev.txt
    pytest
    uvicorn main:app --reload                             # http://localhost:8000/api/docs

Frontend:

    cd frontend
    cp .env.local.example .env.local
    npm install
    npm run typecheck
    npm run dev                                           # http://localhost:3000

Set `CORS_ORIGINS` for the backend and `NEXT_PUBLIC_API_BASE_URL` for the frontend (see `.env.example`).

## Known limitations
- Frontend uses plain React state and a hand-written validator instead of React Hook Form / Zod / shadcn (kept dependencies minimal because nothing could be installed to verify them).
- Feedback form shows "not configured" unless NEXT_PUBLIC_FEEDBACK_URL is set.
- Bengali text in PDF is not supported yet (needs a bundled Bengali font plus text shaping; ReportLab does not shape Bengali conjuncts).
- Content is top-aligned; short covers leave empty space at the bottom.
- No rate limiting or request timeout yet.
