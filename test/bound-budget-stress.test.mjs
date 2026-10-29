// AI analysis checks: usable route, completed optimization and reference distance are distinct.
import test from 'node:test';
import assert from 'node:assert/strict';
import {makeMap} from '../src/core.mjs';
import {resolveRouteUpdate} from '../src/route-update-policy.mjs';
import {validatePolicyResult, summarizePolicyRows} from '../scripts/compare-manhattan-bound.mjs';

test('budget fallback remains usable without claiming shortestness or a completed optimization', () => {
  const map = makeMap(3, 2, [], [0, 0], [2, 0]);
  const prior = [[0, 0], [0, 1], [1, 1], [2, 1], [2, 0]];
  const output = resolveRouteUpdate(map, prior, {maxExpansions: 1, skipProvenOptimal: false});
  validatePolicyResult(map, prior, 2, output);
  const summary = summarizePolicyRows([{priorPath: prior, archivedBfsDistance: 2, baseline: output}], 'baseline');
  assert.equal(summary.usableRoutes, 1); assert.equal(summary.completedSearches, 0);
  assert.equal(summary.optimizationBudgetExceeded, 1); assert.equal(summary.returnedLengthEqualsBfs, 0);
  assert.equal(summary.missedPotentialShorteningMaps, 1); assert.equal(summary.meanReturnedMoves, 4);
  const corrupt = structuredClone(output); corrupt.planningResult.pathLength = 2;
  assert.throws(() => validatePolicyResult(map, prior, 2, corrupt));
});

test('a bound proof and a budget-limited already-shortest fallback are not counted as successful searches', () => {
  const map = makeMap(3, 2, [], [0, 0], [2, 0]), prior = [[0, 0], [1, 0], [2, 0]];
  const baseline = resolveRouteUpdate(map, prior, {maxExpansions: 1, skipProvenOptimal: false});
  const revised = resolveRouteUpdate(map, prior, {maxExpansions: 1});
  validatePolicyResult(map, prior, 2, baseline); validatePolicyResult(map, prior, 2, revised);
  const rows = [{priorPath: prior, archivedBfsDistance: 2, baseline, revised}];
  const a = summarizePolicyRows(rows, 'baseline'), b = summarizePolicyRows(rows, 'revised');
  assert.equal(a.completedSearches, 0); assert.equal(a.optimizationBudgetExceeded, 1);
  assert.equal(a.returnedLengthEqualsBfs, 1); assert.equal(a.boundProofs, 0);
  assert.equal(b.completedSearches, 0); assert.equal(b.optimizationBudgetExceeded, 0);
  assert.equal(b.returnedLengthEqualsBfs, 1); assert.equal(b.boundProofs, 1);
  assert.throws(() => validatePolicyResult(map, prior, 1, revised));
});
