import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';
import { saveLocalProject } from '@/lib/localProjectsStore';
import { Json } from '@/types/supabase';

export async function POST(req: Request) {
  try {
    let userId: string | null = null;
    try {
      const authObj = await auth();
      userId = authObj.userId;
    } catch {
      // Local dev or guest session
    }

    const effectiveUserId = userId || "local_user";
    const body = await req.json();
    const {
      id: existingId,
      name,
      sceneId,
      glbUrl,
      sceneItems,
      customMaterials,
      totalCost,
      thumbnailUrl,
      roomSettings,
    } = body as {
      id?: string;
      name: string;
      sceneId?: string;
      glbUrl?: string | null;
      sceneItems: any[];
      customMaterials?: { [key: string]: any };
      totalCost?: number;
      thumbnailUrl?: string | null;
      roomSettings?: {
        roomWidth?: number;
        roomDepth?: number;
        wallHeight?: number;
        floorColor?: string;
        wallColor?: string;
        ambientMode?: 'morning' | 'rainy' | 'midnight';
        roomStyle?: string;
        thumbnailUrl?: string | null;
        windows?: any[];
        doors?: any[];
      };
    };

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "اسم المشروع مطلوب" }, { status: 400 });
    }

    // Merge thumbnail and doors into roomSettings
    const cleanRoomSettings = {
      ...(roomSettings || {}),
      thumbnailUrl: thumbnailUrl || roomSettings?.thumbnailUrl || null,
    };

    const cleanMaterials: { [key: string]: any } = { ...(customMaterials || {}) };
    cleanMaterials.__roomSettings = cleanRoomSettings;

    let savedId = existingId;

    // 1. Always write to local resilient storage first
    const localRecord = await saveLocalProject({
      id: existingId,
      user_id: effectiveUserId,
      name: name.trim(),
      scene_id: sceneId || `scene_${Date.now()}`,
      glb_url: glbUrl ?? null,
      scene_items: sceneItems || [],
      custom_materials: cleanMaterials,
      total_cost: totalCost || 0,
      thumbnail_url: cleanRoomSettings.thumbnailUrl,
    });
    savedId = localRecord.id;

    // 2. Attempt to save to Supabase if authenticated and online
    if (userId) {
      try {
        const payloadToInsert: any = {
          user_id: userId,
          name: name.trim(),
          scene_id: sceneId || `scene_${Date.now()}`,
          glb_url: glbUrl ?? null,
          scene_items: (sceneItems || []) as unknown as Json[],
          custom_materials: cleanMaterials as unknown as Json,
          total_cost: totalCost || 0,
        };

        if (existingId) {
          payloadToInsert.id = existingId;
        }

        const { data, error } = await supabase
          .from('projects')
          .upsert([payloadToInsert])
          .select()
          .single();

        if (!error && data?.id) {
          savedId = data.id;
        } else if (error) {
          console.warn("[Projects Save] Supabase sync skipped, saved locally:", error.message);
        }
      } catch (err: any) {
        console.warn("[Projects Save] Supabase error, saved locally:", err?.message || err);
      }
    }

    return NextResponse.json({
      status: "success",
      message: "تم حفظ المشروع بنجاح",
      project_id: savedId,
      share_url: `/studio?share=${savedId}`,
    });
  } catch (error) {
    const e = error as Error;
    console.error("Server Save Error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
