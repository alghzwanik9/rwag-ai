'use client';

import type { HudRefs } from './hud';

/**
 * Architectural dimension line fixed to the left viewport edge (the free
 * margin in RTL). Uses `top-24` clearance so it never overlaps the fixed
 * top-left "الاستوديو" navigation button.
 */
export default function DimensionRail({ hud }: { hud: HudRefs }) {
  const { railMarker, depthText } = hud;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed bottom-10 left-7 top-24 z-30 hidden w-10 md:block"
    >
      {/* Hairline rule with architectural arrowheads at both ends */}
      <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-brass/65" />
      <div
        className="absolute left-1/2 top-0 -translate-x-1/2 border-x-[4px] border-b-[7px] border-x-transparent border-b-brass"
        style={{ width: 0, height: 0 }}
      />
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 border-x-[4px] border-t-[7px] border-x-transparent border-t-brass"
        style={{ width: 0, height: 0 }}
      />

      {/* Metric ticks: short every 10%, long every 25% (5-Act anchors) */}
      {Array.from({ length: 11 }, (_, i) => (
        <div
          key={i}
          className={`absolute left-1/2 h-px -translate-x-1/2 bg-brass/55 ${i % 2 === 0 ? 'w-4' : 'w-2'}`}
          style={{ top: `${i * 10}%` }}
        />
      ))}

      {/* Moving brass caliper marker + live walkthrough depth readout */}
      <div
        ref={railMarker}
        className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ top: '0%' }}
      >
        <div className="h-[3px] w-6 -translate-x-[3px] bg-brass shadow-[0_0_8px_rgba(199,154,75,0.65)]" />
        <span
          ref={depthText}
          dir="ltr"
          className="absolute left-8 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-sm border border-brass/35 bg-ink/85 px-1.5 py-0.5 font-plex-mono text-[10px] tracking-wider text-brass backdrop-blur-sm"
        >
          0.0 m
        </span>
      </div>

      {/* Rotated architectural label at the base */}
      <span className="absolute -bottom-1 left-1/2 origin-top-left -rotate-90 whitespace-nowrap font-plex-mono text-[9px] uppercase tracking-[0.28em] text-slate">
        SCROLL DEPTH
      </span>
    </div>
  );
}
