import { EventType, type Prisma } from "@prisma/client";

import { getGamePresetsForType } from "@/lib/event-game-presets";
import { prisma } from "@/server/db";

export async function seedDefaultGamesForEvent(
  eventId: string,
  type: EventType,
): Promise<void> {
  const presets = getGamePresetsForType(type);
  await prisma.eventGame.createMany({
    data: presets.map((preset, index) => ({
      eventId,
      title: preset.title,
      description: preset.description,
      presetKey: preset.presetKey,
      sortOrder: index,
      enabled: true,
      fields: preset.fields as unknown as Prisma.InputJsonValue,
      coverImage: preset.coverImage ?? null,
    })),
  });
}

export type { EventGameField, GamePreset } from "@/lib/event-game-presets";
export { getGamePresetsForType } from "@/lib/event-game-presets";
