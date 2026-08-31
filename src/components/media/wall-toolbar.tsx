"use client";

import { Expand, MoreHorizontal, Settings2, Volume2, VolumeX } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface WallToolbarProps {
  onCustomize: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export function WallToolbar({
  onCustomize,
  soundEnabled,
  onToggleSound,
}: WallToolbarProps) {
  const t = useTranslations("events.wallCustomization");

  function enterFullscreen() {
    if (document.documentElement.requestFullscreen) {
      void document.documentElement.requestFullscreen();
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 px-4 py-3">
      <Button variant="gold" size="sm" className="gap-2" onClick={enterFullscreen}>
        <Expand className="h-4 w-4" />
        {t("enterFullscreen")}
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="gap-2 bg-white/90"
        onClick={onToggleSound}
      >
        {soundEnabled ? (
          <Volume2 className="h-4 w-4" />
        ) : (
          <VolumeX className="h-4 w-4" />
        )}
        {soundEnabled ? t("turnSoundOff") : t("turnSoundOn")}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-1 text-primary">
            <MoreHorizontal className="h-4 w-4" />
            {t("moreOptions")}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center">
          <DropdownMenuItem onClick={onCustomize} className="gap-2">
            <Settings2 className="h-4 w-4" />
            {t("customize")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
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
