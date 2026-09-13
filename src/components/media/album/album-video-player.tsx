"use client";

import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

import { cn } from "@/lib/utils";

type AlbumVideoPlayerProps = {
  src: string;
  poster?: string | null;
  className?: string;
  videoClassName?: string;
  autoPlay?: boolean;
  loop?: boolean;
  onError?: () => void;
};

export function AlbumVideoPlayer({
  src,
  poster,
  className,
  videoClassName,
  autoPlay = false,
  loop = false,
  onError,
}: AlbumVideoPlayerProps) {
  const t = useTranslations("publicEvent");
  const videoRef = useRef<HTMLVideoElement>(null);
  const scrubbingRef = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [progress, setProgress] = useState(0);

  const syncFromVideo = useCallback(() => {
    const video = videoRef.current;
    if (!video || scrubbingRef.current) return;
    setProgress(video.duration ? video.currentTime / video.duration : 0);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onTimeUpdate = () => syncFromVideo();
    const onLoadedMetadata = () => {
      syncFromVideo();
    };
    const onEnded = () => {
      setPlaying(false);
      setProgress(1);
    };

    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("loadedmetadata", onLoadedMetadata);
    video.addEventListener("ended", onEnded);
    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
      video.removeEventListener("ended", onEnded);
    };
  }, [src, syncFromVideo]);

  useEffect(() => {
    const video = videoRef.current;
    if (video) video.muted = muted;
  }, [muted]);

  useEffect(() => {
    if (!autoPlay) return;
    const video = videoRef.current;
    if (!video) return;
    void video.play().catch(() => {
      /* autoplay may be blocked until user taps */
    });
  }, [autoPlay, src]);

  async function togglePlay() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      try {
        await video.play();
      } catch {
        onError?.();
      }
    } else {
      video.pause();
    }
  }

  function seekFromClientX(clientX: number, track: HTMLElement) {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    const rect = track.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    video.currentTime = ratio * video.duration;
    setProgress(ratio);
  }

  function onScrubPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    e.stopPropagation();
    e.preventDefault();
    const track = e.currentTarget;
    scrubbingRef.current = true;
    track.setPointerCapture(e.pointerId);
    seekFromClientX(e.clientX, track);
  }

  function onScrubPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!scrubbingRef.current) return;
    seekFromClientX(e.clientX, e.currentTarget);
  }

  function onScrubPointerUp(e: ReactPointerEvent<HTMLDivElement>) {
    if (!scrubbingRef.current) return;
    scrubbingRef.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
  }

  return (
    <div className={cn("relative w-full bg-black", className)}>
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video
        ref={videoRef}
        src={src}
        poster={poster ?? undefined}
        className={cn(
          "h-auto max-h-[min(60vh,100%)] w-full object-contain",
          videoClassName,
        )}
        playsInline
        preload="metadata"
        muted={muted}
        autoPlay={autoPlay}
        loop={loop}
        onClick={() => void togglePlay()}
        onError={() => onError?.()}
      />

      {!playing ? (
        <button
          type="button"
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          tabIndex={-1}
          aria-hidden
        >
          <span className="flex size-14 items-center justify-center rounded-full bg-black/55 text-white shadow-lg ring-1 ring-white/25 backdrop-blur-sm">
            <Play className="size-7 fill-current pl-0.5" />
          </span>
        </button>
      ) : null}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent px-3 pb-2.5 pt-8">
        <div className="pointer-events-auto flex items-center gap-3">
          <button
            type="button"
            className="tap-press flex size-9 shrink-0 items-center justify-center rounded-full bg-black/45 text-white ring-1 ring-white/20 backdrop-blur-sm"
            aria-label={playing ? t("albumVideoPause") : t("albumVideoPlay")}
            onClick={(e) => {
              e.stopPropagation();
              void togglePlay();
            }}
          >
            {playing ? (
              <Pause className="size-4 fill-current" />
            ) : (
              <Play className="size-4 fill-current pl-0.5" />
            )}
          </button>

          <div
            className="min-w-0 flex-1 touch-none py-2"
            role="slider"
            aria-label={t("albumVideoPlay")}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress * 100)}
            tabIndex={0}
            onPointerDown={onScrubPointerDown}
            onPointerMove={onScrubPointerMove}
            onPointerUp={onScrubPointerUp}
            onPointerCancel={onScrubPointerUp}
            onKeyDown={(e) => {
              const video = videoRef.current;
              if (!video?.duration) return;
              const step = video.duration * 0.05;
              if (e.key === "ArrowRight") {
                e.preventDefault();
                video.currentTime = Math.min(
                  video.duration,
                  video.currentTime + step,
                );
                setProgress(video.currentTime / video.duration);
              } else if (e.key === "ArrowLeft") {
                e.preventDefault();
                video.currentTime = Math.max(0, video.currentTime - step);
                setProgress(video.currentTime / video.duration);
              }
            }}
          >
            <div className="h-1 overflow-hidden rounded-full bg-white/25">
              <div
                className="h-full rounded-full bg-white"
                style={{ width: `${Math.min(100, progress * 100)}%` }}
              />
            </div>
          </div>

          <button
            type="button"
            className="tap-press flex size-9 shrink-0 items-center justify-center rounded-full bg-black/45 text-white ring-1 ring-white/20 backdrop-blur-sm"
            aria-label={muted ? t("albumVideoUnmute") : t("albumVideoMute")}
            onClick={(e) => {
              e.stopPropagation();
              setMuted((m) => !m);
            }}
          >
            {muted ? (
              <VolumeX className="size-4" />
            ) : (
              <Volume2 className="size-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
