# Landing page ambient loops

The landing hero and the "spatial engine" bento card play two cinematic loops
generated with **Higgsfield** (model `veo3_1_lite`, 4s, silent, 16:9).

The clips are **not committed** — they could not be fetched from the generation
CDN inside the build environment where this page was authored. Until they are
added, `AmbientVideo` falls back to the pure-CSS scenes in
`components/landing/SceneFallbacks.tsx`, so the page renders correctly with no
missing-asset artifacts.

## Adding the clips

Download each generation and save it here under the exact filename:

| File                      | Content                                                              |
| ------------------------- | -------------------------------------------------------------------- |
| `rwaq-hero-japandi.mp4`   | Slow cinematic dolly through a Japandi living room, morning light      |
| `rwaq-spatial-morph.mp4`  | Orbit over a floor plan morphing from gold wireframe to rendered 3D    |

Source URLs (Higgsfield CDN, from the generating account):

