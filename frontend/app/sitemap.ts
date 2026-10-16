import type { MetadataRoute } from "next";
const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/create", "/templates", "/about", "/privacy", "/terms", "/feedback"].map((p) => ({ url: `${site}${p}` }));
}
