# UI Refactor: Floating Popover for Settings

This plan outlines the steps to clean up the Right Sidebar and move the environment, lighting, dimension, and finish controls into a floating popover on the left toolbar.

## Proposed Changes

### [MODIFY] [Sidebar.tsx](file:///d:/DEV/ACTIVE/rwaq-ai/frontend/components/Sidebar.tsx)
- **Remove:** "أجواء المشروع" (Ambient Mode Panel).
- **Remove:** "استوديو الإضاءة المعمارية" (Lighting Studio Panel).
- **Remove:** "أبعاد الغرفة" (Room Dimensions Panel).
- **Remove:** "تشطيبات الغرفة" (Room Finishes Panel).
- **Keep:** "مراقبة التكاليف" (Smart Economy Widget) and "تخصيص لون القطعة" (Dynamic Color Swap).
- Clean up unused Zustand selectors and imports.

### [MODIFY] [page.tsx](file:///d:/DEV/ACTIVE/rwaq-ai/frontend/app/studio/page.tsx)
- **State Management:** Introduce `isSettingsMenuOpen` state to toggle the new popover.
- **Import Selectors:** Import all necessary state setters and values from `useSceneStore` (e.g., `ambientMode`, `coveLightIntensity`, `floorColor`, `roomWidth`, etc.) that were previously in the Sidebar.
- **Left Toolbar Updates:** Add a new icon button (`tune` or `settings`) into the left absolute navigation bar (next to Save and Templates).
- **Floating Popover Component:** Inject the JSX blocks removed from the Sidebar into a scrollable floating panel `div` positioned relative to the left toolbar. Ensure the dark mode UI fits seamlessly.

## User Review Required

Does this layout distribution align with your vision? The Right Sidebar will now solely act as the Project, Catalog, Team navigation, and Budget tracker, while all "Environment/Architectural" tweaks will live under the new Popover on the left.

## Verification Plan
1. Launch the Studio.
2. Confirm the Right Sidebar is clean.
3. Click the new Settings icon on the Left Toolbar.
4. Verify the Popover opens, scrolls correctly, and all sliders/buttons update the 3D scene smoothly without breaking state synchronization.
