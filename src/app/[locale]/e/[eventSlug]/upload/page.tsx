import { notFound } from "next/navigation";

import { PublicUploadForm } from "@/components/media/public-upload-form";
import { mediaService } from "@/server/services/media.service";

interface PublicUploadPageProps {
  params: Promise<{ eventSlug: string }>;
}

export default async function PublicUploadPage({ params }: PublicUploadPageProps) {
  const { eventSlug } = await params;

  const uploadInfo = await mediaService.getUploadTokenBySlug(eventSlug);

  if (!uploadInfo) {
    notFound();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <PublicUploadForm
        uploadToken={uploadInfo.uploadToken}
        eventName={uploadInfo.eventName}
      />
    </div>
  );
}
