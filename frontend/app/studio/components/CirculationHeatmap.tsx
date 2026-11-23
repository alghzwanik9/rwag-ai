"use client";

import React, { useMemo } from "react";
import * as THREE from "three";
import { useSceneStore } from "@/lib/useSceneStore";

interface CirculationHeatmapProps {
  visible?: boolean;
}

/**
 * CirculationFlow / Walkway Heatmap Overlay for Rwaq AI Studio
 * Visualizes Saudi Building Code (SBC) and Neufert spatial clearance standards:
 * - 🟢 Primary Walkways (Clearance >= 0.90m)
 * - 🟡 Secondary / Tight Passages (0.45m - 0.89m)
 * - 🔴 Solid Furniture Obstacles & Enclosed Zones
 *
 * Implemented as a high-performance single-drawcall CanvasTexture plane.
 */
export default function CirculationHeatmap({ visible = true }: CirculationHeatmapProps) {
  const roomWidth = useSceneStore((s) => s.roomWidth);
  const roomDepth = useSceneStore((s) => s.roomDepth);
  const sceneItems = useSceneStore((s) => s.sceneItems);

  const texture = useMemo(() => {
    if (!visible) return null;

    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const w = canvas.width;
    const h = canvas.height;

    // Background: base soft grid
    ctx.clearRect(0, 0, w, h);

    const safeW = Math.max(1, roomWidth);
    const safeD = Math.max(1, roomDepth);

    const worldToCanvas = (wx: number, wz: number) => {
      const cx = ((wx + safeW / 2) / safeW) * w;
      const cy = ((wz + safeD / 2) / safeD) * h;
      return { cx, cy };
    };

    // 1. Extract solid obstacles (filter out rugs/carpets)
    const obstacles = sceneItems
      .filter((it) => {
        const cat = (it.category || it.id || it.name || "").toLowerCase();
        return !cat.includes("rug") && !cat.includes("carpet") && !cat.includes("سجاد");
      })
      .map((it) => {
        const px = it.position?.[0] ?? 0;
        const pz = it.position?.[2] ?? 0;
        const dims = it.dimensions || { width: 1000, depth: 800 };
        const rotY = it.rotation?.[1] ?? 0;
        // Convert mm to meters if needed
        const itemW = (dims.width > 20 ? dims.width / 1000 : dims.width) || 1.0;
        const itemD = (dims.depth > 20 ? dims.depth / 1000 : dims.depth) || 0.8;

        // Account for 90-degree rotations
        const isSwapped = Math.abs(Math.sin(rotY)) > 0.7;
        const finalW = isSwapped ? itemD : itemW;
        const finalD = isSwapped ? itemW : itemD;

        return {
          minX: px - finalW / 2,
          maxX: px + finalW / 2,
          minZ: pz - finalD / 2,
          maxZ: pz + finalD / 2,
          px,
          pz,
          finalW,
          finalD,
        };
      });

    // 2. Sample 2D floor clearance grid (cell resolution: 64x64)
    const gridSize = 64;
    const cellW = w / gridSize;
    const cellH = h / gridSize;

    for (let gx = 0; gx < gridSize; gx++) {
      for (let gz = 0; gz < gridSize; gz++) {
        // World coordinates for cell center
        const wx = -safeW / 2 + (gx + 0.5) * (safeW / gridSize);
        const wz = -safeD / 2 + (gz + 0.5) * (safeD / gridSize);

        // Distance to perimeter walls
        const distToWalls = Math.min(
          safeW / 2 - Math.abs(wx),
          safeD / 2 - Math.abs(wz)
        );

        // Calculate minimum distance to any solid obstacle
        let minObstacleDist = 999.0;
        let isInsideSolid = false;

        for (const obs of obstacles) {
          if (wx >= obs.minX && wx <= obs.maxX && wz >= obs.minZ && wz <= obs.maxZ) {
            isInsideSolid = true;
            minObstacleDist = 0.0;
            break;
          }
          const dx = Math.max(0, Math.max(obs.minX - wx, wx - obs.maxX));
          const dz = Math.max(0, Math.max(obs.minZ - wz, wz - obs.maxZ));
          const dist = Math.hypot(dx, dz);
          if (dist < minObstacleDist) {
            minObstacleDist = dist;
          }
        }

        const effectiveClearance = Math.min(minObstacleDist, distToWalls);

        if (isInsideSolid) {
          ctx.fillStyle = "rgba(239, 68, 68, 0.45)"; // Red: Occupied
        } else if (effectiveClearance >= 0.90) {
          ctx.fillStyle = "rgba(16, 185, 129, 0.28)"; // Green: SBC Primary Walkway (>= 0.90m)
        } else if (effectiveClearance >= 0.45) {
          ctx.fillStyle = "rgba(245, 158, 11, 0.22)"; // Amber: Secondary / Tight Passage
        } else {
          ctx.fillStyle = "rgba(239, 68, 68, 0.25)"; // Soft Red: Constricted Buffer (< 0.45m)
        }

        ctx.fillRect(gx * cellW, gz * cellH, cellW + 0.5, cellH + 0.5);
      }
    }

    // 3. Draw architectural grid overlay & primary walking spine
    ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= w; i += 32) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, h);
      ctx.stroke();
    }
    for (let j = 0; j <= h; j += 32) {
      ctx.beginPath();
      ctx.moveTo(0, j);
      ctx.lineTo(w, j);
      ctx.stroke();
    }

    // 4. Draw primary circulation flow vector (Front entrance towards center/back)
    const entrancePt = worldToCanvas(0, safeD / 2 - 0.4);
    const centerPt = worldToCanvas(0, 0);
    const backPt = worldToCanvas(0, -safeD / 2 + 0.9);

    ctx.strokeStyle = "rgba(16, 185, 129, 0.85)";
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 8]);
    ctx.beginPath();
    ctx.moveTo(entrancePt.cx, entrancePt.cy);
    ctx.lineTo(centerPt.cx, centerPt.cy);
    ctx.lineTo(backPt.cx, backPt.cy);
    ctx.stroke();
    ctx.setLineDash([]);

    // 5. Draw Obstacle outlines for crisp architectural presentation
    for (const obs of obstacles) {
      const topL = worldToCanvas(obs.minX, obs.minZ);
      const botR = worldToCanvas(obs.maxX, obs.maxZ);
      const ow = botR.cx - topL.cx;
      const oh = botR.cy - topL.cy;

      ctx.strokeStyle = "rgba(239, 68, 68, 0.9)";
      ctx.lineWidth = 2;
      ctx.strokeRect(topL.cx, topL.cy, ow, oh);
    }

    // 6. Draw SBC Code Stamp in top-right of canvas
    ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
    ctx.fillRect(w - 210, 12, 198, 48);
    ctx.strokeStyle = "rgba(16, 185, 129, 0.6)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(w - 210, 12, 198, 48);

    ctx.font = "bold 13px sans-serif";
    ctx.fillStyle = "#10B981";
    ctx.direction = "rtl";
    ctx.textAlign = "right";
    ctx.fillText("ممرات الحركة: كود البناء SBC", w - 20, 32);

    ctx.font = "10px sans-serif";
    ctx.fillStyle = "#E5E7EB";
    ctx.fillText("المسار الرئيسي: عرض ≥ 0.90م", w - 20, 48);

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.needsUpdate = true;
    return tex;
  }, [visible, roomWidth, roomDepth, sceneItems]);

  if (!visible || !texture) return null;

  return (
    <mesh
      position={[0, 0.018, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow={false}
    >
      <planeGeometry args={[roomWidth, roomDepth]} />
      <meshBasicMaterial
        map={texture}
        transparent={true}
        opacity={0.88}
        depthWrite={false}
      />
    </mesh>
  );
}
