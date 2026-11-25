import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getLocalProjectById } from '@/lib/localProjectsStore';

/**
 * Public Share Endpoint:
 * Allows clients, contractors, and public viewers to inspect an interactive 3D room
 * and view the BOQ without needing to sign in.
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // 1. Try local resilient store
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
        isPublicShare: true,
      });
    }

    // 2. Try Supabase public lookup
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
          isPublicShare: true,
        });
      }
    } catch (e: any) {
      console.warn("[Project Share GET] Supabase lookup error:", e?.message || e);
    }

    return NextResponse.json(
      { error: "المشروع المطلوب غير متوفر أو انتهت صلاحية الرابط" },
      { status: 404 }
    );
  } catch (error) {
    const e = error as Error;
    console.error("Public Share Load Error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
