import type { RefObject } from 'react';

/**
 * Bridge between the R3F scene and fixed DOM chrome (dimension rail, budget
 * counter, scroll CTA). The scene writes into these refs' current nodes
 * directly inside `useFrame` — no React state, no re-renders on scroll.
 */
export interface HudRefs {
  /** ScrollControls' scroll container, stashed by the scene for the CTA. */
  scrollEl: RefObject<HTMLElement | null>;
  /** Numeric readout on the dimension rail ("0.0 m" → "5.0 m"). */
  depthText: RefObject<HTMLSpanElement | null>;
  /** Moving marker on the dimension rail (top offset in %). */
  railMarker: RefObject<HTMLDivElement | null>;
  /** Live budget figure in the Act 5 card. */
  budgetText: RefObject<HTMLSpanElement | null>;
  /** HTML copy container transformed smoothly on scroll frames. */
  copyLayer?: RefObject<HTMLDivElement | null>;
}
