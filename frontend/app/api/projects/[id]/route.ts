import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const { data, error } = await supabase
      .from('projects')
      .select('id,name,scene_id,glb_url,scene_items,custom_materials,total_cost,saved_at')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error("Supabase Load Error:", error);
      return NextResponse.json({ error: "المشروع غير موجود أو لا تملك صلاحية للوصول إليه" }, { status: 404 });
    }

    // Map DB fields to what frontend expects
    return NextResponse.json({
      id: data.id,
      name: data.name,
      sceneId: data.scene_id,
      glbUrl: data.glb_url,
      sceneItems: data.scene_items,
      customMaterials: data.custom_materials,
      totalCost: data.total_cost,
      savedAt: data.saved_at
    });
  } catch (error) {
    const e = error as Error;
    console.error("Server Load Error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
