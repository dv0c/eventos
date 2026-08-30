"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

interface CountdownProps {
  targetDate: string;
}

export function EventCountdown({ targetDate }: CountdownProps) {
  const t = useTranslations("publicEvent");
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0 });

  useEffect(() => {
    const target = new Date(targetDate).getTime();

    function update() {
      const now = Date.now();
      const diff = Math.max(0, target - now);
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
      });
    }

    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return (
    <div className="flex justify-center gap-6">
      <div className="text-center">
        <p className="text-3xl font-bold">{timeLeft.days}</p>
        <p className="text-sm text-white/70">{t("days")}</p>
      </div>
      <div className="text-center">
        <p className="text-3xl font-bold">{timeLeft.hours}</p>
        <p className="text-sm text-white/70">{t("hours")}</p>
      </div>
      <div className="text-center">
        <p className="text-3xl font-bold">{timeLeft.minutes}</p>
        <p className="text-sm text-white/70">{t("minutes")}</p>
      </div>
    </div>
  );
}
