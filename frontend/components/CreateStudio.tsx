"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle2, Download, FileText, Maximize2, Plus, RotateCcw, Trash2, X } from "lucide-react";
import CoverPreview from "./CoverPreview";
import { API_BASE, ApiErrorBody, filenameFromDisposition } from "@/lib/api";
import { FormState, emptyForm, emptyMember, getIn, previewPayload, setIn, todayISO, validate } from "@/lib/form";
import { DOC_TYPES, FONTS, TEMPLATES } from "@/lib/templates";

const STORAGE_KEY = "covercraft:draft:v1";
const MAX_LOGO_BYTES = 2 * 1024 * 1024;

type Ctx = { form: FormState; errors: Record<string, string>; set: (path: string, value: unknown) => void };

function TextField({ ctx, path, label, required, placeholder, max, textarea, type = "text" }: {
  ctx: Ctx; path: string; label: string; required?: boolean; placeholder?: string; max?: number; textarea?: boolean; type?: string;
}) {
  const id = `f-${path.replace(/\./g, "-")}`;
  const err = ctx.errors[path];
  const common = {
    id, value: String(getIn(ctx.form, path) ?? ""), placeholder, maxLength: max,
    "aria-invalid": err ? true : undefined, "aria-describedby": err ? `${id}-err` : undefined,
    className: `input ${err ? "border-red-500" : ""}`,
  };
  return (
    <div>
      <label htmlFor={id} className="label">{label}{required && <span className="text-red-600" aria-hidden="true"> *</span>}{required && <span className="sr-only"> (required)</span>}</label>
      {textarea
        ? <textarea {...common} rows={2} onChange={(e) => ctx.set(path, e.target.value)} />
        : <input {...common} type={type} onChange={(e) => ctx.set(path, e.target.value)} />}
      {err && <p id={`${id}-err`} role="alert" className="mt-1 text-xs text-red-600">{err}</p>}
    </div>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <fieldset className="card p-5">
      <legend className="px-1 text-base font-semibold">{title}</legend>
      {hint && <p className="mb-3 text-xs text-navy-500">{hint}</p>}
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

export default function CreateStudio() {
  const params = useSearchParams();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<null | "pdf" | "docx">(null);
  const [status, setStatus] = useState<null | { kind: "ok" | "error"; text: string }>(null);
  const [view, setView] = useState<"form" | "preview">("form");
  const [large, setLarge] = useState(false);
  const [ready, setReady] = useState(false);
  const touched = useRef<Set<string>>(new Set());
  const busyRef = useRef(false);

  // Load saved draft (logo is never persisted) and apply ?template= / ?type= from links.
  useEffect(() => {
    let next = emptyForm();
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) next = { ...next, ...(JSON.parse(raw) as Partial<FormState>) };
    } catch { /* ignore corrupt draft */ }
    const tpl = TEMPLATES.find((t) => t.id === params.get("template"));
    const type = DOC_TYPES.find((d) => d.id === params.get("type"));
    if (type) next.document.type = type.id;
    const tplId = tpl?.id ?? (type && !params.get("template") ? type.template : null);
    if (tplId) {
      const t = TEMPLATES.find((x) => x.id === tplId)!;
      next.design = { ...next.design, template_id: t.id, accent: t.accent, font: t.font };
    }
    if (!next.document.submission_date) next.document.submission_date = todayISO();
    next.institution.logo_base64 = "";
    setForm(next);
    setReady(true);
  }, [params]);

  useEffect(() => {
    if (!ready) return; // do not overwrite the saved draft before it has been loaded
    try {
      const { institution, ...rest } = form;
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...rest, institution: { ...institution, logo_base64: "" } }));
    } catch { /* storage unavailable */ }
  }, [form, ready]);

  const set = useCallback((path: string, value: unknown) => {
    touched.current.add(path);
    setForm((f) => setIn(f, path, value));
    setErrors((e) => { if (!e[path]) return e; const n = { ...e }; delete n[path]; return n; });
  }, []);
  const ctx: Ctx = { form, errors, set };

  function chooseTemplate(id: string) {
    const t = TEMPLATES.find((x) => x.id === id);
    if (!t) return;
    // Only template_id always changes; colour/font follow the template unless the user customised them.
    setForm((f) => {
      let n = setIn(f, "design.template_id", id);
      if (!touched.current.has("design.accent")) n = setIn(n, "design.accent", t.accent);
      if (!touched.current.has("design.font")) n = setIn(n, "design.font", t.font);
      return n;
    });
  }

  function setMode(mode: "individual" | "group") {
    setForm((f) => {
      const members = mode === "individual" ? f.submitted_by.members.slice(0, 1) : f.submitted_by.members;
      return { ...f, submitted_by: { ...f.submitted_by, mode, members: members.length ? members : [emptyMember()] } };
    });
  }

  function onLogo(file: File | undefined) {
    if (!file) return;
    if (!["image/png", "image/jpeg"].includes(file.type)) { setErrors((e) => ({ ...e, "institution.logo": "Use a PNG or JPEG image." })); return; }
    if (file.size > MAX_LOGO_BYTES) { setErrors((e) => ({ ...e, "institution.logo": "Logo must be 2 MB or smaller." })); return; }
    const reader = new FileReader();
    reader.onload = () => { set("institution.logo_base64", String(reader.result)); setErrors((e) => { const n = { ...e }; delete n["institution.logo"]; return n; }); };
    reader.onerror = () => setErrors((e) => ({ ...e, "institution.logo": "Could not read that file." }));
    reader.readAsDataURL(file);
  }

  function reset() {
    const dirty = JSON.stringify({ ...form, institution: { ...form.institution, logo_base64: "" } }) !==
      JSON.stringify({ ...emptyForm(), document: { ...emptyForm().document, submission_date: form.document.submission_date } });
    if (dirty && !window.confirm("Clear everything you have entered? This cannot be undone.")) return;
    touched.current.clear();
    const f = emptyForm(); f.document.submission_date = todayISO();
    setForm(f); setErrors({}); setStatus(null);
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  }

  async function download(kind: "pdf" | "docx") {
    if (busyRef.current) return;
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length) {
      setStatus({ kind: "error", text: "Please fix the highlighted fields first." });
      setView("form");
      setTimeout(() => document.querySelector<HTMLElement>("[aria-invalid='true']")?.focus(), 50);
      return;
    }
    busyRef.current = true; setBusy(kind); setStatus(null);
    try {
      const res = await fetch(`${API_BASE}/api/generate/${kind}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
      });
      if (!res.ok) {
        let message = `The server could not generate the ${kind.toUpperCase()} (error ${res.status}).`;
        try {
          const body = (await res.json()) as ApiErrorBody;
          if (body.detail?.errors) setErrors(body.detail.errors);
          if (body.detail?.message) message = body.detail.message;
        } catch { /* non-JSON error */ }
        setStatus({ kind: "error", text: message });
        return;
      }
      const blob = await res.blob();
      const name = filenameFromDisposition(res.headers.get("Content-Disposition"), `Cover_Page.${kind}`);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
      setStatus({ kind: "ok", text: `Downloaded ${name}` });
    } catch {
      setStatus({ kind: "error", text: "Could not reach the CoverCraft server. Check your connection and that the API is running." });
    } finally {
      busyRef.current = false; setBusy(null);
    }
  }

  const preview = previewPayload(form);
  const by = form.submitted_by;
  const d = form.design;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Create your cover page</h1>
          <p className="text-sm text-navy-500">Fields marked * are required. Your draft is saved in this browser only.</p>
        </div>
        <button type="button" onClick={reset} className="btn-outline"><RotateCcw size={16} /> Reset form</button>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2 lg:hidden" role="tablist" aria-label="Form or preview">
        {(["form", "preview"] as const).map((v) => (
          <button key={v} type="button" role="tab" aria-selected={view === v} onClick={() => setView(v)}
            className={`btn ${view === v ? "bg-navy-900 text-white" : "border border-slate-300 bg-white"}`}>{v === "form" ? "Details" : "Preview"}</button>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className={`space-y-5 ${view === "preview" ? "hidden lg:block" : ""}`}>
          <Section title="1 · Document information">
            <div>
              <label htmlFor="f-doctype" className="label">Document type <span className="text-red-600" aria-hidden="true">*</span></label>
              <select id="f-doctype" className="input" value={form.document.type} onChange={(e) => set("document.type", e.target.value)}>
                {DOC_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>
            <TextField ctx={ctx} path="document.title" label="Assignment / report title" required max={300} placeholder="Software Testing Techniques" />
            <TextField ctx={ctx} path="document.subtitle" label="Subtitle (optional)" max={300} />
            <TextField ctx={ctx} path="document.course_code" label="Course code" max={30} placeholder="CSE 4203" />
            <TextField ctx={ctx} path="document.course_title" label="Course title" max={150} />
            <TextField ctx={ctx} path="document.term" label="Semester / trimester" max={40} placeholder="Fall 2026" />
            <TextField ctx={ctx} path="document.section" label="Section" max={30} />
            <TextField ctx={ctx} path="document.academic_year" label="Academic year" max={20} placeholder="2026-27" />
            <TextField ctx={ctx} path="document.submission_date" label="Submission date" required type="date" />
            <div className="sm:col-span-2"><TextField ctx={ctx} path="document.notes" label="Additional notes (optional)" max={400} textarea /></div>
          </Section>

          <Section title="2 · Institution">
            <TextField ctx={ctx} path="institution.name" label="University or college name" required max={200} />
            <TextField ctx={ctx} path="institution.faculty" label="Faculty or school (optional)" max={150} />
            <TextField ctx={ctx} path="institution.department" label="Department" required max={150} />
            <TextField ctx={ctx} path="institution.program" label="Program or degree" max={150} />
            <div className="sm:col-span-2"><TextField ctx={ctx} path="institution.address" label="Institution address (optional)" max={250} /></div>
            <div className="sm:col-span-2">
              <label htmlFor="f-logo" className="label">Institution logo (optional · PNG or JPEG, max 2 MB)</label>
              <input id="f-logo" type="file" accept="image/png,image/jpeg" className="input" onChange={(e) => onLogo(e.target.files?.[0])} />
              {errors["institution.logo"] && <p role="alert" className="mt-1 text-xs text-red-600">{errors["institution.logo"]}</p>}
              {form.institution.logo_base64 && (
                <button type="button" className="mt-2 text-xs font-medium text-brand-700 underline" onClick={() => set("institution.logo_base64", "")}>Remove logo</button>
              )}
              <p className="mt-1 text-xs text-navy-500">The logo is sent only to generate your file and is not stored. It is not kept after you refresh.</p>
            </div>
          </Section>

          <Section title="3 · Submitted to">
            <TextField ctx={ctx} path="submitted_to.name" label="Teacher or supervisor name" required max={150} />
            <TextField ctx={ctx} path="submitted_to.designation" label="Designation" max={150} placeholder="Associate Professor" />
            <TextField ctx={ctx} path="submitted_to.department" label="Department (optional)" max={150} />
            <TextField ctx={ctx} path="submitted_to.institution" label="Institution (optional)" max={200} />
          </Section>

          <fieldset className="card p-5">
            <legend className="px-1 text-base font-semibold">4 · Submitted by</legend>
            <div className="mb-4 flex gap-5 text-sm" role="radiogroup" aria-label="Submission type">
              {(["individual", "group"] as const).map((m) => (
                <label key={m} className="flex items-center gap-2">
                  <input type="radio" name="mode" checked={by.mode === m} onChange={() => setMode(m)} /> {m === "individual" ? "Individual" : "Group"}
                </label>
              ))}
            </div>
            <div className="space-y-4">
              {by.members.map((m, i) => (
                <div key={i} className="rounded-xl border border-slate-200 p-4">
                  {by.mode === "group" && (
                    <div className="mb-3 flex items-center justify-between text-sm font-medium">
                      Member {i + 1}
                      {by.members.length > 1 && (
                        <button type="button" className="text-red-600" aria-label={`Remove member ${i + 1}`}
                          onClick={() => setForm((f) => ({ ...f, submitted_by: { ...f.submitted_by, members: f.submitted_by.members.filter((_, k) => k !== i) } }))}><Trash2 size={16} /></button>
                      )}
                    </div>
                  )}
                  <div className={`grid gap-4 ${by.mode === "group" ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
                    <TextField ctx={ctx} path={`submitted_by.members.${i}.name`} label="Student full name" required max={120} />
                    <TextField ctx={ctx} path={`submitted_by.members.${i}.student_id`} label="Student ID" required max={40} />
                    {by.mode === "group" && <TextField ctx={ctx} path={`submitted_by.members.${i}.role`} label="Role (optional)" max={60} />}
                  </div>
                </div>
              ))}
              {by.mode === "group" && by.members.length < 12 && (
                <button type="button" className="btn-outline" onClick={() => setForm((f) => ({ ...f, submitted_by: { ...f.submitted_by, members: [...f.submitted_by.members, emptyMember()] } }))}><Plus size={16} /> Add member</button>
              )}
              {errors["submitted_by.members"] && <p role="alert" className="text-xs text-red-600">{errors["submitted_by.members"]}</p>}
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <TextField ctx={ctx} path="submitted_by.department" label="Department (defaults to institution)" max={150} />
              <TextField ctx={ctx} path="submitted_by.program" label="Program" max={150} />
              <TextField ctx={ctx} path="submitted_by.term" label="Semester / trimester" max={40} />
              <TextField ctx={ctx} path="submitted_by.section" label="Section" max={30} />
              <TextField ctx={ctx} path="submitted_by.batch" label="Batch (optional)" max={30} />
            </div>
          </fieldset>

          <fieldset className="card p-5">
            <legend className="px-1 text-base font-semibold">5 · Design</legend>
            <p className="mb-3 text-xs text-navy-500">Switching templates keeps everything you have typed.</p>
            <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Template">
              {TEMPLATES.map((t) => (
                <button key={t.id} type="button" role="radio" aria-checked={d.template_id === t.id} onClick={() => chooseTemplate(t.id)}
                  className={`rounded-lg border px-3 py-2 text-left text-sm ${d.template_id === t.id ? "border-brand-600 bg-brand-50 font-semibold" : "border-slate-300 bg-white"}`}>{t.name}</button>
              ))}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="f-accent" className="label">Accent colour</label>
                <div className="flex gap-2">
                  <input id="f-accent" type="color" value={/^#[0-9a-fA-F]{6}$/.test(d.accent) ? d.accent : "#0E4D92"} onChange={(e) => set("design.accent", e.target.value.toUpperCase())} className="h-10 w-14 rounded border border-slate-300" />
                  <input aria-label="Accent colour hex" className="input" value={d.accent} onChange={(e) => set("design.accent", e.target.value)} maxLength={7} />
                </div>
                {errors["design.accent"] && <p role="alert" className="mt-1 text-xs text-red-600">{errors["design.accent"]}</p>}
              </div>
              <div>
                <label htmlFor="f-font" className="label">Font</label>
                <select id="f-font" className="input" value={d.font} onChange={(e) => set("design.font", e.target.value)}>{FONTS.map((f) => <option key={f}>{f}</option>)}</select>
                <p className="mt-1 text-xs text-navy-500">In Word, DejaVu Sans falls back to Verdana if it is not installed.</p>
              </div>
              <div>
                <label htmlFor="f-border" className="label">Border style</label>
                <select id="f-border" className="input" value={d.border} onChange={(e) => set("design.border", e.target.value)}>
                  <option value="auto">Template default</option><option value="none">None</option><option value="thin">Thin</option><option value="double">Double</option>
                </select>
              </div>
              <div>
                <label htmlFor="f-density" className="label">Layout density</label>
                <select id="f-density" className="input" value={d.density} onChange={(e) => set("design.density", e.target.value)}>
                  <option value="compact">Compact</option><option value="normal">Normal</option><option value="relaxed">Relaxed</option>
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={d.show_logo} onChange={(e) => set("design.show_logo", e.target.checked)} /> Show logo</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={d.show_header} onChange={(e) => set("design.show_header", e.target.checked)} /> Show institution header</label>
              <div className="sm:col-span-2"><TextField ctx={ctx} path="design.footer" label="Footer text (optional)" max={150} /></div>
            </div>
          </fieldset>
        </div>

        <aside className={`${view === "form" ? "hidden lg:block" : ""}`} aria-label="Preview and downloads">
          <div className="sticky top-20 space-y-4">
            <div className="flex justify-center"><CoverPreview payload={preview} width={380} /></div>
            <button type="button" className="btn-outline w-full" onClick={() => setLarge(true)}><Maximize2 size={16} /> Inspect larger preview</button>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" className="btn-primary" disabled={busy !== null} onClick={() => download("pdf")}>
                <Download size={16} /> {busy === "pdf" ? "Generating…" : "Download PDF"}
              </button>
              <button type="button" className="btn-outline" disabled={busy !== null} onClick={() => download("docx")}>
                <FileText size={16} /> {busy === "docx" ? "Generating…" : "Download DOCX"}
              </button>
            </div>
            <div aria-live="polite" className="min-h-6 text-sm">
              {status?.kind === "ok" && <p className="flex items-start gap-2 text-emerald-700"><CheckCircle2 size={16} className="mt-0.5 shrink-0" />{status.text}</p>}
              {status?.kind === "error" && <p role="alert" className="flex items-start gap-2 text-red-700"><AlertCircle size={16} className="mt-0.5 shrink-0" />{status.text}</p>}
            </div>
            <p className="text-xs text-navy-500">Always check your institution&apos;s own formatting requirements before submitting.</p>
          </div>
        </aside>
      </div>

      {large && (
        <div role="dialog" aria-modal="true" aria-label="Large preview" className="fixed inset-0 z-50 overflow-auto bg-navy-900/70 p-4" onClick={() => setLarge(false)}>
          <button type="button" aria-label="Close preview" className="fixed right-4 top-4 rounded-full bg-white p-2" onClick={() => setLarge(false)}><X size={20} /></button>
          <div className="mx-auto w-fit" onClick={(e) => e.stopPropagation()}>
            <CoverPreview payload={preview} width={Math.min(720, typeof window === "undefined" ? 720 : window.innerWidth - 32)} />
          </div>
        </div>
      )}
    </div>
  );
}
