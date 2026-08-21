/**
 * Local catalog reader — the single source of furniture for the editor.
 *
 * Pure and synchronous: no fetch, no backend. `lib/useAssets.ts` remains the
 * future backend path and is deliberately not used here.
 */

import { IKEA_TEMPLATES, IProductTemplate } from '@/app/studio/config/catalogTemplates';

/** Built once — keeps the store's cost selector O(n) rather than O(n²). */
const BY_ID = new Map<string, IProductTemplate>(IKEA_TEMPLATES.map((t) => [t.id, t]));

export function getCatalog(): IProductTemplate[] {
  return IKEA_TEMPLATES;
}

export function getTemplate(id: string): IProductTemplate | undefined {
  return BY_ID.get(id);
}

export function getCatalogByCategory(): Record<string, IProductTemplate[]> {
  const grouped: Record<string, IProductTemplate[]> = {};
  for (const template of IKEA_TEMPLATES) {
    (grouped[template.category] ??= []).push(template);
  }
  return grouped;
}

/**
 * The only millimetre → metre conversion in the codebase. Catalog dimensions
 * are millimetres; everything in the scene is metres. Add conversions nowhere
 * else.
 */
export function getFootprintMeters(template: IProductTemplate): { width: number; depth: number } {
  return {
    width: template.dimensions.width / 1000,
    depth: template.dimensions.depth / 1000,
  };
}
