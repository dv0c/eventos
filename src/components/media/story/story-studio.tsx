"use client";

import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Camera,
  Check,
  ImageIcon,
  Palette,
  Redo2,
  RotateCcw,
  RotateCw,
  Trash2,
  Type,
  Undo2,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { backgroundCss, STORY_BACKGROUND_PRESETS } from "@/lib/story/backgrounds";
import { exportStoryToBlob, storyHasPublishableContent } from "@/lib/story/export";
import { filterCss, STORY_FILTERS } from "@/lib/story/filters";
import {
  createEmptyStory,
  DEFAULT_ADJUSTMENTS,
  newElementId,
  nextZIndex,
  STORY_HEIGHT,
  STORY_WIDTH,
  type ImageElement,
  type StoryDocument,
  type StoryElement,
  type TextElement,
} from "@/lib/story/types";
import { useStoryHistory } from "@/lib/story/use-story-history";
import {
  UploadWithProgressError,
  uploadWithProgress,
} from "@/lib/upload-with-progress";
import { cn } from "@/lib/utils";

type StudioMode =
  | "start"
  | "camera"
  | "edit"
  | "imageEdit"
  | "preview"
  | "background"
  | "textEdit";

export type StoryStudioProps = {
  uploadToken: string;
  eventName: string;
  guestName: string;
  primaryColor?: string;
  onClose: () => void;
  onPublished?: () => void;
};

const TEXT_FONTS = [
  { id: "classic", family: "system-ui, -apple-system, sans-serif", labelKey: "fontClassic" },
  { id: "modern", family: "ui-sans-serif, Helvetica, Arial, sans-serif", labelKey: "fontModern" },
  {
    id: "directional",
    family: "ui-sans-serif, 'Arial Narrow', Arial, sans-serif",
    labelKey: "fontDirectional",
  },
  { id: "literature", family: "Georgia, 'Times New Roman', serif", labelKey: "fontLiterature" },
  {
    id: "elegant",
    family: "Palatino, 'Palatino Linotype', 'Book Antiqua', serif",
    labelKey: "fontElegant",
    italicPill: true,
  },
] as const;

const TEXT_COLORS = ["#ffffff", "#0f0f12", "#C4A574", "#f87171", "#38bdf8", "#fbbf24"];

const HIGHLIGHT_CYCLE: Array<string | null> = [
  null,
  "rgba(0,0,0,0.75)",
  "rgba(255,255,255,0.92)",
  "rgba(196,165,116,0.9)",
];

function fitCoverRect(
  mediaW: number,
  mediaH: number,
): { x: number; y: number; width: number; height: number } {
  const canvasRatio = STORY_WIDTH / STORY_HEIGHT;
  const mediaRatio = mediaW / mediaH;
  let width: number;
  let height: number;
  if (mediaRatio > canvasRatio) {
    height = STORY_HEIGHT;
    width = height * mediaRatio;
  } else {
    width = STORY_WIDTH;
    height = width / mediaRatio;
  }
  return {
    x: (STORY_WIDTH - width) / 2,
    y: (STORY_HEIGHT - height) / 2,
    width,
    height,
  };
}

export function StoryStudio({
  uploadToken,
  eventName,
  guestName,
  primaryColor = "#C4A574",
  onClose,
  onPublished,
}: StoryStudioProps) {
  const t = useTranslations("storyStudio");
  const history = useStoryHistory();
  const { doc, push, replace, commit, undo, redo, reset, canUndo, canRedo } = history;

  const [mode, setMode] = useState<StudioMode>("start");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [pendingImage, setPendingImage] = useState<{
    src: string;
    objectUrl: boolean;
  } | null>(null);
  const [draftAdjust, setDraftAdjust] = useState(DEFAULT_ADJUSTMENTS);
  const [draftFilter, setDraftFilter] = useState<ImageElement["filter"]>("original");
  const [draftRotation, setDraftRotation] = useState(0);
  const [textDraft, setTextDraft] = useState("");
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [galleryPreview, setGalleryPreview] = useState<string | null>(null);
  const [textChromePanel, setTextChromePanel] = useState<"fonts" | "color">("fonts");
  const [filterLabelFlash, setFilterLabelFlash] = useState(0);

  const fileRef = useRef<HTMLInputElement>(null);
  const cameraVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const textInputRef = useRef<HTMLTextAreaElement>(null);
  const filterSwipeRef = useRef<{ x: number; y: number } | null>(null);

  const selected = useMemo(
    () => doc.elements.find((el) => el.id === selectedId) ?? null,
    [doc.elements, selectedId],
  );

  const editingText = useMemo(() => {
    const id = editingTextId ?? (selected?.type === "text" ? selected.id : null);
    if (!id) return null;
    const el = doc.elements.find((e) => e.id === id);
    return el?.type === "text" ? el : null;
  }, [doc.elements, editingTextId, selected]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraReady(false);
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  useEffect(() => {
    if (mode !== "camera") {
      stopCamera();
      return;
    }
    let cancelled = false;
    setCameraError(false);
    setCameraReady(false);

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (cameraVideoRef.current) {
          cameraVideoRef.current.srcObject = stream;
          await cameraVideoRef.current.play();
          setCameraReady(true);
        }
      } catch {
        if (!cancelled) {
          setCameraError(true);
          setCameraReady(false);
        }
      }
    }
    void start();
    return () => {
      cancelled = true;
    };
  }, [mode, stopCamera]);

  useEffect(() => {
    if (mode === "textEdit" && textInputRef.current) {
      textInputRef.current.focus();
      const len = textInputRef.current.value.length;
      textInputRef.current.setSelectionRange(len, len);
    }
  }, [mode, editingTextId]);

  function updateElements(updater: (els: StoryElement[]) => StoryElement[]) {
    push({ ...doc, elements: updater(doc.elements) });
  }

  function patchTextElement(id: string, patch: Partial<TextElement>) {
    replace({
      ...doc,
      elements: doc.elements.map((el) =>
        el.id === id && el.type === "text" ? { ...el, ...patch } : el,
      ),
    });
  }

  function commitTextDraft() {
    const id = editingTextId;
    if (!id) return;
    push({
      ...doc,
      elements: doc.elements.map((el) =>
        el.id === id && el.type === "text"
          ? { ...el, text: textDraft.trim() || t("defaultText") }
          : el,
      ),
    });
  }

  function openImageEditor(src: string, objectUrl: boolean) {
    stopCamera();
    setPendingImage({ src, objectUrl });
    setDraftAdjust({ ...DEFAULT_ADJUSTMENTS });
    setDraftFilter("original");
    setDraftRotation(0);
    setFilterLabelFlash(0);
    setMode("imageEdit");
  }

  function cycleDraftFilter(direction: 1 | -1) {
    setDraftFilter((current) => {
      const idx = STORY_FILTERS.findIndex((f) => f.id === current);
      const next =
        (idx + direction + STORY_FILTERS.length) % STORY_FILTERS.length;
      return STORY_FILTERS[next]!.id;
    });
    setFilterLabelFlash((n) => n + 1);
  }

  function onFilterSwipeStart(e: ReactPointerEvent) {
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    filterSwipeRef.current = { x: e.clientX, y: e.clientY };
  }

  function onFilterSwipeEnd(e: ReactPointerEvent) {
    const start = filterSwipeRef.current;
    filterSwipeRef.current = null;
    if (!start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.abs(dx) < 45 || Math.abs(dx) < Math.abs(dy)) return;
    cycleDraftFilter(dx < 0 ? 1 : -1);
  }

  function onPickImage(file: File | null) {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setGalleryPreview(url);
    openImageEditor(url, true);
  }

  function commitPendingImage() {
    if (!pendingImage) return;
    const img = new Image();
    img.onload = () => {
      const rect = fitCoverRect(img.naturalWidth, img.naturalHeight);
      const nextDoc = createEmptyStory({ kind: "solid", color: "#0f0f12" });
      nextDoc.elements = [
        {
          id: newElementId(),
          type: "image",
          src: pendingImage.src,
          objectUrl: pendingImage.objectUrl,
          adjustments: { ...draftAdjust },
          filter: draftFilter,
          ...rect,
          rotation: draftRotation,
          scale: 1,
          zIndex: 1,
          opacity: 1,
        } satisfies ImageElement,
      ];
      reset(nextDoc);
      setPendingImage(null);
      setSelectedId(null);
      setEditingTextId(null);
      setMode("edit");
    };
    img.src = pendingImage.src;
  }

  function captureCamera() {
    const video = cameraVideoRef.current;
    if (!video || !video.videoWidth) {
      toast.error(t("cameraNotReady"));
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    stopCamera();
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        openImageEditor(url, true);
      },
      "image/jpeg",
      0.92,
    );
  }

  function beginTextEdit(el: TextElement) {
    setSelectedId(el.id);
    setEditingTextId(el.id);
    setTextDraft(el.text === t("defaultText") ? "" : el.text);
    setTextChromePanel("fonts");
    setMode("textEdit");
  }

  function finishTextEdit() {
    commitTextDraft();
    setEditingTextId(null);
    setTextChromePanel("fonts");
    setMode("edit");
  }

  function startTextPost() {
    stopCamera();
    const bg =
      STORY_BACKGROUND_PRESETS.find((p) => p.id === "dusk")?.background ??
      ({ kind: "gradient", from: "#1a1423", to: "#4a3728", angle: 160 } as const);
    const id = newElementId();
    const el: TextElement = {
      id,
      type: "text",
      text: t("defaultText"),
      fontFamily: TEXT_FONTS[2]!.family,
      fontSize: 72,
      color: "#ffffff",
      align: "center",
      bold: true,
      italic: false,
      highlight: null,
      x: STORY_WIDTH * 0.08,
      y: STORY_HEIGHT * 0.35,
      width: STORY_WIDTH * 0.84,
      height: 280,
      rotation: 0,
      scale: 1,
      zIndex: 1,
      opacity: 1,
    };
    reset({ ...createEmptyStory(bg), elements: [el] });
    beginTextEdit(el);
  }

  function addTextLayer() {
    const id = newElementId();
    const el: TextElement = {
      id,
      type: "text",
      text: t("defaultText"),
      fontFamily: TEXT_FONTS[0]!.family,
      fontSize: 64,
      color: "#ffffff",
      align: "center",
      bold: true,
      italic: false,
      highlight: null,
      x: STORY_WIDTH * 0.08,
      y: STORY_HEIGHT * 0.38,
      width: STORY_WIDTH * 0.84,
      height: 220,
      rotation: 0,
      scale: 1,
      zIndex: nextZIndex(doc.elements),
      opacity: 1,
    };
    push({ ...doc, elements: [...doc.elements, el] });
    beginTextEdit(el);
  }

  function deleteEditingText() {
    const id = editingTextId ?? selectedId;
    if (!id) return;
    push({
      ...doc,
      elements: doc.elements.filter((el) => el.id !== id),
    });
    setSelectedId(null);
    setEditingTextId(null);
    setMode("edit");
  }

  function deleteSelected() {
    if (!selectedId) return;
    updateElements((els) => els.filter((el) => el.id !== selectedId));
    setSelectedId(null);
    setEditingTextId(null);
  }

  function setBackgroundFromPreset(id: string) {
    const preset = STORY_BACKGROUND_PRESETS.find((p) => p.id === id);
    if (!preset) return;
    push({ ...doc, background: preset.background });
    setMode("edit");
  }

  async function publish() {
    if (!storyHasPublishableContent(doc)) {
      toast.error(t("emptyStory"));
      return;
    }
    setPublishing(true);
    try {
      const blob = await exportStoryToBlob(doc);
      const file = new File([blob], `post-${Date.now()}.jpg`, {
        type: "image/jpeg",
      });
      const formData = new FormData();
      formData.append("file", file);
      formData.append("uploadedBy", guestName);
      formData.append("caption", eventName);
      await uploadWithProgress({
        url: `/api/public/media/${uploadToken}`,
        formData,
      });
      toast.success(t("publishSuccess"));
      reset(createEmptyStory());
      onPublished?.();
      onClose();
    } catch (error) {
      const message =
        error instanceof UploadWithProgressError
          ? error.message
          : t("publishError");
      toast.error(message || t("publishError"));
    }
    setPublishing(false);
  }

  function handleClose() {
    if (mode === "textEdit") {
      finishTextEdit();
      return;
    }
    if (mode === "imageEdit") {
      setPendingImage(null);
      setMode("start");
      return;
    }
    if (mode === "camera") {
      stopCamera();
      setMode("start");
      return;
    }
    if (mode === "background" || mode === "preview") {
      setMode("edit");
      return;
    }
    if (mode === "edit") {
      if (storyHasPublishableContent(doc)) {
        const leave = window.confirm(t("discardConfirm"));
        if (!leave) return;
      }
      reset(createEmptyStory());
      setMode("start");
      return;
    }
    onClose();
  }

  const scale = useFullBleedScale(stageRef);
  const showComposeChrome = mode === "edit" || mode === "preview";
  const isStart = mode === "start";

  return (
    <div className="fixed inset-0 z-[80] bg-black text-white">
      <div className="mx-auto flex h-full w-full max-w-lg flex-col md:shadow-2xl">
        <div ref={stageRef} className="relative min-h-0 flex-1 overflow-hidden bg-black">
          <div
            className="absolute inset-0"
            style={{
              background: isStart
                ? `linear-gradient(160deg, ${primaryColor}66, #1a1423 50%, #0a0a0b)`
                : backgroundCss(doc.background),
            }}
            onPointerDown={() => {
              if (mode === "edit") {
                setSelectedId(null);
              }
            }}
          >
            {mode === "camera" ? (
              <>
                <video
                  ref={cameraVideoRef}
                  className={cn(
                    "absolute inset-0 h-full w-full object-cover",
                    !cameraReady && "opacity-0",
                  )}
                  playsInline
                  muted
                  autoPlay
                />
                {!cameraReady ? (
                  <div
                    className="absolute inset-0"
                    style={{
                      background: `linear-gradient(160deg, ${primaryColor}55, #1a1423 55%, #0f0f12)`,
                    }}
                  />
                ) : null}
                {cameraError ? (
                  <div className="absolute inset-x-0 top-1/3 z-10 px-8 text-center">
                    <p className="text-base font-medium">{t("cameraDeniedTitle")}</p>
                    <p className="mt-2 text-sm text-white/70">{t("cameraDenied")}</p>
                  </div>
                ) : null}
              </>
            ) : mode === "imageEdit" && pendingImage ? (
              <div
                className="absolute inset-0 touch-pan-y"
                onPointerDown={onFilterSwipeStart}
                onPointerUp={onFilterSwipeEnd}
                onPointerCancel={() => {
                  filterSwipeRef.current = null;
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={pendingImage.src}
                  alt=""
                  draggable={false}
                  className="pointer-events-none absolute inset-0 h-full w-full object-contain select-none"
                  style={{
                    filter: filterCss(draftFilter, draftAdjust),
                    transform: `rotate(${draftRotation}deg)`,
                  }}
                />
                <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 px-6">
                  <p
                    key={filterLabelFlash}
                    className="text-center text-2xl font-semibold tracking-wide text-white drop-shadow-lg transition-opacity duration-200"
                  >
                    {t(
                      STORY_FILTERS.find((f) => f.id === draftFilter)?.labelKey ??
                        "filterOriginal",
                    )}
                  </p>
                  <p className="text-center text-xs text-white/55">{t("swipeFiltersHint")}</p>
                </div>
              </div>
            ) : mode === "start" ? null : (
              <div
                className="absolute left-1/2 top-1/2"
                style={{
                  width: scale.width,
                  height: scale.height,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <StoryCanvasLayers
                  doc={doc}
                  selectedId={
                    mode === "preview" || mode === "textEdit" ? null : selectedId
                  }
                  hideTextId={mode === "textEdit" ? editingTextId : null}
                  interactive={mode === "edit"}
                  designScale={scale.factor}
                  onSelect={setSelectedId}
                  onEditText={(id) => {
                    const el = doc.elements.find((e) => e.id === id);
                    if (el?.type === "text") beginTextEdit(el);
                  }}
                  onChangeElement={(id, patch) => {
                    replace({
                      ...doc,
                      elements: doc.elements.map((el) =>
                        el.id === id ? ({ ...el, ...patch } as StoryElement) : el,
                      ),
                    });
                  }}
                  onCommitMove={(fromDoc, toDoc) => commit(fromDoc, toDoc)}
                  snapshotDoc={() => structuredClone(doc)}
                />
              </div>
            )}

            {/* On-canvas text input (Instagram-style) */}
            {mode === "textEdit" && editingText ? (
              <div className="absolute inset-0 z-10 flex items-center justify-center px-6">
                <textarea
                  ref={textInputRef}
                  value={textDraft}
                  onChange={(e) => setTextDraft(e.target.value)}
                  placeholder={t("defaultText")}
                  rows={4}
                  enterKeyHint="done"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      finishTextEdit();
                    }
                  }}
                  className="w-full max-w-[90%] resize-none border-0 bg-transparent outline-none placeholder:text-white/35"
                  style={{
                    fontFamily: editingText.fontFamily,
                    fontSize: `clamp(1.5rem, ${editingText.fontSize * scale.factor * 0.9}px, 2.75rem)`,
                    fontWeight: editingText.bold ? 700 : 400,
                    fontStyle: editingText.italic ? "italic" : "normal",
                    color: editingText.color,
                    backgroundColor: editingText.highlight ?? "transparent",
                    textAlign: editingText.align,
                    lineHeight: 1.25,
                    padding: editingText.highlight ? "0.35em 0.55em" : undefined,
                    borderRadius: editingText.highlight ? 8 : undefined,
                    caretColor: "#38bdf8",
                  }}
                  aria-label={t("textPlaceholder")}
                />
              </div>
            ) : null}
          </div>

          {/* Top chrome */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between gap-2 px-3"
            style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
          >
            <div className="pointer-events-auto flex gap-2">
              {showComposeChrome ? (
                <>
                  <ChromeIconButton label={t("undo")} disabled={!canUndo} onClick={undo}>
                    <Undo2 className="size-5" />
                  </ChromeIconButton>
                  <ChromeIconButton label={t("redo")} disabled={!canRedo} onClick={redo}>
                    <Redo2 className="size-5" />
                  </ChromeIconButton>
                </>
              ) : (
                <span className="size-11" aria-hidden />
              )}
            </div>

            <div className="pointer-events-auto flex items-center gap-2">
              {mode === "edit" ? (
                <Button
                  type="button"
                  size="sm"
                  className="h-10 rounded-full px-4 font-semibold text-neutral-950"
                  style={{ backgroundColor: primaryColor }}
                  disabled={!storyHasPublishableContent(doc)}
                  onClick={() => setMode("preview")}
                >
                  {t("next")}
                </Button>
              ) : null}
              {mode === "textEdit" ? (
                <Button
                  type="button"
                  size="sm"
                  className="h-10 rounded-full px-4 font-semibold text-neutral-950"
                  style={{ backgroundColor: primaryColor }}
                  onClick={finishTextEdit}
                >
                  <Check className="mr-1 size-4" />
                  {t("done")}
                </Button>
              ) : null}
              <ChromeIconButton label={t("close")} onClick={handleClose}>
                <X className="size-5" />
              </ChromeIconButton>
            </div>
          </div>

          {/* Start screen actions */}
          {isStart ? (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center px-8">
              <p className="text-center text-xl font-semibold tracking-tight">
                {t("startPrompt")}
              </p>
              <p className="mt-2 max-w-xs text-center text-sm text-white/65">
                {t("startHint")}
              </p>
              <div className="mt-10 grid w-full max-w-sm grid-cols-3 gap-4">
                <StartAction
                  label={t("actionCamera")}
                  onClick={() => setMode("camera")}
                  icon={<Camera className="size-6" />}
                />
                <StartAction
                  label={t("actionPhoto")}
                  onClick={() => fileRef.current?.click()}
                  icon={<ImageIcon className="size-6" />}
                />
                <StartAction
                  label={t("actionText")}
                  onClick={startTextPost}
                  icon={<Type className="size-6" />}
                />
              </div>
              <p className="absolute bottom-8 text-sm font-semibold tracking-[0.25em] text-white">
                {t("modePost")}
              </p>
            </div>
          ) : null}

          {/* Edit left rail */}
          {mode === "edit" ? (
            <div
              className="absolute left-3 z-20 flex flex-col gap-3"
              style={{ top: "max(4.5rem, calc(env(safe-area-inset-top) + 3.5rem))" }}
            >
              <button
                type="button"
                onClick={addTextLayer}
                className="tap-press flex size-12 items-center justify-center rounded-full bg-white text-sm font-bold text-neutral-950 shadow-lg"
                aria-label={t("actionText")}
              >
                Aa
              </button>
              <button
                type="button"
                onClick={() => setMode("background")}
                className="tap-press flex size-12 items-center justify-center rounded-full bg-white/15 text-white shadow-lg ring-1 ring-white/25 backdrop-blur"
                aria-label={t("actionBackground")}
              >
                <Palette className="size-5" />
              </button>
            </div>
          ) : null}

          {/* Camera chrome */}
          {mode === "camera" ? (
            <div
              className="absolute inset-x-0 bottom-0 z-20 px-4"
              style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
            >
              <div className="mb-5 flex items-end justify-between gap-3">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="tap-press relative size-12 overflow-hidden rounded-xl bg-white/15 ring-2 ring-white/40"
                  aria-label={t("actionPhoto")}
                >
                  {galleryPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={galleryPreview} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center">
                      <ImageIcon className="size-5" />
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={captureCamera}
                  disabled={!cameraReady}
                  className="tap-press flex size-[4.5rem] items-center justify-center rounded-full border-[3px] border-white disabled:opacity-40"
                  aria-label={t("capture")}
                >
                  <span className="size-[3.6rem] rounded-full bg-white" />
                </button>
                <button
                  type="button"
                  onClick={startTextPost}
                  className="tap-press flex size-12 items-center justify-center rounded-full bg-white text-sm font-bold text-neutral-950"
                  aria-label={t("actionText")}
                >
                  Aa
                </button>
              </div>
              <p className="pb-1 text-center text-sm font-semibold tracking-[0.25em]">
                {t("modePost")}
              </p>
            </div>
          ) : null}

          {/* Text edit chrome — over photo so backdrop-blur frosts the image */}
          {mode === "textEdit" && editingText ? (
            <div
              className="absolute inset-x-0 bottom-0 z-30 bg-black/20 px-3 pt-4 backdrop-blur-xl"
              style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
            >
              {textChromePanel === "fonts" ? (
                <div className="mb-3 flex gap-1 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {TEXT_FONTS.map((font) => {
                    const active = editingText.fontFamily === font.family;
                    const italicPill = "italicPill" in font && font.italicPill;
                    return (
                      <button
                        key={font.id}
                        type="button"
                        onClick={() =>
                          patchTextElement(editingText.id, { fontFamily: font.family })
                        }
                        className={cn(
                          "shrink-0 px-3.5 py-2 text-[15px] tracking-tight transition",
                          active
                            ? "rounded-full bg-white text-neutral-950"
                            : "bg-transparent text-white",
                        )}
                        style={{
                          fontFamily: font.family,
                          fontStyle: italicPill ? "italic" : undefined,
                        }}
                      >
                        {t(font.labelKey)}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="mb-3 flex justify-center gap-3 py-1">
                  {TEXT_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={cn(
                        "size-9 rounded-full ring-2",
                        editingText.color === color ? "ring-white" : "ring-white/25",
                      )}
                      style={{ backgroundColor: color }}
                      onClick={() => {
                        patchTextElement(editingText.id, { color });
                        setTextChromePanel("fonts");
                      }}
                      aria-label={color}
                    />
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2">
                <div className="flex min-w-0 flex-1 items-center justify-around rounded-2xl bg-black/40 px-1 py-1.5 backdrop-blur-xl">
                  <button
                    type="button"
                    className={cn(
                      "tap-press flex size-11 items-center justify-center rounded-xl text-white",
                      textChromePanel === "fonts" && "bg-white/20",
                    )}
                    onClick={() => {
                      setTextChromePanel("fonts");
                      textInputRef.current?.focus();
                    }}
                    aria-label={t("actionText")}
                  >
                    <span className="text-[15px] font-bold leading-none">Aa</span>
                  </button>

                  <button
                    type="button"
                    className={cn(
                      "tap-press flex size-11 items-center justify-center rounded-xl",
                      textChromePanel === "color" && "bg-white/20",
                    )}
                    onClick={() => {
                      setTextChromePanel("color");
                    }}
                    aria-label={t("textColor")}
                  >
                    <span
                      className="size-[22px] rounded-full ring-2 ring-white/60"
                      style={{
                        background:
                          "conic-gradient(#f87171, #fbbf24, #34d399, #38bdf8, #a78bfa, #f87171)",
                      }}
                    />
                  </button>

                  <button
                    type="button"
                    className={cn(
                      "tap-press flex size-11 items-center justify-center rounded-xl text-white",
                      editingText.italic && "bg-white/20",
                    )}
                    onClick={() =>
                      patchTextElement(editingText.id, { italic: !editingText.italic })
                    }
                    aria-label={t("textItalic")}
                  >
                    <span
                      className="text-[15px] font-semibold leading-none"
                      style={{ fontStyle: "italic", letterSpacing: "-0.06em" }}
                    >
                      //A
                    </span>
                  </button>

                  <button
                    type="button"
                    className="tap-press flex size-11 items-center justify-center rounded-xl text-white"
                    onClick={() => {
                      const order = ["left", "center", "right"] as const;
                      const idx = order.indexOf(editingText.align);
                      const next = order[(idx + 1) % order.length]!;
                      patchTextElement(editingText.id, { align: next });
                    }}
                    aria-label={t("textAlign")}
                  >
                    {editingText.align === "left" ? (
                      <AlignLeft className="size-5" />
                    ) : editingText.align === "right" ? (
                      <AlignRight className="size-5" />
                    ) : (
                      <AlignCenter className="size-5" />
                    )}
                  </button>

                  <button
                    type="button"
                    className={cn(
                      "tap-press flex size-11 items-center justify-center rounded-xl text-white",
                      editingText.highlight && "bg-white/20",
                    )}
                    onClick={() => {
                      const idx = HIGHLIGHT_CYCLE.indexOf(editingText.highlight);
                      const next =
                        HIGHLIGHT_CYCLE[(idx + 1) % HIGHLIGHT_CYCLE.length] ?? null;
                      patchTextElement(editingText.id, { highlight: next });
                    }}
                    aria-label={t("textHighlight")}
                  >
                    <span
                      className="flex size-6 items-center justify-center rounded-md border border-white/80 text-[11px] font-bold leading-none"
                      style={{
                        backgroundColor: editingText.highlight ?? "transparent",
                        color: editingText.highlight ? editingText.color : "white",
                      }}
                    >
                      A
                    </span>
                  </button>
                </div>

                <button
                  type="button"
                  className="tap-press flex size-11 shrink-0 items-center justify-center rounded-xl bg-black/40 text-white/80 backdrop-blur-xl"
                  onClick={deleteEditingText}
                  aria-label={t("delete")}
                >
                  <Trash2 className="size-5" />
                </button>
              </div>
            </div>
          ) : null}

        </div>

        {/* Bottom panels */}
        {mode === "imageEdit" ? (
          <div
            className="shrink-0 border-t border-white/10 bg-neutral-950 px-3 pt-3"
            style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
          >
            <ImageEditControls
              onRotateLeft={() => setDraftRotation((r) => r - 90)}
              onRotateRight={() => setDraftRotation((r) => r + 90)}
              onDone={commitPendingImage}
              t={t}
            />
          </div>
        ) : null}

        {mode === "background" ? (
          <div
            className="shrink-0 border-t border-white/10 bg-neutral-950 px-3 pt-3"
            style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
          >
            <p className="mb-2 text-sm font-medium">{t("pickBackground")}</p>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {STORY_BACKGROUND_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className="h-14 w-14 shrink-0 rounded-xl ring-1 ring-white/20"
                  style={{ background: backgroundCss(preset.background) }}
                  onClick={() => setBackgroundFromPreset(preset.id)}
                  aria-label={t(preset.labelKey)}
                />
              ))}
            </div>
          </div>
        ) : null}

        {mode === "preview" ? (
          <div
            className="shrink-0 border-t border-white/10 bg-neutral-950 px-3 pt-3"
            style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
          >
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-11 flex-1 border-white/20 bg-transparent text-white hover:bg-white/10"
                onClick={() => setMode("edit")}
              >
                {t("backToEdit")}
              </Button>
              <Button
                type="button"
                className="h-11 flex-1 text-neutral-950"
                style={{ backgroundColor: primaryColor }}
                disabled={publishing}
                onClick={() => void publish()}
              >
                {publishing ? t("publishing") : t("publish")}
              </Button>
            </div>
          </div>
        ) : null}

        {mode === "edit" ? (
          <div
            className="shrink-0 border-t border-white/10 bg-neutral-950/95 px-3 pt-2"
            style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
          >
            {selected && selected.type !== "text" ? (
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="truncate text-xs text-white/55">
                  {t("selected", { type: selected.type })}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-9 gap-1.5 text-red-300 hover:bg-red-500/10 hover:text-red-200"
                  onClick={deleteSelected}
                >
                  <Trash2 className="size-4" />
                  {t("delete")}
                </Button>
              </div>
            ) : (
              <p className="py-2 text-center text-xs text-white/45">{t("composeHint")}</p>
            )}
            <p className="pb-1 text-center text-sm font-semibold tracking-[0.25em]">
              {t("modePost")}
            </p>
          </div>
        ) : null}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0] ?? null;
          e.target.value = "";
          onPickImage(file);
        }}
      />
    </div>
  );
}

function StartAction({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="tap-press flex flex-col items-center gap-3 rounded-2xl bg-white/10 px-2 py-5 text-white ring-1 ring-white/15 transition active:scale-[0.98]"
    >
      <span className="flex size-14 items-center justify-center rounded-full bg-white/15">
        {icon}
      </span>
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}

function ChromeIconButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="tap-press flex size-11 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-md disabled:opacity-30"
    >
      {children}
    </button>
  );
}

function useFullBleedScale(stageRef: RefObject<HTMLDivElement | null>) {
  const [scale, setScale] = useState({
    width: STORY_WIDTH,
    height: STORY_HEIGHT,
    factor: 1,
  });

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      const factor = Math.min(rect.width / STORY_WIDTH, rect.height / STORY_HEIGHT);
      setScale({
        width: STORY_WIDTH * factor,
        height: STORY_HEIGHT * factor,
        factor,
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [stageRef]);

  return scale;
}

function ImageEditControls({
  onRotateLeft,
  onRotateRight,
  onDone,
  t,
}: {
  onRotateLeft: () => void;
  onRotateRight: () => void;
  onDone: () => void;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 gap-1.5 border-white/20 bg-transparent text-white hover:bg-white/10"
          onClick={onRotateLeft}
        >
          <RotateCcw className="size-4" />
          {t("rotateLeft")}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 gap-1.5 border-white/20 bg-transparent text-white hover:bg-white/10"
          onClick={onRotateRight}
        >
          <RotateCw className="size-4" />
          {t("rotateRight")}
        </Button>
      </div>
      <Button type="button" className="h-11 w-full gap-2" onClick={onDone}>
        <Check className="size-4" />
        {t("usePhoto")}
      </Button>
    </div>
  );
}

function StoryCanvasLayers({
  doc,
  selectedId,
  hideTextId,
  interactive,
  designScale,
  onSelect,
  onEditText,
  onChangeElement,
  onCommitMove,
  snapshotDoc,
}: {
  doc: StoryDocument;
  selectedId: string | null;
  hideTextId?: string | null;
  interactive: boolean;
  designScale: number;
  onSelect: (id: string | null) => void;
  onEditText: (id: string) => void;
  onChangeElement: (id: string, patch: Partial<StoryElement>) => void;
  onCommitMove: (from: StoryDocument, to: StoryDocument) => void;
  snapshotDoc: () => StoryDocument;
}) {
  const sorted = [...doc.elements].sort((a, b) => a.zIndex - b.zIndex);
  const dragRef = useRef<{
    id: string;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    fromDoc: StoryDocument;
    isText: boolean;
    moved: boolean;
  } | null>(null);

  function onPointerDown(e: ReactPointerEvent, el: StoryElement) {
    if (!interactive) return;
    e.stopPropagation();
    onSelect(el.id);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    dragRef.current = {
      id: el.id,
      startX: e.clientX,
      startY: e.clientY,
      origX: el.x,
      origY: el.y,
      fromDoc: snapshotDoc(),
      isText: el.type === "text",
      moved: false,
    };
  }

  function onPointerMove(e: ReactPointerEvent) {
    const drag = dragRef.current;
    if (!drag || !interactive) return;
    const dx = (e.clientX - drag.startX) / designScale;
    const dy = (e.clientY - drag.startY) / designScale;
    if (Math.abs(dx) + Math.abs(dy) > 3) drag.moved = true;
    onChangeElement(drag.id, {
      x: drag.origX + dx,
      y: drag.origY + dy,
    });
  }

  function onPointerUp() {
    const drag = dragRef.current;
    if (!drag) return;
    dragRef.current = null;
    if (drag.isText && !drag.moved) {
      onEditText(drag.id);
      return;
    }
    onCommitMove(drag.fromDoc, snapshotDoc());
  }

  return (
    <div className="absolute inset-0">
      {sorted.map((el) => {
        if (hideTextId && el.id === hideTextId) return null;
        const selected = el.id === selectedId;
        const style: CSSProperties = {
          position: "absolute",
          left: el.x * designScale,
          top: el.y * designScale,
          width: el.width * el.scale * designScale,
          height: el.height * el.scale * designScale,
          transform: `rotate(${el.rotation}deg)`,
          opacity: el.opacity,
          zIndex: el.zIndex,
          touchAction: "none",
        };

        return (
          <div
            key={el.id}
            style={style}
            className={cn(
              "origin-center",
              interactive && "cursor-grab active:cursor-grabbing",
              selected && interactive && "ring-2 ring-white ring-offset-2 ring-offset-transparent",
            )}
            onPointerDown={(e) => onPointerDown(e, el)}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            {el.type === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={el.src}
                alt=""
                draggable={false}
                className="h-full w-full object-cover"
                style={{ filter: filterCss(el.filter, el.adjustments) }}
              />
            ) : el.type === "video" ? (
              // eslint-disable-next-line jsx-a11y/media-has-caption
              <video
                src={el.src}
                className="h-full w-full object-cover"
                muted
                playsInline
                loop
                autoPlay
              />
            ) : el.type === "text" ? (
              <div
                className="flex h-full w-full items-center px-2"
                style={{
                  justifyContent:
                    el.align === "left"
                      ? "flex-start"
                      : el.align === "right"
                        ? "flex-end"
                        : "center",
                  fontFamily: el.fontFamily,
                  fontSize: el.fontSize * el.scale * designScale,
                  fontWeight: el.bold ? 700 : 400,
                  fontStyle: el.italic ? "italic" : "normal",
                  color: el.color,
                  backgroundColor: el.highlight ?? undefined,
                  textAlign: el.align,
                  whiteSpace: "pre-wrap",
                  lineHeight: 1.25,
                  borderRadius: el.highlight ? 8 : undefined,
                  padding: el.highlight ? "0.25em 0.4em" : undefined,
                }}
              >
                {el.text}
              </div>
            ) : el.type === "drawing" ? (
              <svg className="h-full w-full" viewBox={`0 0 ${STORY_WIDTH} ${STORY_HEIGHT}`}>
                {el.strokes.map((stroke) => (
                  <polyline
                    key={stroke.id}
                    fill="none"
                    stroke={stroke.color}
                    strokeWidth={stroke.size}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={stroke.points.map((p) => `${p.x},${p.y}`).join(" ")}
                  />
                ))}
              </svg>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={el.src} alt={el.label ?? ""} className="h-full w-full object-contain" />
            )}
          </div>
        );
      })}
    </div>
  );
}
