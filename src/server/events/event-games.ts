import { EventType, type Prisma } from "@prisma/client";

import { getGamePresetsForType, resolveGameMode } from "@/lib/event-game-presets";
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
      mode: resolveGameMode(preset),
      sortOrder: index,
      enabled: true,
      fields: preset.fields as unknown as Prisma.InputJsonValue,
      coverImage: preset.coverImage ?? null,
    })),
  });
}

export type { EventGameField, EventGameMode, GamePreset } from "@/lib/event-game-presets";
export { getGamePresetsForType, resolveGameMode } from "@/lib/event-game-presets";
