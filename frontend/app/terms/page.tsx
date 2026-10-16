import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms of Service", description: "Terms for using CoverCraft." };

export default function Terms() {
  return (
    <article className="mx-auto max-w-3xl space-y-4 px-4 py-12">
      <h1 className="text-3xl font-bold">Terms of Service</h1>
      <p className="text-sm text-navy-500">Initial terms for the guest-mode version.</p>
      <h2 className="pt-4 text-xl font-semibold">The service</h2>
      <p className="text-navy-500">CoverCraft generates academic cover pages as PDF and DOCX files from the information you provide.</p>
      <h2 className="pt-4 text-xl font-semibold">Your responsibilities</h2>
      <p className="text-navy-500">You are responsible for the accuracy of what you enter and for confirming that the result meets your institution&apos;s formatting and submission requirements. Only upload logos you have the right to use.</p>
      <h2 className="pt-4 text-xl font-semibold">Accuracy and availability</h2>
      <p className="text-navy-500">Documents may look slightly different in different programs, and Word may substitute fonts that are not installed. The service is provided as is, without guarantees of uninterrupted availability.</p>
    </article>
  );
}
