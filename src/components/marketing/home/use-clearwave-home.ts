"use client";

import { useEffect, type RefObject } from "react";

const ZOOM_STEPS = [
  { pw: 160, g1: 178, g2: 316, gh: 450, sh: 420 },
  { pw: 200, g1: 222, g2: 395, gh: 560, sh: 520 },
  { pw: 240, g1: 266, g2: 474, gh: 670, sh: 620 },
  { pw: 280, g1: 310, g2: 553, gh: 780, sh: 720 },
  { pw: 320, g1: 354, g2: 632, gh: 890, sh: 820 },
] as const;

const POS_CONFIG: Record<string, [number, number, number, number]> = {
  center: [0, 0, 1, 1],
  left1: [-1, 28, 0.82, 1],
  right1: [1, -28, 0.82, 1],
  left2: [-1, 45, 0.64, 0.55],
  right2: [1, -45, 0.64, 0.55],
  "hidden-left": [-1, 60, 0.48, 0],
  "hidden-right": [1, -60, 0.48, 0],
};

const POS_GAP: Record<string, "g1" | "g2" | "gh" | 0> = {
  center: 0,
  left1: "g1",
  right1: "g1",
  left2: "g2",
  right2: "g2",
  "hidden-left": "gh",
  "hidden-right": "gh",
};

function getPositionForOffset(cardIndex: number, centerIndex: number, total: number) {
  let offset = cardIndex - centerIndex;
  while (offset > Math.floor(total / 2)) offset -= total;
  while (offset < -Math.floor(total / 2)) offset += total;
  const posMap: Record<string, string> = {
    "-2": "left2",
    "-1": "left1",
    "0": "center",
    "1": "right1",
    "2": "right2",
  };
  return posMap[String(offset)] || (offset < 0 ? "hidden-left" : "hidden-right");
}

/**
 * Ports TemplateMo 622 Clearwave JS: reveal, carousel+zoom, FAQ.
 * Expects Clearwave class markup inside `root`.
 */
export function useClearwaveHome(rootRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cleanups: Array<() => void> = [];

    /* ── SCROLL REVEAL ── */
    const revealEls = root.querySelectorAll<HTMLElement>(".reveal");
    if (reduceMotion) {
      revealEls.forEach((el) => el.classList.add("visible"));
    } else {
      const revealObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("visible");
              revealObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
      );
      revealEls.forEach((el) => revealObserver.observe(el));
      cleanups.push(() => revealObserver.disconnect());
    }

    /* ── 3D CAROUSEL ── */
    const cards = Array.from(root.querySelectorAll<HTMLElement>(".phone-card"));
    const carouselStageEl = root.querySelector<HTMLElement>("#carouselStage");
    const dotsContainer = root.querySelector<HTMLElement>("#carouselDots");
    const zoomPipsEl = root.querySelector<HTMLElement>("#zoomPips");
    const zoomInBtn = root.querySelector<HTMLButtonElement>("#zoomIn");
    const zoomOutBtn = root.querySelector<HTMLButtonElement>("#zoomOut");
    const nextBtn = root.querySelector<HTMLButtonElement>("#carouselNext");
    const prevBtn = root.querySelector<HTMLButtonElement>("#carouselPrev");

    if (
      cards.length &&
      carouselStageEl &&
      dotsContainer &&
      zoomPipsEl &&
      zoomInBtn &&
      zoomOutBtn &&
      nextBtn &&
      prevBtn
    ) {
      const totalCards = cards.length;
      let currentCenter = Math.min(2, totalCards - 1);
      let zoomLevel = 2;
      let isAnimating = false;
      let autoTimer: ReturnType<typeof setInterval> | null = null;

      function applyCardStyles(suppressTransition: boolean) {
        const s = ZOOM_STEPS[zoomLevel];
        cards.forEach((card) => {
          const pos = card.dataset.pos || "center";
          const cfg = POS_CONFIG[pos];
          if (!cfg) return;
          const gapKey = POS_GAP[pos];
          const tx = cfg[0] * (gapKey ? s[gapKey] : 0);
          const shell = card.querySelector<HTMLElement>(".phone-shell");

          if (suppressTransition) {
            card.style.transition = "none";
            if (shell) shell.style.transition = "none";
          }

          card.style.width = `${s.pw}px`;
          card.style.transform = `translateX(${tx}px) rotateY(${cfg[1]}deg) scale(${cfg[2]})`;
          card.style.opacity = String(cfg[3]);
          if (shell) {
            shell.style.width = `${s.pw}px`;
            if (pos === "center") {
              shell.style.boxShadow =
                "0 0 0 1px rgba(166,124,82,0.35), 0 40px 80px rgba(20,17,14,0.22), 0 0 48px rgba(166,124,82,0.12), inset 0 1px 0 rgba(255,255,255,0.6)";
            } else {
              shell.style.boxShadow = "";
            }
          }

          if (suppressTransition) {
            requestAnimationFrame(() => {
              card.style.transition = "";
              if (shell) shell.style.transition = "";
            });
          }
        });
        carouselStageEl!.style.height = `${s.sh}px`;
      }

      function updatePositions() {
        cards.forEach((card, i) => {
          card.dataset.pos = getPositionForOffset(i, currentCenter, totalCards);
        });
        dotsContainer!.querySelectorAll(".carousel-dot").forEach((dot, i) => {
          dot.classList.toggle("active", i === currentCenter);
        });
        applyCardStyles(false);
      }

      function goTo(index: number) {
        if (isAnimating) return;
        isAnimating = true;
        currentCenter = ((index % totalCards) + totalCards) % totalCards;
        updatePositions();
        window.setTimeout(() => {
          isAnimating = false;
        }, 700);
      }

      function next() {
        goTo((currentCenter + 1) % totalCards);
      }
      function prev() {
        goTo((currentCenter - 1 + totalCards) % totalCards);
      }

      dotsContainer.innerHTML = "";
      cards.forEach((_, i) => {
        const dot = document.createElement("div");
        dot.className = `carousel-dot${i === currentCenter ? " active" : ""}`;
        const onClick = () => {
          goTo(i);
          resetAuto();
        };
        dot.addEventListener("click", onClick);
        dotsContainer!.appendChild(dot);
      });

      const onNext = () => {
        next();
        resetAuto();
      };
      const onPrev = () => {
        prev();
        resetAuto();
      };
      nextBtn.addEventListener("click", onNext);
      prevBtn.addEventListener("click", onPrev);
      cleanups.push(() => {
        nextBtn.removeEventListener("click", onNext);
        prevBtn.removeEventListener("click", onPrev);
      });

      cards.forEach((card, i) => {
        const onCard = () => {
          if (card.dataset.pos !== "center") {
            goTo(i);
            resetAuto();
          }
        };
        card.addEventListener("click", onCard);
        cleanups.push(() => card.removeEventListener("click", onCard));
      });

      function startAuto() {
        if (reduceMotion) return;
        stopAuto();
        autoTimer = setInterval(next, 3500);
      }
      function stopAuto() {
        if (autoTimer) clearInterval(autoTimer);
        autoTimer = null;
      }
      function resetAuto() {
        stopAuto();
        startAuto();
      }

      const onEnter = () => stopAuto();
      const onLeave = () => startAuto();
      carouselStageEl.addEventListener("mouseenter", onEnter);
      carouselStageEl.addEventListener("mouseleave", onLeave);
      cleanups.push(() => {
        carouselStageEl.removeEventListener("mouseenter", onEnter);
        carouselStageEl.removeEventListener("mouseleave", onLeave);
      });

      let touchStartX = 0;
      const onTouchStart = (e: TouchEvent) => {
        touchStartX = e.touches[0].clientX;
      };
      const onTouchEnd = (e: TouchEvent) => {
        const diff = touchStartX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 40) {
          if (diff > 0) next();
          else prev();
          resetAuto();
        }
      };
      carouselStageEl.addEventListener("touchstart", onTouchStart, { passive: true });
      carouselStageEl.addEventListener("touchend", onTouchEnd);
      cleanups.push(() => {
        carouselStageEl.removeEventListener("touchstart", onTouchStart);
        carouselStageEl.removeEventListener("touchend", onTouchEnd);
      });

      /* zoom */
      zoomPipsEl.innerHTML = "";
      ZOOM_STEPS.forEach((_, i) => {
        const pip = document.createElement("div");
        pip.className = `zoom-pip${i === zoomLevel ? " active" : ""}`;
        pip.addEventListener("click", () => setZoom(i));
        zoomPipsEl.appendChild(pip);
      });

      function setZoom(level: number) {
        zoomLevel = Math.max(0, Math.min(ZOOM_STEPS.length - 1, level));
        applyCardStyles(true);
        zoomPipsEl!.querySelectorAll(".zoom-pip").forEach((p, i) => {
          p.classList.toggle("active", i === zoomLevel);
        });
        zoomOutBtn!.disabled = zoomLevel === 0;
        zoomInBtn!.disabled = zoomLevel === ZOOM_STEPS.length - 1;
      }

      const onZoomIn = () => setZoom(zoomLevel + 1);
      const onZoomOut = () => setZoom(zoomLevel - 1);
      zoomInBtn.addEventListener("click", onZoomIn);
      zoomOutBtn.addEventListener("click", onZoomOut);
      cleanups.push(() => {
        zoomInBtn.removeEventListener("click", onZoomIn);
        zoomOutBtn.removeEventListener("click", onZoomOut);
      });

      updatePositions();
      setZoom(zoomLevel);
      startAuto();
      cleanups.push(() => stopAuto());
    }

    /* ── FAQ ACCORDION ── */
    const faqItems = Array.from(root.querySelectorAll<HTMLElement>(".faq-item"));
    const faqToggleAllBtn = root.querySelector<HTMLButtonElement>("#faqToggleAll");
    const faqToggleIcon = root.querySelector<HTMLElement>("#faqToggleIcon");
    let allOpen = false;

    function toggleFaq(item: HTMLElement) {
      const isOpen = item.classList.contains("open");
      item.classList.toggle("open", !isOpen);
      item.querySelector(".faq-question")?.setAttribute("aria-expanded", String(!isOpen));
    }

    faqItems.forEach((item) => {
      const question = item.querySelector<HTMLElement>(".faq-question");
      if (!question) return;
      const onClick = () => toggleFaq(item);
      const onKey = (e: KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggleFaq(item);
        }
      };
      question.addEventListener("click", onClick);
      question.addEventListener("keydown", onKey);
      cleanups.push(() => {
        question.removeEventListener("click", onClick);
        question.removeEventListener("keydown", onKey);
      });
    });

    if (faqToggleAllBtn && faqToggleIcon) {
      const labelEl = root.querySelector<HTMLElement>("#faqToggleLabel");
      const expandLabel = faqToggleAllBtn.dataset.expandLabel ?? "Expand all";
      const collapseLabel = faqToggleAllBtn.dataset.collapseLabel ?? "Collapse all";
      const onToggleAll = () => {
        allOpen = !allOpen;
        faqItems.forEach((item) => {
          item.classList.toggle("open", allOpen);
          item.querySelector(".faq-question")?.setAttribute("aria-expanded", String(allOpen));
        });
        faqToggleIcon.textContent = allOpen ? "−" : "+";
        if (labelEl) {
          labelEl.textContent = ` ${allOpen ? collapseLabel : expandLabel}`;
        }
      };
      faqToggleAllBtn.addEventListener("click", onToggleAll);
      cleanups.push(() => faqToggleAllBtn.removeEventListener("click", onToggleAll));
    }

    return () => {
      cleanups.forEach((fn) => fn());
    };
  }, [rootRef]);
}
