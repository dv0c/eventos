"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

import type { WallReactionEvent } from "@/components/media/wall/types";
import { WALL_REACTION_EMOJIS } from "@/lib/wall-reactions";

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

interface AppearBurst {
  mediaId: string;
  appearKey: string;
  reactionCounts?: Record<string, number> | null;
}

interface WallFloatingReactionsProps {
  events: WallReactionEvent[];
  appearBurst?: AppearBurst | null;
  hidden?: boolean;
}

const MAX_PARTICLES = 48;
const BURST_PER_EVENT = 5;
const APPEAR_MAX_PARTICLES = 18;
const THROW_GAP_MS = 110;

function createThrownParticle(emoji: string, prefix: string, throwIndex: number): Particle {
  const side = throwIndex % 2 === 0 ? -1 : 1;
  const driftMagnitude = 80 + Math.random() * 140;
  return {
    id: `${prefix}-${throwIndex}-${Math.random().toString(36).slice(2, 7)}`,
    emoji,
    // Spawn across the full width
    x: 5 + Math.random() * 90,
    // Vary origin vertically in the lower third
    y: 8 + Math.random() * 27,
    drift: side * driftMagnitude + (Math.random() - 0.5) * 40,
    rotate: side * (30 + Math.random() * 70),
    size: 0.9 + Math.random() * 0.55,
    // Tall rise so pieces reach the upper areas of the screen
    rise: -(280 + Math.random() * 240),
    duration: 2.0 + Math.random() * 0.9,
  };
}

function emojisFromCounts(counts?: Record<string, number> | null): string[] {
  const weighted: string[] = [];
  if (!counts) return weighted;
  for (const emoji of WALL_REACTION_EMOJIS) {
    const count = counts[emoji] ?? 0;
    const copies = Math.min(count, 8);
    for (let i = 0; i < copies; i++) {
      weighted.push(emoji);
    }
  }
  return weighted;
}

export function WallFloatingReactions({
  events,
  appearBurst,
  hidden,
}: WallFloatingReactionsProps) {
  const reducedMotion = useReducedMotion();
  const [particles, setParticles] = useState<Particle[]>([]);
  const seenRef = useRef<Set<string>>(new Set());
  const lastAppearRef = useRef<string | null>(null);
  const queueRef = useRef<Particle[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pausedRef = useRef(Boolean(hidden || reducedMotion));

  pausedRef.current = Boolean(hidden || reducedMotion);

  function clearThrowTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
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
      setParticles((prev) => [...prev, next].slice(-MAX_PARTICLES));
    }, THROW_GAP_MS);
  }

  function enqueueThrows(batch: Particle[]) {
    if (pausedRef.current || batch.length === 0) return;
    queueRef.current.push(...batch);
    ensureThrower();
  }

  useEffect(() => {
    if (hidden || reducedMotion) {
      clearThrowTimer();
      queueRef.current = [];
      setParticles([]);
    }
  }, [hidden, reducedMotion]);

  useEffect(() => () => clearThrowTimer(), []);

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

    const batch: Particle[] = [];
    let throwIndex = 0;
    for (const event of fresh) {
      for (let i = 0; i < BURST_PER_EVENT; i++) {
        batch.push(
          createThrownParticle(
            event.emoji,
            `${event.id ?? event.createdAt}-${i}`,
            throwIndex++,
          ),
        );
      }
    }
    enqueueThrows(batch);
  }, [events, hidden, reducedMotion]);

  useEffect(() => {
    if (hidden || reducedMotion || !appearBurst?.appearKey) return;
    if (lastAppearRef.current === appearBurst.appearKey) return;
    lastAppearRef.current = appearBurst.appearKey;

    const pool = emojisFromCounts(appearBurst.reactionCounts);
    // No reactions on this photo — skip appear confetti
    if (pool.length === 0) return;

    const count = Math.min(APPEAR_MAX_PARTICLES, Math.max(10, pool.length * 2));
    const batch: Particle[] = [];
    for (let i = 0; i < count; i++) {
      batch.push(
        createThrownParticle(
          pool[i % pool.length]!,
          `appear-${appearBurst.appearKey}-${i}`,
          i,
        ),
      );
    }
    enqueueThrows(batch);
  }, [appearBurst, hidden, reducedMotion]);

  if (hidden || reducedMotion) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden" aria-hidden>
      <AnimatePresence>
        {particles.map((particle) => (
          <motion.span
            key={particle.id}
            className="absolute drop-shadow-lg"
            style={{
              left: `${particle.x}%`,
              bottom: `${particle.y}%`,
              fontSize: `${1.75 * particle.size}rem`,
            }}
            initial={{ opacity: 0, y: 10, scale: 0.35, rotate: 0, x: 0 }}
            animate={{
              opacity: [0, 1, 1, 0],
              y: [10, particle.rise * 0.35, particle.rise],
              x: [0, particle.drift * 0.4, particle.drift],
              scale: [0.35, 1.25 * particle.size, particle.size],
              rotate: [0, particle.rotate * 0.5, particle.rotate],
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: particle.duration,
              ease: [0.16, 0.84, 0.44, 1],
            }}
            onAnimationComplete={() => {
              setParticles((prev) => prev.filter((p) => p.id !== particle.id));
            }}
          >
            {particle.emoji}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
}
