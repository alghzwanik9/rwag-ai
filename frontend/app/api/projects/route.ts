import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/supabase';

type ProjectSummaryRow = Pick<
  Database['public']['Tables']['projects']['Row'],
  'id' | 'name' | 'saved_at' | 'total_cost'
>;

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ projects: [] });
    }

    // Wrap query with a 3-second timeout to prevent long DNS hanging when offline
    const fetchPromise = supabase
      .from('projects')
      .select('id,name,saved_at,total_cost')
      .eq('user_id', userId)
      .order('saved_at', { ascending: false });

    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error('Supabase request timeout')), 2500);
    });

    let data: ProjectSummaryRow[] | null = null;
    let error: { message?: string } | null = null;
    try {
      const result = await Promise.race([fetchPromise, timeoutPromise]);
      data = result.data;
      error = result.error;
    } finally {
      if (timeoutId !== undefined) clearTimeout(timeoutId);
    }

    if (error || !data) {
      console.warn("Supabase load skipped or offline:", error?.message || "no data");
      return NextResponse.json({ projects: [] });
    }

    const mappedProjects = data.map((proj: ProjectSummaryRow) => ({
      id: proj.id,
      name: proj.name,
      savedAt: proj.saved_at,
      totalCost: proj.total_cost
    }));

    return NextResponse.json({ projects: mappedProjects });
  } catch (error) {
    console.warn("Projects fallback:", error instanceof Error ? error.message : error);
    return NextResponse.json({ projects: [] });
  }
}
