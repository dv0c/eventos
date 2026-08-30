import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["el", "en"],
  defaultLocale: "el",
});

export type Locale = (typeof routing.locales)[number];
