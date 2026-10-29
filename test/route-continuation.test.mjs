// AI reference integration tests; student selected continuation, not these fixtures or code.
import test from 'node:test';
import assert from 'node:assert/strict';
import {makeMap, plan, verifyPath} from '../src/core.mjs';
import {resolveRouteUpdate} from '../src/route-update-policy.mjs';
const detour = [[2, 0], [2, 1], [3, 1], [4, 1], [4, 0]];
const map = () => makeMap(5, 2, [[3, 0]], [2, 0], [4, 0]);

test('default continuation retains the first failure and charges only newly resumed expansions', () => {
  const result = resolveRouteUpdate(map(), detour, {maxExpansions: 2, additionalExpansions: 6});
  assert.equal(result.timeoutResponse, 'continue'); assert.equal(result.continuationStrategy, 'resume');
  assert.equal(result.continued, true); assert.equal(result.searchStages.length, 2);
  assert.equal(result.searchStages[0].result.reason, 'BUDGET_EXCEEDED');
  assert.deepEqual(result.searchStages.map(s => s.expandedThisStage), [2, 4]);
  assert.equal(result.expanded, 6); assert.equal(result.plannerCalls, 1);
  assert.equal(result.searchSessions, 1); assert.equal(result.resumeAdvanceCalls, 2); assert.equal(result.corePlanCalls, 0);
  assert.deepEqual(result.planningResult, plan(map(), 'astar', 8));
});

test('restart comparison charges repeated work while preserving identical final result', () => {
  const options = {maxExpansions: 2, additionalExpansions: 6};
  const resumed = resolveRouteUpdate(map(), detour, options);
  const restarted = resolveRouteUpdate(map(), detour, {...options, continuationStrategy: 'restart'});
  assert.equal(restarted.expanded, 8); assert.equal(resumed.expanded, 6);
  assert.equal(restarted.plannerCalls, 2); assert.equal(restarted.corePlanCalls, 2);
  assert.deepEqual(restarted.searchStages.map(s => s.expandedThisStage), [2, 6]);
  assert.deepEqual(restarted.planningResult, resumed.planningResult);
  assert.deepEqual(restarted.path, resumed.path);
});

test('initial success and bound proof do not spend an unused continuation allowance', () => {
  const complete = resolveRouteUpdate(map(), detour, {maxExpansions: 8, additionalExpansions: 6});
  assert.equal(complete.continued, false); assert.equal(complete.searchStages.length, 1); assert.equal(complete.expanded, 6);
  const open = makeMap(3, 2, [], [0, 0], [2, 0]);
  const proof = resolveRouteUpdate(open, [[0, 0], [1, 0], [2, 0]], {maxExpansions: 1});
  assert.equal(proof.decisionReason, 'LOWER_BOUND_OPTIMAL'); assert.equal(proof.searchStages.length, 0);
  assert.equal(proof.plannerCalls, 0); assert.equal(proof.expanded, 0);
});

test('a second budget failure stops after one continuation and preserves the valid fallback', () => {
  const result = resolveRouteUpdate(map(), detour, {maxExpansions: 1, additionalExpansions: 1});
  assert.equal(result.searchStages.length, 2); assert.equal(result.maximumContinuationSteps, 1);
  assert.equal(result.optimizationStatus, 'BUDGET_EXCEEDED'); assert.equal(result.continued, true);
  assert.equal(result.expanded, 2); assert.deepEqual(result.searchStages.map(s => s.expandedThisStage), [1, 1]);
  assert.deepEqual(result.path, detour); assert.equal(result.planningResult.pathLength, null); assert.deepEqual(result.planningResult.path, []);
});

test('invalid prior paths do not use cache-only continuation and explicit retain remains available', () => {
  const invalid = resolveRouteUpdate(map(), [[2, 0], [3, 0], [4, 0]], {maxExpansions: 2, additionalExpansions: 6});
  assert.equal(invalid.status, 'BUDGET_EXCEEDED'); assert.equal(invalid.continued, false);
  assert.equal(invalid.searchStages.length, 1); assert.deepEqual(invalid.path, []);
  const retained = resolveRouteUpdate(map(), detour, {maxExpansions: 2, timeoutResponse: 'retain'});
  assert.equal(retained.continued, false); assert.equal(retained.expanded, 2); assert.deepEqual(retained.path, detour);
  for (const options of [{timeoutResponse: 'bad'}, {continuationStrategy: 'bad'}, {additionalExpansions: 0}, {additionalExpansions: Infinity}]) {
    assert.throws(() => resolveRouteUpdate(map(), detour, {maxExpansions: 2, ...options}));
  }
});

test('both tie rules continue from the current suffix and all returned records are detached', () => {
  const latest = makeMap(5, 2, [[0, 0], [3, 0]], [2, 0], [4, 0]);
  const prior = [[0, 0], [1, 0], ...detour];
  for (const tieBreak of ['fifo', 'closer-goal']) {
    const result = resolveRouteUpdate(latest, prior, {currentPathIndex: 2, maxExpansions: 2, additionalExpansions: 6, tieBreak});
    assert.ok(verifyPath(latest, result.path)); assert.equal(result.plannerCalls, 1);
    assert.deepEqual(result.planningResult, plan(latest, 'astar', 8, {tieBreak}));
    result.searchStages.at(-1).result.path[0][0] = 99;
    assert.deepEqual(result.path[0], [2, 0]); assert.deepEqual(result.planningResult.path[0], [2, 0]);
    assert.deepEqual(prior[2], [2, 0]);
  }
});
