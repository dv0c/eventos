"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

interface WallMediaItem {
  id: string;
  url: string;
  caption: string | null;
  isFeatured: boolean;
  createdAt: string;
}

interface LiveWallProps {
  eventSlug: string;
  primaryColor?: string;
  secondaryColor?: string;
}

export function LiveWall({
  eventSlug,
  primaryColor = "#8B5CF6",
  secondaryColor = "#F59E0B",
}: LiveWallProps) {
  const t = useTranslations("publicEvent");
  const [media, setMedia] = useState<WallMediaItem[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const source = new EventSource(`/api/public/wall/${eventSlug}/stream`);

    source.onopen = () => setConnected(true);
    source.onerror = () => setConnected(false);

    source.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as {
          media: WallMediaItem[];
          initial?: boolean;
        };

        if (data.initial) {
          setMedia(data.media);
        } else if (data.media.length > 0) {
          setMedia((prev) => {
            const existingIds = new Set(prev.map((m) => m.id));
            const newItems = data.media.filter((m) => !existingIds.has(m.id));
            return [...newItems, ...prev].slice(0, 100);
          });
        }
      } catch {
        // Ignore malformed events
      }
    };

    return () => source.close();
  }, [eventSlug]);

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{
        background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
      }}
    >
      <header className="flex items-center justify-between px-6 py-4 text-white">
        <h1 className="text-2xl font-bold tracking-tight">{t("wallTitle")}</h1>
        <span
          className={`h-2 w-2 rounded-full ${connected ? "bg-green-400" : "bg-red-400"}`}
          title={connected ? t("wallLive") : t("wallOffline")}
        />
      </header>

      {media.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-4 text-center text-white">
          <p className="text-xl font-medium">{t("wallEmpty")}</p>
          <p className="mt-2 max-w-md text-white/70">{t("wallEmptyDesc")}</p>
        </div>
      ) : (
        <div className="grid flex-1 grid-cols-2 gap-2 p-2 sm:grid-cols-3 lg:grid-cols-4 lg:gap-4 lg:p-4">
          {media.map((item) => (
            <figure
              key={item.id}
              className={`relative overflow-hidden rounded-xl shadow-lg ${
                item.isFeatured ? "col-span-2 row-span-2" : ""
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.url}
                alt={item.caption ?? ""}
                className="h-full w-full object-cover"
              />
              {item.caption ? (
                <figcaption className="absolute inset-x-0 bottom-0 bg-black/50 px-3 py-2 text-sm text-white">
                  {item.caption}
                </figcaption>
              ) : null}
            </figure>
          ))}
        </div>
      )}
    </div>
  );
}
