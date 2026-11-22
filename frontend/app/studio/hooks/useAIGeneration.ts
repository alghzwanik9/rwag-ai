"use client";

import { useCallback, useMemo, useState } from "react";
import {
  useSceneStore,
  type CurtainStyle,
  type RoomWindow,
  type WindowSize,
  type WindowWall,
} from "@/lib/useSceneStore";
import type { IProductTemplate } from "@/app/studio/config/catalogTemplates";
import {
  arabicNumber,
  countMatches,
  describeBuild,
  describeCost,
  describeMatch,
  PLACEHOLDER_MODEL_URL,
  resolveItem,
  type ResolvedItem,
} from "@/app/studio/config/matching";
import {
  createPendingStages,
  normalizeDimensionsMm,
  withRemainingSkipped,
  withStage,
  type AIResponseWindow,
  type GenerateRoomResponse,
  type PipelineStage,
  type StageId,
  type StageStatus,
  type StudioRequest,
  type StudioUiState,
} from "@/app/studio/config/pipeline";

const HALT_NOTE = 'توقف بسبب فشل التحليل';

type FetchOutcome = { ok: true; data: GenerateRoomResponse } | { ok: false; reason: string };

/**
 * Lets React paint the stage transition we just committed before the next stage
 * starts. This is a render yield, NOT a synthetic delay: every status it exposes
 * reflects work that has actually finished. Without it React batches the whole
 * post-fetch run into one commit and the intermediate stages are never shown.
 */
function yieldToPaint(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => resolve());
    } else {
      resolve();
    }
  });
}

async function fetchRoomLayout(
  rawPrompt: string,
  image: string | null,
  styleReference: string | null | undefined
): Promise<FetchOutcome> {
  const finalPrompt = styleReference
    ? `[Style Reference: ${styleReference}] ${rawPrompt}`
    : rawPrompt;

  try {
    const res = await fetch("/api/generate-room", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: finalPrompt || "تصميم الغرفة الموجودة في الصورة",
        imageBase64: image,
      }),
    });

    if (res.status === 429) {
      return { ok: false, reason: 'تجاوزت الحد المسموح — انتظر دقيقة وأعد المحاولة' };
    }
    if (!res.ok) {
      return { ok: false, reason: `تعذّر تحليل الطلب — استجاب الخادم بالرمز ${res.status}` };
    }

    return { ok: true, data: (await res.json()) as GenerateRoomResponse };
  } catch {
    return { ok: false, reason: 'تعذّر الاتصال بالخادم — تحقق من تشغيله' };
  }
}

function normalizeAiWindows(rawWindows: AIResponseWindow[]): RoomWindow[] {
  return rawWindows.map((w, idx) => {
    const wall: WindowWall = w.wall === 'left' ? 'left' : 'back';
    const size: WindowSize = w.size === 'small' || w.size === 'large' ? w.size : 'medium';
    const curtain: CurtainStyle =
      w.curtain === 'none' || w.curtain === 'blackout' || w.curtain === 'draped'
        ? w.curtain
        : 'sheer';
    const positionOffset =
      typeof w.positionOffset === 'number' && Number.isFinite(w.positionOffset)
        ? Math.max(-1, Math.min(1, w.positionOffset))
        : 0;
    const height =
      typeof w.height === 'number' && Number.isFinite(w.height)
        ? Math.max(0.3, Math.min(1.0, w.height))
        : 0.55;

    return {
      id: w.id || `ai_win_${idx}_${Date.now()}`,
      wall,
      size,
      positionOffset,
      height,
      curtain,
      curtainColor: typeof w.curtainColor === 'string' && w.curtainColor ? w.curtainColor : '#f0ece4',
      isOpen: typeof w.isOpen === 'boolean' ? w.isOpen : true,
    };
  });
}

/** Writes the resolved items and room settings into the scene store. */
function applyToScene(resolved: ResolvedItem[], data: GenerateRoomResponse) {
  const store = useSceneStore.getState();
  store.clearScene();

  for (const { item, resolution } of resolved) {
    // The catalog normaliser hardcodes price: 0 (lib/useAssets.ts:40) because
    // prices live in the AI's `economy` block, not the asset catalog. Preferring
    // the economy price is what stops the cost card reading ٠ ر.س.
    const economyPrice = item.economy?.price ?? 0;
    const storeUrl =
      item.store_url ||
      item.economy?.store_url ||
      (resolution.kind !== 'placeholder' ? resolution.asset.store_url : undefined);

    if (resolution.kind === 'placeholder') {
      store.addSceneItem({
        instanceId: item.instance_id,
        id: item.economy?.sku || item.asset_id,
        name: item.asset_id.replace(/_/g, " "),
        brand: item.economy?.brand || "Rwaq AI",
        price: economyPrice,
        currency: item.economy?.currency || "SAR",
        category: "seating",
        modelUrl: PLACEHOLDER_MODEL_URL,
        thumbnailUrl: "",
        store_url: storeUrl,
        dimensions: normalizeDimensionsMm(item.dimensions),
        position: item.position || [0, 0, 0],
        rotation: item.rotation || [0, 0, 0],
      });
    } else {
      store.addSceneItem({
        ...resolution.asset,
        instanceId: item.instance_id,
        price: economyPrice || resolution.asset.price,
        currency: item.economy?.currency || resolution.asset.currency,
        store_url: storeUrl,
        dimensions: normalizeDimensionsMm(item.dimensions, resolution.asset.dimensions),
        position: item.position,
        rotation: item.rotation,
      });
    }
  }

  if (data.room_dimensions) {
    if (typeof data.room_dimensions.width === 'number' && Number.isFinite(data.room_dimensions.width)) {
      store.setRoomWidth(data.room_dimensions.width);
    }
    if (typeof data.room_dimensions.depth === 'number' && Number.isFinite(data.room_dimensions.depth)) {
      store.setRoomDepth(data.room_dimensions.depth);
    }
    if (typeof data.room_dimensions.height === 'number' && Number.isFinite(data.room_dimensions.height)) {
      store.setWallHeight(data.room_dimensions.height);
    }
  }
  if (data.ambient_mode === 'morning' || data.ambient_mode === 'rainy' || data.ambient_mode === 'midnight') {
    store.setAmbientMode(data.ambient_mode);
  }
  if (data.floor_color) store.setFloorColor(data.floor_color);
  if (data.wall_color) store.setWallColor(data.wall_color);
  if (Array.isArray(data.windows) && data.windows.length > 0) {
    store.setWindows(normalizeAiWindows(data.windows));
  }
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export interface UseAIGenerationOptions {
  showToast: (msg: string) => void;
  catalogAssets: IProductTemplate[];
  /** `?reference=` style hint, prepended to the prompt when present. */
  styleReference?: string | null;
  /** Called before items are written to the store (StudioClient clears the GLB room). */
  onBeforeBuild?: () => void;
  /** Called when a run finishes, with its final state, so the drawer can auto-open. */
  onSettled?: (state: StudioUiState) => void;
}

export interface UseAIGenerationResult {
  prompt: string;
  setPrompt: (value: string) => void;
  imageBase64: string | null;
  setImageBase64: (value: string | null) => void;
  isLoading: boolean;
  requests: StudioRequest[];
  uiState: StudioUiState;
  handleGenerate: () => Promise<void>;
  handleRetry: (request: StudioRequest) => Promise<void>;
  clearRequests: () => void;
}

export function useAIGeneration({
  showToast,
  catalogAssets,
  styleReference,
  onBeforeBuild,
  onSettled,
}: UseAIGenerationOptions): UseAIGenerationResult {
  const [prompt, setPrompt] = useState("");
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [requests, setRequests] = useState<StudioRequest[]>([]);

  const patch = useCallback((id: string, apply: (r: StudioRequest) => StudioRequest) => {
    setRequests((prev) => prev.map((r) => (r.id === id ? apply(r) : r)));
  }, []);

  const setStage = useCallback(
    (id: string, stageId: StageId, status: StageStatus, note?: string) => {
      patch(id, (r) => ({ ...r, stages: withStage(r.stages, stageId, status, note) }));
    },
    [patch]
  );

  const applyStage = useCallback(
    (id: string, stage: PipelineStage) => setStage(id, stage.id, stage.status, stage.note),
    [setStage]
  );

  /** Halts the run at `stageId`, skipping everything after it. */
  const failAt = useCallback(
    (id: string, stageId: StageId, reason: string) => {
      patch(id, (r) => ({
        ...r,
        state: 'failed',
        failureReason: reason,
        stages: withRemainingSkipped(
          withStage(r.stages, stageId, 'failed', reason),
          stageId,
          HALT_NOTE
        ),
      }));
      showToast(`❌ ${reason}`);
      setIsLoading(false);
    },
    [patch, showToast]
  );

  const run = useCallback(
    async (rawPrompt: string, image: string | null) => {
      const id = crypto.randomUUID();

      setRequests((prev) => [
        ...prev,
        {
          id,
          prompt: rawPrompt,
          imagePreview: image,
          createdAt: Date.now(),
          state: 'generating',
          stages: createPendingStages(),
          itemCount: 0,
          matchedCount: 0,
          fallbackCount: 0,
          totalCost: 0,
          currency: 'SAR',
        },
      ]);
      setIsLoading(true);

      // ── Stage 1: analyze ──────────────────────────────────────────────
      // Wraps the entire opaque backend call: the pipeline reports no
      // intermediate progress, so this is the finest honest granularity.
      setStage(id, 'analyze', 'running');

      const outcome = await fetchRoomLayout(rawPrompt, image, styleReference);
      if (!outcome.ok) {
        failAt(id, 'analyze', outcome.reason);
        return;
      }

      const items = outcome.data.items ?? [];
      if (items.length === 0) {
        failAt(id, 'analyze', 'تعذّر تحليل الطلب — لم يُرجع النموذج أي قطع أثاث');
        return;
      }

      setStage(id, 'analyze', 'done', 'تم تحليل المساحة والأسلوب المطلوب');
      await yieldToPaint();

      // ── Stage 2: match ────────────────────────────────────────────────
      setStage(id, 'match', 'running');
      await yieldToPaint();

      const resolved: ResolvedItem[] = items.map((item) => ({
        item,
        resolution: resolveItem(item, catalogAssets),
      }));
      const { matchedCount, fallbackCount } = countMatches(resolved);

      applyStage(id, describeMatch(matchedCount, items.length, fallbackCount));
      patch(id, (r) => ({ ...r, itemCount: items.length, matchedCount, fallbackCount }));
      await yieldToPaint();

      // ── Stage 3: build ────────────────────────────────────────────────
      setStage(id, 'build', 'running');
      await yieldToPaint();

      onBeforeBuild?.();
      applyToScene(resolved, outcome.data);

      applyStage(id, describeBuild(items.length));
      await yieldToPaint();

      // ── Stage 4: cost ─────────────────────────────────────────────────
      setStage(id, 'cost', 'running');
      await yieldToPaint();

      // Read the store's own total so this card and the drawer's cost card can
      // never disagree. Items in a non-primary currency are excluded there.
      const settled = useSceneStore.getState();
      const totalCost = settled.currentTotalCost();
      const currency = settled.primaryCurrency;

      applyStage(id, describeCost(totalCost, matchedCount));

      const finalState: StudioUiState = matchedCount === items.length ? 'success' : 'partial';
      patch(id, (r) => ({ ...r, state: finalState, totalCost, currency }));

      showToast(
        finalState === 'success'
          ? '✅ اكتمل توليد الغرفة بالذكاء الاصطناعي'
          : `⚠️ تم بناء الفراغ — ${arabicNumber(matchedCount)} من ${arabicNumber(items.length)} قطع مطابقة للمكتبة`
      );

      setIsLoading(false);
      onSettled?.(finalState);
    },
    [
      applyStage,
      catalogAssets,
      failAt,
      onBeforeBuild,
      onSettled,
      patch,
      setStage,
      showToast,
      styleReference,
    ]
  );

  const handleGenerate = useCallback(async () => {
    if (isLoading) return;
    if (!prompt.trim() && !imageBase64) return;

    const submittedPrompt = prompt;
    const submittedImage = imageBase64;
    setPrompt("");
    setImageBase64(null);

    await run(submittedPrompt, submittedImage);
  }, [imageBase64, isLoading, prompt, run]);

  const handleRetry = useCallback(
    async (request: StudioRequest) => {
      if (isLoading) return;
      await run(request.prompt, request.imagePreview ?? null);
    },
    [isLoading, run]
  );

  const clearRequests = useCallback(() => setRequests([]), []);

  const uiState: StudioUiState = useMemo(() => {
    if (isLoading) return 'generating';
    const last = requests[requests.length - 1];
    return last ? last.state : 'idle';
  }, [isLoading, requests]);

  return {
    prompt,
    setPrompt,
    imageBase64,
    setImageBase64,
    isLoading,
    requests,
    uiState,
    handleGenerate,
    handleRetry,
    clearRequests,
  };
}
