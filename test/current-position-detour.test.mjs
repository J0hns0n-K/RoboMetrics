// AI-authored independent-distance controls; not student experiment executions.
import test from 'node:test';
import assert from 'node:assert/strict';
import {bfsDistance} from '../scripts/check-current-position-detour.mjs';

test('separate text-grid BFS preserves hand-known reachable, unreachable and zero-distance cases', () => {
  assert.equal(bfsDistance(['S.', '.G'], [0, 0], [1, 1]), 2);
  assert.equal(bfsDistance(['S#', '#G'], [0, 0], [1, 1]), null);
  assert.equal(bfsDistance(['S.', '..'], [0, 0], [0, 0]), 0);
});

test('separate BFS uses supplied current position on a rectangular grid in both directions', () => {
  const rows = ['.G..', '.#S.'];
  assert.equal(bfsDistance(rows, [2, 1], [1, 0]), 2);
  assert.equal(bfsDistance(rows, [1, 0], [2, 1]), 2);
});
