'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { ScrollControls } from '@react-three/drei';
import {
  DESKTOP_CAMERA,
  DESKTOP_RANGES,
  MOBILE_CAMERA,
  MOBILE_RANGES,
  type ActId,
} from './config';
import type { HudRefs } from './hud';
import CopyLayer from './CopyLayer';
import DimensionRail from './DimensionRail';
import Scene from './Scene';
import StaticFallback from './StaticFallback';

const DESKTOP_ACTS: readonly ActId[] = ['void', 'bounds', 'material', 'layout', 'cost'];
const MOBILE_ACTS: readonly ActId[] = ['void', 'material', 'cost'];

function useMediaFlag(query: string): boolean {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const apply = () => setMatches(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [query]);
  return matches;
}

export default function NarrativePage() {
  const reducedMotion = useMediaFlag('(prefers-reduced-motion: reduce)');
  const compact = useMediaFlag('(max-width: 767px)');

  const scrollEl = useRef<HTMLElement | null>(null);
  const depthText = useRef<HTMLSpanElement | null>(null);
  const railMarker = useRef<HTMLDivElement | null>(null);
  const budgetText = useRef<HTMLSpanElement | null>(null);
  const copyLayer = useRef<HTMLDivElement | null>(null);
  const hud = useMemo<HudRefs>(
    () => ({ scrollEl, depthText, railMarker, budgetText, copyLayer }),
    [],
  );

  // Bypassed reduced-motion check to always show the interactive 3D scene
  // if (reducedMotion) return <StaticFallback />;

  const acts = compact ? MOBILE_ACTS : DESKTOP_ACTS;
  const ranges = compact ? MOBILE_RANGES : DESKTOP_RANGES;
  const cameraPath = compact ? MOBILE_CAMERA : DESKTOP_CAMERA;

  return (
    <div className="relative h-[100svh] w-full overflow-hidden bg-ink">
      <DimensionRail hud={hud} />

      {/* HTML Copy Layer overlay - synchronized smoothly on useFrame without createRoot */}
      <div className="pointer-events-none fixed inset-0 z-20 overflow-hidden">
        <div ref={copyLayer} className="will-change-transform">
          <CopyLayer acts={acts} hud={hud} />
        </div>
      </div>

      {/* `shadows` enables the shadow map the Act 3 key light casts into. */}
      <Canvas shadows dpr={[1, 2]} camera={{ fov: 42, near: 0.1, far: 60 }}>
        <color attach="background" args={['#0A1220']} />
        <fog attach="fog" args={['#0A1220', 12, 30]} />
        <ScrollControls pages={acts.length} damping={0.25}>
          <Scene ranges={ranges} cameraPath={cameraPath} hud={hud} actsCount={acts.length} />
        </ScrollControls>
      </Canvas>
    </div>
  );
}
