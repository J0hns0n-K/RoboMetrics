// AI regression controls on known fixtures, not student research executions.
import test from 'node:test';
import assert from 'node:assert/strict';
import {makeMap, verifyPath} from '../src/core.mjs';
import {resolveRouteUpdate} from '../src/route-update-policy.mjs';
const straight = [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]];
const detour = [[2, 0], [2, 1], [3, 1], [4, 1], [4, 0]];
const changedMap = extra => makeMap(5, 2, [[3, 0], ...extra], [2, 0], [4, 0]);

test('a blocked already-traveled prefix does not invalidate a valid remaining route', () => {
  const prior = [...straight.slice(0, 2), ...detour], saved = structuredClone(prior);
  const result = resolveRouteUpdate(changedMap([[0, 0]]), prior, {currentPathIndex: 2, maxExpansions: 30, optimization: 'keep-valid'});
  assert.equal(result.status, 'KEEP_ROUTE'); assert.equal(result.plannerCalls, 0);
  assert.equal(result.expanded, 0); assert.equal(result.planningResult, null);
  assert.deepEqual(result.path, detour); assert.deepEqual(prior, saved);
  result.path[0][0] = 99;
  assert.deepEqual(prior, saved);
});

test('blocked remaining route triggers fresh planning from current position and a valid detour', () => {
  const map = changedMap([]);
  const result = resolveRouteUpdate(map, straight, {currentPathIndex: 2, maxExpansions: 30});
  assert.equal(result.status, 'NEW_ROUTE_FOUND'); assert.equal(result.plannerCalls, 1);
  assert.equal(result.priorRemainingPathValid, false); assert.equal(result.pathLength, 4);
  assert.equal(result.expanded, 6); assert.ok(verifyPath(map, result.path));
  assert.deepEqual(result.path[0], [2, 0]);
  result.path[0][0] = 99;
  assert.deepEqual(result.planningResult.path[0], [2, 0]);
});

test('each known student wall choice exhausts its reachable region and preserves unreachable semantics', () => {
  for (const choice of [3, 4, 5]) {
    const result = resolveRouteUpdate(changedMap([[choice - 1, 1]]), detour, {maxExpansions: 30});
    assert.equal(result.status, 'UNREACHABLE'); assert.equal(result.plannerCalls, 1);
    assert.deepEqual(result.path, []); assert.equal(result.pathLength, null);
    assert.equal(result.planningResult.reason, 'UNREACHABLE');
    assert.equal(result.expanded, choice + 2);
  }
});

test('budget exhaustion stays distinct from no route even when a known alternative exists', () => {
  const result = resolveRouteUpdate(changedMap([]), straight, {currentPathIndex: 2, maxExpansions: 2});
  assert.equal(result.status, 'BUDGET_EXCEEDED'); assert.equal(result.expanded, 2);
  assert.equal(result.planningResult.reason, 'BUDGET_EXCEEDED');
  assert.equal(result.pathLength, null); assert.deepEqual(result.path, []);
});

test('invalid budgets, tie rules, current indices and waypoints are rejected', () => {
  for (const maxExpansions of [undefined, 0, -1, 1.5, Infinity, NaN, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => resolveRouteUpdate(changedMap([]), detour, {maxExpansions}));
  }
  assert.throws(() => resolveRouteUpdate(changedMap([]), detour, {maxExpansions: 30, tieBreak: 'unknown'}));
  assert.throws(() => resolveRouteUpdate(changedMap([]), detour, {maxExpansions: 30, optimization: 'unknown'}));
  assert.throws(() => resolveRouteUpdate(changedMap([]), detour, {maxExpansions: 30, skipProvenOptimal: 'yes'}));
  assert.throws(() => resolveRouteUpdate(changedMap([]), detour, {maxExpansions: 30, currentPathIndex: 1}));
  for (const path of [[], [[99, 0]], [[2.5, 0]], [[2, 0, 1]], [[2, 0], null]]) {
    assert.throws(() => resolveRouteUpdate(changedMap([]), path, {maxExpansions: 30}));
  }
});

test('keeping a valid route does not promise shortestness; already at goal needs no search', () => {
  const map = makeMap(3, 2, [], [0, 0], [2, 0]);
  const longer = [[0, 0], [0, 1], [1, 1], [2, 1], [2, 0]];
  const kept = resolveRouteUpdate(map, longer, {maxExpansions: 30, optimization: 'keep-valid'});
  assert.equal(kept.status, 'KEEP_ROUTE'); assert.equal(kept.pathLength, 4);
  assert.equal(kept.plannerCalls, 0); // A two-move direct route exists; this policy does not reoptimize.
  const atGoal = makeMap(2, 2, [[0, 0]], [1, 1], [1, 1]);
  const result = resolveRouteUpdate(atGoal, [[0, 0], [1, 0], [1, 1]], {currentPathIndex: 2, maxExpansions: 1});
  assert.equal(result.status, 'KEEP_ROUTE'); assert.equal(result.pathLength, 0); assert.equal(result.expanded, 0);
  assert.equal(result.optimizationStatus, 'OPTIMAL');
});

test('student-selected default reoptimizes a valid four-move route to a two-move route', () => {
  const map = makeMap(3, 2, [], [0, 0], [2, 0]);
  const prior = [[0, 0], [0, 1], [1, 1], [2, 1], [2, 0]];
  const result = resolveRouteUpdate(map, prior, {maxExpansions: 30});
  assert.equal(result.optimization, 'reoptimize'); assert.equal(result.status, 'NEW_ROUTE_FOUND');
  assert.equal(result.decisionReason, 'SHORTER_ROUTE_FOUND'); assert.equal(result.optimizationStatus, 'OPTIMAL');
  assert.equal(result.priorRemainingPathValid, true); assert.equal(result.priorValidPathLength, 4);
  assert.equal(result.pathLength, 2); assert.equal(result.plannerCalls, 1); assert.equal(result.expanded, 3);
  assert.ok(verifyPath(map, result.path));
});

test('reoptimization can confirm an already shortest route while explicit retention skips search', () => {
  const map = changedMap([]);
  const result = resolveRouteUpdate(map, detour, {maxExpansions: 30});
  assert.equal(result.status, 'KEEP_ROUTE'); assert.equal(result.decisionReason, 'OPTIMALITY_CONFIRMED');
  assert.equal(result.optimizationStatus, 'OPTIMAL'); assert.equal(result.pathLength, 4);
  assert.equal(result.plannerCalls, 1); assert.equal(result.expanded, 6);
  const kept = resolveRouteUpdate(map, detour, {maxExpansions: 30, optimization: 'keep-valid'});
  assert.equal(kept.plannerCalls, 0); assert.equal(kept.optimizationStatus, 'NOT_REQUESTED');
});

test('budget-limited optimization preserves a verified route and the separate failed search', () => {
  const map = makeMap(3, 2, [], [0, 0], [2, 0]);
  const prior = [[0, 0], [0, 1], [1, 1], [2, 1], [2, 0]];
  const result = resolveRouteUpdate(map, prior, {maxExpansions: 1, timeoutResponse: 'retain'});
  assert.equal(result.status, 'KEEP_ROUTE'); assert.equal(result.decisionReason, 'OPTIMIZATION_BUDGET_EXCEEDED');
  assert.equal(result.optimizationStatus, 'BUDGET_EXCEEDED'); assert.equal(result.pathLength, 4);
  assert.deepEqual(result.path, prior); assert.ok(verifyPath(map, result.path));
  assert.equal(result.planningResult.success, false); assert.equal(result.planningResult.reason, 'BUDGET_EXCEEDED');
  assert.deepEqual(result.planningResult.path, []); assert.equal(result.planningResult.pathLength, null);
  assert.equal(result.plannerCalls, 1); assert.equal(result.expanded, 1);
});

test('reoptimization uses current suffix under both tie rules even if a past cell is blocked', () => {
  const prior = [...straight.slice(0, 2), ...detour], map = changedMap([[0, 0]]);
  for (const tieBreak of ['fifo', 'closer-goal']) {
    const result = resolveRouteUpdate(map, prior, {currentPathIndex: 2, maxExpansions: 30, tieBreak});
    assert.equal(result.priorRemainingPathValid, true); assert.equal(result.pathLength, 4);
    assert.equal(result.plannerCalls, 1); assert.deepEqual(result.path[0], [2, 0]);
    assert.ok(verifyPath(map, result.path));
  }
});
