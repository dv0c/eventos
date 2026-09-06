import { SongRequestStatus } from "@prisma/client";

import { prisma } from "@/server/db";
import { enforceEventAccess } from "@/server/permissions/enforce";

const MAX_REQUESTS_PER_NAME_PER_DAY = 5;

export class SongRequestServiceError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code: string,
  ) {
    super(message);
    this.name = "SongRequestServiceError";
  }
}

interface EventSections {
  mediaUploadToken?: string;
  [key: string]: unknown;
}

async function getEventByAlbumToken(albumToken: string) {
  const events = await prisma.event.findMany({
    where: { deletedAt: null },
    include: { settings: true },
  });

  return (
    events.find((event) => {
      const sections = (event.settings?.sections ?? {}) as EventSections;
      return (
        sections.mediaUploadToken === albumToken &&
        event.settings?.isPublic === true
      );
    }) ?? null
  );
}

export interface MusicSearchHit {
  title: string;
  artist: string;
  artworkUrl: string | null;
  trackId: string;
  previewUrl: string | null;
}

export interface SubmitSongInput {
  title: string;
  artist: string;
  albumArtUrl?: string | null;
  previewUrl?: string | null;
  itunesTrackId?: string | null;
  requestedBy: string;
  note?: string | null;
}

export const songRequestService = {
  async searchMusic(query: string): Promise<MusicSearchHit[]> {
    const q = query.trim();
    if (q.length < 2) return [];

    const url = new URL("https://itunes.apple.com/search");
    url.searchParams.set("term", q);
    url.searchParams.set("entity", "song");
    url.searchParams.set("limit", "8");

    const response = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      throw new SongRequestServiceError(
        "Music search unavailable",
        502,
        "SEARCH_FAILED",
      );
    }

    const data = (await response.json()) as {
      results?: Array<{
        trackId?: number;
        trackName?: string;
        artistName?: string;
        artworkUrl100?: string;
        artworkUrl60?: string;
        previewUrl?: string;
      }>;
    };

    return (data.results ?? [])
      .filter((r) => r.trackName && r.artistName && r.trackId)
      .map((r) => ({
        title: r.trackName!,
        artist: r.artistName!,
        artworkUrl: r.artworkUrl100 ?? r.artworkUrl60 ?? null,
        trackId: String(r.trackId),
        previewUrl: r.previewUrl ?? null,
      }));
  },

  async listPublicByAlbumToken(albumToken: string) {
    const event = await getEventByAlbumToken(albumToken);
    if (!event?.settings) {
      throw new SongRequestServiceError("Album not found", 404, "NOT_FOUND");
    }
    if (!(event.settings.enableSongRequests ?? true)) {
      throw new SongRequestServiceError(
        "Song requests are disabled",
        403,
        "DISABLED",
      );
    }

    const items = await prisma.songRequest.findMany({
      where: {
        eventId: event.id,
        status: {
          in: [
            SongRequestStatus.PENDING,
            SongRequestStatus.APPROVED,
            SongRequestStatus.PLAYING,
          ],
        },
      },
      orderBy: [{ status: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
      take: 100,
    });

    return {
      enableSongRequests: true,
      items: items.map((item) => ({
        id: item.id,
        title: item.title,
        artist: item.artist,
        albumArtUrl: item.albumArtUrl,
        requestedBy: item.requestedBy,
        note: item.note,
        status: item.status,
        createdAt: item.createdAt.toISOString(),
      })),
    };
  },

  async submitPublic(albumToken: string, input: SubmitSongInput) {
    const event = await getEventByAlbumToken(albumToken);
    if (!event?.settings) {
      throw new SongRequestServiceError("Album not found", 404, "NOT_FOUND");
    }
    if (!(event.settings.enableSongRequests ?? true)) {
      throw new SongRequestServiceError(
        "Song requests are disabled",
        403,
        "DISABLED",
      );
    }

    const title = input.title.trim();
    const artist = input.artist.trim();
    const requestedBy = input.requestedBy.trim();
    if (!title || !artist) {
      throw new SongRequestServiceError(
        "Title and artist are required",
        400,
        "VALIDATION_ERROR",
      );
    }
    if (!requestedBy) {
      throw new SongRequestServiceError(
        "Guest name is required",
        400,
        "VALIDATION_ERROR",
      );
    }

    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentCount = await prisma.songRequest.count({
      where: {
        eventId: event.id,
        requestedBy,
        createdAt: { gte: dayAgo },
      },
    });
    if (recentCount >= MAX_REQUESTS_PER_NAME_PER_DAY) {
      throw new SongRequestServiceError(
        "Too many song requests today",
        429,
        "RATE_LIMITED",
      );
    }

    const maxOrder = await prisma.songRequest.aggregate({
      where: { eventId: event.id },
      _max: { sortOrder: true },
    });

    const created = await prisma.songRequest.create({
      data: {
        eventId: event.id,
        title,
        artist,
        albumArtUrl: input.albumArtUrl?.trim() || null,
        previewUrl: input.previewUrl?.trim() || null,
        itunesTrackId: input.itunesTrackId?.trim() || null,
        requestedBy,
        note: input.note?.trim().slice(0, 200) || null,
        status: SongRequestStatus.PENDING,
        sortOrder: (maxOrder._max.sortOrder ?? 0) + 1,
      },
    });

    return {
      id: created.id,
      title: created.title,
      artist: created.artist,
      status: created.status,
    };
  },

  async listForHost(userId: string, eventId: string) {
    await enforceEventAccess(userId, eventId, "media:manage");

    const items = await prisma.songRequest.findMany({
      where: { eventId },
      orderBy: [{ status: "asc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
      take: 200,
    });

    return {
      items: items.map((item) => ({
        id: item.id,
        title: item.title,
        artist: item.artist,
        albumArtUrl: item.albumArtUrl,
        previewUrl: item.previewUrl,
        itunesTrackId: item.itunesTrackId,
        requestedBy: item.requestedBy,
        note: item.note,
        status: item.status,
        sortOrder: item.sortOrder,
        createdAt: item.createdAt.toISOString(),
      })),
    };
  },

  async updateStatus(
    userId: string,
    eventId: string,
    songId: string,
    action: "approve" | "reject" | "play" | "played" | "skip",
  ) {
    await enforceEventAccess(userId, eventId, "media:manage");

    const song = await prisma.songRequest.findFirst({
      where: { id: songId, eventId },
    });
    if (!song) {
      throw new SongRequestServiceError("Song not found", 404, "NOT_FOUND");
    }

    if (action === "play") {
      await prisma.$transaction([
        prisma.songRequest.updateMany({
          where: { eventId, status: SongRequestStatus.PLAYING },
          data: { status: SongRequestStatus.APPROVED },
        }),
        prisma.songRequest.update({
          where: { id: songId },
          data: { status: SongRequestStatus.PLAYING },
        }),
      ]);
      return { id: songId, status: SongRequestStatus.PLAYING };
    }

    const statusMap = {
      approve: SongRequestStatus.APPROVED,
      reject: SongRequestStatus.REJECTED,
      played: SongRequestStatus.PLAYED,
      skip: SongRequestStatus.SKIPPED,
    } as const;

    const updated = await prisma.songRequest.update({
      where: { id: songId },
      data: { status: statusMap[action] },
    });

    return { id: updated.id, status: updated.status };
  },

  async deleteSong(userId: string, eventId: string, songId: string) {
    await enforceEventAccess(userId, eventId, "media:manage");

    const song = await prisma.songRequest.findFirst({
      where: { id: songId, eventId },
    });
    if (!song) {
      throw new SongRequestServiceError("Song not found", 404, "NOT_FOUND");
    }

    await prisma.songRequest.delete({ where: { id: songId } });
    return { deleted: true };
  },
};
