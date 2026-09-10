"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

/**
 * Smoothly tweens the beam element toward `progress` (0-1) as real stream
 * events arrive, rather than snapping — GSAP owns this one orchestrated
 * timeline; everything else in the product uses Framer Motion or CSS.
 * `prefers-reduced-motion` collapses the tween duration to near-zero.
 */
export function useScanBeam(progress: number) {
  const beamRef = useRef<HTMLDivElement>(null);
  const tweenTarget = useRef({ value: 0 });

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    gsap.to(tweenTarget.current, {
      value: progress,
      duration: reduceMotion ? 0.05 : 0.6,
      ease: "power2.out",
      onUpdate: () => {
        if (beamRef.current) {
          beamRef.current.style.top = `${tweenTarget.current.value * 100}%`;
        }
      },
    });
  }, [progress]);

  return beamRef;
}
