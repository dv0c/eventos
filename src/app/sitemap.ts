import type { MetadataRoute } from "next";

import { routing } from "@/i18n/routing";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://eventos.gr";

const staticPaths = [
  "",
  "/features",
  "/pricing",
  "/for-planners",
  "/for-businesses",
  "/about",
  "/contact",
  "/login",
  "/register",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of routing.locales) {
    for (const path of staticPaths) {
      entries.push({
        url: `${BASE_URL}/${locale}${path}`,
        lastModified: new Date(),
        changeFrequency: path === "" ? "weekly" : "monthly",
        priority: path === "" ? 1 : 0.7,
      });
    }
  }

  return entries;
}
