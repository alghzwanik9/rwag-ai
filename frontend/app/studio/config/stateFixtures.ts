/**
 * Dev-only fixtures behind ?state=<StudioUiState>. Kept in their own module so
 * nothing in the production render path imports them.
 */

import type { StudioRequest, StudioUiState } from './pipeline';

// ── Fixtures ───────────────────────────────────────────────────
// Reachable via ?state=<StudioUiState> outside production. The `partial` case in
// particular must be reviewable without a working backend.

const FIXTURE_TS = 1_760_000_000_000;

const FIXTURE_PROMPTS: Record<Exclude<StudioUiState, 'idle'>, string> = {
  generating: 'غرفة جلوس مودرن ٥×٤ متر بميزانية ١٥٬٠٠٠ ريال',
  partial: 'مجلس عربي بطراز نجدي معاصر',
  success: 'غرفة نوم رئيسية بإضاءة دافئة',
  failed: 'مطبخ مفتوح على غرفة الطعام',
};

export function fixtureRequest(state: Exclude<StudioUiState, 'idle'>): StudioRequest {
  const base = {
    id: `fixture-${state}`,
    prompt: FIXTURE_PROMPTS[state],
    createdAt: FIXTURE_TS,
    currency: 'SAR',
  };

  switch (state) {
    case 'generating':
      return {
        ...base,
        state,
        stages: [
          { id: 'analyze', status: 'done', note: 'تم تحليل المساحة والأسلوب المطلوب' },
          { id: 'match', status: 'running' },
          { id: 'build', status: 'pending' },
          { id: 'cost', status: 'pending' },
        ],
        itemCount: 6,
        matchedCount: 0,
        fallbackCount: 0,
        totalCost: 0,
      };

    case 'partial':
      return {
        ...base,
        state,
        stages: [
          { id: 'analyze', status: 'done', note: 'تم تحليل المساحة والأسلوب المطلوب' },
          {
            id: 'match',
            status: 'failed',
            note: 'لم يُطابق أي أثاث من المكتبة (٠ من ٥ قطع)',
          },
          { id: 'build', status: 'done', note: 'تم بناء الفراغ و٥ قطع بديلة مؤقتة' },
          {
            id: 'cost',
            status: 'failed',
            note: 'الأسعار غير متوفرة — لم تُطابق أي قطعة سعراً حقيقياً في المكتبة',
          },
        ],
        itemCount: 5,
        matchedCount: 0,
        fallbackCount: 5,
        totalCost: 0,
      };

    case 'success':
      return {
        ...base,
        state,
        stages: [
          { id: 'analyze', status: 'done', note: 'تم تحليل المساحة والأسلوب المطلوب' },
          { id: 'match', status: 'done', note: 'تمت مطابقة ٤ من ٤ قطع مع الكتالوج الحقيقي' },
          { id: 'build', status: 'done', note: 'تم بناء وتوزيع ٤ قطع في المشهد ثلاثي الأبعاد' },
          { id: 'cost', status: 'done', note: 'تم احتساب التكلفة التقديرية' },
        ],
        itemCount: 4,
        matchedCount: 4,
        fallbackCount: 0,
        totalCost: 8450,
      };

    case 'failed':
      return {
        ...base,
        state,
        stages: [
          { id: 'analyze', status: 'failed', note: 'تجاوزت الحد المسموح — انتظر دقيقة وأعد المحاولة' },
          { id: 'match', status: 'skipped', note: 'توقف بسبب فشل التحليل' },
          { id: 'build', status: 'skipped', note: 'توقف بسبب فشل التحليل' },
          { id: 'cost', status: 'skipped', note: 'توقف بسبب فشل التحليل' },
        ],
        itemCount: 0,
        matchedCount: 0,
        fallbackCount: 0,
        totalCost: 0,
        failureReason: 'تجاوزت الحد المسموح — انتظر دقيقة وأعد المحاولة',
      };
  }
}

const UI_STATES: readonly StudioUiState[] = ['idle', 'generating', 'partial', 'success', 'failed'];

export function isStudioUiState(value: string | null): value is StudioUiState {
  return value !== null && UI_STATES.includes(value as StudioUiState);
}
