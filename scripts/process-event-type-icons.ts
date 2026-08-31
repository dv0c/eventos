import { mkdir, readdir } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

const ROOT = path.join(process.cwd(), "public/wizard/event-types");
const RAW_DIR = path.join(ROOT, "raw");
const COLOR_THRESHOLD = 42;

interface Rgb {
  r: number;
  g: number;
  b: number;
}

function colorDistance(a: Rgb, b: Rgb): number {
  return Math.sqrt(
    (a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2,
  );
}

function averageCornerColor(
  data: Buffer,
  width: number,
  height: number,
  channels: number,
): Rgb {
  const corners = [
    [0, 0],
    [width - 1, 0],
    [0, height - 1],
    [width - 1, height - 1],
  ];

  let r = 0;
  let g = 0;
  let b = 0;

  for (const [x, y] of corners) {
    const index = (y * width + x) * channels;
    r += data[index];
    g += data[index + 1];
    b += data[index + 2];
  }

  return {
    r: Math.round(r / corners.length),
    g: Math.round(g / corners.length),
    b: Math.round(b / corners.length),
  };
}

async function removeBackground(inputPath: string, outputPath: string) {
  const image = sharp(inputPath);
  const { data, info } = await image
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const background = averageCornerColor(data, info.width, info.height, info.channels);
  const output = Buffer.from(data);

  for (let index = 0; index < output.length; index += info.channels) {
    const pixel = {
      r: output[index],
      g: output[index + 1],
      b: output[index + 2],
    };

    if (colorDistance(pixel, background) <= COLOR_THRESHOLD) {
      output[index + 3] = 0;
    }
  }

  await sharp(output, {
    raw: {
      width: info.width,
      height: info.height,
      channels: info.channels,
    },
  })
    .trim()
    .png()
    .toFile(outputPath);
}

async function main() {
  await mkdir(RAW_DIR, { recursive: true });
  await mkdir(ROOT, { recursive: true });

  const files = (await readdir(RAW_DIR)).filter((file) => file.endsWith(".png"));

  if (files.length === 0) {
    console.error("No PNG files found in public/wizard/event-types/raw/");
    process.exit(1);
  }

  for (const file of files) {
    const inputPath = path.join(RAW_DIR, file);
    const outputPath = path.join(ROOT, file);
    await removeBackground(inputPath, outputPath);
    console.log(`Processed ${file}`);
  }
}

void main();
