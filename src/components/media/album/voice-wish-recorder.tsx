"use client";

import { Check, Mic, RotateCcw, Send, Square, Upload, Video } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useId, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MAX_DURATION_MS = 30_000;

interface VoiceWishRecorderProps {
  albumToken: string;
  guestName: string;
  className?: string;
  onOpenVideoStudio?: () => void;
}

type Phase = "idle" | "recording" | "preview" | "sending" | "sent";
type WishMode = "audio" | "video";

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/mp4",
    "audio/aac",
    "audio/mp4;codecs=mp4a.40.2",
  ];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type));
}

function canUseLiveMic(): boolean {
  if (typeof window === "undefined") return false;
  if (typeof MediaRecorder === "undefined") return false;
  const nav = navigator as Navigator & {
    webkitGetUserMedia?: unknown;
    getUserMedia?: unknown;
  };
  return Boolean(
    navigator.mediaDevices?.getUserMedia ||
      nav.webkitGetUserMedia ||
      nav.getUserMedia,
  );
}

async function requestAudioStream(): Promise<MediaStream> {
  const nav = navigator as Navigator & {
    webkitGetUserMedia?: (
      constraints: MediaStreamConstraints,
      success: (stream: MediaStream) => void,
      error: (err: Error) => void,
    ) => void;
    getUserMedia?: (
      constraints: MediaStreamConstraints,
      success: (stream: MediaStream) => void,
      error: (err: Error) => void,
    ) => void;
  };

  if (navigator.mediaDevices?.getUserMedia) {
    return navigator.mediaDevices.getUserMedia({ audio: true });
  }

  const legacy = nav.getUserMedia || nav.webkitGetUserMedia;
  if (typeof legacy === "function") {
    return new Promise((resolve, reject) => {
      legacy.call(navigator, { audio: true }, resolve, reject);
    });
  }

  throw new Error("getUserMedia unavailable");
}

function readMediaDurationMs(file: Blob, kind: WishMode): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const el = document.createElement(kind === "video" ? "video" : "audio");
    el.preload = "metadata";
    el.onloadedmetadata = () => {
      const durationSec = el.duration;
      URL.revokeObjectURL(url);
      if (!Number.isFinite(durationSec) || durationSec <= 0) {
        reject(new Error("invalid duration"));
        return;
      }
      resolve(Math.round(durationSec * 1000));
    };
    el.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("metadata failed"));
    };
    el.src = url;
  });
}

function extForBlob(type: string, mode: WishMode, fileName?: string): string {
  const fromName = fileName?.split(".").pop()?.toLowerCase();
  if (fromName && fromName.length <= 4) return fromName;
  if (mode === "video") {
    if (type.includes("webm")) return "webm";
    if (type.includes("quicktime")) return "mov";
    return "mp4";
  }
  if (type.includes("mp4") || type.includes("m4a") || type.includes("aac")) {
    return "m4a";
  }
  if (type.includes("ogg")) return "ogg";
  if (type.includes("mpeg") || type.includes("mp3")) return "mp3";
  if (type.includes("3gpp")) return "3gp";
  return "m4a";
}

function ensureTypedFile(blob: Blob, mode: WishMode, preferredName?: string): File {
  const type =
    blob.type ||
    (mode === "video" ? "video/mp4" : "audio/mp4");
  const ext = extForBlob(type, mode, preferredName);
  const name = preferredName?.includes(".")
    ? preferredName
    : `wish.${ext}`;
  return new File([blob], name, { type });
}

export function VoiceWishRecorder({
  albumToken,
  guestName,
  className,
  onOpenVideoStudio,
}: VoiceWishRecorderProps) {
  const t = useTranslations("publicEvent");
  const audioInputId = useId();
  const videoInputId = useId();
  const audioInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<WishMode>("audio");
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [liveMicAvailable, setLiveMicAvailable] = useState(true);
  const [previewIsVideo, setPreviewIsVideo] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const blobRef = useRef<Blob | null>(null);
  const fileNameRef = useRef<string | null>(null);
  const startedAtRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLiveMicAvailable(canUseLiveMic());
  }, []);

  useEffect(() => {
    return () => {
      cleanupRecording();
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- unmount only
  }, []);

  function cleanupRecording() {
    if (timerRef.current) clearInterval(timerRef.current);
    if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
    timerRef.current = null;
    stopTimerRef.current = null;
    try {
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }
    } catch {
      // ignore
    }
    mediaRecorderRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  function resetToIdle() {
    cleanupRecording();
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    blobRef.current = null;
    fileNameRef.current = null;
    chunksRef.current = [];
    setElapsedMs(0);
    setError(null);
    setPreviewIsVideo(false);
    setPhase("idle");
    if (audioInputRef.current) audioInputRef.current.value = "";
    if (videoInputRef.current) videoInputRef.current.value = "";
  }

  function adoptBlob(blob: Blob, durationMs: number, isVideo: boolean, name?: string) {
    blobRef.current = blob;
    fileNameRef.current = name ?? null;
    setPreviewIsVideo(isVideo);
    setElapsedMs(Math.min(MAX_DURATION_MS, durationMs));
    const url = URL.createObjectURL(blob);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
    setPhase("preview");
  }

  async function startRecording() {
    setError(null);
    setMode("audio");

    if (!canUseLiveMic()) {
      setLiveMicAvailable(false);
      audioInputRef.current?.click();
      return;
    }

    try {
      const stream = await requestAudioStream();
      streamRef.current = stream;
      const mimeType = pickMimeType();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const type = recorder.mimeType || mimeType || "audio/mp4";
        const blob = new Blob(chunksRef.current, { type });
        const duration = Math.min(
          MAX_DURATION_MS,
          Date.now() - startedAtRef.current,
        );
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        adoptBlob(blob, Math.max(1, duration), false);
      };

      mediaRecorderRef.current = recorder;
      startedAtRef.current = Date.now();
      setElapsedMs(0);
      setPhase("recording");
      recorder.start(250);

      timerRef.current = setInterval(() => {
        setElapsedMs(Math.min(MAX_DURATION_MS, Date.now() - startedAtRef.current));
      }, 100);

      stopTimerRef.current = setTimeout(() => {
        stopRecording();
      }, MAX_DURATION_MS);
    } catch {
      setLiveMicAvailable(false);
      setError(t("wishMicDeniedFallback"));
      cleanupRecording();
      setPhase("idle");
      audioInputRef.current?.click();
    }
  }

  function stopRecording() {
    if (timerRef.current) clearInterval(timerRef.current);
    if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
    timerRef.current = null;
    stopTimerRef.current = null;
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      setElapsedMs(Math.min(MAX_DURATION_MS, Date.now() - startedAtRef.current));
      recorder.stop();
    }
    mediaRecorderRef.current = null;
  }

  async function handleFileChange(
    e: React.ChangeEvent<HTMLInputElement>,
    kind: WishMode,
  ) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setMode(kind);
    setError(null);
    try {
      const durationMs = await readMediaDurationMs(file, kind);
      if (durationMs > MAX_DURATION_MS) {
        setError(kind === "video" ? t("wishVideoTooLong") : t("wishAudioTooLong"));
        return;
      }
      adoptBlob(file, Math.max(1, durationMs), kind === "video", file.name);
    } catch {
      adoptBlob(file, Math.min(MAX_DURATION_MS, 15_000), kind === "video", file.name);
    }
  }

  async function sendWish() {
    const blob = blobRef.current;
    if (!blob) return;
    const durationMs = Math.max(
      1,
      Math.min(MAX_DURATION_MS, elapsedMs || MAX_DURATION_MS),
    );
    setPhase("sending");
    setError(null);

    try {
      const wishMode: WishMode = previewIsVideo ? "video" : "audio";
      const file = ensureTypedFile(blob, wishMode, fileNameRef.current ?? undefined);
      const formData = new FormData();
      formData.append("file", file, file.name);
      formData.append("uploadedBy", guestName);
      formData.append("durationMs", String(durationMs));

      const response = await fetch(`/api/public/album/${albumToken}/wishes`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const json = await response.json().catch(() => null);
        setError(json?.error?.message ?? t("wishSendError"));
        setPhase("preview");
        return;
      }

      setPhase("sent");
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      blobRef.current = null;
      fileNameRef.current = null;
    } catch {
      setError(t("wishSendError"));
      setPhase("preview");
    }
  }

  const seconds = Math.ceil(elapsedMs / 1000);
  const remaining = Math.max(0, 30 - seconds);

  return (
    <div className={cn("flex flex-col gap-6 px-4 py-6", className)}>
      <input
        ref={audioInputRef}
        id={audioInputId}
        type="file"
        accept="audio/*,audio/mp4,audio/m4a,audio/aac,audio/webm,audio/mpeg,audio/x-m4a,audio/3gpp,audio/amr"
        capture
        className="sr-only"
        onChange={(e) => void handleFileChange(e, "audio")}
      />
      <input
        ref={videoInputRef}
        id={videoInputId}
        type="file"
        accept="video/mp4,video/webm,video/quicktime,video/3gpp,video/*"
        capture
        className="sr-only"
        onChange={(e) => void handleFileChange(e, "video")}
      />

      <div className="space-y-1.5">
        <h2 className="text-lg font-semibold text-white">{t("wishTitle")}</h2>
        <p className="text-sm leading-relaxed text-white/55">{t("wishDesc")}</p>
      </div>

      {phase === "sent" ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-white/5 px-6 py-10 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300">
            <Check className="size-7" />
          </div>
          <div className="space-y-1">
            <p className="text-base font-semibold text-white">{t("wishSentTitle")}</p>
            <p className="text-sm text-white/55">{t("wishSentDesc")}</p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="mt-1 h-11 border-white/20 bg-transparent text-white hover:bg-white/10"
            onClick={resetToIdle}
          >
            {t("wishRecordAnother")}
          </Button>
        </div>
      ) : (
        <>
          {phase === "idle" ? (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMode("audio")}
                className={cn(
                  "rounded-xl border px-3 py-3.5 text-sm font-semibold transition",
                  mode === "audio"
                    ? "border-primary bg-primary/15 text-white"
                    : "border-white/15 bg-white/5 text-white/70",
                )}
              >
                {t("wishModeAudio")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("video");
                  onOpenVideoStudio?.();
                }}
                className={cn(
                  "rounded-xl border px-3 py-3.5 text-sm font-semibold transition",
                  mode === "video"
                    ? "border-primary bg-primary/15 text-white"
                    : "border-white/15 bg-white/5 text-white/70",
                )}
              >
                {t("wishModeVideo")}
              </button>
            </div>
          ) : null}

          <div className="flex flex-col items-center gap-5 rounded-2xl border border-white/10 bg-white/5 px-5 py-8 sm:px-6">
            <div className="space-y-1 text-center">
              <p className="tabular-nums text-3xl font-semibold tracking-tight text-white">
                {phase === "recording"
                  ? `0:${String(remaining).padStart(2, "0")}`
                  : phase === "preview"
                    ? `0:${String(Math.min(30, seconds)).padStart(2, "0")}`
                    : "0:30"}
              </p>
              <p className="text-xs text-white/45">
                {phase === "recording"
                  ? t("wishRecording")
                  : phase === "preview"
                    ? t("wishPreviewHint")
                    : t("wishMaxDuration")}
              </p>
            </div>

            {previewUrl && phase === "preview" ? (
              previewIsVideo ? (
                <video
                  src={previewUrl}
                  controls
                  playsInline
                  className="max-h-64 w-full max-w-sm rounded-lg"
                />
              ) : (
                <audio src={previewUrl} controls className="w-full max-w-sm" />
              )
            ) : null}

            <div className="flex w-full max-w-sm flex-col items-stretch gap-3">
              {phase === "idle" && mode === "audio" ? (
                liveMicAvailable ? (
                  <>
                    <Button
                      type="button"
                      variant="default"
                      className="h-14 w-full gap-2 rounded-full text-base"
                      onClick={() => void startRecording()}
                    >
                      <Mic className="size-5" />
                      {t("wishStart")}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 w-full gap-2 border-white/20 bg-transparent text-white hover:bg-white/10"
                      onClick={() => audioInputRef.current?.click()}
                    >
                      <Upload className="size-4" />
                      {t("wishChooseAudio")}
                    </Button>
                  </>
                ) : (
                  <Button
                    type="button"
                    variant="default"
                    className="h-14 w-full gap-2 rounded-full text-base"
                    onClick={() => audioInputRef.current?.click()}
                  >
                    <Mic className="size-5" />
                    {t("wishRecordOrChoose")}
                  </Button>
                )
              ) : null}

              {phase === "idle" && mode === "video" ? (
                <Button
                  type="button"
                  variant="default"
                  className="h-14 w-full gap-2 rounded-full text-base"
                  onClick={() => onOpenVideoStudio?.()}
                >
                  <Video className="size-5" />
                  {t("wishRecordVideo")}
                </Button>
              ) : null}

              {phase === "recording" ? (
                <Button
                  type="button"
                  variant="destructive"
                  className="h-14 w-full gap-2 rounded-full text-base"
                  onClick={stopRecording}
                >
                  <Square className="size-4 fill-current" />
                  {t("wishStop")}
                </Button>
              ) : null}

              {phase === "preview" ? (
                <>
                  <Button
                    type="button"
                    variant="default"
                    className="h-14 w-full gap-2 rounded-full text-base"
                    onClick={() => void sendWish()}
                  >
                    <Send className="size-4" />
                    {t("wishSend")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 w-full gap-2 border-white/20 bg-transparent text-white hover:bg-white/10"
                    onClick={resetToIdle}
                  >
                    <RotateCcw className="size-4" />
                    {t("wishRedo")}
                  </Button>
                </>
              ) : null}

              {phase === "sending" ? (
                <p className="py-3 text-center text-sm text-white/60">{t("wishSending")}</p>
              ) : null}
            </div>
          </div>

          {error ? (
            <p className="text-center text-sm text-red-300" role="alert">
              {error}
            </p>
          ) : null}

          {!liveMicAvailable && phase === "idle" && mode === "audio" ? (
            <p className="text-center text-xs text-white/45">
              {t("wishHttpMicHint")}
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
