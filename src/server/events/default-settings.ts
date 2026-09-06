import type { Prisma } from "@prisma/client";

export const DEFAULT_EVENT_SETTINGS = {
  isPublic: true,
  enableGallery: true,
  enableWall: true,
  enableSongRequests: true,
} satisfies Prisma.EventSettingsCreateWithoutEventInput;
