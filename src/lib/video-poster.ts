/**
 * Capture a JPEG poster frame from a video file (client-side).
 * Seeks near the start so upload can store a thumbnail without ffmpeg.
 */
export async function captureVideoPoster(file: File): Promise<File | null> {
  if (!file.type.startsWith("video/")) return null;

  const objectUrl = URL.createObjectURL(file);

  try {
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";

    await new Promise<void>((resolve, reject) => {
      video.onloadeddata = () => resolve();
      video.onerror = () => reject(new Error("video load failed"));
      video.src = objectUrl;
    });

    const seekTo = Math.min(0.1, Number.isFinite(video.duration) ? video.duration * 0.05 : 0.1);
    if (Number.isFinite(video.duration) && video.duration > 0) {
      await new Promise<void>((resolve) => {
        const onSeeked = () => {
          video.removeEventListener("seeked", onSeeked);
          resolve();
        };
        video.addEventListener("seeked", onSeeked);
        video.currentTime = seekTo;
      });
    }

    const width = video.videoWidth || 640;
    const height = video.videoHeight || 360;
    if (width < 2 || height < 2) return null;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((result) => resolve(result), "image/jpeg", 0.82);
    });
    if (!blob) return null;

    const base = file.name.replace(/\.[^.]+$/, "") || "video";
    return new File([blob], `${base}-poster.jpg`, { type: "image/jpeg" });
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
