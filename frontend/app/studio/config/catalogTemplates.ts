export interface IProductTemplate {
  id: string;
  name: string;
  brand: string;
  price: number;
  currency: string;
  category: 'seating' | 'tables' | 'lighting' | 'rugs' | 'storage' | 'decor';
  modelUrl: string;
  dimensions: { width: number; height: number; depth: number };
  thumbnailUrl: string;
  store_url?: string;
  sku?: string;
}

// Verified local GLB models in frontend/public/assets/ (every file is >= 1 MB).
export const LOCAL_GLB = {
  // AR-Code furniture (CC0)
  deck_chair: "/assets/deck_chair.glb",
  dining_chair: "/assets/dining_chair.glb",
  drawer_cabinet: "/assets/drawer_cabinet.glb",
  coffee_table_art: "/assets/coffee_table_art.glb",
  display_shelf: "/assets/display_shelf.glb",
  coffee_table_round: "/assets/coffee_table_round.glb",
  armchair_wood: "/assets/armchair_wood.glb",
  outdoor_set: "/assets/outdoor_set.glb",
  // Khronos glTF furniture & decor assets
  sofa_khronos: "/assets/sofa_khronos.glb",
  vase_flowers: "/assets/vase_flowers.glb",
  // Dedicated architectural PBR furniture assets
  bed_double: "/assets/bed_double.glb",
  tv_unit_low: "/assets/tv_unit_low.glb",
  rug_woven: "/assets/rug_woven.glb",
  indoor_plant: "/assets/indoor_plant.glb",
  floor_lamp: "/assets/floor_lamp.glb",
  office_desk: "/assets/office_desk.glb",
} as const;

// Curated Kenney Low-Poly/Modular furniture assets for expanded coverage
export const KENNEY_GLB = {
  // Sofas & Lounges
  lounge_sofa_corner: "/assets/kenney/loungeSofaCorner.glb",
  lounge_sofa_long: "/assets/kenney/loungeSofaLong.glb",
  lounge_chair: "/assets/kenney/loungeChair.glb",
  lounge_chair_relax: "/assets/kenney/loungeChairRelax.glb",
  bench_cushion: "/assets/kenney/benchCushion.glb",

  // Chairs & Seating
  chair_desk: "/assets/kenney/chairDesk.glb",
  chair_modern: "/assets/kenney/chairModernCushion.glb",
  stool_bar: "/assets/kenney/stoolBar.glb",

  // Beds
  bed_single: "/assets/kenney/bedSingle.glb",
  bed_bunk: "/assets/kenney/bedBunk.glb",

  // Tables & Desks
  dining_table: "/assets/kenney/table.glb",
  table_round: "/assets/kenney/tableRound.glb",
  side_table: "/assets/kenney/sideTable.glb",
  side_table_drawers: "/assets/kenney/sideTableDrawers.glb",
  desk_corner: "/assets/kenney/deskCorner.glb",
  table_coffee_glass: "/assets/kenney/tableCoffeeGlass.glb",

  // Nightstands
  cabinet_bed: "/assets/kenney/cabinetBedDrawerTable.glb",

  // Storage & Bookcases
  bookcase_open: "/assets/kenney/bookcaseOpen.glb",
  bookcase_closed: "/assets/kenney/bookcaseClosedDoors.glb",
  cabinet_tv: "/assets/kenney/cabinetTelevisionDoors.glb",

  // Lighting
  lamp_table: "/assets/kenney/lampRoundTable.glb",
  lamp_floor: "/assets/kenney/lampRoundFloor.glb",

  // Rugs
  rug_round: "/assets/kenney/rugRound.glb",
  rug_rectangle: "/assets/kenney/rugRectangle.glb",

  // Decor & Plants
  potted_plant: "/assets/kenney/pottedPlant.glb",
} as const;

export const DEFAULT_FALLBACK_GLB = LOCAL_GLB.armchair_wood;

export const IKEA_TEMPLATES: IProductTemplate[] = [
  // ── مقاعد (Seating) ──
  {
    id: "sofa",
    name: "أريكة معاصرة 3 مقاعد",
    brand: "Rwaq",
    price: 2950,
    currency: "SAR",
    category: "seating",
    modelUrl: LOCAL_GLB.sofa_khronos,
    dimensions: { width: 2200, height: 850, depth: 950 },
    thumbnailUrl: ""
  },
  {
    id: "kivik_sofa",
    name: "أريكة 3 مقاعد KIVIK",
    brand: "IKEA",
    price: 2495,
    currency: "SAR",
    category: "seating",
    modelUrl: LOCAL_GLB.sofa_khronos,
    dimensions: { width: 2280, height: 830, depth: 950 },
    thumbnailUrl: ""
  },
  {
    id: "armchair",
    name: "كرسي بذراعين خشبي",
    brand: "Rwaq",
    price: 1350,
    currency: "SAR",
    category: "seating",
    modelUrl: LOCAL_GLB.armchair_wood,
    dimensions: { width: 750, height: 950, depth: 800 },
    thumbnailUrl: ""
  },
  {
    id: "strandmon_chair",
    name: "كرسي بمسندين STRANDMON",
    brand: "IKEA",
    price: 1195,
    currency: "SAR",
    category: "seating",
    modelUrl: LOCAL_GLB.armchair_wood,
    dimensions: { width: 820, height: 1010, depth: 960 },
    thumbnailUrl: ""
  },
  {
    id: "deck_chair",
    name: "كرسي سطح",
    brand: "Rwaq",
    price: 349,
    currency: "SAR",
    category: "seating",
    modelUrl: LOCAL_GLB.deck_chair,
    dimensions: { width: 580, height: 900, depth: 600 },
    thumbnailUrl: ""
  },
  {
    id: "dining_chair",
    name: "كرسي طعام",
    brand: "Rwaq",
    price: 249,
    currency: "SAR",
    category: "seating",
    modelUrl: LOCAL_GLB.dining_chair,
    dimensions: { width: 450, height: 850, depth: 500 },
    thumbnailUrl: ""
  },

  // ── طاولات (Tables) ──
  {
    id: "coffee_table",
    name: "طاولة قهوة دائرية",
    brand: "Rwaq",
    price: 890,
    currency: "SAR",
    category: "tables",
    modelUrl: LOCAL_GLB.coffee_table_round,
    dimensions: { width: 900, height: 450, depth: 900 },
    thumbnailUrl: ""
  },
  {
    id: "lack_table",
    name: "طاولة قهوة LACK",
    brand: "IKEA",
    price: 95,
    currency: "SAR",
    category: "tables",
    modelUrl: LOCAL_GLB.coffee_table_round,
    dimensions: { width: 800, height: 450, depth: 800 },
    thumbnailUrl: ""
  },
  {
    id: "coffee_table_art",
    name: "طاولة قهوة مودرن",
    brand: "Rwaq",
    price: 645,
    currency: "SAR",
    category: "tables",
    modelUrl: LOCAL_GLB.coffee_table_art,
    dimensions: { width: 1000, height: 450, depth: 600 },
    thumbnailUrl: ""
  },
  {
    id: "outdoor_set",
    name: "طقم حديقة",
    brand: "Rwaq",
    price: 1450,
    currency: "SAR",
    category: "tables",
    modelUrl: LOCAL_GLB.outdoor_set,
    dimensions: { width: 1500, height: 750, depth: 1500 },
    thumbnailUrl: ""
  },

  // ── تخزين (Storage) ──
  {
    id: "bookshelf",
    name: "مكتبة ورفوف عرض",
    brand: "Rwaq",
    price: 649,
    currency: "SAR",
    category: "storage",
    modelUrl: LOCAL_GLB.display_shelf,
    dimensions: { width: 800, height: 1200, depth: 300 },
    thumbnailUrl: ""
  },
  {
    id: "tv_unit",
    name: "وحدة تلفزيون منخفضة",
    brand: "Rwaq",
    price: 1450,
    currency: "SAR",
    category: "storage",
    modelUrl: LOCAL_GLB.tv_unit_low,
    dimensions: { width: 1800, height: 500, depth: 420 },
    thumbnailUrl: ""
  },
  {
    id: "drawer_cabinet",
    name: "خزانة أدراج",
    brand: "Rwaq",
    price: 795,
    currency: "SAR",
    category: "storage",
    modelUrl: LOCAL_GLB.drawer_cabinet,
    dimensions: { width: 600, height: 800, depth: 400 },
    thumbnailUrl: ""
  },
  {
    id: "display_shelf",
    name: "رف عرض",
    brand: "Rwaq",
    price: 549,
    currency: "SAR",
    category: "storage",
    modelUrl: LOCAL_GLB.display_shelf,
    dimensions: { width: 800, height: 1200, depth: 300 },
    thumbnailUrl: ""
  },

  // ── أسرّة ومكاتب وسجاد وإضاءة ونباتات (Dedicated Categories) ──
  {
    id: "bed",
    name: "سرير مزدوج مبطن فاخر",
    brand: "Rwaq",
    price: 3250,
    currency: "SAR",
    category: "seating",
    modelUrl: LOCAL_GLB.bed_double,
    dimensions: { width: 1800, height: 1100, depth: 2100 },
    thumbnailUrl: ""
  },
  {
    id: "desk",
    name: "مكتب عمل تنفيذي خشب جوز",
    brand: "Rwaq",
    price: 1850,
    currency: "SAR",
    category: "tables",
    modelUrl: LOCAL_GLB.office_desk,
    dimensions: { width: 1400, height: 750, depth: 750 },
    thumbnailUrl: ""
  },
  {
    id: "rug",
    name: "سجادة منسوجة فاخرة",
    brand: "Rwaq",
    price: 1250,
    currency: "SAR",
    category: "rugs",
    modelUrl: LOCAL_GLB.rug_woven,
    dimensions: { width: 2000, height: 16, depth: 2800 },
    thumbnailUrl: ""
  },
  {
    id: "floor_lamp",
    name: "مصباح أرضي معماري نحاسي",
    brand: "Rwaq",
    price: 680,
    currency: "SAR",
    category: "lighting",
    modelUrl: LOCAL_GLB.floor_lamp,
    dimensions: { width: 420, height: 1600, depth: 420 },
    thumbnailUrl: ""
  },
  {
    id: "plant",
    name: "نبتة داخلية طبيعية بوعاء خزفي",
    brand: "IKEA",
    price: 245,
    currency: "SAR",
    category: "decor",
    modelUrl: LOCAL_GLB.indoor_plant,
    dimensions: { width: 550, height: 1200, depth: 550 },
    thumbnailUrl: ""
  },

  // ── ديكور (Decor) ──
  {
    id: "vase_flowers",
    name: "مزهرية",
    brand: "Rwaq",
    price: 129,
    currency: "SAR",
    category: "decor",
    modelUrl: LOCAL_GLB.vase_flowers,
    dimensions: { width: 150, height: 350, depth: 150 },
    thumbnailUrl: ""
  },

  // ── توسعة الكتالوج الذكي (Kenney Extended Models) ──
  {
    id: "lounge_sofa_corner",
    name: "كنب زاوية مودرن L-Shape",
    brand: "IKEA",
    price: 3450,
    currency: "SAR",
    category: "seating",
    modelUrl: KENNEY_GLB.lounge_sofa_corner,
    dimensions: { width: 2400, height: 800, depth: 1800 },
    thumbnailUrl: ""
  },
  {
    id: "lounge_sofa_long",
    name: "أريكة استرخاء 4 مقاعد واسعة",
    brand: "IKEA",
    price: 2750,
    currency: "SAR",
    category: "seating",
    modelUrl: KENNEY_GLB.lounge_sofa_long,
    dimensions: { width: 2500, height: 820, depth: 950 },
    thumbnailUrl: ""
  },
  {
    id: "lounge_chair",
    name: "كرسي استرخاء مودرن فوتيه",
    brand: "IKEA",
    price: 890,
    currency: "SAR",
    category: "seating",
    modelUrl: KENNEY_GLB.lounge_chair,
    dimensions: { width: 850, height: 850, depth: 850 },
    thumbnailUrl: ""
  },
  {
    id: "chair_desk",
    name: "كرسي مكتب مريح دوار",
    brand: "IKEA",
    price: 650,
    currency: "SAR",
    category: "seating",
    modelUrl: KENNEY_GLB.chair_desk,
    dimensions: { width: 650, height: 950, depth: 650 },
    thumbnailUrl: ""
  },
  {
    id: "chair_modern",
    name: "كرسي معاصر مبطن",
    brand: "IKEA",
    price: 420,
    currency: "SAR",
    category: "seating",
    modelUrl: KENNEY_GLB.chair_modern,
    dimensions: { width: 550, height: 850, depth: 550 },
    thumbnailUrl: ""
  },
  {
    id: "stool_bar",
    name: "كرسي كاونتر / بار مرتفع",
    brand: "IKEA",
    price: 320,
    currency: "SAR",
    category: "seating",
    modelUrl: KENNEY_GLB.stool_bar,
    dimensions: { width: 450, height: 950, depth: 450 },
    thumbnailUrl: ""
  },
  {
    id: "bench_cushion",
    name: "مقعد بنش مدخل مبطن",
    brand: "IKEA",
    price: 480,
    currency: "SAR",
    category: "seating",
    modelUrl: KENNEY_GLB.bench_cushion,
    dimensions: { width: 1200, height: 480, depth: 400 },
    thumbnailUrl: ""
  },
  {
    id: "bed_single",
    name: "سرير مفرد فردي كلاسيك",
    brand: "IKEA",
    price: 1150,
    currency: "SAR",
    category: "seating",
    modelUrl: KENNEY_GLB.bed_single,
    dimensions: { width: 1000, height: 900, depth: 2050 },
    thumbnailUrl: ""
  },
  {
    id: "bed_bunk",
    name: "سرير طابقين للأطفال والشباب",
    brand: "IKEA",
    price: 1950,
    currency: "SAR",
    category: "seating",
    modelUrl: KENNEY_GLB.bed_bunk,
    dimensions: { width: 1050, height: 1650, depth: 2050 },
    thumbnailUrl: ""
  },
  {
    id: "cabinet_bed",
    name: "طاولة سرير جانبية (كومودينة)",
    brand: "IKEA",
    price: 345,
    currency: "SAR",
    category: "storage",
    modelUrl: KENNEY_GLB.cabinet_bed,
    dimensions: { width: 450, height: 550, depth: 400 },
    thumbnailUrl: ""
  },
  {
    id: "side_table",
    name: "طاولة جانبية خشبية",
    brand: "IKEA",
    price: 260,
    currency: "SAR",
    category: "tables",
    modelUrl: KENNEY_GLB.side_table,
    dimensions: { width: 500, height: 500, depth: 500 },
    thumbnailUrl: ""
  },
  {
    id: "dining_table",
    name: "طاولة طعام خشبية 6 أشخاص",
    brand: "IKEA",
    price: 1650,
    currency: "SAR",
    category: "tables",
    modelUrl: KENNEY_GLB.dining_table,
    dimensions: { width: 1800, height: 750, depth: 900 },
    thumbnailUrl: ""
  },
  {
    id: "table_round",
    name: "طاولة طعام دائرية مودرن",
    brand: "IKEA",
    price: 1250,
    currency: "SAR",
    category: "tables",
    modelUrl: KENNEY_GLB.table_round,
    dimensions: { width: 1100, height: 750, depth: 1100 },
    thumbnailUrl: ""
  },
  {
    id: "desk_corner",
    name: "مكتب عمل زاوية L-Desk",
    brand: "IKEA",
    price: 1450,
    currency: "SAR",
    category: "tables",
    modelUrl: KENNEY_GLB.desk_corner,
    dimensions: { width: 1600, height: 750, depth: 1200 },
    thumbnailUrl: ""
  },
  {
    id: "table_coffee_glass",
    name: "طاولة قهوة زجاجية عصرية",
    brand: "IKEA",
    price: 780,
    currency: "SAR",
    category: "tables",
    modelUrl: KENNEY_GLB.table_coffee_glass,
    dimensions: { width: 1000, height: 420, depth: 600 },
    thumbnailUrl: ""
  },
  {
    id: "bookcase_open",
    name: "مكتبة كتب عمودية مفتوحة (BILLY)",
    brand: "IKEA",
    price: 495,
    currency: "SAR",
    category: "storage",
    modelUrl: KENNEY_GLB.bookcase_open,
    dimensions: { width: 800, height: 2020, depth: 300 },
    thumbnailUrl: ""
  },
  {
    id: "bookcase_closed",
    name: "خزانة كتب بأبواب زجاجية أنيقة",
    brand: "IKEA",
    price: 890,
    currency: "SAR",
    category: "storage",
    modelUrl: KENNEY_GLB.bookcase_closed,
    dimensions: { width: 800, height: 2020, depth: 380 },
    thumbnailUrl: ""
  },
  {
    id: "cabinet_tv",
    name: "خزانة تلفزيون بأبواب تخزين",
    brand: "IKEA",
    price: 980,
    currency: "SAR",
    category: "storage",
    modelUrl: KENNEY_GLB.cabinet_tv,
    dimensions: { width: 1500, height: 550, depth: 450 },
    thumbnailUrl: ""
  },
  {
    id: "lamp_table",
    name: "أباجورة / مصباح طاولة قماشي",
    brand: "IKEA",
    price: 185,
    currency: "SAR",
    category: "lighting",
    modelUrl: KENNEY_GLB.lamp_table,
    dimensions: { width: 300, height: 500, depth: 300 },
    thumbnailUrl: ""
  },
  {
    id: "rug_round",
    name: "سجادة أرضية دائرية منسوجة",
    brand: "IKEA",
    price: 750,
    currency: "SAR",
    category: "rugs",
    modelUrl: KENNEY_GLB.rug_round,
    dimensions: { width: 1800, height: 15, depth: 1800 },
    thumbnailUrl: ""
  },
  {
    id: "potted_plant",
    name: "نبتة زينة صغيرة لسطح المكتب",
    brand: "IKEA",
    price: 65,
    currency: "SAR",
    category: "decor",
    modelUrl: KENNEY_GLB.potted_plant,
    dimensions: { width: 250, height: 350, depth: 250 },
    thumbnailUrl: ""
  },
  {
    id: "wall_art",
    name: "لوحة جدارية فاخرة بإطار معماري",
    brand: "Rwaq Gallery",
    price: 380,
    currency: "SAR",
    category: "decor",
    modelUrl: "/assets/wall_art.glb",
    dimensions: { width: 1200, height: 800, depth: 40 },
    thumbnailUrl: ""
  },
  {
    id: "rug_woven",
    name: "سجادة فاخرة منسوجة يدوياً",
    brand: "Rwaq",
    price: 1350,
    currency: "SAR",
    category: "rugs",
    modelUrl: LOCAL_GLB.rug_woven,
    dimensions: { width: 2400, height: 16, depth: 1700 },
    thumbnailUrl: ""
  },
  {
    id: "indoor_plant",
    name: "نبتة داخلية معمارية بوعاء خزفي",
    brand: "IKEA",
    price: 245,
    currency: "SAR",
    category: "decor",
    modelUrl: LOCAL_GLB.indoor_plant,
    dimensions: { width: 550, height: 1200, depth: 550 },
    thumbnailUrl: ""
  },
  {
    id: "lamp_floor",
    name: "مصباح أرضي دائري معاصر",
    brand: "IKEA",
    price: 495,
    currency: "SAR",
    category: "lighting",
    modelUrl: KENNEY_GLB.lamp_floor,
    dimensions: { width: 450, height: 1550, depth: 450 },
    thumbnailUrl: ""
  },
];
