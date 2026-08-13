'use client';

import { RoundedBox } from '@react-three/drei';
import {
  FLUTE,
  FURNISHINGS,
  FURNITURE,
  isPlaced,
  ROOM,
  type Furnishing,
  type PlacedFurnishing,
} from './config';

/**
 * Act 4 furniture: procedural volumes standing on the plan footprints.
 *
 * Boxes and rounded boxes only — no external models, nothing to download.
 * Floor pieces are authored with their origin on the floor and their footprint
 * centered on the origin, so `Scene` can place the group at the footprint's
 * position and extrude it upward from `scale.y = 0` without the volume sinking
 * through the slab.
 */

/** Bevel is a couple of millimetres of highlight, not a rounded-over shape. */
const SMOOTHNESS = 2;

/**
 * The room-side face of the fluting, which is what wall-mounted pieces sit
 * against — not the wall plane itself. The slats stand proud of the recess
 * panel, so anything hung flush to `-ROOM.depth / 2` would bury itself in them.
 */
const FLUTE_FACE_Z = -ROOM.depth / 2 + FLUTE.depth + 0.005;

/** 55-inch panel at 16:9, centred on the fluted wall. */
const TV = { w: 1.4, h: 0.79, depth: 0.045, centerY: 1.1 } as const;

function Sofa({ w, d }: { w: number; d: number }) {
  const armW = 0.2;
  const backD = 0.22;
  const seatW = w - armW * 2;
  return (
    <group>
      {/* Plinth */}
      <RoundedBox args={[w, 0.3, d]} radius={0.045} smoothness={SMOOTHNESS} position={[0, 0.15, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={FURNITURE.upholstery} roughness={0.94} metalness={0} />
      </RoundedBox>

      {/* Two seat cushions, split down the middle */}
      {[-1, 1].map((side) => (
        <RoundedBox
          key={side}
          args={[seatW / 2 - 0.02, 0.16, d - backD - 0.06]}
          radius={0.05}
          smoothness={SMOOTHNESS}
          position={[(side * (seatW / 2 + 0.02)) / 2, 0.38, -backD / 2]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial color={FURNITURE.upholstery} roughness={0.96} metalness={0} />
        </RoundedBox>
      ))}

      {/* Backrest along +z, so the sofa faces the coffee table */}
      <RoundedBox
        args={[w, 0.55, backD]}
        radius={0.05}
        smoothness={SMOOTHNESS}
        position={[0, 0.55, d / 2 - backD / 2]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color={FURNITURE.upholstery} roughness={0.94} metalness={0} />
      </RoundedBox>

      {/* Arms */}
      {[-1, 1].map((side) => (
        <RoundedBox
          key={side}
          args={[armW, 0.26, d]}
          radius={0.05}
          smoothness={SMOOTHNESS}
          position={[side * (w / 2 - armW / 2), 0.43, 0]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial color={FURNITURE.upholstery} roughness={0.94} metalness={0} />
        </RoundedBox>
      ))}
    </group>
  );
}

function CoffeeTable({ w, d }: { w: number; d: number }) {
  const height = 0.4;
  const topT = 0.055;
  return (
    <group>
      <RoundedBox
        args={[w, topT, d]}
        radius={0.018}
        smoothness={SMOOTHNESS}
        position={[0, height - topT / 2, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color={FURNITURE.oak} roughness={0.55} metalness={0} />
      </RoundedBox>

      {/* Slab legs rather than four posts — reads cleaner at this scale */}
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[side * (w / 2 - 0.09), (height - topT) / 2, 0]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[0.05, height - topT, d - 0.14]} />
          <meshStandardMaterial color={FURNITURE.frame} roughness={0.5} metalness={0.15} />
        </mesh>
      ))}
    </group>
  );
}

function Desk({ w, d }: { w: number; d: number }) {
  const height = 0.74;
  const topT = 0.045;
  const legT = 0.05;
  // Legs run the full clear height, so their base lands exactly on y = 0.
  const legH = height - topT;
  return (
    <group>
      <RoundedBox
        args={[w, topT, d]}
        radius={0.014}
        smoothness={SMOOTHNESS}
        position={[0, height - topT / 2, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color={FURNITURE.oak} roughness={0.55} metalness={0} />
      </RoundedBox>

      {[-1, 1].map((sx) =>
        [-1, 1].map((sz) => (
          <mesh
            key={`${sx}:${sz}`}
            position={[sx * (w / 2 - 0.09), legH / 2, sz * (d / 2 - 0.08)]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[legT, legH, legT]} />
            <meshStandardMaterial color={FURNITURE.frame} roughness={0.5} metalness={0.15} />
          </mesh>
        )),
      )}
    </group>
  );
}

/** Low sideboard under the TV, giving the fluted wall something to stand on. */
function Console({ w, d }: { w: number; d: number }) {
  const height = 0.32;
  const plinthH = 0.06;
  return (
    <group>
      <RoundedBox
        args={[w, height - plinthH, d]}
        radius={0.02}
        smoothness={SMOOTHNESS}
        position={[0, plinthH + (height - plinthH) / 2, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color={FURNITURE.oak} roughness={0.55} metalness={0} />
      </RoundedBox>

      {/* Recessed plinth — the shadow gap under it is what keeps the box from
          reading as a slab sitting flat on the travertine. */}
      <mesh position={[0, plinthH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w - 0.14, plinthH, d - 0.06]} />
        <meshStandardMaterial color={FURNITURE.frame} roughness={0.5} metalness={0.15} />
      </mesh>
    </group>
  );
}

/**
 * 10 mm, deliberately thinner than the plan overlay floats above the floor, so
 * the outline tracing this rug's own perimeter clears its top face instead of
 * coinciding with it.
 */
function Rug({ w, d }: { w: number; d: number }) {
  return (
    <mesh position={[0, 0.005, 0]} receiveShadow>
      <boxGeometry args={[w, 0.01, d]} />
      <meshStandardMaterial color={FURNITURE.rug} roughness={1} metalness={0} />
    </mesh>
  );
}

/** Wall-mounted panel. Authored about its own centre, not the floor. */
function Tv() {
  return (
    <RoundedBox
      args={[TV.w, TV.h, TV.depth]}
      radius={0.008}
      smoothness={SMOOTHNESS}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial color={FURNITURE.screen} roughness={0.32} metalness={0.1} />
    </RoundedBox>
  );
}

/**
 * How a piece arrives in Act 4.
 *
 * `extrude` grows up from the floor, `unroll` spreads across it, and `pop`
 * scales about the piece's own centre — the only option that works for
 * something hung on a wall, which has no floor contact to grow from.
 */
export type RevealMode = 'extrude' | 'unroll' | 'pop';

export const revealModeFor = (piece: Furnishing): RevealMode => {
  if (piece.id === 'rug') return 'unroll';
  return piece.footprint ? 'extrude' : 'pop';
};

function PlacedPiece({ piece }: { piece: PlacedFurnishing }) {
  const { w, d } = piece.footprint;
  switch (piece.id) {
    case 'rug':
      return <Rug w={w} d={d} />;
    case 'sofa':
      return <Sofa w={w} d={d} />;
    case 'table':
      return <CoffeeTable w={w} d={d} />;
    case 'desk':
      return <Desk w={w} d={d} />;
    case 'console':
      return <Console w={w} d={d} />;
    case 'tv':
      return null; // Wall-mounted, so it never carries a footprint.
  }
}

/**
 * One group per furnishing, in `FURNISHINGS` order — `Scene` drives the reveal
 * by index, so that order is the contract between the outlines and the volumes.
 */
export default function Furniture() {
  return (
    <>
      {FURNISHINGS.map((piece) =>
        isPlaced(piece) ? (
          <group key={piece.id} position={[piece.footprint.x, 0, piece.footprint.z]}>
            <PlacedPiece piece={piece} />
          </group>
        ) : (
          <group key={piece.id} position={[0, TV.centerY, FLUTE_FACE_Z + TV.depth / 2]}>
            <Tv />
          </group>
        ),
      )}
    </>
  );
}
