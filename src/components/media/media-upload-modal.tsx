"use client";

import { CheckCircle2, ImagePlus, Loader2, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  uploadWithProgress,
  UploadWithProgressError,
} from "@/lib/upload-with-progress";
import { cn } from "@/lib/utils";

type FileStatus = "queued" | "uploading" | "done" | "error";

interface QueueItem {
  id: string;
  file: File;
  previewUrl: string | null;
  status: FileStatus;
  progress: number;
  error?: string;
  response?: unknown;
}

export interface MediaUploadSuccessFile {
  file: File;
  response: unknown;
}

export interface MediaUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  mode?: "single" | "multiple";
  accept?: string;
  maxBytes?: number;
  upload: {
    url: string;
    buildFormData: (file: File) => FormData;
    method?: "POST" | "PUT" | "PATCH";
  };
  primaryActionLabel?: string;
  onSuccess: (result: { files: MediaUploadSuccessFile[] }) => void | Promise<void>;
  onError?: (error: Error) => void;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MediaUploadModal({
  open,
  onOpenChange,
  title,
  description,
  mode = "single",
  accept = "image/jpeg,image/png,image/webp,image/*",
  maxBytes,
  upload,
  primaryActionLabel,
  onSuccess,
  onError,
}: MediaUploadModalProps) {
  const t = useTranslations("common.uploadModal");
  const tCommon = useTranslations("common");
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (open) return;
    setQueue((prev) => {
      for (const item of prev) {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      }
      return [];
    });
    setIsUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }, [open]);

  useEffect(() => {
    return () => {
      for (const item of queue) {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      }
    };
  }, [queue]);

  const overallProgress = useMemo(() => {
    if (queue.length === 0) return 0;
    const sum = queue.reduce((acc, item) => acc + item.progress, 0);
    return Math.round(sum / queue.length);
  }, [queue]);

  const canUpload =
    queue.length > 0 &&
    !isUploading &&
    queue.some((item) => item.status === "queued" || item.status === "error");

  function addFiles(fileList: FileList | null) {
    if (!fileList?.length) return;
    const incoming = Array.from(fileList);
    const nextItems: QueueItem[] = [];

    for (const file of incoming) {
      if (maxBytes && file.size > maxBytes) {
        toast.error(t("tooLarge", { max: formatBytes(maxBytes) }));
        continue;
      }
      nextItems.push({
        id: `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`,
        file,
        previewUrl: file.type.startsWith("image/")
          ? URL.createObjectURL(file)
          : null,
        status: "queued",
        progress: 0,
      });
    }

    if (nextItems.length === 0) return;

    setQueue((prev) => {
      for (const item of mode === "single" ? prev : []) {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      }
      return mode === "single" ? nextItems.slice(0, 1) : [...prev, ...nextItems];
    });
  }

  function removeItem(id: string) {
    setQueue((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((item) => item.id !== id);
    });
  }

  async function startUpload() {
    const pending = queue.filter(
      (item) => item.status === "queued" || item.status === "error",
    );
    if (pending.length === 0) return;

    setIsUploading(true);
    const successes: MediaUploadSuccessFile[] = [];

    for (const item of pending) {
      setQueue((prev) =>
        prev.map((row) =>
          row.id === item.id
            ? { ...row, status: "uploading", progress: 0, error: undefined }
            : row,
        ),
      );

      try {
        const response = await uploadWithProgress({
          url: upload.url,
          method: upload.method ?? "POST",
          formData: upload.buildFormData(item.file),
          onProgress: (percent) => {
            setQueue((prev) =>
              prev.map((row) =>
                row.id === item.id ? { ...row, progress: percent } : row,
              ),
            );
          },
        });

        successes.push({ file: item.file, response });
        setQueue((prev) =>
          prev.map((row) =>
            row.id === item.id
              ? { ...row, status: "done", progress: 100, response }
              : row,
          ),
        );
      } catch (error) {
        const message =
          error instanceof UploadWithProgressError
            ? error.message
            : error instanceof Error
              ? error.message
              : t("failed");
        setQueue((prev) =>
          prev.map((row) =>
            row.id === item.id
              ? { ...row, status: "error", error: message, progress: 0 }
              : row,
          ),
        );
        onError?.(error instanceof Error ? error : new Error(message));
        toast.error(message);
      }
    }

    setIsUploading(false);

    if (successes.length > 0) {
      toast.success(
        successes.length === 1
          ? t("doneOne")
          : t("doneMany", { count: successes.length }),
      );
      await onSuccess({ files: successes });
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={isUploading ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : null}
        </DialogHeader>

        <div className="space-y-4">
          <label
            htmlFor={inputId}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 bg-black/30 px-4 py-8 text-center transition-colors hover:bg-black/45",
              isUploading && "pointer-events-none opacity-60",
            )}
          >
            <ImagePlus className="h-8 w-8 text-muted-foreground" aria-hidden />
            <span className="text-sm font-medium">{t("chooseFiles")}</span>
            <span className="text-xs text-muted-foreground">
              {mode === "multiple" ? t("multipleHint") : t("singleHint")}
              {maxBytes ? ` · ${t("maxSize", { max: formatBytes(maxBytes) })}` : null}
            </span>
            <input
              id={inputId}
              ref={inputRef}
              type="file"
              accept={accept}
              multiple={mode === "multiple"}
              className="hidden"
              disabled={isUploading}
              onChange={(event) => {
                addFiles(event.target.files);
                event.target.value = "";
              }}
            />
          </label>

          {queue.length > 0 ? (
            <ul className="max-h-56 space-y-2 overflow-y-auto">
              {queue.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/25 p-2"
                >
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted/30">
                    {item.previewUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.previewUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                        file
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="truncate text-sm font-medium">{item.file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatBytes(item.file.size)}
                      {item.status === "uploading"
                        ? ` · ${t("uploading")} ${item.progress}%`
                        : null}
                      {item.status === "done" ? ` · ${t("done")}` : null}
                      {item.status === "error" ? ` · ${item.error ?? t("failed")}` : null}
                      {item.status === "queued" ? ` · ${t("queued")}` : null}
                    </p>
                    {item.status === "uploading" ? (
                      <Progress value={item.progress} className="h-1.5" />
                    ) : null}
                  </div>
                  <div className="shrink-0">
                    {item.status === "uploading" ? (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : item.status === "done" ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    ) : item.status === "error" ? (
                      <XCircle className="h-4 w-4 text-destructive" />
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2"
                        disabled={isUploading}
                        onClick={() => removeItem(item.id)}
                      >
                        {tCommon("remove")}
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : null}

          {isUploading && queue.length > 1 ? (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{t("overall")}</span>
                <span>{overallProgress}%</span>
              </div>
              <Progress value={overallProgress} className="h-2" />
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            disabled={isUploading}
            onClick={() => onOpenChange(false)}
          >
            {tCommon("cancel")}
          </Button>
          <Button
            type="button"
            variant="gold"
            disabled={!canUpload}
            onClick={() => void startUpload()}
          >
            {isUploading
              ? t("uploading")
              : (primaryActionLabel ?? t("upload"))}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
