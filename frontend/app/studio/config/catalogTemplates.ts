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

// Real, textured GLB models in frontend/public/assets/. Every file here is a
// genuine mesh over 1 MB — the 16-70 KB stubs (sofa/armchair/table/tv_unit/
// rug/plant) and the Khronos test samples are deliberately absent, since an
// entry pointing at one of them renders as an empty scene.
const LOCAL_GLB: Record<string, string> = {
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
  vase_flowers:   "/assets/vase_flowers.glb",
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
    modelUrl: LOCAL_GLB.sofa_khronos,
    dimensions: { width: 2280, height: 830, depth: 950 },
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
