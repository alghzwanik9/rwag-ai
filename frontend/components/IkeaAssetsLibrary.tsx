"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { IProductTemplate } from '@/app/studio/config/catalogTemplates';
import { SceneItem } from '@/lib/useSceneStore';

interface IkeaAssetsLibraryProps {
  onClose: () => void;
  addSceneItem: (item: Omit<SceneItem, 'addedAt' | 'position' | 'rotation'> & { position?: [number, number, number], rotation?: [number, number, number] }) => void;
  isAssetsLoading: boolean;
  catalogAssets: IProductTemplate[];
}

export interface RawAsset {
  id: string;
  name?: string;
  brand?: string;
  category?: string;
  dimensions?: { width: number | string; height: number | string; depth: number | string; };
  model_url?: string;
  model_3d_url?: string;
  modelUrl?: string;
  price?: number | string;
  currency?: string;
  thumbnail_url?: string;
  thumbnailUrl?: string;
  image_url?: string;
  short_description?: string;
}

export function IkeaAssetsLibrary({ onClose, addSceneItem }: IkeaAssetsLibraryProps) {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [realAssets, setRealAssets] = useState<RawAsset[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const DEFAULT_MODEL_URL = "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/SheenChair/glTF-Binary/SheenChair.glb";

  React.useEffect(() => {
    const fetchCatalog = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await fetch('/api/furniture');
        if (res.ok) {
          const data = await res.json();
          setRealAssets(Array.isArray(data?.items) ? data.items : []);
        } else {
          console.error("Failed to fetch IKEA catalog");
          setError("فشل في جلب الكتالوج. يرجى المحاولة مرة أخرى.");
          setRealAssets([]);
        }
      } catch (err) {
        console.error("Error fetching catalog:", err);
        setError("حدث خطأ أثناء الاتصال بالخادم.");
        setRealAssets([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCatalog();
  }, []);

  // Dynamic categories from data
  const categoryTranslations: Record<string, string> = {
    'bar furniture': 'أثاث البار',
    'beds': 'أسرة',
    'bookcases & shelving units': 'مكتبات ورفوف',
    'cabinets & cupboards': 'خزائن',
    'café furniture': 'أثاث المقاهي',
    'caf furniture': 'أثاث المقاهي',
    'chairs': 'كراسي',
    'chests of drawers & drawer units': 'أدراج',
    "children's furniture": 'أثاث أطفال',
    'nursery furniture': 'أثاث الرضع',
    'outdoor furniture': 'أثاث خارجي',
    'room dividers': 'فواصل غرف',
    'sideboards, buffets & console tables': 'بوفيهات وكونسول',
    'sofas & armchairs': 'كنب وكراسي بذراعين',
    'tables & desks': 'طاولات ومكاتب',
    'trolleys': 'عربات',
    'tv & media furniture': 'طاولات التلفزيون',
    'wardrobes': 'دواليب ملابس'
  };

  const categories = ['all', ...Array.from(new Set((Array.isArray(realAssets) ? realAssets : []).map(item => (item?.category || "").toLowerCase()))).filter(Boolean)];

  const getPlaceholderImage = (category: string) => {
    const cat = (category || "").toLowerCase();
    if (cat.includes("sofa") || cat.includes("seating") || cat.includes("chair") || cat.includes("armchair")) {
      return "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80";
    }
    if (cat.includes("table") || cat.includes("desk") || cat.includes("dining")) {
      return "https://images.unsplash.com/photo-1577140917170-285929fb55b7?auto=format&fit=crop&w=800&q=80";
    }
    if (cat.includes("bed") || cat.includes("bedroom")) {
      return "https://images.unsplash.com/photo-1505693314120-0d443867891c?auto=format&fit=crop&w=800&q=80";
    }
    if (cat.includes("storage") || cat.includes("cabinet") || cat.includes("wardrobe") || cat.includes("drawer")) {
      return "https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=800&q=80";
    }
    return "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=800&q=80";
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-stack-lg pb-4 pt-4">
        <div className="relative flex items-center">
          <span className="material-symbols-outlined absolute right-4 text-on-surface-variant">search</span>
          <input className="w-full bg-surface-container-low border border-outline-variant rounded-full py-2.5 pr-12 pl-4 font-body-md text-on-surface placeholder-on-surface-variant focus:outline-none focus:ring-2 focus:ring-secondary/20" placeholder="ابحث عن الأثاث، الماركة، أو اللون..." type="text" />
        </div>
      </div>
      <div className="flex border-b border-outline-variant bg-surface-container-low px-stack-lg overflow-x-auto hide-scrollbar shrink-0">
        {categories.map((cat) => (
          <button 
            key={cat}
            onClick={() => setActiveCategory(cat)} 
            className={`px-6 py-4 font-label-md whitespace-nowrap ${activeCategory === cat ? "border-b-2 border-secondary text-secondary" : "text-on-surface-variant hover:text-on-surface"}`}
          >
            {cat === 'all' ? 'الكل' : categoryTranslations[cat] || cat}
          </button>
        ))}
      </div>
      <div className="grow overflow-y-auto p-stack-lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {isLoading && (
            <div className="col-span-full flex items-center justify-center py-8 text-on-surface-variant">
              <span className="material-symbols-outlined animate-spin mr-2">autorenew</span>
              <span className="font-body-md">جاري تحميل الكتالوج...</span>
            </div>
          )}
          {!isLoading && error && (
            <div className="col-span-full flex flex-col items-center justify-center py-8 text-red-500">
              <span className="material-symbols-outlined text-4xl mb-2">error_outline</span>
              <span className="font-body-md">{error}</span>
            </div>
          )}
          {!isLoading && !error && (Array.isArray(realAssets) ? realAssets : []).filter(item => {
            const cat = (item?.category || "").toLowerCase();
            if (activeCategory === "all") return true;
            return cat === activeCategory;
          }).map((item, index) => {
            const safeId = item?.id || `fallback-id-${index}`;
            
            return (
              <div key={safeId} className="group bg-white border border-outline-variant rounded-lg overflow-hidden hover:shadow-md transition-all flex flex-col">
                <div className="relative aspect-video bg-surface-container flex items-center justify-center overflow-hidden">
                  <Image 
                    src={item.thumbnail_url || getPlaceholderImage(item.category || "")} 
                    alt={(item?.name as string) || "Product"} 
                    width={400}
                    height={300}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      e.currentTarget.src = "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=800&q=80";
                    }}
                  />
                </div>
                <div className="p-4 flex flex-col grow justify-between gap-3">
                  <div>
                    <h4 className="font-label-md text-on-surface line-clamp-1" title={item?.name || undefined}>{item?.name || "Unknown Product"}</h4>
                    <p className="text-[10px] text-on-surface-variant line-clamp-1" title={item?.short_description || undefined}>{item?.short_description || "IKEA"}</p>
                    <p className="font-bold text-secondary text-sm mt-1">{item?.price ? `${item.price} SAR` : "0 SAR"}</p>
                  </div>
                  <button 
                    onClick={() => {
                      // RealFurnitureLoader expects dimensions in millimetres!
                      const widthMm = parseFloat(String(item?.dimensions?.width)) || 1000;
                      const heightMm = parseFloat(String(item?.dimensions?.height)) || 1000;
                      const depthMm = parseFloat(String(item?.dimensions?.depth)) || 1000;

                      const newItem = {
                        id: safeId,
                        name: item?.name || "Unknown Product",
                        brand: item?.brand || "IKEA",
                        category: (["seating", "tables", "lighting", "rugs", "storage", "decor"].includes(item?.category || "") ? item?.category : "seating") as import('@/lib/useSceneStore').SceneItem["category"],
                        price: Number(item.price) || 0,
                        currency: 'SAR' as const,
                        instanceId: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15),
                        position: [0, 0.5, 0] as [number, number, number],
                        rotation: [0, 0, 0] as [number, number, number],
                        dimensions: { width: widthMm, height: heightMm, depth: depthMm },
                        modelUrl: item?.model_url || DEFAULT_MODEL_URL,
                        thumbnailUrl: item?.thumbnail_url || getPlaceholderImage(item?.category || ""),
                        asset_id: safeId
                      };
                      console.log("Adding scene item:", newItem);
                      addSceneItem(newItem);
                      onClose();
                    }}
                    className="w-full bg-secondary/10 text-secondary border border-secondary/20 rounded-lg px-4 py-2 font-label-sm hover:bg-secondary hover:text-white transition-colors flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">add_circle</span>
                    إضافة للمشهد
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
