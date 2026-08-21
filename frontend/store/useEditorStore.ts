/**
 * useEditorStore — manual room editor state.
 *
 * Holds exactly a `SceneState` (types/scene.ts) so the AI agent can later hand
 * back the same shape and drop straight in. Distinct from the legacy
 * `lib/useSceneStore.ts`, which owns budget, undo history, windows and material
 * customisation for the existing studio and is untouched by this store.
 */

import { create } from 'zustand';

import { getFootprintMeters, getTemplate } from '@/lib/catalog';
import {
  getRoomBounds,
  type MaterialId,
  type PlacedFurniture,
  type Room,
  type SceneState,
} from '@/types/scene';

const DEFAULT_ROOM: Room = {
  shape: { kind: 'rect', width: 5, depth: 4 },
  height: 3,
  floorMaterial: 'oak_parquet',
  wallMaterial: 'plaster_white',
};

export interface EditorStore extends SceneState {
  setRoomSize: (width: number, depth: number) => void;
  setRoomHeight: (h: number) => void;
  setFloorMaterial: (id: MaterialId) => void;
  setWallMaterial: (id: MaterialId) => void;
  addFurniture: (templateId: string, position?: { x: number; z: number }) => void;
  moveFurniture: (instanceId: string, position: { x: number; z: number }) => void;
  rotateFurniture: (instanceId: string, rotationY: number) => void;
  removeFurniture: (instanceId: string) => void;
  clearScene: () => void;
}

// ─── Geometry helpers ─────────────────────────────────────────────────────────

/**
 * Half-extents of a piece's axis-aligned bounding box once rotated, so a sofa
 * turned 90° clamps against its depth rather than its width.
 */
function halfExtents(templateId: string, rotationY: number): { x: number; z: number } {
  const template = getTemplate(templateId);
  if (!template) return { x: 0, z: 0 };

  const { width, depth } = getFootprintMeters(template);
  const cos = Math.abs(Math.cos(rotationY));
  const sin = Math.abs(Math.sin(rotationY));

  return {
    x: (width * cos + depth * sin) / 2,
    z: (width * sin + depth * cos) / 2,
  };
}

function clampToRoom(
  room: Room,
  templateId: string,
  rotationY: number,
  position: { x: number; z: number }
): { x: number; z: number } {
  const bounds = getRoomBounds(room);
  const half = halfExtents(templateId, rotationY);

  // A piece wider than the room can only sit at its centre.
  const clampAxis = (value: number, min: number, max: number, halfSize: number) => {
    const lo = min + halfSize;
    const hi = max - halfSize;
    if (lo > hi) return (min + max) / 2;
    return Math.min(Math.max(value, lo), hi);
  };

  return {
    x: clampAxis(position.x, bounds.minX, bounds.maxX, half.x),
    z: clampAxis(position.z, bounds.minZ, bounds.maxZ, half.z),
  };
}

function roomCentre(room: Room): { x: number; z: number } {
  const bounds = getRoomBounds(room);
  return { x: (bounds.minX + bounds.maxX) / 2, z: (bounds.minZ + bounds.maxZ) / 2 };
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useEditorStore = create<EditorStore>()((set) => ({
  room: DEFAULT_ROOM,
  furniture: [],

  setRoomSize: (width, depth) =>
    set((state) => {
      const room: Room = { ...state.room, shape: { kind: 'rect', width, depth } };
      // Shrinking the room must not strand pieces outside the walls.
      return {
        room,
        furniture: state.furniture.map((f) => ({
          ...f,
          position: clampToRoom(room, f.templateId, f.rotationY, f.position),
        })),
      };
    }),

  setRoomHeight: (h) => set((state) => ({ room: { ...state.room, height: h } })),

  setFloorMaterial: (id) => set((state) => ({ room: { ...state.room, floorMaterial: id } })),

  setWallMaterial: (id) => set((state) => ({ room: { ...state.room, wallMaterial: id } })),

  addFurniture: (templateId, position) =>
    set((state) => {
      const target = position ?? roomCentre(state.room);
      const piece: PlacedFurniture = {
        instanceId: crypto.randomUUID(),
        templateId,
        position: clampToRoom(state.room, templateId, 0, target),
        rotationY: 0,
      };
      return { furniture: [...state.furniture, piece] };
    }),

  moveFurniture: (instanceId, position) =>
    set((state) => ({
      furniture: state.furniture.map((f) =>
        f.instanceId === instanceId
          ? { ...f, position: clampToRoom(state.room, f.templateId, f.rotationY, position) }
          : f
      ),
    })),

  rotateFurniture: (instanceId, rotationY) =>
    set((state) => ({
      furniture: state.furniture.map((f) =>
        f.instanceId === instanceId
          ? {
              ...f,
              rotationY,
              // The rotated footprint may now overhang a wall.
              position: clampToRoom(state.room, f.templateId, rotationY, f.position),
            }
          : f
      ),
    })),

  removeFurniture: (instanceId) =>
    set((state) => ({ furniture: state.furniture.filter((f) => f.instanceId !== instanceId) })),

  clearScene: () => set({ furniture: [] }),
}));

// ─── Derived selectors ────────────────────────────────────────────────────────

/** Sum of catalog prices across every placed piece, in SAR. */
export function selectTotalCost(state: SceneState): number {
  return state.furniture.reduce((sum, f) => sum + (getTemplate(f.templateId)?.price ?? 0), 0);
}

/** Floor area in m². */
export function selectFloorArea(state: SceneState): number {
  return getRoomBounds(state.room).area;
}

export function useTotalCost(): number {
  return useEditorStore(selectTotalCost);
}

export function useFloorArea(): number {
  return useEditorStore(selectFloorArea);
}
