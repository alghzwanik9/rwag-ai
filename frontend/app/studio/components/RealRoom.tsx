'use client';

import { MeshReflectorMaterial, Grid } from '@react-three/drei';
import { RigidBody } from '@react-three/rapier';
import { useSceneStore, RoomWindow } from '@/lib/useSceneStore';
import * as THREE from 'three';

/** Maps window size to [width, height] in meters */
const WINDOW_DIMS: Record<string, [number, number]> = {
  small:  [0.8, 0.9],
  medium: [1.4, 1.4],
  large:  [2.2, 1.8],
};

const CURTAIN_OPACITY: Record<string, number> = {
  none: 0,
  sheer: 0.35,
  blackout: 0.92,
  draped: 0.75,
};

/** Renders a single window hole + frame + curtain on the back wall */
function BackWallWindow({ win, roomWidth, wallHeight }: { win: RoomWindow; roomWidth: number; wallHeight: number }) {
  const [winW, winH] = WINDOW_DIMS[win.size];
  const posX = win.positionOffset * (roomWidth / 2 - winW / 2 - 0.4);
  const posY = win.height * wallHeight;
  const posZ = -roomWidth / 2 + 0.1;

  const curtainOpacity = CURTAIN_OPACITY[win.curtain];
  const curtainOffset = win.isOpen ? winW * 0.45 : 0;

  return (
    <group position={[posX, posY, posZ]}>
      {/* Window frame (outer) */}
      <mesh>
        <boxGeometry args={[winW + 0.12, winH + 0.12, 0.25]} />
        <meshStandardMaterial color="#c8c0b0" roughness={0.6} metalness={0.1} />
      </mesh>

      {/* Window glass (inner) */}
      <mesh position={[0, 0, 0.01]}>
        <boxGeometry args={[winW - 0.04, winH - 0.04, 0.04]} />
        <meshStandardMaterial
          color="#a8d4f5"
          roughness={0.05}
          metalness={0.1}
          transparent
          opacity={0.25}
        />
      </mesh>

      {/* Window sill */}
      <mesh position={[0, -(winH / 2 + 0.04), 0.12]}>
        <boxGeometry args={[winW + 0.24, 0.06, 0.18]} />
        <meshStandardMaterial color="#d4cfc6" roughness={0.7} />
      </mesh>

      {/* Curtain rod */}
      <mesh position={[0, winH / 2 + 0.08, 0.14]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.015, 0.015, winW + 0.6, 8]} />
        <meshStandardMaterial color="#8a7a6a" metalness={0.6} roughness={0.3} />
      </mesh>

      {/* Left curtain panel */}
      {win.curtain !== 'none' && (
        <mesh position={[-(winW / 2) + curtainOffset * 0.5, 0, 0.16]}>
          <boxGeometry args={[winW / 2 - curtainOffset, winH + 0.3, 0.03]} />
          <meshStandardMaterial
            color={win.curtainColor}
            roughness={0.9}
            metalness={0}
            transparent
            opacity={curtainOpacity}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Right curtain panel */}
      {win.curtain !== 'none' && (
        <mesh position={[(winW / 2) - curtainOffset * 0.5, 0, 0.16]}>
          <boxGeometry args={[winW / 2 - curtainOffset, winH + 0.3, 0.03]} />
          <meshStandardMaterial
            color={win.curtainColor}
            roughness={0.9}
            metalness={0}
            transparent
            opacity={curtainOpacity}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
}

/** Renders a single window hole + frame + curtain on the left wall */
function LeftWallWindow({ win, roomDepth, wallHeight }: { win: RoomWindow; roomDepth: number; wallHeight: number }) {
  const [winW, winH] = WINDOW_DIMS[win.size];
  const posZ = win.positionOffset * (roomDepth / 2 - winW / 2 - 0.4);
  const posY = win.height * wallHeight;
  const posX = -roomDepth / 2 + 0.1;

  const curtainOpacity = CURTAIN_OPACITY[win.curtain];
  const curtainOffset = win.isOpen ? winW * 0.45 : 0;

  return (
    <group position={[posX, posY, posZ]} rotation={[0, Math.PI / 2, 0]}>
      {/* Window frame */}
      <mesh>
        <boxGeometry args={[winW + 0.12, winH + 0.12, 0.25]} />
        <meshStandardMaterial color="#c8c0b0" roughness={0.6} metalness={0.1} />
      </mesh>

      {/* Window glass */}
      <mesh position={[0, 0, 0.01]}>
        <boxGeometry args={[winW - 0.04, winH - 0.04, 0.04]} />
        <meshStandardMaterial color="#a8d4f5" roughness={0.05} metalness={0.1} transparent opacity={0.25} />
      </mesh>

      {/* Window sill */}
      <mesh position={[0, -(winH / 2 + 0.04), 0.12]}>
        <boxGeometry args={[winW + 0.24, 0.06, 0.18]} />
        <meshStandardMaterial color="#d4cfc6" roughness={0.7} />
      </mesh>

      {/* Curtain rod */}
      <mesh position={[0, winH / 2 + 0.08, 0.14]}>
        <cylinderGeometry args={[0.015, 0.015, winW + 0.6, 8]} />
        <meshStandardMaterial color="#8a7a6a" metalness={0.6} roughness={0.3} />
      </mesh>

      {/* Left curtain panel */}
      {win.curtain !== 'none' && (
        <mesh position={[-(winW / 2) + curtainOffset * 0.5, 0, 0.16]}>
          <boxGeometry args={[winW / 2 - curtainOffset, winH + 0.3, 0.03]} />
          <meshStandardMaterial
            color={win.curtainColor}
            roughness={0.9}
            transparent
            opacity={curtainOpacity}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Right curtain panel */}
      {win.curtain !== 'none' && (
        <mesh position={[(winW / 2) - curtainOffset * 0.5, 0, 0.16]}>
          <boxGeometry args={[winW / 2 - curtainOffset, winH + 0.3, 0.03]} />
          <meshStandardMaterial
            color={win.curtainColor}
            roughness={0.9}
            transparent
            opacity={curtainOpacity}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
}

function Baseboard({ width, height, position, rotation }: { width: number; height: number; position: [number, number, number]; rotation?: [number, number, number] }) {
  return (
    <mesh position={position} rotation={rotation} receiveShadow castShadow>
      <boxGeometry args={[width, height, 0.06]} />
      <meshStandardMaterial color="#e8e0d6" roughness={0.6} metalness={0.0} />
    </mesh>
  );
}

function CrownMolding({ width, position, rotation }: { width: number; position: [number, number, number]; rotation?: [number, number, number] }) {
  return (
    <mesh position={position} rotation={rotation}>
      <boxGeometry args={[width, 0.06, 0.12]} />
      <meshStandardMaterial color="#f0ece4" roughness={0.7} metalness={0.0} />
    </mesh>
  );
}

export default function RealRoom() {
  const floorColor  = useSceneStore((s) => s.floorColor);
  const wallColor   = useSceneStore((s) => s.wallColor);
  const roomWidth   = useSceneStore((s) => s.roomWidth);
  const roomDepth   = useSceneStore((s) => s.roomDepth);
  const wallHeight  = useSceneStore((s) => s.wallHeight);
  const windows     = useSceneStore((s) => s.windows);

  const backWindows = windows.filter((w) => w.wall === 'back');
  const leftWindows = windows.filter((w) => w.wall === 'left');

  const wallMaterial = new THREE.MeshStandardMaterial({
    color: wallColor,
    roughness: 0.85,
    metalness: 0.0,
  });

  return (
    <group>
      {/* Floor */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
          <planeGeometry args={[roomWidth, roomDepth]} />
          <MeshReflectorMaterial
            color={new THREE.Color(floorColor)}
            blur={[300, 100]}
            resolution={1024}
            mixBlur={1}
            mixStrength={40}
            roughness={0.2}
            depthScale={1.2}
            minDepthThreshold={0.4}
            maxDepthThreshold={1.4}
            metalness={0.1}
            mirror={1}
          />
        </mesh>
      </RigidBody>

      {/* Architectural Grid Overlay */}
      <Grid
        position={[0, 0.01, 0]}
        args={[roomWidth, roomDepth]}
        cellSize={1}
        cellThickness={1}
        cellColor={new THREE.Color("#666666")}
        sectionSize={5}
        sectionThickness={1.5}
        sectionColor={new THREE.Color("#888888")}
        fadeDistance={20}
        fadeStrength={1}
      />

      {/* Back Wall */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, wallHeight / 2, -roomDepth / 2]} receiveShadow castShadow>
          <boxGeometry args={[roomWidth, wallHeight, 0.2]} />
          <primitive object={wallMaterial.clone()} attach="material" />
        </mesh>
      </RigidBody>

      {/* Left Wall */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[-roomWidth / 2, wallHeight / 2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow castShadow>
          <boxGeometry args={[roomDepth, wallHeight, 0.2]} />
          <primitive object={wallMaterial.clone()} attach="material" />
        </mesh>
      </RigidBody>

      {/* Right Wall (for enclosure feel, thinner to avoid blocking view) */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[roomWidth / 2, wallHeight / 2, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow castShadow>
          <boxGeometry args={[roomDepth, wallHeight, 0.2]} />
          <primitive object={wallMaterial.clone()} attach="material" />
        </mesh>
      </RigidBody>

      {/* Baseboards */}
      <Baseboard width={roomWidth} height={0.08} position={[0, 0.04, -roomDepth / 2 + 0.01]} />
      <Baseboard width={roomDepth} height={0.08} position={[-roomWidth / 2 + 0.01, 0.04, 0]} rotation={[0, Math.PI / 2, 0]} />
      <Baseboard width={roomDepth} height={0.08} position={[roomWidth / 2 - 0.01, 0.04, 0]} rotation={[0, -Math.PI / 2, 0]} />

      {/* Crown molding */}
      <CrownMolding width={roomWidth} position={[0, wallHeight - 0.03, -roomDepth / 2 + 0.01]} />
      <CrownMolding width={roomDepth} position={[-roomWidth / 2 + 0.01, wallHeight - 0.03, 0]} rotation={[0, Math.PI / 2, 0]} />
      <CrownMolding width={roomDepth} position={[roomWidth / 2 - 0.01, wallHeight - 0.03, 0]} rotation={[0, -Math.PI / 2, 0]} />

      {/* 3D Windows — Back Wall */}
      {backWindows.map((win) => (
        <BackWallWindow key={win.id} win={win} roomWidth={roomDepth} wallHeight={wallHeight} />
      ))}

      {/* 3D Windows — Left Wall */}
      {leftWindows.map((win) => (
        <LeftWallWindow key={win.id} win={win} roomDepth={roomDepth} wallHeight={wallHeight} />
      ))}
    </group>
  );
}
