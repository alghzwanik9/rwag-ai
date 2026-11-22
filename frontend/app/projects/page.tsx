"use client";

import React, { useEffect, useState } from "react";
import { FolderOpen, Plus, Download, Loader2, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSceneStore, type RoomWindow, type RwaqMaterial } from "@/lib/useSceneStore";

interface Project {
  id: string;
  name: string;
  savedAt: string;
  totalCost: number;
}

interface ProjectRoomSettings {
  roomWidth?: number;
  roomDepth?: number;
  wallHeight?: number;
  floorColor?: string;
  wallColor?: string;
  ambientMode?: "morning" | "rainy" | "midnight";
  windows?: RoomWindow[];
}

interface ProjectDetailPayload {
  id?: string;
  name?: string;
  sceneId?: string | null;
  sceneItems?: Array<Parameters<ReturnType<typeof useSceneStore.getState>["addSceneItem"]>[0]>;
  customMaterials?: Record<string, RwaqMaterial | unknown>;
  roomSettings?: ProjectRoomSettings | null;
  roomWidth?: number;
  room_width?: number;
  roomDepth?: number;
  room_depth?: number;
  wallHeight?: number;
  wall_height?: number;
  floorColor?: string;
  floor_color?: string;
  wallColor?: string;
  wall_color?: string;
  ambientMode?: "morning" | "rainy" | "midnight";
  ambient_mode?: "morning" | "rainy" | "midnight";
  windows?: RoomWindow[];
}

const VALID_AMBIENT_MODES = new Set(["morning", "rainy", "midnight"]);

function resolveFiniteNumber(fallback: number, ...candidates: unknown[]): number {
  for (const candidate of candidates) {
    if (typeof candidate === "number" && Number.isFinite(candidate) && candidate > 0) {
      return candidate;
    }
  }
  return fallback;
}

function resolveNonEmptyString(fallback: string, ...candidates: unknown[]): string {
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate;
    }
  }
  return fallback;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const router = useRouter();
  const clearScene = useSceneStore((s) => s.clearScene);
  const addSceneItem = useSceneStore((s) => s.addSceneItem);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/projects", { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error("Failed");
        return r.json();
      })
      .then((data) => setProjects(Array.isArray(data.projects) ? data.projects : []))
      .catch(() => {})
      .finally(() => setIsLoadingList(false));

    return () => controller.abort();
  }, []);

  const handleLoad = async (id: string) => {
    setOpeningId(id);
    setLoadError(null);
    try {
      const res = await fetch(`/api/projects/${id}`);
      if (!res.ok) throw new Error("تعذر تحميل بيانات المشروع");
      const data: ProjectDetailPayload = await res.json();
      if (data) {
        clearScene();

        const room = data.roomSettings ?? {};
        const roomWidth = resolveFiniteNumber(5.5, room.roomWidth, data.roomWidth, data.room_width);
        const roomDepth = resolveFiniteNumber(4.8, room.roomDepth, data.roomDepth, data.room_depth);
        const wallHeight = resolveFiniteNumber(3.0, room.wallHeight, data.wallHeight, data.wall_height);
        const floorColor = resolveNonEmptyString("#C8B29B", room.floorColor, data.floorColor, data.floor_color);
        const wallColor = resolveNonEmptyString("#EDE8E0", room.wallColor, data.wallColor, data.wall_color);
        const rawAmbient = room.ambientMode ?? data.ambientMode ?? data.ambient_mode;
        const ambientMode: "morning" | "rainy" | "midnight" =
          typeof rawAmbient === "string" && VALID_AMBIENT_MODES.has(rawAmbient)
            ? (rawAmbient as "morning" | "rainy" | "midnight")
            : "morning";
        const windows: RoomWindow[] = Array.isArray(room.windows)
          ? room.windows
          : Array.isArray(data.windows)
            ? data.windows
            : [];

        const customMaterials: Record<string, RwaqMaterial> = {};
        if (data.customMaterials && typeof data.customMaterials === "object") {
          for (const [key, value] of Object.entries(data.customMaterials)) {
            if (key === "__roomSettings") continue;
            if (value && typeof value === "object") {
              customMaterials[key] = value as RwaqMaterial;
            }
          }
        }

        const store = useSceneStore.getState();
        store.setRoomWidth(roomWidth);
        store.setRoomDepth(roomDepth);
        store.setWallHeight(wallHeight);
        store.setFloorColor(floorColor);
        store.setWallColor(wallColor);
        store.setAmbientMode(ambientMode);
        store.setWindows(windows);
        useSceneStore.setState({
          activeSceneId: data.sceneId || null,
          customMaterials,
        });

        if (Array.isArray(data.sceneItems)) {
          data.sceneItems.forEach((item, index) => {
            addSceneItem({
              ...item,
              instanceId: item.instanceId || `${item.id || "item"}-${Date.now()}-${index}`,
            });
          });
        }

        router.push("/studio");
      }
    } catch (e) {
      console.error(e);
      setLoadError("حدث خطأ أثناء فتح المشروع. يرجى المحاولة مرة أخرى.");
    } finally {
      setOpeningId(null);
    }
  };

  return (
    <main className="fixed top-[64px] left-0 right-0 md:right-[280px] bottom-0 bg-surface overflow-y-auto" dir="rtl">
      <div className="p-4 sm:p-6 md:p-8">
        {/* Header */}
        <div className="mb-6 md:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-headline-lg text-2xl sm:text-3xl font-bold text-on-surface flex items-center gap-3">
              <FolderOpen className="w-7 h-7 text-secondary shrink-0" />
              مشاريعي
            </h2>
            <p className="text-on-surface-variant font-body-md text-sm sm:text-base mt-1">
              إدارة التصاميم المحفوظة ومتابعة التكاليف.
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push("/studio")}
            className="bg-secondary text-white px-5 py-2.5 rounded-full text-sm font-bold hover:bg-secondary/90 transition-all flex items-center justify-center gap-2 shadow-sm shrink-0"
          >
            <Plus className="w-4 h-4" />
            تصميم جديد
          </button>
        </div>

        {loadError && (
          <div className="mb-6 flex items-center gap-2.5 rounded-2xl border border-error/30 bg-error-container/50 px-4 py-3 text-sm font-medium text-error">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{loadError}</span>
          </div>
        )}

        {/* Content */}
        {isLoadingList ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[1, 2, 3].map((idx) => (
              <div
                key={idx}
                className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 animate-pulse"
              >
                <div className="w-10 h-10 bg-surface-container rounded-xl mb-3" />
                <div className="h-4 bg-surface-container rounded w-3/4 mb-2" />
                <div className="h-3 bg-surface-container rounded w-1/2 mb-5" />
                <div className="h-10 bg-surface-container rounded-xl w-full" />
              </div>
            ))}
          </div>
        ) : projects.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {projects.map((proj) => {
              const isOpening = openingId === proj.id;
              return (
                <div
                  key={proj.id}
                  className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 hover:border-secondary/50 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="w-10 h-10 bg-secondary-container rounded-xl flex items-center justify-center mb-3">
                      <FolderOpen className="w-5 h-5 text-secondary" />
                    </div>
                    <h4 className="font-bold text-on-surface mb-1">{proj.name}</h4>
                    <p className="text-xs text-on-surface-variant font-mono mb-4">
                      {new Date(proj.savedAt).toLocaleDateString("ar-SA")} — {proj.totalCost} ر.س
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={isOpening}
                    onClick={() => handleLoad(proj.id)}
                    className="w-full bg-secondary-container text-on-secondary-container py-2.5 rounded-xl text-sm font-bold flex justify-center items-center gap-2 hover:bg-secondary hover:text-white transition-colors disabled:opacity-60"
                  >
                    {isOpening ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    {isOpening ? "جاري الفتح..." : "فتح التصميم"}
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 sm:py-24 px-4 text-center bg-surface-container-lowest border border-dashed border-outline-variant rounded-3xl">
            <div className="w-20 h-20 bg-secondary-container rounded-full flex items-center justify-center mb-5">
              <FolderOpen className="w-10 h-10 text-secondary" />
            </div>
            <h4 className="font-headline-sm text-lg font-bold text-on-surface mb-2">لا توجد مشاريع حالياً</h4>
            <p className="text-on-surface-variant text-sm mb-7 max-w-sm">
              ابدأ الآن في تشكيل مساحتك المذهلة واحفظها هنا.
            </p>
            <button
              type="button"
              onClick={() => router.push("/studio")}
              className="bg-secondary text-white px-7 py-3 rounded-full font-bold hover:bg-secondary/90 transition-all flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-5 h-5" />
              إنشاء مشروع جديد
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
