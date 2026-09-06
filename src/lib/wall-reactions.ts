export const WALL_REACTION_EMOJIS = ["❤️", "😍", "😂", "🔥", "👏", "🎉"] as const;

export type WallReactionEmoji = (typeof WALL_REACTION_EMOJIS)[number];
