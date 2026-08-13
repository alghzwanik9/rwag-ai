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

```
rwaq-hero-japandi.mp4
https://d8j0ntlcm91z4.cloudfront.net/user_3Gsgt63Qx9k1i05hLltoYdEmtiB/hf_20260807_000154_61663af9-a4fd-455d-a43a-2ee20b68bfde.mp4

rwaq-spatial-morph.mp4
https://d8j0ntlcm91z4.cloudfront.net/user_3Gsgt63Qx9k1i05hLltoYdEmtiB/hf_20260807_000045_becc820f-58fe-4e93-9136-7d494f12a396.mp4
```

No code change is needed — `lib/landing-data.ts` already points at these paths.

## Serving them from elsewhere

To host the clips on a CDN or bucket instead, set either env var and the
component will use it when the local file is absent:

```
NEXT_PUBLIC_RWAQ_HERO_VIDEO=https://…/hero.mp4
NEXT_PUBLIC_RWAQ_MORPH_VIDEO=https://…/morph.mp4
```

## Encoding notes

`AmbientVideo` plays two copies of the clip in alternation and crossfades the
seam, so a short loop reads as a continuous shot. Keep clips short and small:

- H.264 (baseline/main) MP4 for the widest playback support
- 720p is plenty — the video sits behind gradients and a grain overlay
- strip the audio track (`-an`); the elements are muted regardless
- aim for < 2 MB each so the hero paints quickly on mobile

```sh
ffmpeg -i input.mp4 -an -vf scale=1280:-2 -c:v libx264 -crf 26 -preset slow \
  -movflags +faststart rwaq-hero-japandi.mp4
```
