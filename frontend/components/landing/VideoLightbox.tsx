'use client';

import { useCallback, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { BlueprintScene } from './SceneFallbacks';

type VideoLightboxProps = {
  open: boolean;
  onClose: () => void;
  sources: string[];
  titleAr: string;
  captionAr: string;
};

/**
 * Modal player for the interactive walkthrough loop.
 *
 * Implements the dialog basics by hand (no dependency): Escape and backdrop
 * dismissal, a focus trap across the panel, focus restored to the trigger on
 * close, and the page locked behind the overlay.
 */
export default function VideoLightbox({ open, onClose, sources, titleAr, captionAr }: VideoLightboxProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  const src = sources.find(Boolean) ?? '';

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== 'Tab' || !panelRef.current) return;

      const focusables = panelRef.current.querySelectorAll<HTMLElement>(
        'button, [href], video[controls], [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;

    restoreRef.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    // Defer so the panel exists before focus moves into it.
    const focusTimer = window.setTimeout(() => closeRef.current?.focus(), 0);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      window.clearTimeout(focusTimer);
      restoreRef.current?.focus?.();
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-rwaq-slate-deep/88 p-4 backdrop-blur-md sm:p-8"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={titleAr}
        onClick={(event) => event.stopPropagation()}
        className="relative w-full max-w-4xl overflow-hidden rounded-3xl border border-white/10 bg-rwaq-surface shadow-[0_40px_120px_-20px_rgba(0,0,0,0.9)]"
      >
        <div className="flex items-center justify-between gap-4 border-b border-white/[0.07] px-5 py-4">
          <div className="min-w-0">
            <h2 className="truncate text-base font-medium text-rwaq-ink">{titleAr}</h2>
            <p className="mt-0.5 truncate text-xs text-rwaq-ink-faint">{captionAr}</p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="إغلاق العرض"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-rwaq-ink transition-colors hover:bg-white/[0.09]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="relative aspect-video w-full bg-rwaq-slate-deep">
          <BlueprintScene animate={false} />
          {src && (
            // Silent generated loop — no speech track, so there is nothing to caption.
            <video
              className="absolute inset-0 h-full w-full object-cover"
              src={src}
              autoPlay
              loop
              muted
              playsInline
              controls
            />
          )}
        </div>
      </div>
    </div>
  );
}
