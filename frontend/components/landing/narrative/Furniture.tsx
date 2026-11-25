'use client';

import React, { Component, Suspense, useEffect, useMemo, type MutableRefObject, type ReactNode } from 'react';
import { RoundedBox, useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  MATERIALS,
  SHOWCASE_ASSETS,
  SUITE2_MORPH,
  type ShowcaseAssetSpec,
} from './config';

/**
 * High-resolution calibrated GLB furniture showcase for the multi-room landing
 * walkthrough. Reuses Rwaq's millimeter-to-meter bounding-box calibration and
 * floor-anchoring math so every model from `frontend/public/assets/` sits
 * flush on the floor with authentic PBR shadows and zero clipping.
 */

const MODEL_INTRINSIC_ROTATION_Y: Record<string, number> = {
  '/assets/display_shelf.glb': Math.PI / 2,
};

const STRUCTURAL_KEYWORDS = [
  'leg',
  'legs',
  'base',
  'metal',
  'steel',
  'brass',
  'glass',
  'stem',
  'soil',
  'pot',
  'leaf',
  'leaves',
  'wood',
  'frame',
];

function isStructuralPart(meshName: string, matName: string): boolean {
  const combined = `${meshName || ''} ${matName || ''}`.toLowerCase();
  return STRUCTURAL_KEYWORDS.some((kw) => combined.includes(kw));
}

function getLocalBoundingBox(object: THREE.Object3D): THREE.Box3 {
  const box = new THREE.Box3();
  box.makeEmpty();
  object.updateMatrixWorld(true);
  const inverseRoot = object.matrixWorld.clone().invert();

  object.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh || !mesh.visible || !mesh.geometry) return;
    const mat = mesh.material as THREE.MeshStandardMaterial | undefined;
    const lowerName = mesh.name.toLowerCase();
    const skip =
      (mat && mat.transparent && mat.opacity < 0.1) ||
      lowerName.includes('shadow') ||
      lowerName.includes('collider') ||
      lowerName.includes('plane');
    if (skip) return;

    if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
    if (mesh.geometry.boundingBox) {
      const childBox = mesh.geometry.boundingBox.clone();
      const meshToRoot = mesh.matrixWorld.clone().premultiply(inverseRoot);
      childBox.applyMatrix4(meshToRoot);
      box.union(childBox);
    }
  });

  if (box.isEmpty()) {
    box.setFromObject(object);
  }
  return box;
}

function calibrateAsset(
  object: THREE.Object3D,
  dims: ShowcaseAssetSpec['dimensions'],
): { scale: [number, number, number]; offset: [number, number, number] } {
  const box = getLocalBoundingBox(object);
  const raw = box.getSize(new THREE.Vector3());
  if (raw.x <= 0 || raw.y <= 0 || raw.z <= 0) {
    return { scale: [1, 1, 1], offset: [0, 0, 0] };
  }

  const targetW = dims.width / 1000;
  const targetH = dims.height / 1000;
  const targetD = dims.depth / 1000;

  let sx = targetW / raw.x;
  let sy = targetH / raw.y;
  let sz = targetD / raw.z;

  if (targetH > 0.06) {
    const sorted = [sx, sy, sz].slice().sort((a, b) => a - b);
    const median = sorted[1];
    sx = THREE.MathUtils.clamp(sx, median / 1.35, median * 1.35);
    sy = THREE.MathUtils.clamp(sy, median / 1.35, median * 1.35);
    sz = THREE.MathUtils.clamp(sz, median / 1.35, median * 1.35);
  }

  const center = box.getCenter(new THREE.Vector3());
  return {
    scale: [sx, sy, sz],
    offset: [-(center.x * sx), -(box.min.y * sy), -(center.z * sz)],
  };
}

class GlbErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    // Gracefully fall back to architectural silhouette without breaking Canvas.
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/** Lightweight architectural placeholder shown only while a GLB streams in. */
function ArchitecturalPlaceholder({ spec }: { spec: ShowcaseAssetSpec }) {
  const w = spec.dimensions.width / 1000;
  const h = spec.dimensions.height / 1000;
  const d = spec.dimensions.depth / 1000;
  const color =
    spec.fallbackKind === 'plant'
      ? '#4A6B53'
      : spec.fallbackKind === 'rug'
        ? '#4A5452'
        : spec.fallbackKind === 'lamp'
          ? MATERIALS.brass
          : '#A79986';

  return (
    <RoundedBox
      args={[w, Math.max(h, 0.015), d]}
      radius={Math.min(0.03, h * 0.25)}
      smoothness={2}
      position={[0, Math.max(h, 0.015) / 2, 0]}
      castShadow={spec.fallbackKind !== 'rug'}
      receiveShadow
    >
      <meshStandardMaterial color={color} roughness={0.78} metalness={0.05} />
    </RoundedBox>
  );
}

interface CalibratedGlbProps {
  spec: ShowcaseAssetSpec;
  morphFactorRef: MutableRefObject<number>;
}

function CalibratedGlb({ spec, morphFactorRef }: CalibratedGlbProps) {
  const { scene } = useGLTF(spec.modelUrl);

  const { cloned, scale, offset, morphTargets } = useMemo(() => {
    const clone = scene.clone(true);
    const intrinsicRotY = MODEL_INTRINSIC_ROTATION_Y[spec.modelUrl] ?? 0;
    if (intrinsicRotY !== 0) {
      clone.rotation.y = intrinsicRotY;
      clone.updateMatrixWorld(true);
    }

    const targets: { mat: THREE.MeshStandardMaterial; baseColor: THREE.Color; hasMap: boolean }[] = [];
    let hasNonStructural = false;

    clone.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh) return;
      const mat = mesh.material as THREE.MeshStandardMaterial | undefined;
      if (mat && !isStructuralPart(mesh.name, mat.name)) {
        hasNonStructural = true;
      }
    });

    const staticTint = spec.tint ? new THREE.Color(spec.tint) : null;

    clone.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = spec.fallbackKind !== 'rug';
      mesh.receiveShadow = true;

      if (!mesh.material) return;
      const clonedMat = Array.isArray(mesh.material)
        ? mesh.material.map((m) => m.clone())
        : (mesh.material as THREE.Material).clone();
      mesh.material = clonedMat;

      const matList = Array.isArray(clonedMat) ? clonedMat : [clonedMat];
      matList.forEach((raw) => {
        const mat = raw as THREE.MeshStandardMaterial;
        if ('roughness' in mat) {
          if (mat.roughness >= 0.99) mat.roughness = 0.72;
          if (mat.metalness === 0) mat.metalness = 0.04;
        }
        const isStruct = hasNonStructural && isStructuralPart(mesh.name, mat.name);
        const hasMap = Boolean(mat.map);

        if (mat.color && staticTint && !isStruct) {
          mat.color.lerp(staticTint, hasMap ? 0.34 : 0.65);
        }

        if (spec.morphRole && mat.color && !isStruct) {
          targets.push({ mat, baseColor: mat.color.clone(), hasMap });
        }
        mat.needsUpdate = true;
      });
    });

    const calibration = calibrateAsset(clone, spec.dimensions);
    return {
      cloned: clone,
      scale: calibration.scale,
      offset: calibration.offset,
      morphTargets: targets,
    };
  }, [scene, spec.modelUrl, spec.dimensions, spec.tint, spec.fallbackKind, spec.morphRole]);

  // Pre-allocated colors for zero-GC live style morphing
  const morphColors = useMemo(() => {
    if (!spec.morphRole) return null;
    const fromHex =
      spec.morphRole === 'sofa' ? SUITE2_MORPH.japandi.sofaTint : SUITE2_MORPH.japandi.rugTint;
    const toHex =
      spec.morphRole === 'sofa' ? SUITE2_MORPH.andalusian.sofaTint : SUITE2_MORPH.andalusian.rugTint;
    return {
      from: new THREE.Color(fromHex),
      to: new THREE.Color(toHex),
      blended: new THREE.Color(fromHex),
    };
  }, [spec.morphRole]);

  useFrame(() => {
    if (!morphColors || morphTargets.length === 0) return;
    const t = morphFactorRef.current;
    morphColors.blended.copy(morphColors.from).lerp(morphColors.to, t);
    for (let i = 0; i < morphTargets.length; i += 1) {
      const entry = morphTargets[i];
      const strength = entry.hasMap ? 0.42 : 0.74;
      entry.mat.color.copy(entry.baseColor).lerp(morphColors.blended, strength);
    }
  });

  useEffect(() => {
    return () => {
      cloned.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (!mesh.isMesh || !mesh.material) return;
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => m.dispose());
        } else {
          mesh.material.dispose();
        }
      });
    };
  }, [cloned]);

  return (
    <group position={offset} scale={scale}>
      <primitive object={cloned} />
    </group>
  );
}

/** Preloads every unique showcase GLB once on the client. */
let preloaded = false;
function preloadShowcaseGlbs() {
  if (preloaded) return;
  preloaded = true;
  const uniqueUrls = new Set(SHOWCASE_ASSETS.map((a) => a.modelUrl));
  uniqueUrls.forEach((url) => {
    useGLTF.preload(url);
  });
}

export default function Furniture({
  morphFactorRef,
}: {
  morphFactorRef: MutableRefObject<number>;
}) {
  useEffect(() => {
    preloadShowcaseGlbs();
  }, []);

  return (
    <group name="showcase-furniture">
      {SHOWCASE_ASSETS.map((spec) => (
        <group
          key={spec.id}
          position={[spec.position[0], spec.position[1], spec.position[2]]}
          rotation={[spec.rotation[0], spec.rotation[1], spec.rotation[2]]}
        >
          <GlbErrorBoundary fallback={<ArchitecturalPlaceholder spec={spec} />}>
            <Suspense fallback={<ArchitecturalPlaceholder spec={spec} />}>
              <CalibratedGlb spec={spec} morphFactorRef={morphFactorRef} />
            </Suspense>
          </GlbErrorBoundary>
        </group>
      ))}
    </group>
  );
}
