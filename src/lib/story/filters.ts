import type { ImageAdjustments, StoryFilterId } from "@/lib/story/types";

export const STORY_FILTERS: Array<{ id: StoryFilterId; labelKey: string }> = [
  { id: "original", labelKey: "filterOriginal" },
  { id: "warm", labelKey: "filterWarm" },
  { id: "cool", labelKey: "filterCool" },
  { id: "vintage", labelKey: "filterVintage" },
  { id: "bw", labelKey: "filterBw" },
  { id: "fade", labelKey: "filterFade" },
];

export function filterCss(filter: StoryFilterId, adj: ImageAdjustments): string {
  const brightness = 1 + adj.brightness / 100;
  const contrast = 1 + adj.contrast / 100;
  const saturate = 1 + adj.saturation / 100;
  const blur = Math.max(0, adj.blur);
  const warmthSepia = Math.max(0, adj.warmth) / 200;
  const coolHue = adj.warmth < 0 ? adj.warmth * 0.35 : 0;

  const parts = [
    `brightness(${brightness})`,
    `contrast(${contrast})`,
    `saturate(${saturate})`,
    blur > 0 ? `blur(${blur}px)` : "",
    warmthSepia > 0 ? `sepia(${warmthSepia})` : "",
    coolHue !== 0 ? `hue-rotate(${coolHue}deg)` : "",
  ];

  switch (filter) {
    case "warm":
      parts.push("sepia(0.22)", "saturate(1.15)");
      break;
    case "cool":
      parts.push("hue-rotate(-12deg)", "saturate(1.05)");
      break;
    case "vintage":
      parts.push("sepia(0.35)", "contrast(0.92)", "brightness(1.05)");
      break;
    case "bw":
      parts.push("grayscale(1)");
      break;
    case "fade":
      parts.push("contrast(0.88)", "brightness(1.08)", "saturate(0.85)");
      break;
    default:
      break;
  }

  return parts.filter(Boolean).join(" ");
}
