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
  sofa: ['sofa', 'kivik_sofa', 'sofa_khronos'],
  couch: ['sofa', 'kivik_sofa', 'sofa_khronos'],
  kivik: ['kivik_sofa', 'sofa'],
  kivik_sofa: ['kivik_sofa', 'sofa'],
  sectional: ['sofa', 'kivik_sofa'],
  loveseat: ['sofa', 'kivik_sofa'],

  coffee_table: ['coffee_table', 'lack_table', 'coffee_table_art'],
  table: ['coffee_table', 'lack_table', 'coffee_table_art', 'outdoor_set'],
  lack: ['lack_table', 'coffee_table'],
  lack_table: ['lack_table', 'coffee_table'],
  coffee_table_art: ['coffee_table_art', 'coffee_table'],
  coffee_table_round: ['coffee_table', 'coffee_table_art'],
  side_table: ['coffee_table', 'lack_table', 'coffee_table_art'],
  end_table: ['coffee_table', 'lack_table'],
  desk: ['desk', 'coffee_table_art', 'coffee_table'],
  office_desk: ['desk', 'coffee_table_art'],

  bed: ['bed', 'sofa'],
  double_bed: ['bed', 'sofa'],
  king_bed: ['bed', 'sofa'],
  queen_bed: ['bed', 'sofa'],

  armchair: ['armchair', 'strandmon_chair'],
  chair: ['armchair', 'strandmon_chair', 'dining_chair', 'deck_chair'],
  strandmon: ['strandmon_chair', 'armchair'],
  strandmon_chair: ['strandmon_chair', 'armchair'],
  accent_chair: ['armchair', 'strandmon_chair'],
  lounge_chair: ['armchair', 'deck_chair'],

  bookshelf: ['bookshelf', 'display_shelf'],
  bookcase: ['bookshelf', 'display_shelf'],
  shelf: ['bookshelf', 'display_shelf'],
  display_shelf: ['display_shelf', 'bookshelf'],
  synthetic_shelf: ['bookshelf', 'display_shelf'],
  shelving: ['bookshelf', 'display_shelf'],

  tv_unit: ['tv_unit', 'drawer_cabinet'],
  tv_stand: ['tv_unit', 'drawer_cabinet'],
  tv: ['tv_unit', 'drawer_cabinet'],
  media_console: ['tv_unit', 'drawer_cabinet'],
  cabinet: ['drawer_cabinet', 'tv_unit'],
  drawer_cabinet: ['drawer_cabinet', 'tv_unit'],
  drawer: ['drawer_cabinet', 'tv_unit'],
  wardrobe: ['drawer_cabinet', 'tv_unit'],
  sideboard: ['drawer_cabinet', 'tv_unit'],

  dining_chair: ['dining_chair', 'armchair'],
  stool: ['dining_chair', 'armchair'],
  deck_chair: ['deck_chair', 'armchair'],
  outdoor_set: ['outdoor_set', 'coffee_table'],
  garden_set: ['outdoor_set'],
  patio_set: ['outdoor_set'],

  plant: ['plant', 'vase_flowers'],
  potted_plant: ['plant', 'vase_flowers'],
  indoor_plant: ['plant', 'vase_flowers'],
  vase: ['vase_flowers', 'plant'],
  vase_flowers: ['vase_flowers', 'plant'],
  flowers: ['vase_flowers', 'plant'],
  decor: ['vase_flowers', 'plant'],
  lamp: ['floor_lamp', 'vase_flowers'],
  floor_lamp: ['floor_lamp', 'vase_flowers'],
  table_lamp: ['floor_lamp', 'vase_flowers'],
  rug: ['rug'],
  carpet: ['rug'],
  rug_woven: ['rug'],
};

const CATEGORY_HINTS: Record<string, IProductTemplate['category']> = {
  sofa: 'seating',
  couch: 'seating',
  chair: 'seating',
  armchair: 'seating',
  seating: 'seating',
  table: 'tables',
  desk: 'tables',
  shelf: 'storage',
  bookcase: 'storage',
  bookshelf: 'storage',
  cabinet: 'storage',
  drawer: 'storage',
  tv: 'storage',
  storage: 'storage',
  rug: 'rugs',
  carpet: 'rugs',
  lamp: 'lighting',
  light: 'lighting',
  vase: 'decor',
  plant: 'decor',
  decor: 'decor',
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
