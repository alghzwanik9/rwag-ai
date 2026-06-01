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
  assets: IProductTemplate[];
  isLoading: boolean;
  error: string | null;
  /** True when the data came from the API rather than the local fallback */
  fromApi: boolean;
}

/**
 * Fetches the furniture catalog from `GET /api/v1/assets`.
 * Automatically falls back to the static IKEA_TEMPLATES when the backend
 * is unavailable (e.g. during static preview or the API is starting up).
 */
export function useAssets(): UseAssetsResult {
  const [assets, setAssets] = useState<IProductTemplate[]>(IKEA_TEMPLATES);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fromApi, setFromApi] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchAssets() {
      try {
        const res = await fetch("/api/v1/assets");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data: { assets: CatalogAsset[]; total: number } = await res.json();

        if (!cancelled) {
          setAssets(data.assets.map(toProductTemplate));
          setFromApi(true);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          // Backend unreachable — silently fall back to local templates
          console.warn(
            "[useAssets] Could not reach /api/v1/assets, using local fallback:",
            err
          );
          setAssets(IKEA_TEMPLATES);
          setFromApi(false);
          setError(err instanceof Error ? err.message : "Unknown error");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchAssets();
    return () => { cancelled = true; };
  }, []);

  return { assets, isLoading, error, fromApi };
}
