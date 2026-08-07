'use client';

import { useEffect, useRef, useState } from 'react';

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * Animates a number from 0 to `target` once `active` becomes true.
 *
 * Under `prefers-reduced-motion` the final value is returned immediately, so
 * the figure is never withheld from anyone who opted out of animation.
 */
export function useCountUp(target: number, active: boolean, durationMs = 1600): number {
  const [value, setValue] = useState(0);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) return;

    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduced || durationMs <= 0) {
      const timer = setTimeout(() => setValue(target), 0);
      return () => clearTimeout(timer);
    }

    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / durationMs, 1);
      setValue(Math.round(target * easeOut(progress)));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      }
    };

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    };
  }, [target, active, durationMs]);

  return value;
}
