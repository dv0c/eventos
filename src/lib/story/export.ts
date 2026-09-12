import { backgroundCss } from "@/lib/story/backgrounds";
import { filterCss } from "@/lib/story/filters";
import {
  STORY_HEIGHT,
  STORY_WIDTH,
  type ImageElement,
  type StoryDocument,
  type TextElement,
} from "@/lib/story/types";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });
}

function paintBackground(
  ctx: CanvasRenderingContext2D,
  doc: StoryDocument,
): void {
  const bg = doc.background;
  if (bg.kind === "solid") {
    ctx.fillStyle = bg.color;
    ctx.fillRect(0, 0, STORY_WIDTH, STORY_HEIGHT);
    return;
  }
  if (bg.kind === "gradient") {
    const angle = ((bg.angle ?? 160) * Math.PI) / 180;
    const x0 = STORY_WIDTH / 2 - Math.cos(angle) * STORY_WIDTH;
    const y0 = STORY_HEIGHT / 2 - Math.sin(angle) * STORY_HEIGHT;
    const x1 = STORY_WIDTH / 2 + Math.cos(angle) * STORY_WIDTH;
    const y1 = STORY_HEIGHT / 2 + Math.sin(angle) * STORY_HEIGHT;
    const grad = ctx.createLinearGradient(x0, y0, x1, y1);
    grad.addColorStop(0, bg.from);
    grad.addColorStop(1, bg.to);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, STORY_WIDTH, STORY_HEIGHT);
    return;
  }
  // image backgrounds loaded separately by caller if needed
  void backgroundCss(bg);
  ctx.fillStyle = "#0f0f12";
  ctx.fillRect(0, 0, STORY_WIDTH, STORY_HEIGHT);
}

async function drawImageElement(
  ctx: CanvasRenderingContext2D,
  el: ImageElement,
): Promise<void> {
  const img = await loadImage(el.src);
  ctx.save();
  ctx.globalAlpha = el.opacity;
  const cx = el.x + (el.width * el.scale) / 2;
  const cy = el.y + (el.height * el.scale) / 2;
  ctx.translate(cx, cy);
  ctx.rotate((el.rotation * Math.PI) / 180);
  ctx.filter = filterCss(el.filter, el.adjustments);
  const w = el.width * el.scale;
  const h = el.height * el.scale;
  ctx.drawImage(img, -w / 2, -h / 2, w, h);
  ctx.restore();
}

function drawTextElement(ctx: CanvasRenderingContext2D, el: TextElement): void {
  ctx.save();
  ctx.globalAlpha = el.opacity;
  const w = el.width * el.scale;
  const h = el.height * el.scale;
  const cx = el.x + w / 2;
  const cy = el.y + h / 2;
  ctx.translate(cx, cy);
  ctx.rotate((el.rotation * Math.PI) / 180);

  const weight = el.bold ? "700" : "400";
  const style = el.italic ? "italic" : "normal";
  ctx.font = `${style} ${weight} ${el.fontSize * el.scale}px ${el.fontFamily}`;
  ctx.textAlign = el.align;
  ctx.textBaseline = "middle";

  const lines = el.text.split("\n");
  const lineHeight = el.fontSize * el.scale * 1.25;
  const totalH = lines.length * lineHeight;
  let textX = 0;
  if (el.align === "left") textX = -w / 2;
  if (el.align === "right") textX = w / 2;

  if (el.highlight) {
    const metrics = lines.map((line) => ctx.measureText(line));
    const maxW = Math.max(...metrics.map((m) => m.width), 0);
    ctx.fillStyle = el.highlight;
    ctx.fillRect(-maxW / 2 - 16, -totalH / 2 - 8, maxW + 32, totalH + 16);
  }

  ctx.fillStyle = el.color;
  lines.forEach((line, i) => {
    const y = -totalH / 2 + lineHeight / 2 + i * lineHeight;
    ctx.fillText(line, textX, y);
  });
  ctx.restore();
}

/**
 * Flatten a StoryDocument to a JPEG blob for upload.
 * Video elements are skipped in v1 (publish still requires raster export).
 */
export async function exportStoryToBlob(
  doc: StoryDocument,
  quality = 0.92,
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = STORY_WIDTH;
  canvas.height = STORY_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");

  if (doc.background.kind === "image") {
    try {
      const img = await loadImage(doc.background.src);
      ctx.drawImage(img, 0, 0, STORY_WIDTH, STORY_HEIGHT);
    } catch {
      paintBackground(ctx, doc);
    }
  } else {
    paintBackground(ctx, doc);
  }

  const sorted = [...doc.elements].sort((a, b) => a.zIndex - b.zIndex);
  for (const el of sorted) {
    if (el.type === "image") {
      await drawImageElement(ctx, el);
    } else if (el.type === "text") {
      drawTextElement(ctx, el);
    } else if (el.type === "drawing") {
      ctx.save();
      ctx.globalAlpha = el.opacity;
      for (const stroke of el.strokes) {
        if (stroke.points.length < 2) continue;
        ctx.strokeStyle = stroke.erase ? "rgba(0,0,0,1)" : stroke.color;
        ctx.lineWidth = stroke.size;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        if (stroke.erase) ctx.globalCompositeOperation = "destination-out";
        else ctx.globalCompositeOperation = "source-over";
        ctx.beginPath();
        ctx.moveTo(stroke.points[0]!.x, stroke.points[0]!.y);
        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo(stroke.points[i]!.x, stroke.points[i]!.y);
        }
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((b) => resolve(b), "image/jpeg", quality);
  });
  if (!blob) throw new Error("Export failed");
  return blob;
}

export function storyHasPublishableContent(doc: StoryDocument): boolean {
  if (doc.elements.some((el) => el.type === "image" || el.type === "text")) {
    return true;
  }
  if (doc.elements.some((el) => el.type === "drawing" && el.strokes.length > 0)) {
    return true;
  }
  // text-only with custom background still ok if there's text; background-only is not
  return false;
}
