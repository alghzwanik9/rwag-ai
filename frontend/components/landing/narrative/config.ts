/**
 * Content and choreography for the scroll-driven narrative landing page.
 *
 * Every number the scene animates from — act ranges, camera keyframes, room
 * dimensions, prices — lives here so the narrative can be retimed without
 * touching component logic.
 */

export const ROOM = {
  width: 5,
  depth: 5,
  wallHeight: 2.8,
} as const;

/* ── Materials (Act 3) ──────────────────────────────────────────────────── */

/** Palette for the material pass; the wireframe grey is the Act 1–2 state. */
export const MATERIALS = {
  wireframe: '#5A6474',
  /** Fluted oak slats on the back wall. */
  oak: '#9A7248',
  /** Recessed panel behind the flutes, one step darker for depth. */
  oakRecess: '#5A4028',
  /** Matte plaster on the other three walls. */
  plaster: '#C4B9A5',
  /** Travertine floor, sand. */
  travertine: '#CDC0A6',
  /** Phase 1 placeholder slab the travertine cross-fades in over. */
  slab: '#2A3242',
} as const;

/** Fluted oak profile on the back wall — slat count and section in meters. */
export const FLUTE = {
  count: 40,
  width: 0.075,
  depth: 0.05,
} as const;

export type ActId = 'void' | 'bounds' | 'material' | 'layout' | 'cost';

/** [start, end] in scroll offset. An empty act uses [-1, -1] and never fires. */
export type ActRanges = Record<ActId, readonly [number, number]>;

/**
 * Scroll offset at which copy section `index` fills the viewport.
 *
 * ScrollControls defines `offset = scrollTop / (scrollHeight - clientHeight)`,
 * and with `pages={n}` the scrollable distance is `(n - 1)` viewports — so the
 * section marks are spaced by `1 / (n - 1)`, NOT `1 / n`. The manually driven
 * copy overlay uses the same mapping (`Scene.tsx` translates it by
 * `offset * (n - 1) * innerHeight` over `100svh` sections), so both agree.
 *
 * Every range and camera keyframe below is anchored to these marks. Spacing
 * them by `1 / n` makes each beat land late and the error compounds per act.
 */
export const sectionOffset = (index: number, pages: number): number =>
  pages > 1 ? index / (pages - 1) : 0;

// 5 sections -> 0.00 · 0.25 · 0.50 · 0.75 · 1.00
export const DESKTOP_RANGES: ActRanges = {
  void: [0.0, 0.25],
  bounds: [0.06, 0.25],
  material: [0.3, 0.5],
  layout: [0.55, 0.75],
  cost: [0.8, 1.0],
};

/**
 * Below `md` the narrative collapses to three beats: void → material → cost.
 * 3 sections -> 0.00 · 0.50 · 1.00
 */
export const MOBILE_RANGES: ActRanges = {
  void: [0.0, 0.5],
  bounds: [0.1, 0.42],
  material: [0.3, 0.5],
  layout: [-1, -1], // act disabled on mobile
  cost: [0.75, 1.0],
};

export type CameraKey = {
  at: number;
  pos: readonly [number, number, number];
  look: readonly [number, number, number];
};

/**
 * Anchored to the 5 desktop section marks: 0.00 · 0.25 · 0.50 · 0.75 · 1.00.
 * The path carries one more key than there are marks, so the extra push-in sits
 * between the material and layout marks; every named mark still lands exactly.
 */
export const DESKTOP_CAMERA: readonly CameraKey[] = [
  { at: 0.0, pos: [0, 0.7, 7.8], look: [0, 1.1, 0] }, // low, near floor level
  { at: 0.25, pos: [1.8, 1.4, 6.2], look: [0, 1.0, 0] }, // bounds mark
  { at: 0.5, pos: [4.1, 2.3, 4.7], look: [0, 1.0, 0] }, // material mark
  { at: 0.625, pos: [3.0, 1.8, 3.9], look: [0, 0.9, -0.4] }, // push-in between marks
  { at: 0.75, pos: [0.01, 8.8, 0.4], look: [0, 0, 0] }, // layout mark — top-down plan
  { at: 1.0, pos: [-3.9, 2.5, 4.6], look: [0.5, 0.9, 0] }, // cost mark — closing three-quarter
];

/** Anchored to the 3 mobile section marks: 0.00 · 0.50 · 1.00. */
export const MOBILE_CAMERA: readonly CameraKey[] = [
  { at: 0.0, pos: [0, 0.8, 6.6], look: [0, 1.1, 0] },
  { at: 0.5, pos: [2.6, 1.8, 4.6], look: [0, 1.0, 0] }, // material mark
  { at: 0.75, pos: [3.1, 2.0, 3.6], look: [0, 0.9, -0.3] }, // push-in between marks
  { at: 1.0, pos: [-2.9, 2.1, 3.6], look: [0.3, 0.9, 0] }, // cost mark
];

/* ── Copy ───────────────────────────────────────────────────────────────── */

export type ActCopy = {
  id: ActId;
  /** Small Latin label above the heading, set in mono. */
  tag: string;
  titleAr: string;
  bodyAr: string;
};

export const ACT_COPY: readonly ActCopy[] = [
  {
    id: 'void',
    tag: 'ACT 01 — VOID',
    titleAr: 'صمّم مساحتك المعمارية بذكاء الوكلاء',
    bodyAr:
      'اكتب وصف غرفتك بالعربية، وشاهدها تُبنى أمامك: حدود، خامات، توزيع، وتكلفة — كل ذلك قبل أن تشتري قطعة واحدة.',
  },
  {
    id: 'bounds',
    tag: 'ACT 02 — BOUNDARY',
    titleAr: 'الحدود',
    bodyAr: 'يقرأ الوكيل الفراغي وصفك ويرسم حدود المساحة.',
  },
  {
    id: 'material',
    tag: 'ACT 03 — MATERIAL',
    titleAr: 'الخامة',
    bodyAr: 'مطابقة فورية للخامات من كاتالوجات الموردين المحليين.',
  },
  {
    id: 'layout',
    tag: 'ACT 04 — LAYOUT',
    titleAr: 'التوزيع',
    bodyAr: 'محرك التوزيع يضبط ممرات الحركة ويمنع التداخل وفق المعايير المعمارية.',
  },
  {
    id: 'cost',
    tag: 'ACT 05 — COST',
    titleAr: 'التكلفة',
    bodyAr: 'من وصفٍ مكتوب إلى مخطط قابل للتنفيذ وعرض سعر جاهز للعميل.',
  },
];

export const CTA = {
  primaryAr: 'ابدأ التصميم مجاناً',
  primaryHref: '/studio',
  secondaryAr: 'شاهد كيف يعمل',
} as const;

/* ── Act 4 footprints ───────────────────────────────────────────────────── */

export type Footprint = {
  labelAr: string;
  /** Center position on the floor in meters (room-centered coordinates). */
  x: number;
  z: number;
  w: number;
  d: number;
};

export const FOOTPRINTS: readonly Footprint[] = [
  { labelAr: 'سجادة', x: 0, z: 0.4, w: 3.0, d: 2.2 },
  { labelAr: 'أريكة', x: 0, z: 1.6, w: 2.3, d: 0.95 },
  { labelAr: 'طاولة', x: 0, z: 0.2, w: 1.1, d: 0.6 },
  { labelAr: 'مكتب', x: -1.7, z: -1.7, w: 1.4, d: 0.7 },
];

/** Dashed circulation paths between footprints, labeled `90 سم`. */
export const CIRCULATION: readonly { from: readonly [number, number]; to: readonly [number, number] }[] = [
  { from: [1.4, 1.6], to: [1.4, -1.4] },
  { from: [0, 0.85], to: [0, 0.55] },
];

/* ── Act 5 cost card ────────────────────────────────────────────────────── */

export type CostItem = {
  nameAr: string;
  supplier: 'IKEA' | 'West Elm' | 'أبيات';
  price: number;
};

export const COST_ITEMS: readonly CostItem[] = [
  { nameAr: 'أريكة ٣ مقاعد', supplier: 'IKEA', price: 2495 },
  { nameAr: 'طاولة قهوة بلوط', supplier: 'أبيات', price: 1150 },
  { nameAr: 'سجادة منسوجة', supplier: 'IKEA', price: 1495 },
  { nameAr: 'مكتب خشب صلب', supplier: 'أبيات', price: 1780 },
  { nameAr: 'مصباح أرضي نحاسي', supplier: 'West Elm', price: 620 },
];

export const COST_TOTAL: number = COST_ITEMS.reduce((sum, item) => sum + item.price, 0);

/* ── Helpers ────────────────────────────────────────────────────────────── */

/** Remaps `offset` across an act's range to 0→1 with smooth ends. */
export const actProgress = (offset: number, range: readonly [number, number]): number => {
  const [a, b] = range;
  if (b <= a) return 0;
  const t = (offset - a) / (b - a);
  const clamped = Math.min(1, Math.max(0, t));
  return clamped * clamped * (3 - 2 * clamped); // smoothstep
};
