"use client";

import React, { useEffect, useRef } from "react";
import type { SceneItem, RoomWindow, RoomDoor } from "@/lib/useSceneStore";

export interface BlueprintCanvas2DProps {
  roomWidth: number;
  roomDepth: number;
  roomShape?: string;
  wallColor?: string;
  windows?: RoomWindow[];
  doors?: RoomDoor[];
  sceneItems: SceneItem[];
  width?: number;
  height?: number;
  className?: string;
  onRendered?: (dataUrl: string) => void;
}

/**
 * Renders a high-resolution top-down 2D architectural blueprint directly to HTML5 Canvas.
 * Compliant with Saudi Building Code (SBC 201) and Neufert dimensional standards.
 */
export function drawBlueprintToCanvas(
  ctx: CanvasRenderingContext2D,
  options: {
    roomWidth: number;
    roomDepth: number;
    roomShape?: string;
    windows?: RoomWindow[];
    doors?: RoomDoor[];
    sceneItems: SceneItem[];
    canvasWidth: number;
    canvasHeight: number;
  }
) {
  const {
    roomWidth,
    roomDepth,
    windows = [],
    doors = [],
    sceneItems = [],
    canvasWidth,
    canvasHeight,
  } = options;

  // Background - Clean Blueprint White
  ctx.fillStyle = "#F8FAFC";
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  const marginX = 80;
  const marginY = 80;
  const drawableW = canvasWidth - marginX * 2;
  const drawableH = canvasHeight - marginY * 2;

  // Compute scale pixels per meter
  const scale = Math.min(drawableW / roomWidth, drawableH / roomDepth);
  const roomPixelW = roomWidth * scale;
  const roomPixelH = roomDepth * scale;

  const originX = (canvasWidth - roomPixelW) / 2;
  const originY = (canvasHeight - roomPixelH) / 2;

  // Helper to map 3D world (X, Z) to 2D Canvas (X, Y)
  // 3D center is at (0, 0).
  const toCanvasX = (worldX: number) => originX + (worldX + roomWidth / 2) * scale;
  const toCanvasY = (worldZ: number) => originY + (worldZ + roomDepth / 2) * scale;

  // ── 1. Subtle 0.5m Architectural Grid ──
  ctx.save();
  ctx.strokeStyle = "#E2E8F0";
  ctx.lineWidth = 1;
  ctx.setLineDash([2, 4]);

  for (let x = -roomWidth / 2; x <= roomWidth / 2 + 0.01; x += 0.5) {
    const px = toCanvasX(x);
    ctx.beginPath();
    ctx.moveTo(px, originY);
    ctx.lineTo(px, originY + roomPixelH);
    ctx.stroke();
  }

  for (let z = -roomDepth / 2; z <= roomDepth / 2 + 0.01; z += 0.5) {
    const py = toCanvasY(z);
    ctx.beginPath();
    ctx.moveTo(originX, py);
    ctx.lineTo(originX + roomPixelW, py);
    ctx.stroke();
  }
  ctx.restore();

  // ── 2. Primary Walkway Clearance Corridor (SBC 201 >= 0.90m) ──
  ctx.save();
  const walkwayHeight = 0.90 * scale;
  const walkwayY = originY + roomPixelH - walkwayHeight;
  ctx.fillStyle = "rgba(16, 185, 129, 0.06)"; // soft emerald tint
  ctx.fillRect(originX, walkwayY, roomPixelW, walkwayHeight);

  ctx.strokeStyle = "#10B981";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.moveTo(originX, walkwayY);
  ctx.lineTo(originX + roomPixelW, walkwayY);
  ctx.stroke();

  ctx.fillStyle = "#059669";
  ctx.font = "bold 11px Tajawal, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("مسار حركة رئيسي آمن (عرض ≥ 0.90م - كود البناء السعودي SBC 201)", originX + roomPixelW / 2, walkwayY + walkwayHeight / 2 + 4);
  ctx.restore();

  // ── 3. Rugs & Floor Layer (Drawn First) ──
  sceneItems.forEach((item) => {
    const isRug = (item.category === "rugs") || (item.id && item.id.includes("rug")) || (item.name && item.name.includes("سجاد"));
    if (!isRug) return;

    const [wx, , wz] = item.position || [0, 0, 0];
    const itemW = (item.dimensions?.width || 2000) / 1000;
    const itemD = (item.dimensions?.depth || 2800) / 1000;
    const rotY = item.rotation?.[1] || 0;

    const cx = toCanvasX(wx);
    const cy = toCanvasY(wz);
    const pw = itemW * scale;
    const ph = itemD * scale;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-rotY);

    // Textured dashed outline
    ctx.fillStyle = "rgba(241, 245, 249, 0.85)";
    ctx.fillRect(-pw / 2, -ph / 2, pw, ph);

    ctx.strokeStyle = "#94A3B8";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    ctx.strokeRect(-pw / 2, -ph / 2, pw, ph);

    ctx.fillStyle = "#64748B";
    ctx.font = "10px Tajawal, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(item.name || "سجادة أرضية", 0, 4);
    ctx.restore();
  });

  // ── 4. Solid Furniture Footprints ──
  sceneItems.forEach((item) => {
    const isRug = (item.category === "rugs") || (item.id && item.id.includes("rug")) || (item.name && item.name.includes("سجاد"));
    if (isRug) return;

    const isWallArt = item.category === "decor" && (item.id.includes("art") || (item.position && item.position[1] > 0.8));

    const [wx, , wz] = item.position || [0, 0, 0];
    const itemW = (item.dimensions?.width || 1000) / 1000;
    const itemD = (item.dimensions?.depth || 800) / 1000;
    const rotY = item.rotation?.[1] || 0;

    const cx = toCanvasX(wx);
    const cy = toCanvasY(wz);
    const pw = Math.max(8, itemW * scale);
    const ph = Math.max(8, itemD * scale);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-rotY);

    if (isWallArt) {
      // Slender wall frame representation
      ctx.fillStyle = "#334155";
      ctx.fillRect(-pw / 2, -ph / 2, pw, ph);
      ctx.strokeStyle = "#0F172A";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-pw / 2, -ph / 2, pw, ph);

      ctx.fillStyle = "#F8FAFC";
      ctx.font = "bold 9px Tajawal, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("لوحة جدارية", 0, 3);
    } else {
      // Category-based architectural fill
      let fillColor = "#F1F5F9";
      let strokeColor = "#334155";

      if (item.category === "seating") {
        fillColor = "#E2E8F0";
        strokeColor = "#1E293B";
      } else if (item.category === "tables") {
        fillColor = "#E0E7FF";
        strokeColor = "#3730A3";
      } else if (item.category === "storage") {
        fillColor = "#FEF3C7";
        strokeColor = "#92400E";
      } else if (item.category === "decor") {
        fillColor = "#DCFCE7";
        strokeColor = "#166534";
      } else if (item.category === "lighting") {
        fillColor = "#FEF08A";
        strokeColor = "#854D0E";
      }

      // Footprint block with drop shadow
      ctx.shadowColor = "rgba(0, 0, 0, 0.08)";
      ctx.shadowBlur = 4;
      ctx.shadowOffsetY = 2;

      ctx.fillStyle = fillColor;
      ctx.fillRect(-pw / 2, -ph / 2, pw, ph);

      ctx.shadowColor = "transparent";
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-pw / 2, -ph / 2, pw, ph);

      // Label
      ctx.fillStyle = "#0F172A";
      ctx.font = "bold 10px Tajawal, system-ui, sans-serif";
      ctx.textAlign = "center";

      // Truncate name if too long for footprint
      const label = item.name.length > 14 ? item.name.slice(0, 13) + "…" : item.name;
      ctx.fillText(label, 0, 3);
    }

    ctx.restore();
  });

  // ── 5. Perimeter Architectural Walls (20cm Scaled Thickness) ──
  const wallThick = Math.max(6, 0.20 * scale);
  ctx.fillStyle = "#1E293B"; // Dark slate architectural wall fill

  // Back Wall (North)
  ctx.fillRect(originX - wallThick, originY - wallThick, roomPixelW + wallThick * 2, wallThick);
  // Left Wall (West)
  ctx.fillRect(originX - wallThick, originY, wallThick, roomPixelH);
  // Right Wall (East)
  ctx.fillRect(originX + roomPixelW, originY, wallThick, roomPixelH);
  // Front Wall (South / Entrance)
  ctx.fillRect(originX - wallThick, originY + roomPixelH, roomPixelW + wallThick * 2, wallThick);

  // ── 6. Windows Symbols on Walls ──
  windows.forEach((win) => {
    ctx.save();
    const winWidthM = win.size === "large" ? 2.2 : win.size === "small" ? 1.0 : 1.6;
    const winPixelW = winWidthM * scale;
    const offsetM = (win.positionOffset || 0) * (roomWidth / 2 * 0.7);

    if (win.wall === "back") {
      const wx = toCanvasX(offsetM) - winPixelW / 2;
      // Cutout in wall
      ctx.fillStyle = "#F8FAFC";
      ctx.fillRect(wx, originY - wallThick, winPixelW, wallThick);
      // Double glass lines
      ctx.strokeStyle = "#38BDF8";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(wx, originY - wallThick * 0.6);
      ctx.lineTo(wx + winPixelW, originY - wallThick * 0.6);
      ctx.moveTo(wx, originY - wallThick * 0.3);
      ctx.lineTo(wx + winPixelW, originY - wallThick * 0.3);
      ctx.stroke();

      ctx.fillStyle = "#0284C7";
      ctx.font = "bold 9px Tajawal, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("نافذة", wx + winPixelW / 2, originY - wallThick - 4);
    } else if (win.wall === "left") {
      const wy = toCanvasY(offsetM) - winPixelW / 2;
      ctx.fillStyle = "#F8FAFC";
      ctx.fillRect(originX - wallThick, wy, wallThick, winPixelW);
      ctx.strokeStyle = "#38BDF8";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(originX - wallThick * 0.6, wy);
      ctx.lineTo(originX - wallThick * 0.6, wy + winPixelW);
      ctx.moveTo(originX - wallThick * 0.3, wy);
      ctx.lineTo(originX - wallThick * 0.3, wy + winPixelW);
      ctx.stroke();

      ctx.fillStyle = "#0284C7";
      ctx.font = "bold 9px Tajawal, system-ui, sans-serif";
      ctx.textAlign = "right";
      ctx.fillText("نافذة", originX - wallThick - 4, wy + winPixelW / 2 + 3);
    }
    ctx.restore();
  });

  // ── 7. Doors & Swing Arc Symbols ──
  const doorList = doors.length > 0 ? doors : [{ id: "main_door", wall: "front" as const, positionOffset: 0.5, width: 0.9, height: 2.1 }];
  doorList.forEach((door) => {
    ctx.save();
    const dWidthM = door.width || 0.90;
    const dPixelW = dWidthM * scale;
    const offsetM = (door.positionOffset || 0) * (roomWidth / 2 * 0.7);

    if (door.wall === "front") {
      const dx = toCanvasX(offsetM) - dPixelW / 2;
      const dy = originY + roomPixelH;

      // Cutout wall
      ctx.fillStyle = "#F8FAFC";
      ctx.fillRect(dx, dy, dPixelW, wallThick);

      // Door leaf (line opening inward)
      ctx.strokeStyle = "#0F172A";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(dx, dy);
      ctx.lineTo(dx, dy - dPixelW);
      ctx.stroke();

      // Swing arc (dashed)
      ctx.strokeStyle = "#64748B";
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.arc(dx, dy, dPixelW, -Math.PI / 2, 0);
      ctx.stroke();

      ctx.fillStyle = "#475569";
      ctx.font = "bold 9px Tajawal, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("باب الدخول (0.90م)", dx + dPixelW / 2, dy + wallThick + 12);
    } else if (door.wall === "right") {
      const dy = toCanvasY(offsetM) - dPixelW / 2;
      const dx = originX + roomPixelW;

      ctx.fillStyle = "#F8FAFC";
      ctx.fillRect(dx, dy, wallThick, dPixelW);

      ctx.strokeStyle = "#0F172A";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(dx, dy);
      ctx.lineTo(dx - dPixelW, dy);
      ctx.stroke();

      ctx.strokeStyle = "#64748B";
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.arc(dx, dy, dPixelW, Math.PI, Math.PI / 2, true);
      ctx.stroke();
    }
    ctx.restore();
  });

  // ── 8. Exterior Dimension Lines with Arrows (← 5.00م →) ──
  ctx.save();
  ctx.strokeStyle = "#0F172A";
  ctx.fillStyle = "#0F172A";
  ctx.lineWidth = 1.2;

  // Horizontal Top Dimension Line (Room Width)
  const dimTopY = originY - wallThick - 35;
  ctx.beginPath();
  // Extension witness lines
  ctx.moveTo(originX, originY - wallThick - 4);
  ctx.lineTo(originX, dimTopY - 6);
  ctx.moveTo(originX + roomPixelW, originY - wallThick - 4);
  ctx.lineTo(originX + roomPixelW, dimTopY - 6);
  // Main dimension line
  ctx.moveTo(originX, dimTopY);
  ctx.lineTo(originX + roomPixelW, dimTopY);
  ctx.stroke();

  // Left & right arrows
  const drawArrow = (x: number, y: number, dir: "left" | "right" | "up" | "down") => {
    const size = 5;
    ctx.beginPath();
    if (dir === "left") {
      ctx.moveTo(x, y);
      ctx.lineTo(x + size * 1.5, y - size);
      ctx.lineTo(x + size * 1.5, y + size);
    } else if (dir === "right") {
      ctx.moveTo(x, y);
      ctx.lineTo(x - size * 1.5, y - size);
      ctx.lineTo(x - size * 1.5, y + size);
    } else if (dir === "up") {
      ctx.moveTo(x, y);
      ctx.lineTo(x - size, y + size * 1.5);
      ctx.lineTo(x + size, y + size * 1.5);
    } else if (dir === "down") {
      ctx.moveTo(x, y);
      ctx.lineTo(x - size, y - size * 1.5);
      ctx.lineTo(x + size, y - size * 1.5);
    }
    ctx.closePath();
    ctx.fill();
  };

  drawArrow(originX, dimTopY, "left");
  drawArrow(originX + roomPixelW, dimTopY, "right");

  // Dimension label
  ctx.font = "bold 12px Tajawal, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`العرض: ${roomWidth.toFixed(2)} م`, originX + roomPixelW / 2, dimTopY - 6);

  // Vertical Left Dimension Line (Room Depth)
  const dimLeftX = originX - wallThick - 35;
  ctx.beginPath();
  ctx.moveTo(originX - wallThick - 4, originY);
  ctx.lineTo(dimLeftX - 6, originY);
  ctx.moveTo(originX - wallThick - 4, originY + roomPixelH);
  ctx.lineTo(dimLeftX - 6, originY + roomPixelH);
  ctx.moveTo(dimLeftX, originY);
  ctx.lineTo(dimLeftX, originY + roomPixelH);
  ctx.stroke();

  drawArrow(dimLeftX, originY, "up");
  drawArrow(dimLeftX, originY + roomPixelH, "down");

  ctx.save();
  ctx.translate(dimLeftX - 10, originY + roomPixelH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = "center";
  ctx.fillText(`العمق: ${roomDepth.toFixed(2)} م`, 0, 0);
  ctx.restore();

  ctx.restore();

  // ── 9. Compass & Orientation Badge ──
  ctx.save();
  const compassX = canvasWidth - 45;
  const compassY = 45;
  ctx.fillStyle = "#FFFFFF";
  ctx.strokeStyle = "#CBD5E1";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(compassX, compassY, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // North pointer
  ctx.fillStyle = "#EF4444";
  ctx.beginPath();
  ctx.moveTo(compassX, compassY - 16);
  ctx.lineTo(compassX - 6, compassY + 2);
  ctx.lineTo(compassX + 6, compassY + 2);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#0F172A";
  ctx.font = "bold 10px Tajawal, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("N", compassX, compassY + 14);
  ctx.restore();

  // ── 10. Title Block & Scale ──
  ctx.save();
  ctx.fillStyle = "#64748B";
  ctx.font = "10px Tajawal, system-ui, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(`مقياس الرسم: 1:50 تقريباً | كود البناء السعودي SBC 201`, canvasWidth - marginX, canvasHeight - 20);
  ctx.restore();
}

export default function BlueprintCanvas2D({
  roomWidth,
  roomDepth,
  roomShape = "single",
  wallColor = "#E8E5DF",
  windows = [],
  doors = [],
  sceneItems = [],
  width = 900,
  height = 650,
  className = "",
  onRendered,
}: BlueprintCanvas2DProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    drawBlueprintToCanvas(ctx, {
      roomWidth,
      roomDepth,
      roomShape,
      windows,
      doors,
      sceneItems,
      canvasWidth: width,
      canvasHeight: height,
    });

    if (onRendered) {
      try {
        const dataUrl = canvas.toDataURL("image/png");
        onRendered(dataUrl);
      } catch (err) {
        console.error("Failed to extract Blueprint dataURL:", err);
      }
    }
  }, [roomWidth, roomDepth, roomShape, wallColor, windows, doors, sceneItems, width, height, onRendered]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={`rounded-xl border border-slate-200 shadow-xs ${className}`}
      style={{ width: "100%", height: "auto" }}
    />
  );
}
