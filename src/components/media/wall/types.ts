export interface WallMediaItem {
  id: string;
  url: string;
  thumbnailUrl?: string | null;
  caption: string | null;
  uploadedBy?: string | null;
  isFeatured: boolean;
  mimeType?: string;
  createdAt: string;
  reactionCounts?: Record<string, number>;
}

export interface WallReactionEvent {
  type: "reaction";
  id?: string;
  mediaId: string;
  emoji: string;
  createdAt: string;
}

export interface WallAnnouncement {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  expiresAt: string;
  durationSec?: number;
}
