import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '500';

    const res = await fetch(`http://127.0.0.1:8000/api/v1/assets?limit=${limit}`, {
      // Avoid caching to always get the latest data
      cache: 'no-store'
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Failed to fetch from backend:', res.status, errorText);
      return NextResponse.json({ error: 'Failed to fetch catalog from backend' }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in /api/furniture:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
