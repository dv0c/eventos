import {
  Caveat,
  Inter,
  JetBrains_Mono,
  Merriweather,
  Noto_Sans,
  Oswald,
  Playfair_Display,
  Roboto,
  Roboto_Condensed,
  Space_Grotesk,
} from "next/font/google";

const classic = Inter({
  subsets: ["latin", "greek"],
  weight: ["400", "700"],
  variable: "--story-font-classic",
  display: "swap",
});

const modern = Roboto({
  subsets: ["latin", "greek"],
  weight: ["400", "700"],
  variable: "--story-font-modern",
  display: "swap",
});

const directional = Roboto_Condensed({
  subsets: ["latin", "greek"],
  weight: ["400", "700"],
  variable: "--story-font-directional",
  display: "swap",
});

const literature = Merriweather({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--story-font-literature",
  display: "swap",
});

const elegant = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--story-font-elegant",
  display: "swap",
});

const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--story-font-display",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--story-font-mono",
  display: "swap",
});

const condensed = Oswald({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--story-font-condensed",
  display: "swap",
});

const script = Caveat({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--story-font-script",
  display: "swap",
});

const greekSans = Noto_Sans({
  subsets: ["latin", "greek"],
  weight: ["400", "700"],
  variable: "--story-font-greek",
  display: "swap",
});

/**
 * Apply on StoryStudio root. Importing the font modules registers @font-face;
 * CSS variables keep families available for any var()-based fallbacks.
 */
export const storyFontsClassName = [
  classic.variable,
  modern.variable,
  directional.variable,
  literature.variable,
  elegant.variable,
  display.variable,
  mono.variable,
  condensed.variable,
  script.variable,
  greekSans.variable,
].join(" ");

export type StoryFontDef = {
  id: string;
  family: string;
  labelKey: string;
  italicPill?: boolean;
};

/** Concrete next/font family names — same string for DOM preview and canvas. */
export const TEXT_FONTS: StoryFontDef[] = [
  { id: "classic", family: classic.style.fontFamily, labelKey: "fontClassic" },
  { id: "modern", family: modern.style.fontFamily, labelKey: "fontModern" },
  {
    id: "directional",
    family: directional.style.fontFamily,
    labelKey: "fontDirectional",
  },
  {
    id: "literature",
    family: literature.style.fontFamily,
    labelKey: "fontLiterature",
  },
  {
    id: "elegant",
    family: elegant.style.fontFamily,
    labelKey: "fontElegant",
    italicPill: true,
  },
  { id: "display", family: display.style.fontFamily, labelKey: "fontDisplay" },
  { id: "mono", family: mono.style.fontFamily, labelKey: "fontMono" },
  {
    id: "condensed",
    family: condensed.style.fontFamily,
    labelKey: "fontCondensed",
  },
  { id: "script", family: script.style.fontFamily, labelKey: "fontScript" },
  { id: "greek", family: greekSans.style.fontFamily, labelKey: "fontGreek" },
];

export const TEXT_COLORS = [
  "#ffffff",
  "#f5f5f5",
  "#0f0f12",
  "#525252",
  "#C4A574",
  "#fbbf24",
  "#fb923c",
  "#f87171",
  "#fb7185",
  "#e879f9",
  "#a78bfa",
  "#818cf8",
  "#38bdf8",
  "#22d3ee",
  "#34d399",
  "#4ade80",
  "#a3e635",
  "#facc15",
];

export function resolveStoryFontFamily(family: string): string {
  return family;
}
