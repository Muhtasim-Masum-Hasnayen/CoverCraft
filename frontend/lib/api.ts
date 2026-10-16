// Dev default only. In production set NEXT_PUBLIC_API_BASE_URL in the hosting dashboard.
export const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000").replace(/\/$/, "");

export type ApiErrorBody = { detail?: { message?: string; errors?: Record<string, string> } };

export function filenameFromDisposition(header: string | null, fallback: string): string {
  if (!header) return fallback;
  const m = /filename="([^"]+)"/.exec(header);
  return m ? m[1] : fallback;
}
