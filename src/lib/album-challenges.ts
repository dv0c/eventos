export const ALBUM_CHALLENGE_IDS = [
  "couple",
  "five-people",
  "group-selfie",
  "dance-floor",
  "best-smile",
  "collage",
] as const;

export type AlbumChallengeId = (typeof ALBUM_CHALLENGE_IDS)[number];

export function isAlbumChallengeId(value: string | null | undefined): value is AlbumChallengeId {
  return Boolean(value && (ALBUM_CHALLENGE_IDS as readonly string[]).includes(value));
}

export const ALBUM_CHALLENGES: {
  id: AlbumChallengeId;
  image: string;
  /** Needs 2–4 library images for client-side collage */
  collage?: boolean;
}[] = [
  { id: "couple", image: "/album/challenges/couple.png" },
  { id: "five-people", image: "/album/challenges/five-people.png" },
  { id: "group-selfie", image: "/album/challenges/group-selfie.png" },
  { id: "dance-floor", image: "/album/challenges/dance-floor.png" },
  { id: "best-smile", image: "/album/challenges/best-smile.png" },
  { id: "collage", image: "/album/challenges/collage.png", collage: true },
];
