'use client';

import * as THREE from 'three';

/**
 * Procedural PBR CanvasTexture generators for the 3D architectural landing
 * pavilion. Zero network requests, deterministic seeded noise, and cleanly
 * disposable on unmount.
 */

function seededRandom(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

export interface ArchitecturalTextureSet {
  travertineMap: THREE.CanvasTexture;
  marbleMap: THREE.CanvasTexture;
  plasterBump: THREE.CanvasTexture;
  oakGrainMap: THREE.CanvasTexture;
  sbcStampMap: THREE.CanvasTexture;
  sightlineStampMap: THREE.CanvasTexture;
  dispose: () => void;
}

function makeTravertineTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    const rand = seededRandom(4201);
    ctx.fillStyle = '#C4B193';
    ctx.fillRect(0, 0, size, size);

    // Soft linear limestone strata
    for (let i = 0; i < 160; i++) {
      const y = rand() * size;
      const h = 1 + rand() * 5;
      const shade = rand() > 0.5 ? 'rgba(246, 238, 224, 0.14)' : 'rgba(130, 108, 78, 0.12)';
      ctx.fillStyle = shade;
      ctx.fillRect(0, y, size, h);
    }

    // Fine mineral flecks
    for (let i = 0; i < 1200; i++) {
      const x = rand() * size;
      const y = rand() * size;
      const r = 0.6 + rand() * 1.4;
      ctx.fillStyle = rand() > 0.5 ? 'rgba(255, 250, 240, 0.10)' : 'rgba(92, 74, 52, 0.09)';
      ctx.fillRect(x, y, r * 2.2, r);
    }

    // Subtle large-format architectural travertine slab joints (2x2)
    ctx.strokeStyle = 'rgba(84, 68, 50, 0.24)';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, size - 2, size - 2);
    ctx.beginPath();
    ctx.moveTo(size / 2, 0);
    ctx.lineTo(size / 2, size);
    ctx.moveTo(0, size / 2);
    ctx.lineTo(size, size / 2);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function makeMarbleTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    const rand = seededRandom(7703);
    ctx.fillStyle = '#E6DFD3';
    ctx.fillRect(0, 0, size, size);

    // Calacatta diagonal warm veins
    for (let v = 0; v < 18; v++) {
      ctx.beginPath();
      let x = rand() * size;
      let y = rand() * size;
      ctx.moveTo(x, y);
      for (let s = 0; s < 14; s++) {
        x += 18 + rand() * 28;
        y += (rand() - 0.35) * 34;
        ctx.lineTo(x % size, (y + size) % size);
      }
      ctx.strokeStyle =
        v % 3 === 0 ? 'rgba(186, 148, 92, 0.22)' : 'rgba(132, 120, 108, 0.16)';
      ctx.lineWidth = 0.8 + rand() * 2.2;
      ctx.stroke();
    }

    // Slab grid hairline
    ctx.strokeStyle = 'rgba(160, 140, 114, 0.22)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(1, 1, size - 2, size - 2);
    ctx.beginPath();
    ctx.moveTo(size / 2, 0);
    ctx.lineTo(size / 2, size);
    ctx.moveTo(0, size / 2);
    ctx.lineTo(size, size / 2);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2.5, 2.5);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function makePlasterBumpTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    const rand = seededRandom(9911);
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, size, size);

    for (let i = 0; i < 3200; i++) {
      const x = rand() * size;
      const y = rand() * size;
      const v = 112 + Math.floor(rand() * 32);
      ctx.fillStyle = `rgb(${v},${v},${v})`;
      ctx.fillRect(x, y, 2, 2);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 2);
  return tex;
}

function makeOakGrainTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    const rand = seededRandom(3105);
    ctx.fillStyle = '#8A643D';
    ctx.fillRect(0, 0, size, size);

    for (let i = 0; i < 120; i++) {
      const x = rand() * size;
      ctx.fillStyle = rand() > 0.45 ? 'rgba(62, 40, 20, 0.22)' : 'rgba(176, 134, 88, 0.16)';
      ctx.fillRect(x, 0, 1 + rand() * 3, size);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 2);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeFloorBadgeTexture(
  primaryText: string,
  secondaryText: string,
  accentColor: string,
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 148;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Architectural sharp dark tag plate
    ctx.fillStyle = 'rgba(10, 18, 32, 0.88)';
    ctx.fillRect(6, 6, canvas.width - 12, canvas.height - 12);
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 3;
    ctx.strokeRect(6, 6, canvas.width - 12, canvas.height - 12);

    // Accent bar on left edge
    ctx.fillStyle = accentColor;
    ctx.fillRect(6, 6, 10, canvas.height - 12);

    ctx.fillStyle = accentColor;
    ctx.font = 'bold 34px "IBM Plex Mono", ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(primaryText, canvas.width / 2 + 4, 56);

    ctx.fillStyle = '#E8DCC8';
    ctx.font = '600 22px "IBM Plex Mono", ui-monospace, monospace';
    ctx.fillText(secondaryText, canvas.width / 2 + 4, 104);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

export function createArchitecturalTextures(): ArchitecturalTextureSet {
  const travertineMap = makeTravertineTexture();
  const marbleMap = makeMarbleTexture();
  const plasterBump = makePlasterBumpTexture();
  const oakGrainMap = makeOakGrainTexture();
  const sbcStampMap = makeFloorBadgeTexture(
    'WALKWAY 1.12m >= 0.90m',
    'SBC 201 & NEUFERT PASS',
    '#34D399',
  );
  const sightlineStampMap = makeFloorBadgeTexture(
    'TV SIGHTLINE 3.95m',
    'ERGONOMIC CONE 28 DEG',
    '#E8C488',
  );

  return {
    travertineMap,
    marbleMap,
    plasterBump,
    oakGrainMap,
    sbcStampMap,
    sightlineStampMap,
    dispose: () => {
      travertineMap.dispose();
      marbleMap.dispose();
      plasterBump.dispose();
      oakGrainMap.dispose();
      sbcStampMap.dispose();
      sightlineStampMap.dispose();
    },
  };
}
