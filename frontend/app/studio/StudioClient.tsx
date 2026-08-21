"use client";

import React, { useState, Suspense, useRef, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "next/navigation";

import { Canvas, useFrame, useThree, ThreeEvent } from "@react-three/fiber";
import { OrbitControls, PointerLockControls, useGLTF, Environment, ContactShadows } from "@react-three/drei";
import { Physics } from "@react-three/rapier";
import * as THREE from 'three';
import { EffectComposer, Bloom, DepthOfField } from '@react-three/postprocessing';
import AdaptiveARViewer from "@/components/AdaptiveARViewer";
import CopilotSuggestions from "@/components/CopilotSuggestions";
import MaterialPalette from "@/components/MaterialPalette";
import ProjectsModal from "@/components/ProjectsModal";
import PrintReport from "@/components/PrintReport";
import { useSceneStore, useFormattedTotalCost } from "@/lib/useSceneStore";
import { TemplateType } from "@/lib/templates";
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


const AMBIENT_PRESETS = {
  morning: {
    bg: new THREE.Color('#EDE8E1'),
    ambientColor: new THREE.Color('#ffffff'),
    ambientIntensity: 0.65,
    dirColor: new THREE.Color('#FFF5E4'),
    dirIntensity: 1.4,
    dirPos: new THREE.Vector3(6, 9, 5),
    fogColor: new THREE.Color('#EDE8E1'),
  },
  rainy: {
    bg: new THREE.Color('#2C3540'),
    ambientColor: new THREE.Color('#8899A6'),
    ambientIntensity: 0.45,
    dirColor: new THREE.Color('#A4B8C6'),
    dirIntensity: 0.6,
    dirPos: new THREE.Vector3(0, 8, 4),
    fogColor: new THREE.Color('#2C3540'),
  },
  midnight: {
    bg: new THREE.Color('#0D1117'),
    ambientColor: new THREE.Color('#161B22'),
    ambientIntensity: 0.2,
    dirColor: new THREE.Color('#58A6FF'),
    dirIntensity: 0.4,
    dirPos: new THREE.Vector3(-4, 6, 4),
    fogColor: new THREE.Color('#0D1117'),
  }
};


function AmbientController() {
  const ambientMode = useSceneStore((s) => s.ambientMode);
  const { scene } = useThree();
  
  const dirLightRef = useRef<THREE.DirectionalLight>(null);
  const ambientLightRef = useRef<THREE.AmbientLight>(null);
  
  // Audio state
  useEffect(() => {
    const audio = new Audio("https://cdn.pixabay.com/download/audio/2021/08/04/audio_3d1a8c3d91.mp3?filename=rain-and-thunder-16705.mp3");
    audio.loop = true;
    audio.volume = 0.3;
    
    if (ambientMode === 'rainy') {
      audio.play().catch(e => console.log("Audio autoplay prevented", e));
    } else {
      audio.pause();
    }
    
    return () => {
      audio.pause();
      audio.src = "";
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
      scene.fog = new THREE.Fog(target.fogColor, 15, 40);
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
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0005}
        shadow-camera-near={0.5} 
        shadow-camera-far={50} 
        shadow-camera-left={-10} 
        shadow-camera-right={10} 
        shadow-camera-top={10} 
        shadow-camera-bottom={-10}
        shadow-normalBias={0.05}
      />
      
      {/* Rain effect disabled temporarily as it looks like a visual glitch loop */}

      
      {/* Fake interior point lights for midnight to make it cozy */}
      {ambientMode === 'midnight' && (
        <>
          <pointLight position={[0, 2, 0]} intensity={0.5} color="#ffebc2" distance={5} />
          <pointLight position={[-2, 1, -2]} intensity={0.3} color="#ffebc2" distance={3} />
        </>
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

function LightingRig() {
  const intensity = useSceneStore(s => s.coveLightIntensity);
  const colorK = useSceneStore(s => s.coveLightColor);
  const spotlightsOn = useSceneStore(s => s.spotlightToggle);

  const coveColor = useMemo(() => kelvinToColor(colorK), [colorK]);
  const covePower = (intensity / 100) * 0.8; 

  return (
    <group>
      {covePower > 0 && (
        <>
          <pointLight position={[-2.4, 2.8, -2.4]} intensity={covePower} color={coveColor} distance={4} />
          <pointLight position={[2.4, 2.8, -2.4]} intensity={covePower} color={coveColor} distance={4} />
          <pointLight position={[-2.4, 2.8, 2.4]} intensity={covePower} color={coveColor} distance={4} />
          <pointLight position={[2.4, 2.8, 2.4]} intensity={covePower} color={coveColor} distance={4} />
        </>
      )}

      {spotlightsOn && (
        <>
          <spotLight 
            position={[-1, 3, -1]} 
            angle={0.4} 
            penumbra={0.5} 
            intensity={2} 
            color="#ffeedd" 
            castShadow 
            shadow-mapSize={[512, 512]}
            target-position={[0, 0, 0]}
          />
          <spotLight 
            position={[1, 3, 1]} 
            angle={0.4} 
            penumbra={0.5} 
            intensity={1.5} 
            color="#ffeedd" 
            castShadow 
            shadow-mapSize={[512, 512]}
            target-position={[0, 0, 0]}
          />
        </>
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

  const [isToastVisible, setIsToastVisible] = useState(false);
  const [toastMessage, setToastMessage]   = useState("");
  const [isModalOpen, setIsModalOpen]     = useState(false);
  const [isARModalOpen, setIsARModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  const [isMaterialPaletteOpen, setIsMaterialPaletteOpen] = useState(false);
  const [isProjectsModalOpen, setIsProjectsModalOpen] = useState(false);
  const [isTransitioning, setIsTransitioning]         = useState(false);
  /** Collapsed by default; auto-opens when a generation settles. */
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

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
  const undo             = useSceneStore((s) => s.undo);
  const redo             = useSceneStore((s) => s.redo);
  const viewMode         = useSceneStore((s) => s.viewMode);
  const setViewMode      = useSceneStore((s) => s.setViewMode);
  const resetToDefaults  = useSceneStore((s) => s.resetToDefaults);
  const formattedTotal   = useFormattedTotalCost();

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
      const chair = findAsset(["chair", "armchair", "wood"], "seating");
      if (chair) itemsToAdd.push({ ...chair, position: [1.5, 0, -1.5], rotation: [0, -Math.PI / 4, 0], instanceId: crypto.randomUUID() });
      
      const cabinet = findAsset(["drawer", "cabinet"], "storage");
      if (cabinet) itemsToAdd.push({ ...cabinet, position: [-1.8, 0, 0.5], rotation: [0, Math.PI / 3, 0], instanceId: crypto.randomUUID() });
      
      const rug = findAsset(["rug", "carpet"], "rugs");
      if (rug) itemsToAdd.push({ ...rug, position: [0, 0.02, 0], rotation: [0, 0, 0], instanceId: crypto.randomUUID() });
      
      const decor = findAsset(["vase", "flower", "camera"], "decor");
      if (decor) itemsToAdd.push({ ...decor, position: [0.5, 0, -1.2], rotation: [0, 0, 0], instanceId: crypto.randomUUID() });
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
          onOpenAR={() => setIsARModalOpen(true)}
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
                <color attach="background" args={['#EDE8E1']} />

                <SnapshotManager />
                <AmbientController />
                <LightingRig />
                
                <Suspense fallback={null}>
                  <Environment preset={ambientMode === 'morning' ? 'city' : ambientMode === 'midnight' ? 'sunset' : 'apartment'} background={false} blur={0.6} />
                  <ContactShadows position={[0, 0.01, 0]} opacity={0.4} scale={20} blur={2} far={4} />
                  <group position={[0, 0, 0]}>
                    <Physics debug={false}>
                      <SceneErrorBoundary>
                        {modelUrl ? <RoomModel url={modelUrl} /> : <EmptyRoom />}
                      </SceneErrorBoundary>
                      
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
                            buyUrl={item.thumbnailUrl || "#"}
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
                  <Bloom luminanceThreshold={1.2} mipmapBlur intensity={0.8} />
                  <DepthOfField target={[0, 1, 0]} focalLength={0.3} bokehScale={3} height={480} />
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
            <SceneToolbar
              onUndo={() => { undo(); showToast("↩️ تراجع"); }}
              onRedo={() => { redo(); showToast("↪️ إعادة"); }}
              viewMode={viewMode}
              onToggleViewMode={handleToggleViewMode}
              onResetView={resetCamera}
              onScreenshot={() => window.dispatchEvent(new CustomEvent("rwaq-snapshot"))}
            />
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
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsARModalOpen(false)} />
          <div className="relative w-full max-w-5xl h-[85vh] bg-surface rounded-2xl overflow-hidden shadow-2xl flex flex-col z-10 border border-outline-variant">
            <div className="absolute top-4 left-4 z-50">
              <button
                className="bg-white/80 backdrop-blur text-gray-800 w-10 h-10 rounded-full shadow-lg hover:bg-white hover:scale-110 transition-all flex items-center justify-center"
                onClick={() => setIsARModalOpen(false)}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <AdaptiveARViewer glbUrl={modelUrl ?? ""} sceneId={sceneId} />
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
        onShowToast={setToastMessage}
        setModelUrl={setModelUrl}
        setSceneId={setSceneId}
      />

      {/* ── الفحص المعماري الذكي (Spatial & Neufert Audit) ── */}
      <SpatialAuditModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
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
