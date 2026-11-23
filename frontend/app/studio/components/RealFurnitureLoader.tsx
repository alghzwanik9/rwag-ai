"use client";

import React, { useRef, useEffect, useCallback, useState } from "react";
import { useGLTF, useHelper } from "@react-three/drei";
import { ThreeEvent, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useSceneStore, type RwaqMaterial } from "@/lib/useSceneStore";
import { RigidBody, RapierRigidBody } from "@react-three/rapier";

const FALLBACK_MODEL_URL = "/assets/armchair_wood.glb";

/**
 * Per-model intrinsic Y rotation (in radians) to align raw GLB axes with Rwaq's
 * world convention (width along X, height along Y, depth/front along +Z).
 * - display_shelf.glb was authored with width along Z (1.08m) and depth along X (0.37m).
 */
const MODEL_INTRINSIC_ROTATION_Y: Record<string, number> = {
  "/assets/display_shelf.glb": Math.PI / 2,
};

const STRUCTURAL_MATERIAL_KEYWORDS = [
  "leg",
  "legs",
  "base",
  "metal",
  "steel",
  "brass",
  "glass",
  "stem",
  "soil",
  "pot",
  "ceramic",
  "flower",
  "leaf",
  "leaves",
  "slat",
  "wood_frame",
  "wood_legs",
];

function isStructuralOrNaturalMesh(meshName: string, matName: string): boolean {
  const combined = `${meshName || ""} ${matName || ""}`.toLowerCase();
  return STRUCTURAL_MATERIAL_KEYWORDS.some((kw) => combined.includes(kw));
}

// ── Types ──────────────────────────────────────────────────────────────────────

export interface FurnitureDimensions {
  width: number;  // mm
  height: number; // mm
  depth: number;  // mm
}

export interface RealFurnitureLoaderProps {
  /** Unique instance ID */
  instanceId?: string;
  /** Relative or absolute URL to the .glb model file */
  modelUrl?: string;
  /** Alternate 3D model URL field from backend */
  model3dUrl?: string;
  /** Brand or manufacturer name */
  brandName: string;
  /** Product category */
  category?: string;
  /** Price in SAR (or any currency string e.g. "1,200 SAR") */
  price: number | string;
  /** Real-world dimensions in millimetres */
  dimensions: FurnitureDimensions;
  /** Direct purchase URL for the product */
  buyUrl: string;
  /** Optional position offset in the scene (world-space metres) */
  position?: [number, number, number];
  /** Optional rotation in Euler angles [x, y, z] */
  rotation?: [number, number, number];
  /**
   * When true, locks X/Y/Z to the same factor (smallest axis wins) so the
   * mesh always fits inside the target envelope without stretching.
   * Default: false (per-axis non-uniform scaling for exact dimension match).
   */
  uniformScale?: boolean;
  /** Custom override color for the furniture material */
  color?: string;
  /** Called when the user clicks the furniture piece */
  onSelect?: (meta: FurnitureMetadata) => void;
}

export interface FurnitureMetadata {
  brandName: string;
  price: number | string;
  dimensions: FurnitureDimensions;
  buyUrl: string;
}

/** Internal calibration result computed once per loaded model. */
interface Calibration {
  /** Per-axis scale to map raw GLB size → target real-world metres */
  scale: [number, number, number];
  /**
   * Translation applied to the calibrated inner group so the mesh's bottom
   * sits exactly on the floor plane and X/Z are centered.
   */
  offset: [number, number, number];
}

// ── Calibration utilities (exported for re-use in other components) ────────────

/**
 * Computes the per-axis (or uniform) scale vector needed to resize a loaded
 * Three.js object to match target real-world dimensions provided in millimetres.
 *
 * @param object   The loaded THREE.Group / scene from useGLTF
 * @param dims     Target dimensions in mm (from /api/v1/assets)
 * @param uniform  When true, uses the smallest factor so the mesh fits inside
 *                 the target envelope without exceeding any axis (aspect-ratio
 *                 locked, dominant-axis anchor = axis requiring least scaling).
 */
function getLocalBoundingBox(object: THREE.Object3D): THREE.Box3 {
  const box = new THREE.Box3();
  box.makeEmpty();
  object.updateMatrixWorld(true);
  const inverseRoot = object.matrixWorld.clone().invert();

  object.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (mesh.isMesh && mesh.visible && mesh.geometry) {
      const mat = mesh.material as THREE.MeshStandardMaterial | undefined;
      const isTransparent = mat && (
        (mat.transparent === true && mat.opacity < 0.1) || 
        mesh.name.toLowerCase().includes('shadow') ||
        mesh.name.toLowerCase().includes('collider') ||
        mesh.name.toLowerCase().includes('plane')
      );

      if (!isTransparent) {
        if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
        if (mesh.geometry.boundingBox) {
          const childBox = mesh.geometry.boundingBox.clone();
          const meshToRoot = mesh.matrixWorld.clone().premultiply(inverseRoot);
          childBox.applyMatrix4(meshToRoot);
          box.union(childBox);
        }
      }
    }
  });

  if (box.isEmpty()) {
    box.setFromObject(object);
  }
  return box;
}

export function computeAutoScale(
  object: THREE.Object3D,
  dims: FurnitureDimensions,
  uniform = false
): [number, number, number] {
  const box = getLocalBoundingBox(object);
  const rawSize = box.getSize(new THREE.Vector3());

  // Guard: degenerate or empty mesh → return identity
  if (rawSize.x <= 0 || rawSize.y <= 0 || rawSize.z <= 0) {
    console.warn("[computeAutoScale] Degenerate bounding box — returning identity scale.");
    return [1, 1, 1];
  }

  // Convert mm → metres (Three.js world-unit convention)
  const targetW = (parseFloat(String(dims.width)) || 1000) / 1000;
  const targetH = (parseFloat(String(dims.height)) || 1000) / 1000;
  const targetD = (parseFloat(String(dims.depth)) || 1000) / 1000;

  let sx = targetW / rawSize.x;
  let sy = targetH / rawSize.y;
  let sz = targetD / rawSize.z;

  if (isNaN(sx) || !isFinite(sx)) sx = 1;
  if (isNaN(sy) || !isFinite(sy)) sy = 1;
  if (isNaN(sz) || !isFinite(sz)) sz = 1;

  if (uniform) {
    const uniformFactor = Math.min(sx, sy, sz);
    return [uniformFactor, uniformFactor, uniformFactor];
  }

  // Flat floor rugs can legitimately scale thinly on Y while matching X/Z footprint
  if (targetH <= 0.06) {
    return [sx, sy, sz];
  }

  // Prevent grotesque non-uniform stretching when a model's native proportions
  // differ from target dimensions: clamp each axis within ±35% of the median scale.
  const sorted = [sx, sy, sz].slice().sort((a, b) => a - b);
  const medianScale = sorted[1];
  const minAllowed = medianScale / 1.35;
  const maxAllowed = medianScale * 1.35;

  return [
    THREE.MathUtils.clamp(sx, minAllowed, maxAllowed),
    THREE.MathUtils.clamp(sy, minAllowed, maxAllowed),
    THREE.MathUtils.clamp(sz, minAllowed, maxAllowed),
  ];
}



export function computePivotOffset(
  object: THREE.Object3D,
  scale: [number, number, number]
): [number, number, number] {
  const box = getLocalBoundingBox(object);

  if (box.isEmpty()) return [0, 0, 0];

  const center = box.getCenter(new THREE.Vector3());
  
  return [
    -(center.x * scale[0]),
    -(box.min.y * scale[1]),
    -(center.z * scale[2])
  ];
}

// ── ModelErrorBoundary ─────────────────────────────────────────────────────────

interface ModelErrorBoundaryProps {
  children: React.ReactNode;
  fallback: React.ReactNode;
  modelUrl: string;
  /** Optional: called when the boundary catches an error (for external state) */
  onError?: () => void;
}

class ModelErrorBoundary extends React.Component<
  ModelErrorBoundaryProps,
  { hasError: boolean }
> {
  constructor(props: ModelErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error(
      `[RealFurnitureLoader] GLB load failed — ${this.props.modelUrl}`,
      error.message
    );
    this.props.onError?.();
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

// ── InnerModel ─────────────────────────────────────────────────────────────────

interface InnerModelProps {
  modelUrl: string;
  color?: string;
  customMaterial?: RwaqMaterial;
  /** Fires once after PBR defaults are applied; passes the raw scene for bbox calc */
  onLoaded: (scene: THREE.Group) => void;
}

function InnerModel({ modelUrl, onLoaded, color, customMaterial }: InnerModelProps) {
  const { scene } = useGLTF(modelUrl);

  // ── Clone Scene & Materials (Prevents cross-instance pollution) ───────────
  const clonedScene = React.useMemo(() => {
    const clone = scene.clone();
    const intrinsicRotY = MODEL_INTRINSIC_ROTATION_Y[modelUrl] ?? 0;
    if (intrinsicRotY !== 0) {
      clone.rotation.y = intrinsicRotY;
      clone.updateMatrixWorld(true);
    }
    clone.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        if (mesh.material) {
          // Clone material to ensure independent color swapping
          mesh.material = (mesh.material as THREE.Material).clone();
          const mat = mesh.material as THREE.MeshStandardMaterial;

          if ("roughness" in mat) {
            if (mat.roughness >= 0.99) mat.roughness = 0.6;
            if (mat.metalness === 0) mat.metalness = 0.05;
            mat.needsUpdate = true;
            mesh.userData.originalRoughness = mat.roughness;
            mesh.userData.originalMetalness = mat.metalness;
          }

          // Save original color and map for reset functionality
          if (mat.color) {
            mesh.userData.originalColor = mat.color.clone();
          }
          if ("map" in mat) {
            mesh.userData.originalMap = mat.map ?? null;
          }
        }
      }
    });
    return clone;
  }, [scene, modelUrl]);

  // ── Apply Color / Material Swap (No frame drops) ──────────────────────────
  useEffect(() => {
    let cancelled = false;
    const hasExplicitCustomMaterial = Boolean(customMaterial?.color || customMaterial?.textureUrl);
    const effectiveColor = customMaterial?.color || color;
    const loader = customMaterial?.textureUrl ? new THREE.TextureLoader() : null;

    // Check if the model has any non-structural primary meshes so we don't skip
    // everything on single-mesh models when applying user customMaterials.
    let hasPrimaryMesh = false;
    clonedScene.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (mesh.isMesh && mesh.material) {
        const mat = mesh.material as THREE.MeshStandardMaterial;
        if (!isStructuralOrNaturalMesh(mesh.name, mat.name)) {
          hasPrimaryMesh = true;
        }
      }
    });

    clonedScene.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh || !mesh.material) return;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      const isStructural = hasPrimaryMesh && isStructuralOrNaturalMesh(mesh.name, mat.name);

      if (mat.color && child.userData.originalColor) {
        if (effectiveColor && (!isStructural || hasExplicitCustomMaterial)) {
          if (hasExplicitCustomMaterial) {
            // User explicitly selected a material/color from MaterialPalette
            if (isStructural && hasPrimaryMesh) {
              mat.color.copy(child.userData.originalColor);
            } else {
              mat.color.set(effectiveColor);
            }
          } else {
            // AI hex_color hint: gently tint primary upholstery/body while preserving PBR textures
            const hasOriginalTexture = Boolean(child.userData.originalMap);
            const tintStrength = hasOriginalTexture ? 0.32 : 0.65;
            mat.color
              .copy(child.userData.originalColor)
              .lerp(new THREE.Color(effectiveColor), tintStrength);
          }
        } else {
          mat.color.copy(child.userData.originalColor);
        }
      }

      if ("roughness" in mat) {
        mat.roughness =
          customMaterial?.roughness !== undefined
            ? customMaterial.roughness
            : (child.userData.originalRoughness ?? mat.roughness);
      }

      if ("metalness" in mat) {
        mat.metalness =
          customMaterial?.metalness !== undefined
            ? customMaterial.metalness
            : (child.userData.originalMetalness ?? mat.metalness);
      }

      if ("map" in mat) {
        if (customMaterial?.textureUrl && loader) {
          if (child.userData.loadedTextureUrl !== customMaterial.textureUrl) {
            const targetUrl = customMaterial.textureUrl;
            loader.load(
              targetUrl,
              (tex) => {
                if (cancelled) {
                  tex.dispose();
                  return;
                }
                tex.wrapS = THREE.RepeatWrapping;
                tex.wrapT = THREE.RepeatWrapping;
                tex.repeat.set(1, 1);
                tex.colorSpace = THREE.SRGBColorSpace;
                mat.map = tex;
                mat.needsUpdate = true;
                child.userData.loadedTextureUrl = targetUrl;
              },
              undefined,
              () => {
                // Offline/network fallback: keep color-based PBR override silently
              }
            );
          }
        } else {
          mat.map = child.userData.originalMap ?? null;
          child.userData.loadedTextureUrl = undefined;
        }
      }

      mat.needsUpdate = true;
    });

    return () => {
      cancelled = true;
    };
  }, [clonedScene, color, customMaterial]);

  // ── Notify Parent (For BBox calibration) ──────────────────────────────────
  useEffect(() => {
    onLoaded(clonedScene);
  }, [clonedScene, onLoaded]);

  // ── GPU memory cleanup on unmount ─────────────────────────────────────────
  useEffect(() => {
    const s = clonedScene;
    return () => {
      s.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (!mesh.isMesh) return;
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => m.dispose());
        } else {
          (mesh.material as THREE.Material)?.dispose();
        }
      });
    };
  }, [clonedScene]);

  return <primitive object={clonedScene} />;
}

// ── Procedural Furniture (Beautiful Fallbacks) ─────────────────────────────────

function ProceduralFurniture({ category = 'unknown', fw, fh, fd }: { category: string, fw: number, fh: number, fd: number }) {
  const cat = category.toLowerCase();
  
  if (cat.includes('bed') || cat.includes('سرير')) {
    // A nice looking bed: mattress + pillows + frame
    return (
      <group>
        {/* Frame / Base */}
        <mesh position={[0, fh * 0.25, 0]}>
          <boxGeometry args={[fw, fh * 0.5, fd]} />
          <meshStandardMaterial color="#8B5A2B" roughness={0.8} />
        </mesh>
        {/* Mattress */}
        <mesh position={[0, fh * 0.65, 0]}>
          <boxGeometry args={[fw * 0.96, fh * 0.3, fd * 0.96]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.9} />
        </mesh>
        {/* Pillow 1 */}
        <mesh position={[-fw * 0.25, fh * 0.85, -fd * 0.35]}>
          <boxGeometry args={[fw * 0.35, fh * 0.1, fd * 0.15]} />
          <meshStandardMaterial color="#F3F4F6" roughness={0.9} />
        </mesh>
        {/* Pillow 2 */}
        <mesh position={[fw * 0.25, fh * 0.85, -fd * 0.35]}>
          <boxGeometry args={[fw * 0.35, fh * 0.1, fd * 0.15]} />
          <meshStandardMaterial color="#F3F4F6" roughness={0.9} />
        </mesh>
      </group>
    );
  }
  
  if (cat.includes('table') || cat.includes('desk') || cat.includes('طاولة')) {
    // A parametric table: top + 4 legs
    const legThickness = Math.min(fw, fd) * 0.1;
    return (
      <group>
        {/* Table Top */}
        <mesh position={[0, fh - (fh * 0.05), 0]}>
          <boxGeometry args={[fw, fh * 0.1, fd]} />
          <meshStandardMaterial color="#4A4A4A" roughness={0.5} />
        </mesh>
        {/* Legs */}
        {[-1, 1].map((x) => 
          [-1, 1].map((z) => (
            <mesh key={`${x}-${z}`} position={[x * (fw/2 - legThickness/2), fh/2, z * (fd/2 - legThickness/2)]}>
              <cylinderGeometry args={[legThickness/2, legThickness/2, fh, 8]} />
              <meshStandardMaterial color="#333333" roughness={0.7} />
            </mesh>
          ))
        )}
      </group>
    );
  }
  
  if (cat.includes('storage') || cat.includes('wardrobe') || cat.includes('خزانة') || cat.includes('bookcase')) {
    // A nice storage cabinet with doors
    return (
      <group>
        {/* Main Body */}
        <mesh position={[0, fh/2, 0]}>
          <boxGeometry args={[fw, fh, fd]} />
          <meshStandardMaterial color="#FDFBF7" roughness={0.6} />
        </mesh>
        {/* Details (Doors split) */}
        <mesh position={[0, fh/2, fd/2 + 0.01]}>
          <planeGeometry args={[0.01, fh * 0.9]} />
          <meshBasicMaterial color="#000000" opacity={0.3} transparent />
        </mesh>
      </group>
    );
  }

  // Default: Nice modern block instead of transparent blue box
  return (
    <mesh position={[0, fh / 2, 0]}>
      <boxGeometry args={[fw, fh, fd]} />
      <meshStandardMaterial color="#A3B1C6" roughness={0.7} />
    </mesh>
  );
}

// ── RealFurnitureLoader ────────────────────────────────────────────────────────

/**
 * Sprint 2 — Calibrated Furniture Loader
 *
 * Loading state machine:
 *   idle    → shows dimensioned fallback grey box; loads GLB silently in bg
 *   ready   → shows calibrated model scaled to real-world mm + floor-dropped
 *   error   → shows dimensioned fallback grey box
 *
 * The fallback box always has the exact target dimensions so the scene
 * budget / collision logic remains accurate during any load state.
 */
export default function RealFurnitureLoader({
  instanceId,
  modelUrl,
  model3dUrl,
  brandName,
  category = "unknown",
  price,
  dimensions,
  buyUrl,
  position  = [0, 0, 0],
  rotation  = [0, 0, 0],
  uniformScale = false,
  color,
  onSelect,
}: RealFurnitureLoaderProps) {
  const [groupObj, setGroupObj] = useState<THREE.Group | null>(null);
  const groupRef = useRef<THREE.Object3D>(null) as React.MutableRefObject<THREE.Object3D>;
  const rigidBodyRef = useRef<RapierRigidBody>(null);

  // ── State machine ─────────────────────────────────────────────────────────
  type LoadState = "idle" | "ready" | "error";
  const [loadState,   setLoadState]   = useState<LoadState>("idle");
  const [calibration, setCalibration] = useState<Calibration | null>(null);

  // ── Selection State ───────────────────────────────────────────────────────
  const selectedAssetId = useSceneStore((s) => s.selectedAssetId);
  const setSelectedAssetId = useSceneStore((s) => s.setSelectedAssetId);
  const updateSceneItem = useSceneStore((s) => s.updateSceneItem);
  const removeSceneItem = useSceneStore((s) => s.removeSceneItem);
  const roomWidth = useSceneStore((s) => s.roomWidth);
  const roomDepth = useSceneStore((s) => s.roomDepth);
  const customMaterial = useSceneStore((s) => (instanceId ? s.customMaterials[instanceId] : undefined));
  const isSelected = !!instanceId && selectedAssetId === instanceId;

  // ── Manual Transform Sync (Fixes Snapping) ────────────────────────────────
  useEffect(() => {
    // Only apply props if we are NOT actively dragging this specific object
    if (rigidBodyRef.current && (!useSceneStore.getState().isDragging || !isSelected)) {
      rigidBodyRef.current.setTranslation({ x: position[0], y: position[1], z: position[2] }, true);
      const euler = new THREE.Euler(rotation[0], rotation[1], rotation[2]);
      const quat = new THREE.Quaternion().setFromEuler(euler);
      rigidBodyRef.current.setRotation(quat, true);
    }
  }, [position, rotation, isSelected]);

  // ── Selection Visualizer ──────────────────────────────────────────────────
  useHelper(isSelected ? groupRef : null, THREE.BoxHelper, "#00bcd4");

  // ── Bulletproof Dragging Logic ────────────────────────────────────────────
  const dragOffset = useRef<THREE.Vector3 | null>(null);

  const handlePointerDown = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      if (instanceId) {
        setSelectedAssetId(instanceId);
        useSceneStore.getState().setIsDragging(true);

        if (groupObj) {
          // Calculate offset between object center and mouse intersection on the floor
          const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), position[1] || 0);
          const intersectPoint = new THREE.Vector3();
          e.ray.intersectPlane(plane, intersectPoint);
          if (intersectPoint) {
            dragOffset.current = new THREE.Vector3().subVectors(groupObj.position, intersectPoint);
          }
        }
      }
    },
    [instanceId, setSelectedAssetId, groupObj, position]
  );

  useFrame(({ raycaster, camera, pointer }) => {
    if (useSceneStore.getState().isDragging && isSelected && groupObj && dragOffset.current) {
      // Raycast against a mathematical floor plane (ignores all mesh collision bugs)
      raycaster.setFromCamera(pointer, camera);
      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), position[1] || 0);
      const intersectPoint = new THREE.Vector3();
      raycaster.ray.intersectPlane(plane, intersectPoint);
      
      if (intersectPoint) {
        // Calculate the raw target position
        let targetX = intersectPoint.x + dragOffset.current.x;
        let targetZ = intersectPoint.z + dragOffset.current.z;

        // Algebraically compute dynamic AABB dimensions (width & depth) based on current Y-rotation
        // This avoids THREE.Box3() bugs where shared GLTF scenes or invisible meshes return 0.
        const fw = (dimensions?.width || 1000) / 1000;
        const fd = (dimensions?.depth || 1000) / 1000;
        
        const angle = groupObj.rotation.y;
        const cos = Math.abs(Math.cos(angle));
        const sin = Math.abs(Math.sin(angle));
        
        const objWidth = fw * cos + fd * sin;
        const objDepth = fw * sin + fd * cos;
        
        // Physical boundaries of the generated room
        // Left Wall at x = -roomWidth / 2, Back Wall at z = -roomDepth / 2
        // We add a tiny buffer (0.1) for the wall thickness so the item doesn't visually sink.
        const roomMinX = (-roomWidth / 2) + 0.1; 
        const roomMaxX = (roomWidth / 2) - 0.1;  
        const roomMinZ = (-roomDepth / 2) + 0.1; 
        const roomMaxZ = (roomDepth / 2) - 0.1;  
        
        // Calculate safe boundaries ensuring the object doesn't clip
        const safeMinX = Math.min(roomMinX + (objWidth / 2), roomMaxX);
        const safeMaxX = Math.max(roomMaxX - (objWidth / 2), roomMinX);
        const safeMinZ = Math.min(roomMinZ + (objDepth / 2), roomMaxZ);
        const safeMaxZ = Math.max(roomMaxZ - (objDepth / 2), roomMinZ);
        
        // Clamp to prevent clipping through walls
        targetX = THREE.MathUtils.clamp(targetX, safeMinX, safeMaxX);
        targetZ = THREE.MathUtils.clamp(targetZ, safeMinZ, safeMaxZ);
        
        if (rigidBodyRef.current) {
          rigidBodyRef.current.setNextKinematicTranslation({ x: targetX, y: position[1] || 0, z: targetZ });
        }
        groupObj.updateMatrixWorld();
      }
    }
  });

  useEffect(() => {
    const handlePointerUp = () => {
      const isDragging = useSceneStore.getState().isDragging;
      if (isDragging && isSelected && instanceId && dragOffset.current) {
        useSceneStore.getState().setIsDragging(false);
        dragOffset.current = null;
        
        let newX = position[0];
        let newZ = position[2];
        if (rigidBodyRef.current) {
          const translation = rigidBodyRef.current.translation();
          newX = translation.x;
          newZ = translation.z;
        }
        
        updateSceneItem(instanceId, {
          position: [newX, position[1] || 0, newZ],
        });
      }
    };
    window.addEventListener("pointerup", handlePointerUp);
    return () => window.removeEventListener("pointerup", handlePointerUp);
  }, [isSelected, groupObj, instanceId, position, updateSceneItem]);

  // ── Smart Rotation ('R' Key) ──────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (isSelected && (e.key === "r" || e.key === "R") && instanceId) {
        // Rotate exactly 45 degrees
        const newY = rotation[1] + Math.PI / 4;
        updateSceneItem(instanceId, {
          rotation: [rotation[0], newY, rotation[2]],
        });
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSelected, groupObj, instanceId, updateSceneItem, rotation]);



  const resolvedModelUrl = modelUrl?.trim() || model3dUrl?.trim() || FALLBACK_MODEL_URL;

  useEffect(() => {
    if (resolvedModelUrl) {
      useGLTF.preload(resolvedModelUrl);
    }
  }, [resolvedModelUrl]);

  // ── Calibration callback (fires once after GLB is loaded & PBR applied) ───
  const handleLoaded = useCallback(
    (scene: THREE.Group) => {
      try {
        const scale   = computeAutoScale(scene, dimensions, uniformScale);
        const offset  = computePivotOffset(scene, scale);
        setCalibration({ scale, offset });
        setLoadState("ready");

        console.info(
          `[RealFurnitureLoader] Calibrated "${brandName}" ` +
          `scale=[${scale.map((v) => v.toFixed(3)).join(", ")}] ` +
          `offset=[${offset.map((v) => v.toFixed(3)).join(", ")}]`
        );
        console.log("Rendering item:", brandName, "Scale:", scale, "Position:", position);
      } catch (err) {
        console.error("[RealFurnitureLoader] Calibration failed:", err);
        setLoadState("error");
      }
    },
    [dimensions, uniformScale, brandName, position]
  );

  // ── Derived geometry for fallback box (world-space metres, floor-anchored) ─
  const fw = (dimensions?.width  || 1000) / 1000;
  const fh = (dimensions?.height || 1000) / 1000;
  const fd = (dimensions?.depth  || 1000) / 1000;

  const fallbackBox = (
    <ProceduralFurniture category={category} fw={fw} fh={fh} fd={fd} />
  );

  const isInvalidUrl = !resolvedModelUrl;

  // ── Render ────────────────────────────────────────────────────────────────
  const isActivelyDragging = useSceneStore((s) => s.isDragging) && isSelected;

  const content = (
    <RigidBody 
      ref={rigidBodyRef} 
      type={isActivelyDragging ? 'kinematicPosition' : 'fixed'} 
      colliders="cuboid" 
      restitution={0.1} 
      friction={1}
      position={position as [number, number, number]}
      rotation={rotation as [number, number, number]}
      enabledRotations={[false, true, false]}
    >
      <group
        ref={(node) => {
          if (node) {
            groupRef.current = node;
            setGroupObj(node);
          }
        }}
        onPointerDown={handlePointerDown}
        onClick={(e) => {
          e.stopPropagation();
          const meta: FurnitureMetadata = { brandName, price, dimensions, buyUrl };
          onSelect?.(meta);
        }}
      >
        {/* ── Fallback: invalid / loading / error (procedural 3D box, no DOM overhead) ── */}
        {(isInvalidUrl || loadState === "idle" || loadState === "error") && fallbackBox}

      {/* ── Silent pre-load while idle (invisible until calibration resolves) ── */}
      {!isInvalidUrl && loadState === "idle" && (
        <React.Suspense fallback={null}>
          <ModelErrorBoundary
            fallback={null}
            modelUrl={resolvedModelUrl}
            onError={() => setLoadState("error")}
          >
            <group visible={false}>
              <InnerModel modelUrl={resolvedModelUrl} onLoaded={handleLoaded} color={color} customMaterial={customMaterial} />
            </group>
          </ModelErrorBoundary>
        </React.Suspense>
      )}

      {/* ── Calibrated model: only rendered once calibration is computed ── */}
      {!isInvalidUrl && loadState === "ready" && calibration && (
        <React.Suspense fallback={fallbackBox}>
          <ModelErrorBoundary
            fallback={fallbackBox}
            modelUrl={resolvedModelUrl}
            onError={() => setLoadState("error")}
          >
            <group scale={calibration.scale} position={calibration.offset}>
              <InnerModel modelUrl={resolvedModelUrl} onLoaded={handleLoaded} color={color} customMaterial={customMaterial} />
            </group>
          </ModelErrorBoundary>
        </React.Suspense>
      )}
    </group>
    </RigidBody>
  );

  return content;
}

// ── Preload hint ───────────────────────────────────────────────────────────────
// Call from parent when the model URL is known at build time:
//   RealFurnitureLoader.preload("/assets/sofa_khronos.glb");
RealFurnitureLoader.preload = (url: string) => {
  if (url && url.trim() !== "") useGLTF.preload(url);
};
