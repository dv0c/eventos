import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

function stripMimeParams(mime: string): string {
  return mime.split(";")[0]?.trim().toLowerCase() || "";
}

let ffmpegAvailable: boolean | null = null;

async function isFfmpegAvailable(): Promise<boolean> {
  if (ffmpegAvailable != null) return ffmpegAvailable;
  const bin = process.env.FFMPEG_PATH || "ffmpeg";
  ffmpegAvailable = await new Promise<boolean>((resolve) => {
    const child = spawn(bin, ["-version"], { stdio: "ignore" });
    child.on("error", () => resolve(false));
    child.on("close", (code) => resolve(code === 0));
  });
  return ffmpegAvailable;
}

function needsTranscode(contentType: string): boolean {
  const type = stripMimeParams(contentType);
  if (!type.startsWith("video/")) return false;
  if (type === "video/mp4") return false;
  return (
    type.includes("webm") ||
    type.includes("quicktime") ||
    type === "video/x-m4v" ||
    type === "video/3gpp" ||
    type === "video/3gpp2" ||
    type.startsWith("video/")
  );
}

function runFfmpeg(args: string[]): Promise<void> {
  const bin = process.env.FFMPEG_PATH || "ffmpeg";
  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, { stdio: "ignore" });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited with code ${code}`));
    });
  });
}

/**
 * Best-effort convert to H.264 AAC MP4 when ffmpeg is installed.
 * Returns the original buffer unchanged if conversion is unnecessary or unavailable.
 */
export async function maybeTranscodeVideoToMp4(
  buffer: Buffer,
  contentType: string,
): Promise<{ buffer: Buffer; contentType: string }> {
  if (!needsTranscode(contentType)) {
    return { buffer, contentType: stripMimeParams(contentType) || "video/mp4" };
  }

  if (!(await isFfmpegAvailable())) {
    return { buffer, contentType: stripMimeParams(contentType) || contentType };
  }

  const dir = await mkdtemp(join(tmpdir(), "eventos-vid-"));
  const type = stripMimeParams(contentType);
  const inputExt = type.includes("webm")
    ? "webm"
    : type.includes("quicktime")
      ? "mov"
      : type.includes("3gpp")
        ? "3gp"
        : "bin";
  const inputPath = join(dir, `input.${inputExt}`);
  const outputPath = join(dir, "output.mp4");

  try {
    await writeFile(inputPath, buffer);
    await runFfmpeg([
      "-y",
      "-i",
      inputPath,
      "-t",
      "30",
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      "23",
      "-pix_fmt",
      "yuv420p",
      "-c:a",
      "aac",
      "-b:a",
      "128k",
      "-ac",
      "2",
      "-movflags",
      "+faststart",
      outputPath,
    ]);
    const out = await readFile(outputPath);
    if (out.length < 32) {
      return { buffer, contentType: type || contentType };
    }
    return { buffer: out, contentType: "video/mp4" };
  } catch {
    return { buffer, contentType: type || contentType };
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => undefined);
  }
}
