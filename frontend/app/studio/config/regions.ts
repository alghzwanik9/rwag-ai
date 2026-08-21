/**
 * Single source of truth for the studio's three-region layout.
 *
 * The previous page stacked a z-40 icon rail, the z-40 global header, a z-50
 * floating sidebar and z-90/z-100/z-110 modals with no ordering rule — which is
 * exactly why the header rendered clipped underneath the right panel. Every
 * studio surface now takes its layer from this ladder instead of inventing one.
 */
export const Z = {
  /** The <Canvas> itself. */
  canvas: 'z-0',
  /** Badges and hints drawn over the canvas but under the toolbar. */
  canvasOverlay: 'z-10',
  /** The floating five-action toolbar. */
  sceneToolbar: 'z-20',
  /** Header, conversation column, scene drawer. */
  region: 'z-30',
  /** Popovers anchored inside a region. */
  popover: 'z-40',
  /** Full-screen modals. */
  modal: 'z-50',
  /** Toasts and connectivity alerts — always on top. */
  notification: 'z-60',
} as const;

/** Region sizes. Kept in sync with the Tailwind classes in REGION below. */
export const HEADER_H = 64;
export const RIGHT_COL_W = 360;
export const LEFT_DRAWER_W = 320;

/**
 * Positioning for each region. The canvas is inset by the header and the
 * conversation column, but NOT by the scene drawer: the drawer overlays the
 * canvas so that toggling it never resizes the WebGL surface.
 */
export const REGION = {
  header: 'fixed top-0 inset-x-0 h-16',
  conversation: 'fixed top-16 bottom-0 right-0 w-[360px]',
  drawer: 'fixed top-16 bottom-0 left-0 w-[320px]',
  canvas: 'fixed top-16 bottom-0 left-0 right-[360px]',
} as const;
