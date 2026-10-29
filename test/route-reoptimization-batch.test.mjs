// AI methodology controls, not executions of the registered 30-map cohort.
import test from 'node:test';
import assert from 'node:assert/strict';
import {makeMap} from '../src/core.mjs';
import {classifyCandidate, removeSeededWall, evaluateRemoval, summarizeRemovalRows} from '../scripts/run-route-reoptimization-batch.mjs';

test('seeded row-major removal changes exactly one wall and preserves its parent', () => {
  const map = makeMap(4, 3, [[1, 0], [2, 0], [1, 1]]), saved = [...map.cells];
  const edit = removeSeededWall(map, 4);
  assert.deepEqual(edit.removedWall, [2, 0]); assert.equal(edit.selectedIndex, 1);
  assert.deepEqual([...map.cells], saved);
  assert.equal(edit.edited.cells[2], 0); assert.equal(edit.edited.cells[1], 1); assert.equal(edit.edited.cells[5], 1);
  assert.deepEqual(edit.edited.start, map.start); assert.deepEqual(edit.edited.goal, map.goal);
});

test('candidate audit distinguishes disconnected, no-wall and accepted maps', () => {
  const disconnected = classifyCandidate(makeMap(2, 2, [[1, 0], [0, 1]]), 1);
  assert.equal(disconnected.rejectionReason, 'UNREACHABLE'); assert.equal(disconnected.accepted, false);
  const empty = classifyCandidate(makeMap(2, 2), 2);
  assert.equal(empty.rejectionReason, 'NO_WALL'); assert.equal(empty.originalBfsDistance, 2);
  const connected = classifyCandidate(makeMap(3, 2, [[1, 0]], [0, 0], [2, 0]), 3);
  assert.equal(connected.accepted, true); assert.equal(connected.originalBfsDistance, 4);
});

test('paired summary separates potential shortening, realized shortening and budget fallback', () => {
  const map = makeMap(3, 2, [[1, 0]], [0, 0], [2, 0]), candidate = classifyCandidate(map, 0);
  const limited = evaluateRemoval(map, candidate, 1);
  const limitedSummary = summarizeRemovalRows([limited]);
  assert.equal(limitedSummary.theoreticallyShorterMaps, 1); assert.equal(limitedSummary.actuallyShorterMaps, 0);
  assert.equal(limitedSummary.missedPotentialImprovementMaps, 1);
  assert.equal(limitedSummary.policies.reoptimize.usableRoutes, 1);
  assert.equal(limitedSummary.policies.reoptimize.optimizationBudgetExceeded, 1);
  assert.equal(limited.results.reoptimize.planningResult.pathLength, null);
  const completed = evaluateRemoval(map, candidate, 30);
  const summary = summarizeRemovalRows([completed]);
  assert.equal(summary.denominator, 1); assert.equal(summary.actuallyShorterMaps, 1);
  assert.equal(summary.totalRealizedSavedMoves, 2);
  assert.equal(summary.policies['keep-valid'].totalNewPlannerCalls, 0);
  assert.equal(summary.policies.reoptimize.meanReturnedMoves, 2);
  assert.equal(summary.policies.reoptimize.totalNewExamined, 3);
});
