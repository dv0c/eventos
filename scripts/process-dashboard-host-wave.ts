import path from "node:path";

import sharp from "sharp";

const INPUT = path.join(process.cwd(), "public/dashboard/host-wave.png");
const OUTPUT = INPUT;

function isBackgroundPixel(r: number, g: number, b: number): boolean {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const saturation = max - min;
  const lightness = (r + g + b) / 3;

  if (saturation > 24) {
    return false;
  }

  if (r > 245 && g > 245 && b > 245) {
    return true;
  }

  if (lightness >= 185 && lightness <= 220 && saturation < 12) {
    return true;
  }

  return false;
}

async function removeCheckerboardBackground() {
  const image = sharp(INPUT);
  const { data, info } = await image.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const output = Buffer.from(data);

  for (let index = 0; index < output.length; index += info.channels) {
    const r = output[index];
    const g = output[index + 1];
    const b = output[index + 2];

    if (isBackgroundPixel(r, g, b)) {
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
    .toFile(OUTPUT);

  console.log(`Processed ${OUTPUT}`);
}

void removeCheckerboardBackground();
