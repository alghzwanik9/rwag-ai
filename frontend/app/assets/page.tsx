"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Box, Package, Plus, RotateCcw, Search } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  DEFAULT_FALLBACK_GLB,
  IKEA_TEMPLATES,
  type IProductTemplate,
} from "@/app/studio/config/catalogTemplates";
import { formatCurrency, useSceneStore, type SupportedCurrency } from "@/lib/useSceneStore";

type AssetCategoryFilter = "all" | IProductTemplate["category"];

const CATEGORY_META: Record<
  AssetCategoryFilter,
  { label: string; icon: string }
> = {
  all: { label: "الكل", icon: "apps" },
  seating: { label: "مقاعد", icon: "chair" },
  tables: { label: "طاولات", icon: "table_restaurant" },
  storage: { label: "تخزين", icon: "shelves" },
  lighting: { label: "إضاءة", icon: "light" },
  rugs: { label: "سجاد", icon: "texture" },
  decor: { label: "ديكور", icon: "potted_plant" },
};

const CATEGORY_ORDER: AssetCategoryFilter[] = [
  "all",
  "seating",
  "tables",
  "storage",
  "lighting",
  "rugs",
  "decor",
];

const VALID_CATEGORIES = new Set<IProductTemplate["category"]>([
  "seating",
  "tables",
  "lighting",
  "rugs",
  "storage",
  "decor",
]);

interface RawBackendAsset {
  id?: string | number;
  name?: string;
  title?: string;
  brand?: string;
  price?: number | string;
  currency?: string;
  category?: string;
  modelUrl?: string;
  model_url?: string;
  glb_url?: string;
  thumbnailUrl?: string;
  thumbnail_url?: string;
  image_url?: string;
  dimensions?: {
    width?: number;
    height?: number;
    depth?: number;
    length?: number;
  };
  store_url?: string;
  sku?: string;
}

function normalizeCategory(raw?: string): IProductTemplate["category"] {
  const lower = (raw || "").toLowerCase().trim();
  if (VALID_CATEGORIES.has(lower as IProductTemplate["category"])) {
    return lower as IProductTemplate["category"];
  }
  if (lower.includes("sofa") || lower.includes("chair") || lower.includes("seat")) return "seating";
  if (lower.includes("table") || lower.includes("desk")) return "tables";
  if (lower.includes("lamp") || lower.includes("light")) return "lighting";
  if (lower.includes("rug") || lower.includes("carpet")) return "rugs";
  if (lower.includes("shelf") || lower.includes("cabinet") || lower.includes("storage")) return "storage";
  return "decor";
}

function normalizeRemoteAsset(raw: RawBackendAsset, index: number): IProductTemplate | null {
  const name = (raw.name || raw.title || "").trim();
  if (!name) return null;

  const id = String(raw.id || `remote-asset-${index}`).trim();
  const parsedPrice = Number(raw.price);
  const price = Number.isFinite(parsedPrice) && parsedPrice >= 0 ? parsedPrice : 0;

  const rawDims = raw.dimensions || {};
  const normalizeDim = (val: unknown, fallback: number) => {
    const n = Number(val);
    if (!Number.isFinite(n) || n <= 0) return fallback;
    return n <= 20 ? Math.round(n * 1000) : Math.round(n);
  };

  const modelUrl = raw.modelUrl || raw.model_url || raw.glb_url || DEFAULT_FALLBACK_GLB;
  const thumbnailUrl = raw.thumbnailUrl || raw.thumbnail_url || raw.image_url || "";

  return {
    id,
    name,
    brand: (raw.brand || "Rwaq").trim(),
    price,
    currency: (raw.currency || "SAR").toUpperCase(),
    category: normalizeCategory(raw.category),
    modelUrl,
    dimensions: {
      width: normalizeDim(rawDims.width ?? rawDims.length, 1000),
      height: normalizeDim(rawDims.height, 800),
      depth: normalizeDim(rawDims.depth, 800),
    },
    thumbnailUrl,
    store_url: raw.store_url,
    sku: raw.sku,
  };
}

function isSafeNextImageUrl(url: string): boolean {
  if (!url) return false;
  if (url.startsWith("/")) return true;
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === "https:" &&
      (parsed.hostname === "images.unsplash.com" || parsed.hostname === "img.clerk.com")
    );
  } catch {
    return false;
  }
}

let instanceCounter = 0;

function createAssetInstanceId(assetId: string): string {
  instanceCounter += 1;
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${assetId}-${crypto.randomUUID()}`;
  }
  return `${assetId}-${Date.now()}-${instanceCounter}`;
}

function formatDimsCm(dims: IProductTemplate["dimensions"]): string {
  const w = Math.round(dims.width / 10);
  const d = Math.round(dims.depth / 10);
  const h = Math.round(dims.height / 10);
  return `${w}×${d}×${h} سم`;
}

export default function AssetsPage() {
  const router = useRouter();
  const [assets, setAssets] = useState<IProductTemplate[]>(IKEA_TEMPLATES);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<AssetCategoryFilter>("all");
  const [remoteCount, setRemoteCount] = useState<number>(0);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/v1/assets", { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error("Assets API unavailable");
        return res.json();
      })
      .then((data) => {
        const rawList: RawBackendAsset[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.items)
            ? data.items
            : Array.isArray(data?.assets)
              ? data.assets
              : [];

        if (rawList.length === 0) return;

        const existingIds = new Set(IKEA_TEMPLATES.map((t) => t.id));
        const extraAssets: IProductTemplate[] = [];

        rawList.forEach((raw, idx) => {
          const normalized = normalizeRemoteAsset(raw, idx);
          if (normalized && !existingIds.has(normalized.id)) {
            existingIds.add(normalized.id);
            extraAssets.push(normalized);
          }
        });

        if (extraAssets.length > 0) {
          setRemoteCount(extraAssets.length);
          setAssets([...IKEA_TEMPLATES, ...extraAssets]);
        }
      })
      .catch(() => {
        // Graceful offline fallback: IKEA_TEMPLATES are already loaded immediately.
      });

    return () => controller.abort();
  }, []);

  const categoryCounts = useMemo(() => {
    const counts: Record<AssetCategoryFilter, number> = {
      all: assets.length,
      seating: 0,
      tables: 0,
      storage: 0,
      lighting: 0,
      rugs: 0,
      decor: 0,
    };
    assets.forEach((asset) => {
      counts[asset.category] = (counts[asset.category] ?? 0) + 1;
    });
    return counts;
  }, [assets]);

  const filteredAssets = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return assets.filter((asset) => {
      if (selectedCategory !== "all" && asset.category !== selectedCategory) {
        return false;
      }
      if (!q) return true;
      const categoryLabelAr = CATEGORY_META[asset.category]?.label || "";
      return (
        asset.name.toLowerCase().includes(q) ||
        asset.id.toLowerCase().includes(q) ||
        asset.brand.toLowerCase().includes(q) ||
        asset.category.toLowerCase().includes(q) ||
        categoryLabelAr.includes(q)
      );
    });
  }, [assets, searchQuery, selectedCategory]);

  const handleAddToRoom = (asset: IProductTemplate) => {
    useSceneStore.getState().addSceneItem({
      ...asset,
      instanceId: createAssetInstanceId(asset.id),
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      modelUrl: asset.modelUrl || DEFAULT_FALLBACK_GLB,
      price: typeof asset.price === "number" ? asset.price : 0,
      dimensions: asset.dimensions || { width: 1000, height: 800, depth: 800 },
    });
    router.push("/studio");
  };

  return (
    <main className="fixed top-[64px] left-0 right-0 md:right-[280px] bottom-0 bg-surface overflow-y-auto" dir="rtl">
      <div className="p-4 sm:p-6 md:p-8">
        {/* Header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="font-headline-lg text-2xl sm:text-3xl font-bold text-on-surface flex items-center gap-3">
              <Package className="w-7 h-7 text-secondary shrink-0" />
              مكتبة الأصول
            </h2>
            <p className="text-on-surface-variant font-body-md text-sm sm:text-base mt-1">
              تصفح وأضف قطع الأثاث ثلاثية الأبعاد المعتمدة مباشرة إلى مساحتك في الاستوديو ({assets.length} قطعة
              {remoteCount > 0 ? ` · +${remoteCount} من الخادم` : ""}).
            </p>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث بالاسم، الفئة، أو المعرّف..."
              aria-label="البحث في مكتبة الأصول"
              className="w-full bg-surface-container-low border border-outline-variant rounded-full py-2.5 pr-11 pl-4 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary transition-all"
            />
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-1">
          {CATEGORY_ORDER.filter((cat) => cat === "all" || categoryCounts[cat] > 0).map((cat) => {
            const isActive = selectedCategory === cat;
            const meta = CATEGORY_META[cat];
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold border transition-all ${
                  isActive
                    ? "bg-secondary text-white border-secondary shadow-xs"
                    : "bg-surface-container-lowest text-on-surface-variant border-outline-variant hover:border-secondary/50 hover:text-on-surface"
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">{meta.icon}</span>
                <span>{meta.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                    isActive ? "bg-white/20 text-white" : "bg-surface-container text-on-surface-variant"
                  }`}
                >
                  {categoryCounts[cat]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Assets Grid */}
        {filteredAssets.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredAssets.map((asset) => {
              const categoryMeta = CATEGORY_META[asset.category];
              const safeImage = isSafeNextImageUrl(asset.thumbnailUrl);
              const displayCurrency = (asset.currency || "SAR") as SupportedCurrency;
              return (
                <div
                  key={asset.id}
                  className="bg-surface-container-lowest border border-outline-variant rounded-2xl overflow-hidden group hover:border-secondary/50 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="relative h-44 bg-linear-to-br from-surface-container-low via-surface-container to-secondary-container/40 overflow-hidden flex items-center justify-center">
                      {safeImage ? (
                        <Image
                          src={asset.thumbnailUrl}
                          alt={asset.name}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-on-surface-variant/70 group-hover:scale-105 transition-transform duration-300">
                          <span className="material-symbols-outlined text-5xl text-secondary/70 mb-2">
                            {categoryMeta.icon}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-on-surface-variant bg-surface/80 px-2.5 py-0.5 rounded-full border border-outline-variant/60">
                            <Box className="w-3 h-3 text-secondary" />
                            نموذج GLB 3D
                          </span>
                        </div>
                      )}
                      <div className="absolute top-2.5 right-2.5 bg-surface/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-bold text-on-surface border border-outline-variant">
                        {categoryMeta.label}
                      </div>
                      <div className="absolute top-2.5 left-2.5 bg-primary/85 text-on-primary px-2 py-0.5 rounded-full text-[10px] font-mono">
                        {asset.brand}
                      </div>
                    </div>

                    <div className="p-4 pb-2">
                      <h3 className="font-label-md font-bold text-on-surface mb-1">{asset.name}</h3>
                      <div className="flex items-center justify-between gap-2 text-xs mb-3">
                        <span className="text-secondary font-bold text-sm font-mono">
                          {formatCurrency(asset.price, displayCurrency)}
                        </span>
                        <span className="text-on-surface-variant font-mono text-[11px]">
                          {formatDimsCm(asset.dimensions)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 pt-2">
                    <button
                      type="button"
                      onClick={() => handleAddToRoom(asset)}
                      className="w-full bg-secondary-container text-on-secondary-container py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-secondary hover:text-white transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      إضافة للغرفة
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-surface-container-lowest border border-dashed border-outline-variant rounded-3xl">
            <Package className="w-10 h-10 text-outline mb-3" />
            <h3 className="font-bold text-on-surface mb-1">لا توجد أصول مطابقة لبحثك</h3>
            <p className="text-xs text-on-surface-variant mb-5">
              جرّب تغيير كلمات البحث أو إعادة تعيين الفئة المحددة.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-secondary text-white text-xs font-bold hover:bg-secondary/90 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              إعادة تعيين التصفية
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
