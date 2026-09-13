import { COLLAGE_SIZE } from "@/lib/story/types";

export type CollageLayoutId = "split2_v" | "split2_h" | "grid2x2" | "layout3";

export type CollageSlotRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type CollageLayout = {
  id: CollageLayoutId;
  labelKey: string;
  slots: CollageSlotRect[];
};

/** Dark gutters between cells (story background shows through as borders). */
export const COLLAGE_GAP = 10;
export const COLLAGE_BG = "#0a0a0a";

function gapSplit(
  total: number,
  parts: number,
  gap: number = COLLAGE_GAP,
): { sizes: number[]; offsets: number[] } {
  const sizes: number[] = [];
  const offsets: number[] = [];
  const inner = total - gap * (parts + 1);
  const base = Math.floor(inner / parts);
  let used = 0;
  for (let i = 0; i < parts; i++) {
    const size = i === parts - 1 ? inner - used : base;
    sizes.push(size);
    offsets.push(gap + used + gap * i);
    used += size;
  }
  // Fix offsets: start at gap, then size+gap between
  let cursor = gap;
  for (let i = 0; i < parts; i++) {
    offsets[i] = cursor;
    cursor += sizes[i]! + gap;
  }
  return { sizes, offsets };
}

function buildGrid(cols: number, rows: number): CollageSlotRect[] {
  const col = gapSplit(COLLAGE_SIZE, cols);
  const row = gapSplit(COLLAGE_SIZE, rows);
  const slots: CollageSlotRect[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      slots.push({
        x: col.offsets[c]!,
        y: row.offsets[r]!,
        width: col.sizes[c]!,
        height: row.sizes[r]!,
      });
    }
  }
  return slots;
}

/** Large top + two bottom cells on the square canvas. */
function buildLayout3(): CollageSlotRect[] {
  const g = COLLAGE_GAP;
  const topH = Math.floor((COLLAGE_SIZE - g * 3) * 0.58);
  const bottomH = COLLAGE_SIZE - g * 3 - topH;
  const col = gapSplit(COLLAGE_SIZE, 2);
  return [
    {
      x: g,
      y: g,
      width: COLLAGE_SIZE - g * 2,
      height: topH,
    },
    {
      x: col.offsets[0]!,
      y: g * 2 + topH,
      width: col.sizes[0]!,
      height: bottomH,
    },
    {
      x: col.offsets[1]!,
      y: g * 2 + topH,
      width: col.sizes[1]!,
      height: bottomH,
    },
  ];
}

export const COLLAGE_LAYOUTS: CollageLayout[] = [
  {
    id: "split2_v",
    labelKey: "collageLayoutSplitV",
    slots: buildGrid(2, 1),
  },
  {
    id: "split2_h",
    labelKey: "collageLayoutSplitH",
    slots: buildGrid(1, 2),
  },
  {
    id: "layout3",
    labelKey: "collageLayout3",
    slots: buildLayout3(),
  },
  {
    id: "grid2x2",
    labelKey: "collageLayout2x2",
    slots: buildGrid(2, 2),
  },
];

export const DEFAULT_COLLAGE_LAYOUT_ID: CollageLayoutId = "grid2x2";

export function getCollageLayout(id: CollageLayoutId): CollageLayout {
  return COLLAGE_LAYOUTS.find((l) => l.id === id) ?? COLLAGE_LAYOUTS[3]!;
}

export function emptyCollageSlots(id: CollageLayoutId): null[] {
  return getCollageLayout(id).slots.map(() => null);
}

/**
 * Place an image as cover-fit inside a slot.
 * Story images already use object-cover in their element box, so the
 * element rect equals the slot; natural size is used only for aspect checks.
 */
export function fitCoverInSlot(
  _imgW: number,
  _imgH: number,
  slot: CollageSlotRect,
): CollageSlotRect {
  return { x: slot.x, y: slot.y, width: slot.width, height: slot.height };
}

/** Cover-fit media size for a box (same aspect as object-fit: cover). */
export function coverMediaSize(
  imgW: number,
  imgH: number,
  boxW: number,
  boxH: number,
): { width: number; height: number } {
  if (imgW <= 0 || imgH <= 0 || boxW <= 0 || boxH <= 0) {
    return { width: boxW, height: boxH };
  }
  const scale = Math.max(boxW / imgW, boxH / imgH);
  return { width: imgW * scale, height: imgH * scale };
}

/**
 * Clamp pan so cover-fitted media always fills the box.
 * pan is an offset from the centered position.
 */
export function clampImagePan(
  panX: number,
  panY: number,
  mediaW: number,
  mediaH: number,
  boxW: number,
  boxH: number,
): { panX: number; panY: number } {
  const maxX = Math.max(0, (mediaW - boxW) / 2);
  const maxY = Math.max(0, (mediaH - boxH) / 2);
  return {
    panX: Math.min(maxX, Math.max(-maxX, panX)),
    panY: Math.min(maxY, Math.max(-maxY, panY)),
  };
}
