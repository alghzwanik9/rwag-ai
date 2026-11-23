"use client";

import React, { useState, Suspense, useRef, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "next/navigation";

import { Canvas, useFrame, useThree, ThreeEvent } from "@react-three/fiber";
import { OrbitControls, PointerLockControls, useGLTF, Environment, Lightformer, ContactShadows } from "@react-three/drei";
import { Physics } from "@react-three/rapier";
import * as THREE from 'three';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import AdaptiveARViewer from "@/components/AdaptiveARViewer";
import CopilotSuggestions from "@/components/CopilotSuggestions";
import MaterialPalette from "@/components/MaterialPalette";
import ProjectsModal from "@/components/ProjectsModal";
import PrintReport from "@/components/PrintReport";
import { useSceneStore, useFormattedTotalCost, formatCurrency } from "@/lib/useSceneStore";
import { TemplateType } from "@/lib/templates";
import { MAARAD_ROOMS } from "@/lib/maaradRooms";
import RealRoom from "./components/RealRoom";
import RealFurnitureLoader from "./components/RealFurnitureLoader";
import { ChatbotPanel } from "./components/ChatbotPanel";
import { SpatialAuditModal } from "./components/SpatialAuditModal";
import { useAssets } from "@/lib/useAssets";
import { IkeaAssetsLibrary } from "@/components/IkeaAssetsLibrary";
import { REGION, Z } from "./config/regions";
import type { StudioRequest, StudioUiState } from "./config/pipeline";
import { fixtureRequest, isStudioUiState } from "./config/stateFixtures";
import { useAIGeneration } from "./hooks/useAIGeneration";
import StudioHeader from "./components/StudioHeader";
import ConversationPanel from "./components/ConversationPanel";
import SceneDetailsDrawer from "./components/SceneDetailsDrawer";
import SceneToolbar from "./components/SceneToolbar";
import CirculationHeatmap from "./components/CirculationHeatmap";
import { RenderComparisonModal } from "./components/RenderComparisonModal";
import { FloorplanUploadModal } from "./components/FloorplanUploadModal";


const AMBIENT_PRESETS = {
  morning: {
    bg: new THREE.Color('#16181F'),
    ambientColor: new THREE.Color('#FFF8EB'),
    ambientIntensity: 0.75,
    dirColor: new THREE.Color('#FFF4E0'),
    dirIntensity: 1.9,
    dirPos: new THREE.Vector3(7, 11, 6),
    fogColor: new THREE.Color('#16181F'),
  },
  rainy: {
    bg: new THREE.Color('#161A20'),
    ambientColor: new THREE.Color('#94A3B8'),
    ambientIntensity: 0.5,
    dirColor: new THREE.Color('#B0C4DE'),
    dirIntensity: 0.8,
    dirPos: new THREE.Vector3(0, 9, 4),
    fogColor: new THREE.Color('#161A20'),
  },
  midnight: {
    bg: new THREE.Color('#0A0D12'),
    ambientColor: new THREE.Color('#1B202B'),
    ambientIntensity: 0.35,
    dirColor: new THREE.Color('#64B5F6'),
    dirIntensity: 0.6,
    dirPos: new THREE.Vector3(-4, 7, 4),
    fogColor: new THREE.Color('#0A0D12'),
  }
};


function AmbientController() {
  const ambientMode = useSceneStore((s) => s.ambientMode);
  const { scene } = useThree();
  
  const dirLightRef = useRef<THREE.DirectionalLight>(null);
  const ambientLightRef = useRef<THREE.AmbientLight>(null);
  
  // Procedural offline Web Audio API soft rain noise generator (zero external CDN calls)
  useEffect(() => {
    if (ambientMode !== 'rainy' || typeof window === 'undefined') return;

    let ctx: AudioContext | null = null;
    let source: AudioBufferSourceNode | null = null;

    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      ctx = new AudioCtx();
      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      let lastOut = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = output[i];
        output[i] *= 2.5;
      }

      source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 900;
      filter.Q.value = 0.6;

      const gain = ctx.createGain();
      gain.gain.value = 0.05;

      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      source.start(0);
      ctx.resume().catch(() => {});
    } catch {
      // Gracefully no-op when AudioContext is blocked or unavailable
    }

    return () => {
      try {
        source?.stop();
        source?.disconnect();
      } catch {
        // ignore stop errors
      }
      if (ctx) {
        ctx.close().catch(() => {});
      }
    };
  }, [ambientMode]);

  /* eslint-disable react-hooks/immutability */
  useFrame((state, delta) => {
    const target = AMBIENT_PRESETS[ambientMode];
    const lerpFactor = 2.0 * delta; 
    
    if (scene.background instanceof THREE.Color) {
      scene.background.lerp(target.bg, lerpFactor);
    } else {
      scene.background = target.bg.clone();
    }
    
    if (scene.fog instanceof THREE.Fog) {
      scene.fog.color.lerp(target.fogColor, lerpFactor);
    } else {
      scene.fog = new THREE.Fog(target.fogColor, 40, 120);
    }

    if (ambientLightRef.current) {
      ambientLightRef.current.color.lerp(target.ambientColor, lerpFactor);
      ambientLightRef.current.intensity = THREE.MathUtils.lerp(ambientLightRef.current.intensity, target.ambientIntensity, lerpFactor);
    }
    
    if (dirLightRef.current) {
      dirLightRef.current.color.lerp(target.dirColor, lerpFactor);
      dirLightRef.current.intensity = THREE.MathUtils.lerp(dirLightRef.current.intensity, target.dirIntensity, lerpFactor);
      dirLightRef.current.position.lerp(target.dirPos, lerpFactor);
    }
  });
  /* eslint-enable react-hooks/immutability */

  return (
    <>
      <ambientLight ref={ambientLightRef} intensity={0.4} color="#ffffff" />
      <directionalLight 
        ref={dirLightRef}
        position={[8, 12, 6]} 
        intensity={1.2} 
        castShadow 
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.0005}
        shadow-camera-near={0.5} 
        shadow-camera-far={50} 
        shadow-camera-left={-10} 
        shadow-camera-right={10} 
        shadow-camera-top={10} 
        shadow-camera-bottom={-10}
        shadow-normalBias={0.05}
      />
      
      {/* Fake interior point lights for midnight to make it cozy */}
      {ambientMode === 'midnight' && (
        <pointLight position={[0, 2, 0]} intensity={0.5} color="#ffebc2" distance={5} />
      )}
    </>
  );
}

function kelvinToColor(kelvin: number): THREE.Color {
  const t = Math.max(0, Math.min(1, (kelvin - 3000) / 3000));
  const warm = new THREE.Color('#ffb966');
  const cool = new THREE.Color('#eaf5ff');
  return warm.lerp(cool, t);
}

function ProceduralEnvironment({ ambientMode }: { ambientMode: 'morning' | 'rainy' | 'midnight' }) {
  const palette =
    ambientMode === 'morning'
      ? { top: '#FFF8EB', topInt: 2.2, key: '#FFE6C2', keyInt: 1.6, fill: '#D9ECFF', fillInt: 0.9, ground: '#C8B29B', groundInt: 0.5 }
      : ambientMode === 'rainy'
        ? { top: '#CBD5E1', topInt: 1.4, key: '#94A3B8', keyInt: 1.0, fill: '#B0C4DE', fillInt: 0.85, ground: '#64748B', groundInt: 0.4 }
        : { top: '#334155', topInt: 0.7, key: '#FFB966', keyInt: 1.1, fill: '#64B5F6', fillInt: 0.8, ground: '#1E293B', groundInt: 0.35 };

  return (
    <Environment key={ambientMode} resolution={256} frames={1}>
      <Lightformer
        form="rect"
        intensity={palette.topInt}
        color={palette.top}
        scale={[14, 14, 1]}
        position={[0, 8, 0]}
        rotation={[Math.PI / 2, 0, 0]}
      />
      <Lightformer
        form="rect"
        intensity={palette.keyInt}
        color={palette.key}
        scale={[10, 6, 1]}
        position={[8, 4, 6]}
        target={[0, 1, 0]}
      />
      <Lightformer
        form="circle"
        intensity={palette.fillInt}
        color={palette.fill}
        scale={8}
        position={[-8, 5, -4]}
        target={[0, 1, 0]}
      />
      <Lightformer
        form="ring"
        intensity={palette.groundInt}
        color={palette.ground}
        scale={16}
        position={[0, -4, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
    </Environment>
  );
}

function LightingRig() {
  const intensity = useSceneStore(s => s.coveLightIntensity);
  const colorK = useSceneStore(s => s.coveLightColor);
  const spotlightsOn = useSceneStore(s => s.spotlightToggle);

  const coveColor = useMemo(() => kelvinToColor(colorK), [colorK]);
  const covePower = (intensity / 100) * 0.7; 

  return (
    <group>
      {covePower > 0 && (
        <pointLight position={[0, 2.7, 0]} intensity={covePower} color={coveColor} distance={7} />
      )}

      {spotlightsOn && (
        <spotLight 
          position={[0, 3.2, 0]} 
          angle={0.5} 
          penumbra={0.5} 
          intensity={1.8} 
          color="#ffeedd" 
          target-position={[0, 0, 0]}
        />
      )}
    </group>
  );
}

function RoomModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  const setSelectedObjectId = useSceneStore((s) => s.setSelectedObjectId);
  const selectedObjectId = useSceneStore((s) => s.selectedObjectId);
  const customMaterials = useSceneStore((s) => s.customMaterials);

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    
    e.stopPropagation();
    const obj = e.object as THREE.Mesh;
    if (obj && obj.material && (obj.material as THREE.Material).name) {
      const name = obj.name.toLowerCase();
      const matName = (obj.material as THREE.Material).name;
      if (!name.includes('floor') && !name.includes('wall')) {
        setSelectedObjectId(matName);
      } else {
        setSelectedObjectId(null);
        useSceneStore.getState().setSelectedAssetId(null);
      }
    }
  };

  React.useEffect(() => {
    if (!scene) return;
    
    const textureLoader = new THREE.TextureLoader();
    scene.traverse((obj: THREE.Object3D) => {
      const child = obj as THREE.Mesh;
      if (child.isMesh && child.material) {
        const material = Array.isArray(child.material) ? child.material[0] : child.material;
        if (!material) return;
        const matName = child.userData.originalMaterialName || material.name;
        if (!child.userData.originalMaterialName) {
            child.userData.originalMaterialName = material.name;
        }
        
        if (matName === selectedObjectId) {
          if ((material as THREE.MeshStandardMaterial).emissive) (material as THREE.MeshStandardMaterial).emissive.setHex(0x333333);
        } else {
          if ((material as THREE.MeshStandardMaterial).emissive) (material as THREE.MeshStandardMaterial).emissive.setHex(0x000000);
        }

        const customMat = customMaterials[matName];
        if (customMat) {
          if (!child.userData.originalMaterial) {
            child.userData.originalMaterial = material;
            if (Array.isArray(child.material)) {
               // Ignore custom material assignment for array materials for now to prevent runtime errors
               return;
            } else {
               child.material = (child.material as THREE.Material).clone();
               child.material.name = matName;
            }
          }

          const mat = child.material as THREE.MeshStandardMaterial;
          if (customMat.color) mat.color.set(customMat.color);
          if (customMat.roughness !== undefined) mat.roughness = customMat.roughness;
          if (customMat.metalness !== undefined) mat.metalness = customMat.metalness;
          if (customMat.textureUrl) {
            if (!child.userData.loadedTextureUrl || child.userData.loadedTextureUrl !== customMat.textureUrl) {
              textureLoader.load(customMat.textureUrl, (tex) => {
                tex.wrapS = THREE.RepeatWrapping;
                tex.wrapT = THREE.RepeatWrapping;
                tex.repeat.set(1, 1);
                tex.flipY = false;
                mat.map = tex;
                mat.needsUpdate = true;
                child.userData.loadedTextureUrl = customMat.textureUrl;
              });
            }
          } else if (child.userData.originalMaterial) {
            mat.map = child.userData.originalMaterial.map;
          }
          mat.needsUpdate = true;
        } else {
          const meshName = child.name.toLowerCase();
          const mat = material as THREE.MeshStandardMaterial;
          if (meshName.includes('floor')) {
            if (!child.userData.archTextureApplied) {
                mat.color?.setHex(0xe8e8e8);
                mat.roughness = 0.4;
                mat.metalness = 0.1;
                mat.map = null;
                mat.needsUpdate = true;
                child.userData.archTextureApplied = true;
            }
          } else if (meshName.includes('wall')) {
            if (!child.userData.archTextureApplied) {
                mat.color?.setHex(0xfafafa);
                mat.roughness = 0.9;
                mat.metalness = 0.0;
                mat.map = null;
                mat.needsUpdate = true;
                child.userData.archTextureApplied = true;
            }
          } else {
             if (mat.roughness === undefined || mat.roughness > 0.8) {
               mat.roughness = 0.6;
             }
             if (mat.metalness === undefined) {
               mat.metalness = 0.05;
             }
             mat.needsUpdate = true;
          }
        }
      }
    });
  }, [scene, selectedObjectId, customMaterials]);

  return (
    <group>
      <primitive object={scene} onPointerDown={handlePointerDown} castShadow receiveShadow />
    </group>
  );
}

function EmptyRoom() {
  return (
    <>
      <RealRoom />
    </>
  );
}

class SceneErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: "" };
  }
  static getDerivedStateFromError(err: Error) {
    return { hasError: true, message: err.message };
  }
  componentDidCatch(err: Error) {
    console.warn("[SceneErrorBoundary] 3D scene error caught:", err.message);
  }
  render() {
    if (this.state.hasError) {
      return <EmptyRoom />;
    }
    return this.props.children;
  }
}

// ── Snapshot Manager ──
function SnapshotManager() {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const camera = useThree((state) => state.camera);
  
  useEffect(() => {
    const handleCapture = () => {
      gl.render(scene, camera);
      const dataUrl = gl.domElement.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = 'rwaq-design.png';
      link.href = dataUrl;
      link.click();
      window.dispatchEvent(new CustomEvent('show-toast', { detail: "📸 تم تصدير الصورة بنجاح" }));
    };

    const handleGetSnapshotData = (e: Event) => {
      gl.render(scene, camera);
      const dataUrl = gl.domElement.toDataURL('image/png');
      const customEvent = e as CustomEvent;
      if (customEvent.detail && typeof customEvent.detail.callback === 'function') {
        customEvent.detail.callback(dataUrl);
      }
    };

    window.addEventListener('rwaq-snapshot', handleCapture);
    window.addEventListener('rwaq-get-snapshot-data', handleGetSnapshotData);
    return () => {
      window.removeEventListener('rwaq-snapshot', handleCapture);
      window.removeEventListener('rwaq-get-snapshot-data', handleGetSnapshotData);
    };
  }, [gl, scene, camera]);
  
  return null;
}

function FPVControls() {
  const { camera } = useThree();
  const roomWidth = useSceneStore((s) => s.roomWidth);
  const roomDepth = useSceneStore((s) => s.roomDepth);
  
  const moveState = useRef({ forward: false, backward: false, left: false, right: false });
  const direction = useRef(new THREE.Vector3());

  // Set FOV and initial Y height on mount
  useEffect(() => {
    camera.position.setY(1.3);
    
    const pCamera = camera as THREE.PerspectiveCamera;
    const originalFov = pCamera.fov;
    Object.assign(pCamera, { fov: 60 });
    pCamera.updateProjectionMatrix();
    
    return () => {
      Object.assign(pCamera, { fov: originalFov });
      pCamera.updateProjectionMatrix();
    };
  }, [camera]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW': case 'ArrowUp': moveState.current.forward = true; break;
        case 'KeyS': case 'ArrowDown': moveState.current.backward = true; break;
        case 'KeyA': case 'ArrowLeft': moveState.current.left = true; break;
        case 'KeyD': case 'ArrowRight': moveState.current.right = true; break;
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW': case 'ArrowUp': moveState.current.forward = false; break;
        case 'KeyS': case 'ArrowDown': moveState.current.backward = false; break;
        case 'KeyA': case 'ArrowLeft': moveState.current.left = false; break;
        case 'KeyD': case 'ArrowRight': moveState.current.right = false; break;
      }
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  useFrame((state, delta) => {
    const speed = 5.0 * delta;
    
    direction.current.set(
      Number(moveState.current.right) - Number(moveState.current.left),
      0,
      Number(moveState.current.backward) - Number(moveState.current.forward)
    );
    direction.current.normalize();

    if (moveState.current.forward || moveState.current.backward || moveState.current.left || moveState.current.right) {
      camera.translateX(direction.current.x * speed);
      camera.translateZ(direction.current.z * speed);
    }

    camera.position.setY(1.3);
    
    const boundX = (roomWidth / 2) - 0.5;
    const boundZ = (roomDepth / 2) - 0.5;
    camera.position.setX(THREE.MathUtils.clamp(camera.position.x, -boundX, boundX));
    camera.position.setZ(THREE.MathUtils.clamp(camera.position.z, -boundZ, boundZ));
  });

  return null;
}
export default function StudioClient() {
  const DEFAULT_GLB = null;
  const [modelUrl, setModelUrl] = useState<string | null>(DEFAULT_GLB);
  const [sceneId, setSceneId]   = useState<string>("default");
  const searchParams = useSearchParams();
  const activeReference = searchParams.get("reference");
  const presetParam = searchParams.get("preset");
  const promptParam = searchParams.get("prompt");
  const imageParam = searchParams.get("image");
  const autoParam = searchParams.get("auto");
  const presetLoadedRef = useRef<string | null>(null);
  const incomingPromptHandledRef = useRef<string | null>(null);

  const [isToastVisible, setIsToastVisible] = useState(false);
  const [toastMessage, setToastMessage]   = useState("");
  const [isModalOpen, setIsModalOpen]     = useState(false);
  const [isARModalOpen, setIsARModalOpen] = useState(false);
  const [arBlobUrl, setArBlobUrl]         = useState<string | null>(null);
  const [isExportingAR, setIsExportingAR] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  const [isMaterialPaletteOpen, setIsMaterialPaletteOpen] = useState(false);
  const [isProjectsModalOpen, setIsProjectsModalOpen] = useState(false);
  const [showWalkwayHeatmap, setShowWalkwayHeatmap] = useState(false);
  const [isTransitioning, setIsTransitioning]         = useState(false);
  /** Collapsed by default; auto-opens when a generation settles. */
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // ── Neural Render Bridge (AI Realistic Render) ──
  const [isAIRenderModalOpen, setIsAIRenderModalOpen] = useState(false);
  const [isFloorplanModalOpen, setIsFloorplanModalOpen] = useState(false);
  const [isAIRendering, setIsAIRendering] = useState(false);
  const [renderBeforeImage, setRenderBeforeImage] = useState<string | null>(null);
  const [renderAfterImage, setRenderAfterImage] = useState<string | null>(null);
  const [renderPromptUsed, setRenderPromptUsed] = useState<string>("");
  const [renderSourceNote, setRenderSourceNote] = useState<string>("");

  const exportGroupRef = useRef<THREE.Group>(null);
  const arBlobUrlRef = useRef<string | null>(null);

  const {
    assets: catalogAssets,
    isLoading: isAssetsLoading,
    error: assetsError,
    isDemoData: isDemoCatalog,
  } = useAssets();
  const controlsRef = useRef<React.ElementRef<typeof OrbitControls>>(null);

  // Lighting, dimensions, finishes and window controls now read the store
  // directly inside SceneSettingsPanel — StudioClient was only re-exposing them.
  const sceneItems       = useSceneStore((s) => s.sceneItems);
  const isBudgetExceeded = useSceneStore((s) => s.isBudgetExceeded);
  const isDragging       = useSceneStore((s) => s.isDragging);
  const clearScene       = useSceneStore((s) => s.clearScene);
  const addSceneItem     = useSceneStore((s) => s.addSceneItem);
  const ambientMode      = useSceneStore((s) => s.ambientMode);
  const wallColor        = useSceneStore((s) => s.wallColor);
  const floorColor       = useSceneStore((s) => s.floorColor);
  const undo             = useSceneStore((s) => s.undo);
  const redo             = useSceneStore((s) => s.redo);
  const viewMode         = useSceneStore((s) => s.viewMode);
  const setViewMode      = useSceneStore((s) => s.setViewMode);
  const resetToDefaults  = useSceneStore((s) => s.resetToDefaults);
  const formattedTotal   = useFormattedTotalCost();
  const selectedAssetId    = useSceneStore((s) => s.selectedAssetId);
  const setSelectedAssetId = useSceneStore((s) => s.setSelectedAssetId);
  const updateSceneItem    = useSceneStore((s) => s.updateSceneItem);
  const removeSceneItem    = useSceneStore((s) => s.removeSceneItem);

  const selectedAsset = useMemo(() => {
    if (!selectedAssetId) return null;
    return sceneItems.find((it) => it.instanceId === selectedAssetId) || null;
  }, [selectedAssetId, sceneItems]);

  const handleRotateSelected = useCallback((deltaY: number) => {
    if (!selectedAsset) return;
    const currentRot = selectedAsset.rotation || [0, 0, 0];
    const newY = currentRot[1] + deltaY;
    updateSceneItem(selectedAsset.instanceId, {
      rotation: [currentRot[0], newY, currentRot[2]],
    });
  }, [selectedAsset, updateSceneItem]);

  const handleNudgeSelected = useCallback((dx: number, dz: number) => {
    if (!selectedAsset) return;
    const currentPos = selectedAsset.position || [0, 0, 0];
    updateSceneItem(selectedAsset.instanceId, {
      position: [currentPos[0] + dx, currentPos[1] || 0, currentPos[2] + dz],
    });
  }, [selectedAsset, updateSceneItem]);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setIsToastVisible(true);
    setTimeout(() => setIsToastVisible(false), 3000);
  }, []);

  useEffect(() => {
    const handleShowToast = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      showToast(customEvent.detail);
    };
    window.addEventListener('show-toast', handleShowToast);
    return () => window.removeEventListener('show-toast', handleShowToast);
  }, [showToast]);

  const onSettled = useCallback((state: StudioUiState) => {
    // Both `success` and `partial` produce a scene worth inspecting.
    if (state === 'success' || state === 'partial') setIsDrawerOpen(true);
  }, []);

  const {
    prompt,
    setPrompt,
    imageBase64,
    setImageBase64,
    isLoading,
    requests,
    uiState,
    handleGenerate,
    handleRetry,
    clearRequests,
  } = useAIGeneration({
    showToast,
    catalogAssets,
    styleReference: activeReference,
    onBeforeBuild: () => setModelUrl(null),
    onSettled,
  });

  // Auto-load preset from Maarad showroom (/maarad -> /studio?preset=...)
  useEffect(() => {
    if (!presetParam || presetLoadedRef.current === presetParam) return;
    const matchedRoom = MAARAD_ROOMS.find((r) => r.id === presetParam);
    if (!matchedRoom) return;

    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled || presetLoadedRef.current === presetParam) return;
      presetLoadedRef.current = presetParam;

      setModelUrl(null);
      setSceneId(`maarad_${matchedRoom.id}`);

      const store = useSceneStore.getState();
      store.clearScene();
      store.setRoomWidth(matchedRoom.dimensions.width);
      store.setRoomDepth(matchedRoom.dimensions.depth);
      store.setWallHeight(matchedRoom.dimensions.height);
      store.setWallColor(matchedRoom.wallColor);
      store.setFloorColor(matchedRoom.floorColor);
      store.setAmbientMode(matchedRoom.ambientMode);

      matchedRoom.items.forEach((item) => {
        store.addSceneItem({
          ...item,
          thumbnailUrl: item.thumbnailUrl || "",
          instanceId: crypto.randomUUID(),
        });
      });

      setPrompt(matchedRoom.prompt);
      showToast(`🏛️ تم استيراد تصميم "${matchedRoom.title}" بنجاح في الاستوديو!`);
    });

    return () => {
      cancelled = true;
    };
  }, [presetParam, setPrompt, showToast]);

  // Auto-load prompt and concept image from Studio2D (/studio2d -> /studio?prompt=...&image=...)
  useEffect(() => {
    if (!promptParam || incomingPromptHandledRef.current === promptParam) return;
    incomingPromptHandledRef.current = promptParam;

    setPrompt(promptParam);
    if (imageParam) {
      setImageBase64(imageParam);
    }
    setIsDrawerOpen(true);
    showToast("✨ تم استيراد فكرة التصميم من استوديو 2D إلى الاستوديو ثلاثي الأبعاد!");

    if (autoParam === "true") {
      const timer = setTimeout(() => {
        handleGenerate();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [promptParam, imageParam, autoParam, setPrompt, setImageBase64, showToast, handleGenerate]);

  /**
   * Dev-only state override: /studio?state=partial renders a fixture so every
   * state — especially `partial` — is reviewable without a working backend.
   * Stripped in production builds.
   */
  const stateOverride = searchParams.get("state");
  const { viewRequests, viewUiState } = useMemo(() => {
    const isDev = process.env.NODE_ENV !== 'production';
    if (!isDev || !isStudioUiState(stateOverride)) {
      return { viewRequests: requests, viewUiState: uiState };
    }
    return {
      viewRequests: stateOverride === 'idle' ? ([] as StudioRequest[]) : [fixtureRequest(stateOverride)],
      viewUiState: stateOverride,
    };
  }, [requests, stateOverride, uiState]);

  // Global Undo/Redo Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.code === 'KeyZ') {
          if (e.shiftKey) {
            e.preventDefault();
            redo();
            showToast("↪️ إعادة (Redo)");
          } else {
            e.preventDefault();
            undo();
            showToast("↩️ تراجع (Undo)");
          }
        } else if (e.code === 'KeyY') {
          e.preventDefault();
          redo();
          showToast("↪️ إعادة (Redo)");
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, showToast]);

  useEffect(() => {
    if (isBudgetExceeded()) {
      const timer = setTimeout(() => showToast("⚠️ تحذير: تجاوزت الميزانية المحددة!"), 0);
      return () => clearTimeout(timer);
    }
  }, [formattedTotal, isBudgetExceeded, showToast]);

  const resetCamera = () => {
    // controlsRef is only attached to OrbitControls, so this is a no-op while
    // walkthrough mode is active. Toggling back out of FPV calls it again.
    if (controlsRef.current) {
      controlsRef.current.reset();
      controlsRef.current.object.position.set(8.5, 6, 8.5);
      controlsRef.current.target.set(0, 1, 0);
      controlsRef.current.update();
    }
  };

  const handleToggleViewMode = () => {
    const goingToWalkthrough = viewMode === 'orbit';
    setViewMode(goingToWalkthrough ? 'fpv' : 'orbit');
    if (goingToWalkthrough) {
      showToast("🚶‍♂️ وضع التجول مفعل (استخدم W, A, S, D للحركة والماوس للنظر)");
    } else {
      showToast("🔄 وضع الدوران مفعل");
      resetCamera();
    }
  };

  /**
   * The promoted primary action. The button that used to carry this label sat
   * at the bottom of the global sidebar with no onClick at all.
   */
  const handleCloseAR = useCallback(() => {
    setIsARModalOpen(false);
    setIsExportingAR(false);
    if (arBlobUrlRef.current) {
      URL.revokeObjectURL(arBlobUrlRef.current);
      arBlobUrlRef.current = null;
    }
    setArBlobUrl(null);
  }, []);

  useEffect(() => {
    return () => {
      if (arBlobUrlRef.current) {
        URL.revokeObjectURL(arBlobUrlRef.current);
        arBlobUrlRef.current = null;
      }
    };
  }, []);

  const handleOpenAR = useCallback(async () => {
    setIsARModalOpen(true);

    // Server-hosted GLB exists — render directly without client-side export
    if (modelUrl) {
      setIsExportingAR(false);
      return;
    }

    const rootGroup = exportGroupRef.current;
    if (!rootGroup) {
      showToast("⚠️ تعذر تجهيز المشهد للواقع المعزز");
      return;
    }

    setIsExportingAR(true);
    try {
      const { GLTFExporter } = await import("three-stdlib");
      rootGroup.updateMatrixWorld(true);

      const exportRoot = new THREE.Group();
      exportRoot.name = "RwaqScene";

      const isDrawable = (img: any): boolean => {
        if (!img) return false;
        if (typeof HTMLImageElement !== 'undefined' && img instanceof HTMLImageElement) {
          return img.complete && (img.naturalWidth > 0 || img.width > 0);
        }
        if (typeof HTMLCanvasElement !== 'undefined' && img instanceof HTMLCanvasElement) {
          return img.width > 0 && img.height > 0;
        }
        if (typeof ImageBitmap !== 'undefined' && img instanceof ImageBitmap) {
          return img.width > 0 && img.height > 0;
        }
        return false;
      };

      rootGroup.traverse((obj) => {
        if (!(obj instanceof THREE.Mesh) || !obj.visible || !obj.geometry) return;
        const lowerName = (obj.name || "").toLowerCase();
        if (
          lowerName.includes("contactshadow") ||
          lowerName.includes("helper") ||
          lowerName.includes("shadow") ||
          lowerName.includes("circulation") ||
          lowerName.includes("heatmap") ||
          lowerName.includes("flow") ||
          lowerName.includes("gizmo") ||
          lowerName.includes("grid")
        ) return;

        // Skip any child belonging to ContactShadows or utility groups
        let p: THREE.Object3D | null = obj.parent;
        let isHelper = false;
        while (p) {
          const pName = (p.name || "").toLowerCase();
          if (
            pName.includes("contactshadow") ||
            pName.includes("helper") ||
            pName.includes("shadow") ||
            pName.includes("circulation") ||
            pName.includes("heatmap") ||
            pName.includes("flow") ||
            pName.includes("gizmo") ||
            pName.includes("grid")
          ) {
            isHelper = true;
            break;
          }
          p = p.parent;
        }
        if (isHelper) return;

        const mat = obj.material;
        if (!mat) return;
        const mats = Array.isArray(mat) ? mat : [mat];
        if (mats.some((m) => m instanceof THREE.ShaderMaterial)) return;

        // Sanitize material: ensure textures are real canvas/image sources to prevent GLTFExporter drawImage errors
        const cleanMats = mats.map((m) => {
          if (!m) return new THREE.MeshStandardMaterial({ color: 0xd4cdbf });
          const clone = m.clone();
          const texKeys = [
            'map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'emissiveMap',
            'bumpMap', 'displacementMap', 'lightMap', 'alphaMap'
          ] as const;
          for (const key of texKeys) {
            const tex = (clone as any)[key];
            if (tex) {
              if (!isDrawable(tex.image)) {
                (clone as any)[key] = null;
              }
            }
          }

          // In three-stdlib GLTFExporter, metalnessMap and roughnessMap are combined via context.drawImage.
          // If either lacks a valid drawable image, remove BOTH to avoid drawImage TypeError.
          const hasValidMetal = clone.metalnessMap && isDrawable(clone.metalnessMap.image);
          const hasValidRough = clone.roughnessMap && isDrawable(clone.roughnessMap.image);
          if (!hasValidMetal || !hasValidRough) {
            clone.metalnessMap = null;
            clone.roughnessMap = null;
          }

          return clone;
        });

        const finalMat = Array.isArray(mat) ? cleanMats : cleanMats[0];
        const clonedMesh = new THREE.Mesh(obj.geometry.clone(), finalMat);
        clonedMesh.name = obj.name || "mesh";
        clonedMesh.matrixAutoUpdate = false;
        clonedMesh.matrix.copy(obj.matrixWorld);
        clonedMesh.matrix.decompose(clonedMesh.position, clonedMesh.quaternion, clonedMesh.scale);
        clonedMesh.matrixAutoUpdate = true;
        exportRoot.add(clonedMesh);
      });

      const exporter = new GLTFExporter();
      let result: any;
      try {
        result = await exporter.parseAsync(exportRoot, { binary: true, onlyVisible: true });
      } catch (parseErr) {
        console.warn("[StudioClient] First parseAsync failed, falling back to clean textureless export:", parseErr);
        // Stripping all textures guarantees geometry and basic material colors export without canvas/image failures
        exportRoot.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            const oldMat = Array.isArray(child.material) ? child.material[0] : child.material;
            child.material = new THREE.MeshStandardMaterial({
              color: (oldMat as any)?.color || 0xd4cdbf,
              roughness: 0.65,
              metalness: 0.1,
            });
          }
        });
        result = await exporter.parseAsync(exportRoot, { binary: true, onlyVisible: true });
      }

      if (result instanceof ArrayBuffer) {
        const blob = new Blob([result], { type: "model/gltf-binary" });
        const url = URL.createObjectURL(blob);
        if (arBlobUrlRef.current) {
          URL.revokeObjectURL(arBlobUrlRef.current);
        }
        arBlobUrlRef.current = url;
        setArBlobUrl(url);
      } else {
        showToast("⚠️ تعذر تصدير المشهد إلى ملف GLB");
      }
    } catch (err) {
      console.error("[StudioClient] GLTFExporter failed:", err);
      showToast("❌ حدث خطأ أثناء تصدير المشهد للواقع المعزز");
    } finally {
      setIsExportingAR(false);
    }
  }, [modelUrl, showToast]);

  // ── Neural Render Bridge: Capture 3D viewport & generate photorealistic render ──
  const handleAIRender = useCallback(async () => {
    if (isAIRendering) return;
    setIsAIRendering(true);
    showToast("📸 جاري التقاط زاوية الكاميرا الحالية وتوليد رندرة سينمائية واقعية...");

    try {
      // 1. Temporarily hide walkway heatmap during capture for clean architectural framing
      const wasHeatmapVisible = showWalkwayHeatmap;
      if (wasHeatmapVisible) {
        setShowWalkwayHeatmap(false);
        await new Promise((r) => setTimeout(r, 60));
      }

      // 2. Request clean WebGL snapshot from SnapshotManager
      const snapshotBase64: string = await new Promise((resolve) => {
        let done = false;
        const cb = (dataUrl: string) => {
          if (!done) {
            done = true;
            resolve(dataUrl);
          }
        };
        window.dispatchEvent(new CustomEvent("rwaq-get-snapshot-data", { detail: { callback: cb } }));
        setTimeout(() => {
          if (!done) {
            done = true;
            resolve("");
          }
        }, 2500);
      });

      if (wasHeatmapVisible) {
        setShowWalkwayHeatmap(true);
      }

      if (!snapshotBase64) {
        showToast("⚠️ تعذر التقاط إطار الكاميرا بدقة");
        setIsAIRendering(false);
        return;
      }

      setRenderBeforeImage(snapshotBase64);

      // 3. Send to structure-preserving backend endpoint
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const payload = {
        image_base64: snapshotBase64,
        room_style: activeReference || "مودرن فاخر",
        wall_color: wallColor,
        floor_color: floorColor,
        ambient_mode: ambientMode,
        items: sceneItems.map((item) => ({
          name: item.name,
          category: item.category,
          color: item.color,
          dimensions: item.dimensions,
        })),
      };

      const res = await fetch(`${apiUrl}/api/v1/studio/render-from-3d`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      setRenderAfterImage(data.image_url);
      setRenderPromptUsed(data.prompt_used || "");
      setRenderSourceNote(data.note || "");
      setIsAIRenderModalOpen(true);
      showToast("✨ اكتملت الرندرة السينمائية الواقعية بنجاح!");
    } catch (err) {
      console.error("[StudioClient] handleAIRender error:", err);
      showToast("⚠️ تعذر إتمام الرندرة الواقعية حالياً");
    } finally {
      setIsAIRendering(false);
    }
  }, [isAIRendering, showWalkwayHeatmap, activeReference, wallColor, floorColor, ambientMode, sceneItems, showToast]);

  const handleNewProject = () => {
    clearScene();
    clearRequests();
    setModelUrl(null);
    setSceneId("default");
    resetToDefaults();
    setPrompt("");
    setImageBase64(null);
    setIsDrawerOpen(false);
    showToast("🆕 تم بدء مشروع جديد");
  };



  const handleLoadTemplate = (type: TemplateType) => {
    setModelUrl(null);
    useSceneStore.getState().clearScene();
    
    // Helper to dynamically find a real asset from the database that actually has a model
    const findAsset = (keywords: string[], category?: string) => {
      const match = catalogAssets.find(a => 
        (category ? a.category === category : true) && 
        a.modelUrl && // Must have a valid model URL
        keywords.some(k => a.id.toLowerCase().includes(k) || a.name.toLowerCase().includes(k))
      );
      return match || catalogAssets.find(a => a.category === category && a.modelUrl);
    };

    const itemsToAdd: Parameters<typeof addSceneItem>[0][] = [];

    if (type === "LivingRoom") {
      const sofa = findAsset(["sofa", "kivik", "khronos"], "seating");
      if (sofa) itemsToAdd.push({ ...sofa, position: [0, 0, -1.5], rotation: [0, 0, 0], instanceId: crypto.randomUUID() });
      
      const table = findAsset(["table", "coffee", "lack"], "tables");
      if (table) itemsToAdd.push({ ...table, position: [0, 0, 0.2], rotation: [0, 0, 0], instanceId: crypto.randomUUID() });
      
      const rug = findAsset(["rug", "carpet"], "rugs");
      if (rug) itemsToAdd.push({ ...rug, position: [0, 0.02, -0.5], rotation: [0, 0, 0], instanceId: crypto.randomUUID() });

      const shelf = findAsset(["shelf", "display", "cabinet"], "storage");
      if (shelf) itemsToAdd.push({ ...shelf, position: [-2.5, 0, 0.5], rotation: [0, Math.PI / 2, 0], instanceId: crypto.randomUUID() });

      const plant = findAsset(["plant", "tree"]);
      if (plant) itemsToAdd.push({ ...plant, position: [-2.5, 0, -1.5], rotation: [0, 0, 0], instanceId: crypto.randomUUID() });

      const decor = findAsset(["vase", "camera", "decor"], "decor");
      if (decor) itemsToAdd.push({ ...decor, position: [1.5, 0, 0.2], rotation: [0, 0, 0], instanceId: crypto.randomUUID() });
    } else if (type === "Bedroom") {
      const bed = findAsset(["bed", "سرير"], "seating");
      if (bed) itemsToAdd.push({ ...bed, position: [0, 0, -0.9], rotation: [0, 0, 0], instanceId: crypto.randomUUID() });

      const chair = findAsset(["chair", "armchair", "wood"], "seating");
      if (chair) itemsToAdd.push({ ...chair, position: [1.6, 0, 0.8], rotation: [0, -Math.PI / 4, 0], instanceId: crypto.randomUUID() });
      
      const cabinet = findAsset(["drawer", "cabinet"], "storage");
      if (cabinet) itemsToAdd.push({ ...cabinet, position: [-1.8, 0, 0.5], rotation: [0, Math.PI / 2, 0], instanceId: crypto.randomUUID() });
      
      const rug = findAsset(["rug", "carpet"], "rugs");
      if (rug) itemsToAdd.push({ ...rug, position: [0, 0.01, -0.3], rotation: [0, 0, 0], instanceId: crypto.randomUUID() });
      
      const lamp = findAsset(["lamp", "floor_lamp", "مصباح"], "lighting");
      if (lamp) itemsToAdd.push({ ...lamp, position: [1.4, 0, -1.5], rotation: [0, 0, 0], instanceId: crypto.randomUUID() });
    } else if (type === "Kitchen") {
      const table = findAsset(["outdoor", "table", "dining"], "tables");
      if (table) itemsToAdd.push({ ...table, position: [0, 0, 0], rotation: [0, 0, 0], instanceId: crypto.randomUUID() });
      
      const chair1 = findAsset(["dining", "deck", "chair"], "seating");
      if (chair1) itemsToAdd.push({ ...chair1, position: [-1.2, 0, 0.2], rotation: [0, Math.PI / 2, 0], instanceId: crypto.randomUUID() });
      
      const chair2 = findAsset(["dining", "deck", "chair"], "seating");
      if (chair2) itemsToAdd.push({ ...chair2, position: [1.2, 0, -0.2], rotation: [0, -Math.PI / 2, 0], instanceId: crypto.randomUUID() });

      const plant = findAsset(["plant", "tree"]);
      if (plant) itemsToAdd.push({ ...plant, position: [2, 0, 1.2], rotation: [0, 0, 0], instanceId: crypto.randomUUID() });
    }
    
    if (itemsToAdd.length === 0) {
      showToast("⚠️ لم يتم العثور على أثاث متاح في قاعدة البيانات");
      return;
    }
    
    itemsToAdd.forEach((item) => {
      addSceneItem(item);
    });
    
    showToast(`✅ تم تحميل قالب ${type} بنجاح!`);
    setIsTransitioning(true);
    setTimeout(() => setIsTransitioning(false), 800);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSaveProject = async () => {
    const payload = sceneItems.map(item => ({
      ...item,
      instance_id: item.instanceId,
      asset_id: item.id,
      position: item.position,
      rotation: item.rotation
    }));
    
    try {
      const res = await fetch("/api/v1/projects/proj_123/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomItems: payload })
      });
      if (res.ok) {
        showToast("✅ تم حفظ المشروع بنجاح");
      }
    } catch (e) {
      console.error(e);
      showToast("حدث خطأ أثناء الحفظ");
    }
  };

  useEffect(() => {
    // fetch("/api/v1/projects/proj_123")
    //   .then(res => {
    //     if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    //     return res.json();
    //   })
    //   .then(data => {
    //     if (data.roomItems && data.roomItems.length > 0) {
    //       useSceneStore.getState().clearScene();
    //       data.roomItems.forEach((item: any) => {
    //         useSceneStore.getState().addSceneItem({
    //           ...item,
    //           instanceId: item.instance_id || item.instanceId,
    //           id: item.asset_id || item.id,
    //         });
    //       });
    //     }
    //   })
    //   .catch(console.error);

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
      if (e.key === "Backspace" || e.key === "Delete") {
        const selected = useSceneStore.getState().selectedAssetId;
        if (selected) {
          useSceneStore.getState().removeSceneItem(selected);
          useSceneStore.getState().setSelectedAssetId(null);
          window.dispatchEvent(new CustomEvent('show-toast', { detail: "🗑️ تم حذف القطعة" }));
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <div className="print:hidden bg-surface text-on-surface overflow-hidden" dir="rtl">

        <StudioHeader
          onNewProject={handleNewProject}
          onOpenProjects={() => setIsProjectsModalOpen(true)}
          onUploadFloorplan={() => setIsFloorplanModalOpen(true)}
        />

        <ConversationPanel
          uiState={viewUiState}
          requests={viewRequests}
          prompt={prompt}
          onPromptChange={setPrompt}
          onSubmit={handleGenerate}
          onRetry={handleRetry}
          imagePreview={imageBase64}
          onAttachImage={setImageBase64}
          onClearImage={() => setImageBase64(null)}
        />

        <SceneDetailsDrawer
          isOpen={isDrawerOpen}
          onToggle={() => setIsDrawerOpen((open) => !open)}
          showToast={showToast}
          onOpenFurnitureLibrary={() => setIsModalOpen(true)}
          onOpenMaterialPalette={() => setIsMaterialPaletteOpen(true)}
          onOpenAudit={() => setIsAuditModalOpen(true)}
          onOpenAR={handleOpenAR}
          onOpenChatbot={() => setIsChatbotOpen(true)}
          onLoadTemplate={handleLoadTemplate}
          modelUrl={modelUrl}
        />

        <main className={`${REGION.canvas} overflow-hidden bg-background`}>
          {/* No bare `group` here: nothing uses it, and it silently triggered
              every `group-hover:` variant nested anywhere inside the canvas. */}
          <div className="relative h-full w-full overflow-hidden bg-surface-container-high">
            <div className="absolute inset-0 z-0">
              <Canvas 
                shadows 
                dpr={[1, 2]} 
                gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, outputColorSpace: THREE.SRGBColorSpace, preserveDrawingBuffer: true }}
                camera={{ position: [8.5, 6, 8.5], fov: 40 }}
              >
                <color attach="background" args={['#16181F']} />

                <SnapshotManager />
                <AmbientController />
                <LightingRig />
                
                <Suspense fallback={null}>
                  <ProceduralEnvironment ambientMode={ambientMode} />
                  <ContactShadows position={[0, 0.01, 0]} opacity={0.5} scale={20} blur={1.5} far={4} />
                  <group ref={exportGroupRef} position={[0, 0, 0]}>
                    <Physics debug={false}>
                      <SceneErrorBoundary>
                        {modelUrl ? <RoomModel url={modelUrl} /> : <EmptyRoom />}
                      </SceneErrorBoundary>

                      {/* ── Floor Circulation Flow & Walkway Heatmap ── */}
                      <CirculationHeatmap visible={showWalkwayHeatmap} />
                      
                      {/* ── Dynamic Real Furniture Items ── */}
                      {sceneItems.map((item) => (
                        <Suspense key={item.instanceId} fallback={null}>
                          <RealFurnitureLoader
                            instanceId={item.instanceId}
                            modelUrl={item.modelUrl}
                            brandName={item.brand}
                            category={item.category}
                            price={item.price}
                            dimensions={item.dimensions}
                            buyUrl={item.store_url || "#"}
                            color={item.color}
                            position={item.position}
                            rotation={item.rotation}
                          />
                        </Suspense>
                      ))}
                    </Physics>
                  </group> {/* SceneErrorBoundary closes above */}
                </Suspense>

                {/* Cinematic Post-Processing */}
                <EffectComposer>
                  <Bloom luminanceThreshold={1.2} mipmapBlur intensity={0.5} />
                </EffectComposer>

                {viewMode === 'orbit' ? (
                  <OrbitControls 
                    makeDefault
                    enabled={!isDragging}
                    ref={controlsRef} 
                    enablePan={true} 
                    enableZoom={true} 
                    maxPolarAngle={Math.PI / 2.05}
                    minDistance={2} 
                    maxDistance={25} 
                    target={[0, 1, 0]}
                  />
                ) : (
                  <>
                    <PointerLockControls makeDefault />
                    <FPVControls />
                  </>
                )}
              </Canvas>
            </div>



            {/* Active Selection Tooltip (Simulated) */}
            {isLoading && (
              <div className="absolute left-1/2 top-1/4 -translate-x-1/2 bg-surface p-stack-md rounded-xl shadow-md border border-outline-variant flex items-center gap-3 animate-pulse z-10">
                <div className="w-3 h-3 rounded-full bg-secondary" />
                <p className="font-label-md text-label-md">يتم الآن المعالجة بذكاء أستوديو التصميم...</p>
              </div>
            )}
            {/* Selected Asset Contextual Control Dock */}
            {selectedAsset && (
              <div className={`pointer-events-none absolute bottom-22 left-1/2 -translate-x-1/2 ${Z.sceneToolbar} z-30 animate-in fade-in slide-in-from-bottom-2 duration-200`}>
                <div className="pointer-events-auto flex items-center gap-2.5 bg-surface/95 dark:bg-surface-dim/95 border border-primary/35 rounded-2xl px-4 py-2 shadow-2xl backdrop-blur-xl" dir="rtl">
                  {/* Asset Info */}
                  <div className="flex items-center gap-2 border-l border-outline-variant/60 pl-3">
                    <div className="w-8 h-8 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
                      <span className="material-symbols-outlined text-[19px]">chair</span>
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="text-xs font-bold text-on-surface line-clamp-1 max-w-[130px]">{selectedAsset.name}</span>
                      <span className="text-[10px] text-secondary font-mono font-bold">
                        {formatCurrency(selectedAsset.price, 'SAR')}
                      </span>
                    </div>
                  </div>

                  {/* Rotation buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleRotateSelected(-Math.PI / 4)}
                      title="تدوير 45° يسار"
                      className="px-2.5 py-1.5 rounded-xl text-on-surface hover:bg-surface-container-high active:scale-95 transition-all flex items-center gap-1 text-xs font-bold"
                    >
                      <span className="material-symbols-outlined text-[17px]">rotate_left</span>
                      <span className="text-[10px]">45°-</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRotateSelected(Math.PI / 4)}
                      title="تدوير 45° يمين (أو اضغط R)"
                      className="px-2.5 py-1.5 rounded-xl text-on-surface hover:bg-surface-container-high active:scale-95 transition-all flex items-center gap-1 text-xs font-bold"
                    >
                      <span className="material-symbols-outlined text-[17px]">rotate_right</span>
                      <span className="text-[10px]">45°+</span>
                    </button>
                  </div>

                  <div className="w-px h-5 bg-outline-variant/60"></div>

                  {/* Fine Nudge Movement */}
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => handleNudgeSelected(-0.1, 0)}
                      title="تحريك يسار 10 سم"
                      className="p-1.5 rounded-lg text-on-surface hover:bg-surface-container-high active:scale-95"
                    >
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNudgeSelected(0.1, 0)}
                      title="تحريك يمين 10 سم"
                      className="p-1.5 rounded-lg text-on-surface hover:bg-surface-container-high active:scale-95"
                    >
                      <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                    </button>
                  </div>

                  <div className="w-px h-5 bg-outline-variant/60"></div>

                  {/* Material / Color */}
                  <button
                    type="button"
                    onClick={() => setIsMaterialPaletteOpen(true)}
                    title="تغيير اللون والخامة"
                    className="px-2.5 py-1.5 rounded-xl text-on-surface hover:bg-surface-container-high active:scale-95 transition-all flex items-center gap-1 text-xs font-bold"
                  >
                    <span className="material-symbols-outlined text-[17px] text-secondary">palette</span>
                    <span className="text-[10px]">الخامة</span>
                  </button>

                  <div className="w-px h-5 bg-outline-variant/60"></div>

                  {/* Delete Item */}
                  <button
                    type="button"
                    onClick={() => {
                      removeSceneItem(selectedAsset.instanceId);
                      setSelectedAssetId(null);
                      showToast("🗑️ تم حذف القطعة من المشهد");
                    }}
                    title="حذف القطعة (Delete)"
                    className="p-1.5 rounded-xl text-error hover:bg-error/10 active:scale-95 transition-all flex items-center justify-center"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>

                  {/* Deselect / Done */}
                  <button
                    type="button"
                    onClick={() => setSelectedAssetId(null)}
                    title="إنهاء التحديد"
                    className="px-3 py-1.5 rounded-xl bg-primary text-on-primary hover:opacity-90 active:scale-95 transition-all flex items-center gap-1 text-xs font-bold"
                  >
                    <span className="material-symbols-outlined text-[16px]">check</span>
                    <span className="text-[11px]">تم</span>
                  </button>
                </div>
              </div>
            )}

            <SceneToolbar
              onUndo={() => { undo(); showToast("↩️ تراجع"); }}
              onRedo={() => { redo(); showToast("↪️ إعادة"); }}
              viewMode={viewMode}
              onToggleViewMode={handleToggleViewMode}
              onResetView={resetCamera}
              onScreenshot={() => window.dispatchEvent(new CustomEvent("rwaq-snapshot"))}
              showWalkwayHeatmap={showWalkwayHeatmap}
              onToggleWalkwayHeatmap={() => {
                setShowWalkwayHeatmap((v) => {
                  const next = !v;
                  showToast(next ? "🛣️ تم تفعيل مخطط مسارات الحركة (كود البناء SBC)" : "إخفاء مخطط مسارات الحركة");
                  return next;
                });
              }}
              onAIRender={handleAIRender}
              isAIRendering={isAIRendering}
              onUploadFloorplan={() => setIsFloorplanModalOpen(true)}
              onOpenFurnitureLibrary={() => setIsModalOpen(true)}
            />

            {!isChatbotOpen && (
              <button
                type="button"
                onClick={() => setIsChatbotOpen(true)}
                aria-label="فتح المساعد الذكي"
                title="فتح المساعد الذكي للمحادثة وإضافة الأثاث"
                className={`absolute bottom-6 left-6 ${Z.sceneToolbar} flex items-center gap-2 rounded-2xl border border-secondary/30 bg-surface/90 px-4 py-2.5 text-xs font-bold text-on-surface shadow-[0_8px_24px_rgba(0,0,0,0.16)] backdrop-blur-xl transition-all hover:bg-secondary hover:text-white active:scale-95`}
              >
                <span className="material-symbols-outlined text-[19px]">smart_toy</span>
                <span>المساعد الذكي</span>
              </button>
            )}
          </div>
        </main>




      {/* ── مودال الأثاث ── */}
      {isModalOpen && (
        <div className={`fixed inset-0 ${Z.modal} flex items-center justify-center`} id="furniture-modal">
          <div className="absolute inset-0 bg-primary/20 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-surface w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-xl border border-outline-variant shadow-2xl flex flex-col z-10">
            <div className="flex items-center justify-between p-stack-lg border-b border-outline-variant bg-surface">
              <h3 className="font-headline-md font-bold text-on-surface">اختيار الأثاث</h3>
              <button className="material-symbols-outlined p-2 hover:bg-surface-container-high rounded-full transition-colors" onClick={() => setIsModalOpen(false)}>
                close
              </button>
            </div>
            <IkeaAssetsLibrary 
              onClose={() => setIsModalOpen(false)} 
              addSceneItem={addSceneItem} 
              isAssetsLoading={isAssetsLoading} 
              catalogAssets={catalogAssets} 
            />
          </div>
        </div>
      )}

      {/* ── مودال الواقع المعزز ── */}
      {isARModalOpen && (
        <div className={`fixed inset-0 ${Z.modal} flex items-center justify-center p-4`}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={handleCloseAR} />
          <div className="relative w-full max-w-5xl h-[85vh] bg-surface rounded-2xl overflow-hidden shadow-2xl flex flex-col z-10 border border-outline-variant">
            <div className="absolute top-4 left-4 z-50">
              <button
                className="bg-white/80 backdrop-blur text-gray-800 w-10 h-10 rounded-full shadow-lg hover:bg-white hover:scale-110 transition-all flex items-center justify-center"
                onClick={handleCloseAR}
                aria-label="إغلاق عرض الواقع المعزز"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <AdaptiveARViewer
              glbUrl={modelUrl ?? arBlobUrl ?? ""}
              sceneId={sceneId}
              hasServerGlb={Boolean(modelUrl)}
              isExporting={isExportingAR}
            />
          </div>
        </div>
      )}

      {/* ── مساعد رواق الذكي (Smart Economy) ── */}
      <CopilotSuggestions />

      {/* ── لوحة الخامات والألوان (Material Customizer) ── */}
      <MaterialPalette 
        isOpen={isMaterialPaletteOpen} 
        onClose={() => setIsMaterialPaletteOpen(false)} 
      />
        
      <ChatbotPanel
        isOpen={isChatbotOpen}
        setIsOpen={setIsChatbotOpen}
        showToast={showToast}
      />

      {/* ── محفظة المشاريع (Projects Management) ── */}
      <ProjectsModal 
        isOpen={isProjectsModalOpen}
        onClose={() => setIsProjectsModalOpen(false)}
        onShowToast={showToast}
        setModelUrl={setModelUrl}
        setSceneId={setSceneId}
      />

      {/* ── الفحص المعماري الذكي (Spatial & Neufert Audit) ── */}
      <SpatialAuditModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        showToast={showToast}
      />

      {/* ── الرندرة الواقعية بالذكاء الاصطناعي (Neural Render Bridge) ── */}
      <RenderComparisonModal
        isOpen={isAIRenderModalOpen}
        onClose={() => setIsAIRenderModalOpen(false)}
        beforeImageUrl={renderBeforeImage}
        afterImageUrl={renderAfterImage}
        roomStyle={activeReference || "مودرن فاخر"}
        sourceNote={renderSourceNote}
        promptUsed={renderPromptUsed}
      />

      {/* ── تحويل المخطط 2D إلى 3D (Floorplan Vision Modal) ── */}
      <FloorplanUploadModal
        isOpen={isFloorplanModalOpen}
        onClose={() => setIsFloorplanModalOpen(false)}
        showToast={showToast}
      />


        {/* ── Transition Overlay ── */}
        <div className={`fixed inset-0 ${Z.notification} pointer-events-none transition-opacity duration-700 ${isTransitioning ? "opacity-100" : "opacity-0"}`}>
          <div className="absolute inset-0 bg-linear-to-b from-primary/40 via-surface/60 to-surface/80 backdrop-blur-sm" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
            <p className="text-on-surface font-bold text-sm animate-pulse">جاري تجهيز الغرفة...</p>
          </div>
        </div>

        {/* ── تنبيه: الخادم غير متاح ──
             لا يُخفى هذا الخطأ خلف بيانات تجريبية: الكتالوج يبقى فارغاً حتى
             يعمل الخادم، عدا إذا طُلبت البيانات التجريبية صراحةً. */}
        {assetsError && (
          <div
            role="alert"
            className={`fixed top-20 left-1/2 -translate-x-1/2 ${Z.notification} flex items-center gap-3 rounded-full border border-error/40 bg-error-container px-5 py-2.5 text-on-error-container shadow-lg`}
          >
            <span className="material-symbols-outlined text-[20px]">cloud_off</span>
            <span className="text-sm font-medium">{assetsError}</span>
            {isDemoCatalog ? (
              <span className="rounded-full bg-on-error-container/15 px-2.5 py-0.5 text-[11px] font-bold">
                بيانات تجريبية
              </span>
            ) : (
              <a href="?demo=1" className="text-[11px] font-bold underline underline-offset-2">
                عرض بيانات تجريبية
              </a>
            )}
          </div>
        )}

        {/* ── إشعار Toast ── */}
        <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 bg-primary-container text-on-primary px-6 py-3 rounded-full shadow-lg ${Z.notification} transition-opacity duration-500 ${isToastVisible ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
          {toastMessage}
        </div>
      </div>

      {/* ── تقرير الطباعة (مخفي في العرض العادي، يظهر فقط عند الطباعة) ── */}
      <PrintReport />
    </>
  );
}
