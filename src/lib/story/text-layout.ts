import type { TextElement } from "@/lib/story/types";

/** Shared line-height multiplier for preview + canvas export. */
export const STORY_TEXT_LINE_HEIGHT = 1.25;

/** Horizontal / vertical padding as em of font size (matches IG-style pills). */
export const STORY_TEXT_PAD_X_EM = 0.4;
export const STORY_TEXT_PAD_Y_EM = 0.25;

/** Corner radius as em of font size. */
export const STORY_TEXT_RADIUS_EM = 0.35;

/** Minimum text box height in design space (~1 line at given font size). */
export function storyTextMinHeight(fontSize: number): number {
  return storyTextLineHeightPx(fontSize);
}

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

/**
 * Wrap text to maxWidth using a measure callback (CSS-like overflow-wrap: anywhere).
 */
export function wrapStoryTextLines(
  measure: (text: string) => number,
  text: string,
  maxWidth: number,
): string[] {
  const width = Math.max(1, maxWidth);
  const result: string[] = [];
  const paragraphs = text.split("\n");

  function pushBrokenToken(token: string) {
    let chunk = "";
    for (const ch of token) {
      const next = chunk + ch;
      if (chunk && measure(next) > width) {
        result.push(chunk);
        chunk = ch;
      } else {
        chunk = next;
      }
    }
    return chunk;
  }

  for (const para of paragraphs) {
    if (para === "") {
      result.push("");
      continue;
    }

    const tokens = para.split(/(\s+)/);
    let line = "";

    for (const token of tokens) {
      if (!token) continue;
      const candidate = line + token;
      if (measure(candidate) <= width) {
        line = candidate;
        continue;
      }

      if (line) {
        result.push(line);
        line = "";
      }

      if (measure(token) <= width) {
        line = token.replace(/^\s+/, "");
        continue;
      }

      line = pushBrokenToken(token);
    }

    result.push(line);
  }

  return result.length > 0 ? result : [""];
}

function storyTextCanvasFont(el: Pick<TextElement, "fontSize" | "fontFamily" | "bold" | "italic" | "scale">) {
  const fontSize = el.fontSize * el.scale;
  const weight = el.bold ? "700" : "400";
  const style = el.italic ? "italic" : "normal";
  return {
    fontSize,
    font: `${style} ${weight} ${fontSize}px ${el.fontFamily}`,
  };
}

/** Content wrap width inside the element box (highlight padding eats horizontal space). */
export function storyTextContentWrapWidth(
  scaledBoxWidth: number,
  scaledFontSize: number,
  highlight: string | null,
): number {
  const box = Math.max(1, scaledBoxWidth);
  if (!highlight) return box;
  return Math.max(1, box - storyTextPadX(scaledFontSize) * 2);
}

/**
 * Design-space height for a text element given its unscaled box width.
 * Matches canvas wrap used by export / CSS (padding reduces wrap width).
 */
export function measureStoryTextHeight(
  el: Pick<
    TextElement,
    "text" | "fontSize" | "fontFamily" | "bold" | "italic" | "scale" | "highlight"
  >,
  boxWidth: number,
): number {
  const { fontSize, font } = storyTextCanvasFont(el);
  const measure = createMeasureFn(font, fontSize);
  const wrapAt = storyTextContentWrapWidth(
    boxWidth * el.scale,
    fontSize,
    el.highlight,
  );

  const lines = wrapStoryTextLines(measure, el.text || " ", wrapAt);
  const lineHeight = storyTextLineHeightPx(fontSize);
  let scaledH = Math.max(lines.length, 1) * lineHeight;
  if (el.highlight) {
    // Per-line clone padding: top of first + bottom of last fragment
    scaledH += storyTextPadY(fontSize) * 2;
  }
  return Math.max(scaledH / el.scale, storyTextMinHeight(el.fontSize));
}

function createMeasureFn(font: string, fontSize: number): (s: string) => number {
  if (typeof document !== "undefined") {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.font = font;
      return (s) => ctx.measureText(s || " ").width;
    }
  }
  return (s) => (s || " ").length * fontSize * 0.55;
}

/**
 * Design-space width that hugs content, capped at maxWidth (wrap width).
 * Longest line is measured in the content area; highlight pad is added outside.
 */
export function measureStoryTextWidth(
  el: Pick<
    TextElement,
    "text" | "fontSize" | "fontFamily" | "bold" | "italic" | "scale" | "highlight"
  >,
  maxWidth: number,
): number {
  const { fontSize, font } = storyTextCanvasFont(el);
  const measure = createMeasureFn(font, fontSize);
  const padX = el.highlight ? storyTextPadX(fontSize) : 0;
  const contentMax = Math.max(1, maxWidth * el.scale - padX * 2);

  const lines = wrapStoryTextLines(measure, el.text || " ", contentMax);
  let maxLine = 0;
  for (const line of lines) {
    maxLine = Math.max(maxLine, measure(line || " "));
  }
  const scaledW = maxLine + padX * 2;
  const minDesign = el.fontSize * 1.5;
  return Math.min(maxWidth, Math.max(scaledW / el.scale, minDesign));
}

/**
 * Shrink-wrap width/height to content (capped at maxWidth) and keep align anchor.
 */
export function fitStoryTextBox(
  el: TextElement,
  maxWidth: number,
): TextElement {
  const width = measureStoryTextWidth(el, maxWidth);
  return resizeStoryTextBox(el, width);
}

/**
 * Set wrap width, remasure height, and keep align anchor (does not shrink to content).
 */
export function resizeStoryTextBox(
  el: TextElement,
  width: number,
): TextElement {
  const nextW = Math.max(1, width);
  const height = measureStoryTextHeight(el, nextW);
  let x = el.x;
  if (el.align === "center") {
    x = el.x + (el.width - nextW) / 2;
  } else if (el.align === "right") {
    x = el.x + el.width - nextW;
  }
  return { ...el, width: nextW, height, x };
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
  const { fontSize, font } = storyTextCanvasFont(el);
  ctx.font = font;
  ctx.textAlign = el.align;
  ctx.textBaseline = "middle";

  const wrapAt = storyTextContentWrapWidth(boxWidth, fontSize, el.highlight);
  const lines = wrapStoryTextLines(
    (s) => ctx.measureText(s || " ").width,
    el.text || " ",
    wrapAt,
  );
  const lineHeight = storyTextLineHeightPx(fontSize);
  const totalH = Math.max(lines.length, 1) * lineHeight;
  const padX = storyTextPadX(fontSize);
  const padY = storyTextPadY(fontSize);
  const radius = storyTextRadius(fontSize);

  let textX = 0;
  if (el.align === "left") {
    textX = -boxWidth / 2 + (el.highlight ? padX : 0);
  } else if (el.align === "right") {
    textX = boxWidth / 2 - (el.highlight ? padX : 0);
  }

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
