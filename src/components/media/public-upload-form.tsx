"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Camera, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PublicUploadFormProps {
  uploadToken: string;
  eventName: string;
}

export function PublicUploadForm({ uploadToken, eventName }: PublicUploadFormProps) {
  const t = useTranslations("media");
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [uploadedBy, setUploadedBy] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files?.[0];
      if (!selected) return;
      setFile(selected);
      if (preview) URL.revokeObjectURL(preview);
      setPreview(URL.createObjectURL(selected));
    },
    [preview],
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;

    setIsUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    if (caption) formData.append("caption", caption);
    if (uploadedBy) formData.append("uploadedBy", uploadedBy);

    try {
      const response = await fetch(`/api/public/media/${uploadToken}`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const json = await response.json();
        toast.error(json.error?.message ?? t("uploadError"));
        setIsUploading(false);
        return;
      }

      toast.success(t("uploadSuccess"));
      setFile(null);
      setCaption("");
      if (preview) URL.revokeObjectURL(preview);
      setPreview(null);
    } catch {
      toast.error(t("uploadError"));
    }

    setIsUploading(false);
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-6">
      <div className="text-center">
        <Camera className="mx-auto mb-4 h-12 w-12 text-primary" />
        <h1 className="text-2xl font-bold">{t("uploadTitle")}</h1>
        <p className="mt-2 text-muted-foreground">{eventName}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="photo">{t("selectPhoto")}</Label>
          <Input
            id="photo"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileChange}
          />
        </div>

        {preview ? (
          <div className="overflow-hidden rounded-lg border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Preview" className="w-full object-cover" />
          </div>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="caption">{t("caption")}</Label>
          <Input
            id="caption"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder={t("captionPlaceholder")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="uploadedBy">{t("yourName")}</Label>
          <Input
            id="uploadedBy"
            value={uploadedBy}
            onChange={(e) => setUploadedBy(e.target.value)}
            placeholder={t("yourNamePlaceholder")}
          />
        </div>

        <Button
          type="submit"
          variant="gold"
          className="w-full"
          disabled={!file || isUploading}
        >
          <Upload className="mr-2 h-4 w-4" />
          {isUploading ? t("uploading") : t("uploadButton")}
        </Button>

        <p className="text-center text-xs text-muted-foreground">{t("moderationNote")}</p>
      </form>
    </div>
  );
}
