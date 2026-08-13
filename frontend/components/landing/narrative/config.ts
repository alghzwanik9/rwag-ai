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

/**
 * Palette for the material pass; the wireframe grey is the Act 1–2 state.
 *
 * The three surfaces are spaced deliberately far apart in value — off-white
 * plaster, mid sand floor, dark oak — because that separation is what reads as
 * a designed room. Pulling them into a single warm band, as an earlier pass
 * did, flattens the space no matter how good the lighting is.
 */
export const MATERIALS = {
  wireframe: '#5A6474',
  /** Fluted oak slats on the back wall — the room's darkest surface. */
  oak: '#7E5A34',
  /** Recessed panel behind the flutes, well below the slats for depth. */
  oakRecess: '#3C2917',
  /** Matte plaster: a warm off-white, NOT a beige. Barely saturated, so it
   * takes its warmth from the key light rather than from its own pigment. */
  plaster: '#E9E3D9',
  /** Ceiling plaster, a shade lighter again so the room reads open overhead. */
  ceiling: '#F1ECE4',
  /** Travertine floor, sand — the middle value between plaster and oak. It
   * faces the sky and every light in the rig, so its base stays well down. */
  travertine: '#B29C78',
  /** Phase 1 placeholder slab the travertine cross-fades in over. */
  slab: '#2A3242',
} as const;

/** Act 4 furniture, drawn from the same palette so the volumes belong. */
export const FURNITURE = {
  /** Wool rug. Deliberately the one cool, dark note in an otherwise warm
   * room: a sand-adjacent rug sat at the travertine's own value and hue and
   * simply vanished into the floor, taking the seating zone with it. */
  rug: '#414E4C',
  /** Oatmeal upholstery — the room's one neutral that leans away from warm. */
  upholstery: '#A79E90',
  /** Solid oak tops, matching the back-wall fluting. */
  oak: '#7E5A34',
  /** Dark bronze legs and frames. */
  frame: '#3F3830',
  /** Switched-off panel — near black, with just enough sheen to catch the key. */
  screen: '#15181D',
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

export type FurnishingId = 'rug' | 'sofa' | 'table' | 'desk' | 'console' | 'tv';

export type Supplier = 'IKEA' | 'West Elm' | 'أبيات' | 'إكسترا';

/** Plan rectangle in meters, centered on the room's origin. */
export type Footprint = {
  x: number;
  z: number;
  w: number;
  d: number;
};

export type Furnishing = {
  /** Selects the Act 4 volume, and keys its Act 5 line item. */
  id: FurnishingId;
  labelAr: string;
  supplier: Supplier;
  /** SAR. */
  price: number;
  /** Absent on wall-mounted pieces — they stand on nothing, so they draw no
   * plan outline, but they still occupy a slot in the reveal order. */
  footprint?: Footprint;
};

/**
 * The single source of truth for what is in the room.
 *
 * The Act 4 plan outlines, the Act 4 volumes and the Act 5 quote are all
 * derived from this one list, in this order — so the card can never drift out
 * of step with what the scene actually renders. Adding a piece here adds it to
 * all three; the total recomputes on its own.
 */
export const FURNISHINGS: readonly Furnishing[] = [
  { id: 'rug', labelAr: 'سجادة منسوجة', supplier: 'IKEA', price: 1495,
    footprint: { x: 0, z: 0.4, w: 3.0, d: 2.2 } },
  { id: 'sofa', labelAr: 'أريكة ٣ مقاعد', supplier: 'IKEA', price: 2495,
    footprint: { x: 0, z: 1.6, w: 2.3, d: 0.95 } },
  { id: 'table', labelAr: 'طاولة قهوة بلوط', supplier: 'أبيات', price: 1150,
    footprint: { x: 0, z: 0.2, w: 1.1, d: 0.6 } },
  { id: 'desk', labelAr: 'مكتب خشب صلب', supplier: 'أبيات', price: 1780,
    footprint: { x: -1.7, z: -1.7, w: 1.4, d: 0.7 } },
  // Sits against the fluted wall, 5 mm clear of the slat faces.
  { id: 'console', labelAr: 'كونسول تلفزيون بلوط', supplier: 'أبيات', price: 1320,
    footprint: { x: 0, z: -2.24, w: 1.6, d: 0.4 } },
  { id: 'tv', labelAr: 'شاشة ٥٥ بوصة', supplier: 'إكسترا', price: 2850 },
];

export type PlacedFurnishing = Furnishing & { footprint: Footprint };

/** Narrowing guard so callers can read `footprint` without a non-null assertion. */
export const isPlaced = (piece: Furnishing): piece is PlacedFurnishing =>
  piece.footprint !== undefined;

/** Dashed circulation paths between footprints, labeled `90 سم`. */
export const CIRCULATION: readonly { from: readonly [number, number]; to: readonly [number, number] }[] = [
  { from: [1.4, 1.6], to: [1.4, -1.4] },
  { from: [0, 0.85], to: [0, 0.55] },
];

/* ── Act 5 cost card ────────────────────────────────────────────────────── */

/**
 * The quote is `FURNISHINGS` itself — there is no second list to keep in sync,
 * and the total is never a literal anyone can forget to update.
 */
export const COST_TOTAL: number = FURNISHINGS.reduce((sum, piece) => sum + piece.price, 0);

/* ── Helpers ────────────────────────────────────────────────────────────── */

/** Remaps `offset` across an act's range to 0→1 with smooth ends. */
export const actProgress = (offset: number, range: readonly [number, number]): number => {
  const [a, b] = range;
  if (b <= a) return 0;
  const t = (offset - a) / (b - a);
  const clamped = Math.min(1, Math.max(0, t));
  return clamped * clamped * (3 - 2 * clamped); // smoothstep
};
