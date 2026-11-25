import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';
import { getLocalProjectById, deleteLocalProject } from '@/lib/localProjectsStore';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    let userId: string | null = null;
    try {
      const authObj = await auth();
      userId = authObj.userId;
    } catch {
      // Local dev or guest
    }

    // 1. Try local resilient store first
    const localProj = await getLocalProjectById(id);
    if (localProj) {
      let roomSettings: any = null;
      let cleanCustomMaterials: Record<string, unknown> = {};

      if (localProj.custom_materials && typeof localProj.custom_materials === "object") {
        const { __roomSettings, ...rest } = localProj.custom_materials;
        if (__roomSettings && typeof __roomSettings === "object") {
          roomSettings = __roomSettings;
        }
        cleanCustomMaterials = rest;
      }

      return NextResponse.json({
        id: localProj.id,
        name: localProj.name,
        sceneId: localProj.scene_id,
        glbUrl: localProj.glb_url,
        sceneItems: localProj.scene_items,
        customMaterials: cleanCustomMaterials,
        roomSettings,
        totalCost: localProj.total_cost,
        savedAt: localProj.saved_at,
        thumbnailUrl: localProj.thumbnail_url || roomSettings?.thumbnailUrl || null,
      });
    }

    // 2. Try Supabase if authenticated
    if (userId) {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('id,name,scene_id,glb_url,scene_items,custom_materials,total_cost,saved_at')
          .eq('id', id)
          .single();

        if (!error && data) {
          let roomSettings: any = null;
          let cleanCustomMaterials: Record<string, unknown> = {};

          if (data.custom_materials && typeof data.custom_materials === 'object') {
            const rawMap = data.custom_materials as Record<string, unknown>;
            const { __roomSettings, ...rest } = rawMap;
            if (__roomSettings && typeof __roomSettings === 'object') {
              roomSettings = __roomSettings;
            }
            cleanCustomMaterials = rest;
          }

          return NextResponse.json({
            id: data.id,
            name: data.name,
            sceneId: data.scene_id,
            glbUrl: data.glb_url,
            sceneItems: data.scene_items,
            customMaterials: cleanCustomMaterials,
            roomSettings,
            totalCost: data.total_cost,
            savedAt: data.saved_at,
            thumbnailUrl: roomSettings?.thumbnailUrl || null,
          });
        }
      } catch (err: any) {
        console.warn("[Project GET] Supabase load error:", err?.message || err);
      }
    }

    return NextResponse.json({ error: "المشروع غير موجود أو لا تملك صلاحية للوصول إليه" }, { status: 404 });
  } catch (error) {
    const e = error as Error;
    console.error("Server Load Error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    let userId: string | null = null;
    try {
      const authObj = await auth();
      userId = authObj.userId;
    } catch {
      // Local dev
    }

    // 1. Delete from local store
    await deleteLocalProject(id);

    // 2. Delete from Supabase if online
    if (userId) {
      try {
        await supabase.from('projects').delete().eq('id', id);
      } catch (e: any) {
        console.warn("[Project DELETE] Supabase delete warning:", e?.message || e);
      }
    }

    return NextResponse.json({ status: "success", message: "تم حذف المشروع بنجاح" });
  } catch (error) {
    const e = error as Error;
    console.error("Server Delete Error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
