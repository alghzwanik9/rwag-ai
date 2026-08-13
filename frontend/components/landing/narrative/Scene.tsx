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
  FOOTPRINTS,
  MATERIALS,
  ROOM,
  type ActRanges,
  type CameraKey,
} from './config';
import type { HudRefs } from './hud';

const BRASS = '#C79A4B';

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

      <mesh
        position={[0, midHeight, 0]}
        castShadow
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
  const footprintsRef = useRef<THREE.Group>(null);
  const circulationRef = useRef<THREE.Group>(null);

  const lookTarget = useMemo(() => new THREE.Vector3(), []);
  const posA = useMemo(() => new THREE.Vector3(), []);
  const posB = useMemo(() => new THREE.Vector3(), []);
  const lookA = useMemo(() => new THREE.Vector3(), []);
  const lookB = useMemo(() => new THREE.Vector3(), []);

  // Geometry built imperatively is memoized so re-renders never leak GPU
  // resources.
  const footprintEdges = useMemo(
    () => FOOTPRINTS.map((fp) => new THREE.EdgesGeometry(new THREE.PlaneGeometry(fp.w, fp.d))),
    [],
  );
  const circulationLines = useMemo(
    () =>
      CIRCULATION.map((path) => {
        const geometry = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(path.from[0], 0.03, path.from[1]),
          new THREE.Vector3(path.to[0], 0.03, path.to[1]),
        ]);
        const line = new THREE.Line(
          geometry,
          new THREE.LineDashedMaterial({ color: BRASS, dashSize: 0.12, gapSize: 0.08 }),
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

    // ── Act 4: footprints appear one by one ─────────────────────────────
    const tl = actProgress(offset, ranges.layout);
    const footprints = footprintsRef.current;
    if (footprints) {
      footprints.visible = tl > 0.001;
      footprints.children.forEach((fp, i) => {
        const start = (i / FOOTPRINTS.length) * 0.6;
        const local = THREE.MathUtils.smoothstep(tl, start, start + 0.35);
        fp.scale.setScalar(Math.max(local, 0.0001));
      });
    }
    if (circulationRef.current) {
      circulationRef.current.visible = tl > 0.55;
    }
  });

  return (
    <>
      {/* Three-point rig. Key is a late-afternoon sun raking in from the side,
          fill is a dim cool bounce, rim separates the walls from the void. */}
      <ambientLight intensity={0.14} color="#9FB2CC" />
      <directionalLight
        position={[5.4, 3.3, 2.6]}
        intensity={2.6}
        color="#FFC98C"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0006}
        shadow-normalBias={0.02}
      >
        <orthographicCamera attach="shadow-camera" args={[-7, 7, 7, -7, 0.5, 24]} />
      </directionalLight>
      <directionalLight position={[-4.8, 2.4, 3.4]} intensity={0.55} color="#8FB4E0" />
      <directionalLight position={[-1.8, 3.2, -6.4]} intensity={1.35} color="#DDE7FA" />

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
        {/* Clearcoat over a matte base: sand stone with a wet-polish sheen
            rather than a mirror. */}
        <meshPhysicalMaterial
          ref={travertineRef}
          color={MATERIALS.travertine}
          roughness={0.58}
          metalness={0}
          clearcoat={0.45}
          clearcoatRoughness={0.32}
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
          stays behind its capture camera and never darkens the plate. */}
      <ContactShadows
        position={[0, 0.008, 0]}
        scale={ROOM.width * 1.8}
        resolution={512}
        far={ROOM.wallHeight}
        blur={2.4}
        opacity={0.6}
        color="#050A14"
      />

      {/* Act 4 — furniture footprints as flat outlined rectangles */}
      <group ref={footprintsRef} visible={false}>
        {FOOTPRINTS.map((fp, i) => (
          <group key={fp.labelAr + fp.x + fp.z} position={[fp.x, 0.02, fp.z]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[fp.w, fp.d]} />
              <meshBasicMaterial color={BRASS} transparent opacity={0.14} side={THREE.DoubleSide} />
            </mesh>
            <lineSegments rotation={[-Math.PI / 2, 0, 0]} geometry={footprintEdges[i]}>
              <lineBasicMaterial color={BRASS} />
            </lineSegments>
          </group>
        ))}
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
