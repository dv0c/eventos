import { prisma } from "@/server/db";
import { AccessError, enforceEventAccess } from "@/server/permissions/enforce";

export class PanicServiceError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code: string,
  ) {
    super(message);
    this.name = "PanicServiceError";
  }
}

export const panicService = {
  async arm(userId: string, eventId: string) {
    await enforceEventAccess(userId, eventId, "media:manage");

    const event = await prisma.event.update({
      where: { id: eventId },
      data: { mediaPanicAt: new Date() },
      select: { id: true, mediaPanicAt: true },
    });

    return { panic: true as const, mediaPanicAt: event.mediaPanicAt!.toISOString() };
  },

  async clear(userId: string, eventId: string) {
    await enforceEventAccess(userId, eventId, "media:manage");

    await prisma.event.update({
      where: { id: eventId },
      data: { mediaPanicAt: null },
    });

    return { panic: false as const, mediaPanicAt: null };
  },

  async getState(userId: string, eventId: string) {
    await enforceEventAccess(userId, eventId, "media:read");

    const event = await prisma.event.findFirst({
      where: { id: eventId, deletedAt: null },
      select: { mediaPanicAt: true },
    });

    if (!event) {
      throw new PanicServiceError("Event not found", 404, "EVENT_NOT_FOUND");
    }

    return {
      panic: Boolean(event.mediaPanicAt),
      mediaPanicAt: event.mediaPanicAt?.toISOString() ?? null,
    };
  },
};

export { AccessError };
