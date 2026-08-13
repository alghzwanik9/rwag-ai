'use client';


import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { ContactShadows, Instance, Instances, useScroll } from '@react-three/drei';
import * as THREE from 'three';
import {
  actProgress,
  CIRCULATION,
  COST_TOTAL,
  FLUTE,
  FURNISHINGS,
  MATERIALS,
  ROOM,
  type ActRanges,
  type CameraKey,
} from './config';
import type { HudRefs } from './hud';
import Furniture, { revealModeFor, type RevealMode } from './Furniture';

/** Precomputed per-index so the Act 4 frame loop stays allocation-free. */
const REVEAL: readonly RevealMode[] = FURNISHINGS.map(revealModeFor);

const BRASS = '#C79A4B';

/**
 * The Act 4 plan overlay — an annotation drawn over the room, not a frame
 * built around it. WebGL ignores `linewidth` on `LineBasicMaterial`, so every
 * line is already a one-pixel hairline and weight is carried purely by opacity.
 */
const PLAN_OPACITY = 0.25;

/**
 * Sits clear of the rug's top face (10 mm) so the two never coincide, and low
 * enough to read as lying on the floor rather than floating over the furniture.
 * The overlay also never writes depth, so it can't fight a furniture edge it
 * happens to trace exactly.
 */
const PLAN_Y = 0.018;

type SceneProps = {
  ranges: ActRanges;
  cameraPath: readonly CameraKey[];
  hud: HudRefs;
  actsCount?: number;
};

const halfW = ROOM.width / 2;
const halfD = ROOM.depth / 2;

/** Which pass an object belongs to, read back during the Act 3 cross-fade. */
type FadePass = 'wire' | 'solid';

type WallSpec = {
  id: string;
  x: number;
  z: number;
  /** Rotation about Y that points the plane's +z OUT of the room, so a
   * `BackSide` material culls whichever wall stands between us and the room. */
  rotationY: number;
  length: number;
  fluted?: boolean;
};

/** Order sets the Act 2 growth stagger: back, left, right, front. */
const WALLS: readonly WallSpec[] = [
  { id: 'back', x: 0, z: -halfD, rotationY: Math.PI, length: ROOM.width, fluted: true },
  { id: 'left', x: -halfW, z: 0, rotationY: -Math.PI / 2, length: ROOM.depth },
  { id: 'right', x: halfW, z: 0, rotationY: Math.PI / 2, length: ROOM.depth },
  { id: 'front', x: 0, z: halfD, rotationY: 0, length: ROOM.width },
];

/**
 * One wall as two overlapping passes — an outline of edge lines and a solid
 * material — whose opacities cross-fade across Act 3. Growth is applied to the
 * group so both passes rise from the floor rather than from their centers.
 */
function Wall({ spec }: { spec: WallSpec }) {
  // Edges only: a full `wireframe` material would also draw the triangulation
  // diagonals, which read as noise at this scale.
  const outline = useMemo(
    () => new THREE.EdgesGeometry(new THREE.PlaneGeometry(spec.length, ROOM.wallHeight)),
    [spec.length],
  );

  const slatOffsets = useMemo(() => {
    if (!spec.fluted) return [];
    const pitch = spec.length / FLUTE.count;
    return Array.from({ length: FLUTE.count }, (_, i) => -spec.length / 2 + pitch * (i + 0.5));
  }, [spec.fluted, spec.length]);

  const midHeight = ROOM.wallHeight / 2;

  return (
    <group position={[spec.x, 0, spec.z]} rotation={[0, spec.rotationY, 0]}>
      <lineSegments
        geometry={outline}
        position={[0, midHeight, 0]}
        userData={{ pass: 'wire' satisfies FadePass }}
      >
        <lineBasicMaterial color={MATERIALS.wireframe} transparent opacity={1} />
      </lineSegments>

      {/* Deliberately no `castShadow`: a closed box of shadow-casting walls
          seals the room, and the key light's only way in is over the wall tops
          — which lands as a hard diagonal across the interior. The walls
          receive light and shadow; only what stands inside the room casts. */}
      <mesh
        position={[0, midHeight, 0]}
        receiveShadow
        userData={{ pass: 'solid' satisfies FadePass }}
      >
        <planeGeometry args={[spec.length, ROOM.wallHeight]} />
        <meshStandardMaterial
          color={spec.fluted ? MATERIALS.oakRecess : MATERIALS.plaster}
          roughness={spec.fluted ? 0.78 : 0.97}
          metalness={0}
          side={THREE.BackSide}
          transparent
          opacity={0}
        />
      </mesh>

      {/* Fluting is geometry, not a texture: thin slats stood off the recess
          panel on the room side so the key light rakes across them. */}
      {spec.fluted && (
        <Instances
          limit={FLUTE.count}
          range={FLUTE.count}
          position={[0, 0, -(FLUTE.depth / 2 + 0.005)]}
          castShadow
          receiveShadow
          userData={{ pass: 'solid' satisfies FadePass }}
        >
          <boxGeometry args={[FLUTE.width, ROOM.wallHeight, FLUTE.depth]} />
          <meshStandardMaterial color={MATERIALS.oak} roughness={0.62} metalness={0} transparent opacity={0} />
          {slatOffsets.map((x) => (
            <Instance key={x} position={[x, midHeight, 0]} />
          ))}
        </Instances>
      )}
    </group>
  );
}

export default function Scene({ ranges, cameraPath, hud, actsCount = 5 }: SceneProps) {
  const scroll = useScroll();

  const wallsRef = useRef<THREE.Group>(null);
  const travertineRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const ceilingRef = useRef<THREE.MeshStandardMaterial>(null);
  const footprintsRef = useRef<THREE.Group>(null);
  const furnitureRef = useRef<THREE.Group>(null);
  const circulationRef = useRef<THREE.Group>(null);

  const lookTarget = useMemo(() => new THREE.Vector3(), []);
  const posA = useMemo(() => new THREE.Vector3(), []);
  const posB = useMemo(() => new THREE.Vector3(), []);
  const lookA = useMemo(() => new THREE.Vector3(), []);
  const lookB = useMemo(() => new THREE.Vector3(), []);

  // Geometry built imperatively is memoized so re-renders never leak GPU
  // resources.
  // One slot per furnishing, `null` where a piece hangs on a wall and has no
  // plan outline — the index has to stay aligned with the volumes' stagger.
  const footprintEdges = useMemo(
    () =>
      FURNISHINGS.map((piece) =>
        piece.footprint
          ? new THREE.EdgesGeometry(new THREE.PlaneGeometry(piece.footprint.w, piece.footprint.d))
          : null,
      ),
    [],
  );
  const circulationLines = useMemo(
    () =>
      CIRCULATION.map((path) => {
        const geometry = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(path.from[0], PLAN_Y, path.from[1]),
          new THREE.Vector3(path.to[0], PLAN_Y, path.to[1]),
        ]);
        const line = new THREE.Line(
          geometry,
          new THREE.LineDashedMaterial({
            color: BRASS,
            dashSize: 0.12,
            gapSize: 0.08,
            transparent: true,
            opacity: PLAN_OPACITY,
            depthWrite: false,
          }),
        );
        line.computeLineDistances();
        return line;
      }),
    [],
  );

  useFrame(({ camera }) => {
    const offset = scroll.offset;

    // ── HUD chrome (direct DOM mutation, no React) ──────────────────────
    if (hud.scrollEl.current !== scroll.el) hud.scrollEl.current = scroll.el;
    if (hud.depthText.current) {
      hud.depthText.current.textContent = `${(offset * ROOM.depth).toFixed(1)} m`;
    }
    if (hud.railMarker.current) {
      hud.railMarker.current.style.top = `${(offset * 100).toFixed(2)}%`;
    }
    if (hud.budgetText.current) {
      const t = actProgress(offset, ranges.cost);
      hud.budgetText.current.textContent = Math.round(COST_TOTAL * t).toLocaleString('en-US');
    }
    if (hud.copyLayer?.current) {
      const scrollY = offset * (actsCount - 1) * window.innerHeight;
      hud.copyLayer.current.style.transform = `translate3d(0, ${-scrollY}px, 0)`;
    }

    // ── Camera along the keyframe path ──────────────────────────────────
    let segment = cameraPath.length - 2;
    for (let i = 0; i < cameraPath.length - 1; i += 1) {
      if (offset <= cameraPath[i + 1].at) {
        segment = i;
        break;
      }
    }
    const from = cameraPath[segment];
    const to = cameraPath[segment + 1];
    const t = THREE.MathUtils.smoothstep(offset, from.at, to.at);

    posA.set(...from.pos);
    posB.set(...to.pos);
    camera.position.lerpVectors(posA, posB, t);

    lookA.set(...from.look);
    lookB.set(...to.look);
    lookTarget.lerpVectors(lookA, lookB, t);
    camera.lookAt(lookTarget);

    // ── Act 3: wireframe cross-fades into material ──────────────────────
    const tm = actProgress(offset, ranges.material);

    // ── Act 2: walls grow, staggered ────────────────────────────────────
    const walls = wallsRef.current;
    if (walls) {
      const tb = actProgress(offset, ranges.bounds);
      walls.visible = tb > 0.001;
      walls.children.forEach((wall, i) => {
        const start = i * 0.14;
        const local = THREE.MathUtils.smoothstep(tb, start, start + 0.58);
        wall.scale.y = Math.max(local, 0.0001);
      });
      walls.traverse((object) => {
        const pass = (object.userData as { pass?: FadePass }).pass;
        if (!pass) return;
        const material = (object as Partial<THREE.Mesh>).material;
        if (!material || Array.isArray(material)) return;
        const opacity = pass === 'solid' ? tm : 1 - tm;
        material.opacity = opacity;
        // Hidden rather than fully transparent: a transparent material still
        // writes into the shadow map.
        object.visible = opacity > 0.002;
      });
    }
    if (travertineRef.current) travertineRef.current.opacity = tm;
    if (ceilingRef.current) {
      ceilingRef.current.opacity = tm;
      ceilingRef.current.visible = tm > 0.002;
    }

    // ── Act 4: footprints appear one by one ─────────────────────────────
    const tl = actProgress(offset, ranges.layout);
    const stagger = (i: number) => {
      const start = (i / FURNISHINGS.length) * 0.6;
      return THREE.MathUtils.smoothstep(tl, start, start + 0.35);
    };

    const footprints = footprintsRef.current;
    if (footprints) {
      footprints.visible = tl > 0.001;
      footprints.children.forEach((fp, i) => {
        fp.scale.setScalar(Math.max(stagger(i), 0.0001));
      });
    }

    // Volumes ride the same stagger as the outlines beneath them. They extrude
    // upward from the floor rather than fading, which keeps every material
    // opaque — a transparent reveal would have to sort the sofa's own parts
    // against each other, and would leak the pieces into the shadow map early.
    const furniture = furnitureRef.current;
    if (furniture) {
      furniture.visible = tl > 0.001;
      furniture.children.forEach((piece, i) => {
        const local = Math.max(stagger(i), 0.0001);
        switch (REVEAL[i]) {
          // The rug has no height to extrude, so it spreads across the floor.
          case 'unroll':
            piece.scale.set(local, 1, local);
            break;
          // Wall-mounted: no floor contact to grow from, so it scales in place.
          case 'pop':
            piece.scale.setScalar(local);
            break;
          default:
            piece.scale.set(1, local, 1);
        }
      });
    }
    if (circulationRef.current) {
      circulationRef.current.visible = tl > 0.55;
    }
  });

  return (
    <>
      {/* Late-afternoon rig. Two jobs pull against each other here: nothing may
          fall to pure black, yet the room must not read as an evenly-lit studio
          box. So the ambient terms stay low and a single warm source carries a
          clear angle — the shadow side is lifted, not filled to match. */}
      <ambientLight intensity={0.12} color="#9AA3AE" />

      {/* Sky/ground gradient, kept modest — it lands hardest on the floor, and
          too much of it washes the sand out toward the plaster's value. */}
      <hemisphereLight args={['#B9C3D0', '#8A7358']} intensity={0.3} />

      {/* Key — low raking sun. The elevation is deliberately shallow (y well
          under x) so it grazes the back wall and gives the flutes long
          shadows. The shadow frustum is cropped to the room so a 1024 map
          spends its texels on the flutes instead of empty void. */}
      <directionalLight
        position={[6.2, 2.4, 1.8]}
        intensity={1.3}
        color="#FFD09B"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-radius={3.5}
        shadow-bias={-0.0005}
        shadow-normalBias={0.012}
      >
        <orthographicCamera attach="shadow-camera" args={[-4.2, 4.2, 4.2, -4.2, 0.5, 20]} />
      </directionalLight>

      {/* The sun's pool. A directional light delivers identical irradiance to
          every point of a flat wall, so on its own it can never produce a
          gradient — the back wall came out uniformly lit and the room read
          directionless. This point light sits outside the room on the key's
          side and falls off with distance, so the back wall runs warm and
          bright at its +x end into cool fill at the far end. */}
      <pointLight position={[4.5, 1.8, -0.5]} intensity={6} decay={1.4} color="#FFC98F" />

      {/* Fill on the shadow side. Warm-neutral, NOT sky blue: this is the only
          direct light the right wall's inner face ever sees, and a cool source
          there made the same plaster read as a different, bluer material. */}
      <directionalLight position={[-5.0, 2.6, 3.2]} intensity={0.42} color="#C6BCAE" />

      {/* Rim from behind — the one place cool is allowed to stay cool, since it
          only ever grazes edges. */}
      <directionalLight position={[-2.2, 3.2, -5.6]} intensity={0.25} color="#CFD8E6" />

      {/* Floor bounce — warm light thrown back up off the travertine. Aimed
          upward, so it lifts the ceiling and the undersides without touching
          the floor itself. */}
      <directionalLight position={[0.6, -2.8, 1.4]} intensity={0.28} color="#E8C89B" />

      {/* Act 1 — brass floor grid; scene fog fades it toward the horizon.
          (drei's <Grid> shader throws uniform errors on this three version,
          so a plain gridHelper carries the void instead.) */}
      <gridHelper args={[60, 120, BRASS, BRASS]} position={[0, -0.006, 0]}>
        <lineBasicMaterial attach="material" color={BRASS} transparent opacity={0.22} fog />
      </gridHelper>

      {/* Floor — the Phase 1 slab, cross-fading into travertine in Act 3 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.004, 0]} receiveShadow>
        <planeGeometry args={[ROOM.width, ROOM.depth]} />
        <meshStandardMaterial color={MATERIALS.slab} roughness={0.95} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[ROOM.width, ROOM.depth]} />
        {/* Honed travertine, not polished marble. The clearcoat is a trace of
            sheen only — at 0.45 the specular lobe punched past white and, with
            no environment to reflect, read as bare metal. */}
        <meshPhysicalMaterial
          ref={travertineRef}
          color={MATERIALS.travertine}
          roughness={0.86}
          metalness={0}
          clearcoat={0.05}
          clearcoatRoughness={0.7}
          transparent
          opacity={0}
        />
      </mesh>

      {/* Ceiling — closes the room off from the void overhead. Its normal
          points up and out of the room, so like the walls it is culled the
          moment the camera climbs above it for the Act 4 plan view. It never
          casts: a shadowing lid would put the whole interior in the dark. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, ROOM.wallHeight, 0]}>
        <planeGeometry args={[ROOM.width, ROOM.depth]} />
        <meshStandardMaterial
          ref={ceilingRef}
          color={MATERIALS.ceiling}
          roughness={0.98}
          metalness={0}
          side={THREE.BackSide}
          transparent
          opacity={0}
        />
      </mesh>

      {/* Act 2 — four boundary walls, Act 3 — their materials */}
      <group ref={wallsRef}>
        {WALLS.map((spec) => (
          <Wall key={spec.id} spec={spec} />
        ))}
      </group>

      {/* Grounding contact shadow — sits above the floor so the floor itself
          stays behind its capture camera and never darkens the plate. `far` is
          kept well under the wall height: at full height the walls' own
          silhouettes projected down as a heavy dark frame around the room. */}
      {/* Tight enough to ground a 50 mm desk leg. At 512 over 7.5 m a texel was
          14.6 mm and `blur={3}` smeared the contact over ~44 mm — wider than
          the legs themselves, so the desk read as floating. 1024 over 5.75 m
          puts a texel at 5.6 mm, and the tighter blur keeps the contact under
          the leg instead of around it. */}
      <ContactShadows
        position={[0, 0.008, 0]}
        scale={ROOM.width * 1.15}
        resolution={1024}
        far={1.4}
        blur={1.8}
        opacity={0.42}
        color="#2A1F14"
      />

      {/* Act 4 — furniture footprints as flat outlined rectangles */}
      <group ref={footprintsRef} visible={false}>
        {FURNISHINGS.map((piece, i) => {
          const fp = piece.footprint;
          const edges = footprintEdges[i];
          // Wall-mounted pieces draw nothing, but still hold their slot so the
          // stagger index lines up with the volumes.
          if (!fp || !edges) return <group key={piece.id} />;
          return (
            <group key={piece.id} position={[fp.x, PLAN_Y, fp.z]}>
              {/* Outline only — the tinted fill panel that used to sit inside
                  each rectangle is what made these read as solid frames. */}
              <lineSegments rotation={[-Math.PI / 2, 0, 0]} geometry={edges}>
                <lineBasicMaterial
                  color={BRASS}
                  transparent
                  opacity={PLAN_OPACITY}
                  depthWrite={false}
                />
              </lineSegments>
            </group>
          );
        })}
      </group>

      {/* Act 4 — procedural volumes standing on those footprints */}
      <group ref={furnitureRef} visible={false}>
        <Furniture />
      </group>

      {/* Act 4 — circulation paths */}
      <group ref={circulationRef} visible={false}>
        {circulationLines.map((line, i) => (
          <primitive key={i} object={line} />
        ))}
      </group>
    </>
  );
}
