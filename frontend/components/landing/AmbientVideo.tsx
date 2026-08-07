'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type AmbientVideoProps = {
  /** Candidate sources, tried in order; the first that loads wins. */
  sources: string[];
  /** Always-rendered scene shown beneath the video (and alone if none loads). */
  fallback: React.ReactNode;
  className?: string;
  /** <1 slows the clip for a more cinematic drift. */
  playbackRate?: number;
  /** Seconds of media time used to crossfade the loop seam. */
  crossfade?: number;
};

/**
 * Decorative ambient background loop.
 *
 * Two stacked <video> elements play the same clip in alternation and crossfade
 * across the seam, so a short generated clip reads as a continuous shot rather
 * than a hard cut every few seconds.
 *
 * It degrades in three steps: unreachable/absent sources or reduced-motion
 * preference leave the CSS `fallback` scene on its own, blocked autoplay still
 * shows the first decoded frame, and playback is suspended while the section
 * is off-screen.
 */
export default function AmbientVideo({
  sources,
  fallback,
  className = '',
  playbackRate = 0.8,
  crossfade = 0.9,
}: AmbientVideoProps) {
  const candidates = sources.filter(Boolean);

  const [srcIndex, setSrcIndex] = useState(0);
  const [ready, setReady] = useState(false);
  const [exhausted, setExhausted] = useState(candidates.length === 0);
  const [reduced, setReduced] = useState(true); // assume reduced until measured
  const [active, setActive] = useState<0 | 1>(0);

  const hostRef = useRef<HTMLDivElement | null>(null);
  const aRef = useRef<HTMLVideoElement | null>(null);
  const bRef = useRef<HTMLVideoElement | null>(null);
  const activeRef = useRef<0 | 1>(0);
  const rafRef = useRef<number | null>(null);
  const swapLockRef = useRef(false);

  // Wall-clock length of the crossfade once playback rate is factored in.
  const fadeSeconds = crossfade / (playbackRate || 1);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => setReduced(query.matches);
    apply();
    query.addEventListener('change', apply);
    return () => query.removeEventListener('change', apply);
  }, []);

  const handleError = useCallback(() => {
    setReady(false);
    setSrcIndex((index) => {
      const next = index + 1;
      if (next >= candidates.length) {
        setExhausted(true);
        return index;
      }
      return next;
    });
  }, [candidates.length]);

  const src = candidates[srcIndex];
  const showVideo = !reduced && !exhausted && Boolean(src);

  // Drive the alternating crossfade loop.
  useEffect(() => {
    if (!showVideo || !ready) return;

    const a = aRef.current;
    const b = bRef.current;
    if (!a || !b) return;

    a.playbackRate = playbackRate;
    b.playbackRate = playbackRate;
    void a.play().catch(() => {
      /* Autoplay refused — the decoded first frame remains on screen. */
    });

    const tick = () => {
      const current = activeRef.current === 0 ? a : b;
      const incoming = activeRef.current === 0 ? b : a;

      if (!swapLockRef.current && Number.isFinite(current.duration) && current.duration > 0) {
        if (current.duration - current.currentTime <= crossfade) {
          swapLockRef.current = true;
          incoming.currentTime = 0;
          incoming.playbackRate = playbackRate;
          void incoming.play().catch(() => {});

          activeRef.current = activeRef.current === 0 ? 1 : 0;
          setActive(activeRef.current);

          window.setTimeout(() => {
            swapLockRef.current = false;
          }, fadeSeconds * 1000);
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [showVideo, ready, playbackRate, crossfade, fadeSeconds]);

  // Suspend decoding while the section is scrolled out of view.
  useEffect(() => {
    const host = hostRef.current;
    if (!host || !showVideo || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const videos = [aRef.current, bRef.current];
        if (entry.isIntersecting) {
          const current = videos[activeRef.current];
          void current?.play().catch(() => {});
        } else {
          videos.forEach((video) => video?.pause());
        }
      },
      { threshold: 0.01 },
    );

    observer.observe(host);
    return () => observer.disconnect();
  }, [showVideo]);

  const videoClass =
    'absolute inset-0 h-full w-full object-cover motion-safe:transition-opacity motion-safe:ease-linear';

  return (
    <div ref={hostRef} className={`absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      {fallback}

      {showVideo && (
        <>
          <video
            ref={aRef}
            className={videoClass}
            style={{ opacity: ready && active === 0 ? 1 : 0, transitionDuration: `${fadeSeconds}s` }}
            src={src}
            muted
            playsInline
            preload="auto"
            disablePictureInPicture
            onCanPlay={() => setReady(true)}
            onError={handleError}
          />
          <video
            ref={bRef}
            className={videoClass}
            style={{ opacity: ready && active === 1 ? 1 : 0, transitionDuration: `${fadeSeconds}s` }}
            src={src}
            muted
            playsInline
            preload="auto"
            disablePictureInPicture
            onError={handleError}
          />
        </>
      )}
    </div>
  );
}
