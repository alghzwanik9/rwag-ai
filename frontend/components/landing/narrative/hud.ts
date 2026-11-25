import type { MutableRefObject, RefObject } from 'react';

/**
 * Zero-re-render bridge between the R3F 3D scene loop and fixed DOM HUD chrome.
 * `Scene` writes directly to DOM refs on `useFrame` for locked 60fps performance.
 */
export interface HudRefs {
  /** Native scroll container driving the 5-Act spline camera. */
  scrollEl: RefObject<HTMLElement | null>;
  /** Numeric distance readout on the left dimension gauge ("0.0 m" -> "12.0 m"). */
  depthText: RefObject<HTMLSpanElement | null>;
  /** Moving brass marker on the left dimension gauge (top offset in %). */
  railMarker: RefObject<HTMLDivElement | null>;
  /** Live SAR budget total counter in the Act 05 pricing card. */
  budgetText: RefObject<HTMLSpanElement | null>;
  /** Live Style Morph progress percentage badge in Act 04. */
  morphLabel?: RefObject<HTMLSpanElement | null>;
  /** Normalized pointer parallax coordinates [-1, 1] updated outside React state. */
  pointerRef: MutableRefObject<{ x: number; y: number }>;
  /** Shared live style morph factor [0 -> 1] for Scene & Furniture sync. */
  morphFactorRef: MutableRefObject<number>;
}
