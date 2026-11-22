import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { IKEA_TEMPLATES } from '../frontend/app/studio/config/catalogTemplates.ts';
import {
  countMatches,
  describeMatch,
  resolveItem,
} from '../frontend/app/studio/config/matching.ts';
import { normalizeDimensionsMm } from '../frontend/app/studio/config/pipeline.ts';
import { MAARAD_ROOMS } from '../frontend/lib/maaradRooms.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(REPO_ROOT, 'frontend', 'public');
const MIN_GLB_BYTES = 1_000_000;

let passedChecks = 0;

function check(name, fn) {
  fn();
  passedChecks += 1;
  console.log(`PASS: ${name}`);
}

function assertGlbExistsAndValid(modelUrl, contextLabel) {
  assert.equal(typeof modelUrl, 'string', `${contextLabel}: modelUrl must be a string`);
  assert.ok(
    modelUrl.startsWith('/assets/') && modelUrl.endsWith('.glb'),
    `${contextLabel}: unexpected modelUrl "${modelUrl}"`
  );
  const relPath = modelUrl.replace(/^\/+/, '');
  const fullPath = path.join(PUBLIC_DIR, relPath);
  assert.ok(fs.existsSync(fullPath), `${contextLabel}: missing file on disk at ${fullPath}`);
  const stat = fs.statSync(fullPath);
  assert.ok(
    stat.size >= MIN_GLB_BYTES,
    `${contextLabel}: ${modelUrl} is ${stat.size} bytes (< ${MIN_GLB_BYTES})`
  );
}

// 1. Catalog matching & Arabic match summary
check('resolveItem matches IK-SOFA-01 / sofa to IKEA_TEMPLATES catalog entry', () => {
  const aiItem = {
    instance_id: 'test-sofa-1',
    asset_id: 'sofa',
    economy: {
      sku: 'IK-SOFA-01',
      brand: 'IKEA',
      price: 2495,
      currency: 'SAR',
    },
  };
  const resolution = resolveItem(aiItem, IKEA_TEMPLATES);
  assert.equal(resolution.kind, 'catalog');
  assert.ok(resolution.asset && resolution.asset.id === 'sofa');

  const counts = countMatches([{ item: aiItem, resolution }]);
  assert.ok(counts.matchedCount > 0, `expected matchedCount > 0, got ${counts.matchedCount}`);
  assert.equal(counts.fallbackCount, 0);

  const stage = describeMatch(counts.matchedCount, 1, counts.fallbackCount);
  assert.equal(stage.id, 'match');
  assert.equal(stage.status, 'done');
  assert.equal(typeof stage.note, 'string');
  assert.ok(stage.note.trim().length > 0, 'describeMatch note must be non-empty');
  assert.ok(/[\u0600-\u06FF]/.test(stage.note), 'describeMatch note must contain Arabic text');
});

// 2. Dimension normalization (meters & mm, length/width/height & width/height/depth)
check('normalizeDimensionsMm converts Gemini meters {length, width, height} to mm', () => {
  assert.deepEqual(
    normalizeDimensionsMm({ length: 2.2, width: 0.95, height: 0.83 }),
    { width: 2200, height: 830, depth: 950 }
  );
});

check('normalizeDimensionsMm converts catalog meters {width, height, depth} to mm', () => {
  assert.deepEqual(
    normalizeDimensionsMm({ width: 1.8, height: 0.45, depth: 0.4 }),
    { width: 1800, height: 450, depth: 400 }
  );
});

check('normalizeDimensionsMm preserves millimeter {width, height, depth} values', () => {
  assert.deepEqual(
    normalizeDimensionsMm({ width: 2200, height: 830, depth: 950 }),
    { width: 2200, height: 830, depth: 950 }
  );
});

// 3. MAARAD_ROOMS cost integrity & GLB asset verification
check('MAARAD_ROOMS has 6 rooms with exact cost sums and valid >= 1MB GLBs', () => {
  assert.equal(MAARAD_ROOMS.length, 6, `expected 6 MAARAD_ROOMS, got ${MAARAD_ROOMS.length}`);
  for (const room of MAARAD_ROOMS) {
    const expectedCost = room.items.reduce((sum, item) => sum + item.price, 0);
    assert.equal(
      room.estimatedCost,
      expectedCost,
      `room "${room.id}" estimatedCost (${room.estimatedCost}) !== item sum (${expectedCost})`
    );
    assert.ok(room.items.length > 0, `room "${room.id}" has no items`);
    for (const item of room.items) {
      assertGlbExistsAndValid(item.modelUrl, `MAARAD_ROOMS[${room.id}].${item.id}`);
    }
  }
});

// 4. IKEA_TEMPLATES GLB asset verification
check('IKEA_TEMPLATES all reference valid >= 1MB GLBs on disk', () => {
  assert.ok(IKEA_TEMPLATES.length > 0, 'IKEA_TEMPLATES must not be empty');
  for (const tpl of IKEA_TEMPLATES) {
    assertGlbExistsAndValid(tpl.modelUrl, `IKEA_TEMPLATES[${tpl.id}]`);
  }
});

console.log(`\nAll ${passedChecks} frontend contract checks passed.`);
