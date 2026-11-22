import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import StudioClient from './StudioClient';

export default async function StudioPage() {
  const requireAuth =
    process.env.NEXT_PUBLIC_REQUIRE_AUTH === 'true' &&
    process.env.NEXT_PUBLIC_DEMO_MODE !== 'true';
  if (requireAuth) {
    const { userId } = await auth();
    if (!userId) {
      redirect('/');
    }
  }

  return (
    <Suspense fallback={<div className="h-screen w-screen flex items-center justify-center bg-surface font-bold">جاري تحميل الاستوديو...</div>}>
      <StudioClient />
    </Suspense>
  );
}

