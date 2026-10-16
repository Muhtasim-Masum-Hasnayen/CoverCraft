import { Suspense } from "react";
import type { Metadata } from "next";
import CreateStudio from "@/components/CreateStudio";

export const metadata: Metadata = { title: "Create Cover Page", description: "Fill in your details, preview the cover page live, then download it as PDF or DOCX." };

export default function CreatePage() {
  return (
    <Suspense fallback={<p className="p-8 text-center text-navy-500">Loading…</p>}>
      <CreateStudio />
    </Suspense>
  );
}
