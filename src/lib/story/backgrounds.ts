import type { StoryBackground } from "@/lib/story/types";

export type BackgroundPreset = {
  id: string;
  labelKey: string;
  background: StoryBackground;
};

export const STORY_BACKGROUND_PRESETS: BackgroundPreset[] = [
  {
    id: "ink",
    labelKey: "bgInk",
    background: { kind: "solid", color: "#0f0f12" },
  },
  {
    id: "slate",
    labelKey: "bgSlate",
    background: { kind: "solid", color: "#1e293b" },
  },
  {
    id: "cream",
    labelKey: "bgCream",
    background: { kind: "solid", color: "#f5f0e8" },
  },
  {
    id: "wine",
    labelKey: "bgWine",
    background: { kind: "solid", color: "#3b1c24" },
  },
  {
    id: "dusk",
    labelKey: "bgDusk",
    background: {
      kind: "gradient",
      from: "#1a1423",
      to: "#4a3728",
      angle: 160,
    },
  },
  {
    id: "ocean",
    labelKey: "bgOcean",
    background: {
      kind: "gradient",
      from: "#0c1b2a",
      to: "#1d4e6b",
      angle: 145,
    },
  },
  {
    id: "gold",
    labelKey: "bgGold",
    background: {
      kind: "gradient",
      from: "#1c1410",
      to: "#8a6a3c",
      angle: 155,
    },
  },
  {
    id: "forest",
    labelKey: "bgForest",
    background: {
      kind: "gradient",
      from: "#0f1a14",
      to: "#2f5d46",
      angle: 150,
    },
  },
];

export function backgroundCss(bg: StoryBackground): string {
  if (bg.kind === "solid") return bg.color;
  if (bg.kind === "gradient") {
    const angle = bg.angle ?? 160;
    return `linear-gradient(${angle}deg, ${bg.from}, ${bg.to})`;
  }
  return `center / cover no-repeat url(${JSON.stringify(bg.src)})`;
}
