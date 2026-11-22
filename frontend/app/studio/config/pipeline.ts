/**
 * Shape of a generation request as the conversation column sees it.
 *
 * IMPORTANT: the backend emits no per-stage telemetry. `ai_agent.py` sets
 * `payload["stage"] = 1` but `routes.py` strips it from the response, and
 * `POST /api/generate-room` is a single blocking call with no SSE or polling.
 * So `analyze` wraps the whole opaque backend call, while `match`, `build` and
 * `cost` are driven by client-side transitions we can genuinely observe.
 * Nothing here is on a timer.
 */

/**
 * One furniture item as `POST /api/generate-room` returns it
 * (see backend/app/api/routes.py::generate_room).
 */
export interface RawDimensionsInput {
  length?: number;
  width?: number;
  height?: number;
  depth?: number;
}

export interface NormalizedDimensionsMm {
  width: number;
  height: number;
  depth: number;
}

/**
 * Normalizes furniture dimensions to canonical millimeters `{ width, height, depth }`.
 *
 * Handles both:
 * 1. Raw backend `ai_agent.py` format `{ length, width, height }` where
 *    `length` is X (`width`), `height` is Y (`height`), `width` is Z (`depth`).
 * 2. Catalog `{ width, height, depth }` format.
 *
 * If the largest positive axis is `<= 20`, values are treated as meters and
 * multiplied by `1000` (rounded). Missing, zero, or invalid axes fall back
 * per-axis to `fallback` (in millimeters).
 */
export function normalizeDimensionsMm(
  raw: unknown,
  fallback: NormalizedDimensionsMm = { width: 1000, height: 1000, depth: 1000 }
): NormalizedDimensionsMm {
  const toPositive = (val: unknown): number => {
    if (typeof val === 'number') {
      return Number.isFinite(val) && val > 0 ? val : 0;
    }
    if (typeof val === 'string' && val.trim() !== '') {
      const parsed = Number.parseFloat(val);
      return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
    }
    return 0;
  };

  if (!raw || typeof raw !== 'object') {
    return { ...fallback };
  }

  const d = raw as Record<string, unknown>;
  let rawW: number;
  let rawH: number;
  let rawD: number;

  if ('length' in d && d.length !== undefined && d.length !== null) {
    rawW = toPositive(d.length);
    rawH = toPositive(d.height);
    rawD = toPositive(d.width !== undefined && d.width !== null ? d.width : d.depth);
  } else {
    rawW = toPositive(d.width);
    rawH = toPositive(d.height);
    rawD = toPositive(d.depth);
  }

  const positiveAxes = [rawW, rawH, rawD].filter((v) => v > 0);
  const scale = positiveAxes.length > 0 && Math.max(...positiveAxes) <= 20 ? 1000 : 1;

  return {
    width: rawW > 0 ? Math.round(rawW * scale) : fallback.width,
    height: rawH > 0 ? Math.round(rawH * scale) : fallback.height,
    depth: rawD > 0 ? Math.round(rawD * scale) : fallback.depth,
  };
}

export interface AIResponseWindow {
  id?: string;
  wall?: 'back' | 'left' | string;
  size?: 'small' | 'medium' | 'large' | string;
  positionOffset?: number;
  height?: number;
  curtain?: 'none' | 'sheer' | 'blackout' | 'draped' | string;
  curtainColor?: string;
  isOpen?: boolean;
  position?: [number, number, number];
  width?: number;
  height_m?: number;
}

export interface AIResponseItem {
  instance_id: string;
  asset_id: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  dimensions?: RawDimensionsInput;
  store_url?: string;
  economy?: {
    sku?: string;
    brand?: string;
    price?: number;
    currency?: string;
    store_url?: string;
  };
}

export interface GenerateRoomResponse {
  items?: AIResponseItem[];
  windows?: AIResponseWindow[];
  room_dimensions?: { width: number; depth: number; height?: number };
  ambient_mode?: 'morning' | 'rainy' | 'midnight';
  floor_color?: string;
  wall_color?: string;
}

export type StageId = 'analyze' | 'match' | 'build' | 'cost';

export type StageStatus = 'pending' | 'running' | 'done' | 'failed' | 'skipped';

export type StudioUiState = 'idle' | 'generating' | 'partial' | 'success' | 'failed';

export interface PipelineStage {
  id: StageId;
  status: StageStatus;
  /**
   * One-line Arabic reason. Required whenever status is `failed` or `skipped` —
   * a stage that did not run must say why rather than showing a silent dot.
   */
  note?: string;
}

export interface StudioRequest {
  id: string;
  prompt: string;
  /** Data URL of an attached reference image, if any. */
  imagePreview?: string | null;
  createdAt: number;
  state: StudioUiState;
  stages: PipelineStage[];
  /** Items the AI returned. */
  itemCount: number;
  /** Items matched to a real catalog product by id/SKU. */
  matchedCount: number;
  /** Items that fell back to a substitute or placeholder model. */
  fallbackCount: number;
  totalCost: number;
  currency: string;
  failureReason?: string;
}

export const STAGE_ORDER: readonly StageId[] = ['analyze', 'match', 'build', 'cost'];

export const STAGE_LABELS: Record<StageId, string> = {
  analyze: 'تحليل الطلب',
  match: 'مطابقة الأثاث',
  build: 'بناء المشهد',
  cost: 'حساب التكلفة',
};

/** Shown in the `idle` state so a first-time user has somewhere to start. */
export const EXAMPLE_PROMPTS: readonly string[] = [
  'غرفة جلوس مودرن ٥×٤ متر بميزانية ١٥٬٠٠٠ ريال',
  'غرفة نوم رئيسية بطراز عربي معاصر وإضاءة دافئة',
  'مكتب منزلي صغير مع رفوف تخزين ونافذة جانبية',
];

export function createPendingStages(): PipelineStage[] {
  return STAGE_ORDER.map((id) => ({ id, status: 'pending' as StageStatus }));
}

/** Returns a new stage array with one stage's status/note replaced. */
export function withStage(
  stages: PipelineStage[],
  id: StageId,
  status: StageStatus,
  note?: string
): PipelineStage[] {
  return stages.map((stage) => (stage.id === id ? { id, status, note } : stage));
}

/**
 * Marks every stage after `afterId` as skipped with a shared reason, so a halted
 * pipeline never leaves silent pending dots behind.
 */
export function withRemainingSkipped(
  stages: PipelineStage[],
  afterId: StageId,
  note: string
): PipelineStage[] {
  const cutoff = STAGE_ORDER.indexOf(afterId);
  return stages.map((stage, index) =>
    index > cutoff ? { id: stage.id, status: 'skipped' as StageStatus, note } : stage
  );
}
