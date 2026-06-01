import { RwaqMaterial } from './useSceneStore';

export const MATERIAL_LIBRARY: RwaqMaterial[] = [
  // ── Fabrics ──────────────────────────────────────────────────────────────
  {
    id: 'fab_velvet_emerald',
    name: 'زمرد مخملي',
    category: 'Fabrics',
    color: '#0d3b2e',
    roughness: 0.6,
    metalness: 0.1,
  },
  {
    id: 'fab_linen_beige',
    name: 'كتان بيج طبيعي',
    category: 'Fabrics',
    color: '#d3c5b5',
    roughness: 0.9,
    metalness: 0.0,
  },
  {
    id: 'fab_cotton_blue',
    name: 'قطن أزرق بحري',
    category: 'Fabrics',
    color: '#2a4b7c',
    roughness: 0.8,
    metalness: 0.0,
  },
  
  // ── Woods ────────────────────────────────────────────────────────────────
  {
    id: 'wood_oak_light',
    name: 'سنديان فاتح',
    category: 'Woods',
    color: '#c29c76', // Base color fallback
    roughness: 0.7,
    metalness: 0.0,
    // Using a placeholder high-res texture from a reliable CDN
    textureUrl: 'https://images.unsplash.com/photo-1550684376-efcbd6e3f031?q=80&w=512&auto=format&fit=crop',
  },
  {
    id: 'wood_walnut_dark',
    name: 'جوز داكن',
    category: 'Woods',
    color: '#3e2723',
    roughness: 0.6,
    metalness: 0.0,
    textureUrl: 'https://images.unsplash.com/photo-1546484396-fb3fc6f95f98?q=80&w=512&auto=format&fit=crop',
  },
  {
    id: 'wood_ebony_black',
    name: 'أبنوس أسود',
    category: 'Woods',
    color: '#1a1a1a',
    roughness: 0.5,
    metalness: 0.1,
    textureUrl: 'https://images.unsplash.com/photo-1596484552834-6a58f850d0d1?q=80&w=512&auto=format&fit=crop',
  },

  // ── Metals ───────────────────────────────────────────────────────────────
  {
    id: 'met_gold_brushed',
    name: 'ذهب مصقول',
    category: 'Metals',
    color: '#d4af37',
    roughness: 0.3,
    metalness: 1.0,
  },
  {
    id: 'met_chrome_polished',
    name: 'كروم لامع',
    category: 'Metals',
    color: '#e0e0e0',
    roughness: 0.1,
    metalness: 1.0,
  },
  {
    id: 'met_steel_brushed',
    name: 'فولاذ ناعم',
    category: 'Metals',
    color: '#757575',
    roughness: 0.5,
    metalness: 0.8,
  },
];
