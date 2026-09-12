"use client";

import { Camera, ImagePlus, Upload, Video, X } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  ALBUM_CHALLENGES,
  isAlbumChallengeId,
  type AlbumChallengeId,
} from "@/lib/album-challenges";
import {
  UploadWithProgressError,
  uploadWithProgress,
} from "@/lib/upload-with-progress";
import { captureVideoPoster } from "@/lib/video-poster";
import { cn } from "@/lib/utils";

const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif";
const VIDEO_ACCEPT = "video/mp4,video/webm,video/quicktime";
const MAX_VIDEO_DURATION_SEC = 30;

interface PublicUploadFormProps {
  uploadToken: string;
  eventName: string;
  defaultUploadedBy?: string;
  hideNameField?: boolean;
  onUploaded?: () => void;
  glass?: boolean;
  challengeId?: string | null;
  challengeMode?: "photo" | "collage" | null;
  challengeTitle?: string | null;
  challengeCoverImage?: string | null;
  onClearChallenge?: () => void;
  /** Mobile-native layout used inside the album shell */
  native?: boolean;
  allowPhotos?: boolean;
  allowVideos?: boolean;
  primaryColor?: string;
}

function readVideoDurationMs(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      const durationSec = video.duration;
      URL.revokeObjectURL(url);
      if (!Number.isFinite(durationSec) || durationSec <= 0) {
        reject(new Error("invalid duration"));
        return;
      }
      resolve(Math.round(durationSec * 1000));
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("metadata failed"));
    };
    video.src = url;
  });
}

async function buildCollageFile(files: File[]): Promise<File> {
  const images = await Promise.all(
    files.slice(0, 4).map(
      (file) =>
        new Promise<HTMLImageElement>((resolve, reject) => {
          const url = URL.createObjectURL(file);
          const img = document.createElement("img");
          img.onload = () => {
            URL.revokeObjectURL(url);
            resolve(img);
          };
          img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error("Failed to load image"));
          };
          img.src = url;
        }),
    ),
  );

  const size = 1080;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");

  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(0, 0, size, size);

  const count = images.length;
  const cols = count <= 1 ? 1 : 2;
  const rows = count <= 2 ? 1 : 2;
  const cellW = size / cols;
  const cellH = size / rows;
  const gap = 4;

  images.forEach((img, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    const x = col * cellW + gap / 2;
    const y = row * cellH + gap / 2;
    const w = cellW - gap;
    const h = cellH - gap;
    const scale = Math.max(w / img.width, h / img.height);
    const sw = w / scale;
    const sh = h / scale;
    const sx = (img.width - sw) / 2;
    const sy = (img.height - sh) / 2;
    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  });

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => (result ? resolve(result) : reject(new Error("Collage failed"))),
      "image/jpeg",
      0.9,
    );
  });

  return new File([blob], `collage-${Date.now()}.jpg`, { type: "image/jpeg" });
}

export function PublicUploadForm({
  uploadToken,
  eventName,
  defaultUploadedBy = "",
  hideNameField = false,
  onUploaded,
  glass = false,
  challengeId = null,
  challengeMode = null,
  challengeTitle = null,
  challengeCoverImage = null,
  onClearChallenge,
  native = false,
  allowPhotos = true,
  allowVideos = true,
  primaryColor,
}: PublicUploadFormProps) {
  const t = useTranslations("media");
  const tAlbum = useTranslations("publicEvent");
  const cameraInputId = useId();
  const libraryInputId = useId();
  const videoInputId = useId();
  const collageInputId = useId();
  const cameraRef = useRef<HTMLInputElement>(null);
  const libraryRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const collageRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [durationMs, setDurationMs] = useState<number | null>(null);
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [uploadedBy, setUploadedBy] = useState(defaultUploadedBy);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [buildingCollage, setBuildingCollage] = useState(false);

  const isCollageChallenge =
    challengeMode === "collage" || challengeId === "collage";
  const challengeMeta = ALBUM_CHALLENGES.find((c) => c.id === challengeId);
  const challengeImage =
    challengeCoverImage || challengeMeta?.image || null;
  const resolvedChallengeTitle =
    challengeTitle ||
    (challengeId && isAlbumChallengeId(challengeId)
      ? tAlbum(`albumChallenge.${challengeId}.title`)
      : null);
  const isVideoPreview = Boolean(file?.type.startsWith("video/"));
  useEffect(() => {
    setUploadedBy(defaultUploadedBy);
  }, [defaultUploadedBy]);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const clearSelection = useCallback(() => {
    setFile(null);
    setDurationMs(null);
    setPosterFile(null);
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }, []);

  const setSelectedFile = useCallback(
    async (selected: File | null) => {
      if (!selected) {
        clearSelection();
        return;
      }

      if (selected.type.startsWith("video/")) {
        try {
          const ms = await readVideoDurationMs(selected);
          if (ms > MAX_VIDEO_DURATION_SEC * 1000) {
            toast.error(tAlbum("uploadVideoTooLong"));
            return;
          }
          setDurationMs(ms);
          const poster = await captureVideoPoster(selected);
          setPosterFile(poster);
        } catch {
          toast.error(tAlbum("uploadVideoInvalid"));
          return;
        }
      } else {
        setDurationMs(null);
        setPosterFile(null);
      }

      setFile(selected);
      setPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(selected);
      });
    },
    [clearSelection, tAlbum],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files?.[0];
      e.target.value = "";
      if (!selected) return;
      void setSelectedFile(selected);
    },
    [setSelectedFile],
  );

  const handleCollageChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = Array.from(e.target.files ?? []).slice(0, 4);
      e.target.value = "";
      if (selected.length < 2) {
        toast.error(tAlbum("albumCollageMin"));
        return;
      }
      setBuildingCollage(true);
      try {
        const collage = await buildCollageFile(selected);
        await setSelectedFile(collage);
      } catch {
        toast.error(tAlbum("albumCollageError"));
      }
      setBuildingCollage(false);
    },
    [setSelectedFile, tAlbum],
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append("file", file);
    if (caption) formData.append("caption", caption);
    if (uploadedBy) formData.append("uploadedBy", uploadedBy);
    if (challengeId) {
      formData.append("challengeId", challengeId);
    }
    if (file.type.startsWith("video/") && durationMs != null) {
      formData.append("durationMs", String(durationMs));
    }
    if (file.type.startsWith("video/") && posterFile) {
      formData.append("thumbnail", posterFile);
    }

    try {
      await uploadWithProgress({
        url: `/api/public/media/${uploadToken}`,
        formData,
        onProgress: setUploadProgress,
      });

      toast.success(t("uploadSuccess"));
      clearSelection();
      setCaption("");
      onClearChallenge?.();
      onUploaded?.();
    } catch (error) {
      const message =
        error instanceof UploadWithProgressError
          ? error.message
          : t("uploadError");
      toast.error(message || t("uploadError"));
    }

    setIsUploading(false);
    setUploadProgress(0);
  }

  if (native) {
    return (
      <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
        <input
          ref={cameraRef}
          id={cameraInputId}
          type="file"
          accept={IMAGE_ACCEPT}
          capture="environment"
          className="sr-only"
          onChange={handleFileChange}
          disabled={isUploading || buildingCollage}
        />
        <input
          ref={libraryRef}
          id={libraryInputId}
          type="file"
          accept={IMAGE_ACCEPT}
          className="sr-only"
          onChange={handleFileChange}
          disabled={isUploading || buildingCollage}
        />
        <input
          ref={videoRef}
          id={videoInputId}
          type="file"
          accept={VIDEO_ACCEPT}
          className="sr-only"
          onChange={handleFileChange}
          disabled={isUploading || buildingCollage}
        />
        <input
          ref={collageRef}
          id={collageInputId}
          type="file"
          accept={IMAGE_ACCEPT}
          multiple
          className="sr-only"
          onChange={handleCollageChange}
          disabled={isUploading || buildingCollage}
        />

        <div className="flex-1 overflow-y-auto overscroll-none" data-app-scroll>
          {challengeId ? (
            <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
              {challengeImage ? (
                <span
                  className="relative size-9 shrink-0 overflow-hidden rounded-xl bg-black"
                  aria-hidden
                >
                  <Image
                    src={challengeImage}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="36px"
                  />
                </span>
              ) : null}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium uppercase tracking-wide text-white/50">
                  {tAlbum("albumChallengeChip")}
                </p>
                <p className="truncate text-sm font-semibold text-white">
                  {resolvedChallengeTitle ?? challengeId}
                </p>
              </div>
              {onClearChallenge ? (
                <button
                  type="button"
                  onClick={onClearChallenge}
                  className="rounded-full p-2 text-white/60 hover:bg-white/10 hover:text-white"
                  aria-label={tAlbum("albumClearChallenge")}
                >
                  <X className="size-4" />
                </button>
              ) : null}
            </div>
          ) : null}

          {preview ? (
            <div className="relative aspect-square w-full bg-black">
              {isVideoPreview ? (
                <video
                  src={preview}
                  controls
                  playsInline
                  className="h-full w-full object-contain"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="" className="h-full w-full object-cover" />
              )}
              {isUploading ? (
                <div className="absolute inset-0 flex flex-col items-end justify-end bg-black/45 p-4">
                  <Progress value={uploadProgress} className="h-1.5 w-full" />
                  <p className="mt-2 text-xs text-white/80">
                    {t("uploadProgress", { percent: uploadProgress })}
                  </p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={clearSelection}
                  className="absolute right-3 top-3 rounded-full bg-black/55 p-2 text-white backdrop-blur-sm"
                  aria-label={tAlbum("albumRetake")}
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-3 px-4 py-6">
              <p className="text-center text-sm text-white/60">{eventName}</p>
              {isCollageChallenge ? (
                <button
                  type="button"
                  onClick={() => collageRef.current?.click()}
                  disabled={buildingCollage}
                  className="tap-press flex min-h-36 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/25 bg-white/5 px-4 py-8 text-white active:bg-white/10"
                >
                  <ImagePlus className="size-8 text-white/80" />
                  <span className="text-base font-semibold">
                    {buildingCollage
                      ? tAlbum("albumCollageBuilding")
                      : tAlbum("albumCollagePick")}
                  </span>
                  <span className="text-center text-xs text-white/50">
                    {tAlbum("albumCollageHint")}
                  </span>
                </button>
              ) : (
                <>
                  {allowPhotos ? (
                    <>
                      <button
                        type="button"
                        onClick={() => cameraRef.current?.click()}
                        className="tap-press flex min-h-28 flex-col items-center justify-center gap-2 rounded-2xl bg-white text-neutral-950 active:bg-white/90"
                        style={
                          primaryColor
                            ? { backgroundColor: primaryColor, color: "#fff" }
                            : undefined
                        }
                      >
                        <Camera className="size-7" />
                        <span className="text-base font-semibold">{t("takePhoto")}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => libraryRef.current?.click()}
                        className="tap-press flex min-h-20 flex-col items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/5 text-white active:bg-white/10"
                      >
                        <ImagePlus className="size-6" />
                        <span className="text-sm font-semibold">
                          {tAlbum("uploadChoosePhoto")}
                        </span>
                      </button>
                    </>
                  ) : null}
                  {allowVideos ? (
                    <button
                      type="button"
                      onClick={() => videoRef.current?.click()}
                      className="tap-press flex min-h-20 flex-col items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/5 text-white active:bg-white/10"
                    >
                      <Video className="size-6" />
                      <span className="text-sm font-semibold">
                        {tAlbum("uploadChooseVideo")}
                      </span>
                      <span className="text-xs text-white/50">
                        {tAlbum("uploadVideoMaxHint")}
                      </span>
                    </button>
                  ) : null}
                </>
              )}
            </div>
          )}

          {preview ? (
            <div className="space-y-3 px-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="caption-native" className="text-white/70">
                  {t("caption")}
                </Label>
                <Input
                  id="caption-native"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder={t("captionPlaceholder")}
                  disabled={isUploading}
                  className="h-12 border-white/15 bg-white/10 text-base text-white placeholder:text-white/40"
                />
              </div>
              {!hideNameField ? (
                <div className="space-y-2">
                  <Label htmlFor="uploadedBy-native" className="text-white/70">
                    {t("yourName")}
                  </Label>
                  <Input
                    id="uploadedBy-native"
                    value={uploadedBy}
                    onChange={(e) => setUploadedBy(e.target.value)}
                    placeholder={t("yourNamePlaceholder")}
                    disabled={isUploading}
                    className="h-12 border-white/15 bg-white/10 text-base text-white placeholder:text-white/40"
                  />
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        {preview ? (
          <div className="border-t border-white/10 bg-black/60 px-4 py-3 backdrop-blur-xl">
            <Button
              type="submit"
              variant="default"
              className="h-12 w-full text-base"
              disabled={!file || isUploading}
            >
              <Upload className="mr-2 h-4 w-4" />
              {isUploading ? t("uploading") : t("shareButton")}
            </Button>
          </div>
        ) : null}
      </form>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-6">
      <div className="text-center">
        <Camera
          className={cn(
            "mx-auto mb-4 h-12 w-12",
            glass ? "text-white/80" : "text-primary",
          )}
        />
        <h1 className={cn("text-2xl font-bold", glass && "text-white")}>
          {t("uploadTitle")}
        </h1>
        <p className={cn("mt-2", glass ? "text-white/65" : "text-muted-foreground")}>
          {eventName}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="photo" className={glass ? "text-white/80" : undefined}>
            {tAlbum("uploadSelectMedia")}
          </Label>
          <Input
            id="photo"
            type="file"
            accept={[
              allowPhotos ? IMAGE_ACCEPT : null,
              allowVideos ? VIDEO_ACCEPT : null,
            ]
              .filter(Boolean)
              .join(",") || IMAGE_ACCEPT}
            onChange={handleFileChange}
            disabled={isUploading}
            className={
              glass
                ? "border-white/20 bg-white/10 text-white file:text-white"
                : undefined
            }
          />
          <p
            className={cn(
              "text-xs",
              glass ? "text-white/50" : "text-muted-foreground",
            )}
          >
            {tAlbum("uploadVideoMaxHint")}
          </p>
        </div>

        {preview ? (
          <div
            className={cn(
              "overflow-hidden rounded-lg border",
              glass ? "border-white/15" : undefined,
            )}
          >
            {isVideoPreview ? (
              <video
                src={preview}
                controls
                playsInline
                className="w-full object-cover"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="Preview" className="w-full object-cover" />
            )}
          </div>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="caption" className={glass ? "text-white/80" : undefined}>
            {t("caption")}
          </Label>
          <Input
            id="caption"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder={t("captionPlaceholder")}
            disabled={isUploading}
            className={
              glass
                ? "border-white/20 bg-white/10 text-white placeholder:text-white/40"
                : undefined
            }
          />
        </div>

        {!hideNameField ? (
          <div className="space-y-2">
            <Label htmlFor="uploadedBy" className={glass ? "text-white/80" : undefined}>
              {t("yourName")}
            </Label>
            <Input
              id="uploadedBy"
              value={uploadedBy}
              onChange={(e) => setUploadedBy(e.target.value)}
              placeholder={t("yourNamePlaceholder")}
              disabled={isUploading}
              className={
                glass
                  ? "border-white/20 bg-white/10 text-white placeholder:text-white/40"
                  : undefined
              }
            />
          </div>
        ) : null}

        <Button
          type="submit"
          variant="default"
          className="w-full"
          disabled={!file || isUploading}
        >
          <Upload className="mr-2 h-4 w-4" />
          {isUploading ? t("uploading") : t("uploadButton")}
        </Button>

        {isUploading ? (
          <div className="space-y-2">
            <Progress value={uploadProgress} />
            <p
              className={cn(
                "text-center text-xs",
                glass ? "text-white/60" : "text-muted-foreground",
              )}
            >
              {t("uploadProgress", { percent: uploadProgress })}
            </p>
          </div>
        ) : null}
      </form>
    </div>
  );
}
