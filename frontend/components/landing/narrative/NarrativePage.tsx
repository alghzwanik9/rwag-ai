'use client';

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
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

/** All three live at module scope so `useSyncExternalStore` sees stable identities. */
const subscribeToNothing = () => () => {};
const readMotionParam = () => new URLSearchParams(window.location.search).get('motion');
const motionParamOnServer = () => null;

/**
 * `?motion=off` opts into the static page. Nothing else selects it.
 *
 * The OS `prefers-reduced-motion` setting deliberately does NOT gate the
 * scene: Windows turns that flag on machine-wide as part of unrelated
 * animation preferences, so honouring it silently removed the narrative for
 * people who had never asked to lose it. The static page is still built and
 * still reachable — it is a choice the visitor makes, not a state the system
 * imposes.
 *
 * Read straight off `window.location` rather than through `useSearchParams`,
 * which would opt this route out of static rendering unless the whole tree
 * were wrapped in a Suspense boundary. The flag is only ever needed on the
 * client, so there is nothing to gain from the router here. Nothing is
 * subscribed to either: the query string cannot change without a navigation
 * that remounts this component.
 *
 * The server snapshot is `null`, so the static HTML and the hydration pass
 * agree; React then re-reads the client snapshot.
 */
function useMotionParam(): string | null {
  return useSyncExternalStore(subscribeToNothing, readMotionParam, motionParamOnServer);
}

export default function NarrativePage() {
  const motion = useMotionParam();
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

  // Every hook above runs unconditionally, so this early return is safe.
  if (motion === 'off') return <StaticFallback />;

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

      {/* Enables the shadow map the Act 3 key light casts into.
          "percentage" (PCFShadowMap) rather than a bare `shadows`: the boolean
          form selects PCFSoftShadowMap, which this three version dropped from
          its shader define table — it silently degrades to BasicShadowMap,
          giving single-tap aliased edges and ignoring `shadow-radius`. */}
      <Canvas shadows="percentage" dpr={[1, 2]} camera={{ fov: 42, near: 0.1, far: 60 }}>
        <color attach="background" args={['#0A1220']} />
        <fog attach="fog" args={['#0A1220', 12, 30]} />
        <ScrollControls pages={acts.length} damping={0.25}>
          <Scene ranges={ranges} cameraPath={cameraPath} hud={hud} actsCount={acts.length} />
        </ScrollControls>
      </Canvas>
    </div>
  );
}
