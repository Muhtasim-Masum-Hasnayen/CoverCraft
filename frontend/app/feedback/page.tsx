"use client";

import { useState } from "react";

const FEEDBACK_URL = process.env.NEXT_PUBLIC_FEEDBACK_URL ?? "";
type State = { kind: "idle" } | { kind: "sending" } | { kind: "ok" } | { kind: "error"; text: string };

export default function FeedbackPage() {
  const [f, setF] = useState({ name: "", email: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<State>({ kind: "idle" });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!f.message.trim()) errs.message = "Please write a message.";
    else if (f.message.length > 2000) errs.message = "Keep it under 2000 characters.";
    if (f.email && !/^\S+@\S+\.\S+$/.test(f.email)) errs.email = "Enter a valid email or leave it empty.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    if (!FEEDBACK_URL) {
      setState({ kind: "error", text: "Feedback submission is not configured on this deployment yet, so your message was not sent." });
      return;
    }
    setState({ kind: "sending" });
    try {
      const res = await fetch(FEEDBACK_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
      if (!res.ok) throw new Error(String(res.status));
      setState({ kind: "ok" }); setF({ name: "", email: "", message: "" });
    } catch {
      setState({ kind: "error", text: "Could not send your feedback. Please try again later." });
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <h1 className="text-3xl font-bold">Feedback</h1>
      <p className="mb-6 mt-2 text-navy-500">Found a layout problem or have an idea? Tell us.</p>
      <form onSubmit={submit} noValidate className="card space-y-4 p-6">
        <div><label htmlFor="fb-name" className="label">Name (optional)</label>
          <input id="fb-name" className="input" maxLength={100} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
        <div><label htmlFor="fb-email" className="label">Email (optional)</label>
          <input id="fb-email" type="email" className="input" value={f.email} aria-invalid={!!errors.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
          {errors.email && <p role="alert" className="mt-1 text-xs text-red-600">{errors.email}</p>}</div>
        <div><label htmlFor="fb-msg" className="label">Message <span className="text-red-600" aria-hidden="true">*</span></label>
          <textarea id="fb-msg" rows={5} className="input" value={f.message} aria-invalid={!!errors.message} onChange={(e) => setF({ ...f, message: e.target.value })} />
          {errors.message && <p role="alert" className="mt-1 text-xs text-red-600">{errors.message}</p>}</div>
        <button type="submit" className="btn-primary" disabled={state.kind === "sending"}>{state.kind === "sending" ? "Sending…" : "Send feedback"}</button>
        <div aria-live="polite">
          {state.kind === "ok" && <p className="text-sm text-emerald-700">Thank you. Your feedback was sent.</p>}
          {state.kind === "error" && <p role="alert" className="text-sm text-red-700">{state.text}</p>}
        </div>
      </form>
    </div>
  );
}
