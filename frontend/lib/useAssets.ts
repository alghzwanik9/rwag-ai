"use client";

import { useState, useEffect } from "react";
import { IKEA_TEMPLATES, IProductTemplate } from "@/app/studio/config/catalogTemplates";

// ── Types mirroring the FastAPI schema ────────────────────────────────────────

export interface AssetDimensions {
  width: number;   // mm
  height: number;  // mm
  depth: number;   // mm
}

export interface CatalogAsset {
  asset_id: string;
  name: string;
  category: string;
  source: string;
  model_url: string;
  model_3d_url?: string;
  image_url?: string;
  thumbnail_url: string;
  dimensions: AssetDimensions;
  default_scale: [number, number, number];
}

// ── Normalisation helper ───────────────────────────────────────────────────────

/**
 * Maps a raw API CatalogAsset to the IProductTemplate shape used throughout
 * the studio page so the rest of the UI doesn't need a dual type.
 */
const FALLBACK_MODEL_URL = "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/SheenChair/glTF-Binary/SheenChair.glb";

function toProductTemplate(a: CatalogAsset): IProductTemplate {
  return {
    id: a.asset_id,
    name: a.name,
    brand: a.source,
    price: 0,          // Price comes from economy data, not the asset catalog
    currency: "SAR",
    category: (["seating", "tables", "lighting", "rugs"].includes(a.category)
      ? a.category
      : "seating") as IProductTemplate["category"],
    modelUrl: a.model_url || a.model_3d_url || FALLBACK_MODEL_URL,
    dimensions: a.dimensions,
    thumbnailUrl: a.thumbnail_url || a.image_url || "",
  };
}

// ── Hook ──────────────────────────────────────────────────────────────────────

interface UseAssetsResult {
  /** Empty when the backend is unreachable, unless demo data is opted into. */
  assets: IProductTemplate[];
  isLoading: boolean;
  /** Non-null means the catalog could not be loaded. Callers must surface it. */
  error: string | null;
  /** True when the data came from the API rather than the local demo set. */
  fromApi: boolean;
  /** True when `assets` holds the bundled demo catalog, not real backend data. */
  isDemoData: boolean;
}

/**
 * Opt-in switch for the bundled demo catalog.
 *
 * Set `NEXT_PUBLIC_USE_DEMO_CATALOG=true`, or append `?demo=1` to the URL, to
 * substitute `IKEA_TEMPLATES` when the backend cannot be reached. Both routes
 * are deliberately explicit: this hook used to fall back to those templates on
 * *any* failure, which meant the studio looked fully populated while nothing
 * behind it was running. A backend outage must be visible, not papered over.
 */
function demoCatalogRequested(): boolean {
  if (process.env.NEXT_PUBLIC_USE_DEMO_CATALOG === "true") return true;
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("demo") === "1";
}

/**
 * Fetches the furniture catalog from `GET /api/v1/assets`.
 *
 * On failure it reports the error and returns an empty catalog. It does NOT
 * substitute local templates unless demo data is explicitly requested — see
 * `demoCatalogRequested`.
 */
export function useAssets(): UseAssetsResult {
  const [assets, setAssets] = useState<IProductTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fromApi, setFromApi] = useState(false);
  const [isDemoData, setIsDemoData] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchAssets() {
      try {
        const res = await fetch("/api/v1/assets");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data: { assets: CatalogAsset[]; total: number } = await res.json();
        if (!Array.isArray(data?.assets)) {
          throw new Error("Invalid API response: missing 'assets' array");
        }

        if (cancelled) return;
        setAssets(data.assets.map(toProductTemplate));
        setFromApi(true);
        setIsDemoData(false);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        console.error(
          "[useAssets] GET /api/v1/assets failed — the backend is unreachable:",
          err,
        );
        const message = err instanceof Error ? err.message : "Unknown error";
        setFromApi(false);
        setError(`تعذّر تحميل الكتالوج من الخادم (${message})`);

        // No silent substitute: without an explicit demo opt-in the catalog
        // stays empty, and that emptiness plus `error` is what makes the
        // outage visible in the UI.
        const useDemo = demoCatalogRequested();
        setAssets(useDemo ? IKEA_TEMPLATES : []);
        setIsDemoData(useDemo);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchAssets();
    return () => { cancelled = true; };
  }, []);

  return { assets, isLoading, error, fromApi, isDemoData };
}
