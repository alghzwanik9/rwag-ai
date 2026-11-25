/**
 * Content, architectural geometry, and 5-Act spline choreography for the
 * Rwaq AI cinematic multi-room 3D walkthrough landing page.
 */

export const PAVILION = {
  /** Total dual-suite width along X (Zone A + Portal Wall + Zone B). */
  totalWidth: 12.2,
  /** Suite depth along Z. */
  depth: 5.4,
  /** Interior ceiling height along Y. */
  wallHeight: 3.1,
  /** Individual room width (each zone spans ~5.8m clear inside). */
  roomWidth: 5.8,
  /** Architectural wall thickness for physical portal jambs. */
  wallThickness: 0.22,
  /** Center X of Zone A (Main Living Lounge). */
  livingCenterX: -3.05,
  /** Center X of Zone B (Andalusian / Japandi Majlis Suite). */
  majlisCenterX: 3.05,
  /** Total walkthrough path length displayed on the left architectural gauge. */
  walkthroughMeters: 12.0,
} as const;

/** Kept for compatibility with any consumers referencing ROOM dimensions. */
export const ROOM = {
  width: PAVILION.roomWidth,
  depth: PAVILION.walkthroughMeters,
  wallHeight: PAVILION.wallHeight,
} as const;

/* ── Materials & Style Morph Palettes ───────────────────────────────────── */

export const MATERIALS = {
  wireframe: '#5A6474',
  brass: '#C79A4B',
  brassBright: '#E8C488',
  sbcEmerald: '#34D399',
  oak: '#7E5A34',
  oakRecess: '#322112',
  walnut: '#46301D',
  plasterLiving: '#EDE6DB',
  ceiling: '#F3EEE6',
  travertine: '#BDA888',
  plinth: '#161E2E',
  windowMullion: '#262320',
  screen: '#12151B',
} as const;

/**
 * Zone B dynamically morphs between Serene Japandi (t = 0) and
 * Andalusian Majlis Luxury (t = 1) as the visitor glides through Act 04.
 */
export const SUITE2_MORPH = {
  japandi: {
    wall: '#EFECE6',
    nicheBack: '#DDD5C7',
    floor: '#C9B9A2',
    sofaTint: '#D2C7B7',
    rugTint: '#6B6A62',
    coveColor: '#FFE8C8',
    coveIntensity: 2.2,
    nicheGlow: '#FFE1B5',
  },
  andalusian: {
    wall: '#E8DCCB',
    nicheBack: '#6E4B32',
    floor: '#A88C6D',
    sofaTint: '#2C3D55',
    rugTint: '#593A2B',
    coveColor: '#FFBA66',
    coveIntensity: 3.8,
    nicheGlow: '#FFA94D',
  },
} as const;

export const FLUTE = {
  count: 42,
  width: 0.068,
  depth: 0.048,
} as const;

/* ── 5-Act Choreography ─────────────────────────────────────────────────── */

export type ActId = 'vision' | 'living' | 'audit' | 'morph' | 'pricing';

export const ALL_ACTS: readonly ActId[] = ['vision', 'living', 'audit', 'morph', 'pricing'];

export type ActRanges = Record<ActId, readonly [number, number]>;

export const sectionOffset = (index: number, pages: number): number =>
  pages > 1 ? index / (pages - 1) : 0;

/**
 * 5 sections -> 0.00 · 0.25 · 0.50 · 0.75 · 1.00
 * Ranges govern 3D feature animations (SBC audit overlay, Suite 2 style morph,
 * and live SAR budget count-up).
 */
export const ACT_RANGES: ActRanges = {
  vision: [0.0, 0.2],
  living: [0.16, 0.42],
  audit: [0.4, 0.64],
  morph: [0.64, 0.88],
  pricing: [0.84, 1.0],
};

export type SplineKeyframe = {
  pos: readonly [number, number, number];
  look: readonly [number, number, number];
};

/**
 * Curated Catmull-Rom 5-Act architectural spline path (Desktop):
 *   0) Act 01 Vision: Elevated exterior hero framing both illuminated suites
 *   1) Approach: Descending directly toward the Zone A brass entry portal
 *   2) Portal Pass: Gliding cleanly through the front architectural archway (z = +2.7)
 *   3) Act 02 Living Interior: Eye-level pan inside Living Lounge across sofa, oak wall & 3000K coves
 *   4) Act 03 SBC Audit: Rising inside Zone A to frame >= 0.90m walkway & 3.95m TV sightline
 *   5) Corridor Align: Descending onto the clear circulation corridor facing the inter-room portal
 *   6) Inter-Room Portal Pass: Gliding smoothly through x = 0 archway from Zone A into Zone B
 *   7) Act 04 Suite 2 Morph: Inside Andalusian/Japandi Majlis as materials & cove warmth morph live
 *   8) Exit Sweep: Gliding smoothly out of Suite 2's open front pavilion elevation
 *   9) Act 05 Pricing Reveal: Elevated closing three-quarter framing both suites cleanly
 */
export const DESKTOP_SPLINE: readonly SplineKeyframe[] = [
  { pos: [-1.4, 4.35, 10.6], look: [0.0, 1.05, -0.3] },
  { pos: [-2.15, 2.15, 5.2], look: [-3.0, 1.15, -1.0] },
  { pos: [-2.1, 1.48, 2.55], look: [-3.35, 1.08, -1.6] },
  { pos: [-1.55, 1.46, 0.95], look: [-3.75, 1.0, -1.35] },
  { pos: [-1.25, 2.48, 1.75], look: [-3.0, 0.35, -0.4] },
  { pos: [-1.05, 1.56, -0.1], look: [1.8, 1.15, -0.35] },
  { pos: [0.35, 1.5, -0.12], look: [3.25, 1.08, -0.75] },
  { pos: [1.95, 1.5, 1.38], look: [3.55, 1.02, -0.95] },
  { pos: [3.5, 2.15, 4.9], look: [1.6, 1.05, -0.4] },
  { pos: [5.4, 3.25, 8.8], look: [0.35, 1.0, -0.3] },
];

/** Slightly wider pullback on mobile portrait screens so rooms breathe cleanly. */
export const MOBILE_SPLINE: readonly SplineKeyframe[] = [
  { pos: [-1.2, 4.95, 12.2], look: [0.0, 1.0, -0.2] },
  { pos: [-2.1, 2.25, 5.8], look: [-3.0, 1.15, -1.0] },
  { pos: [-2.05, 1.52, 2.65], look: [-3.35, 1.08, -1.6] },
  { pos: [-1.35, 1.52, 1.25], look: [-3.65, 1.0, -1.35] },
  { pos: [-1.1, 2.75, 2.15], look: [-3.0, 0.3, -0.4] },
  { pos: [-1.0, 1.6, -0.1], look: [1.8, 1.15, -0.35] },
  { pos: [0.35, 1.55, -0.12], look: [3.25, 1.08, -0.75] },
  { pos: [1.75, 1.58, 1.72], look: [3.45, 1.0, -0.95] },
  { pos: [3.6, 2.45, 5.6], look: [1.5, 1.0, -0.4] },
  { pos: [5.9, 3.75, 10.4], look: [0.3, 1.0, -0.3] },
];

/* ── GLB Showcase Furniture Layout ──────────────────────────────────────── */

export type ShowcaseZone = 'living' | 'majlis';

export interface ShowcaseAssetSpec {
  id: string;
  zone: ShowcaseZone;
  modelUrl: string;
  /** Target real-world dimensions in millimetres (matches RealFurnitureLoader convention). */
  dimensions: { width: number; height: number; depth: number };
  position: readonly [number, number, number];
  rotation: readonly [number, number, number];
  /** Optional static PBR tint override. */
  tint?: string;
  /** Whether this piece participates in Suite 2's live Act 04 style morph. */
  morphRole?: 'sofa' | 'rug';
  /** Fallback silhouette category if GLB is still streaming. */
  fallbackKind: 'sofa' | 'table' | 'console' | 'chair' | 'rug' | 'plant' | 'lamp' | 'shelf' | 'vase';
}

export const SHOWCASE_ASSETS: readonly ShowcaseAssetSpec[] = [
  // ── Zone A: Main Living Lounge (x ∈ [-5.95, -0.15], z ∈ [-2.7, +2.7]) ──
  {
    id: 'living-rug',
    zone: 'living',
    modelUrl: '/assets/rug_woven.glb',
    dimensions: { width: 3100, height: 18, depth: 2350 },
    position: [-3.45, 0.005, 0.35],
    rotation: [0, 0, 0],
    tint: '#4A5452',
    fallbackKind: 'rug',
  },
  {
    id: 'living-sofa',
    zone: 'living',
    modelUrl: '/assets/sofa_khronos.glb',
    dimensions: { width: 2280, height: 840, depth: 960 },
    position: [-3.45, 0, 1.48],
    rotation: [0, Math.PI, 0],
    tint: '#CFC4B4',
    fallbackKind: 'sofa',
  },
  {
    id: 'living-coffee-table',
    zone: 'living',
    modelUrl: '/assets/coffee_table_art.glb',
    dimensions: { width: 1120, height: 420, depth: 620 },
    position: [-3.45, 0, 0.14],
    rotation: [0, 0, 0],
    fallbackKind: 'table',
  },
  {
    id: 'living-vase',
    zone: 'living',
    modelUrl: '/assets/vase_flowers.glb',
    dimensions: { width: 170, height: 340, depth: 170 },
    position: [-3.2, 0.42, 0.14],
    rotation: [0, 0.4, 0],
    fallbackKind: 'vase',
  },
  {
    id: 'living-tv-console',
    zone: 'living',
    modelUrl: '/assets/tv_unit_low.glb',
    dimensions: { width: 1960, height: 460, depth: 420 },
    position: [-3.45, 0, -2.26],
    rotation: [0, 0, 0],
    fallbackKind: 'console',
  },
  {
    id: 'living-armchair',
    zone: 'living',
    modelUrl: '/assets/armchair_wood.glb',
    dimensions: { width: 740, height: 910, depth: 780 },
    position: [-5.1, 0, -0.55],
    rotation: [0, Math.PI * 0.34, 0],
    fallbackKind: 'chair',
  },
  {
    id: 'living-plant',
    zone: 'living',
    modelUrl: '/assets/indoor_plant.glb',
    dimensions: { width: 600, height: 1400, depth: 600 },
    position: [-5.38, 0, -2.08],
    rotation: [0, 0.5, 0],
    fallbackKind: 'plant',
  },
  {
    id: 'living-floor-lamp',
    zone: 'living',
    modelUrl: '/assets/floor_lamp.glb',
    dimensions: { width: 420, height: 1650, depth: 420 },
    position: [-5.15, 0, 1.58],
    rotation: [0, 0, 0],
    fallbackKind: 'lamp',
  },
  {
    id: 'living-shelf',
    zone: 'living',
    modelUrl: '/assets/display_shelf.glb',
    dimensions: { width: 850, height: 1450, depth: 340 },
    position: [-5.66, 0, 0.65],
    rotation: [0, Math.PI / 2, 0],
    fallbackKind: 'shelf',
  },

  // ── Zone B: Andalusian / Japandi Majlis Suite (x ∈ [+0.15, +5.95], z ∈ [-2.7, +2.7]) ──
  {
    id: 'majlis-rug',
    zone: 'majlis',
    modelUrl: '/assets/rug_woven.glb',
    dimensions: { width: 3250, height: 18, depth: 2650 },
    position: [3.2, 0.005, -0.05],
    rotation: [0, 0, 0],
    morphRole: 'rug',
    fallbackKind: 'rug',
  },
  {
    id: 'majlis-sofa',
    zone: 'majlis',
    modelUrl: '/assets/sofa_khronos.glb',
    dimensions: { width: 2340, height: 860, depth: 960 },
    position: [3.2, 0, -1.68],
    rotation: [0, 0, 0],
    morphRole: 'sofa',
    fallbackKind: 'sofa',
  },
  {
    id: 'majlis-table-round',
    zone: 'majlis',
    modelUrl: '/assets/coffee_table_round.glb',
    dimensions: { width: 940, height: 440, depth: 940 },
    position: [3.2, 0, 0.05],
    rotation: [0, 0, 0],
    fallbackKind: 'table',
  },
  {
    id: 'majlis-vase',
    zone: 'majlis',
    modelUrl: '/assets/vase_flowers.glb',
    dimensions: { width: 190, height: 380, depth: 190 },
    position: [3.2, 0.44, 0.05],
    rotation: [0, 1.1, 0],
    fallbackKind: 'vase',
  },
  {
    id: 'majlis-chair-west',
    zone: 'majlis',
    modelUrl: '/assets/armchair_wood.glb',
    dimensions: { width: 740, height: 920, depth: 780 },
    position: [1.62, 0, 0.92],
    rotation: [0, Math.PI * 0.72, 0],
    fallbackKind: 'chair',
  },
  {
    id: 'majlis-chair-east',
    zone: 'majlis',
    modelUrl: '/assets/armchair_wood.glb',
    dimensions: { width: 740, height: 920, depth: 780 },
    position: [4.75, 0, 0.55],
    rotation: [0, -Math.PI * 0.62, 0],
    fallbackKind: 'chair',
  },
  {
    id: 'majlis-cabinet',
    zone: 'majlis',
    modelUrl: '/assets/drawer_cabinet.glb',
    dimensions: { width: 920, height: 820, depth: 440 },
    position: [5.56, 0, -1.05],
    rotation: [0, -Math.PI / 2, 0],
    fallbackKind: 'shelf',
  },
  {
    id: 'majlis-plant',
    zone: 'majlis',
    modelUrl: '/assets/indoor_plant.glb',
    dimensions: { width: 620, height: 1460, depth: 620 },
    position: [5.38, 0, -2.08],
    rotation: [0, -0.6, 0],
    fallbackKind: 'plant',
  },
  {
    id: 'majlis-lamp',
    zone: 'majlis',
    modelUrl: '/assets/floor_lamp.glb',
    dimensions: { width: 420, height: 1680, depth: 420 },
    position: [1.35, 0, -2.02],
    rotation: [0, 0, 0],
    fallbackKind: 'lamp',
  },
];

/* ── Copy (5-Act Complete Platform Story) ───────────────────────────────── */

export type ActCopy = {
  id: ActId;
  indexLabel: string;
  shortLabelAr: string;
  tag: string;
  titleAr: string;
  bodyAr: string;
  highlights?: readonly string[];
};

export const ACT_COPY: readonly ActCopy[] = [
  {
    id: 'vision',
    indexLabel: '01',
    shortLabelAr: 'الرؤية',
    tag: 'ACT 01 — VISION',
    titleAr: 'صمّم مساحتك المعمارية بذكاء الوكلاء',
    bodyAr:
      'اكتب وصف غرفتك بالعربية أو ارفع مخططك ثنائي الأبعاد (2D)، لتبني وكلاء رِواق فراغك ثلاثي الأبعاد بمقاييس فيزيائية دقيقة وتدقيق هندسي فوري — قبل أن تشتري قطعة واحدة.',
    highlights: [
      'وصف عربي أو مخطط 2D',
      'استوديو 3D فيزيائي',
      'تدقيق كود البناء SBC',
      'رندرة عصبية 1:1',
      'تسعير SAR ومعاينة AR',
    ],
  },
  {
    id: 'living',
    indexLabel: '02',
    shortLabelAr: 'الفراغ 3D',
    tag: 'ACT 02 — ENTERING THE SPACE',
    titleAr: 'الدخول إلى الفراغ ثلاثي الأبعاد',
    bodyAr:
      'نغوص بك داخل غرفة المعيشة عبر البوابة المعمارية: قطع أثاث حقيقية بمقاسات السوق السعودي، إضاءة بيت نور دافئة 3000K، وخامات ترافنتين وخشب بلوط طبيعي قابلة للتعديل الفوري.',
    highlights: ['أبعاد حقيقية 1:1', 'إضاءة 3000K دافئة', '3,694 قطعة محلية'],
  },
  {
    id: 'audit',
    indexLabel: '03',
    shortLabelAr: 'كود البناء',
    tag: 'ACT 03 — SBC 201 & NEUFERT AUDIT',
    titleAr: 'التدقيق الهندسي وكود البناء السعودي',
    bodyAr:
      'يقيس المحرك الفراغي ممرات الحركة تلقائياً لضمان خلوّ ≥ 0.90م وفق كود البناء السعودي (SBC 201)، مع ضبط مسافة رؤية الشاشة (3.95م) ومنع أي تداخل بين الأثاث.',
  },
  {
    id: 'morph',
    indexLabel: '04',
    shortLabelAr: 'الطرز 1:1',
    tag: 'ACT 04 — SUITE TRANSITION & STYLE MORPH',
    titleAr: 'الانتقال بين الغرف وتحوّل الطرز الفوري',
    bodyAr:
      'نخرج عبر الممر المعماري إلى جناح المجلس حيث تتحوّل الخامات والإضاءة حياً بين هدوء الياباندي وفخامة المجلس الأندلسي — مع رندرة عصبية 8K مطابقة هندسياً 1:1 عبر Depth ControlNet.',
  },
  {
    id: 'pricing',
    indexLabel: '05',
    shortLabelAr: 'التكلفة SAR',
    tag: 'ACT 05 — LIVE SAR BOQ & EXECUTION',
    titleAr: 'التكلفة الفورية بالريال وجاهزية التنفيذ',
    bodyAr:
      'جدول كميات مفصّل بالريال السعودي مرتبط بالموردين المحليين، مع تصدير فوري لتقرير PDF هندسي بمخطط 2D، ومعاينة الواقع المعزز AR داخل مساحتك الحقيقية.',
  },
];

export const CTA = {
  primaryAr: 'ابدأ التصميم مجاناً في الاستوديو',
  primaryHref: '/studio',
  tourStartAr: 'شاهد الجولة المعمارية',
} as const;

/* ── Act 5 Itemized SAR Pricing (Exact 11,090 SAR Total) ────────────────── */

export type Supplier = 'IKEA' | 'West Elm' | 'أبيات' | 'إكسترا';

export type Furnishing = {
  id: string;
  labelAr: string;
  supplier: Supplier;
  price: number;
};

export const FURNISHINGS: readonly Furnishing[] = [
  { id: 'rug', labelAr: 'سجادة منسوجة فاخرة', supplier: 'IKEA', price: 1495 },
  { id: 'sofa', labelAr: 'أريكة ٣ مقاعد قماش بوكليه', supplier: 'IKEA', price: 2495 },
  { id: 'table', labelAr: 'طاولة قهوة بلوط طبيعي', supplier: 'أبيات', price: 1150 },
  { id: 'armchair', labelAr: 'كرسي ضيافة خشب صلب', supplier: 'أبيات', price: 1780 },
  { id: 'console', labelAr: 'وحدة تلفزيون بلوط منخفضة', supplier: 'أبيات', price: 1320 },
  { id: 'tv', labelAr: 'شاشة ٥٥ بوصة وإضاءة بيت نور', supplier: 'إكسترا', price: 2850 },
];

export const COST_TOTAL: number = FURNISHINGS.reduce((sum, piece) => sum + piece.price, 0);

/* ── Helpers ────────────────────────────────────────────────────────────── */

/** Remaps `offset` across an act's range to 0→1 with smoothstep ends. */
export const actProgress = (offset: number, range: readonly [number, number]): number => {
  const [a, b] = range;
  if (b <= a) return 0;
  const t = (offset - a) / (b - a);
  const clamped = Math.min(1, Math.max(0, t));
  return clamped * clamped * (3 - 2 * clamped);
};

/** Returns the active act index [0..count-1] nearest to scroll offset [0..1]. */
export const activeActIndexFor = (offset: number, count: number): number => {
  if (count <= 1) return 0;
  return Math.min(count - 1, Math.max(0, Math.round(offset * (count - 1))));
};
