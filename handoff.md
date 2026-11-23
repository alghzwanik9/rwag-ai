# Rwaq AI - Engineering Handoff Document

---

## 1) Goal
The core goal of **Rwaq AI (رواق)** is to deliver an intelligent, Saudi Building Code (SBC 201/1101) compliant interior design platform that bridges interactive CAD/3D spatial planning with 8K photorealistic neural AI rendering. 

Key product objectives include:
* **Interactive 3D Spatial Planning**: Real-time WebGL studio (Three.js / React Three Fiber / Rapier physics) for dimensionally accurate room configuration, SBC walkway clearance verification ($\ge 0.90\text{m}$), and live budget tracking.
* **2D Floorplan Vision to 3D**: Automatic extraction of room dimensions, wall openings (doors and windows), and furniture zones from CAD blueprints or hand-drawn sketches using Gemini 2.5 Flash Multimodal Vision.
* **Semantic Catalog Grounding (RAG)**: Real-world Saudi market integration grounded in LanceDB with 3,694 IKEA products with SAR pricing and dimensions.
* **8K Photorealistic AI Neural Render**: Transforming lightweight 3D compositions and depth maps into architectural-grade photorealistic photographs with natural lighting and material depth.
* **UX & Stability Polish**: Eliminating runtime crashes, providing direct tactile object manipulation in the 3D viewport, fixing responsive layout bottlenecks, and presenting clean architectural room aesthetics.

---

## 2) Current State
* **Server Health & Runtime**:
  * **Backend (FastAPI)**: Running smoothly at `http://127.0.0.1:8000` via Uvicorn reload daemon.
  * **Frontend (Next.js 16.4.6 Turbopack)**: Running at `http://localhost:3000` with hot-module replacement active.
* **Test & Build Verification**:
  * **Backend Tests**: 62 tests passing (`62 passed in 17.31s` via `pytest tests/`).
  * **Frontend Type Checking**: 0 TypeScript errors (`npx --prefix frontend tsc -p frontend/tsconfig.json --noEmit` exits with code `0`).
* **Resolved Issues**:
  * **React 19 / Drei Unmount Crash**: Completely eliminated the fatal `Attempted to synchronously unmount a root while React was already rendering` error caused by Drei's `<Html>` inside R3F.
  * **Studio 2D Layout Distortion**: Fixed squished cards in `/studio2d` gallery; cards now dynamically adjust using an auto-fill responsive grid (`minmax(280px, 1fr)`) with strict `aspect-4/3` thumbnail ratios.
  * **In-Scene Furniture Controls**: Implemented a floating 2D contextual control dock directly above the main toolbar upon selecting any furniture item, providing instant rotation (`+45°` / `-45°`), 10cm fine directional nudging, material customization, and deletion.
  * **Asset Library 3D Model Mapping**: Catalog products (beds, dining tables, wardrobes, bookcases, TV benches) now resolve dynamically to authentic 3D `.glb` assets from the high-res and Kenney kits rather than falling back to an armchair.
  * **Architectural Room Aesthetics**: Cleaned up `RealRoom.tsx` by removing the clunky hardcoded slat block, removing the neon yellow cove strip, replacing the giant 3m concrete slab with a sleek dark pedestal (`#22242B`), and tuning floor satin roughness.

---

## 3) Active Files
* [`frontend/app/studio/components/RealFurnitureLoader.tsx`](file:///d:/DEV/ACTIVE/rwaq-ai/frontend/app/studio/components/RealFurnitureLoader.tsx): Handles physical & procedural 3D model loading, boundary clamping, and manual transform synchronization; stripped of Drei `<Html>` roots to guarantee 100% stability.
* [`frontend/app/studio/StudioClient.tsx`](file:///d:/DEV/ACTIVE/rwaq-ai/frontend/app/studio/StudioClient.tsx): Main 3D studio client coordinating R3F canvas, Rapier physics, contextual Selected Asset Dock, SceneToolbar, floorplan vision modal, and AI render modal.
* [`frontend/app/studio/components/SceneToolbar.tsx`](file:///d:/DEV/ACTIVE/rwaq-ai/frontend/app/studio/components/SceneToolbar.tsx): Central bottom floating toolbar with direct access to library ("إضافة أثاث من المكتبة"), 2D-to-3D floorplan vision upload, AI render, walkway heatmap, and undo/redo.
* [`frontend/app/studio/components/RealRoom.tsx`](file:///d:/DEV/ACTIVE/rwaq-ai/frontend/app/studio/components/RealRoom.tsx): Architectural room shell rendering walls, floor, baseboards, doors, windows, and subtle cove lighting.
* [`frontend/app/studio2d/page.tsx`](file:///d:/DEV/ACTIVE/rwaq-ai/frontend/app/studio2d/page.tsx): 2D AI studio page featuring chat ideation, prompt chips, and responsive auto-fill generated design gallery.
* [`frontend/app/studio/components/RenderComparisonModal.tsx`](file:///d:/DEV/ACTIVE/rwaq-ai/frontend/app/studio/components/RenderComparisonModal.tsx): Side-by-side & interactive split slider modal comparing 3D viewport snapshot with 8K photorealistic AI neural render.
* [`frontend/components/IkeaAssetsLibrary.tsx`](file:///d:/DEV/ACTIVE/rwaq-ai/frontend/components/IkeaAssetsLibrary.tsx): In-studio modal for browsing and searching 3,694 IKEA products with semantic 3D template matching.
* [`frontend/app/assets/page.tsx`](file:///d:/DEV/ACTIVE/rwaq-ai/frontend/app/assets/page.tsx): Standalone asset library page with remote asset normalization and fallback resolution.
* [`frontend/components/Header.tsx`](file:///d:/DEV/ACTIVE/rwaq-ai/frontend/components/Header.tsx): Global navigation header with dynamic page titles and stylized user profile pill.
* [`backend/app/api/routes.py`](file:///d:/DEV/ACTIVE/rwaq-ai/backend/app/api/routes.py): FastAPI endpoints for floorplan-to-3d vision pipeline, IKEA catalog, AI generation, and neural render.
* [`backend/app/schemas.py`](file:///d:/DEV/ACTIVE/rwaq-ai/backend/app/schemas.py): Pydantic validation models for floorplan vision extraction and spatial responses.
* [`backend/app/ai_agent.py`](file:///d:/DEV/ACTIVE/rwaq-ai/backend/app/ai_agent.py): Gemini 2.5 Flash multimodal vision extractor and prompt generation logic.

---

## 4) Changes Made
1. **Eliminated Drei `<Html>` Unmount Crash**:
   - Removed transient loading and error `<Html>` tags, as well as the in-canvas contextual HUD `<Html>` inside `RealFurnitureLoader.tsx`. Replaced with zero-DOM procedural 3D bounding geometry during loading, preventing React 19 root unmount collisions.
2. **Added 2D Selected Asset Control Dock**:
   - Built an accessible, responsive HTML dock in `StudioClient.tsx` that floats right above the toolbar upon selecting any furniture item, exposing rotation (`45°+`, `45°-`), fine directional nudge buttons, material palette access, and delete.
3. **Direct Library Button on Main Toolbar**:
   - Added "إضافة أثاث من المكتبة" (`chair` icon) directly onto `SceneToolbar.tsx`, eliminating the need to search through collapsed drawer menus.
4. **Semantic 3D Model Mapping in Library**:
   - Integrated `resolveItem` with `IKEA_TEMPLATES` inside `IkeaAssetsLibrary.tsx` and `frontend/app/assets/page.tsx`. Beds, tables, wardrobes, TV stands, and bookcases now load their authentic `.glb` models rather than defaulting to `armchair_wood.glb`.
5. **Refined Studio 2D Layout**:
   - Replaced static breakpoint columns in `studio2d/page.tsx` with `grid-cols-[repeat(auto-fill,minmax(280px,1fr))]`, fixed card aspect ratios to `aspect-4/3`, and gave the chat column flexible width (`w-full md:w-[380px] lg:w-[420px]`).
6. **Cleaned Architectural Room Finishes**:
   - Removed the hardcoded 18-slat brown accent panel in `RealRoom.tsx`, replaced the unshaded yellow cove light with a recessed crown trim and warm point light, scaled down the pedestal to a clean carbon trim (`#22242B`), and tuned floor satin roughness to `0.35`.
7. **Polished Render Comparison Modal**:
   - Expanded the footer to `max-w-2xl` with flexible wrapping, an amber server status badge, and `ltr font-mono` formatting for architectural prompts.

---

## 5) Failed Attempts
1. **Retaining `<Html>` for Error/Selection HUD in `RealFurnitureLoader`**:
   - *Attempt*: Kept Drei's `<Html>` only for error or selection HUD inside R3F.
   - *Failure*: React 19's concurrent root reconciliation still threw `Attempted to synchronously unmount a root while React was already rendering` whenever an item was deselected, moved, or deleted.
   - *Resolution*: Completely removed Drei `<Html>` from the R3F canvas and rendered all HUDs as pure HTML overlays in `StudioClient.tsx`.
2. **Windows PowerShell `&&` Command Chaining**:
   - *Attempt*: Executed `cd frontend && npx tsc --noEmit`.
   - *Failure*: PowerShell 5.1 parser error (`The token '&&' is not a valid statement separator`).
   - *Resolution*: Switched to prefix-based single commands: `npx --prefix frontend tsc -p frontend/tsconfig.json --noEmit`.
3. **Passing Undeclared `category` to `AIResponseItem`**:
   - *Attempt*: Passed `category` directly in `resolveItem({ asset_id, category, ... })`.
   - *Failure*: TypeScript compiler error `error TS2353: Object literal may only specify known properties, and 'category' does not exist in type 'AIResponseItem'`.
   - *Resolution*: Passed the category into the token extraction pipeline via `asset_id: (raw.category || name || id).toLowerCase()`, which properly matches canonical synonyms.
4. **Static Breakpoint Grid in Studio 2D Gallery**:
   - *Attempt*: Relied on Tailwind's `md:grid-cols-2`.
   - *Failure*: Because the sidebar (`280px`) and chat pane (`420px`) consume viewport width, the remaining gallery space on laptop screens was ~240px, forcing each card into a squished 106px sliver.
   - *Resolution*: Implemented container-agnostic auto-fill CSS grid with `minmax(280px, 1fr)`.

---

## 6) Next Steps
1. **Interior Layering & Dressing (Decorations & Styling)**:
   - Add interior styling presets and accessories (indoor plants, Persian & modern rugs, wall art, floor lamps, table decor) to prevent scenes from looking barren or purely geometric.
2. **Executive BOQ & Blueprint PDF Export**:
   - Build an official one-click PDF export containing the 2D dimensional floorplan, complete bill of quantities (BOQ) with SAR prices and IKEA purchase links, and an SBC compliance certification badge.
3. **Project Cloud Save & Share**:
   - Implement persistent project saving in database with a unique sharable link, allowing clients and contractors to view and walk through designs in 3D.
4. **Fine-Tuned Depth Control for AI Render**:
   - Integrate depth pass export (ControlNet depth map) into the backend FAL/Gemini render pipeline for 1:1 camera angle and spatial accuracy matching.
