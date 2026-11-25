'use client';

import { useEffect, useMemo, useRef, type MutableRefObject, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { ContactShadows, Environment, Instance, Instances, Lightformer } from '@react-three/drei';
import * as THREE from 'three';
import {
  actProgress,
  FLUTE,
  MATERIALS,
  PAVILION,
  SUITE2_MORPH,
  type ActRanges,
  type SplineKeyframe,
} from './config';
import Furniture from './Furniture';
import { createArchitecturalTextures, type ArchitecturalTextureSet } from './textures';

export interface SceneProps {
  ranges: ActRanges;
  splinePath: readonly SplineKeyframe[];
  scrollEl: RefObject<HTMLElement | null>;
  pointerRef: MutableRefObject<{ x: number; y: number }>;
  morphFactorRef: MutableRefObject<number>;
  onHudFrame?: (offset: number, costProgress: number, morphProgress: number) => void;
}

const HALF_W = PAVILION.totalWidth / 2; // 6.1
const HALF_D = PAVILION.depth / 2; // 2.7
const WALL_H = PAVILION.wallHeight; // 3.1
const WALL_T = PAVILION.wallThickness; // 0.22
const SUITE_W = PAVILION.totalWidth / 2; // 6.1 per wing (outer to center)

/**
 * Reusable dashed architectural line built once and disposed cleanly.
 */
function useDashedLine(
  points: readonly [number, number, number][],
  color: string,
  opacityScale: number,
  dashSize = 0.14,
  gapSize = 0.08,
): THREE.Line {
  const line = useMemo(() => {
    const geom = new THREE.BufferGeometry().setFromPoints(
      points.map((p) => new THREE.Vector3(p[0], p[1], p[2])),
    );
    const mat = new THREE.LineDashedMaterial({
      color,
      dashSize,
      gapSize,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    mat.userData.auditOpacityScale = opacityScale;
    const obj = new THREE.Line(geom, mat);
    obj.computeLineDistances();
    return obj;
  }, [points, color, opacityScale, dashSize, gapSize]);

  useEffect(() => {
    return () => {
      line.geometry.dispose();
      (line.material as THREE.Material).dispose();
    };
  }, [line]);

  return line;
}

/**
 * Zone A Back Wall: Recessed walnut backing + 42 fluted oak slats + warm 3000K
 * cove washes + 65" architectural media screen.
 */
function LivingFeatureWall({ textures }: { textures: ArchitecturalTextureSet }) {
  const slatWidthSpan = SUITE_W - 0.5;
  const slatOffsets = useMemo(() => {
    const pitch = slatWidthSpan / FLUTE.count;
    return Array.from({ length: FLUTE.count }, (_, i) => -slatWidthSpan / 2 + pitch * (i + 0.5));
  }, [slatWidthSpan]);

  return (
    <group position={[PAVILION.livingCenterX, 0, -HALF_D]}>
      {/* Solid structural back wall */}
      <mesh position={[0, WALL_H / 2, -WALL_T / 2]} receiveShadow castShadow>
        <boxGeometry args={[SUITE_W, WALL_H, WALL_T]} />
        <meshStandardMaterial color={MATERIALS.oakRecess} roughness={0.82} metalness={0.04} />
      </mesh>

      {/* Instanced solid oak fluted slats */}
      <Instances
        limit={FLUTE.count}
        range={FLUTE.count}
        position={[0, WALL_H / 2, FLUTE.depth / 2 + 0.004]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[FLUTE.width, WALL_H - 0.18, FLUTE.depth]} />
        <meshStandardMaterial
          map={textures.oakGrainMap}
          color="#C9A882"
          roughness={0.62}
          metalness={0.04}
        />
        {slatOffsets.map((x) => (
          <Instance key={x} position={[x, 0, 0]} />
        ))}
      </Instances>

      {/* Warm 3000K architectural top & bottom cove glow strips */}
      <mesh position={[0, WALL_H - 0.08, 0.06]}>
        <boxGeometry args={[SUITE_W - 0.4, 0.025, 0.025]} />
        <meshStandardMaterial
          color="#FFE3BA"
          emissive="#FFB963"
          emissiveIntensity={2.1}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0, 0.06, 0.06]}>
        <boxGeometry args={[SUITE_W - 0.6, 0.018, 0.018]} />
        <meshStandardMaterial
          color="#FFE3BA"
          emissive="#FFB963"
          emissiveIntensity={1.2}
          toneMapped={false}
        />
      </mesh>

      {/* Mounted 65" Architectural TV Panel + Brushed Brass Bezel */}
      <group position={[-0.4, 1.24, 0.085]}>
        <mesh castShadow>
          <boxGeometry args={[1.52, 0.87, 0.036]} />
          <meshStandardMaterial color={MATERIALS.brass} roughness={0.32} metalness={0.82} />
        </mesh>
        <mesh position={[0, 0, 0.012]}>
          <boxGeometry args={[1.47, 0.82, 0.024]} />
          <meshPhysicalMaterial
            color={MATERIALS.screen}
            roughness={0.18}
            metalness={0.15}
            clearcoat={0.5}
            clearcoatRoughness={0.2}
          />
        </mesh>
      </group>
    </group>
  );
}

/**
 * Zone A Left Wall: Honed plaster wall with recessed panoramic dusk window,
 * matte dark bronze mullions, and framed desert architectural canvas art.
 */
function LivingLeftWall({ textures }: { textures: ArchitecturalTextureSet }) {
  return (
    <group position={[-HALF_W, 0, 0]}>
      {/* Main solid wall body */}
      <mesh position={[-WALL_T / 2, WALL_H / 2, 0]} receiveShadow castShadow>
        <boxGeometry args={[WALL_T, WALL_H, PAVILION.depth + WALL_T]} />
        <meshStandardMaterial
          color={MATERIALS.plasterLiving}
          bumpMap={textures.plasterBump}
          bumpScale={0.004}
          roughness={0.92}
          metalness={0.02}
        />
      </mesh>

      {/* Slim walnut baseboard */}
      <mesh position={[0.015, 0.045, 0]} receiveShadow>
        <boxGeometry args={[0.025, 0.09, PAVILION.depth - 0.1]} />
        <meshStandardMaterial color={MATERIALS.walnut} roughness={0.55} metalness={0.08} />
      </mesh>

      {/* Recessed Architectural Panoramic Window (back-left) */}
      <group position={[0.02, 1.58, -1.22]} rotation={[0, Math.PI / 2, 0]}>
        <mesh>
          <boxGeometry args={[1.95, 2.05, 0.07]} />
          <meshStandardMaterial color={MATERIALS.windowMullion} roughness={0.35} metalness={0.75} />
        </mesh>
        {/* Warm dusk twilight backlit glass */}
        <mesh position={[0, 0, 0.02]}>
          <planeGeometry args={[1.84, 1.94]} />
          <meshStandardMaterial
            color="#263B59"
            emissive="#4A6B8C"
            emissiveIntensity={0.45}
            roughness={0.15}
            metalness={0.2}
          />
        </mesh>
        {/* Center vertical & transom mullions */}
        <mesh position={[0, 0, 0.032]}>
          <boxGeometry args={[0.035, 1.94, 0.03]} />
          <meshStandardMaterial color={MATERIALS.windowMullion} roughness={0.35} metalness={0.8} />
        </mesh>
        <mesh position={[0, 0.42, 0.032]}>
          <boxGeometry args={[1.84, 0.03, 0.03]} />
          <meshStandardMaterial color={MATERIALS.windowMullion} roughness={0.35} metalness={0.8} />
        </mesh>
      </group>

      {/* Framed Architectural Canvas Art (front-left) */}
      <group position={[0.028, 1.56, 1.15]} rotation={[0, Math.PI / 2, 0]}>
        <mesh castShadow>
          <boxGeometry args={[1.18, 0.88, 0.042]} />
          <meshStandardMaterial color={MATERIALS.walnut} roughness={0.48} metalness={0.12} />
        </mesh>
        <mesh position={[0, 0, 0.022]}>
          <planeGeometry args={[1.08, 0.78]} />
          <meshStandardMaterial color="#E9E0D1" roughness={0.9} />
        </mesh>
        {/* Geometric brass & terracotta architectural relief composition */}
        <mesh position={[-0.22, 0.04, 0.026]}>
          <planeGeometry args={[0.38, 0.56]} />
          <meshStandardMaterial color="#B57B50" roughness={0.82} />
        </mesh>
        <mesh position={[0.24, -0.06, 0.026]}>
          <circleGeometry args={[0.22, 32]} />
          <meshStandardMaterial color="#233145" roughness={0.78} />
        </mesh>
      </group>
    </group>
  );
}

/**
 * Zone A South Front Wall featuring the physical 2.3m × 2.55m Entry Portal
 * through which the Act 02 camera smoothly glides inside the Living Lounge.
 */
function LivingEntryPortalWall({ textures }: { textures: ArchitecturalTextureSet }) {
  // Zone A spans x ∈ [-6.1, 0.0]; Portal opening centered at x = -2.1 (width 2.30m -> [-3.25, -0.95])
  const leftSegW = 2.85; // [-6.10, -3.25]
  const leftSegX = -6.1 + leftSegW / 2;
  const rightSegW = 0.95; // [-0.95, 0.0]
  const rightSegX = -0.95 + rightSegW / 2;
  const portalW = 2.3;
  const portalH = 2.55;
  const portalCenterX = -2.1;
  const lintelH = WALL_H - portalH;

  return (
    <group position={[0, 0, HALF_D]}>
      {/* Left pier */}
      <mesh position={[leftSegX, WALL_H / 2, 0]} receiveShadow castShadow>
        <boxGeometry args={[leftSegW, WALL_H, WALL_T]} />
        <meshStandardMaterial
          color={MATERIALS.plasterLiving}
          bumpMap={textures.plasterBump}
          bumpScale={0.003}
          roughness={0.92}
        />
      </mesh>
      {/* Right pier */}
      <mesh position={[rightSegX, WALL_H / 2, 0]} receiveShadow castShadow>
        <boxGeometry args={[rightSegW, WALL_H, WALL_T]} />
        <meshStandardMaterial
          color={MATERIALS.plasterLiving}
          bumpMap={textures.plasterBump}
          bumpScale={0.003}
          roughness={0.92}
        />
      </mesh>
      {/* Top lintel above entry portal */}
      <mesh position={[portalCenterX, portalH + lintelH / 2, 0]} receiveShadow castShadow>
        <boxGeometry args={[portalW, lintelH, WALL_T]} />
        <meshStandardMaterial
          color={MATERIALS.plasterLiving}
          bumpMap={textures.plasterBump}
          bumpScale={0.003}
          roughness={0.92}
        />
      </mesh>

      {/* Dark walnut + brushed brass inner portal reveal casing */}
      {[-1, 1].map((side) => (
        <group
          key={side}
          position={[portalCenterX + side * (portalW / 2 - 0.03), portalH / 2, 0]}
        >
          <mesh>
            <boxGeometry args={[0.06, portalH, WALL_T + 0.04]} />
            <meshStandardMaterial color={MATERIALS.walnut} roughness={0.5} metalness={0.12} />
          </mesh>
          {/* Brushed brass inlay hairline */}
          <mesh position={[-side * 0.032, 0, 0]}>
            <boxGeometry args={[0.012, portalH - 0.02, WALL_T + 0.05]} />
            <meshStandardMaterial color={MATERIALS.brass} roughness={0.28} metalness={0.85} />
          </mesh>
          {/* Warm vertical grazing LED strip inside jamb */}
          <mesh position={[-side * 0.036, 0, -0.02]}>
            <boxGeometry args={[0.008, portalH - 0.16, 0.012]} />
            <meshStandardMaterial
              color="#FFE2B8"
              emissive="#FFBE6B"
              emissiveIntensity={1.9}
              toneMapped={false}
            />
          </mesh>
        </group>
      ))}
      {/* Portal header soffit trim */}
      <mesh position={[portalCenterX, portalH - 0.03, 0]}>
        <boxGeometry args={[portalW, 0.06, WALL_T + 0.04]} />
        <meshStandardMaterial color={MATERIALS.walnut} roughness={0.5} metalness={0.12} />
      </mesh>
      {/* Brass floor threshold bar */}
      <mesh position={[portalCenterX, 0.006, 0]}>
        <boxGeometry args={[portalW, 0.012, WALL_T + 0.06]} />
        <meshStandardMaterial color={MATERIALS.brass} roughness={0.3} metalness={0.85} />
      </mesh>
    </group>
  );
}

/**
 * Dividing Architectural Wall at x = 0 connecting Zone A (Living Lounge) and
 * Zone B (Andalusian / Japandi Majlis) through a 2.16m × 2.55m brass portal.
 */
function DividingPortalWall({
  textures,
  suite2WallMatRef,
}: {
  textures: ArchitecturalTextureSet;
  suite2WallMatRef: RefObject<THREE.MeshStandardMaterial | null>;
}) {
  // Total Z span: [-2.7, +2.7] (depth 5.4). Portal centered at z = -0.12, width 2.16 -> [-1.20, +0.96]
  const backSegD = 1.5; // [-2.70, -1.20]
  const backSegZ = -HALF_D + backSegD / 2;
  const frontSegD = 1.74; // [+0.96, +2.70]
  const frontSegZ = 0.96 + frontSegD / 2;
  const portalW = 2.16;
  const portalH = 2.55;
  const portalCenterZ = -0.12;
  const lintelH = WALL_H - portalH;

  return (
    <group position={[0, 0, 0]}>
      {/* Back solid pier */}
      <mesh position={[0, WALL_H / 2, backSegZ]} receiveShadow castShadow>
        <boxGeometry args={[WALL_T, WALL_H, backSegD]} />
        <meshStandardMaterial
          color={MATERIALS.plasterLiving}
          bumpMap={textures.plasterBump}
          bumpScale={0.003}
          roughness={0.92}
        />
      </mesh>
      {/* Front solid pier */}
      <mesh position={[0, WALL_H / 2, frontSegZ]} receiveShadow castShadow>
        <boxGeometry args={[WALL_T, WALL_H, frontSegD]} />
        <meshStandardMaterial
          color={MATERIALS.plasterLiving}
          bumpMap={textures.plasterBump}
          bumpScale={0.003}
          roughness={0.92}
        />
      </mesh>
      {/* Portal overhead lintel */}
      <mesh position={[0, portalH + lintelH / 2, portalCenterZ]} receiveShadow castShadow>
        <boxGeometry args={[WALL_T, lintelH, portalW]} />
        <meshStandardMaterial
          color={MATERIALS.plasterLiving}
          bumpMap={textures.plasterBump}
          bumpScale={0.003}
          roughness={0.92}
        />
      </mesh>

      {/* Suite 2 facing plaster skin on the +X side of the piers (participates in Style Morph) */}
      <mesh position={[WALL_T / 2 + 0.004, WALL_H / 2, backSegZ]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[backSegD, WALL_H]} />
        <meshStandardMaterial
          ref={suite2WallMatRef}
          color={SUITE2_MORPH.japandi.wall}
          bumpMap={textures.plasterBump}
          bumpScale={0.003}
          roughness={0.9}
        />
      </mesh>
      <mesh position={[WALL_T / 2 + 0.004, WALL_H / 2, frontSegZ]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[frontSegD, WALL_H]} />
        <meshStandardMaterial
          color={SUITE2_MORPH.japandi.wall}
          bumpMap={textures.plasterBump}
          bumpScale={0.003}
          roughness={0.9}
        />
      </mesh>

      {/* Brushed Brass & Walnut Inter-Room Portal Reveal */}
      {[-1, 1].map((side) => (
        <group
          key={side}
          position={[0, portalH / 2, portalCenterZ + side * (portalW / 2 - 0.03)]}
        >
          <mesh>
            <boxGeometry args={[WALL_T + 0.05, portalH, 0.06]} />
            <meshStandardMaterial color={MATERIALS.walnut} roughness={0.48} metalness={0.14} />
          </mesh>
          <mesh position={[0, 0, -side * 0.032]}>
            <boxGeometry args={[WALL_T + 0.06, portalH - 0.02, 0.012]} />
            <meshStandardMaterial color={MATERIALS.brass} roughness={0.28} metalness={0.86} />
          </mesh>
          <mesh position={[0, 0, -side * 0.038]}>
            <boxGeometry args={[0.012, portalH - 0.16, 0.008]} />
            <meshStandardMaterial
              color="#FFE2B8"
              emissive="#FFBA66"
              emissiveIntensity={2.0}
              toneMapped={false}
            />
          </mesh>
        </group>
      ))}
      <mesh position={[0, portalH - 0.03, portalCenterZ]}>
        <boxGeometry args={[WALL_T + 0.05, 0.06, portalW]} />
        <meshStandardMaterial color={MATERIALS.walnut} roughness={0.48} metalness={0.14} />
      </mesh>
      {/* Brass floor threshold strip between Living Lounge & Majlis */}
      <mesh position={[0, 0.007, portalCenterZ]}>
        <boxGeometry args={[WALL_T + 0.08, 0.014, portalW]} />
        <meshStandardMaterial color={MATERIALS.brass} roughness={0.28} metalness={0.88} />
      </mesh>
    </group>
  );
}

/**
 * Zone B (Andalusian / Japandi Majlis Suite): Triple architectural arched
 * niches on the back wall, slatted walnut right screen, open gallery colonnade,
 * and dynamic materials wired to `useFrame` for live Act 04 Style Morphing.
 */
function MajlisSuiteArchitecture({
  textures,
  wallMatRef,
  nicheBackMatRef,
  coveMatRef,
  nicheGlowMatRef,
}: {
  textures: ArchitecturalTextureSet;
  wallMatRef: RefObject<THREE.MeshStandardMaterial | null>;
  nicheBackMatRef: RefObject<THREE.MeshStandardMaterial | null>;
  coveMatRef: RefObject<THREE.MeshStandardMaterial | null>;
  nicheGlowMatRef: RefObject<THREE.MeshStandardMaterial | null>;
}) {
  const nicheOffsets = [-1.75, 0, 1.75];

  return (
    <group>
      {/* Back Wall with Sculpted Triple Architectural Niches */}
      <group position={[PAVILION.majlisCenterX, 0, -HALF_D]}>
        <mesh position={[0, WALL_H / 2, -WALL_T / 2]} receiveShadow castShadow>
          <boxGeometry args={[SUITE_W, WALL_H, WALL_T]} />
          <meshStandardMaterial
            ref={wallMatRef}
            color={SUITE2_MORPH.japandi.wall}
            bumpMap={textures.plasterBump}
            bumpScale={0.004}
            roughness={0.88}
          />
        </mesh>

        {/* Three recessed Andalusian / Modernist niches with brass inlays & uplighting */}
        {nicheOffsets.map((nx) => (
          <group key={nx} position={[nx, 1.48, 0.02]}>
            {/* Recessed inner niche panel */}
            <mesh receiveShadow>
              <boxGeometry args={[1.22, 2.15, 0.04]} />
              <meshStandardMaterial
                ref={nx === 0 ? nicheBackMatRef : undefined}
                color={SUITE2_MORPH.japandi.nicheBack}
                roughness={0.82}
                userData={{ morphNiche: true }}
              />
            </mesh>
            {/* Slim brushed brass outer arch frame */}
            <mesh position={[-0.63, 0, 0.03]}>
              <boxGeometry args={[0.028, 2.2, 0.05]} />
              <meshStandardMaterial color={MATERIALS.brass} roughness={0.28} metalness={0.86} />
            </mesh>
            <mesh position={[0.63, 0, 0.03]}>
              <boxGeometry args={[0.028, 2.2, 0.05]} />
              <meshStandardMaterial color={MATERIALS.brass} roughness={0.28} metalness={0.86} />
            </mesh>
            <mesh position={[0, 1.09, 0.03]}>
              <boxGeometry args={[1.29, 0.028, 0.05]} />
              <meshStandardMaterial color={MATERIALS.brass} roughness={0.28} metalness={0.86} />
            </mesh>
            {/* Subtle hidden niche cove strip */}
            <mesh position={[0, 1.04, 0.035]}>
              <boxGeometry args={[1.14, 0.02, 0.02]} />
              <meshStandardMaterial
                ref={nx === 0 ? nicheGlowMatRef : undefined}
                color="#FFE4BD"
                emissive={SUITE2_MORPH.japandi.nicheGlow}
                emissiveIntensity={1.9}
                toneMapped={false}
                userData={{ morphNicheGlow: true }}
              />
            </mesh>
          </group>
        ))}

        {/* Top continuous cove glow bar */}
        <mesh position={[0, WALL_H - 0.08, 0.06]}>
          <boxGeometry args={[SUITE_W - 0.35, 0.026, 0.026]} />
          <meshStandardMaterial
            ref={coveMatRef}
            color="#FFE5C2"
            emissive={SUITE2_MORPH.japandi.coveColor}
            emissiveIntensity={2.0}
            toneMapped={false}
          />
        </mesh>
      </group>

      {/* Right Outer Wall (x = +HALF_W) with Architectural Walnut Slats & Brass Sconces */}
      <group position={[HALF_W, 0, 0]}>
        <mesh position={[WALL_T / 2, WALL_H / 2, 0]} receiveShadow castShadow>
          <boxGeometry args={[WALL_T, WALL_H, PAVILION.depth + WALL_T]} />
          <meshStandardMaterial
            color={SUITE2_MORPH.japandi.wall}
            bumpMap={textures.plasterBump}
            bumpScale={0.004}
            roughness={0.88}
            userData={{ morphWall: true }}
          />
        </mesh>

        {/* Vertical walnut screen louvers flanking the credenza */}
        {Array.from({ length: 12 }, (_, i) => -2.2 + i * 0.4).map((zPos) => (
          <mesh key={zPos} position={[-0.03, WALL_H / 2, zPos]} castShadow receiveShadow>
            <boxGeometry args={[0.045, WALL_H - 0.25, 0.055]} />
            <meshStandardMaterial
              map={textures.oakGrainMap}
              color="#765334"
              roughness={0.58}
              metalness={0.06}
            />
          </mesh>
        ))}

        {/* Twin glowing alabaster & brass sconces */}
        {[-1.55, 0.75].map((zPos) => (
          <group key={zPos} position={[-0.07, 1.72, zPos]}>
            <mesh>
              <cylinderGeometry args={[0.026, 0.026, 0.54, 14]} />
              <meshStandardMaterial
                color="#FFF0D6"
                emissive="#FFBE6B"
                emissiveIntensity={1.85}
                toneMapped={false}
              />
            </mesh>
            <mesh position={[0, 0.28, 0]}>
              <cylinderGeometry args={[0.032, 0.032, 0.04, 14]} />
              <meshStandardMaterial color={MATERIALS.brass} roughness={0.25} metalness={0.88} />
            </mesh>
            <mesh position={[0, -0.28, 0]}>
              <cylinderGeometry args={[0.032, 0.032, 0.04, 14]} />
              <meshStandardMaterial color={MATERIALS.brass} roughness={0.25} metalness={0.88} />
            </mesh>
          </group>
        ))}
      </group>

      {/* Open Front Architectural Colonnade Fascia (keeps Act 01/04/05 views dramatic & clear) */}
      <group position={[PAVILION.majlisCenterX, 0, HALF_D]}>
        <mesh position={[0, WALL_H - 0.16, 0]} castShadow receiveShadow>
          <boxGeometry args={[SUITE_W, 0.32, WALL_T]} />
          <meshStandardMaterial color={MATERIALS.plasterLiving} roughness={0.9} />
        </mesh>
        {/* Slim brass corner pillar */}
        <mesh position={[SUITE_W / 2 - 0.12, (WALL_H - 0.32) / 2, 0]} castShadow>
          <boxGeometry args={[0.16, WALL_H - 0.32, 0.16]} />
          <meshStandardMaterial color={MATERIALS.walnut} roughness={0.5} metalness={0.14} />
        </mesh>
        <mesh position={[0, WALL_H - 0.33, 0]}>
          <boxGeometry args={[SUITE_W - 0.1, 0.018, WALL_T + 0.02]} />
          <meshStandardMaterial color={MATERIALS.brass} roughness={0.28} metalness={0.85} />
        </mesh>
      </group>
    </group>
  );
}

/**
 * Act 03 — 3D Glowing SBC 201 & Neufert Architectural Audit Overlay.
 * Animates smoothly into Zone A during Act 03 without any React state updates.
 */
function SbcAuditOverlay({
  textures,
  groupRef,
  auditOpacityRef,
}: {
  textures: ArchitecturalTextureSet;
  groupRef: RefObject<THREE.Group | null>;
  auditOpacityRef: MutableRefObject<number>;
}) {
  // Primary SBC walkway spine running from entry portal along x = -1.28 and turning into Suite 2 portal
  const walkwayCenterPts = useMemo<readonly [number, number, number][]>(
    () => [
      [-1.35, 0.026, 2.35],
      [-1.35, 0.026, -0.12],
      [0.35, 0.026, -0.12],
    ],
    [],
  );
  const walkwayLine = useDashedLine(walkwayCenterPts, MATERIALS.sbcEmerald, 0.92, 0.16, 0.09);

  // Ergonomic TV viewing sightline (3.95m) from sofa headrest to 65" TV center
  const sightlinePts = useMemo<readonly [number, number, number][]>(
    () => [
      [-3.45, 0.92, 1.32],
      [-3.45, 1.22, -2.52],
    ],
    [],
  );
  const sightlineBeam = useDashedLine(sightlinePts, MATERIALS.brassBright, 0.88, 0.18, 0.1);

  // Floor projection of the sightline cone
  const coneLeftPts = useMemo<readonly [number, number, number][]>(
    () => [
      [-3.45, 0.025, 1.25],
      [-4.22, 0.025, -2.35],
    ],
    [],
  );
  const coneRightPts = useMemo<readonly [number, number, number][]>(
    () => [
      [-3.45, 0.025, 1.25],
      [-2.68, 0.025, -2.35],
    ],
    [],
  );
  const coneLeft = useDashedLine(coneLeftPts, MATERIALS.brassBright, 0.45, 0.12, 0.09);
  const coneRight = useDashedLine(coneRightPts, MATERIALS.brassBright, 0.45, 0.12, 0.09);

  const ribbonMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const sbcBadgeMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const sightBadgeMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const witnessMatRef = useRef<THREE.MeshBasicMaterial>(null);

  useFrame(() => {
    const a = auditOpacityRef.current;
    const grp = groupRef.current;
    if (grp) {
      grp.visible = a > 0.01;
    }
    if (a <= 0.01 || !grp) return;

    if (ribbonMatRef.current) ribbonMatRef.current.opacity = a * 0.2;
    if (sbcBadgeMatRef.current) sbcBadgeMatRef.current.opacity = a * 0.94;
    if (sightBadgeMatRef.current) sightBadgeMatRef.current.opacity = a * 0.9;
    if (witnessMatRef.current) witnessMatRef.current.opacity = a * 0.85;

    grp.traverse((obj) => {
      const mat = (obj as Partial<THREE.Line>).material;
      if (!mat || Array.isArray(mat)) return;
      const scale = (mat.userData as { auditOpacityScale?: number }).auditOpacityScale;
      if (typeof scale === 'number') {
        mat.opacity = a * scale;
      }
    });
  });

  return (
    <group ref={groupRef} visible={false}>
      {/* Glowing Emerald SBC >= 0.90m Primary Walkway Corridor Ribbon */}
      <mesh position={[-1.35, 0.02, 0.65]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.12, 3.65]} />
        <meshBasicMaterial
          ref={ribbonMatRef}
          color={MATERIALS.sbcEmerald}
          transparent
          opacity={0}
          depthWrite={false}
        />
      </mesh>

      {/* Walkway width dimension bar (1.12m actual vs >= 0.90m minimum) */}
      <group position={[-1.35, 0.028, 0.85]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.12, 0.028]} />
          <meshBasicMaterial
            ref={witnessMatRef}
            color={MATERIALS.sbcEmerald}
            transparent
            opacity={0}
            depthWrite={false}
          />
        </mesh>
        {[-0.56, 0.56].map((xEnd) => (
          <mesh key={xEnd} position={[xEnd, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.028, 0.24]} />
            <meshBasicMaterial
              color={MATERIALS.sbcEmerald}
              transparent
              opacity={0.85}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>

      {/* Dashed architectural vectors */}
      <primitive object={walkwayLine} />
      <primitive object={sightlineBeam} />
      <primitive object={coneLeft} />
      <primitive object={coneRight} />

      {/* Floor-projected SBC 201 Stamp */}
      <mesh position={[-1.35, 0.032, 0.15]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.55, 0.45]} />
        <meshBasicMaterial
          ref={sbcBadgeMatRef}
          map={textures.sbcStampMap}
          transparent
          opacity={0}
          depthWrite={false}
        />
      </mesh>

      {/* Floor-projected TV Sightline Stamp */}
      <mesh position={[-3.45, 0.032, -1.18]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.45, 0.42]} />
        <meshBasicMaterial
          ref={sightBadgeMatRef}
          map={textures.sightlineStampMap}
          transparent
          opacity={0}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

export default function Scene({
  ranges,
  splinePath,
  scrollEl,
  pointerRef,
  morphFactorRef,
  onHudFrame,
}: SceneProps) {
  const dampedOffsetRef = useRef(0);
  const dampedPointerRef = useRef({ x: 0, y: 0 });
  const auditOpacityRef = useRef(0);

  const auditGroupRef = useRef<THREE.Group>(null);
  const majlisGroupRef = useRef<THREE.Group>(null);
  const majlisFloorMatRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const majlisWallMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const majlisDividerSkinRef = useRef<THREE.MeshStandardMaterial>(null);
  const majlisNicheMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const majlisCoveMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const majlisNicheGlowMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const majlisInteriorLightRef = useRef<THREE.PointLight>(null);

  // Procedural PBR textures (memoized & disposed on unmount)
  const textures = useMemo(() => createArchitecturalTextures(), []);
  useEffect(() => () => textures.dispose(), [textures]);

  // Smooth centripetal Catmull-Rom curves for position & lookAt target
  const { posCurve, lookCurve } = useMemo(() => {
    const posPts = splinePath.map((k) => new THREE.Vector3(k.pos[0], k.pos[1], k.pos[2]));
    const lookPts = splinePath.map((k) => new THREE.Vector3(k.look[0], k.look[1], k.look[2]));
    return {
      posCurve: new THREE.CatmullRomCurve3(posPts, false, 'centripetal', 0.45),
      lookCurve: new THREE.CatmullRomCurve3(lookPts, false, 'centripetal', 0.45),
    };
  }, [splinePath]);

  // Zero-allocation frame scratch vectors & morph color pairs (stored in ref for React Compiler purity)
  const scratchRef = useRef({
    camPos: new THREE.Vector3(),
    lookPos: new THREE.Vector3(),
    rightVec: new THREE.Vector3(),
    forwardVec: new THREE.Vector3(),
    upVec: new THREE.Vector3(0, 1, 0),
    wallFrom: new THREE.Color(SUITE2_MORPH.japandi.wall),
    wallTo: new THREE.Color(SUITE2_MORPH.andalusian.wall),
    nicheFrom: new THREE.Color(SUITE2_MORPH.japandi.nicheBack),
    nicheTo: new THREE.Color(SUITE2_MORPH.andalusian.nicheBack),
    floorFrom: new THREE.Color(SUITE2_MORPH.japandi.floor),
    floorTo: new THREE.Color(SUITE2_MORPH.andalusian.floor),
    coveFrom: new THREE.Color(SUITE2_MORPH.japandi.coveColor),
    coveTo: new THREE.Color(SUITE2_MORPH.andalusian.coveColor),
    glowFrom: new THREE.Color(SUITE2_MORPH.japandi.nicheGlow),
    glowTo: new THREE.Color(SUITE2_MORPH.andalusian.nicheGlow),
  });

  useFrame(({ camera }, delta) => {
    const scratch = scratchRef.current;
    const dt = Math.min(delta, 0.1);
    const el = scrollEl.current;
    const maxScroll = el ? Math.max(1, el.scrollHeight - el.clientHeight) : 1;
    const targetOffset = el ? THREE.MathUtils.clamp(el.scrollTop / maxScroll, 0, 1) : 0;

    dampedOffsetRef.current = THREE.MathUtils.damp(dampedOffsetRef.current, targetOffset, 5.2, dt);
    const offset = dampedOffsetRef.current;

    // Smooth mouse parallax damping
    dampedPointerRef.current.x = THREE.MathUtils.damp(
      dampedPointerRef.current.x,
      pointerRef.current.x,
      4.5,
      dt,
    );
    dampedPointerRef.current.y = THREE.MathUtils.damp(
      dampedPointerRef.current.y,
      pointerRef.current.y,
      4.5,
      dt,
    );

    // Evaluate spline at current scroll offset
    posCurve.getPoint(offset, scratch.camPos);
    lookCurve.getPoint(offset, scratch.lookPos);

    // Stronger subtle parallax on exterior hero & closing shots, restrained inside portals/rooms
    const exteriorFactor = Math.max(
      1 - actProgress(offset, [0.04, 0.22]),
      actProgress(offset, [0.85, 0.98]),
    );
    const parallaxX = (0.1 + exteriorFactor * 0.36) * dampedPointerRef.current.x;
    const parallaxY = (0.05 + exteriorFactor * 0.16) * dampedPointerRef.current.y;

    scratch.forwardVec.subVectors(scratch.lookPos, scratch.camPos).normalize();
    scratch.rightVec.crossVectors(scratch.forwardVec, scratch.upVec).normalize();

    scratch.camPos.addScaledVector(scratch.rightVec, parallaxX);
    scratch.camPos.y += parallaxY;

    camera.position.copy(scratch.camPos);
    camera.lookAt(scratch.lookPos);

    // ── Act 03 SBC Audit Overlay envelope (fade in during Act 03, fade out before entering Suite 2)
    const auditIn = actProgress(offset, [ranges.audit[0], ranges.audit[0] + 0.08]);
    const auditOut = 1 - actProgress(offset, [ranges.audit[1] - 0.06, ranges.audit[1] + 0.04]);
    auditOpacityRef.current = THREE.MathUtils.clamp(auditIn * auditOut, 0, 1);

    // ── Act 04 Live Style Morph (Japandi -> Andalusian Majlis) ──────────
    const morphT = actProgress(offset, ranges.morph);
    morphFactorRef.current = morphT;

    if (majlisWallMatRef.current) {
      majlisWallMatRef.current.color.copy(scratch.wallFrom).lerp(scratch.wallTo, morphT);
    }
    if (majlisDividerSkinRef.current) {
      majlisDividerSkinRef.current.color.copy(scratch.wallFrom).lerp(scratch.wallTo, morphT);
    }
    if (majlisFloorMatRef.current) {
      majlisFloorMatRef.current.color.copy(scratch.floorFrom).lerp(scratch.floorTo, morphT);
    }
    if (majlisNicheMatRef.current) {
      majlisNicheMatRef.current.color.copy(scratch.nicheFrom).lerp(scratch.nicheTo, morphT);
    }
    if (majlisCoveMatRef.current) {
      majlisCoveMatRef.current.emissive.copy(scratch.coveFrom).lerp(scratch.coveTo, morphT);
    }
    if (majlisNicheGlowMatRef.current) {
      majlisNicheGlowMatRef.current.emissive.copy(scratch.glowFrom).lerp(scratch.glowTo, morphT);
    }

    // Update sibling niches & right wall via lightweight userData markers
    const majlisGrp = majlisGroupRef.current;
    if (majlisGrp) {
      majlisGrp.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (!mesh.isMesh || !mesh.material || Array.isArray(mesh.material)) return;
        const mat = mesh.material as THREE.MeshStandardMaterial;
        const ud = mat.userData as {
          morphWall?: boolean;
          morphNiche?: boolean;
          morphNicheGlow?: boolean;
        };
        if (ud.morphWall) {
          mat.color.copy(scratch.wallFrom).lerp(scratch.wallTo, morphT);
        } else if (ud.morphNiche) {
          mat.color.copy(scratch.nicheFrom).lerp(scratch.nicheTo, morphT);
        } else if (ud.morphNicheGlow) {
          mat.emissive.copy(scratch.glowFrom).lerp(scratch.glowTo, morphT);
        }
      });
    }

    if (majlisInteriorLightRef.current) {
      majlisInteriorLightRef.current.color.copy(scratch.coveFrom).lerp(scratch.coveTo, morphT);
      majlisInteriorLightRef.current.intensity = THREE.MathUtils.lerp(
        SUITE2_MORPH.japandi.coveIntensity,
        SUITE2_MORPH.andalusian.coveIntensity,
        morphT,
      );
    }

    // ── Push direct DOM HUD updates (zero React state churn) ────────────
    onHudFrame?.(offset, actProgress(offset, ranges.pricing), morphT);
  });

  return (
    <>
      {/* Diffused rectangular studio IBL for authentic brass, wood, marble, and glass reflections */}
      <Environment resolution={256} frames={1}>
        <Lightformer
          form="rect"
          intensity={1.5}
          color="#FFF5E6"
          scale={[18, 10, 1]}
          position={[0, 8, 2]}
          rotation={[Math.PI / 2, 0, 0]}
        />
        <Lightformer
          form="rect"
          intensity={1.35}
          color="#FFD6A0"
          scale={[10, 6, 1]}
          position={[11, 4, 5]}
          target={[0, 1, 0]}
        />
        <Lightformer
          form="rect"
          intensity={0.75}
          color="#AFC6E4"
          scale={[10, 6, 1]}
          position={[-12, 4, -4]}
          target={[0, 1, 0]}
        />
        <Lightformer
          form="rect"
          intensity={0.4}
          color="#5C4D3C"
          scale={[22, 22, 1]}
          position={[0, -5, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        />
      </Environment>

      {/* Architectural twilight/evening lighting rig */}
      <ambientLight intensity={0.22} color="#B8C2D1" />
      <hemisphereLight args={['#DCE5F2', '#7B664E', 0.42]} />

      {/* Warm raking sun key casting crisp shadows across both suites */}
      <directionalLight
        position={[7.5, 6.2, 6.4]}
        intensity={1.55}
        color="#FFD7A6"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-radius={3}
        shadow-bias={-0.0004}
        shadow-normalBias={0.018}
      >
        <orthographicCamera attach="shadow-camera" args={[-8.2, 8.2, 5.8, -5.8, 0.5, 28]} />
      </directionalLight>

      {/* Cool rim light separating the pavilion architecture from the obsidian ink void */}
      <directionalLight position={[-6.5, 4.5, -7.2]} intensity={0.42} color="#B8CDE6" />

      {/* Zone A (Living Lounge) Warm 3000K Architectural Interior Cove & Floor Lamp Fill */}
      <pointLight
        position={[-3.3, 2.65, -0.4]}
        intensity={3.0}
        distance={9.5}
        decay={1.6}
        color="#FFD6A0"
      />
      <pointLight
        position={[-5.0, 1.55, 1.45]}
        intensity={1.4}
        distance={4.8}
        decay={1.8}
        color="#FFCA80"
      />

      {/* Zone B (Andalusian / Japandi Majlis) Dynamically Morphing Warm Cove Light */}
      <pointLight
        ref={majlisInteriorLightRef}
        position={[3.2, 2.65, -0.25]}
        intensity={SUITE2_MORPH.japandi.coveIntensity}
        distance={10}
        decay={1.55}
        color={SUITE2_MORPH.japandi.coveColor}
      />
      <pointLight
        position={[1.45, 1.6, -1.85]}
        intensity={1.35}
        distance={5.2}
        decay={1.8}
        color="#FFC87A"
      />

      {/* Subtle infinite architectural brass drafting grid fading into deep ink fog */}
      <gridHelper args={[64, 128, MATERIALS.brass, MATERIALS.brass]} position={[0, -0.145, 0]}>
        <lineBasicMaterial attach="material" color={MATERIALS.brass} transparent opacity={0.14} fog />
      </gridHelper>

      {/* Grounded Architectural Pavilion Plinth */}
      <mesh position={[0, -0.07, 0]} receiveShadow>
        <boxGeometry args={[PAVILION.totalWidth + 0.65, 0.14, PAVILION.depth + 0.65]} />
        <meshStandardMaterial color={MATERIALS.plinth} roughness={0.85} metalness={0.12} />
      </mesh>
      {/* Brushed brass perimeter plinth reveal trim */}
      <mesh position={[0, -0.008, HALF_D + 0.33]}>
        <boxGeometry args={[PAVILION.totalWidth + 0.68, 0.018, 0.02]} />
        <meshStandardMaterial color={MATERIALS.brass} roughness={0.32} metalness={0.84} />
      </mesh>

      {/* ── FLOORS ──────────────────────────────────────────────────────── */}
      {/* Zone A: Honed Travertine Stone Floor */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[PAVILION.livingCenterX, 0.001, 0]}
        receiveShadow
      >
        <planeGeometry args={[SUITE_W, PAVILION.depth]} />
        <meshPhysicalMaterial
          map={textures.travertineMap}
          color="#D8C9B2"
          roughness={0.78}
          metalness={0.02}
          clearcoat={0.08}
          clearcoatRoughness={0.62}
        />
      </mesh>

      {/* Zone B: Honed Calacatta Warm Marble Floor (Live Style Morphing) */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[PAVILION.majlisCenterX, 0.001, 0]}
        receiveShadow
      >
        <planeGeometry args={[SUITE_W, PAVILION.depth]} />
        <meshPhysicalMaterial
          ref={majlisFloorMatRef}
          map={textures.marbleMap}
          color={SUITE2_MORPH.japandi.floor}
          roughness={0.42}
          metalness={0.04}
          clearcoat={0.22}
          clearcoatRoughness={0.38}
        />
      </mesh>

      {/* ── CEILINGS (Downward-facing FrontSide: invisible from elevated hero, solid inside rooms) ── */}
      <mesh
        rotation={[Math.PI / 2, 0, 0]}
        position={[PAVILION.livingCenterX, WALL_H, 0]}
      >
        <planeGeometry args={[SUITE_W, PAVILION.depth]} />
        <meshStandardMaterial color={MATERIALS.ceiling} roughness={0.94} side={THREE.FrontSide} />
      </mesh>
      <mesh
        rotation={[Math.PI / 2, 0, 0]}
        position={[PAVILION.majlisCenterX, WALL_H, 0]}
      >
        <planeGeometry args={[SUITE_W, PAVILION.depth]} />
        <meshStandardMaterial color={MATERIALS.ceiling} roughness={0.94} side={THREE.FrontSide} />
      </mesh>

      {/* Recessed Brass Ceiling Downlight Rings (Visible inside both suites) */}
      {[
        [-4.5, -1.2],
        [-2.2, -1.2],
        [-4.5, 1.1],
        [-2.2, 1.1],
        [1.8, -1.1],
        [4.5, -1.1],
        [1.8, 1.1],
        [4.5, 1.1],
      ].map(([lx, lz]) => (
        <group key={`${lx}:${lz}`} position={[lx, WALL_H - 0.012, lz]} rotation={[Math.PI / 2, 0, 0]}>
          <mesh>
            <ringGeometry args={[0.045, 0.068, 20]} />
            <meshStandardMaterial
              color={MATERIALS.brass}
              roughness={0.3}
              metalness={0.85}
              side={THREE.FrontSide}
            />
          </mesh>
          <mesh position={[0, 0, 0.002]}>
            <circleGeometry args={[0.044, 20]} />
            <meshStandardMaterial
              color="#FFF2DC"
              emissive="#FFD194"
              emissiveIntensity={1.6}
              toneMapped={false}
              side={THREE.FrontSide}
            />
          </mesh>
        </group>
      ))}

      {/* ── ARCHITECTURAL WALLS & PORTALS ───────────────────────────────── */}
      <LivingFeatureWall textures={textures} />
      <LivingLeftWall textures={textures} />
      <LivingEntryPortalWall textures={textures} />
      <DividingPortalWall textures={textures} suite2WallMatRef={majlisDividerSkinRef} />

      <group ref={majlisGroupRef}>
        <MajlisSuiteArchitecture
          textures={textures}
          wallMatRef={majlisWallMatRef}
          nicheBackMatRef={majlisNicheMatRef}
          coveMatRef={majlisCoveMatRef}
          nicheGlowMatRef={majlisNicheGlowMatRef}
        />
      </group>

      {/* Soft Contact Shadows grounding furniture across both suites */}
      <ContactShadows
        position={[0, 0.008, 0]}
        scale={16}
        resolution={512}
        far={1.6}
        blur={2.1}
        opacity={0.4}
        color="#1A120A"
      />

      {/* High-Res Calibrated GLB Furniture across Zone A & Zone B */}
      <Furniture morphFactorRef={morphFactorRef} />

      {/* Act 03 Glowing SBC 201 Walkway & TV Sightline Audit Overlay */}
      <SbcAuditOverlay
        textures={textures}
        groupRef={auditGroupRef}
        auditOpacityRef={auditOpacityRef}
      />
    </>
  );
}
