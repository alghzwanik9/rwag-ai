/**
 * Pure decision logic for the generation pipeline: how an AI item resolves
 * against the catalog, and what each stage reports.
 *
 * Deliberately free of React, zustand and network imports so the branching that
 * decides success/partial/failed can be exercised in isolation.
 */

import type { IProductTemplate } from "./catalogTemplates";
import type { AIResponseItem, PipelineStage } from "./pipeline";

/** Used only when the catalog is completely empty, so we never render a bare cube. */
export const PLACEHOLDER_MODEL_URL = "/assets/armchair_wood.glb";

/**
 * How one AI item was resolved against the catalog.
 * - `catalog`     the AI's asset_id/SKU matched a real product → a genuine match
 * - `substitute`  no id match; we borrowed another model so the scene isn't empty
 * - `placeholder` the catalog is empty; generic chair geometry
 *
 * Only `catalog` counts towards matchedCount. A substitute is not a match, and
 * reporting it as one is how the old UI claimed success while showing ٠ ر.س.
 */
export type Resolution =
  | { kind: 'catalog'; asset: IProductTemplate }
  | { kind: 'substitute'; asset: IProductTemplate }
  | { kind: 'placeholder' };

export interface ResolvedItem {
  item: AIResponseItem;
  resolution: Resolution;
}

export function arabicNumber(value: number): string {
  return value.toLocaleString('ar-SA');
}

const CANONICAL_SYNONYMS: Record<string, string[]> = {
  // ── Sofas & Lounges ──
  sofa: ['sofa', 'kivik_sofa', 'lounge_sofa_long', 'lounge_sofa_corner', 'sofa_khronos'],
  couch: ['sofa', 'kivik_sofa', 'lounge_sofa_long', 'sofa_khronos'],
  kivik: ['kivik_sofa', 'sofa', 'lounge_sofa_long'],
  kivik_sofa: ['kivik_sofa', 'sofa', 'lounge_sofa_long'],
  sectional: ['lounge_sofa_corner', 'sofa', 'kivik_sofa'],
  corner_sofa: ['lounge_sofa_corner', 'sofa'],
  l_sofa: ['lounge_sofa_corner', 'sofa'],
  lounge_sofa_corner: ['lounge_sofa_corner', 'sofa'],
  lounge_sofa_long: ['lounge_sofa_long', 'kivik_sofa', 'sofa'],
  loveseat: ['sofa', 'kivik_sofa', 'lounge_chair'],
  كنب: ['sofa', 'kivik_sofa', 'lounge_sofa_long', 'lounge_sofa_corner'],
  كنبة: ['sofa', 'kivik_sofa', 'lounge_sofa_long'],
  صوفا: ['sofa', 'kivik_sofa', 'lounge_sofa_long'],
  كنب_زاوية: ['lounge_sofa_corner', 'sofa'],
  كنبة_زاوية: ['lounge_sofa_corner', 'sofa'],
  جلسة: ['sofa', 'lounge_sofa_corner', 'lounge_chair'],

  // ── Chairs & Seating ──
  armchair: ['armchair', 'strandmon_chair', 'lounge_chair'],
  lounge_chair: ['lounge_chair', 'armchair', 'deck_chair'],
  strandmon: ['strandmon_chair', 'armchair'],
  strandmon_chair: ['strandmon_chair', 'armchair', 'lounge_chair'],
  accent_chair: ['armchair', 'strandmon_chair', 'lounge_chair'],
  chair: ['dining_chair', 'chair_modern', 'armchair', 'chair_desk', 'deck_chair'],
  dining_chair: ['dining_chair', 'chair_modern', 'armchair'],
  chair_modern: ['chair_modern', 'dining_chair', 'armchair'],
  desk_chair: ['chair_desk', 'chair_modern', 'dining_chair'],
  office_chair: ['chair_desk', 'chair_modern', 'dining_chair'],
  chair_desk: ['chair_desk', 'dining_chair'],
  bar_stool: ['stool_bar', 'dining_chair'],
  stool_bar: ['stool_bar', 'dining_chair'],
  stool: ['stool_bar', 'dining_chair'],
  deck_chair: ['deck_chair', 'armchair'],
  bench: ['bench_cushion', 'deck_chair'],
  bench_cushion: ['bench_cushion', 'deck_chair'],
  كرسي: ['dining_chair', 'chair_modern', 'armchair', 'chair_desk'],
  كرسي_بذراعين: ['armchair', 'strandmon_chair', 'lounge_chair'],
  كرسي_مكتب: ['chair_desk', 'chair_modern', 'dining_chair'],
  كرسي_طعام: ['dining_chair', 'chair_modern'],
  كرسي_استرخاء: ['lounge_chair', 'armchair', 'strandmon_chair'],
  فوتيه: ['lounge_chair', 'armchair'],
  كرسي_بار: ['stool_bar', 'dining_chair'],
  بار: ['stool_bar', 'dining_chair'],
  بنش: ['bench_cushion', 'deck_chair'],
  مقعد: ['bench_cushion', 'deck_chair'],

  // ── Tables ──
  coffee_table: ['coffee_table', 'table_coffee_glass', 'lack_table', 'coffee_table_art', 'side_table'],
  table_coffee_glass: ['table_coffee_glass', 'coffee_table', 'coffee_table_art'],
  coffee_table_art: ['coffee_table_art', 'coffee_table', 'table_coffee_glass'],
  coffee_table_round: ['coffee_table', 'coffee_table_art', 'table_round'],
  lack: ['lack_table', 'coffee_table'],
  lack_table: ['lack_table', 'coffee_table'],
  table: ['dining_table', 'table_round', 'coffee_table', 'outdoor_set'],
  dining_table: ['dining_table', 'table_round', 'coffee_table'],
  table_round: ['table_round', 'dining_table', 'coffee_table'],
  round_table: ['table_round', 'dining_table', 'coffee_table'],
  side_table: ['side_table', 'cabinet_bed', 'coffee_table', 'lack_table'],
  end_table: ['side_table', 'cabinet_bed', 'coffee_table'],
  outdoor_set: ['outdoor_set', 'dining_table', 'coffee_table'],
  garden_set: ['outdoor_set'],
  patio_set: ['outdoor_set'],
  طاولة: ['dining_table', 'coffee_table', 'side_table', 'table_round'],
  طاولة_قهوة: ['coffee_table', 'table_coffee_glass', 'lack_table', 'coffee_table_art'],
  طاولة_طعام: ['dining_table', 'table_round', 'coffee_table'],
  طاولة_جانبية: ['side_table', 'cabinet_bed', 'coffee_table'],
  طاولة_دائرية: ['table_round', 'coffee_table'],

  // ── Beds & Nightstands ──
  bed: ['bed', 'bed_single', 'bed_bunk', 'sofa'],
  double_bed: ['bed', 'bed_single'],
  king_bed: ['bed', 'bed_single'],
  queen_bed: ['bed', 'bed_single'],
  single_bed: ['bed_single', 'bed'],
  bed_single: ['bed_single', 'bed'],
  bunk_bed: ['bed_bunk', 'bed_single', 'bed'],
  bed_bunk: ['bed_bunk', 'bed_single', 'bed'],
  nightstand: ['cabinet_bed', 'side_table', 'drawer_cabinet'],
  bedside_table: ['cabinet_bed', 'side_table', 'drawer_cabinet'],
  cabinet_bed: ['cabinet_bed', 'side_table', 'drawer_cabinet'],
  سرير: ['bed', 'bed_single', 'bed_bunk'],
  سرير_مزدوج: ['bed'],
  سرير_مفرد: ['bed_single', 'bed'],
  سرير_طابقين: ['bed_bunk', 'bed_single', 'bed'],
  كومودينة: ['cabinet_bed', 'side_table'],
  كمدينة: ['cabinet_bed', 'side_table'],
  طاولة_سرير: ['cabinet_bed', 'side_table'],

  // ── Desks ──
  desk: ['desk', 'desk_corner', 'dining_table', 'coffee_table_art'],
  office_desk: ['desk', 'desk_corner', 'dining_table'],
  desk_corner: ['desk_corner', 'desk'],
  corner_desk: ['desk_corner', 'desk'],
  مكتب: ['desk', 'desk_corner', 'dining_table'],
  مكتب_زاوية: ['desk_corner', 'desk'],
  طاولة_مكتب: ['desk', 'dining_table'],

  // ── Storage & TV Units ──
  tv_unit: ['tv_unit', 'cabinet_tv', 'drawer_cabinet'],
  tv_stand: ['tv_unit', 'cabinet_tv', 'drawer_cabinet'],
  tv: ['tv_unit', 'cabinet_tv', 'drawer_cabinet'],
  media_console: ['tv_unit', 'cabinet_tv', 'drawer_cabinet'],
  cabinet_tv: ['cabinet_tv', 'tv_unit', 'drawer_cabinet'],
  bookshelf: ['bookshelf', 'bookcase_open', 'bookcase_closed', 'display_shelf'],
  bookcase: ['bookcase_open', 'bookcase_closed', 'bookshelf', 'display_shelf'],
  bookcase_open: ['bookcase_open', 'bookshelf', 'display_shelf'],
  bookcase_closed: ['bookcase_closed', 'bookshelf', 'drawer_cabinet'],
  shelf: ['display_shelf', 'bookshelf', 'bookcase_open'],
  display_shelf: ['display_shelf', 'bookshelf', 'bookcase_open'],
  synthetic_shelf: ['display_shelf', 'bookshelf'],
  shelving: ['bookshelf', 'bookcase_open', 'display_shelf'],
  cabinet: ['drawer_cabinet', 'cabinet_tv', 'bookcase_closed'],
  drawer_cabinet: ['drawer_cabinet', 'cabinet_tv', 'side_table'],
  drawer: ['drawer_cabinet', 'cabinet_tv'],
  dresser: ['drawer_cabinet', 'cabinet_tv'],
  wardrobe: ['bookcase_closed', 'drawer_cabinet'],
  sideboard: ['drawer_cabinet', 'cabinet_tv', 'tv_unit'],
  تلفزيون: ['tv_unit', 'cabinet_tv', 'drawer_cabinet'],
  وحدة_تلفزيون: ['tv_unit', 'cabinet_tv', 'drawer_cabinet'],
  طاولة_تلفزيون: ['tv_unit', 'cabinet_tv', 'drawer_cabinet'],
  مكتبة: ['bookshelf', 'bookcase_open', 'bookcase_closed', 'display_shelf'],
  خزانة_كتب: ['bookcase_open', 'bookcase_closed', 'bookshelf'],
  رف_كتب: ['bookshelf', 'bookcase_open', 'display_shelf'],
  رفوف: ['display_shelf', 'bookshelf', 'bookcase_open'],
  دولاب: ['drawer_cabinet', 'bookcase_closed', 'cabinet_tv'],
  خزانة: ['drawer_cabinet', 'cabinet_tv', 'bookcase_closed'],
  تسريحة: ['drawer_cabinet', 'side_table'],
  أدراج: ['drawer_cabinet'],

  // ── Lighting ──
  lamp: ['floor_lamp', 'lamp_table', 'vase_flowers'],
  floor_lamp: ['floor_lamp', 'lamp_table'],
  table_lamp: ['lamp_table', 'floor_lamp'],
  lamp_table: ['lamp_table', 'floor_lamp'],
  light: ['floor_lamp', 'lamp_table'],
  lighting: ['floor_lamp', 'lamp_table'],
  إضاءة: ['floor_lamp', 'lamp_table'],
  مصباح: ['floor_lamp', 'lamp_table'],
  أباجورة: ['lamp_table', 'floor_lamp'],
  مصباح_أرضي: ['floor_lamp', 'lamp_table'],
  أباجورة_طاولة: ['lamp_table', 'floor_lamp'],

  // ── Rugs ──
  rug: ['rug', 'rug_round'],
  carpet: ['rug', 'rug_round'],
  rug_woven: ['rug', 'rug_round'],
  rug_round: ['rug_round', 'rug'],
  round_rug: ['rug_round', 'rug'],
  سجاد: ['rug', 'rug_round'],
  سجادة: ['rug', 'rug_round'],
  موكيت: ['rug', 'rug_round'],
  سجادة_دائرية: ['rug_round', 'rug'],

  // ── Plants & Decor ──
  plant: ['plant', 'potted_plant', 'vase_flowers'],
  potted_plant: ['potted_plant', 'plant', 'vase_flowers'],
  indoor_plant: ['plant', 'potted_plant', 'vase_flowers'],
  vase: ['vase_flowers', 'plant', 'potted_plant'],
  vase_flowers: ['vase_flowers', 'plant', 'potted_plant'],
  flowers: ['vase_flowers', 'plant'],
  decor: ['vase_flowers', 'plant', 'potted_plant'],
  نبات: ['plant', 'potted_plant', 'vase_flowers'],
  نبتة: ['plant', 'potted_plant', 'vase_flowers'],
  زرع: ['plant', 'potted_plant', 'vase_flowers'],
  مزهرية: ['vase_flowers', 'plant'],
  فازة: ['vase_flowers', 'plant'],
  ديكور: ['vase_flowers', 'plant', 'potted_plant'],
};

const CATEGORY_HINTS: Record<string, IProductTemplate['category']> = {
  sofa: 'seating',
  couch: 'seating',
  chair: 'seating',
  armchair: 'seating',
  seating: 'seating',
  bed: 'seating',
  bench: 'seating',
  stool: 'seating',
  table: 'tables',
  desk: 'tables',
  shelf: 'storage',
  bookcase: 'storage',
  bookshelf: 'storage',
  cabinet: 'storage',
  drawer: 'storage',
  dresser: 'storage',
  wardrobe: 'storage',
  tv: 'storage',
  storage: 'storage',
  rug: 'rugs',
  carpet: 'rugs',
  lamp: 'lighting',
  light: 'lighting',
  lighting: 'lighting',
  vase: 'decor',
  plant: 'decor',
  decor: 'decor',

  // Arabic category hints
  كنب: 'seating',
  كنبة: 'seating',
  صوفا: 'seating',
  كرسي: 'seating',
  سرير: 'seating',
  مقعد: 'seating',
  بنش: 'seating',
  طاولة: 'tables',
  مكتب: 'tables',
  خزانة: 'storage',
  دولاب: 'storage',
  مكتبة: 'storage',
  أدراج: 'storage',
  تلفزيون: 'storage',
  سجاد: 'rugs',
  سجادة: 'rugs',
  إضاءة: 'lighting',
  مصباح: 'lighting',
  أباجورة: 'lighting',
  نبات: 'decor',
  نبتة: 'decor',
  مزهرية: 'decor',
  ديكور: 'decor',
};

function norm(value: string | undefined): string {
  return (value || '').trim().toLowerCase();
}

function extractTokens(value: string): string[] {
  return value
    .split(/[\s_-]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2);
}

export function resolveItem(
  item: AIResponseItem,
  catalogAssets: IProductTemplate[]
): Resolution {
  if (catalogAssets.length === 0) {
    return { kind: 'placeholder' };
  }

  const skuNorm = norm(item.economy?.sku);
  const assetIdNorm = norm(item.asset_id);

  // 1. Exact match on item.economy?.sku against catalog id / sku
  if (skuNorm) {
    const exactSku = catalogAssets.find(
      (a) => norm(a.id) === skuNorm || norm(a.sku) === skuNorm
    );
    if (exactSku) return { kind: 'catalog', asset: exactSku };
  }

  // 2. Exact match on item.asset_id against catalog id / sku
  if (assetIdNorm) {
    const exactId = catalogAssets.find(
      (a) => norm(a.id) === assetIdNorm || norm(a.sku) === assetIdNorm
    );
    if (exactId) return { kind: 'catalog', asset: exactId };
  }

  // 3. Canonical synonym lookup (full keys first, then tokens)
  const candidateKeys: string[] = [];
  if (assetIdNorm) candidateKeys.push(assetIdNorm);
  if (skuNorm) candidateKeys.push(skuNorm);
  const tokens = [
    ...extractTokens(assetIdNorm),
    ...extractTokens(skuNorm),
  ];
  for (const tok of tokens) {
    if (!candidateKeys.includes(tok)) candidateKeys.push(tok);
  }

  for (const key of candidateKeys) {
    const targets = CANONICAL_SYNONYMS[key];
    if (!targets) continue;
    for (const targetId of targets) {
      const matched = catalogAssets.find(
        (a) => norm(a.id) === targetId || norm(a.sku) === targetId
      );
      if (matched) return { kind: 'catalog', asset: matched };
    }
  }

  // Special handling for rug/carpet: match catalog rug if present
  if (candidateKeys.some((k) => k === 'rug' || k === 'carpet')) {
    const rugAsset = catalogAssets.find(
      (a) => a.category === 'rugs' || norm(a.id).includes('rug') || norm(a.name).includes('سجاد')
    );
    if (rugAsset) return { kind: 'catalog', asset: rugAsset };
  }

  // 4. Substring & category match on meaningful tokens (ignore short prefixes like "ik")
  const meaningfulTokens = tokens.filter((t) => t.length >= 3 && !/^\d+$/.test(t));
  for (const token of meaningfulTokens) {
    const bySubstring = catalogAssets.find(
      (a) =>
        a.modelUrl &&
        (norm(a.id).includes(token) ||
          norm(a.name).includes(token) ||
          norm(a.category).includes(token))
    );
    if (bySubstring) return { kind: 'catalog', asset: bySubstring };

    const hintedCategory = CATEGORY_HINTS[token];
    if (hintedCategory) {
      const byCategory = catalogAssets.find(
        (a) => a.category === hintedCategory && a.modelUrl
      );
      if (byCategory) return { kind: 'catalog', asset: byCategory };
    }
  }

  // 5. Fallback substitute so the scene is never empty
  const substitute = catalogAssets.find((a) => a.modelUrl);
  if (substitute) return { kind: 'substitute', asset: substitute };

  return { kind: 'placeholder' };
}

export function countMatches(resolved: ResolvedItem[]): {
  matchedCount: number;
  fallbackCount: number;
} {
  const matchedCount = resolved.filter((r) => r.resolution.kind === 'catalog').length;
  return { matchedCount, fallbackCount: resolved.length - matchedCount };
}

export function describeMatch(
  matchedCount: number,
  itemCount: number,
  fallbackCount: number
): PipelineStage {
  if (matchedCount === 0) {
    return {
      id: 'match',
      status: 'failed',
      note: `لم يُطابق أي أثاث من المكتبة (٠ من ${arabicNumber(itemCount)} قطع)`,
    };
  }

  const suffix = fallbackCount > 0 ? ` · ${arabicNumber(fallbackCount)} كبدائل مؤقتة` : '';
  return {
    id: 'match',
    status: 'done',
    note: `تمت مطابقة ${arabicNumber(matchedCount)} من ${arabicNumber(itemCount)} قطع مع الكتالوج الحقيقي${suffix}`,
  };
}

export function describeBuild(itemCount: number): PipelineStage {
  return {
    id: 'build',
    status: 'done',
    note: `تم بناء وتوزيع ${arabicNumber(itemCount)} قطعة في المشهد ثلاثي الأبعاد`,
  };
}

export function describeCost(totalCost: number, matchedCount: number): PipelineStage {
  if (totalCost > 0) {
    return {
      id: 'cost',
      status: 'done',
      note: `تم احتساب التكلفة التقديرية: ${arabicNumber(totalCost)} ر.س`,
    };
  }

  // Never report a silent success on a zero total — «٠ ر.س with no explanation»
  // was the original complaint.
  return {
    id: 'cost',
    status: 'failed',
    note:
      matchedCount === 0
        ? 'الأسعار غير متوفرة — لم تُطابق أي قطعة سعراً حقيقياً في المكتبة'
        : 'الأسعار غير متوفرة للقطع المطابقة في المكتبة',
  };
}
