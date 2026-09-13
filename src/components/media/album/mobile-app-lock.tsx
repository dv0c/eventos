"use client";

import { useEffect } from "react";

const LOCK_CLASS = "mobile-app-lock";
const SCROLL_ATTR = "data-app-scroll";

/** Programmatically focus the app scroll pane and reset its scroll position. */
export function focusAppScroll(el: HTMLElement | null) {
  if (!el) return;
  el.focus({ preventScroll: true });
  el.scrollTop = 0;
}

function isInsideAppScroll(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return Boolean(target.closest(`[${SCROLL_ATTR}]`));
}

/**
 * Locks document chrome for app-like mobile surfaces:
 * no body overscroll / pull-to-refresh, no pinch zoom,
 * touchmove only inside [data-app-scroll] regions.
 * Mount only on guest album + moderation shells.
 */
export function MobileAppLock() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add(LOCK_CLASS);

    const preventGesture = (event: Event) => {
      event.preventDefault();
    };

    const onTouchMove = (event: TouchEvent) => {
      // Allow all pans (incl. horizontal strips + pinch) inside scroll regions
      if (isInsideAppScroll(event.target)) return;
      if (event.touches.length > 1) {
        event.preventDefault();
        return;
      }
      event.preventDefault();
    };

    // iOS Safari pinch gestures
    document.addEventListener("gesturestart", preventGesture, {
      passive: false,
    });
    document.addEventListener("gesturechange", preventGesture, {
      passive: false,
    });
    document.addEventListener("gestureend", preventGesture, { passive: false });
    document.addEventListener("touchmove", onTouchMove, { passive: false });

    return () => {
      root.classList.remove(LOCK_CLASS);
      document.removeEventListener("gesturestart", preventGesture);
      document.removeEventListener("gesturechange", preventGesture);
      document.removeEventListener("gestureend", preventGesture);
      document.removeEventListener("touchmove", onTouchMove);
    };
  }, []);

  return null;
}
