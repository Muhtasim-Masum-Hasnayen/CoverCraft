import { SAMPLE, FormState } from "@/lib/form";
import type { TemplateInfo } from "@/lib/templates";

export function sampleFor(t: TemplateInfo): FormState {
  const p = structuredClone(SAMPLE);
  p.design = { ...p.design, template_id: t.id, accent: t.accent, font: t.font };
  return p;
}