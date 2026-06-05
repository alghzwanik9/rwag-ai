import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import StudioClient from './StudioClient';

export default async function StudioPage() {
  const { userId } = await auth();
  
  if (!userId) {
    // Optionally redirect to a sign-in page, or clerk's default
    // Using Clerk's sign-in route (can be just / or they have a button)
    redirect('/');
  }

  return <StudioClient />;
}
