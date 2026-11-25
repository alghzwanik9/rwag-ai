'use client';

import { Pause, Play } from 'lucide-react';
import { ACT_COPY } from './config';

interface TourControlsProps {
  activeActIndex: number;
  isAutoTour: boolean;
  onToggleAutoTour: () => void;
  onSelectAct: (index: number) => void;
}

/**
 * Interactive architectural bottom dock offering one-click Auto-Tour playback
 * and direct Act indicator navigation across the 5-Act multi-room walkthrough.
 */
export default function TourControls({
  activeActIndex,
  isAutoTour,
  onToggleAutoTour,
  onSelectAct,
}: TourControlsProps) {
  const activeAct = ACT_COPY[activeActIndex] ?? ACT_COPY[0];

  return (
    <div
      dir="rtl"
      className="pointer-events-auto fixed bottom-5 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-pill border border-brass/30 bg-ink/90 px-3.5 py-2 shadow-[0_12px_36px_rgba(0,0,0,0.55)] backdrop-blur-md"
    >
      {/* Auto-Tour Play / Pause Toggle */}
      <button
        type="button"
        onClick={onToggleAutoTour}
        aria-pressed={isAutoTour}
        aria-label={isAutoTour ? 'إيقاف الجولة التلقائية' : 'تشغيل الجولة التلقائية'}
        className={`inline-flex items-center gap-2 rounded-pill px-3.5 py-1.5 font-plex-arabic text-xs font-medium transition-all cursor-pointer ${
          isAutoTour
            ? 'bg-brass text-ink shadow-[0_0_16px_rgba(199,154,75,0.45)]'
            : 'border border-brass/40 bg-brass/10 text-brass hover:bg-brass/20'
        }`}
      >
        {isAutoTour ? (
          <Pause className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
        ) : (
          <Play className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
        )}
        <span className="whitespace-nowrap">
          {isAutoTour ? 'إيقاف الجولة' : 'جولة تلقائية'}
        </span>
      </button>

      <div className="h-4 w-px bg-slate/25" aria-hidden="true" />

      {/* 5-Act Clickable Indicator Dots */}
      <nav aria-label="فصول الجولة المعمارية" className="flex items-center gap-1.5">
        {ACT_COPY.map((act, index) => {
          const isActive = index === activeActIndex;
          return (
            <button
              key={act.id}
              type="button"
              onClick={() => onSelectAct(index)}
              aria-label={`الانتقال إلى المشهد ${act.indexLabel}: ${act.shortLabelAr}`}
              aria-current={isActive ? 'step' : undefined}
              title={`${act.indexLabel} — ${act.shortLabelAr}`}
              className="group flex h-6 items-center px-0.5 cursor-pointer"
            >
              <span
                className={`block h-2 rounded-pill transition-all duration-300 ${
                  isActive
                    ? 'w-7 bg-brass shadow-[0_0_10px_rgba(232,196,136,0.65)]'
                    : 'w-2 bg-slate/45 group-hover:w-3.5 group-hover:bg-brass/75'
                }`}
              />
            </button>
          );
        })}
      </nav>

      {/* Active Act Arabic + Index Caption */}
      <div className="hidden items-center gap-2 border-r border-slate/25 pr-3 sm:flex">
        <span dir="ltr" className="font-plex-mono text-[11px] font-medium text-brass">
          {activeAct.indexLabel}
        </span>
        <span className="whitespace-nowrap font-plex-arabic text-xs text-sand">
          {activeAct.shortLabelAr}
        </span>
      </div>
    </div>
  );
}
