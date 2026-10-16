export type TemplateInfo = {
  id: string; name: string; category: string; description: string;
  font: string; accent: string; border: string;
};

// Mirrors backend/templates/layouts.py (the backend remains the source of truth for rendering).
export const TEMPLATES: TemplateInfo[] = [
  { id: "classic", name: "Classic Academic", category: "Formal", font: "Times New Roman", accent: "#0E4D92", border: "none",
    description: "Centered institution header, traditional serif typography and clear Submitted To / By sections." },
  { id: "modern_minimal", name: "Modern Minimal", category: "Minimal", font: "Arial", accent: "#0891B2", border: "none",
    description: "Left-aligned, large title, generous whitespace and a subtle accent." },
  { id: "corporate", name: "Corporate Report", category: "Professional", font: "Arial", accent: "#1E3A8A", border: "none",
    description: "Bold accent bar, structured information table and strong typographic hierarchy." },
  { id: "elegant_border", name: "Elegant Border", category: "Formal", font: "Times New Roman", accent: "#7C2D12", border: "double",
    description: "Double page border with centered, balanced details." },
  { id: "lab_report", name: "Technical Lab Report", category: "Technical", font: "Arial", accent: "#0F766E", border: "none",
    description: "Course code and title emphasised; built for CSE, engineering and science labs." },
  { id: "research_thesis", name: "Research & Thesis", category: "Research", font: "Times New Roman", accent: "#1F2937", border: "none",
    description: "Formal hierarchy with author and supervisor blocks and room for long titles." },
];

export const DOC_TYPES = [
  { id: "assignment", label: "Assignment", template: "classic" },
  { id: "homework", label: "Homework", template: "modern_minimal" },
  { id: "lab_report", label: "Lab Report", template: "lab_report" },
  { id: "project_report", label: "Project Report", template: "corporate" },
  { id: "research_paper", label: "Research Paper", template: "research_thesis" },
  { id: "internship_report", label: "Internship Report", template: "corporate" },
  { id: "thesis", label: "Thesis / Dissertation", template: "research_thesis" },
  { id: "case_study", label: "Case Study", template: "modern_minimal" },
  { id: "seminar_report", label: "Seminar Report", template: "elegant_border" },
  { id: "other", label: "Other", template: "classic" },
];

export const FONTS = ["Times New Roman", "Arial", "DejaVu Sans"];
export const CATEGORIES = ["All", ...Array.from(new Set(TEMPLATES.map((t) => t.category)))];
