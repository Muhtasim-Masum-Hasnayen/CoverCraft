import type { Metadata } from "next";
import TemplateGallery from "@/components/TemplateGallery";

export const metadata: Metadata = { title: "Templates", description: "Browse six distinct academic cover page templates." };

export default function TemplatesPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-bold">Templates</h1>
      <p className="mb-8 mt-2 max-w-2xl text-navy-500">Six layouts, each with its own PDF and Word version. Previews below use sample data.</p>
      <TemplateGallery />
    </div>
  );
}
