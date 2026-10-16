import type { Metadata } from "next";

export const metadata: Metadata = { title: "About", description: "Why CoverCraft exists and who it is for." };

export default function About() {
  return (
    <article className="mx-auto max-w-3xl space-y-4 px-4 py-12">
      <h1 className="text-3xl font-bold">About CoverCraft</h1>
      <p className="text-navy-500">CoverCraft helps university and college students create clean academic cover pages without fighting a word processor. It is designed first for students in Bangladesh and works for students anywhere.</p>
      <h2 className="pt-4 text-xl font-semibold">Who it is for</h2>
      <p className="text-navy-500">Anyone submitting assignments, lab reports, project or internship reports, research papers, theses and case studies, individually or in groups.</p>
      <h2 className="pt-4 text-xl font-semibold">Our approach to formatting</h2>
      <p className="text-navy-500">Every template has its own real PDF and Word renderer, built from the same layout definitions as the on-screen preview. The Word file is made of real text and tables so you can keep editing it. Templates are general-purpose, so please confirm your institution&apos;s own requirements before you submit.</p>
    </article>
  );
}
