import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';
import { Json } from '@/types/supabase';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      sceneId,
      glbUrl,
      sceneItems,
      customMaterials,
      totalCost,
      roomSettings,
    } = body as {
      name: string;
      sceneId: string;
      glbUrl: string | null;
      sceneItems: Json[];
      customMaterials: { [key: string]: Json | undefined };
      totalCost: number;
      roomSettings?: {
        roomWidth?: number;
        roomDepth?: number;
        wallHeight?: number;
        floorColor?: string;
        wallColor?: string;
        ambientMode?: 'morning' | 'rainy' | 'midnight';
        windows?: Json[];
      };
    };

    if (!name) {
      return NextResponse.json({ error: "Project name is required" }, { status: 400 });
    }

    // Store room settings inside the existing JSON custom_materials column under a reserved
    // metadata key to stay 100% compatible with the Supabase `projects` schema & legacy rows.
    const cleanMaterials: { [key: string]: Json | undefined } = { ...(customMaterials || {}) };
    if (roomSettings && typeof roomSettings === 'object') {
      cleanMaterials.__roomSettings = roomSettings as unknown as Json;
    }

    // Insert or update project
    const { data, error } = await supabase
      .from('projects')
      .insert([
        {
          user_id: userId,
          name,
          scene_id: sceneId,
          glb_url: glbUrl,
          scene_items: sceneItems || [],
          custom_materials: cleanMaterials,
          total_cost: totalCost || 0,
        }
      ])
      .select()
      .single();

    if (error) {
      console.error("Supabase Save Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ status: "success", message: "تم الحفظ بنجاح", project_id: data.id });
  } catch (error) {
    const e = error as Error;
    console.error("Server Save Error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
