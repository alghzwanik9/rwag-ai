# Rwaq AI — Engineering Handoff Document

---

## 1) Goal
The core goal of **Rwaq AI (منصة رِواق)** is to deliver an intelligent, Saudi Building Code (SBC 201/1101) compliant interior design platform that bridges natural Arabic prompts and 2D floorplan vision with an interactive 3D physical studio, 8K Depth-guided 1:1 neural rendering, print-ready executive BOQ/blueprint PDF submittals, AR preview, and cloud persistence with shareable client links.

Key product objectives:
* **Cinematic 3D Architectural Walkthrough Landing Page**: Interactive multi-room WebGL showcase telling the full end-to-end Rwaq AI platform journey (Arabic prompt / 2D floorplan -> 3D physical studio -> SBC 201 audit -> 1:1 Neural Render -> SAR BOQ & AR).
* **Interactive 3D Spatial Planning**: Real-time WebGL studio (Three.js / React Three Fiber / Rapier physics) for dimensionally accurate room configuration, SBC walkway clearance verification (`>= 0.90m`), and live SAR budget tracking.
* **2D Floorplan Vision to 3D**: Automatic extraction of room dimensions, wall openings (doors/windows), and furniture zones from CAD blueprints or hand-drawn sketches via Gemini 2.5 Flash Multimodal Vision.
* **Semantic Catalog Grounding (RAG)**: Real-world Saudi market catalog grounded in LanceDB (3,694 IKEA products with SAR pricing and real dimensions).
* **8K Photorealistic Neural Render & Depth ControlNet (1:1)**: Transforming 3D studio captures and real-time normalized depth maps into photorealistic renders with 1:1 geometric fidelity.
* **Interior Layering & Architectural Dressing**: Style-matched decorative layers (rugs, indoor plants, ambient floor lamps, eye-level wall art) strictly respecting SBC walkway clearances.
* **Executive BOQ & Blueprint PDF Submittals**: Multi-page A4 architectural reports with 2D top-down blueprints, exterior dimension witness lines, 3D views, SBC 201 badges, itemized SAR BOQ, and 15% VAT breakdown.
* **Cloud Persistence & Public Shareable 3D Links**: Resilient project saving (Supabase + local JSON fallback), unauthenticated read/clone share links (`/studio?share=<id>`), and `/projects` management dashboard.

---

## 2) Current State
* **Git Branch & Sync**: All Tracks 1–7 implemented and ready on `main` (pushed to `origin/main`).
* **Server Health & Runtime**:
  * **Backend (FastAPI)**: Configured for `http://127.0.0.1:8000` via Uvicorn reload.
  * **Frontend (Next.js 16.4.6 Turbopack)**: Configured for `http://localhost:3000`.
* **Verification Status**:
  * **Frontend TypeScript (`npx tsc --noEmit`)**: Passing — 0 errors (exit code `0`).
  * **Frontend ESLint (Landing Narrative Modules)**: Passing — 0 errors, 0 warnings across all 11 landing files.
  * **3D Showcase Assets**: All 11 unique `.glb` models referenced by the landing walkthrough verified present under `frontend/public/assets/` (`MISSING_GLB_COUNT=0`); itemized landing BOQ verified at `11,090 SAR`.
  * **Backend Test Suite**: 71 tests passing (`pytest tests/`).
* **Delivered Tracks (7/7 Complete)**:
  * `[x]` **Track 1**: Interior Layering & Dressing (Decorative Accessories & Styling Layer)
  * `[x]` **Track 2**: Executive BOQ & Architectural Blueprint PDF Export
  * `[x]` **Track 3**: Project Cloud Save & Shareable 3D Links
  * `[x]` **Track 4**: Depth Pass / Structural Conditioning for Neural AI Render
  * `[x]` **Track 5**: Studio UI/UX & Visual Polish (Header, Lighting, Toolbar & Honest AI)
  * `[x]` **Track 6**: Studio Presets Bar, Architectural Inspiration & Full-Screen Immersion
  * `[x]` **Track 7**: Cinematic Multi-Room 3D Architectural Walkthrough Landing Page

---

## 3) Active Files
### Landing Page — Cinematic Multi-Room 3D Walkthrough
* [`frontend/app/page.tsx`](file:///d:/DEV/ACTIVE/rwaq-ai/frontend/app/page.tsx): Landing route entry and SEO metadata for the full Rwaq AI platform narrative.
* [`frontend/components/landing/narrative/config.ts`](file:///d:/DEV/ACTIVE/rwaq-ai/frontend/components/landing/narrative/config.ts): Dual-suite pavilion dimensions, desktop/mobile 5-Act Catmull-Rom spline keyframes, 18 calibrated `.glb` furniture specs across Zone A & Zone B, Suite 2 Japandi-to-Andalusian morph palettes, refined Arabic copy, and `11,090 SAR` BOQ.
* [`frontend/components/landing/narrative/textures.ts`](file:///d:/DEV/ACTIVE/rwaq-ai/frontend/components/landing/narrative/textures.ts): Zero-dependency procedural PBR `CanvasTexture` generators (honed travertine, Calacatta warm marble, micro-grain plaster bump, oak grain, SBC & sightline floor stamps).
* [`frontend/components/landing/narrative/Furniture.tsx`](file:///d:/DEV/ACTIVE/rwaq-ai/frontend/components/landing/narrative/Furniture.tsx): High-res `.glb` showcase loader with bounding-box mm-to-m floor anchoring, per-asset `Suspense` + `GlbErrorBoundary`, and ref-driven Suite 2 style morph tinting.
* [`frontend/components/landing/narrative/Scene.tsx`](file:///d:/DEV/ACTIVE/rwaq-ai/frontend/components/landing/narrative/Scene.tsx): Connected dual-suite 3D architectural pavilion (Main Living Lounge + walnut/brass entry & inter-room portals + Andalusian/Japandi Majlis Suite with triple arched niches), damped mouse parallax, glowing 3D SBC 201 walkway (`>= 0.90m`) & TV sightline (`3.95m`) audit overlay, and live Suite 2 Style Morph.
* [`frontend/components/landing/narrative/DimensionRail.tsx`](file:///d:/DEV/ACTIVE/rwaq-ai/frontend/components/landing/narrative/DimensionRail.tsx): Left scroll-depth gauge positioned at `top-24 bottom-10` to eliminate overlap with the top-left `"الاستوديو"` button.
* [`frontend/components/landing/narrative/TourControls.tsx`](file:///d:/DEV/ACTIVE/rwaq-ai/frontend/components/landing/narrative/TourControls.tsx): Floating bottom dock with interactive `"جولة تلقائية / Auto-Tour"` toggle and 5 clickable Act indicator dots.
* [`frontend/components/landing/narrative/CopyLayer.tsx`](file:///d:/DEV/ACTIVE/rwaq-ai/frontend/components/landing/narrative/CopyLayer.tsx): 5-Act Arabic storytelling sections, Act 01 pipeline strip, Act 03 SBC 201 & Neufert Certified panel, Act 04 live Style Morph & Depth ControlNet 1:1 badge, and Act 05 live SAR BOQ card (`11,090 SAR`, PDF BOQ & AR highlights, single bold CTA).
* [`frontend/components/landing/narrative/NarrativePage.tsx`](file:///d:/DEV/ACTIVE/rwaq-ai/frontend/components/landing/narrative/NarrativePage.tsx): Native scroll controller, `requestAnimationFrame` Auto-Tour driver (yielding immediately to manual wheel/touch/keyboard input), pointer parallax refs, active act state sync, and WebGL `ErrorBoundary`.
* [`frontend/components/landing/narrative/hud.ts`](file:///d:/DEV/ACTIVE/rwaq-ai/frontend/components/landing/narrative/hud.ts): Zero-re-render DOM & 3D ref bridge interface (`HudRefs`).
* [`frontend/components/landing/narrative/StaticFallback.tsx`](file:///d:/DEV/ACTIVE/rwaq-ai/frontend/components/landing/narrative/StaticFallback.tsx): Reduced-motion / WebGL fallback synced with the 5-Act Arabic copy and single-CTA SAR BOQ card.

### 3D Studio, Cloud Persistence, PDF Submittals & Neural Render
* [`frontend/app/studio/StudioClient.tsx`](file:///d:/DEV/ACTIVE/rwaq-ai/frontend/app/studio/StudioClient.tsx): Interactive 3D studio, Depth Pass snapshot capture, `?share=<id>` / `?project=<id>` loading, clone-to-edit banner, and multi-page PDF assembly.
* [`frontend/app/studio/components/StudioHeader.tsx`](file:///d:/DEV/ACTIVE/rwaq-ai/frontend/app/studio/components/StudioHeader.tsx): Two-zone responsive studio header with Save, Share, Upload 2D, and consolidated Export dropdown.
* [`frontend/app/studio/components/RealRoom.tsx`](file:///d:/DEV/ACTIVE/rwaq-ai/frontend/app/studio/components/RealRoom.tsx): Studio room geometry, contact shadows, windows, doors, and diffused lighting.
* [`frontend/app/studio/components/RealFurnitureLoader.tsx`](file:///d:/DEV/ACTIVE/rwaq-ai/frontend/app/studio/components/RealFurnitureLoader.tsx): Calibrated `.glb` loader with Rapier physics, wall-clamped dragging, and material swapping.
* [`frontend/app/studio/components/RoomPresetsBar.tsx`](file:///d:/DEV/ACTIVE/rwaq-ai/frontend/app/studio/components/RoomPresetsBar.tsx) & [`InspirationModal.tsx`](file:///d:/DEV/ACTIVE/rwaq-ai/frontend/app/studio/components/InspirationModal.tsx): Floating 1-click room templates, shapes bar, and Saudi/Gulf architectural style references.
* [`frontend/app/studio/components/RenderComparisonModal.tsx`](file:///d:/DEV/ACTIVE/rwaq-ai/frontend/app/studio/components/RenderComparisonModal.tsx): 3-mode render comparison (including 1:1 Depth Pass view and honest fallback alert when `FAL_KEY` is unset).
* [`frontend/components/BlueprintCanvas2D.tsx`](file:///d:/DEV/ACTIVE/rwaq-ai/frontend/components/BlueprintCanvas2D.tsx) & [`ExecutivePdfTemplate.tsx`](file:///d:/DEV/ACTIVE/rwaq-ai/frontend/components/ExecutivePdfTemplate.tsx): 2D architectural blueprint engine and A4 RTL executive PDF report.
* [`frontend/lib/localProjectsStore.ts`](file:///d:/DEV/ACTIVE/rwaq-ai/frontend/lib/localProjectsStore.ts), [`frontend/app/api/projects/`](file:///d:/DEV/ACTIVE/rwaq-ai/frontend/app/api/projects/route.ts), & [`frontend/app/projects/page.tsx`](file:///d:/DEV/ACTIVE/rwaq-ai/frontend/app/projects/page.tsx): Dual-tier Supabase + local JSON persistence, public share endpoint, and projects dashboard.
* [`backend/app/services/image_gen_service.py`](file:///d:/DEV/ACTIVE/rwaq-ai/backend/app/services/image_gen_service.py), [`backend/app/services/spatial_solver.py`](file:///d:/DEV/ACTIVE/rwaq-ai/backend/app/services/spatial_solver.py), & [`ai_agent.py`](file:///d:/DEV/ACTIVE/rwaq-ai/ai_agent.py): Fal.ai Depth ControlNet pipeline, honest PIL studio lighting fallback, and SBC spatial/dressing solver.

---

## 4) Changes Made
* **Track 1 — Interior Layering & Dressing**: Added style-curated dressing layers (rugs at `y = 0.005m`, indoor plants, ambient lamps, eye-level wall art) via idempotent `get_missing_dressing_items` while excluding rugs/wall art from floor collision checks.
* **Track 2 — Executive BOQ & Blueprint PDF Export**: Built `BlueprintCanvas2D.tsx` (dimension witness lines, door arcs, SBC corridors) and multi-page RTL A4 `ExecutivePdfTemplate.tsx` with 15% VAT breakdown and `html2canvas`/`jsPDF` export.
* **Track 3 — Cloud Save & Shareable 3D Links**: Implemented dual-tier Supabase + `localProjectsStore.ts` persistence, public `/api/projects/share/[id]` route, in-studio Save/Share flows, client preview banner with "Clone to Edit", and `/projects` dashboard.
* **Track 4 — Depth Pass / 1:1 Structural Conditioning**: Added Three.js linear view-space depth pass capture in `StudioClient.tsx`, 3-column Depth inspection in `RenderComparisonModal.tsx`, and Fal.ai `flux-control-lora-depth` routing (`0.80` conditioning scale).
* **Track 5 — Studio UI/UX & Honest AI**: Decluttered `StudioHeader`, upgraded studio backgrounds and rectangular Lightformer IBL (removing wall orb artifacts), compacted `SceneToolbar`, elevated chatbot trigger, and replaced misleading stock-photo fallbacks with an honest PIL studio-lit preview pass when `FAL_KEY` is absent.
* **Track 6 — Presets Bar, Inspiration & Full-Screen Immersion**: Added floating `RoomPresetsBar`, Saudi/Gulf `InspirationModal`, collapsed `ConversationPanel` by default for full-viewport 3D immersion, and modernized `/studio2d`.
* **Track 7 — Cinematic Multi-Room 3D Walkthrough Landing Page**:
  1. Built dual-suite connected 3D pavilion (Living Lounge + Andalusian/Japandi Majlis) joined by thick walnut-and-brass architectural portals, procedural PBR stone/marble/plaster/oak textures, 3000K warm cove lights, and 18 calibrated `.glb` furniture models.
  2. Choreographed 5-Act centripetal `CatmullRomCurve3` spline camera with damped mouse parallax, animated 3D SBC 201 walkway (`1.12m >= 0.90m`) & TV sightline (`3.95m`) overlays in Act 03, and dynamic Japandi-to-Andalusian material/lighting Style Morph in Act 04.
  3. Fixed left `Scroll Depth` gauge overlap with `"الاستوديو"` button (`top-24`), removed duplicate secondary buttons below the Act 05 pricing card, added floating `TourControls` (`"جولة تلقائية"` Auto-Tour + 5 clickable Act dots), and refined all 5-Act Arabic storytelling copy (`11,090 SAR` live BOQ, PDF BOQ & AR highlights, single bold CTA).
  4. Added `.local_projects_store.json` to `.gitignore` so local runtime test projects stay out of git history.

---

## 5) Failed Attempts
1. **Relying Exclusively on Supabase Remote Host without Local Fallback**:
   * *Attempt*: Directly querying the remote Supabase host from Next.js API routes.
   * *Failure*: Threw `TypeError: fetch failed (getaddrinfo ENOTFOUND)` whenever the remote project was paused/unreachable.
   * *Resolution*: Introduced `localProjectsStore.ts` local-first JSON fallback with automatic remote sync when Supabase is available.
2. **Duplicate `handleSaveProject` Declaration in `StudioClient.tsx`**:
   * *Attempt*: Adding new `handleSaveProject` while a legacy placeholder remained lower in the file.
   * *Failure*: TypeScript threw `TS2451: Cannot redeclare block-scoped variable 'handleSaveProject'`.
   * *Resolution*: Consolidated save + thumbnail capture into a single memoized callback.
3. **Legacy Stock-Photo Test Assertion in `tests/test_image_gen.py`**:
   * *Attempt*: Retaining old Unsplash fallback assertion after introducing honest PIL studio preview.
   * *Failure*: `pytest tests/test_image_gen.py` failed on fallback provider assertion.
   * *Resolution*: Updated test to assert `preview_simulation`, data URL output, and `is_mock_fallback`.
4. **React 19 Compiler ESLint Purity Violations in Upgraded 3D Landing (`CopyLayer.tsx`, `Scene.tsx`)**:
   * *Attempt*: Passing `ref={hud.morphLabel}` directly from a prop object in `StyleMorphBadge`, mutating `.material.opacity` directly on `useDashedLine` hook return values inside `useFrame`, and mutating a `useMemo`-returned `scratch` vector bag inside `useFrame`.
   * *Failure*: `npx eslint` reported 8 errors (`react-hooks/refs` and `react-hooks/immutability`).
   * *Resolution*: Destructured `const { morphLabel } = hud` in `StyleMorphBadge`, routed dashed-line opacity updates through `groupRef.current.traverse` with `userData.auditOpacityScale`, and stored frame scratch vectors/colors in `useRef` — achieving 0 errors and 0 warnings.

---

## 6) Next Steps
1. **Visual & Interactive Browser QA on Live Dev Server (`http://localhost:3000`)**:
   * Inspect all 5 Acts on desktop (`1440×900`) and mobile (`390×844`), verify portal camera clearance during Auto-Tour playback, confirm zero header/gauge overlap, and verify smooth Act 04 Suite 2 Style Morph & Act 05 `11,090 SAR` count-up.
2. **Production Neural Render Activation**:
   * Configure a live `FAL_KEY` in `.env` (and deployment environment secrets) to verify end-to-end Fal.ai `flux-control-lora-depth` 1:1 photorealistic renders against captured 3D studio Depth Maps.
3. **Supabase Production Schema & Auth Sync**:
   * Ensure the production Supabase instance is active with the `projects` table schema (`doors`, `windows`, `scene_items`, `thumbnail_url`) and RLS policies aligned with Clerk JWTs so cloud saves sync seamlessly beyond the local fallback store.
4. **Performance & Production Build Gate**:
   * Run a full `npm run build` in `frontend/` and Lighthouse / WebGL FPS audit (check `.glb` Draco compression opportunities for `sofa_khronos.glb` at 4.1 MB and `coffee_table_art.glb` at 2.95 MB to speed up first-load streaming on slower connections).
5. **E2E Smoke Suite**:
   * Add Playwright E2E checks covering Landing Auto-Tour & Act navigation, `/studio` preset hydration, share link cloning (`/studio?share=<id>`), and PDF BOQ export.
