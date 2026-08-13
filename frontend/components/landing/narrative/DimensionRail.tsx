'use client';

import type { HudRefs } from './hud';

/**
 * Architectural dimension line fixed to the left viewport edge (the free
 * margin in RTL). The scene writes the readout and marker position directly
 * into the refs on every frame.
 */
export default function DimensionRail({ hud }: { hud: HudRefs }) {
  const { railMarker, depthText } = hud;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-y-10 left-8 z-40 hidden w-10 md:block"
    >
      {/* Hairline rule with arrowheads at both ends */}
      <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-brass/70" />
      <div
        className="absolute left-1/2 top-0 -translate-x-1/2 border-x-[4px] border-b-[7px] border-x-transparent border-b-brass"
        style={{ width: 0, height: 0 }}
      />
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 border-x-[4px] border-t-[7px] border-x-transparent border-t-brass"
        style={{ width: 0, height: 0 }}
      />

      {/* Metric ticks: short every 10%, long every 20% */}
      {Array.from({ length: 11 }, (_, i) => (
        <div
          key={i}
          className={`absolute left-1/2 h-px -translate-x-1/2 bg-brass/60 ${i % 2 === 0 ? 'w-4' : 'w-2'}`}
          style={{ top: `${i * 10}%` }}
        />
      ))}

      {/* Moving marker + numeric readout */}
      <div
        ref={railMarker}
        className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ top: '0%' }}
      >
        <div className="h-[3px] w-6 -translate-x-[3px] bg-brass" />
        <span
          ref={depthText}
          dir="ltr"
          className="absolute left-8 top-1/2 -translate-y-1/2 whitespace-nowrap font-plex-mono text-[11px] tracking-wider text-brass"
        >
          0.0 m
        </span>
      </div>

      {/* Rotated label at the base */}
      <span className="absolute -bottom-1 left-1/2 origin-top-left -rotate-90 whitespace-nowrap font-plex-mono text-[9px] uppercase tracking-[0.3em] text-slate">
        SCROLL DEPTH
      </span>
    </div>
  );
}
