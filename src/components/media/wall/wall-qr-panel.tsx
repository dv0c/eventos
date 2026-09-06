"use client";

import { WALL_QR_SIZE_PX, type WallQrSize } from "@/server/events/wall-settings";

interface WallQrPanelProps {
  imageUrl: string | null;
  uploadUrl?: string | null;
  size: WallQrSize;
  label: string;
  hidden?: boolean;
}

export function WallQrPanel({ imageUrl, size, label, hidden }: WallQrPanelProps) {
  if (hidden || !imageUrl) return null;

  const px = WALL_QR_SIZE_PX[size] ?? WALL_QR_SIZE_PX.md;

  return (
    <div className="absolute bottom-20 left-4 z-20 flex flex-col items-center gap-2 rounded-2xl bg-black/40 p-3 backdrop-blur-md sm:bottom-24 sm:left-6">
      <p className="max-w-[10rem] text-center text-xs font-medium text-white/90">{label}</p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt={label}
        width={px}
        height={px}
        className="rounded-xl bg-white p-1.5"
        style={{ width: px, height: px }}
      />
    </div>
  );
}
