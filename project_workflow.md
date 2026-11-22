# Rwaq AI (منصة رواق) — Architecture & Project Workflow

This document tracks the active system architecture, verified implementation milestones, and engineering workflow for **Rwaq AI**.

---

## 1. Active System Architecture

Rwaq AI executes **browser-side real-time 3D scene assembly** backed by a structured generative AI and bilingual vector retrieval API — avoiding server-side headless render latency on the interactive path:

1. **Frontend Interactive Studio (`frontend/`):**
   - **Framework:** `Next.js 16.4.6` (App Router, Arabic RTL), `React 19.3.1`, `TypeScript 5`, `Tailwind CSS v4`, `Zustand 5`.
   - **3D & Physics:** `Three.js 0.182`, `@react-three/fiber 9.8.2`, `@react-three/drei 10.7.7`, `@react-three/rapier 2.2.0`.
   - **Offline-Resilient Visuals:** Procedural `Lightformer` studio lighting (zero external HDR CDN dependency) + 10 local high-detail GLB models (`>1 MB` each in `frontend/public/assets/`) + 8 synthetic GLBs.
   - **Commerce & Export:** Live SAR budget estimation, direct retail links (`store_url`), PDF Quote export (`QuoteExportButton` via `jsPDF` + `html2canvas`), Bill of Materials (`PrintReport`), and mobile AR viewer (`/ar` via `@google/model-viewer`).
2. **Backend Orchestration API (`backend/app/main.py` & `backend/app/api/routes.py`):**
   - **Framework:** `FastAPI 0.115.6` + `Uvicorn 0.34.0` + `Pydantic 2.10.4`.
   - **Generative AI:** `Gemini 2.5 Flash` (`google-genai`) generating strict `FullDesignOutput` JSON layouts from Arabic/English text prompts and optional base64 Vision reference images, guided by Saudi Building Code (SBC) & Neufert architectural context.
   - **Bilingual Vector RAG:** `LanceDB 0.17.0` (`384`-dim embeddings) indexing **3,694 IKEA catalog records** plus architectural standards.
   - **Deterministic Spatial Audit:** `audit_spatial_layout` (`POST /api/v1/spatial-audit`) computing a `[50–100]` compliance score across occupancy density (`15%–45%`), sofa–coffee table edge-to-edge clearance (`0.30–0.65m`), TV viewing distance (`>= 1.5m`), and 2D AABB collision overlap (`> 0.05m`, excluding rugs).
   - **2D Studio Generation:** `POST /api/v1/studio/generate` powered by `Fal.ai Flux Schnell`.
3. **Cloud Persistence & Authentication:**
   - `Clerk` for user authentication (with explicit opt-in `NEXT_PUBLIC_DEMO_MODE=true` for local judge evaluation of `/studio` and `/studio2d`, while server-side project saving stays authenticated).
   - `Supabase` PostgreSQL for saving and reloading complete 3D projects (`ProjectsModal` & `/projects`).
4. **Optional Offline Blender Utility (`orchestrator.py` / `blender_generator.py`):**
   - Maintained strictly as a standalone offline `.blend`/`.glb` export script when a local Blender executable is configured (`BLENDER_EXECUTABLE`). It is **not** in the active `/api/generate-room` live request path.

---

## 2. Key API Endpoints

| Method & Endpoint | Responsibility |
| :--- | :--- |
| `POST /api/generate-room` | Prompt + optional Vision image → Gemini 2.5 Flash structured layout, normalized mm dimensions, `RealRoom` windows, wall/floor colors, and ambient mood. |
| `POST /api/v1/chat` | Conversational Arabic/English interior design assistant updating active 3D scene items. |
| `POST /api/v1/spatial-audit` | Deterministic Neufert/SBC spatial compliance audit (`audit_spatial_layout`) returning score `[50–100]`, density %, passed checks, and Arabic recommendations. |
| `GET /api/v1/ikea-catalog` / `GET /api/furniture` | Paginated IKEA catalog records from LanceDB with SAR pricing, dimensions, and `store_url`. |
| `POST /api/recommendations/alternatives` | Smart lower-cost furniture alternatives from LanceDB given an item ID and remaining SAR budget. |
| `POST /api/v1/studio/generate` | 2D photorealistic interior renders via `Fal.ai Flux Schnell`. |
| `GET /api/v1/architectural-standards` | Structured architectural design standards catalog from LanceDB. |
| `GET /api/v1/db-check` | Live LanceDB health check and per-table row counts. |

---

## 3. Completed Milestones

### Phase 1 — Arabic RTL Experience & Interactive 3D Studio
- [x] Built full Arabic RTL App Router architecture in `Next.js 16.4.6`, `React 19.3.1`, and `Tailwind CSS v4`.
- [x] Implemented interactive WebGL studio (`/studio`) with `R3F 9.8.2`, `RealRoom` walls/windows, `RealFurnitureLoader`, `MaterialPalette`, and `Rapier 2.2.0` floor-snapped physics (`t_y = 0.0`).
- [x] Removed external HDR CDN failure points in favor of procedural offline `Lightformer` lighting and 10 high-detail local GLB assets (`1.4–4.1 MB`).

### Phase 2 — Generative AI, Bilingual RAG & Spatial Audit
- [x] Integrated `Gemini 2.5 Flash` Vision + strict Pydantic structured output (`FullDesignOutput`) with canonical asset IDs and mm dimension normalization.
- [x] Indexed 3,694 IKEA catalog records and architectural standards in `LanceDB` (`384`-dim bilingual RAG) with live budget alternative recommendations.
- [x] Built deterministic `audit_spatial_layout` engine + `SpatialAuditModal` UI reporting mathematical occupancy, clearances, TV sightlines, and 2D AABB collisions.

### Phase 3 — Curated Showroom, 2D Studio, Cloud Persistence & Export
- [x] Shipped `/maarad` with 6 ready-to-edit 3D presets and verified SAR costing (`majlis-andalus 13,070 SAR`, `living-japandi 8,725 SAR`, `office-exec 5,050 SAR`, `studio-minimalist 5,030 SAR`, `dining-terrace 4,495 SAR`, `bedroom-serenity 4,135 SAR`).
- [x] Shipped `/library` catalog browser, `/studio2d` (`Fal.ai Flux Schnell`), `/ar` QR model viewer, `QuoteExportButton` (PDF), `PrintReport` (BOM), and `Supabase` + `Clerk` cloud project persistence.
- [x] Added automated backend verification (`pytest tests/ -v`) and frontend contract verification (`node --experimental-strip-types tests/verify_frontend_contracts.mjs`).

---

## 4. Verification Workflow

```powershell
# 1. Backend tests (FastAPI routes, Gemini normalization, spatial audit math)
.\.venv\Scripts\python.exe -m pytest tests/ -v

# 2. Frontend contract tests
node --experimental-strip-types tests/verify_frontend_contracts.mjs

# 3. Production frontend build
cd frontend && npm run build

# 4. Presentation deck regeneration (single source of truth)
.\.venv\Scripts\python.exe generate_pptx.py
```
