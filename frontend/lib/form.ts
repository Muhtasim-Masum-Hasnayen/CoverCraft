export type Member = { name: string; student_id: string; role: string };

export type FormState = {
  document: {
    type: string; title: string; subtitle: string; course_code: string; course_title: string;
    term: string; section: string; academic_year: string; submission_date: string; notes: string;
  };
  institution: { name: string; faculty: string; department: string; program: string; address: string; logo_base64: string };
  submitted_to: { name: string; designation: string; department: string; institution: string };
  submitted_by: {
    mode: "individual" | "group"; members: Member[];
    department: string; program: string; term: string; section: string; batch: string;
  };
  design: {
    template_id: string; accent: string; font: string; show_logo: boolean; border: string;
    show_header: boolean; density: string; footer: string;
  };
};

export const emptyMember = (): Member => ({ name: "", student_id: "", role: "" });

export function emptyForm(): FormState {
  return {
    document: { type: "assignment", title: "", subtitle: "", course_code: "", course_title: "", term: "", section: "", academic_year: "", submission_date: "", notes: "" },
    institution: { name: "", faculty: "", department: "", program: "", address: "", logo_base64: "" },
    submitted_to: { name: "", designation: "", department: "", institution: "" },
    submitted_by: { mode: "individual", members: [emptyMember()], department: "", program: "", term: "", section: "", batch: "" },
    design: { template_id: "classic", accent: "#0E4D92", font: "Times New Roman", show_logo: true, border: "auto", show_header: true, density: "normal", footer: "" },
  };
}

export const todayISO = () => new Date().toISOString().slice(0, 10);

export function getIn(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, k) => (acc == null ? undefined : (acc as Record<string, unknown>)[k]), obj);
}

export function setIn<T>(obj: T, path: string, value: unknown): T {
  const next = structuredClone(obj) as Record<string, unknown>;
  const keys = path.split(".");
  let cur: Record<string, unknown> = next;
  for (let i = 0; i < keys.length - 1; i++) cur = cur[keys[i]] as Record<string, unknown>;
  cur[keys[keys.length - 1]] = value;
  return next as T;
}

// Same rules as backend/validators.py (the backend re-validates everything).
const REQUIRED: [string, string][] = [
  ["document.title", "Title is required."],
  ["document.submission_date", "Submission date is required."],
  ["institution.name", "University name is required."],
  ["institution.department", "Department is required."],
  ["submitted_to.name", "Teacher / supervisor name is required."],
];
const MAX: Record<string, number> = {
  "document.title": 300, "document.subtitle": 300, "document.course_code": 30, "document.course_title": 150,
  "document.term": 40, "document.section": 30, "document.academic_year": 20, "document.notes": 400,
  "institution.name": 200, "institution.faculty": 150, "institution.department": 150, "institution.program": 150, "institution.address": 250,
  "submitted_to.name": 150, "submitted_to.designation": 150, "submitted_to.department": 150, "submitted_to.institution": 200,
  "submitted_by.department": 150, "submitted_by.program": 150, "submitted_by.term": 40, "submitted_by.section": 30, "submitted_by.batch": 30,
  "design.footer": 150,
};

export function validate(form: FormState): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const [path, msg] of REQUIRED) if (!String(getIn(form, path) ?? "").trim()) errors[path] = msg;
  for (const [path, max] of Object.entries(MAX)) {
    const v = String(getIn(form, path) ?? "");
    if (v.length > max) errors[path] = `Must be at most ${max} characters.`;
  }
  form.submitted_by.members.forEach((m, i) => {
    if (!m.name.trim()) errors[`submitted_by.members.${i}.name`] = "Name is required.";
    if (!m.student_id.trim()) errors[`submitted_by.members.${i}.student_id`] = "Student ID is required.";
    if (m.name.length > 120) errors[`submitted_by.members.${i}.name`] = "Must be at most 120 characters.";
    if (m.student_id.length > 40) errors[`submitted_by.members.${i}.student_id`] = "Must be at most 40 characters.";
    if (m.role.length > 60) errors[`submitted_by.members.${i}.role`] = "Must be at most 60 characters.";
  });
  if (!/^#[0-9a-fA-F]{6}$/.test(form.design.accent)) errors["design.accent"] = "Use a hex colour like #0E4D92.";
  return errors;
}

/** Fill required-but-empty fields with placeholders so the preview is useful while typing. */
export function previewPayload(form: FormState): FormState {
  const p = structuredClone(form);
  p.document.title ||= "Your Assignment Title";
  p.document.submission_date ||= todayISO();
  p.institution.name ||= "Your University Name";
  p.institution.department ||= "Your Department";
  p.submitted_to.name ||= "Teacher Name";
  p.submitted_by.members = p.submitted_by.members.map((m) => ({
    ...m, name: m.name || "Student Name", student_id: m.student_id || "Student ID",
  }));
  if (p.submitted_by.mode === "individual") p.submitted_by.members = p.submitted_by.members.slice(0, 1);
  return p;
}

export const SAMPLE: FormState = {
  document: {
    type: "assignment", title: "Software Testing Techniques and Test Case Design", subtitle: "A study of black-box methods",
    course_code: "CSE 4203", course_title: "Software Testing and Quality Assurance", term: "Fall 2026", section: "A",
    academic_year: "2026-27", submission_date: "2026-10-16", notes: "",
  },
  institution: { name: "Northern Metropolitan University", faculty: "Faculty of Science and Engineering", department: "Department of Computer Science and Engineering", program: "B.Sc. in CSE", address: "Dhaka, Bangladesh", logo_base64: "" },
  submitted_to: { name: "Dr. Rahman Chowdhury", designation: "Associate Professor", department: "Department of CSE", institution: "" },
  submitted_by: { mode: "individual", members: [{ name: "Ayesha Siddika", student_id: "2021-1-60-045", role: "" }], department: "", program: "B.Sc. in CSE", term: "Fall 2026", section: "A", batch: "58" },
  design: { template_id: "classic", accent: "#0E4D92", font: "Times New Roman", show_logo: false, border: "auto", show_header: true, density: "normal", footer: "" },
};
