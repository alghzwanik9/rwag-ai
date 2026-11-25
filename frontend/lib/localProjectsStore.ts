import fs from "fs/promises";
import path from "path";

export interface LocalProjectRoomSettings {
  roomWidth?: number;
  roomDepth?: number;
  wallHeight?: number;
  floorColor?: string;
  wallColor?: string;
  ambientMode?: "morning" | "rainy" | "midnight";
  roomStyle?: string;
  thumbnailUrl?: string | null;
  windows?: any[];
  doors?: any[];
}

export interface LocalProjectRecord {
  id: string;
  user_id: string;
  name: string;
  scene_id: string;
  glb_url: string | null;
  scene_items: any[];
  custom_materials: {
    [key: string]: any;
    __roomSettings?: LocalProjectRoomSettings;
  };
  total_cost: number;
  saved_at: string;
  thumbnail_url?: string | null;
}

const STORE_PATH = path.resolve(process.cwd(), ".local_projects_store.json");

async function readStore(): Promise<LocalProjectRecord[]> {
  try {
    const raw = await fs.readFile(STORE_PATH, "utf-8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err: any) {
    if (err.code === "ENOENT") {
      return [];
    }
    console.warn("[LocalProjectsStore] Could not read store file:", err.message);
    return [];
  }
}

async function writeStore(records: LocalProjectRecord[]): Promise<void> {
  try {
    await fs.writeFile(STORE_PATH, JSON.stringify(records, null, 2), "utf-8");
  } catch (err: any) {
    console.error("[LocalProjectsStore] Could not write store file:", err.message);
  }
}

export async function getLocalProjects(userId?: string): Promise<LocalProjectRecord[]> {
  const all = await readStore();
  if (!userId || userId === "local_user") {
    return all;
  }
  return all.filter((p) => p.user_id === userId || p.user_id === "local_user");
}

export async function getLocalProjectById(id: string): Promise<LocalProjectRecord | null> {
  const all = await readStore();
  const match = all.find((p) => p.id === id);
  return match || null;
}

export async function saveLocalProject(
  payload: Partial<LocalProjectRecord> & { name: string }
): Promise<LocalProjectRecord> {
  const all = await readStore();
  const existingIdx = payload.id ? all.findIndex((p) => p.id === payload.id) : -1;

  const now = new Date().toISOString();
  const id = payload.id || `prj_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  const record: LocalProjectRecord = {
    id,
    user_id: payload.user_id || "local_user",
    name: payload.name,
    scene_id: payload.scene_id || `scene_${Date.now()}`,
    glb_url: payload.glb_url ?? null,
    scene_items: payload.scene_items || [],
    custom_materials: payload.custom_materials || {},
    total_cost: payload.total_cost || 0,
    saved_at: now,
    thumbnail_url: payload.thumbnail_url ?? payload.custom_materials?.__roomSettings?.thumbnailUrl ?? null,
  };

  if (existingIdx >= 0) {
    all[existingIdx] = record;
  } else {
    all.unshift(record);
  }

  await writeStore(all);
  return record;
}

export async function deleteLocalProject(id: string): Promise<boolean> {
  const all = await readStore();
  const filtered = all.filter((p) => p.id !== id);
  if (filtered.length !== all.length) {
    await writeStore(filtered);
    return true;
  }
  return false;
}
