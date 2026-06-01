import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, sceneId, glbUrl, sceneItems, customMaterials, totalCost } = body;

    if (!name) {
      return NextResponse.json({ error: "Project name is required" }, { status: 400 });
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
          custom_materials: customMaterials || {},
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
  } catch (error: any) {
    console.error("Server Save Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
