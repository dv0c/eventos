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
    video.crossOrigin = "anonymous";

    await new Promise<void>((resolve, reject) => {
      const onReady = () => resolve();
      video.onloadeddata = onReady;
      video.onloadedmetadata = onReady;
      video.onerror = () => reject(new Error("video load failed"));
      video.src = objectUrl;
      void video.load();
    });

    // Prefer a tiny seek so browsers decode a real frame (iOS often blanks at 0).
    const duration = Number.isFinite(video.duration) ? video.duration : 0;
    const seekCandidates = [
      duration > 0 ? Math.min(0.25, duration * 0.1) : 0.1,
      0.01,
      0,
    ];

    for (const seekTo of seekCandidates) {
      try {
        if (seekTo > 0 || duration > 0) {
          await new Promise<void>((resolve, reject) => {
            const onSeeked = () => {
              cleanup();
              resolve();
            };
            const onError = () => {
              cleanup();
              reject(new Error("seek failed"));
            };
            const cleanup = () => {
              video.removeEventListener("seeked", onSeeked);
              video.removeEventListener("error", onError);
            };
            video.addEventListener("seeked", onSeeked);
            video.addEventListener("error", onError);
            video.currentTime = seekTo;
          });
        }

        const width = video.videoWidth || 0;
        const height = video.videoHeight || 0;
        if (width < 2 || height < 2) continue;

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) continue;
        ctx.drawImage(video, 0, 0, width, height);

        const blob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob((result) => resolve(result), "image/jpeg", 0.82);
        });
        if (!blob || blob.size < 64) continue;

        const base = file.name.replace(/\.[^.]+$/, "") || "video";
        return new File([blob], `${base}-poster.jpg`, { type: "image/jpeg" });
      } catch {
        // try next seek candidate
      }
    }

    return null;
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
