import type { TextElement } from "@/lib/story/types";

/** Shared line-height multiplier for preview + canvas export. */
export const STORY_TEXT_LINE_HEIGHT = 1.25;

/** Horizontal / vertical padding as em of font size (matches IG-style pills). */
export const STORY_TEXT_PAD_X_EM = 0.4;
export const STORY_TEXT_PAD_Y_EM = 0.25;

/** Corner radius as em of font size. */
export const STORY_TEXT_RADIUS_EM = 0.35;

export function storyTextLineHeightPx(fontSizePx: number): number {
  return fontSizePx * STORY_TEXT_LINE_HEIGHT;
}

export function storyTextPadX(fontSizePx: number): number {
  return fontSizePx * STORY_TEXT_PAD_X_EM;
}

export function storyTextPadY(fontSizePx: number): number {
  return fontSizePx * STORY_TEXT_PAD_Y_EM;
}

export function storyTextRadius(fontSizePx: number): number {
  return fontSizePx * STORY_TEXT_RADIUS_EM;
}

export function storyTextCssHighlightStyle(
  fontSizePx: number,
  highlight: string | null,
): {
  backgroundColor?: string;
  padding?: string;
  borderRadius?: number;
  boxDecorationBreak?: "clone";
  WebkitBoxDecorationBreak?: "clone";
} {
  if (!highlight) return {};
  return {
    backgroundColor: highlight,
    padding: `${STORY_TEXT_PAD_Y_EM}em ${STORY_TEXT_PAD_X_EM}em`,
    borderRadius: storyTextRadius(fontSizePx),
    boxDecorationBreak: "clone",
    WebkitBoxDecorationBreak: "clone",
  };
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

/**
 * Draw text + per-line rounded highlight pills on a canvas context
 * already translated/rotated to the element center.
 */
export function drawStoryTextOnCanvas(
  ctx: CanvasRenderingContext2D,
  el: TextElement,
  boxWidth: number,
): void {
  const fontSize = el.fontSize * el.scale;
  const weight = el.bold ? "700" : "400";
  const style = el.italic ? "italic" : "normal";
  ctx.font = `${style} ${weight} ${fontSize}px ${el.fontFamily}`;
  ctx.textAlign = el.align;
  ctx.textBaseline = "middle";

  const lines = el.text.split("\n");
  const lineHeight = storyTextLineHeightPx(fontSize);
  const totalH = Math.max(lines.length, 1) * lineHeight;
  const padX = storyTextPadX(fontSize);
  const padY = storyTextPadY(fontSize);
  const radius = storyTextRadius(fontSize);

  let textX = 0;
  if (el.align === "left") textX = -boxWidth / 2;
  if (el.align === "right") textX = boxWidth / 2;

  lines.forEach((line, i) => {
    const y = -totalH / 2 + lineHeight / 2 + i * lineHeight;
    if (el.highlight) {
      const metrics = ctx.measureText(line || " ");
      const lineW = Math.max(metrics.width, fontSize * 0.35);
      let pillX = -lineW / 2 - padX;
      if (el.align === "left") pillX = textX - padX;
      if (el.align === "right") pillX = textX - lineW - padX;
      ctx.fillStyle = el.highlight;
      roundRectPath(
        ctx,
        pillX,
        y - lineHeight / 2 - padY,
        lineW + padX * 2,
        lineHeight + padY * 2,
        radius,
      );
      ctx.fill();
    }
    ctx.fillStyle = el.color;
    ctx.fillText(line, textX, y);
  });
}
