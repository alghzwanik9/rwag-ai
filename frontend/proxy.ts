import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Only enforce Clerk sign-in redirect on studio routes when NEXT_PUBLIC_REQUIRE_AUTH=true is explicitly set.
// Otherwise allow direct access (and RSC prefetching from /) without cross-origin Clerk redirect errors.
const isProtectedRoute = createRouteMatcher(['/studio(.*)', '/studio2d(.*)'])

export default clerkMiddleware(async (auth, req) => {
  const requireAuth =
    process.env.NEXT_PUBLIC_REQUIRE_AUTH === 'true' &&
    process.env.NEXT_PUBLIC_DEMO_MODE !== 'true'
  if (requireAuth && isProtectedRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
