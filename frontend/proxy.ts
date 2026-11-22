import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Protect 3D and 2D studio routes (guarding FAL_KEY spend) unless local demo mode is explicitly enabled.
// Note: /api/projects/save enforces Clerk auth server-side regardless of demo mode.
const isProtectedRoute = createRouteMatcher(['/studio(.*)', '/studio2d(.*)'])

export default clerkMiddleware(async (auth, req) => {
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
  if (!isDemoMode && isProtectedRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
