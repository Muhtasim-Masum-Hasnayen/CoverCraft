import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy", description: "What CoverCraft collects and how it is used." };

export default function Privacy() {
  return (
    <article className="mx-auto max-w-3xl space-y-4 px-4 py-12">
      <h1 className="text-3xl font-bold">Privacy Policy</h1>
      <p className="text-sm text-navy-500">Initial version. This describes how the current guest-mode version behaves.</p>
      <h2 className="pt-4 text-xl font-semibold">What we handle</h2>
      <p className="text-navy-500">The details you type (names, student IDs, course and institution information) and an optional logo image. They are sent to the CoverCraft server only when you preview or download, to build your document.</p>
      <h2 className="pt-4 text-xl font-semibold">Retention</h2>
      <p className="text-navy-500">The server does not store your details, logo or generated files. Server logs are written without the content of your documents. Your draft (without the logo) is saved in your own browser&apos;s local storage so you do not lose work; use &ldquo;Reset form&rdquo; or clear your browser data to remove it.</p>
      <h2 className="pt-4 text-xl font-semibold">Accounts and deletion</h2>
      <p className="text-navy-500">There are no accounts, so there is no account data to delete. If feedback collection is enabled, messages you send through the feedback form may be stored by the service that receives them; contact us through that form to ask for deletion.</p>
      <h2 className="pt-4 text-xl font-semibold">Hosting providers</h2>
      <p className="text-navy-500">Requests pass through the hosting providers used to run the site, which may keep standard technical logs such as IP addresses.</p>
    </article>
  );
}
