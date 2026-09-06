import * as ArchiverModule from "archiver";
import { PassThrough, Readable } from "node:stream";

import { apiError, handleServiceError } from "@/lib/api-response";
import { AuthError, requireAuth } from "@/server/auth/session";
import { prisma } from "@/server/db";
import { isEventEnded } from "@/server/events/event-ended";
import { AccessError, enforceEventAccess } from "@/server/permissions/enforce";
import { getStorageProvider } from "@/server/providers/storage";
import { voiceWishService } from "@/server/services/voice-wish.service";

type ArchiverFactory = (
  format: string,
  options?: { zlib?: { level?: number } },
) => import("archiver").Archiver;

const archiver = (
  (ArchiverModule as { default?: ArchiverFactory }).default ??
  (ArchiverModule as unknown as ArchiverFactory)
);

interface RouteContext {
  params: Promise<{ eventId: string }>;
}

function safeZipName(value: string, fallback: string): string {
  const cleaned = value
    .replace(/[^\w.\- ]+/g, "_")
    .replace(/\s+/g, "_")
    .slice(0, 80);
  return cleaned || fallback;
}

export async function GET(_request: Request, context: RouteContext) {
  const { eventId } = await context.params;

  try {
    const session = await requireAuth();
    await enforceEventAccess(session.user.id, eventId, "media:manage");

    const event = await prisma.event.findFirst({
      where: { id: eventId, deletedAt: null },
      select: {
        name: true,
        slug: true,
        status: true,
        date: true,
        endTime: true,
      },
    });

    if (!event) {
      return apiError("Event not found", "EVENT_NOT_FOUND", 404);
    }

    const storage = getStorageProvider();
    const media = await voiceWishService.listApprovedMediaForZip(eventId);
    const ended = isEventEnded(event);
    const wishes = ended ? await voiceWishService.listForZip(eventId) : [];

    const archive = archiver("zip", { zlib: { level: 5 } });
    const output = new PassThrough();
    archive.pipe(output);

    archive.on("error", (err: Error) => {
      output.destroy(err);
    });

    void (async () => {
      try {
        for (const item of media) {
          const url = storage.getPublicUrl(item.storageKey);
          const response = await fetch(url);
          if (!response.ok) continue;
          const buffer = Buffer.from(await response.arrayBuffer());
          const ext = item.fileName.includes(".")
            ? item.fileName.split(".").pop()
            : item.mimeType.split("/")[1] || "bin";
          const base = safeZipName(
            item.uploadedBy
              ? `${item.uploadedBy}_${item.id.slice(0, 8)}`
              : item.id.slice(0, 12),
            item.id,
          );
          archive.append(buffer, { name: `photos/${base}.${ext}` });
        }

        for (const wish of wishes) {
          const url = storage.getPublicUrl(wish.storageKey);
          const response = await fetch(url);
          if (!response.ok) continue;
          const buffer = Buffer.from(await response.arrayBuffer());
          const ext = wish.fileName.includes(".")
            ? wish.fileName.split(".").pop()
            : wish.mimeType.includes("webm")
              ? "webm"
              : "m4a";
          const base = safeZipName(
            `${wish.uploadedBy ?? "guest"}_${wish.id.slice(0, 8)}`,
            wish.id,
          );
          archive.append(buffer, { name: `wishes/${base}.${ext}` });
        }

        if (media.length === 0 && wishes.length === 0) {
          archive.append("No media available for this event.\n", {
            name: "README.txt",
          });
        } else if (!ended) {
          archive.append(
            "Voice wishes unlock after the event ends and will be included in future downloads.\n",
            { name: "wishes/README.txt" },
          );
        }

        await archive.finalize();
      } catch (error) {
        archive.abort();
        output.destroy(error instanceof Error ? error : new Error("ZIP failed"));
      }
    })();

    const webStream = Readable.toWeb(output) as unknown as ReadableStream;
    const filename = `${safeZipName(event.slug, "event")}-media.zip`;

    return new Response(webStream, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    if (error instanceof AccessError) {
      return apiError(error.message, error.code, error.statusCode);
    }
    return handleServiceError(error);
  }
}
