"use client";

import { useEffect, useState } from "react";
import { API_BASE } from "@/lib/api";
import type { FormState } from "@/lib/form";

type Line = [string, boolean];
type Block =
  | { t: "text"; text: string; size: number; bold: boolean; italic: boolean; align: "left" | "center" | "right"; color: string; before: number; after: number; caps: boolean }
  | { t: "spacer"; h: number }
  | { t: "rule"; color: string; thickness: number; width: number; align: string; before: number; after: number }
  | { t: "logo"; max_h: number; align: "left" | "center" | "right"; after: number }
  | { t: "columns"; size: number; cols: { heading: string; lines: Line[] }[] }
  | { t: "members"; size: number; heading: string; members: { name: string; student_id: string; role: string }[] }
  | { t: "kv"; size: number; rows: [string, string][] };

type Layout = {
  spec: { border: string; accent: string; font: string; footer: string; title: string };
  blocks: Block[]; scale: number; pages: number;
};

const A4_W = 595, A4_H = 842;
const FAMILY: Record<string, string> = {
  "Times New Roman": '"Times New Roman", "Liberation Serif", Times, serif',
  Arial: 'Arial, "Liberation Sans", Helvetica, sans-serif',
  "DejaVu Sans": '"DejaVu Sans", Verdana, sans-serif',
};
const JUSTIFY = { left: "flex-start", center: "center", right: "flex-end" } as const;
const cache = new Map<string, Layout>();

function Blocks({ layout, logo }: { layout: Layout; logo: string }) {
  const { spec, blocks, scale: s } = layout;
  const acc = spec.accent;
  return (
    <>
      {blocks.map((b, i) => {
        switch (b.t) {
          case "spacer":
            return <div key={i} style={{ height: b.h * s }} />;
          case "text":
            return (
              <div key={i} style={{
                fontSize: b.size * s, lineHeight: 1.28, textAlign: b.align, color: b.color,
                fontWeight: b.bold ? 700 : 400, fontStyle: b.italic ? "italic" : "normal",
                textTransform: b.caps ? "uppercase" : "none", marginTop: b.before * s, marginBottom: b.after * s,
                whiteSpace: "pre-wrap", overflowWrap: "anywhere",
              }}>{b.text}</div>
            );
          case "rule":
            return (
              <div key={i} style={{
                height: Math.max(b.thickness * s, 0.6), background: b.color, width: `${b.width * 100}%`,
                margin: `${b.before * s}px ${b.align === "center" ? "auto" : "0"} ${b.after * s}px ${b.align === "center" ? "auto" : "0"}`,
              }} />
            );
          case "logo":
            return logo ? (
              <div key={i} style={{ display: "flex", justifyContent: JUSTIFY[b.align], marginBottom: b.after * s }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logo} alt="Institution logo" style={{ height: b.max_h * s, width: "auto", maxWidth: "50%" }} />
              </div>
            ) : null;
          case "columns":
            return (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: 24 }}>
                {b.cols.map((c, ci) => (
                  <div key={ci}>
                    <div style={{ fontSize: (b.size - 1.5) * s, fontWeight: 700, color: acc, textTransform: "uppercase", borderBottom: `0.8px solid ${acc}`, paddingBottom: 4 * s, marginBottom: 5 * s }}>{c.heading}</div>
                    {c.lines.map(([text, bold], li) => (
                      <div key={li} style={{ fontSize: b.size * s, lineHeight: 1.28, fontWeight: bold ? 700 : 400, overflowWrap: "anywhere" }}>{text}</div>
                    ))}
                  </div>
                ))}
              </div>
            );
          case "members": {
            const hasRole = b.members.some((m) => m.role);
            const cell = { padding: `${3.5 * s}px 4px`, borderBottom: "0.4px solid #D1D5DB", fontSize: b.size * s, textAlign: "left" as const, overflowWrap: "anywhere" as const };
            const head = { ...cell, color: acc, fontWeight: 700, borderBottom: `1px solid ${acc}`, fontSize: (b.size - 1) * s };
            return (
              <table key={i} style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
                <thead><tr>
                  <th style={{ ...head, width: "8%" }}>#</th><th style={head}>Name</th><th style={head}>Student ID</th>{hasRole && <th style={head}>Role</th>}
                </tr></thead>
                <tbody>{b.members.map((m, mi) => (
                  <tr key={mi}><td style={cell}>{mi + 1}</td><td style={cell}>{m.name}</td><td style={cell}>{m.student_id}</td>{hasRole && <td style={cell}>{m.role}</td>}</tr>
                ))}</tbody>
              </table>
            );
          }
          case "kv":
            return (
              <table key={i} style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>{b.rows.map(([k, v], ri) => (
                  <tr key={ri}>
                    <td style={{ width: "28%", padding: `${5 * s}px 4px ${5 * s}px 0`, borderBottom: "0.4px solid #E5E7EB", fontSize: (b.size - 2) * s, fontWeight: 700, color: acc, textTransform: "uppercase" }}>{k}</td>
                    <td style={{ padding: `${5 * s}px 0`, borderBottom: "0.4px solid #E5E7EB", fontSize: b.size * s }}>{v}</td>
                  </tr>
                ))}</tbody>
              </table>
            );
        }
      })}
    </>
  );
}

export default function CoverPreview({ payload, width = 380, label = "Cover page preview" }: { payload: FormState; width?: number; label?: string }) {
  const key = JSON.stringify(payload);
  const [layout, setLayout] = useState<Layout | null>(() => cache.get(key) ?? null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const hit = cache.get(key);
    if (hit) { setLayout(hit); setError(null); return; }
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/preview-layout`, {
          method: "POST", headers: { "Content-Type": "application/json" }, body: key, signal: ctrl.signal,
        });
        if (!res.ok) throw new Error(`Preview failed (${res.status})`);
        const data = (await res.json()) as Layout;
        cache.set(key, data); if (cache.size > 40) cache.delete(cache.keys().next().value as string);
        setLayout(data); setError(null);
      } catch (e) {
        if ((e as Error).name !== "AbortError") setError("Preview is unavailable. Check that the API is running.");
      }
    }, 350);
    return () => { clearTimeout(timer); ctrl.abort(); };
  }, [key]);

  const k = width / A4_W;
  const spec = layout?.spec;
  const margin = spec && spec.border !== "none" ? 72 : 57;
  const logo = payload.design.show_logo ? payload.institution.logo_base64 : "";

  return (
    <div role="img" aria-label={label} style={{ width, height: A4_H * k }} className="relative overflow-hidden rounded-md bg-white shadow-card ring-1 ring-slate-200">
      {error && <div className="absolute inset-0 grid place-items-center p-4 text-center text-sm text-red-700">{error}</div>}
      {!layout && !error && <div className="absolute inset-0 grid place-items-center text-sm text-slate-400">Loading preview…</div>}
      {layout && spec && (
        <div style={{ width: A4_W, height: A4_H, transform: `scale(${k})`, transformOrigin: "top left", position: "relative", fontFamily: FAMILY[spec.font] ?? FAMILY.Arial, color: "#111827" }}>
          {spec.border === "thin" && <div style={{ position: "absolute", inset: 30, border: `1px solid ${spec.accent}` }} />}
          {spec.border === "double" && (<>
            <div style={{ position: "absolute", inset: 26, border: `2.4px solid ${spec.accent}` }} />
            <div style={{ position: "absolute", inset: 32, border: `0.7px solid ${spec.accent}` }} />
          </>)}
          <div style={{ position: "absolute", inset: margin, overflow: "hidden" }}>
            <Blocks layout={layout} logo={logo} />
          </div>
          {spec.footer && <div style={{ position: "absolute", bottom: 36, left: 0, right: 0, textAlign: "center", fontSize: 9, color: "#6B7280" }}>{spec.footer}</div>}
        </div>
      )}
    </div>
  );
}
