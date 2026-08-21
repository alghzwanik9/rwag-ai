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
export const PLACEHOLDER_MODEL_URL =
  "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/SheenChair/glTF-Binary/SheenChair.glb";

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

export function resolveItem(
  item: AIResponseItem,
  catalogAssets: IProductTemplate[]
): Resolution {
  const targetId = item.economy?.sku || item.asset_id;

  const exact = catalogAssets.find((a) => a.id === targetId);
  if (exact) return { kind: 'catalog', asset: exact };

  if (catalogAssets.length > 0) {
    const keyword = item.asset_id.toLowerCase().split('_')[0];
    const substitute =
      catalogAssets.find(
        (a) =>
          (a.category?.toLowerCase().includes(keyword) || a.name.toLowerCase().includes(keyword)) &&
          a.modelUrl
      ) || catalogAssets.find((a) => a.modelUrl);
    if (substitute) return { kind: 'substitute', asset: substitute };
  }

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
