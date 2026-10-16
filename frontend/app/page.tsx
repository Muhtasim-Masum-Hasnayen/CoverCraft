import Link from "next/link";
import { ArrowRight, FileDown, LayoutTemplate, Palette, Timer } from "lucide-react";
import CoverPreview from "@/components/CoverPreview";
import TemplateGallery from "@/components/TemplateGallery";
import { sampleFor } from "@/lib/samples";
import { DOC_TYPES, TEMPLATES } from "@/lib/templates";

const STEPS = [
  { n: 1, t: "Enter your details", d: "Course, institution, teacher and student information in one organised form." },
  { n: 2, t: "Preview live", d: "See the A4 cover page update as you type and switch templates without losing data." },
  { n: 3, t: "Download", d: "Get a print-ready PDF or an editable Word document." },
];
const BENEFITS = [
  { i: Timer, t: "Fast", d: "Fill the form once and get a finished cover page in minutes." },
  { i: LayoutTemplate, t: "Properly formatted", d: "Aligned, consistent layouts that handle long titles and group submissions." },
  { i: Palette, t: "Customisable", d: "Choose template, accent colour, font, border and logo." },
  { i: FileDown, t: "Convenient", d: "PDF for printing, DOCX for editing. No account required." },
];
const FAQ = [
  ["Do I need an account?", "No. CoverCraft works in guest mode with no sign-up."],
  ["Is my information stored?", "Your draft is kept in your own browser. The server generates the file from what you send and does not save the document."],
  ["Can I edit the result?", "Yes. The DOCX download is a normal Word document made of real text and tables."],
  ["Will it match my university's rules?", "Templates are general-purpose. Please verify your institution's formatting requirements before submitting."],
  ["Does it support Bengali text?", "Not in PDF yet. English text is fully supported."],
];

export default function Home() {
  const hero = sampleFor(TEMPLATES[0]);
  return (
    <>
      <section className="bg-gradient-to-b from-brand-50 to-white">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 lg:grid-cols-2">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">Your Academic Documents, Professionally Presented.</p>
            <h1 className="mt-3 text-4xl font-bold leading-tight sm:text-5xl">Create Professional Academic Cover Pages in Minutes.</h1>
            <p className="mt-4 max-w-xl text-lg text-navy-500">Enter your academic information once, preview a clean A4 cover page, and download it as a PDF or an editable Word (DOCX) file.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/create" className="btn-primary">Create Cover Page <ArrowRight size={16} /></Link>
              <Link href="/templates" className="btn-outline">Explore Templates</Link>
            </div>
          </div>
          <div className="flex justify-center"><CoverPreview payload={hero} width={360} label="Sample cover page" /></div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14" aria-labelledby="types">
        <h2 id="types" className="text-2xl font-bold">What are you submitting?</h2>
        <ul className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-5">
          {DOC_TYPES.map((t) => (
            <li key={t.id}><Link href={`/create?type=${t.id}`} className="card block px-4 py-5 text-sm font-semibold hover:border-brand-500">{t.label}</Link></li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-6" aria-labelledby="featured">
        <div className="mb-6 flex items-end justify-between">
          <h2 id="featured" className="text-2xl font-bold">Featured templates</h2>
          <Link href="/templates" className="text-sm font-semibold text-brand-700">View all →</Link>
        </div>
        <TemplateGallery featured />
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14" aria-labelledby="how">
        <h2 id="how" className="text-2xl font-bold">How it works</h2>
        <ol className="mt-6 grid gap-6 md:grid-cols-3">
          {STEPS.map((s) => (
            <li key={s.n} className="card p-6">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-600 font-bold text-white">{s.n}</span>
              <h3 className="mt-4 font-semibold">{s.t}</h3><p className="mt-1 text-sm text-navy-500">{s.d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-6" aria-labelledby="why">
        <h2 id="why" className="text-2xl font-bold">Why CoverCraft</h2>
        <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map(({ i: Icon, t, d }) => (
            <li key={t} className="card p-6"><Icon className="text-brand-600" size={24} /><h3 className="mt-3 font-semibold">{t}</h3><p className="mt-1 text-sm text-navy-500">{d}</p></li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-14" aria-labelledby="faq">
        <h2 id="faq" className="text-2xl font-bold">Frequently asked questions</h2>
        <div className="mt-6 space-y-3">
          {FAQ.map(([q, a]) => (
            <details key={q} className="card px-5 py-4"><summary className="cursor-pointer font-semibold">{q}</summary><p className="mt-2 text-sm text-navy-500">{a}</p></details>
          ))}
        </div>
      </section>
    </>
  );
}
