import { notFound, redirect } from "next/navigation";

import { mediaService } from "@/server/services/media.service";

interface PublicUploadPageProps {
  params: Promise<{ locale: string; eventSlug: string }>;
}

export default async function PublicUploadPage({ params }: PublicUploadPageProps) {
  const { locale, eventSlug } = await params;

  const uploadInfo = await mediaService.getUploadTokenBySlug(eventSlug);

  if (!uploadInfo) {
    notFound();
  }

  redirect(`/${locale}/a/${uploadInfo.uploadToken}?tab=upload`);
}
