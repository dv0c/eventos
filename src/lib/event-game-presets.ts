import { EventType } from "@prisma/client";

export type EventGameField = {
  id: string;
  type: "prompt" | "photo" | "choice";
  label: string;
  options?: string[];
  required?: boolean;
};

export type EventGameMode = "photo" | "collage";

export type GamePreset = {
  presetKey: string;
  title: string;
  description: string;
  mode?: EventGameMode;
  coverImage?: string;
  fields: EventGameField[];
};

export function resolveGameMode(game: {
  mode?: string | null;
  presetKey?: string | null;
}): EventGameMode {
  if (game.mode === "collage" || game.mode === "photo") return game.mode;
  if (game.presetKey === "collage") return "collage";
  return "photo";
}

const SHARED_PRESETS: GamePreset[] = [
  {
    presetKey: "group-selfie",
    title: "Group selfie",
    description: "Gather friends and take a group selfie.",
    mode: "photo",
    coverImage: "/album/challenges/group-selfie.png",
    fields: [{ id: "photo", type: "photo", label: "Upload your selfie", required: true }],
  },
  {
    presetKey: "best-smile",
    title: "Best smile",
    description: "Capture the brightest smile of the night.",
    mode: "photo",
    coverImage: "/album/challenges/best-smile.png",
    fields: [{ id: "photo", type: "photo", label: "Upload a smiling photo", required: true }],
  },
  {
    presetKey: "dance-floor",
    title: "Dance floor",
    description: "Show us your best move on the dance floor.",
    mode: "photo",
    coverImage: "/album/challenges/dance-floor.png",
    fields: [{ id: "photo", type: "photo", label: "Upload a dance photo", required: true }],
  },
  {
    presetKey: "collage",
    title: "Collage",
    description: "Create a collage of your favorite moments.",
    mode: "collage",
    coverImage: "/album/challenges/collage.png",
    fields: [{ id: "photo", type: "photo", label: "Upload collage photos", required: true }],
  },
];

const PRESETS_BY_TYPE: Record<EventType, GamePreset[]> = {
  [EventType.WEDDING]: [
    {
      presetKey: "couple",
      title: "Couple moment",
      description: "A sweet photo with the couple.",
      mode: "photo",
      coverImage: "/album/challenges/couple.png",
      fields: [{ id: "photo", type: "photo", label: "Upload your photo", required: true }],
    },
    {
      presetKey: "five-people",
      title: "Table of five",
      description: "Snap a photo with at least five people.",
      mode: "photo",
      coverImage: "/album/challenges/five-people.png",
      fields: [{ id: "photo", type: "photo", label: "Upload a group photo", required: true }],
    },
    ...SHARED_PRESETS,
  ],
  [EventType.ENGAGEMENT]: [
    {
      presetKey: "couple",
      title: "Couple moment",
      description: "Celebrate the engaged couple.",
      mode: "photo",
      coverImage: "/album/challenges/couple.png",
      fields: [{ id: "photo", type: "photo", label: "Upload your photo", required: true }],
    },
    ...SHARED_PRESETS,
  ],
  [EventType.BAPTISM]: [
    {
      presetKey: "family-moment",
      title: "Family moment",
      description: "A warm photo with the family.",
      mode: "photo",
      coverImage: "/album/challenges/group-selfie.png",
      fields: [{ id: "photo", type: "photo", label: "Upload your photo", required: true }],
    },
    ...SHARED_PRESETS,
  ],
  [EventType.BIRTHDAY]: [
    {
      presetKey: "birthday-hero",
      title: "Birthday hero",
      description: "A photo with the birthday star.",
      mode: "photo",
      coverImage: "/album/challenges/best-smile.png",
      fields: [{ id: "photo", type: "photo", label: "Upload your photo", required: true }],
    },
    ...SHARED_PRESETS,
  ],
  [EventType.PARTY]: SHARED_PRESETS,
  [EventType.CORPORATE]: [
    {
      presetKey: "team-shot",
      title: "Team shot",
      description: "Get your team together for a photo.",
      mode: "photo",
      coverImage: "/album/challenges/group-selfie.png",
      fields: [{ id: "photo", type: "photo", label: "Upload a team photo", required: true }],
    },
    ...SHARED_PRESETS.filter((p) => p.presetKey !== "dance-floor"),
  ],
  [EventType.CONFERENCE]: [
    {
      presetKey: "speaker-selfie",
      title: "Speaker selfie",
      description: "A selfie with a speaker or host.",
      mode: "photo",
      coverImage: "/album/challenges/group-selfie.png",
      fields: [{ id: "photo", type: "photo", label: "Upload your selfie", required: true }],
    },
    {
      presetKey: "networking",
      title: "Networking",
      description: "Photo with someone you just met.",
      mode: "photo",
      coverImage: "/album/challenges/five-people.png",
      fields: [{ id: "photo", type: "photo", label: "Upload a networking photo", required: true }],
    },
  ],
  [EventType.OTHER]: SHARED_PRESETS,
};

export function getGamePresetsForType(type: EventType): GamePreset[] {
  return PRESETS_BY_TYPE[type] ?? SHARED_PRESETS;
}
