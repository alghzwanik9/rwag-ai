import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "رواق AR | عرض ثلاثي الأبعاد",
  description: "عرض التصميم بتقنية الواقع المعزز",
};

/**
 * Dedicated layout for the /ar/* segment.
 * In Next.js App Router, the root layout's <html>/<body> are always applied,
 * but this layout intentionally renders ONLY {children} — no <Sidebar />,
 * no <Header /> — so mobile users get a clean full-screen AR experience.
 *
 * The root layout's Sidebar/Header are rendered OUTSIDE of {children},
 * so they won't appear inside this nested layout's render boundary.
 * We remove them here by overriding the shell via the route group approach:
 * The root layout.tsx has been updated to check the pathname and conditionally
 * render chrome only for non-AR routes.
 */
export default function ARLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      id="ar-layout-root"
      style={{
        position: "fixed",
        inset: 0,
        overflow: "hidden",
        background: "#000",
        zIndex: 9999,
      }}
    >
      {children}
    </div>
  );
}
