import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';
import { getLocalProjects } from '@/lib/localProjectsStore';
import type { Database } from '@/types/supabase';

type ProjectFullRow = Database['public']['Tables']['projects']['Row'];

export async function GET() {
  try {
    let userId: string | null = null;
    try {
      const authObj = await auth();
      userId = authObj.userId;
    } catch {
      // In local development or guest sessions, userId may be null
    }

    const effectiveUserId = userId || "local_user";

    // 1. Fetch from local resilient store
    const localProjects = await getLocalProjects(effectiveUserId);

    // 2. Fetch from Supabase if online
    let remoteProjects: ProjectFullRow[] = [];
    if (userId) {
      try {
        const fetchPromise = supabase
          .from('projects')
          .select('*')
          .eq('user_id', userId)
          .order('saved_at', { ascending: false });

        let timeoutId: ReturnType<typeof setTimeout> | undefined;
        const timeoutPromise = new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error('Supabase request timeout')), 2000);
        });

        try {
          const result: any = await Promise.race([fetchPromise, timeoutPromise]);
          if (!result.error && Array.isArray(result.data)) {
            remoteProjects = result.data;
          }
        } finally {
          if (timeoutId !== undefined) clearTimeout(timeoutId);
        }
      } catch (e: any) {
        console.warn("[Projects GET] Supabase offline/error, falling back to local:", e?.message || e);
      }
    }

    // Combine projects (local + remote, unique by id)
    const combinedMap = new Map<string, any>();

    // Add local projects first
    for (const p of localProjects) {
      const room = p.custom_materials?.__roomSettings || {};
      combinedMap.set(p.id, {
        id: p.id,
        name: p.name,
        savedAt: p.saved_at,
        totalCost: p.total_cost,
        roomWidth: room.roomWidth || 5.5,
        roomDepth: room.roomDepth || 4.8,
        wallHeight: room.wallHeight || 3.0,
        roomStyle: room.roomStyle || "مودرن فاخر",
        itemCount: Array.isArray(p.scene_items) ? p.scene_items.length : 0,
        thumbnailUrl: p.thumbnail_url || room.thumbnailUrl || null,
        isLocal: true,
      });
    }

    // Add / overwrite with remote projects
    for (const p of remoteProjects) {
      const mats: any = p.custom_materials && typeof p.custom_materials === "object" ? p.custom_materials : {};
      const room = mats.__roomSettings || {};
      combinedMap.set(p.id, {
        id: p.id,
        name: p.name,
        savedAt: p.saved_at,
        totalCost: p.total_cost,
        roomWidth: room.roomWidth || 5.5,
        roomDepth: room.roomDepth || 4.8,
        wallHeight: room.wallHeight || 3.0,
        roomStyle: room.roomStyle || "مودرن فاخر",
        itemCount: Array.isArray(p.scene_items) ? p.scene_items.length : 0,
        thumbnailUrl: room.thumbnailUrl || null,
        isLocal: false,
      });
    }

    const projectsList = Array.from(combinedMap.values()).sort(
      (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
    );

    return NextResponse.json({ projects: projectsList });
  } catch (error) {
    console.warn("Projects fallback:", error instanceof Error ? error.message : error);
    return NextResponse.json({ projects: [] });
  }
}
