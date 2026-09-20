"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";

import type { WallReactionEvent } from "@/components/media/wall/types";

interface Particle {
  id: string;
  emoji: string;
  x: number;
  y: number;
  drift: number;
  rotate: number;
  size: number;
  rise: number;
  duration: number;
}

interface QualityTier {
  burstPerEvent: number;
  maxParticles: number;
  throwGapMs: number;
  simpleMotion: boolean;
}

interface WallFloatingReactionsProps {
  events: WallReactionEvent[];
  hidden?: boolean;
}

const HIGH_TIER: QualityTier = {
  burstPerEvent: 3,
  maxParticles: 24,
  throwGapMs: 110,
  simpleMotion: false,
};

const LOW_TIER: QualityTier = {
  burstPerEvent: 1,
  maxParticles: 10,
  throwGapMs: 200,
  simpleMotion: true,
};

function detectQualityTier(): QualityTier {
  if (typeof navigator === "undefined") return HIGH_TIER;
  const cores = navigator.hardwareConcurrency || 8;
  const memory =
    "deviceMemory" in navigator
      ? (navigator as Navigator & { deviceMemory?: number }).deviceMemory
      : undefined;
  if (cores <= 4 || (typeof memory === "number" && memory <= 4)) {
    return LOW_TIER;
  }
  return HIGH_TIER;
}

function createThrownParticle(
  emoji: string,
  prefix: string,
  throwIndex: number,
  simpleMotion: boolean,
): Particle {
  const side = throwIndex % 2 === 0 ? -1 : 1;
  const driftMagnitude = simpleMotion
    ? 40 + Math.random() * 60
    : 80 + Math.random() * 140;
  return {
    id: `${prefix}-${throwIndex}-${Math.random().toString(36).slice(2, 7)}`,
    emoji,
    x: 5 + Math.random() * 90,
    y: 8 + Math.random() * 27,
    drift: side * driftMagnitude + (Math.random() - 0.5) * 40,
    rotate: simpleMotion ? side * 20 : side * (30 + Math.random() * 70),
    size: simpleMotion ? 0.95 : 0.9 + Math.random() * 0.55,
    rise: simpleMotion
      ? -(180 + Math.random() * 120)
      : -(280 + Math.random() * 240),
    duration: simpleMotion ? 1.6 + Math.random() * 0.4 : 2.0 + Math.random() * 0.9,
  };
}

export function WallFloatingReactions({
  events,
  hidden,
}: WallFloatingReactionsProps) {
  const reducedMotion = useReducedMotion();
  const tier = useMemo(() => detectQualityTier(), []);
  const [particles, setParticles] = useState<Particle[]>([]);
  const seenRef = useRef<Set<string>>(new Set());
  const queueRef = useRef<Particle[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const removalTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );
  const pausedRef = useRef(Boolean(hidden || reducedMotion));
  const maxParticlesRef = useRef(tier.maxParticles);
  const throwGapRef = useRef(tier.throwGapMs);

  pausedRef.current = Boolean(hidden || reducedMotion);
  maxParticlesRef.current = tier.maxParticles;
  throwGapRef.current = tier.throwGapMs;

  function clearThrowTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  function clearRemovalTimers() {
    for (const timer of removalTimersRef.current.values()) {
      clearTimeout(timer);
    }
    removalTimersRef.current.clear();
  }

  function scheduleRemoval(particleId: string, durationSec: number) {
    const existing = removalTimersRef.current.get(particleId);
    if (existing) clearTimeout(existing);
    const timer = setTimeout(() => {
      removalTimersRef.current.delete(particleId);
      setParticles((prev) => prev.filter((p) => p.id !== particleId));
    }, durationSec * 1000 + 50);
    removalTimersRef.current.set(particleId, timer);
  }

  function ensureThrower() {
    if (timerRef.current || pausedRef.current) return;
    timerRef.current = setInterval(() => {
      if (pausedRef.current) {
        clearThrowTimer();
        return;
      }
      const next = queueRef.current.shift();
      if (!next) {
        clearThrowTimer();
        return;
      }
      setParticles((prev) => {
        const nextList = [...prev, next].slice(-maxParticlesRef.current);
        return nextList;
      });
      scheduleRemoval(next.id, next.duration);
    }, throwGapRef.current);
  }

  function enqueueThrows(batch: Particle[]) {
    if (pausedRef.current || batch.length === 0) return;
    const queueCap = maxParticlesRef.current * 2;
    queueRef.current.push(...batch);
    if (queueRef.current.length > queueCap) {
      queueRef.current = queueRef.current.slice(-queueCap);
    }
    ensureThrower();
  }

  useEffect(() => {
    if (hidden || reducedMotion) {
      clearThrowTimer();
      clearRemovalTimers();
      queueRef.current = [];
      setParticles([]);
    }
  }, [hidden, reducedMotion]);

  useEffect(
    () => () => {
      clearThrowTimer();
      clearRemovalTimers();
    },
    [],
  );

  useEffect(() => {
    if (hidden || reducedMotion || events.length === 0) return;

    const fresh = events.filter((event) => {
      const key = event.id ?? `${event.mediaId}-${event.createdAt}-${event.emoji}`;
      if (seenRef.current.has(key)) return false;
      return true;
    });

    if (fresh.length === 0) return;

    for (const event of fresh) {
      seenRef.current.add(
        event.id ?? `${event.mediaId}-${event.createdAt}-${event.emoji}`,
      );
    }

    // Bound seen set growth on long-running wall sessions
    if (seenRef.current.size > 500) {
      const keep = [...seenRef.current].slice(-250);
      seenRef.current = new Set(keep);
    }

    const batch: Particle[] = [];
    let throwIndex = 0;
    for (const event of fresh) {
      for (let i = 0; i < tier.burstPerEvent; i++) {
        batch.push(
          createThrownParticle(
            event.emoji,
            `${event.id ?? event.createdAt}-${i}`,
            throwIndex++,
            tier.simpleMotion,
          ),
        );
      }
    }
    enqueueThrows(batch);
  }, [events, hidden, reducedMotion, tier]);

  if (hidden || reducedMotion) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden" aria-hidden>
      <AnimatePresence>
        {particles.map((particle) => (
          <motion.span
            key={particle.id}
            className="absolute drop-shadow-lg will-change-transform"
            style={{
              left: `${particle.x}%`,
              bottom: `${particle.y}%`,
              fontSize: `${1.75 * particle.size}rem`,
            }}
            initial={
              tier.simpleMotion
                ? { opacity: 0, y: 10 }
                : { opacity: 0, y: 10, scale: 0.35, rotate: 0, x: 0 }
            }
            animate={
              tier.simpleMotion
                ? {
                    opacity: [0, 1, 1, 0],
                    y: [10, particle.rise],
                  }
                : {
                    opacity: [0, 1, 1, 0],
                    y: [10, particle.rise * 0.35, particle.rise],
                    x: [0, particle.drift * 0.4, particle.drift],
                    scale: [0.35, 1.25 * particle.size, particle.size],
                    rotate: [0, particle.rotate * 0.5, particle.rotate],
                  }
            }
            exit={{ opacity: 0 }}
            transition={{
              duration: particle.duration,
              ease: [0.16, 0.84, 0.44, 1],
            }}
          >
            {particle.emoji}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
}
