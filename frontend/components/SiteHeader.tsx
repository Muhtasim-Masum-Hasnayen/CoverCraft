"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import BrandLogo from "./BrandLogo";

const LINKS = [
  { href: "/templates", label: "Templates" },
  { href: "/create", label: "Create" },
  { href: "/about", label: "About" },
  { href: "/feedback", label: "Feedback" },
];

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <nav aria-label="Main" className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-navy-900">
          <BrandLogo /> CoverCraft
        </Link>
        <ul className="hidden items-center gap-6 text-sm font-medium text-navy-700 md:flex">
          {LINKS.map((l) => (<li key={l.href}><Link href={l.href} className="hover:text-brand-600">{l.label}</Link></li>))}
          <li><Link href="/create" className="btn-primary">Create Cover Page</Link></li>
        </ul>
        <button type="button" className="rounded-lg p-2 md:hidden" aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen((v) => !v)}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>
      {open && (
        <ul id="mobile-menu" className="border-t border-slate-200 bg-white px-4 py-3 md:hidden">
          {LINKS.map((l) => (<li key={l.href}><Link href={l.href} onClick={() => setOpen(false)} className="block rounded-lg px-2 py-3 font-medium">{l.label}</Link></li>))}
        </ul>
      )}
    </header>
  );
}
