/**
 * Scene contract for the Rwaq room editor.
 *
 * This shape is what the manual editor produces today and what the AI agent
 * will return later, so both stay interchangeable. Every unit here is metres
 * and radians — millimetres exist only in the catalog, and are converted in
 * exactly one place (`getFootprintMeters` in lib/catalog.ts).
 */

// ─── Room shape ───────────────────────────────────────────────────────────────

/**
 * Room shape is an explicit, discriminated field from day one.
 * Only "rect" is produced by the editor now; "polygon" is reserved so adding
 * free-form floor plans later does not require rewriting every consumer.
 */
export type RoomShape =
  | { kind: 'rect'; width: number; depth: number }      // metres
  | { kind: 'polygon'; points: [number, number][] };    // metres, [x, z]

// ─── Materials ────────────────────────────────────────────────────────────────

export type MaterialId = 'oak_parquet' | 'travertine' | 'plaster_white' | 'fluted_wood';

export interface MaterialDef {
  id: MaterialId;
  /** Arabic label for the UI */
  labelAr: string;
  color: string;
  roughness: number;
  metalness: number;
}

export const MATERIALS: Record<MaterialId, MaterialDef> = {
  oak_parquet: {
    id: 'oak_parquet',
    labelAr: 'باركيه بلوط',
    color: '#C8B29B',
    roughness: 0.7,
    metalness: 0.0,
  },
  travertine: {
    id: 'travertine',
    labelAr: 'رخام ترافرتين',
    color: '#D8CFC0',
    roughness: 0.45,
    metalness: 0.0,
  },
  plaster_white: {
    id: 'plaster_white',
    labelAr: 'جبس أبيض',
    color: '#EDE8E0',
    roughness: 0.9,
    metalness: 0.0,
  },
  fluted_wood: {
    id: 'fluted_wood',
    labelAr: 'خشب مضلّع',
    color: '#8B6B4A',
    roughness: 0.6,
    metalness: 0.0,
  },
};

// ─── Scene ────────────────────────────────────────────────────────────────────

export interface Room {
  shape: RoomShape;
  /** metres */
  height: number;
  floorMaterial: MaterialId;
  wallMaterial: MaterialId;
}

export interface PlacedFurniture {
  /** unique per placement */
  instanceId: string;
  /** FK into IKEA_TEMPLATES */
  templateId: string;
  /** metres, room-local, origin at room centre */
  position: { x: number; z: number };
  /** radians */
  rotationY: number;
}

export interface SceneState {
  room: Room;
  furniture: PlacedFurniture[];
}

// ─── Geometry ─────────────────────────────────────────────────────────────────

export interface RoomBounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  width: number;
  depth: number;
  /** true floor area in m² — not the bounding-box area for polygons */
  area: number;
}

/**
 * The single source of room geometry. No consumer may assume the room is
 * rectangular; everything goes through here.
 */
export function getRoomBounds(room: Room): RoomBounds {
  const { shape } = room;

  if (shape.kind === 'rect') {
    const halfW = shape.width / 2;
    const halfD = shape.depth / 2;
    return {
      minX: -halfW,
      maxX: halfW,
      minZ: -halfD,
      maxZ: halfD,
      width: shape.width,
      depth: shape.depth,
      area: shape.width * shape.depth,
    };
  }

  // polygon: axis-aligned bounding box, area via the shoelace formula
  const points = shape.points;
  if (points.length === 0) {
    return { minX: 0, maxX: 0, minZ: 0, maxZ: 0, width: 0, depth: 0, area: 0 };
  }

  let minX = points[0][0];
  let maxX = points[0][0];
  let minZ = points[0][1];
  let maxZ = points[0][1];
  let doubleArea = 0;

  for (let i = 0; i < points.length; i++) {
    const [x, z] = points[i];
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (z < minZ) minZ = z;
    if (z > maxZ) maxZ = z;

    const [nx, nz] = points[(i + 1) % points.length];
    doubleArea += x * nz - nx * z;
  }

  return {
    minX,
    maxX,
    minZ,
    maxZ,
    width: maxX - minX,
    depth: maxZ - minZ,
    area: Math.abs(doubleArea) / 2,
  };
}
