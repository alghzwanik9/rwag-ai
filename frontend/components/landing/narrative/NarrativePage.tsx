'use client';

import {
  Component,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ErrorInfo,
  type ReactNode,
} from 'react';
import { Canvas, type RootState } from '@react-three/fiber';
import {
  ACT_RANGES,
  ALL_ACTS,
  COST_TOTAL,
  DESKTOP_SPLINE,
  MOBILE_SPLINE,
  PAVILION,
  activeActIndexFor,
  sectionOffset,
} from './config';
import type { HudRefs } from './hud';
import CopyLayer from './CopyLayer';
import DimensionRail from './DimensionRail';
import Scene from './Scene';
import StaticFallback from './StaticFallback';
import TourControls from './TourControls';

/** Full 5-Act Auto-Tour duration in milliseconds. */
const AUTO_TOUR_DURATION_MS = 28000;

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

const subscribeToNothing = () => () => {};
const readMotionParam = () => new URLSearchParams(window.location.search).get('motion');
const motionParamOnServer = () => null;

function useMotionParam(): string | null {
  return useSyncExternalStore(subscribeToNothing, readMotionParam, motionParamOnServer);
}

type ErrorBoundaryProps = {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: () => void;
};

type ErrorBoundaryState = {
  hasError: boolean;
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[NarrativePage] 3D canvas error — falling back to static view:', error, info.componentStack);
    this.props.onError?.();
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? <StaticFallback />;
    }
    return this.props.children;
  }
}

export default function NarrativePage() {
  const motion = useMotionParam();
  const compact = useMediaFlag('(max-width: 767px)');
  const [webglFailed, setWebglFailed] = useState(false);
  const [isAutoTour, setIsAutoTour] = useState(false);
  const [activeActIndex, setActiveActIndex] = useState(0);

  const scrollEl = useRef<HTMLDivElement | null>(null);
  const depthText = useRef<HTMLSpanElement | null>(null);
  const railMarker = useRef<HTMLDivElement | null>(null);
  const budgetText = useRef<HTMLSpanElement | null>(null);
  const morphLabel = useRef<HTMLSpanElement | null>(null);
  const pointerRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const morphFactorRef = useRef(0);
  const activeActRef = useRef(0);
  const contextLostCleanupRef = useRef<(() => void) | null>(null);

  const hud = useMemo<HudRefs>(
    () => ({
      scrollEl,
      depthText,
      railMarker,
      budgetText,
      morphLabel,
      pointerRef,
      morphFactorRef,
    }),
    [],
  );

  // Pointer parallax listener (writes directly to ref, zero React renders)
  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      if (window.innerWidth <= 0 || window.innerHeight <= 0) return;
      pointerRef.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointerRef.current.y = -((event.clientY / window.innerHeight) * 2 - 1);
    };
    const onPointerLeave = () => {
      pointerRef.current.x = 0;
      pointerRef.current.y = 0;
    };
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerleave', onPointerLeave, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerleave', onPointerLeave);
    };
  }, []);

  // Auto-Tour smooth spline driver; stops cleanly if user grabs manual scroll
  useEffect(() => {
    if (!isAutoTour) return;
    const el = scrollEl.current;
    if (!el) return;

    const maxScroll = Math.max(1, el.scrollHeight - el.clientHeight);
    if (el.scrollTop >= maxScroll - 8) {
      el.scrollTop = 0;
    }

    let rafId = 0;
    let lastTime = performance.now();
    const pxPerMs = maxScroll / AUTO_TOUR_DURATION_MS;

    const step = (now: number) => {
      const dt = Math.min(now - lastTime, 64);
      lastTime = now;

      const currentMax = Math.max(1, el.scrollHeight - el.clientHeight);
      const nextTop = el.scrollTop + pxPerMs * dt;
      if (nextTop >= currentMax) {
        el.scrollTop = currentMax;
        setIsAutoTour(false);
        return;
      }
      el.scrollTop = nextTop;
      rafId = requestAnimationFrame(step);
    };

    const cancelOnManualInput = () => setIsAutoTour(false);
    const cancelOnScrollKey = (e: KeyboardEvent) => {
      if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(e.key)) {
        setIsAutoTour(false);
      }
    };

    el.addEventListener('wheel', cancelOnManualInput, { passive: true });
    el.addEventListener('touchstart', cancelOnManualInput, { passive: true });
    window.addEventListener('keydown', cancelOnScrollKey);

    rafId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(rafId);
      el.removeEventListener('wheel', cancelOnManualInput);
      el.removeEventListener('touchstart', cancelOnManualInput);
      window.removeEventListener('keydown', cancelOnScrollKey);
    };
  }, [isAutoTour]);

  useEffect(() => {
    return () => {
      contextLostCleanupRef.current?.();
      contextLostCleanupRef.current = null;
    };
  }, []);

  const handleWebglFailed = useCallback(() => {
    setWebglFailed(true);
  }, []);

  const handleCanvasCreated = useCallback(({ gl }: RootState) => {
    contextLostCleanupRef.current?.();
    const canvas = gl.domElement;
    const onContextLost = (event: Event) => {
      event.preventDefault();
      setWebglFailed(true);
    };
    canvas.addEventListener('webglcontextlost', onContextLost, false);
    contextLostCleanupRef.current = () => {
      canvas.removeEventListener('webglcontextlost', onContextLost, false);
    };
  }, []);

  const handleToggleAutoTour = useCallback(() => {
    setIsAutoTour((prev) => !prev);
  }, []);

  const handleStartAutoTour = useCallback(() => {
    setIsAutoTour(true);
  }, []);

  const handleSelectAct = useCallback((index: number) => {
    setIsAutoTour(false);
    const el = scrollEl.current;
    if (!el) return;
    const maxScroll = Math.max(1, el.scrollHeight - el.clientHeight);
    const targetTop = sectionOffset(index, ALL_ACTS.length) * maxScroll;
    el.scrollTo({ top: targetTop, behavior: 'smooth' });
  }, []);

  const handleHudFrame = useCallback(
    (offset: number, costProgress: number, morphProgress: number) => {
      if (depthText.current) {
        depthText.current.textContent = `${(offset * PAVILION.walkthroughMeters).toFixed(1)} m`;
      }
      if (railMarker.current) {
        railMarker.current.style.top = `${(offset * 100).toFixed(2)}%`;
      }
      if (budgetText.current) {
        budgetText.current.textContent = Math.round(COST_TOTAL * costProgress).toLocaleString('en-US');
      }
      if (morphLabel.current) {
        morphLabel.current.textContent =
          morphProgress > 0.55
            ? 'مجلس أندلسي فاخر 2700K'
            : morphProgress > 0.25
              ? 'جاري التحوّل بين الطرز...'
              : 'ياباندي هادئ 4000K';
      }

      const nextAct = activeActIndexFor(offset, ALL_ACTS.length);
      if (nextAct !== activeActRef.current) {
        activeActRef.current = nextAct;
        setActiveActIndex(nextAct);
      }
    },
    [],
  );

  if (motion === 'off' || webglFailed) return <StaticFallback />;

  const splinePath = compact ? MOBILE_SPLINE : DESKTOP_SPLINE;

  return (
    <div className="relative h-[100svh] w-full overflow-hidden bg-ink">
      {/* Left architectural scroll depth gauge (top-24 offset prevents header overlap) */}
      <DimensionRail hud={hud} />

      {/* Interactive Auto-Tour toggle + 5-Act clickable progress dots */}
      <TourControls
        activeActIndex={activeActIndex}
        isAutoTour={isAutoTour}
        onToggleAutoTour={handleToggleAutoTour}
        onSelectAct={handleSelectAct}
      />

      {/* Native scroll container driving the 5-Act 3D spline camera directly */}
      <div
        ref={scrollEl}
        className="absolute inset-0 z-20 overflow-y-auto overflow-x-hidden"
      >
        <CopyLayer
          acts={ALL_ACTS}
          hud={hud}
          onStartAutoTour={handleStartAutoTour}
        />
      </div>

      <ErrorBoundary fallback={<StaticFallback />} onError={handleWebglFailed}>
        <Canvas
          shadows="percentage"
          dpr={[1, 2]}
          camera={{ fov: compact ? 50 : 42, near: 0.1, far: 80 }}
          onCreated={handleCanvasCreated}
        >
          <color attach="background" args={['#0A1220']} />
          <fog attach="fog" args={['#0A1220', 14, 38]} />
          <Scene
            ranges={ACT_RANGES}
            splinePath={splinePath}
            scrollEl={scrollEl}
            pointerRef={pointerRef}
            morphFactorRef={morphFactorRef}
            onHudFrame={handleHudFrame}
          />
        </Canvas>
      </ErrorBoundary>
    </div>
  );
}
