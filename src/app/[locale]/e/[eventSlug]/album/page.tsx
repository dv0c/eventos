import { notFound } from "next/navigation";

interface PublicAlbumPageProps {
  params: Promise<{ eventSlug: string }>;
}

/** Slug-based album URLs are disabled — guests must use /a/[albumToken]. */
export default async function PublicAlbumPage(_props: PublicAlbumPageProps) {
  notFound();
}
