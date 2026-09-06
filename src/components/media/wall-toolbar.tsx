"use client";

import {
  Bell,
  Expand,
  Minimize,
  MoreHorizontal,
  Settings2,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { GuestNotifyForm } from "@/components/media/guest-notify-form";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface WallToolbarProps {
  onCustomize: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  eventId?: string;
  canNotify?: boolean;
}

const glassButtonClass =
  "h-9 gap-2 rounded-full border border-white/20 bg-black/45 px-3 text-white backdrop-blur-md hover:bg-black/55 hover:text-white sm:px-4";

export function WallToolbar({
  onCustomize,
  soundEnabled,
  onToggleSound,
  eventId,
  canNotify = false,
}: WallToolbarProps) {
  const t = useTranslations("events.wallCustomization");
  const tMod = useTranslations("moderatorAlbum");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [notifyOpen, setNotifyOpen] = useState(false);

  useEffect(() => {
    function syncFullscreen() {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }
    syncFullscreen();
    document.addEventListener("fullscreenchange", syncFullscreen);
    return () => document.removeEventListener("fullscreenchange", syncFullscreen);
  }, []);

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      void document.exitFullscreen();
      return;
    }
    if (document.documentElement.requestFullscreen) {
      void document.documentElement.requestFullscreen();
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        className={glassButtonClass}
        onClick={toggleFullscreen}
      >
        {isFullscreen ? (
          <Minimize className="h-4 w-4" />
        ) : (
          <Expand className="h-4 w-4" />
        )}
        <span className="hidden sm:inline">
          {isFullscreen ? t("exitFullscreen") : t("enterFullscreen")}
        </span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={glassButtonClass}
        onClick={onToggleSound}
      >
        {soundEnabled ? (
          <Volume2 className="h-4 w-4" />
        ) : (
          <VolumeX className="h-4 w-4" />
        )}
        <span className="hidden sm:inline">
          {soundEnabled ? t("turnSoundOff") : t("turnSoundOn")}
        </span>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={`${glassButtonClass} gap-1`}
          >
            <MoreHorizontal className="h-4 w-4" />
            <span className="hidden sm:inline">{t("moreOptions")}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center">
          <DropdownMenuItem onClick={onCustomize} className="gap-2">
            <Settings2 className="h-4 w-4" />
            {t("customize")}
          </DropdownMenuItem>
          {canNotify && eventId ? (
            <DropdownMenuItem
              onClick={() => setNotifyOpen(true)}
              className="gap-2"
            >
              <Bell className="h-4 w-4" />
              {tMod("notifyTitle")}
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      {canNotify && eventId ? (
        <Sheet open={notifyOpen} onOpenChange={setNotifyOpen}>
          <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{tMod("notifyTitle")}</SheetTitle>
            </SheetHeader>
            <div className="mt-4 pb-6">
              <GuestNotifyForm eventId={eventId} />
            </div>
          </SheetContent>
        </Sheet>
      ) : null}
    </div>
  );
}

export function useWallSound() {
  const [soundEnabled, setSoundEnabled] = useState(false);
  return {
    soundEnabled,
    toggleSound: () => setSoundEnabled((prev) => !prev),
  };
}
