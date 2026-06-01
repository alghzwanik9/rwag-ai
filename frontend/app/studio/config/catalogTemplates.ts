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

// GLB files available in frontend/public/assets/
const LOCAL_GLB: Record<string, string> = {
  // Original 6 assets
  sofra:   "/assets/sofa.glb",
  armchair: "/assets/armchair.glb",
  table:   "/assets/table.glb",
  tv_unit: "/assets/tv_unit.glb",
  rug:     "/assets/rug.glb",
  plant:   "/assets/plant.glb",
  // AR-Code furniture (CC0)
  deck_chair:     "/assets/deck_chair.glb",
  dining_chair:   "/assets/dining_chair.glb",
  drawer_cabinet: "/assets/drawer_cabinet.glb",
  coffee_table_art:  "/assets/coffee_table_art.glb",
  display_shelf:  "/assets/display_shelf.glb",
  coffee_table_round: "/assets/coffee_table_round.glb",
  armchair_wood:  "/assets/armchair_wood.glb",
  outdoor_set:    "/assets/outdoor_set.glb",
  // Khronos glTF assets
  sofa_khronos:   "/assets/sofa_khronos.glb",
  toy_drum:       "/assets/toy_drum.glb",
  camera_antique:  "/assets/camera_antique.glb",
  vase_flowers:   "/assets/vase_flowers.glb",
  damaged_helmet:  "/assets/damaged_helmet.glb",
  metal_rough:    "/assets/metal_rough.glb",
  materials_shoe: "/assets/materials_shoe.glb",
  water_bottle:   "/assets/water_bottle.glb",
};

export const IKEA_TEMPLATES: IProductTemplate[] = [
  // ── مقاعد (Seating) ──
  {
    id: "kivik_sofa",
    name: "أريكة 3 مقاعد KIVIK",
    brand: "IKEA",
    price: 2495,
    currency: "SAR",
    category: "seating",
    modelUrl: LOCAL_GLB.sofra,
    dimensions: { width: 2280, height: 830, depth: 950 },
    thumbnailUrl: ""
  },
  {
    id: "stig_bar_stool",
    name: "كرسي بار STIG",
    brand: "IKEA",
    price: 69,
    currency: "SAR",
    category: "seating",
    modelUrl: LOCAL_GLB.armchair,
    dimensions: { width: 500, height: 740, depth: 500 },
    thumbnailUrl: ""
  },
  {
    id: "strandmon_chair",
    name: "كرسي بمسندين STRANDMON",
    brand: "IKEA",
    price: 1195,
    currency: "SAR",
    category: "seating",
    modelUrl: LOCAL_GLB.armchair,
    dimensions: { width: 820, height: 1010, depth: 960 },
    thumbnailUrl: ""
  },
  {
    id: "deck_chair",
    name: "كرسي سطح",
    brand: "Rwaq",
    price: 0,
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
    price: 0,
    currency: "SAR",
    category: "seating",
    modelUrl: LOCAL_GLB.dining_chair,
    dimensions: { width: 450, height: 850, depth: 500 },
    thumbnailUrl: ""
  },
  {
    id: "armchair_wood",
    name: "كرسي بذراعين خشب",
    brand: "Rwaq",
    price: 0,
    currency: "SAR",
    category: "seating",
    modelUrl: LOCAL_GLB.armchair_wood,
    dimensions: { width: 700, height: 950, depth: 750 },
    thumbnailUrl: ""
  },
  {
    id: "sofa_khronos",
    name: "كنبة",
    brand: "Rwaq",
    price: 0,
    currency: "SAR",
    category: "seating",
    modelUrl: LOCAL_GLB.sofa_khronos,
    dimensions: { width: 820, height: 1010, depth: 960 },
    thumbnailUrl: ""
  },

  // ── طاولات (Tables) ──
  {
    id: "lack_table",
    name: "طاولة قهوة LACK",
    brand: "IKEA",
    price: 95,
    currency: "SAR",
    category: "tables",
    modelUrl: LOCAL_GLB.table,
    dimensions: { width: 900, height: 450, depth: 550 },
    thumbnailUrl: ""
  },
  {
    id: "ekedalen_table",
    name: "طاولة طعام قابلة للتمديد EKEDALEN",
    brand: "IKEA",
    price: 895,
    currency: "SAR",
    category: "tables",
    modelUrl: LOCAL_GLB.table,
    dimensions: { width: 1200, height: 750, depth: 800 },
    thumbnailUrl: ""
  },
  {
    id: "coffee_table_art",
    name: "طاولة قهوة مودرن",
    brand: "Rwaq",
    price: 0,
    currency: "SAR",
    category: "tables",
    modelUrl: LOCAL_GLB.coffee_table_art,
    dimensions: { width: 1000, height: 450, depth: 600 },
    thumbnailUrl: ""
  },
  {
    id: "coffee_table_round",
    name: "طاولة قهوة بيضاء",
    brand: "Rwaq",
    price: 0,
    currency: "SAR",
    category: "tables",
    modelUrl: LOCAL_GLB.coffee_table_round,
    dimensions: { width: 800, height: 450, depth: 800 },
    thumbnailUrl: ""
  },
  {
    id: "outdoor_set",
    name: "طقم حديقة",
    brand: "Rwaq",
    price: 0,
    currency: "SAR",
    category: "tables",
    modelUrl: LOCAL_GLB.outdoor_set,
    dimensions: { width: 1500, height: 750, depth: 1500 },
    thumbnailUrl: ""
  },

  // ── إضاءة (Lighting) ──
  {
    id: "hektar_lamp",
    name: "مصباح أرضي HEKTAR",
    brand: "IKEA",
    price: 295,
    currency: "SAR",
    category: "lighting",
    modelUrl: LOCAL_GLB.plant,
    dimensions: { width: 330, height: 1810, depth: 330 },
    thumbnailUrl: ""
  },
  {
    id: "nymane_lamp",
    name: "مصباح سقف NYMÅNE",
    brand: "IKEA",
    price: 195,
    currency: "SAR",
    category: "lighting",
    modelUrl: LOCAL_GLB.plant,
    dimensions: { width: 400, height: 150, depth: 400 },
    thumbnailUrl: ""
  },

  // ── سجاد (Rugs) ──
  {
    id: "stockholm_rug",
    name: "سجادة منسوجة STOCKHOLM",
    brand: "IKEA",
    price: 1495,
    currency: "SAR",
    category: "rugs",
    modelUrl: LOCAL_GLB.rug,
    dimensions: { width: 1700, height: 10, depth: 2400 },
    thumbnailUrl: ""
  },
  {
    id: "lohals_rug",
    name: "سجادة جوت مسطحة LOHALS",
    brand: "IKEA",
    price: 395,
    currency: "SAR",
    category: "rugs",
    modelUrl: LOCAL_GLB.rug,
    dimensions: { width: 1600, height: 5, depth: 2300 },
    thumbnailUrl: ""
  },

  // ── تخزين (Storage) ──
  {
    id: "drawer_cabinet",
    name: "خزانة أدراج",
    brand: "Rwaq",
    price: 0,
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
    price: 0,
    currency: "SAR",
    category: "storage",
    modelUrl: LOCAL_GLB.display_shelf,
    dimensions: { width: 800, height: 1200, depth: 300 },
    thumbnailUrl: ""
  },

  // ── ديكور (Decor) ──
  {
    id: "tv_unit",
    name: "وحدة تلفزيون",
    brand: "IKEA",
    price: 595,
    currency: "SAR",
    category: "decor",
    modelUrl: LOCAL_GLB.tv_unit,
    dimensions: { width: 1200, height: 400, depth: 350 },
    thumbnailUrl: ""
  },
  {
    id: "plant_potted",
    name: "نبات داخلي",
    brand: "IKEA",
    price: 145,
    currency: "SAR",
    category: "decor",
    modelUrl: LOCAL_GLB.plant,
    dimensions: { width: 350, height: 900, depth: 350 },
    thumbnailUrl: ""
  },
  {
    id: "toy_drum",
    name: "ديكور",
    brand: "Rwaq",
    price: 0,
    currency: "SAR",
    category: "decor",
    modelUrl: LOCAL_GLB.toy_drum,
    dimensions: { width: 600, height: 600, depth: 600 },
    thumbnailUrl: ""
  },
  {
    id: "camera_antique",
    name: "كاميرا",
    brand: "Rwaq",
    price: 0,
    currency: "SAR",
    category: "decor",
    modelUrl: LOCAL_GLB.camera_antique,
    dimensions: { width: 200, height: 300, depth: 150 },
    thumbnailUrl: ""
  },
  {
    id: "vase_flowers",
    name: "مزهرية",
    brand: "Rwaq",
    price: 0,
    currency: "SAR",
    category: "decor",
    modelUrl: LOCAL_GLB.vase_flowers,
    dimensions: { width: 150, height: 350, depth: 150 },
    thumbnailUrl: ""
  },
  {
    id: "water_bottle",
    name: "قنينة",
    brand: "Rwaq",
    price: 0,
    currency: "SAR",
    category: "decor",
    modelUrl: LOCAL_GLB.water_bottle,
    dimensions: { width: 80, height: 250, depth: 80 },
    thumbnailUrl: ""
  },
  {
    id: "materials_shoe",
    name: "حذاء",
    brand: "Rwaq",
    price: 0,
    currency: "SAR",
    category: "decor",
    modelUrl: LOCAL_GLB.materials_shoe,
    dimensions: { width: 310, height: 120, depth: 100 },
    thumbnailUrl: ""
  },
];
