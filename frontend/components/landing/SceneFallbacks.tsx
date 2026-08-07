/**
 * Pure-CSS/SVG ambient scenes rendered beneath the Higgsfield video loops.
 *
 * They carry the section on their own whenever the clip is unavailable — no
 * network request, no layout shift, no empty dark rectangle.
 */

/** Warm architectural light study: morning sun entering a quiet interior. */
export function JapandiLightScene() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-rwaq-slate rwaq-grain">
      {/* Ambient sky bounce */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 90% at 78% 4%, rgba(232,196,136,0.30) 0%, rgba(164,142,116,0.13) 32%, transparent 66%)',
        }}
      />
      {/* Volumetric shaft falling from a tall window */}
      <div
        className="absolute -top-1/4 h-[150%] w-[46%] ltr:left-[8%] rtl:right-[8%] blur-[60px] opacity-70"
        style={{
          background:
            'linear-gradient(178deg, rgba(255,238,209,0.42) 0%, rgba(232,196,136,0.18) 45%, transparent 82%)',
          transform: 'skewX(-11deg)',
        }}
      />
      {/* Sun patch resting on the floor */}
      <div
        className="absolute bottom-[16%] h-[26%] w-[52%] ltr:left-[14%] rtl:right-[14%] blur-[52px] opacity-60"
        style={{
          background: 'radial-gradient(60% 100% at 50% 50%, rgba(255,232,193,0.55), transparent 72%)',
          transform: 'perspective(700px) rotateX(72deg)',
        }}
      />
      {/* Floor plane and horizon */}
      <div
        className="absolute inset-x-0 bottom-0 h-[42%]"
        style={{
          background: 'linear-gradient(to top, rgba(20,24,33,0.96) 12%, rgba(20,24,33,0.35) 60%, transparent)',
        }}
      />
      <div className="absolute inset-x-0 bottom-[41%] h-px bg-gradient-to-r from-transparent via-rwaq-sand/25 to-transparent" />
      {/* Vignette keeps text legible at the edges */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(115% 85% at 50% 42%, transparent 34%, rgba(14,16,21,0.62) 78%, rgba(14,16,21,0.94) 100%)',
        }}
      />
    </div>
  );
}

/** Champagne wireframe floor plan that draws itself in, under a slow scan. */
export function BlueprintScene({ animate = true }: { animate?: boolean }) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-rwaq-slate-deep">
      <div className="absolute inset-0 rwaq-blueprint opacity-70" />
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(80% 70% at 50% 45%, rgba(232,196,136,0.12), transparent 68%)',
        }}
      />

      <svg
        viewBox="0 0 200 140"
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <g
          fill="none"
          stroke="#E8C488"
          strokeLinecap="square"
          className={animate ? 'motion-safe:[&>*]:animate-[rwaq-draw_3.2s_var(--rwaq-ease)_forwards]' : ''}
        >
          {/* Envelope */}
          <rect
            x="26"
            y="20"
            width="148"
            height="100"
            strokeWidth="0.8"
            opacity="0.85"
            style={{ ['--dash' as string]: '496', strokeDasharray: 496 }}
          />
          {/* Partition */}
          <path
            d="M112 20 V78 H174"
            strokeWidth="0.6"
            opacity="0.6"
            style={{ ['--dash' as string]: '120', strokeDasharray: 120 }}
          />
          {/* Furniture footprints */}
          <rect x="38" y="84" width="46" height="16" strokeWidth="0.5" opacity="0.75" style={{ ['--dash' as string]: '124', strokeDasharray: 124 }} />
          <rect x="52" y="56" width="24" height="14" strokeWidth="0.5" opacity="0.55" style={{ ['--dash' as string]: '76', strokeDasharray: 76 }} />
          <circle cx="146" cy="46" r="11" strokeWidth="0.5" opacity="0.55" style={{ ['--dash' as string]: '70', strokeDasharray: 70 }} />
          <rect x="126" y="92" width="40" height="12" strokeWidth="0.5" opacity="0.55" style={{ ['--dash' as string]: '104', strokeDasharray: 104 }} />
          {/* Door swing */}
          <path d="M26 104 A16 16 0 0 0 42 120" strokeWidth="0.5" opacity="0.6" style={{ ['--dash' as string]: '26', strokeDasharray: 26 }} />
          {/* Dimension witness line */}
          <path d="M26 130 H174" strokeWidth="0.4" opacity="0.4" strokeDasharray="2 3" />
        </g>
        <text
          x="100"
          y="136"
          textAnchor="middle"
          className="font-tech"
          fill="#E8C488"
          fillOpacity="0.42"
          fontSize="5"
          letterSpacing="1.6"
          style={{ direction: 'ltr' }}
        >
          5.00 m
        </text>
      </svg>

      {/* Materialisation scan */}
      {animate && (
        <div className="absolute inset-x-0 top-0 h-16 motion-safe:animate-[rwaq-scan_6s_linear_infinite] motion-reduce:hidden">
          <div
            className="h-full w-full"
            style={{
              background:
                'linear-gradient(to bottom, transparent, rgba(232,196,136,0.16) 55%, rgba(232,196,136,0.42) 88%, transparent)',
            }}
          />
        </div>
      )}

      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(110% 90% at 50% 50%, transparent 40%, rgba(9,11,15,0.72) 82%, rgba(9,11,15,0.95) 100%)',
        }}
      />
    </div>
  );
}
