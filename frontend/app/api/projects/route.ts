import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('projects')
      .select('id, name, saved_at, total_cost')
      .eq('user_id', userId)
      .order('saved_at', { ascending: false });

    if (error) {
      console.error("Supabase Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Map to the existing frontend shape
    const mappedProjects = data.map(proj => ({
      id: proj.id,
      name: proj.name,
      savedAt: proj.saved_at,
      totalCost: proj.total_cost
    }));

    return NextResponse.json({ projects: mappedProjects });
  } catch (error: any) {
    console.error("Server Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
