/** Logical story canvas design space (9:16). */
export const STORY_WIDTH = 1080;
export const STORY_HEIGHT = 1920;
export const STORY_DOC_VERSION = 1;

export type StoryElementType =
  | "image"
  | "video"
  | "text"
  | "drawing"
  | "sticker";

export type StoryBackground =
  | { kind: "solid"; color: string }
  | { kind: "gradient"; from: string; to: string; angle?: number }
  | { kind: "image"; src: string };

export type ImageAdjustments = {
  brightness: number; // -100..100
  contrast: number;
  saturation: number;
  warmth: number;
  blur: number; // 0..20
};

export type StoryFilterId =
  | "original"
  | "warm"
  | "cool"
  | "vintage"
  | "bw"
  | "fade";

export type StoryElementBase = {
  id: string;
  type: StoryElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scale: number;
  zIndex: number;
  opacity: number;
};

export type ImageElement = StoryElementBase & {
  type: "image";
  src: string;
  objectUrl?: boolean;
  crop?: { x: number; y: number; width: number; height: number };
  adjustments: ImageAdjustments;
  filter: StoryFilterId;
};

export type VideoElement = StoryElementBase & {
  type: "video";
  src: string;
  objectUrl?: boolean;
  poster?: string | null;
};

export type TextElement = StoryElementBase & {
  type: "text";
  text: string;
  fontFamily: string;
  fontSize: number;
  color: string;
  align: "left" | "center" | "right";
  bold: boolean;
  italic: boolean;
  highlight: string | null;
};

export type DrawingStroke = {
  id: string;
  color: string;
  size: number;
  points: Array<{ x: number; y: number }>;
  erase?: boolean;
};

export type DrawingElement = StoryElementBase & {
  type: "drawing";
  strokes: DrawingStroke[];
};

/** Reserved for event logo / hashtag / custom stickers. */
export type StickerElement = StoryElementBase & {
  type: "sticker";
  stickerId: string;
  src: string;
  label?: string;
};

export type StoryElement =
  | ImageElement
  | VideoElement
  | TextElement
  | DrawingElement
  | StickerElement;

export type StoryDocument = {
  version: typeof STORY_DOC_VERSION;
  width: typeof STORY_WIDTH;
  height: typeof STORY_HEIGHT;
  background: StoryBackground;
  elements: StoryElement[];
};

export const DEFAULT_ADJUSTMENTS: ImageAdjustments = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  warmth: 0,
  blur: 0,
};

export function createEmptyStory(
  background: StoryBackground = { kind: "solid", color: "#0f0f12" },
): StoryDocument {
  return {
    version: STORY_DOC_VERSION,
    width: STORY_WIDTH,
    height: STORY_HEIGHT,
    background,
    elements: [],
  };
}

/** Text layers always stack above image/video/drawing (band starts here). */
export const TEXT_LAYER_Z_BASE = 1_000;

export function nextZIndex(elements: StoryElement[]): number {
  if (elements.length === 0) return 1;
  return Math.max(...elements.map((el) => el.zIndex)) + 1;
}

/** Next z-index within the correct band so text never ends up behind media. */
export function nextZIndexFor(
  elements: StoryElement[],
  type: StoryElement["type"],
): number {
  const isText = type === "text";
  const peers = elements.filter((el) =>
    isText ? el.type === "text" : el.type !== "text",
  );
  if (isText) {
    const maxPeer = peers.length
      ? Math.max(...peers.map((el) => el.zIndex))
      : TEXT_LAYER_Z_BASE;
    return Math.max(maxPeer, TEXT_LAYER_Z_BASE) + 1;
  }
  const maxPeer = peers.length ? Math.max(...peers.map((el) => el.zIndex)) : 0;
  return Math.min(Math.max(maxPeer + 1, 1), TEXT_LAYER_Z_BASE - 1);
}

/** Stable paint order: non-text under text, then zIndex within each band. */
export function compareStoryElements(a: StoryElement, b: StoryElement): number {
  const aText = a.type === "text" ? 1 : 0;
  const bText = b.type === "text" ? 1 : 0;
  if (aText !== bText) return aText - bText;
  return a.zIndex - b.zIndex;
}

export function newElementId(): string {
  return `el_${Math.random().toString(36).slice(2, 10)}`;
}
