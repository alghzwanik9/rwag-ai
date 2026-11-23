'use client';

import React from 'react';
import { ContactShadows } from '@react-three/drei';
import { RigidBody } from '@react-three/rapier';
import { useSceneStore, RoomWindow, RoomDoor } from '@/lib/useSceneStore';
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
function ArchitecturalWindow({
  win,
  roomWidth,
  roomDepth,
  wallHeight,
  xOffset = 0,
}: {
  win: RoomWindow;
  roomWidth: number;
  roomDepth: number;
  wallHeight: number;
  xOffset?: number;
}) {
  const [winW, winH] = WINDOW_DIMS[win.size] || [1.6, 1.8];
  const posY = win.height * wallHeight;

  const isLeft = win.wall === 'left';
  const isRight = win.wall === 'right';
  const isFront = win.wall === 'front';

  const wallSpan = (isLeft || isRight) ? roomDepth : roomWidth;
  const maxOffset = Math.max(0, wallSpan / 2 - winW / 2 - 0.3);
  const clampedOffset = Math.max(-1, Math.min(1, win.positionOffset));

  let posX = clampedOffset * maxOffset + xOffset;
  let posZ = -roomDepth / 2 + 0.12;
  let rotation: [number, number, number] = [0, 0, 0];

  if (isLeft) {
    posX = -roomWidth / 2 + 0.12 + xOffset;
    posZ = clampedOffset * maxOffset;
    rotation = [0, Math.PI / 2, 0];
  } else if (isRight) {
    posX = roomWidth / 2 - 0.12 + xOffset;
    posZ = clampedOffset * maxOffset;
    rotation = [0, -Math.PI / 2, 0];
  } else if (isFront) {
    posX = clampedOffset * maxOffset + xOffset;
    posZ = roomDepth / 2 - 0.12;
    rotation = [0, Math.PI, 0];
  }

  const curtainOpacity = CURTAIN_OPACITY[win.curtain] ?? 0.35;
  const curtainOffset = win.isOpen ? winW * 0.4 : 0;

  return (
    <group position={[posX, posY, posZ]} rotation={rotation}>
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

/** High-end Architectural Door Component */
function ArchitecturalDoor({
  door,
  roomWidth,
  roomDepth,
  xOffset = 0,
}: {
  door: RoomDoor;
  roomWidth: number;
  roomDepth: number;
  wallHeight: number;
  xOffset?: number;
}) {
  const doorW = door.width || 0.9;
  const doorH = door.height || 2.1;
  const posY = doorH / 2;

  const isLeft = door.wall === 'left';
  const isRight = door.wall === 'right';
  const isFront = door.wall === 'front';

  const wallSpan = (isLeft || isRight) ? roomDepth : roomWidth;
  const maxOffset = Math.max(0, wallSpan / 2 - doorW / 2 - 0.2);
  const clampedOffset = Math.max(-1, Math.min(1, door.positionOffset || 0));

  let posX = clampedOffset * maxOffset + xOffset;
  let posZ = -roomDepth / 2 + 0.08;
  let rotation: [number, number, number] = [0, 0, 0];

  if (isLeft) {
    posX = -roomWidth / 2 + 0.08 + xOffset;
    posZ = clampedOffset * maxOffset;
    rotation = [0, Math.PI / 2, 0];
  } else if (isRight) {
    posX = roomWidth / 2 - 0.08 + xOffset;
    posZ = clampedOffset * maxOffset;
    rotation = [0, -Math.PI / 2, 0];
  } else if (isFront) {
    posX = clampedOffset * maxOffset + xOffset;
    posZ = roomDepth / 2 - 0.08;
    rotation = [0, Math.PI, 0];
  }

  return (
    <group position={[posX, posY, posZ]} rotation={rotation}>
      {/* Architrave / Outer Frame */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[doorW + 0.1, doorH + 0.06, 0.12]} />
        <meshStandardMaterial color="#22201E" roughness={0.4} metalness={0.4} />
      </mesh>

      {/* Modern Flush Door Leaf (Warm Walnut) */}
      <mesh position={[0, 0, 0.01]} castShadow receiveShadow>
        <boxGeometry args={[doorW - 0.02, doorH - 0.02, 0.05]} />
        <meshStandardMaterial color="#4A3728" roughness={0.55} metalness={0.1} />
      </mesh>

      {/* Minimalist Brushed Brass Lever Handle */}
      <group position={[doorW / 2 - 0.12, 0, 0.045]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.022, 0.022, 0.015, 16]} />
          <meshStandardMaterial color="#C5A059" roughness={0.25} metalness={0.9} />
        </mesh>
        <mesh position={[-0.05, 0, 0.02]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.009, 0.009, 0.11, 16]} />
          <meshStandardMaterial color="#C5A059" roughness={0.25} metalness={0.9} />
        </mesh>
      </group>
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
  const roomShape   = useSceneStore((s) => s.roomShape || 'single');
  const windows     = useSceneStore((s) => s.windows || []);
  const doors       = useSceneStore((s) => s.doors || []);

  const activeWindows = windows;

  // Palette tuning for luxury interior aesthetic
  const displayFloor = floorColor && floorColor !== '#4f3c2b' ? floorColor : '#C8B29B'; // Warm Natural Oak / Travertine
  const displayWall = wallColor && wallColor !== '#d6cdbd' ? wallColor : '#EDE8E0'; // Soft warm limestone plaster

  // Corridor geometry metrics
  const isCorridor = roomShape === 'corridor_room';
  const corridorWidth = 1.4;
  const corridorExtraDepth = 1.6;
  const corridorTotalDepth = roomDepth + corridorExtraDepth;
  const roomXOffset = isCorridor ? -corridorWidth / 2.0 : 0.0;
  const corridorCenterX = isCorridor ? (roomWidth / 2.0 + corridorWidth / 2.0 + roomXOffset) : 0.0;

  // Open plan metrics
  const isOpenPlan = roomShape === 'open_plan';
  const kitchenRatio = 0.35;
  const livingWidth = roomWidth * (1.0 - kitchenRatio);
  const kitchenWidth = roomWidth * kitchenRatio;

  // L-shape metrics
  const isLShape = roomShape === 'l_shape';

  return (
    <group>
      {/* ── Studio Ground Pedestal (Clean Minimalist Floor Trim) ── */}
      <mesh
        position={[isCorridor ? corridorCenterX / 2 : roomXOffset, -0.02, 0]}
        receiveShadow
      >
        <boxGeometry
          args={[
            roomWidth + (isCorridor ? corridorWidth + 0.4 : 0.4),
            0.04,
            roomDepth + (isCorridor ? corridorExtraDepth + 0.4 : 0.4),
          ]}
        />
        <meshStandardMaterial color="#22242B" roughness={0.7} metalness={0.15} />
      </mesh>

      {/* ── 1. MAIN ROOM FLOOR ── */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[isOpenPlan ? -roomWidth / 2 + livingWidth / 2 : roomXOffset, 0, isLShape ? -roomDepth * 0.15 : 0]}
          receiveShadow
        >
          <planeGeometry
            args={[
              isOpenPlan ? livingWidth : roomWidth,
              isLShape ? roomDepth * 0.7 : roomDepth,
            ]}
          />
          <meshStandardMaterial
            color={displayFloor}
            roughness={0.35}
            metalness={0.06}
          />
        </mesh>
      </RigidBody>

      {/* ── 2. CORRIDOR / HALLWAY FLOOR (when roomShape == 'corridor_room') ── */}
      {isCorridor && (
        <RigidBody type="fixed" colliders="cuboid">
          <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            position={[corridorCenterX, 0.001, 0]}
            receiveShadow
          >
            <planeGeometry args={[corridorWidth, corridorTotalDepth]} />
            <meshStandardMaterial
              color="#DCD7CE"
              roughness={0.55}
              metalness={0.05}
            />
          </mesh>

          {/* Brass Architectural Floor Transition Threshold */}
          <mesh position={[corridorCenterX - corridorWidth / 2.0, 0.005, 0]}>
            <boxGeometry args={[0.04, 0.008, roomDepth]} />
            <meshStandardMaterial color="#A38356" metalness={0.85} roughness={0.25} />
          </mesh>
        </RigidBody>
      )}

      {/* ── 3. OPEN-PLAN KITCHEN FLOOR (when roomShape == 'open_plan') ── */}
      {isOpenPlan && (
        <RigidBody type="fixed" colliders="cuboid">
          <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            position={[roomWidth / 2 - kitchenWidth / 2, 0.001, 0]}
            receiveShadow
          >
            <planeGeometry args={[kitchenWidth, roomDepth]} />
            <meshStandardMaterial
              color="#D6D0C5"
              roughness={0.45}
              metalness={0.05}
            />
          </mesh>

          {/* Marble Kitchen Island / Counter Partition */}
          <group position={[roomWidth / 2 - kitchenWidth, wallHeight * 0.18, 0]}>
            <mesh receiveShadow castShadow>
              <boxGeometry args={[0.35, wallHeight * 0.36, roomDepth * 0.55]} />
              <meshStandardMaterial color="#3D3B38" roughness={0.7} />
            </mesh>
            {/* Calacatta Marble Top */}
            <mesh position={[0, wallHeight * 0.18 + 0.02, 0]} receiveShadow castShadow>
              <boxGeometry args={[0.42, 0.04, roomDepth * 0.58]} />
              <meshStandardMaterial color="#F4F2EE" roughness={0.25} metalness={0.1} />
            </mesh>
          </group>

          {/* Architectural Ceiling Transition Beam */}
          <mesh position={[roomWidth / 2 - kitchenWidth, wallHeight - 0.1, 0]}>
            <boxGeometry args={[0.18, 0.2, roomDepth]} />
            <meshStandardMaterial color="#2B2824" roughness={0.6} />
          </mesh>
        </RigidBody>
      )}

      {/* ── 4. L-SHAPE EXTENSION WING (when roomShape == 'l_shape') ── */}
      {isLShape && (
        <RigidBody type="fixed" colliders="cuboid">
          <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            position={[-roomWidth * 0.25, 0.001, roomDepth * 0.35]}
            receiveShadow
          >
            <planeGeometry args={[roomWidth * 0.5, roomDepth * 0.5]} />
            <meshStandardMaterial
              color={displayFloor}
              roughness={0.65}
              metalness={0.08}
            />
          </mesh>
        </RigidBody>
      )}

      {/* ── 5. BACK WALL (Main Room - Clean Architectural Plaster) ── */}
      <RigidBody type="fixed" colliders="cuboid">
        <group position={[roomXOffset, wallHeight / 2, -roomDepth / 2]}>
          {/* Main Wall Body */}
          <mesh receiveShadow castShadow>
            <boxGeometry args={[roomWidth, wallHeight, 0.16]} />
            <meshStandardMaterial color={displayWall} roughness={0.88} metalness={0.02} />
          </mesh>
        </group>
      </RigidBody>

      {/* ── 6. CORRIDOR BACK & OUTER WALLS (when corridor_room) ── */}
      {isCorridor && (
        <RigidBody type="fixed" colliders="cuboid">
          {/* Corridor Back Wall */}
          <group position={[corridorCenterX, wallHeight / 2, -corridorTotalDepth / 2]}>
            <mesh receiveShadow castShadow>
              <boxGeometry args={[corridorWidth, wallHeight, 0.16]} />
              <meshStandardMaterial color={displayWall} roughness={0.88} />
            </mesh>
          </group>

          {/* Corridor Outer Right Wall */}
          <group position={[corridorCenterX + corridorWidth / 2, wallHeight / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
            <mesh receiveShadow castShadow>
              <boxGeometry args={[corridorTotalDepth, wallHeight, 0.16]} />
              <meshStandardMaterial color={displayWall} roughness={0.88} />
            </mesh>
          </group>

          {/* Architectural Portal / Doorway Arch Between Room and Corridor */}
          <group position={[roomWidth / 2 + roomXOffset, wallHeight / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
            {/* Wall segment north of door */}
            <mesh position={[-roomDepth / 4 - 0.4, 0, 0]} receiveShadow castShadow>
              <boxGeometry args={[roomDepth / 2 - 0.8, wallHeight, 0.16]} />
              <meshStandardMaterial color={displayWall} roughness={0.88} />
            </mesh>
            {/* Wall segment south of door */}
            <mesh position={[roomDepth / 4 + 0.4, 0, 0]} receiveShadow castShadow>
              <boxGeometry args={[roomDepth / 2 - 0.8, wallHeight, 0.16]} />
              <meshStandardMaterial color={displayWall} roughness={0.88} />
            </mesh>
            {/* Lintel above doorway */}
            <mesh position={[0, wallHeight / 2 - 0.25, 0]} receiveShadow castShadow>
              <boxGeometry args={[1.4, 0.5, 0.16]} />
              <meshStandardMaterial color={displayWall} roughness={0.88} />
            </mesh>
          </group>
        </RigidBody>
      )}

      {/* ── 7. LEFT WALL (Architectural Cutaway with Plaster Texture) ── */}
      <RigidBody type="fixed" colliders="cuboid">
        <group position={[-roomWidth / 2 + roomXOffset, wallHeight / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
          <mesh receiveShadow castShadow>
            <boxGeometry args={[roomDepth, wallHeight, 0.16]} />
            <meshStandardMaterial color={displayWall} roughness={0.88} metalness={0.02} />
          </mesh>
        </group>
      </RigidBody>

      {/* ── 8. ARCHITECTURAL COVE & CEILING TRIM ── */}
      <group position={[roomXOffset, wallHeight - 0.04, -roomDepth / 2 + 0.09]}>
        <mesh receiveShadow castShadow>
          <boxGeometry args={[roomWidth, 0.08, 0.04]} />
          <meshStandardMaterial color={displayWall} roughness={0.7} />
        </mesh>
        <pointLight position={[0, -0.1, 0.15]} color="#FFE4C4" intensity={0.6} distance={6} decay={2} />
      </group>

      {/* ── 9. MODERN ARCHITECTURAL BASEBOARDS ── */}
      <Baseboard width={roomWidth} position={[roomXOffset, 0.035, -roomDepth / 2 + 0.09]} />
      <Baseboard width={roomDepth} position={[-roomWidth / 2 + roomXOffset + 0.09, 0.035, 0]} rotation={[0, Math.PI / 2, 0]} />

      {/* ── 10. SOFT FLOOR SHADOW CONTACTS ── */}
      <ContactShadows
        position={[0, 0.005, 0]}
        opacity={0.35}
        scale={Math.max(roomWidth, roomDepth) * 1.5}
        blur={2.0}
        far={3}
      />

      {/* ── 11. DYNAMIC WINDOWS ── */}
      {activeWindows.map((win) => (
        <ArchitecturalWindow
          key={win.id}
          win={win}
          roomWidth={roomWidth}
          roomDepth={roomDepth}
          wallHeight={wallHeight}
          xOffset={roomXOffset}
        />
      ))}

      {/* ── 12. DYNAMIC DOORS ── */}
      {doors.map((door) => (
        <ArchitecturalDoor
          key={door.id}
          door={door}
          roomWidth={roomWidth}
          roomDepth={roomDepth}
          wallHeight={wallHeight}
          xOffset={roomXOffset}
        />
      ))}
    </group>
  );
}
