/**
 * useSceneStore — Sprint 3: Smart Economy State
 *
 * Tracks furniture items placed in the active 3D scene, aggregates costs,
 * and manages the user's budget limit. Built with Zustand for lightweight,
 * performant state management compatible with Next.js App Router (RSC-safe
 * via 'use client' boundaries).
 *
 * Usage:
 *   const { sceneItems, currentTotalCost, budgetLimit } = useSceneStore();
 *   const addItem = useSceneStore(s => s.addSceneItem);
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import { IProductTemplate } from '@/app/studio/config/catalogTemplates';

// ─── Types ────────────────────────────────────────────────────────────────────

export type SupportedCurrency = 'SAR' | 'USD' | 'AED' | 'EGP' | 'KWD';

export interface SceneItem extends IProductTemplate {
  /** Unique instance ID (not the furniture type ID — allows multiple of same type) */
  instanceId: string;
  /** When was this item added to the scene */
  addedAt: number;
  /** 3D space position */
  position: [number, number, number];
  /** 3D space rotation */
  rotation: [number, number, number];
  /** Custom assigned material color */
  color?: string;
}

export interface Recommendation {
  brand: string;
  price: number;
  currency: SupportedCurrency;
  store_url: string;
  sku: string;
  justification: string;
}

export interface RwaqMaterial {
  id: string;
  name: string;
  category: 'Fabrics' | 'Woods' | 'Metals';
  color?: string;
  roughness?: number;
  metalness?: number;
  textureUrl?: string;
}

// ─── Window System ───────────────────────────────────────────────────────────

export type WindowWall = 'back' | 'left';
export type WindowSize = 'small' | 'medium' | 'large';
export type CurtainStyle = 'none' | 'sheer' | 'blackout' | 'draped';

export interface RoomWindow {
  id: string;
  wall: WindowWall;
  size: WindowSize;
  positionOffset: number; // -1 to 1, relative position along the wall
  height: number;         // 0.5 to 1.0, from floor in percentage of wallHeight
  curtain: CurtainStyle;
  curtainColor: string;
  isOpen: boolean;        // curtain open/closed
}

export interface SceneStore {
  // ── State ──────────────────────────────────────────────────────────────────
  /** Current ambient mode for the 3D scene lighting/weather */
  ambientMode: 'morning' | 'rainy' | 'midnight';
  /** View mode for 3D navigation */
  viewMode: 'orbit' | 'fpv';
  /** Lighting Controls */
  coveLightIntensity: number; // 0 to 100
  coveLightColor: number; // Kelvin e.g. 3000 to 4000
  spotlightToggle: boolean;
  /** Active scene job ID, updated after every generation */
  activeSceneId: string | null;
  /** Room Finishes: Floor color/material hex or preset name */
  floorColor: string;
  /** Room Finishes: Wall color/material hex or preset name */
  wallColor: string;
  /** Room Dimensions: Width */
  roomWidth: number;
  /** Room Dimensions: Depth */
  roomDepth: number;
  /** Room Dimensions: Wall Height */
  wallHeight: number;
  /** All furniture items currently in the scene */
  sceneItems: SceneItem[];
  /** History stack for Undo/Redo */
  history: SceneItem[][];
  /** Current index in history stack */
  historyIndex: number;
  /** User-defined maximum budget in the primary currency (SAR by default) */
  budgetLimit: number;
  /** Primary display currency for budget comparison */
  primaryCurrency: SupportedCurrency;
  /** AI recommendations for alternative items */
  recommendations: Recommendation[];
  /** Material Customizer: ID of the currently selected 3D object/mesh */
  selectedObjectId: string | null;
  /** Material Customizer: Currently selected material to apply */
  activeMaterial: RwaqMaterial | null;
  /** Material Customizer: Map of meshId -> Applied Material to persist across views (Desktop & AR) */
  customMaterials: Record<string, RwaqMaterial>;
  /** Selected asset/instance ID for TransformControls */
  selectedAssetId: string | null;
  /** True when the user is actively dragging an object (disables camera) */
  isDragging: boolean;
  /** Room Windows configuration */
  windows: RoomWindow[];

  // ── Derived ────────────────────────────────────────────────────────────────
  /**
   * Sum of all item prices that share the primaryCurrency.
   * Items in other currencies are excluded (conversion not yet implemented).
   */
  currentTotalCost: () => number;
  /** True if currentTotalCost() > budgetLimit */
  isBudgetExceeded: () => boolean;
  /** Items grouped by currency for multi-currency display */
  costByCurrency: () => Record<SupportedCurrency, number>;

  // ── Actions ────────────────────────────────────────────────────────────────
  setActiveSceneId: (sceneId: string) => void;
  addSceneItem: (item: Omit<SceneItem, 'addedAt' | 'position' | 'rotation'> & { position?: [number, number, number], rotation?: [number, number, number] }) => void;
  removeSceneItem: (instanceId: string) => void;
  updateSceneItem: (instanceId: string, patch: Partial<SceneItem>) => void;
  clearScene: () => void;
  setBudgetLimit: (limit: number) => void;
  setPrimaryCurrency: (currency: SupportedCurrency) => void;
  fetchAlternatives: (itemId: string, currentItemPrice: number) => Promise<void>;
  clearRecommendations: () => void;
  setSelectedObjectId: (id: string | null) => void;
  setSelectedAssetId: (id: string | null) => void;
  setActiveMaterial: (material: RwaqMaterial | null) => void;
  applyCustomMaterial: (meshId: string, material: RwaqMaterial) => void;
  setAmbientMode: (mode: 'morning' | 'rainy' | 'midnight') => void;
  setCoveLightIntensity: (intensity: number) => void;
  setCoveLightColor: (kelvin: number) => void;
  toggleSpotlight: (enabled: boolean) => void;
  setFloorColor: (color: string) => void;
  setWallColor: (color: string) => void;
  setRoomWidth: (w: number) => void;
  setRoomDepth: (d: number) => void;
  setWallHeight: (h: number) => void;
  undo: () => void;
  redo: () => void;
  resetToDefaults: () => void;
  setIsDragging: (dragging: boolean) => void;
  setViewMode: (mode: 'orbit' | 'fpv') => void;
  // Window actions
  addWindow: (wall: WindowWall) => void;
  removeWindow: (id: string) => void;
  updateWindow: (id: string, patch: Partial<RoomWindow>) => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useSceneStore = create<SceneStore>()(
  persist(
    (set, get) => ({
      // ── Initial state ──────────────────────────────────────────────────────
      ambientMode: 'morning',
      viewMode: 'orbit',
      coveLightIntensity: 10,
      coveLightColor: 3700,
      spotlightToggle: false,
      activeSceneId: null,
      floorColor: '#ffffff', // Default white marble/wood
      wallColor: '#f5f5f5', // Default off-white walls
      roomWidth: 10,
      roomDepth: 10,
      wallHeight: 4,
      sceneItems: [],
      history: [[]],
      historyIndex: 0,
      budgetLimit: 20000, // default 20,000 SAR
      primaryCurrency: 'SAR',
      recommendations: [],
      selectedObjectId: null,
      selectedAssetId: null,
      isDragging: false,
      activeMaterial: null,
      customMaterials: {},
      windows: [],

      // ── Derived selectors ──────────────────────────────────────────────────
      currentTotalCost: () => {
        const { sceneItems, primaryCurrency } = get();
        return sceneItems.reduce((sum, item) => {
          if (item.currency === primaryCurrency) {
            return sum + item.price;
          }
          return sum; // skip cross-currency items until FX is wired
        }, 0);
      },

      isBudgetExceeded: () => {
        const { currentTotalCost, budgetLimit } = get();
        return currentTotalCost() > budgetLimit;
      },

      costByCurrency: () => {
        const { sceneItems } = get();
        return sceneItems.reduce(
          (acc, item) => {
            const currency = item.currency as SupportedCurrency;
            acc[currency] = (acc[currency] ?? 0) + item.price;
            return acc;
          },
          {} as Record<SupportedCurrency, number>
        );
      },

      // ── Actions ────────────────────────────────────────────────────────────
      setActiveSceneId: (sceneId) => set({ activeSceneId: sceneId }),

      addSceneItem: (item) =>
        set((state) => {
          const newItems = [...state.sceneItems, { 
            ...item, 
            addedAt: Date.now(),
            position: item.position || [0, 0, 0],
            rotation: item.rotation || [0, 0, 0]
          }];
          const newHistory = state.history.slice(0, state.historyIndex + 1);
          newHistory.push(newItems);
          if (newHistory.length > 50) newHistory.shift();
          return { sceneItems: newItems, history: newHistory, historyIndex: newHistory.length - 1 };
        }),

      removeSceneItem: (instanceId) =>
        set((state) => {
          const newItems = state.sceneItems.filter((i) => i.instanceId !== instanceId);
          const newHistory = state.history.slice(0, state.historyIndex + 1);
          newHistory.push(newItems);
          if (newHistory.length > 50) newHistory.shift();
          return { sceneItems: newItems, history: newHistory, historyIndex: newHistory.length - 1 };
        }),

      updateSceneItem: (instanceId, patch) =>
        set((state) => {
          const newItems = state.sceneItems.map((i) =>
            i.instanceId === instanceId ? { ...i, ...patch } : i
          );
          // Optimization: If nothing actually changed (e.g. dragging but returning to same spot), don't push
          const newHistory = state.history.slice(0, state.historyIndex + 1);
          newHistory.push(newItems);
          if (newHistory.length > 50) newHistory.shift();
          return { sceneItems: newItems, history: newHistory, historyIndex: newHistory.length - 1 };
        }),

      clearScene: () => set((state) => {
          const newItems: SceneItem[] = [];
          const newHistory = state.history.slice(0, state.historyIndex + 1);
          newHistory.push(newItems);
          if (newHistory.length > 50) newHistory.shift();
          return { sceneItems: newItems, activeSceneId: null, history: newHistory, historyIndex: newHistory.length - 1 };
      }),

      setBudgetLimit: (limit) => set({ budgetLimit: limit }),

      setPrimaryCurrency: (currency) => set({ primaryCurrency: currency }),

      fetchAlternatives: async (itemId, currentItemPrice) => {
        // Calculate how much budget is left IF we remove the current item
        const budgetLeft = get().budgetLimit - (get().currentTotalCost() - currentItemPrice);
        
        try {
          const res = await fetch("/api/recommendations/alternatives", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ current_item_id: itemId, budget_left: budgetLeft })
          });
          if (res.ok) {
            const data = await res.json();
            set({ recommendations: data.alternatives || [] });
          }
        } catch (e) {
          console.error("Failed to fetch alternatives", e);
        }
      },

      clearRecommendations: () => set({ recommendations: [] }),

      setSelectedObjectId: (id) => set({ selectedObjectId: id, activeMaterial: null }),
      
      setSelectedAssetId: (id) => set({ selectedAssetId: id }),

      setActiveMaterial: (material) => set({ activeMaterial: material }),

      applyCustomMaterial: (meshId, material) => set((state) => ({
        customMaterials: { ...state.customMaterials, [meshId]: material }
      })),

      setAmbientMode: (mode) => set({ ambientMode: mode }),
      setCoveLightIntensity: (intensity) => set({ coveLightIntensity: intensity }),
      setCoveLightColor: (kelvin) => set({ coveLightColor: kelvin }),
      toggleSpotlight: (enabled) => set({ spotlightToggle: enabled }),
      setFloorColor: (color) => set({ floorColor: color }),
      setWallColor: (color) => set({ wallColor: color }),
      setRoomWidth: (w) => set({ roomWidth: w }),
      setRoomDepth: (d) => set({ roomDepth: d }),
      setWallHeight: (h) => set({ wallHeight: h }),
      undo: () => set((state) => {
        if (state.historyIndex > 0) {
          const newIndex = state.historyIndex - 1;
          return { historyIndex: newIndex, sceneItems: state.history[newIndex] };
        }
        return state;
      }),
      redo: () => set((state) => {
        if (state.historyIndex < state.history.length - 1) {
          const newIndex = state.historyIndex + 1;
          return { historyIndex: newIndex, sceneItems: state.history[newIndex] };
        }
        return state;
      }),
      resetToDefaults: () => set({
        ambientMode: 'morning',
        coveLightIntensity: 10,
        coveLightColor: 3700,
        spotlightToggle: false,
        floorColor: '#ffffff',
        wallColor: '#f5f5f5',
        roomWidth: 10,
        roomDepth: 10,
        wallHeight: 4,
      }),
      setIsDragging: (dragging) => set({ isDragging: dragging }),
      setViewMode: (mode) => set({ viewMode: mode }),

      // ── Window actions ────────────────────────────────────────
      addWindow: (wall) => set((state) => {
        const id = `win_${Date.now()}`;
        const newWindow: RoomWindow = {
          id,
          wall,
          size: 'medium',
          positionOffset: 0,
          height: 0.55,
          curtain: 'sheer',
          curtainColor: '#f0ece4',
          isOpen: true,
        };
        return { windows: [...state.windows, newWindow] };
      }),

      removeWindow: (id) => set((state) => ({
        windows: state.windows.filter((w) => w.id !== id),
      })),

      updateWindow: (id, patch) => set((state) => ({
        windows: state.windows.map((w) => w.id === id ? { ...w, ...patch } : w),
      })),
    }),
    {
      name: 'rwaq-scene-store',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? localStorage : ({} as Storage)
      ),
      // Only persist user preferences, not transient scene items
      partialize: (state) => ({
        budgetLimit: state.budgetLimit,
        primaryCurrency: state.primaryCurrency,
        ambientMode: state.ambientMode,
        coveLightIntensity: state.coveLightIntensity,
        coveLightColor: state.coveLightColor,
        spotlightToggle: state.spotlightToggle,
        roomWidth: state.roomWidth,
        roomDepth: state.roomDepth,
        wallHeight: state.wallHeight,
        windows: state.windows,
      }),
    }
  )
);

// ─── Convenience hooks ────────────────────────────────────────────────────────

/** Returns formatted total cost string for display (e.g. "١٢,٥٠٠ ر.س") */
export function useFormattedTotalCost(): string {
  const { currentTotalCost, primaryCurrency } = useSceneStore();
  const total = currentTotalCost();
  return formatCurrency(total, primaryCurrency);
}

/** Returns formatted budget limit string for display */
export function useFormattedBudgetLimit(): string {
  const { budgetLimit, primaryCurrency } = useSceneStore();
  return formatCurrency(budgetLimit, primaryCurrency);
}

// ─── Utilities ────────────────────────────────────────────────────────────────

const CURRENCY_LABELS: Record<SupportedCurrency, string> = {
  SAR: 'ر.س',
  USD: '$',
  AED: 'د.إ',
  EGP: 'ج.م',
  KWD: 'د.ك',
};

export function formatCurrency(amount: number, currency: SupportedCurrency): string {
  const label = CURRENCY_LABELS[currency] ?? currency;
  const formatted = amount.toLocaleString('ar-SA', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return `${formatted} ${label}`;
}
