// AI checks for an AI-proposed rule adopted by the student; not student-authored tests.
import test from 'node:test';
import assert from 'node:assert/strict';
import {makeMap, plan, verifyPath} from '../src/core.mjs';
import {resolveRouteUpdate} from '../src/route-update-policy.mjs';

test('default skips a valid route at the bound, while disabled guard still spends its budget', () => {
  const map = makeMap(3, 2, [], [0, 0], [2, 0]), path = [[0, 0], [1, 0], [2, 0]];
  const guarded = resolveRouteUpdate(map, path, {maxExpansions: 1});
  assert.equal(guarded.decisionReason, 'LOWER_BOUND_OPTIMAL'); assert.equal(guarded.lowerBound, 2);
  assert.equal(guarded.optimalityEvidence, 'MANHATTAN_BOUND'); assert.equal(guarded.optimizationStatus, 'OPTIMAL');
  assert.equal(guarded.plannerCalls, 0); assert.equal(guarded.expanded, 0); assert.equal(guarded.planningResult, null);
  const baseline = resolveRouteUpdate(map, path, {maxExpansions: 1, skipProvenOptimal: false});
  assert.equal(baseline.optimizationStatus, 'BUDGET_EXCEEDED'); assert.equal(baseline.plannerCalls, 1);
  assert.deepEqual(guarded.path, baseline.path);
});

test('a blocked old route with bound length is rejected before considering the shortcut', () => {
  const map = makeMap(3, 2, [[1, 0]], [0, 0], [2, 0]), path = [[0, 0], [1, 0], [2, 0]];
  const result = resolveRouteUpdate(map, path, {maxExpansions: 30});
  assert.equal(result.priorRemainingPathValid, false); assert.equal(result.pathLength, 4);
  assert.equal(result.plannerCalls, 1); assert.equal(result.optimalityEvidence, 'ASTAR_COMPLETED');
  assert.ok(verifyPath(map, result.path));
  const limited = resolveRouteUpdate(map, path, {maxExpansions: 1});
  assert.equal(limited.status, 'BUDGET_EXCEEDED'); assert.deepEqual(limited.path, []);
});

test('bound uses the current suffix, ignoring a blocked already-traveled prefix', () => {
  const map = makeMap(4, 2, [[0, 0]], [1, 0], [3, 0]), prior = [[0, 0], [1, 0], [2, 0], [3, 0]];
  for (const tieBreak of ['fifo', 'closer-goal']) {
    const result = resolveRouteUpdate(map, prior, {currentPathIndex: 1, maxExpansions: 1, tieBreak});
    assert.equal(result.lowerBound, 2); assert.equal(result.pathLength, 2);
    assert.equal(result.decisionReason, 'LOWER_BOUND_OPTIMAL'); assert.equal(result.plannerCalls, 0);
    assert.deepEqual(result.path[0], [1, 0]);
  }
});

test('a valid optimal detour above the geometric bound still triggers reoptimization', () => {
  const map = makeMap(3, 2, [[1, 0]], [0, 0], [2, 0]), prior = [[0, 0], [0, 1], [1, 1], [2, 1], [2, 0]];
  const result = resolveRouteUpdate(map, prior, {maxExpansions: 30});
  assert.equal(result.lowerBound, 2); assert.equal(result.pathLength, 4);
  assert.equal(result.plannerCalls, 1); assert.equal(result.decisionReason, 'OPTIMALITY_CONFIRMED');
  assert.equal(result.optimalityEvidence, 'ASTAR_COMPLETED');
});

test('all 1024 small layouts and both tie rules preserve guarded/unguarded route outcomes', () => {
  const candidates = Array.from({length: 10}, (_, i) => [(i + 1) % 4, Math.floor((i + 1) / 4)]);
  const fallback = [[0, 0], [1, 0], [2, 0], [3, 0], [3, 1], [3, 2]];
  let compared = 0;
  for (let mask = 0; mask < 1024; mask++) {
    const map = makeMap(4, 3, candidates.filter((_, i) => mask & (1 << i)));
    const reference = plan(map, 'dijkstra');
    const prior = reference.success ? reference.path : fallback;
    for (const tieBreak of ['fifo', 'closer-goal']) {
      const guarded = resolveRouteUpdate(map, prior, {maxExpansions: 12, tieBreak});
      const baseline = resolveRouteUpdate(map, prior, {maxExpansions: 12, tieBreak, skipProvenOptimal: false});
      assert.deepEqual(guarded.path, baseline.path); assert.equal(guarded.pathLength, baseline.pathLength);
      assert.equal(guarded.status, baseline.status);
      const shouldSkip = verifyPath(map, prior) && prior.length - 1 === 5;
      assert.equal(guarded.plannerCalls, shouldSkip ? 0 : 1);
      assert.ok(guarded.expanded <= baseline.expanded);
      compared++;
    }
  }
  assert.equal(compared, 2048);
});
