'use client';

import React from 'react';
import { ContactShadows } from '@react-three/drei';
import { RigidBody } from '@react-three/rapier';
import { useSceneStore, RoomWindow } from '@/lib/useSceneStore';
import * as THREE from 'three';

/** Maps window size to [width, height] in meters */
const WINDOW_DIMS: Record<string, [number, number]> = {
  small: [0.9, 1.2],
  medium: [1.6, 1.8],
  large: [2.4, 2.2],
};

const CURTAIN_OPACITY: Record<string, number> = {
  none: 0,
  sheer: 0.35,
  blackout: 0.92,
  draped: 0.75,
};

/** High-end Architectural Window Component */
function ArchitecturalWindow({ win, roomWidth, wallHeight }: { win: RoomWindow; roomWidth: number; wallHeight: number }) {
  const [winW, winH] = WINDOW_DIMS[win.size] || [1.6, 1.8];
  const posX = win.positionOffset * (roomWidth / 2 - winW / 2 - 0.5);
  const posY = win.height * wallHeight;
  const posZ = -roomWidth / 2 + 0.12;

  const curtainOpacity = CURTAIN_OPACITY[win.curtain] ?? 0.35;
  const curtainOffset = win.isOpen ? winW * 0.4 : 0;

  return (
    <group position={[posX, posY, posZ]}>
      {/* Aluminum Window Frame */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[winW + 0.08, winH + 0.08, 0.12]} />
        <meshStandardMaterial color="#2B2B2B" roughness={0.3} metalness={0.8} />
      </mesh>

      {/* Glass Pane */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[winW - 0.04, winH - 0.04, 0.02]} />
        <meshStandardMaterial
          color="#E8F4FA"
          roughness={0.05}
          metalness={0.9}
          transparent
          opacity={0.3}
        />
      </mesh>

      {/* Thin Mullion Divider */}
      <mesh position={[0, 0, 0.01]}>
        <boxGeometry args={[0.03, winH - 0.04, 0.04]} />
        <meshStandardMaterial color="#2B2B2B" roughness={0.3} metalness={0.8} />
      </mesh>

      {/* Modern Slim Curtain Rod */}
      <mesh position={[0, winH / 2 + 0.1, 0.14]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.012, 0.012, winW + 0.5, 16]} />
        <meshStandardMaterial color="#4A4A4A" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Linen Sheer Curtains */}
      {win.curtain !== 'none' && (
        <>
          <mesh position={[-(winW / 2) + curtainOffset * 0.5, 0, 0.16]}>
            <boxGeometry args={[winW / 2 - curtainOffset, winH + 0.25, 0.02]} />
            <meshStandardMaterial
              color={win.curtainColor || "#F7F5F0"}
              roughness={0.95}
              metalness={0}
              transparent
              opacity={curtainOpacity}
              side={THREE.DoubleSide}
            />
          </mesh>
          <mesh position={[(winW / 2) - curtainOffset * 0.5, 0, 0.16]}>
            <boxGeometry args={[winW / 2 - curtainOffset, winH + 0.25, 0.02]} />
            <meshStandardMaterial
              color={win.curtainColor || "#F7F5F0"}
              roughness={0.95}
              metalness={0}
              transparent
              opacity={curtainOpacity}
              side={THREE.DoubleSide}
            />
          </mesh>
        </>
      )}
    </group>
  );
}

/** Slim Modern Baseboard */
function Baseboard({ width, position, rotation }: { width: number; position: [number, number, number]; rotation?: [number, number, number] }) {
  return (
    <mesh position={position} rotation={rotation} receiveShadow>
      <boxGeometry args={[width, 0.07, 0.02]} />
      <meshStandardMaterial color="#333333" roughness={0.4} metalness={0.2} />
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

  // Palette tuning for luxury interior aesthetic
  const displayFloor = floorColor && floorColor !== '#4f3c2b' ? floorColor : '#C8B29B'; // Warm Natural Oak / Travertine
  const displayWall = wallColor && wallColor !== '#d6cdbd' ? wallColor : '#EDE8E0'; // Soft warm limestone plaster

  return (
    <group>
      {/* ── Studio Ground Shadow Pedestal ── */}
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <boxGeometry args={[roomWidth + 3.0, 0.08, roomDepth + 3.0]} />
        <meshStandardMaterial color="#E8E5DF" roughness={0.8} />
      </mesh>

      {/* ── Realistic Architectural Floor ── */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
          <planeGeometry args={[roomWidth, roomDepth]} />
          <meshStandardMaterial
            color={displayFloor}
            roughness={0.65}
            metalness={0.08}
          />
        </mesh>
      </RigidBody>

      {/* ── Back Wall (Warm Travertine / Plaster with Accent Inset) ── */}
      <RigidBody type="fixed" colliders="cuboid">
        <group position={[0, wallHeight / 2, -roomDepth / 2]}>
          {/* Main Wall Body */}
          <mesh receiveShadow castShadow>
            <boxGeometry args={[roomWidth, wallHeight, 0.16]} />
            <meshStandardMaterial color={displayWall} roughness={0.85} metalness={0.02} />
          </mesh>

          {/* Luxury Warm Wood / Slats Feature Accent (Center Section) */}
          <group position={[0, 0, 0.09]}>
            <mesh receiveShadow castShadow>
              <boxGeometry args={[roomWidth * 0.5, wallHeight - 0.2, 0.03]} />
              <meshStandardMaterial color="#8C6E52" roughness={0.65} metalness={0.05} />
            </mesh>

            {/* Subtle Vertical Wood Fluting / Slats */}
            {Array.from({ length: 18 }).map((_, i) => {
              const width = roomWidth * 0.5;
              const step = width / 19;
              const x = -width / 2 + step * (i + 1);
              return (
                <mesh key={i} position={[x, 0, 0.02]} receiveShadow castShadow>
                  <boxGeometry args={[0.035, wallHeight - 0.2, 0.025]} />
                  <meshStandardMaterial color="#6B533E" roughness={0.55} />
                </mesh>
              );
            })}
          </group>
        </group>
      </RigidBody>

      {/* ── Left Wall (Architectural Cutaway with Plaster Texture) ── */}
      <RigidBody type="fixed" colliders="cuboid">
        <group position={[-roomWidth / 2, wallHeight / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
          <mesh receiveShadow castShadow>
            <boxGeometry args={[roomDepth, wallHeight, 0.16]} />
            <meshStandardMaterial color={displayWall} roughness={0.88} metalness={0.02} />
          </mesh>
        </group>
      </RigidBody>

      {/* ── Architectural Cove Lighting Strip (Hidden Top Inset) ── */}
      <group position={[0, wallHeight - 0.05, -roomDepth / 2 + 0.12]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[roomWidth - 0.4, 0.03, 0.03]} />
          <meshBasicMaterial color="#FFE6C7" />
        </mesh>
        <pointLight position={[0, -0.05, 0.05]} color="#FFE0B2" intensity={0.8} distance={5} />
      </group>

      {/* ── Modern Architectural Baseboards ── */}
      <Baseboard width={roomWidth} position={[0, 0.035, -roomDepth / 2 + 0.09]} />
      <Baseboard width={roomDepth} position={[-roomWidth / 2 + 0.09, 0.035, 0]} rotation={[0, Math.PI / 2, 0]} />

      {/* ── Soft Floor Shadow Contacts ── */}
      <ContactShadows
        position={[0, 0.005, 0]}
        opacity={0.35}
        scale={Math.max(roomWidth, roomDepth) * 1.4}
        blur={2.0}
        far={3}
      />

      {/* ── Dynamic Windows ── */}
      {backWindows.map((win) => (
        <ArchitecturalWindow key={win.id} win={win} roomWidth={roomWidth} wallHeight={wallHeight} />
      ))}
    </group>
  );
}
