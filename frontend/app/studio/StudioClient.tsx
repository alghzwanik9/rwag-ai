"use client";

import React, { useState, Suspense, useRef, useEffect, useMemo, useCallback } from "react";
import { Canvas, useFrame, useThree, ThreeEvent } from "@react-three/fiber";
import { OrbitControls, PointerLockControls, useGLTF, Environment, ContactShadows, Sparkles } from "@react-three/drei";
import { Physics } from "@react-three/rapier";
import { UserButton } from "@clerk/nextjs";
import * as THREE from 'three';
import { EffectComposer, Bloom, DepthOfField } from '@react-three/postprocessing';
import AdaptiveARViewer from "@/components/AdaptiveARViewer";
import CopilotSuggestions from "@/components/CopilotSuggestions";
import MaterialPalette from "@/components/MaterialPalette";
import ProjectsModal from "@/components/ProjectsModal";
import PrintReport from "@/components/PrintReport";
import { useSceneStore, useFormattedTotalCost, useFormattedBudgetLimit } from "@/lib/useSceneStore";
import type { WindowSize, CurtainStyle } from "@/lib/useSceneStore";
import { TemplateType } from "@/lib/templates";
import RealRoom from "./components/RealRoom";
import RealFurnitureLoader from "./components/RealFurnitureLoader";
import { ChatbotPanel } from "./components/ChatbotPanel";
import { useAssets } from "@/lib/useAssets";
import { IkeaAssetsLibrary } from "@/components/IkeaAssetsLibrary";

export interface AIResponseItem {
  instance_id: string;
  asset_id: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  dimensions?: { width: number; height: number; depth: number };
  economy?: {
    sku?: string;
    brand?: string;
    price?: number;
    currency?: string;
  };
}


const AMBIENT_PRESETS = {
  morning: {
    bg: new THREE.Color('#FDFBF7'),
    ambientColor: new THREE.Color('#ffffff'),
    ambientIntensity: 0.6,
    dirColor: new THREE.Color('#ffebd6'),
    dirIntensity: 1.6,
    dirPos: new THREE.Vector3(8, 12, -6),
    fogColor: new THREE.Color('#FDFBF7'),
  },
  rainy: {
    bg: new THREE.Color('#8c9fb3'),
    ambientColor: new THREE.Color('#c8d4dc'),
    ambientIntensity: 0.5,
    dirColor: new THREE.Color('#b0bcc8'),
    dirIntensity: 0.5,
    dirPos: new THREE.Vector3(0, 10, 0),
    fogColor: new THREE.Color('#8c9fb3'),
  },
  midnight: {
    bg: new THREE.Color('#0f172a'),
    ambientColor: new THREE.Color('#1e293b'),
    ambientIntensity: 0.15,
    dirColor: new THREE.Color('#38bdf8'),
    dirIntensity: 0.2,
    dirPos: new THREE.Vector3(-5, 5, 5),
    fogColor: new THREE.Color('#0f172a'),
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
      
      {/* Rain particles */}
      {ambientMode === 'rainy' && (
        <Sparkles 
          count={1000} 
          scale={[20, 20, 20]} 
          size={2} 
          speed={0.8} 
          opacity={0.2} 
          color="#ffffff" 
          position={[0, 5, 0]}
        />
      )}
      
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

  const [prompt, setPrompt]               = useState("");
  const [isLoading, setIsLoading]         = useState(false);
  const [isToastVisible, setIsToastVisible] = useState(false);
  const [toastMessage, setToastMessage]   = useState("");
  const [isModalOpen, setIsModalOpen]     = useState(false);
  const [isARModalOpen, setIsARModalOpen] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [isMaterialPaletteOpen, setIsMaterialPaletteOpen] = useState(false);
  const [isProjectsModalOpen, setIsProjectsModalOpen] = useState(false);
  const [isTemplatesMenuOpen, setIsTemplatesMenuOpen] = useState(false);
  const [isSettingsMenuOpen, setIsSettingsMenuOpen]   = useState(false);
  const [isTransitioning, setIsTransitioning]         = useState(false);
  const [settingsTab, setSettingsTab] = useState<'ambient'|'studio'|'room'|'materials'|'windows'>('ambient');
  // activeCategory removed
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { assets: catalogAssets, isLoading: isAssetsLoading } = useAssets();
  const controlsRef = useRef<React.ElementRef<typeof OrbitControls>>(null);

  const sceneItems       = useSceneStore((s) => s.sceneItems);
  const isBudgetExceeded = useSceneStore((s) => s.isBudgetExceeded);
  const isDragging       = useSceneStore((s) => s.isDragging);
  const clearScene       = useSceneStore((s) => s.clearScene);
  const addSceneItem     = useSceneStore((s) => s.addSceneItem);
  const ambientMode      = useSceneStore((s) => s.ambientMode);
  const setAmbientMode   = useSceneStore((s) => s.setAmbientMode);
  const coveLightIntensity = useSceneStore((s) => s.coveLightIntensity);
  const setCoveLightIntensity = useSceneStore((s) => s.setCoveLightIntensity);
  const coveLightColor   = useSceneStore((s) => s.coveLightColor);
  const setCoveLightColor = useSceneStore((s) => s.setCoveLightColor);
  const spotlightToggle  = useSceneStore((s) => s.spotlightToggle);
  const toggleSpotlight  = useSceneStore((s) => s.toggleSpotlight);
  const floorColor       = useSceneStore((s) => s.floorColor);
  const setFloorColor    = useSceneStore((s) => s.setFloorColor);
  const wallColor        = useSceneStore((s) => s.wallColor);
  const setWallColor     = useSceneStore((s) => s.setWallColor);
  const roomWidth        = useSceneStore((s) => s.roomWidth);
  const setRoomWidth     = useSceneStore((s) => s.setRoomWidth);
  const roomDepth        = useSceneStore((s) => s.roomDepth);
  const setRoomDepth     = useSceneStore((s) => s.setRoomDepth);
  const wallHeight       = useSceneStore((s) => s.wallHeight);
  const setWallHeight    = useSceneStore((s) => s.setWallHeight);
  const roomArea         = roomWidth * roomDepth;
  const undo             = useSceneStore((s) => s.undo);
  const redo             = useSceneStore((s) => s.redo);
  const viewMode         = useSceneStore((s) => s.viewMode);
  const setViewMode      = useSceneStore((s) => s.setViewMode);
  const resetToDefaults  = useSceneStore((s) => s.resetToDefaults);
  const formattedTotal   = useFormattedTotalCost();
  const formattedBudget  = useFormattedBudgetLimit();
  // Window state
  const windows          = useSceneStore((s) => s.windows);
  const addWindow        = useSceneStore((s) => s.addWindow);
  const removeWindow     = useSceneStore((s) => s.removeWindow);
  const updateWindow     = useSceneStore((s) => s.updateWindow);

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
    if (controlsRef.current) {
      controlsRef.current.reset();
      controlsRef.current.object.position.set(12, 8, 12);
      controlsRef.current.target.set(0, 1, 0);
      controlsRef.current.update();
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() && !imageBase64) return;
    setIsLoading(true);
    setToastMessage("جاري التوليد بذكاء رواق...");
    setIsToastVisible(true);

    try {
      const res = await fetch("/api/generate-room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt || "تصميم الغرفة الموجودة في الصورة", imageBase64 }),
      });

      if (res.ok) {
        const data = await res.json();
        
        if (data.items && data.items.length > 0) {
          clearScene();
          setModelUrl(null); // Clear the monolithic room if present
          
          data.items.forEach((item: AIResponseItem) => {
             const targetId = item.economy?.sku || item.asset_id;
             let matchingAsset = catalogAssets.find(a => a.id === targetId);

             // If exact match not found, fallback to a real 3D model from the catalog so we NEVER show a cube
             if (!matchingAsset && catalogAssets.length > 0) {
                const searchKeyword = item.asset_id.toLowerCase().split('_')[0];
                matchingAsset = catalogAssets.find(a => (a.category?.toLowerCase().includes(searchKeyword) || a.name.toLowerCase().includes(searchKeyword)) && a.modelUrl) 
                             || catalogAssets.find(a => a.modelUrl);
             }

             if (matchingAsset) {
                addSceneItem({
                    ...matchingAsset,
                    instanceId: item.instance_id,
                    position: item.position,
                    rotation: item.rotation
                });
             } else {
                // Ultimate fallback for missing assets if DB is totally empty
                addSceneItem({
                    instanceId: item.instance_id,
                    id: targetId || item.asset_id,
                    name: item.asset_id.replace("_", " "),
                    brand: item.economy?.brand || "Rwaq AI",
                    price: item.economy?.price || 0,
                    currency: item.economy?.currency || "SAR",
                    category: "seating",
                    modelUrl: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/SheenChair/glTF-Binary/SheenChair.glb", // Use actual fallback chair instead of cube
                    thumbnailUrl: "",
                    dimensions: item.dimensions || { width: 1, height: 1, depth: 1 },
                    position: item.position || [0,0,0],
                    rotation: item.rotation || [0,0,0]
                });
             }
          });
          
          if (data.room_dimensions) {
            setRoomWidth(data.room_dimensions.width);
            setRoomDepth(data.room_dimensions.depth);
          }
          if (data.ambient_mode) setAmbientMode(data.ambient_mode);
          if (data.floor_color) setFloorColor(data.floor_color);
          if (data.wall_color) setWallColor(data.wall_color);
          
          setToastMessage("تم بنجاح!");
          showToast("✅ اكتمل توليد الغرفة بالذكاء الاصطناعي!");
        } else {
          setToastMessage("❌ فشل التوليد، حاول مرة أخرى");
          showToast("❌ فشل التوليد، حاول مرة أخرى");
        }
        
        setPrompt("");
        setImageBase64(null);
      } else if (res.status === 429) {
        setToastMessage("تجاوزت الحد المسموح — انتظر دقيقة وأعد المحاولة");
      } else {
        setToastMessage("حدث خطأ في الاتصال بالخادم");
      }
    } catch {
      setToastMessage("تعذّر الاتصال بالخادم — تحقق من تشغيله");
    } finally {
      setIsLoading(false);
      setTimeout(() => setIsToastVisible(false), 5000);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
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
      setIsTemplatesMenuOpen(false);
      return;
    }
    
    itemsToAdd.forEach((item) => {
      addSceneItem(item);
    });
    
    showToast(`✅ تم تحميل قالب ${type} بنجاح!`);
    setIsTemplatesMenuOpen(false);
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

        <nav className="fixed left-4 top-1/2 -translate-y-1/2 w-16 bg-surface/60 backdrop-blur-xl rounded-2xl border border-outline-variant/30 shadow-2xl flex flex-col items-center gap-2 py-4 z-40 transition-all hover:bg-surface/80 hover:shadow-[0_8px_32px_rgba(0,0,0,0.1)]">
          
          <button onClick={() => setIsProjectsModalOpen(true)} className="group relative w-12 h-12 flex items-center justify-center rounded-xl text-primary hover:bg-primary hover:text-on-primary transition-all duration-300" title="حفظ المشروع">
            <span className="material-symbols-outlined transition-transform group-hover:scale-110">save</span>
            <div className="absolute left-full ml-3 opacity-0 group-hover:opacity-100 bg-surface text-on-surface px-2 py-1 rounded shadow-lg text-xs whitespace-nowrap pointer-events-none transition-opacity">حفظ المشروع</div>
          </button>
          
          <div className="w-8 h-px bg-outline-variant/30 my-1"></div>

          <button onClick={() => { undo(); showToast("↩️ تراجع"); }} className="group relative w-12 h-12 flex items-center justify-center rounded-xl text-on-surface-variant hover:bg-secondary-container/80 transition-all duration-300">
            <span className="material-symbols-outlined transition-transform group-hover:-translate-x-1">undo</span>
            <div className="absolute left-full ml-3 opacity-0 group-hover:opacity-100 bg-surface text-on-surface px-2 py-1 rounded shadow-lg text-xs whitespace-nowrap pointer-events-none transition-opacity">تراجع (Ctrl+Z)</div>
          </button>
          
          <button onClick={() => { redo(); showToast("↪️ إعادة"); }} className="group relative w-12 h-12 flex items-center justify-center rounded-xl text-on-surface-variant hover:bg-secondary-container/80 transition-all duration-300">
            <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">redo</span>
            <div className="absolute left-full ml-3 opacity-0 group-hover:opacity-100 bg-surface text-on-surface px-2 py-1 rounded shadow-lg text-xs whitespace-nowrap pointer-events-none transition-opacity">إعادة (Ctrl+Y)</div>
          </button>

          <div className="w-8 h-px bg-outline-variant/30 my-1"></div>
          
          {/* Settings Menu Button */}
          <div className="relative group/menu">
            <button 
              onClick={() => { setIsSettingsMenuOpen(!isSettingsMenuOpen); setIsTemplatesMenuOpen(false); }} 
              className={`relative w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-300 ${isSettingsMenuOpen ? 'bg-primary text-on-primary shadow-lg shadow-primary/30' : 'text-on-surface-variant hover:bg-secondary-container/80'}`}
            >
              <span className="material-symbols-outlined">tune</span>
              {isSettingsMenuOpen && <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-1 h-4 bg-primary rounded-full"></div>}
            </button>
            <div className="absolute left-full ml-3 opacity-0 group-hover/menu:opacity-100 bg-surface text-on-surface px-2 py-1 rounded shadow-lg text-xs whitespace-nowrap pointer-events-none transition-opacity">إعدادات البيئة والغرفة</div>
            
            {/* Tabbed Settings Popover */}
            {isSettingsMenuOpen && (
              <div className="absolute top-1/2 -translate-y-1/2 left-[72px] w-[340px] bg-surface/95 backdrop-blur-2xl border border-outline-variant/40 rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.15)] flex flex-col z-50 overflow-hidden transform origin-left animate-in fade-in zoom-in-95 duration-200">
                
                {/* Header */}
                <div className="flex justify-between items-center px-4 py-3 bg-surface/50 border-b border-outline-variant/30">
                  <h2 className="font-label-lg font-bold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[20px]">tune</span>
                    إعدادات البيئة
                  </h2>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => { resetToDefaults(); showToast("🔄 تم استعادة الإعدادات الافتراضية"); }} 
                      className="text-primary hover:text-secondary w-8 h-8 flex items-center justify-center rounded-lg hover:bg-primary/10 transition-colors"
                      title="إعادة ضبط على الافتراضي"
                    >
                      <span className="material-symbols-outlined text-[18px]">restart_alt</span>
                    </button>
                    <button onClick={() => setIsSettingsMenuOpen(false)} className="text-on-surface-variant hover:text-error w-8 h-8 flex items-center justify-center rounded-lg hover:bg-error/10 transition-colors">
                      <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                  </div>
                </div>

                {/* Tabs Navigation */}
                <div className="flex px-2 pt-2 gap-1 border-b border-outline-variant/20 bg-surface-variant/10">
                  {[
                    { id: 'ambient',   icon: 'routine',     label: 'الأجواء'     },
                    { id: 'studio',    icon: 'highlight',   label: 'الإضاءة'     },
                    { id: 'room',      icon: 'straighten',  label: 'الأبعاد'     },
                    { id: 'materials', icon: 'texture',     label: 'التشطيبات'  },
                    { id: 'windows',   icon: 'window',      label: 'النوافذ'     },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setSettingsTab(tab.id as 'ambient' | 'studio' | 'room' | 'materials' | 'windows')}
                      className={`flex-1 flex flex-col items-center justify-center gap-1 pb-2 pt-1 border-b-2 transition-all ${settingsTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/30 rounded-t-lg'}`}
                    >
                      <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                      <span className="text-[10px] font-bold">{tab.label}</span>
                    </button>
                  ))}
                </div>

                {/* Tab Content Area */}
                <div className="p-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                  
                  {/* Tab: Ambient */}
                  {settingsTab === 'ambient' && (
                    <div className="flex flex-col gap-2 animate-in slide-in-from-right-4 fade-in duration-300">
                      <button 
                        onClick={() => setAmbientMode('morning')}
                        className={`flex items-center gap-3 p-3 rounded-xl transition-all border ${ambientMode === 'morning' ? 'bg-primary/10 border-primary text-primary' : 'border-outline-variant/30 text-on-surface hover:bg-surface-variant/50 hover:border-outline-variant'}`}
                      >
                        <span className="material-symbols-outlined text-[24px]">light_mode</span>
                        <div className="text-right">
                          <div className="font-bold text-sm">الصباح الباكر</div>
                          <div className="text-[10px] opacity-70">إضاءة شمس دافئة وطبيعية</div>
                        </div>
                      </button>
                      <button 
                        onClick={() => setAmbientMode('rainy')}
                        className={`flex items-center gap-3 p-3 rounded-xl transition-all border ${ambientMode === 'rainy' ? 'bg-primary/10 border-primary text-primary' : 'border-outline-variant/30 text-on-surface hover:bg-surface-variant/50 hover:border-outline-variant'}`}
                      >
                        <span className="material-symbols-outlined text-[24px]">rainy</span>
                        <div className="text-right">
                          <div className="font-bold text-sm">يوم ماطر</div>
                          <div className="text-[10px] opacity-70">أجواء غائمة بظلال ناعمة</div>
                        </div>
                      </button>
                      <button 
                        onClick={() => setAmbientMode('midnight')}
                        className={`flex items-center gap-3 p-3 rounded-xl transition-all border ${ambientMode === 'midnight' ? 'bg-primary/10 border-primary text-primary' : 'border-outline-variant/30 text-on-surface hover:bg-surface-variant/50 hover:border-outline-variant'}`}
                      >
                        <span className="material-symbols-outlined text-[24px]">dark_mode</span>
                        <div className="text-right">
                          <div className="font-bold text-sm">المساء الهادئ</div>
                          <div className="text-[10px] opacity-70">إضاءة ليلية دراماتيكية</div>
                        </div>
                      </button>
                    </div>
                  )}

                  {/* Tab: Studio */}
                  {settingsTab === 'studio' && (
                    <div className="flex flex-col gap-5 animate-in slide-in-from-right-4 fade-in duration-300">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <label className="text-sm font-bold text-on-surface">الإضاءة المخفية (Cove)</label>
                          <span className="text-xs font-mono bg-primary/10 text-primary px-2 py-0.5 rounded">{coveLightIntensity}%</span>
                        </div>
                        <input 
                          type="range" min="0" max="100" 
                          value={coveLightIntensity}
                          onChange={(e) => setCoveLightIntensity(parseInt(e.target.value))}
                          className="w-full h-2 bg-outline-variant/30 rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <label className="text-sm font-bold text-on-surface">حرارة اللون</label>
                          <span className="text-xs font-mono bg-primary/10 text-primary px-2 py-0.5 rounded">{coveLightColor}K</span>
                        </div>
                        <input 
                          type="range" min="3000" max="6000" step="100"
                          value={coveLightColor}
                          onChange={(e) => setCoveLightColor(parseInt(e.target.value))}
                          className="w-full h-2 bg-linear-to-r from-[#ffebd6] via-[#ffffff] to-[#d6ebff] rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md"
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 bg-surface-variant/20 rounded-xl border border-outline-variant/30">
                        <label className="text-sm font-bold text-on-surface flex items-center gap-2">
                          <span className="material-symbols-outlined text-[18px] text-primary">highlight</span>
                          مسار الإضاءة (Spotlights)
                        </label>
                        <button 
                          onClick={() => toggleSpotlight(!spotlightToggle)}
                          className={`w-11 h-6 rounded-full relative transition-colors duration-300 ${spotlightToggle ? 'bg-primary' : 'bg-outline-variant/50'}`}
                        >
                          <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${spotlightToggle ? 'left-[26px]' : 'left-1'}`} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Tab: Room Dimensions */}
                  {settingsTab === 'room' && (
                    <div className="flex flex-col gap-4 animate-in slide-in-from-right-4 fade-in duration-300">
                      {[
                        { label: 'العرض (X)', value: roomWidth, setter: setRoomWidth, min: 3, max: 20 },
                        { label: 'العمق (Z)', value: roomDepth, setter: setRoomDepth, min: 3, max: 20 },
                        { label: 'الارتفاع (Y)', value: wallHeight, setter: setWallHeight, min: 2.5, max: 6, step: 0.1 }
                      ].map((dim, i) => (
                        <div key={i} className="bg-surface-variant/10 p-3 rounded-xl border border-outline-variant/20">
                          <div className="flex justify-between items-center mb-2">
                            <label className="text-sm font-bold text-on-surface">{dim.label}</label>
                            <span className="text-xs font-mono bg-primary/10 text-primary px-2 py-0.5 rounded">{dim.value}m</span>
                          </div>
                          <input 
                            type="range" min={dim.min} max={dim.max} step={dim.step || 0.5}
                            value={dim.value}
                            onChange={(e) => dim.setter(parseFloat(e.target.value))}
                            className="w-full h-1.5 bg-outline-variant/30 rounded-lg appearance-none cursor-pointer accent-primary"
                          />
                        </div>
                      ))}
                      <div className="mt-2 p-3 bg-primary/5 rounded-xl border border-primary/20 flex justify-between items-center">
                        <span className="text-xs font-bold text-on-surface-variant">المساحة الإجمالية</span>
                        <span className="text-lg font-black text-primary">{roomArea.toFixed(1)} <span className="text-xs">م²</span></span>
                      </div>
                    </div>
                  )}

                  {/* Tab: Materials */}
                  {settingsTab === 'materials' && (
                    <div className="flex flex-col gap-5 animate-in slide-in-from-right-4 fade-in duration-300">
                      <div>
                        <label className="text-sm font-bold text-on-surface mb-3 block">تشطيب الأرضية (Floor)</label>
                        <div className="grid grid-cols-4 gap-2">
                          {[
                            { id: 'wood_light', hex: '#d4b595', label: 'خشب فاتح' },
                            { id: 'marble_white', hex: '#f0f0f0', label: 'رخام أبيض' },
                            { id: 'concrete', hex: '#8a8d8f', label: 'خرسانة' },
                            { id: 'slate', hex: '#2f353b', label: 'سليت داكن' }
                          ].map(swatch => (
                            <button 
                              key={swatch.id}
                              onClick={() => setFloorColor(swatch.hex)}
                              className={`aspect-square rounded-xl border-2 transition-all hover:scale-105 hover:shadow-md relative ${floorColor === swatch.hex ? 'border-primary scale-105 shadow-sm' : 'border-transparent'}`}
                              style={{ backgroundColor: swatch.hex }}
                              title={swatch.label}
                            >
                              {floorColor === swatch.hex && <span className="absolute inset-0 flex items-center justify-center material-symbols-outlined text-white drop-shadow-md text-[18px]">check</span>}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="h-px bg-outline-variant/20"></div>

                      <div>
                        <label className="text-sm font-bold text-on-surface mb-3 block">ألوان الجدران (Walls)</label>
                        <div className="grid grid-cols-4 gap-2">
                          {[
                            { id: 'white', hex: '#fafafa', label: 'أبيض نقي' },
                            { id: 'beige', hex: '#e8e5df', label: 'بيج دافئ' },
                            { id: 'sage', hex: '#b2bfa5', label: 'أخضر مريمية' },
                            { id: 'navy', hex: '#2c3e50', label: 'أزرق داكن' }
                          ].map(swatch => (
                            <button 
                              key={swatch.id}
                              onClick={() => setWallColor(swatch.hex)}
                              className={`aspect-square rounded-xl border-2 transition-all hover:scale-105 hover:shadow-md relative ${wallColor === swatch.hex ? 'border-primary scale-105 shadow-sm' : 'border-transparent'}`}
                              style={{ backgroundColor: swatch.hex }}
                              title={swatch.label}
                            >
                              {wallColor === swatch.hex && <span className="absolute inset-0 flex items-center justify-center material-symbols-outlined text-white mix-blend-difference drop-shadow-md text-[18px]">check</span>}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tab: Windows */}
                  {settingsTab === 'windows' && (
                    <div className="flex flex-col gap-4 animate-in slide-in-from-right-4 fade-in duration-300">
                      <div className="flex gap-2">
                        <button
                          onClick={() => addWindow('back')}
                          className="flex-1 flex items-center justify-center gap-2 bg-secondary-container/60 text-on-surface text-xs font-bold py-2.5 rounded-xl border border-outline-variant/40 hover:bg-secondary/20 transition-all"
                        >
                          <span className="material-symbols-outlined text-[16px]">add</span>
                          نافذة خلفية
                        </button>
                        <button
                          onClick={() => addWindow('left')}
                          className="flex-1 flex items-center justify-center gap-2 bg-secondary-container/60 text-on-surface text-xs font-bold py-2.5 rounded-xl border border-outline-variant/40 hover:bg-secondary/20 transition-all"
                        >
                          <span className="material-symbols-outlined text-[16px]">add</span>
                          نافذة جانبية
                        </button>
                      </div>

                      {windows.length === 0 && (
                        <div className="text-center py-8 text-on-surface-variant">
                          <span className="material-symbols-outlined text-4xl opacity-30 block mb-2">window</span>
                          <p className="text-xs">لا توجد نوافذ بعد. أضف نافذة أعلاه!</p>
                        </div>
                      )}

                      {windows.map((win, idx) => (
                        <div key={win.id} className="bg-surface-variant/10 rounded-2xl border border-outline-variant/30 overflow-hidden">
                          <div className="flex items-center justify-between px-3 py-2 bg-surface-variant/20 border-b border-outline-variant/20">
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-[16px] text-secondary">window</span>
                              <span className="text-xs font-bold text-on-surface">
                                نافذة {idx + 1} · {win.wall === 'back' ? 'خلفية' : 'جانبية'}
                              </span>
                            </div>
                            <button onClick={() => removeWindow(win.id)} className="text-error/60 hover:text-error w-6 h-6 flex items-center justify-center rounded-lg hover:bg-error/10 transition-colors">
                              <span className="material-symbols-outlined text-[14px]">delete</span>
                            </button>
                          </div>

                          <div className="p-3 flex flex-col gap-3">
                            {/* Size */}
                            <div>
                              <p className="text-[10px] font-bold text-on-surface-variant mb-1.5">الحجم</p>
                              <div className="flex gap-1">
                                {(['small', 'medium', 'large'] as WindowSize[]).map((s) => (
                                  <button key={s} onClick={() => updateWindow(win.id, { size: s })}
                                    className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all border ${win.size === s ? 'bg-primary text-on-primary border-primary' : 'border-outline-variant/40 text-on-surface-variant hover:bg-surface-variant/30'}`}
                                  >
                                    {s === 'small' ? 'صغيرة' : s === 'medium' ? 'متوسطة' : 'كبيرة'}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Position */}
                            <div>
                              <div className="flex justify-between mb-1">
                                <p className="text-[10px] font-bold text-on-surface-variant">الموضع على الجدار</p>
                                <span className="text-[10px] font-mono text-primary">{Math.round(win.positionOffset * 100)}%</span>
                              </div>
                              <input type="range" min="-1" max="1" step="0.05" value={win.positionOffset}
                                onChange={(e) => updateWindow(win.id, { positionOffset: parseFloat(e.target.value) })}
                                className="w-full h-1.5 bg-outline-variant/30 rounded-lg appearance-none cursor-pointer accent-primary"
                              />
                            </div>

                            {/* Height */}
                            <div>
                              <div className="flex justify-between mb-1">
                                <p className="text-[10px] font-bold text-on-surface-variant">ارتفاع النافذة</p>
                                <span className="text-[10px] font-mono text-primary">{Math.round(win.height * 100)}%</span>
                              </div>
                              <input type="range" min="0.3" max="0.85" step="0.05" value={win.height}
                                onChange={(e) => updateWindow(win.id, { height: parseFloat(e.target.value) })}
                                className="w-full h-1.5 bg-outline-variant/30 rounded-lg appearance-none cursor-pointer accent-primary"
                              />
                            </div>

                            {/* Curtain Type */}
                            <div>
                              <p className="text-[10px] font-bold text-on-surface-variant mb-1.5">نوع الستارة</p>
                              <div className="grid grid-cols-2 gap-1">
                                {([
                                  { id: 'none', label: 'بدون ستارة', icon: 'block' },
                                  { id: 'sheer', label: 'شفافة', icon: 'texture' },
                                  { id: 'blackout', label: 'حجب ضوء', icon: 'dark_mode' },
                                  { id: 'draped', label: 'منسدلة', icon: 'curtains' },
                                ] as { id: CurtainStyle; label: string; icon: string }[]).map((c) => (
                                  <button key={c.id} onClick={() => updateWindow(win.id, { curtain: c.id })}
                                    className={`flex items-center gap-1.5 px-2 py-1.5 text-[10px] font-bold rounded-lg transition-all border ${win.curtain === c.id ? 'bg-secondary text-white border-secondary' : 'border-outline-variant/40 text-on-surface-variant hover:bg-surface-variant/30'}`}
                                  >
                                    <span className="material-symbols-outlined text-[12px]">{c.icon}</span>
                                    {c.label}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Curtain Color + Open/Close */}
                            {win.curtain !== 'none' && (
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5">
                                  <p className="text-[10px] font-bold text-on-surface-variant">اللون</p>
                                  <div className="flex gap-1">
                                    {['#f0ece4','#d4ccc0','#8fa8b2','#c5a882','#6b7b8d','#b8936a'].map((clr) => (
                                      <button key={clr} onClick={() => updateWindow(win.id, { curtainColor: clr })}
                                        className={`w-5 h-5 rounded-full border-2 transition-all ${win.curtainColor === clr ? 'border-primary scale-110' : 'border-transparent'}`}
                                        style={{ backgroundColor: clr }}
                                      />
                                    ))}
                                  </div>
                                </div>
                                <button onClick={() => updateWindow(win.id, { isOpen: !win.isOpen })}
                                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold border transition-all ${win.isOpen ? 'bg-primary/10 text-primary border-primary/30' : 'border-outline-variant/40 text-on-surface-variant'}`}
                                >
                                  <span className="material-symbols-outlined text-[12px]">{win.isOpen ? 'curtains' : 'curtains_closed'}</span>
                                  {win.isOpen ? 'مفتوحة' : 'مغلقة'}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              </div>
            )}
          </div>

          <div className="relative group/menu">
            <button 
              onClick={() => { setIsTemplatesMenuOpen(!isTemplatesMenuOpen); setIsSettingsMenuOpen(false); }} 
              className={`relative w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-300 ${isTemplatesMenuOpen ? 'bg-primary text-on-primary shadow-lg shadow-primary/30' : 'text-on-surface-variant hover:bg-secondary-container/80'}`}
            >
              <span className="material-symbols-outlined">dashboard_customize</span>
              {isTemplatesMenuOpen && <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-1 h-4 bg-primary rounded-full"></div>}
            </button>
            <div className="absolute left-full ml-3 opacity-0 group-hover/menu:opacity-100 bg-surface text-on-surface px-2 py-1 rounded shadow-lg text-xs whitespace-nowrap pointer-events-none transition-opacity">قوالب التصميم جاهزة</div>
            
            {isTemplatesMenuOpen && (
              <div className="absolute top-1/2 -translate-y-1/2 left-[72px] w-56 bg-surface/95 backdrop-blur-2xl border border-outline-variant/40 rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.15)] p-2 flex flex-col gap-1 z-50 transform origin-left animate-in fade-in zoom-in-95 duration-200">
                <p className="px-3 py-2 text-xs font-bold text-on-surface-variant border-b border-outline-variant/30 mb-2">اختر نموذجاً للبدء</p>
                <button onClick={() => { handleLoadTemplate("LivingRoom"); setIsTemplatesMenuOpen(false); }} className="flex items-center gap-3 text-right px-3 py-2.5 text-sm rounded-xl hover:bg-primary/10 hover:text-primary text-on-surface transition-colors font-bold"><span className="material-symbols-outlined text-[20px]">weekend</span>غرفة معيشة</button>
                <button onClick={() => { handleLoadTemplate("Bedroom"); setIsTemplatesMenuOpen(false); }} className="flex items-center gap-3 text-right px-3 py-2.5 text-sm rounded-xl hover:bg-primary/10 hover:text-primary text-on-surface transition-colors font-bold"><span className="material-symbols-outlined text-[20px]">bed</span>غرفة نوم</button>
                <button onClick={() => { handleLoadTemplate("Kitchen"); setIsTemplatesMenuOpen(false); }} className="flex items-center gap-3 text-right px-3 py-2.5 text-sm rounded-xl hover:bg-primary/10 hover:text-primary text-on-surface transition-colors font-bold"><span className="material-symbols-outlined text-[20px]">countertops</span>مطبخ و طعام</button>
              </div>
            )}
          </div>

          <div className="w-8 h-px bg-outline-variant/30 my-1"></div>
          
          <button onClick={() => setIsProjectsModalOpen(true)} className="group relative w-12 h-12 flex items-center justify-center rounded-xl text-on-surface-variant hover:bg-secondary-container/80 transition-all duration-300">
            <span className="material-symbols-outlined transition-transform group-hover:scale-110">folder_open</span>
            <div className="absolute left-full ml-3 opacity-0 group-hover:opacity-100 bg-surface text-on-surface px-2 py-1 rounded shadow-lg text-xs whitespace-nowrap pointer-events-none transition-opacity">مشاريعي</div>
          </button>
          
          <button onClick={() => setIsModalOpen(true)} className="group relative w-12 h-12 flex items-center justify-center rounded-xl bg-primary text-on-primary hover:bg-primary/90 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300 hover:-translate-y-0.5">
            <span className="material-symbols-outlined">chair</span>
            <div className="absolute left-full ml-3 opacity-0 group-hover:opacity-100 bg-surface px-2 py-1 rounded shadow-lg text-xs whitespace-nowrap pointer-events-none transition-opacity text-primary font-bold">إضافة أثاث</div>
          </button>
          <button onClick={() => setIsMaterialPaletteOpen(true)} className="group relative w-12 h-12 flex items-center justify-center rounded-xl text-on-surface-variant hover:bg-secondary-container/80 transition-all duration-300">
            <span className="material-symbols-outlined transition-transform group-hover:scale-110">palette</span>
            <div className="absolute left-full ml-3 opacity-0 group-hover:opacity-100 bg-surface text-on-surface px-2 py-1 rounded shadow-lg text-xs whitespace-nowrap pointer-events-none transition-opacity">مكتبة الألوان</div>
          </button>
          <button onClick={() => window.dispatchEvent(new CustomEvent('rwaq-snapshot'))} className="w-12 h-12 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-secondary-container/50 transition-all" title="لقطة شاشة">
            <span className="material-symbols-outlined">camera_alt</span>
          </button>
          <button onClick={() => setIsARModalOpen(true)} className="w-12 h-12 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-secondary-container/50 transition-all" title="الواقع المعزز">
            <span className="material-symbols-outlined">view_in_ar</span>
          </button>
          <div className="w-8 h-px bg-outline-variant"></div>
          <button 
            onClick={() => {
              setViewMode(viewMode === 'orbit' ? 'fpv' : 'orbit');
              if (viewMode === 'orbit') {
                showToast("🚶‍♂️ وضع التجول مفعل (استخدم W, A, S, D للحركة و الماوس للنظر)");
              } else {
                showToast("🔄 وضع الدوران مفعل");
                resetCamera();
              }
            }} 
            className={`w-12 h-12 flex items-center justify-center rounded-full transition-all ${viewMode === 'fpv' ? 'bg-secondary-container text-on-secondary-container scale-105' : 'text-on-surface-variant hover:bg-secondary-container/50'}`} 
            title={viewMode === 'fpv' ? "إلغاء التجول" : "تجول (Walkthrough)"}
          >
            <span className="material-symbols-outlined">{viewMode === 'fpv' ? "cancel" : "directions_walk"}</span>
          </button>
          <div className="w-8 h-px bg-outline-variant"></div>
          <button onClick={resetCamera} className="w-10 h-10 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high transition-all" title="إعادة المنظور">
            <span className="material-symbols-outlined">my_location</span>
          </button>
          
          <div className="w-8 h-px bg-outline-variant/30 my-1"></div>

          {/* Clerk User Button */}
          <div className="group relative w-12 h-12 flex items-center justify-center rounded-xl">
            <UserButton appearance={{ elements: { userButtonAvatarBox: "w-10 h-10 shadow-sm" } }} />
            <div className="absolute left-full ml-3 opacity-0 group-hover:opacity-100 bg-surface text-on-surface px-2 py-1 rounded shadow-lg text-xs whitespace-nowrap pointer-events-none transition-opacity">الحساب الشخصي</div>
          </div>
        </nav>

        <main className="fixed inset-0 pr-[280px] pt-16 pb-24 overflow-hidden bg-background flex items-center justify-center p-container-padding">
          <div className="w-full h-full relative rounded-xl border border-outline-variant bg-white overflow-hidden group">
            <div className="absolute inset-0 z-0">
              <Canvas 
                shadows 
                dpr={[1, 2]} 
                gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, outputColorSpace: THREE.SRGBColorSpace, preserveDrawingBuffer: true }}
                camera={{ position: [12, 8, 12], fov: 45 }}
              >
                <color attach="background" args={['#f4f4f6']} />
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

            {/* Viewport Controls */}
            <div className="absolute top-4 right-4 flex flex-col gap-2">
              <button 
                onClick={resetCamera}
                title="إعادة ضبط الكاميرا"
                className="bg-surface/90 backdrop-blur p-2 rounded border border-outline-variant hover:bg-white text-on-surface"
              >
                <span className="material-symbols-outlined">3d_rotation</span>
              </button>
              <button 
                onClick={() => {
                  if (controlsRef.current && controlsRef.current.object) {
                    const camera = controlsRef.current.object;
                    const target = controlsRef.current.target;
                    const direction = camera.position.clone().sub(target).normalize();
                    camera.position.addScaledVector(direction, -2);
                    controlsRef.current.update();
                  }
                }}
                title="تقريب"
                className="bg-surface/90 backdrop-blur p-2 rounded border border-outline-variant hover:bg-white text-on-surface"
              >
                <span className="material-symbols-outlined">zoom_in</span>
              </button>
              <button 
                onClick={() => {
                  if (controlsRef.current && controlsRef.current.object) {
                    const camera = controlsRef.current.object;
                    const target = controlsRef.current.target;
                    const direction = camera.position.clone().sub(target).normalize();
                    camera.position.addScaledVector(direction, 2);
                    controlsRef.current.update();
                  }
                }}
                title="إبعاد"
                className="bg-surface/90 backdrop-blur p-2 rounded border border-outline-variant hover:bg-white text-on-surface"
              >
                <span className="material-symbols-outlined">zoom_out</span>
              </button>
            </div>

            {/* Active Selection Tooltip (Simulated) */}
            {isLoading && (
              <div className="absolute left-1/2 top-1/4 -translate-x-1/2 bg-surface p-stack-md rounded-xl shadow-md border border-outline-variant flex items-center gap-3 animate-pulse z-10">
                <div className="w-3 h-3 rounded-full bg-secondary" />
                <p className="font-label-md text-label-md">يتم الآن المعالجة بذكاء أستوديو التصميم...</p>
              </div>
            )}
          </div>
        </main>

        {/* AI Prompt Input (Bottom Center) */}
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-full max-w-[800px] z-50 px-container-padding pointer-events-none flex flex-col items-center">
          {imageBase64 && (
            <div className="relative pointer-events-auto bg-surface-container-lowest border border-outline-variant rounded-xl p-2 shadow-sm self-end mb-2 mr-6">
              <button 
                onClick={() => setImageBase64(null)}
                className="absolute -top-2 -right-2 bg-error text-on-error rounded-full w-6 h-6 flex items-center justify-center shadow-sm hover:scale-105 transition-transform"
              >
                <span className="material-symbols-outlined text-[14px]">close</span>
              </button>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageBase64} alt="Upload Preview" className="h-16 w-16 object-cover rounded-lg border border-outline-variant" />
            </div>
          )}
          <div className="pointer-events-auto w-full bg-surface-container-lowest border border-outline-variant shadow-md rounded-full flex items-center px-6 py-3 gap-stack-md focus-within:ring-2 ring-secondary/20 transition-all hover:border-secondary">
            <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            <input 
              className="grow bg-transparent border-none focus:ring-0 font-body-lg text-body-lg placeholder-on-surface-variant text-primary" 
              dir="rtl" 
              placeholder="اكتب طلبك هنا، مثال: غرفة جلوس مودرن، أو ارفع صورة..." 
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
            />
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
              className="hidden" 
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="text-on-surface-variant hover:text-primary transition-colors p-2 rounded-full hover:bg-surface-container-high"
              title="إرفاق صورة"
            >
              <span className="material-symbols-outlined">attach_file</span>
            </button>
            <button 
              onClick={handleGenerate}
              disabled={isLoading}
              className={`${isLoading ? "bg-surface-tint" : "bg-primary"} text-on-primary rounded-full px-8 py-2 font-label-md text-label-md transition-all active:scale-95 flex items-center gap-2`}
            >
              <span>{isLoading ? "جاري..." : "توليد"}</span>
              {!isLoading && <span className="material-symbols-outlined text-sm">send</span>}
            </button>
          </div>
        </div>

        {/* Quick Info Cards (Bento style at bottom corners) - Reusing Stitch layout for economy summary */}
        <div className="fixed bottom-24 right-[300px] flex gap-4 pointer-events-none">
          <div className="bg-surface/90 backdrop-blur p-4 rounded-xl border border-outline-variant shadow-sm w-48 pointer-events-auto">
            <p className="font-label-sm text-label-sm text-on-surface-variant mb-1">الميزانية التقديرية</p>
            <h4 className="font-headline-md text-headline-md font-bold text-secondary">{formattedBudget}</h4>
          </div>
          <div className="bg-surface/90 backdrop-blur p-4 rounded-xl border border-outline-variant shadow-sm w-48 pointer-events-auto">
            <p className="font-label-sm text-label-sm text-on-surface-variant mb-1">التكلفة الفعلية</p>
            <h4 className={`font-headline-md text-headline-md font-bold ${isBudgetExceeded() ? "text-error" : "text-primary"}`}>{formattedTotal}</h4>
          </div>
        </div>



      {/* ── مودال الأثاث ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center" id="furniture-modal">
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
        <div className="fixed inset-0 z-110 flex items-center justify-center p-4">
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

        {/* ── Transition Overlay ── */}
        <div className={`fixed inset-0 z-90 pointer-events-none transition-opacity duration-700 ${isTransitioning ? "opacity-100" : "opacity-0"}`}>
          <div className="absolute inset-0 bg-linear-to-b from-primary/40 via-surface/60 to-surface/80 backdrop-blur-sm" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
            <p className="text-on-surface font-bold text-sm animate-pulse">جاري تجهيز الغرفة...</p>
          </div>
        </div>

        {/* ── إشعار Toast ── */}
        <div className={`fixed bottom-32 left-1/2 -translate-x-1/2 bg-primary-container text-on-primary px-6 py-3 rounded-full shadow-lg z-100 transition-opacity duration-500 ${isToastVisible ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
          {toastMessage}
        </div>
      </div>

      {/* ── تقرير الطباعة (مخفي في العرض العادي، يظهر فقط عند الطباعة) ── */}
      <PrintReport />
    </>
  );
}
