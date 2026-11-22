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
];
