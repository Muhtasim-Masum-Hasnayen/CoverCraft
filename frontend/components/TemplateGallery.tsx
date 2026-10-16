"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import CoverPreview from "./CoverPreview";
import { sampleFor } from "@/lib/samples";
import { CATEGORIES, TEMPLATES, TemplateInfo } from "@/lib/templates";



export default function TemplateGallery({ featured = false }: { featured?: boolean }) {
  const [cat, setCat] = useState("All");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<TemplateInfo | null>(null);

  const list = useMemo(() => {
    const base = featured ? TEMPLATES.slice(0, 3) : TEMPLATES;
    return base.filter((t) => (cat === "All" || t.category === cat) && t.name.toLowerCase().includes(q.trim().toLowerCase()));
  }, [cat, q, featured]);

  return (
    <div>
      {!featured && (
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div role="group" aria-label="Filter by category" className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button key={c} type="button" aria-pressed={cat === c} onClick={() => setCat(c)}
                className={`rounded-full border px-4 py-1.5 text-sm font-medium ${cat === c ? "border-navy-900 bg-navy-900 text-white" : "border-slate-300 bg-white"}`}>{c}</button>
            ))}
          </div>
          <div className="relative w-full sm:w-64">
            <Search size={16} className="pointer-events-none absolute left-3 top-3 text-slate-400" />
            <label htmlFor="tpl-search" className="sr-only">Search templates</label>
            <input id="tpl-search" className="input pl-9" placeholder="Search templates" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
      )}

      {list.length === 0 && <p className="py-12 text-center text-navy-500">No templates match your search.</p>}
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((t) => (
          <li key={t.id} className="card flex flex-col p-4">
            <div className="flex justify-center rounded-xl bg-slate-100 p-4"><CoverPreview payload={sampleFor(t)} width={230} label={`${t.name} preview`} /></div>
            <div className="mt-4 flex items-start justify-between gap-2">
              <h3 className="font-semibold">{t.name}</h3>
              <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">{t.category}</span>
            </div>
            <p className="mt-1 flex-1 text-sm text-navy-500">{t.description}</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button type="button" className="btn-outline" onClick={() => setOpen(t)}>Preview</button>
              <Link href={`/create?template=${t.id}`} className="btn-primary">Use Template</Link>
            </div>
          </li>
        ))}
      </ul>

      {open && (
        <div role="dialog" aria-modal="true" aria-label={`${open.name} preview`} className="fixed inset-0 z-50 overflow-auto bg-navy-900/70 p-4" onClick={() => setOpen(null)}>
          <button type="button" aria-label="Close preview" className="fixed right-4 top-4 rounded-full bg-white p-2" onClick={() => setOpen(null)}><X size={20} /></button>
          <div className="mx-auto w-fit space-y-4" onClick={(e) => e.stopPropagation()}>
            <CoverPreview payload={sampleFor(open)} width={Math.min(640, typeof window === "undefined" ? 640 : window.innerWidth - 32)} />
            <Link href={`/create?template=${open.id}`} className="btn-primary w-full">Use {open.name}</Link>
          </div>
        </div>
      )}
    </div>
  );
}
