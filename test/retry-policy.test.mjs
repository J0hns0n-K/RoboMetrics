// AI-authored regression checks on previously known maps; not new research data.
import test from 'node:test';
import assert from 'node:assert/strict';
import {makeMap, plan} from '../src/core.mjs';
import {planAStarWithOneRetry} from '../src/retry-policy.mjs';

const connected = () => makeMap(3, 3, [[2, 1]]);

test('response policy stops after initial success without spending the retry allowance', () => {
  const r = planAStarWithOneRetry(connected(), {initialBudget: 8, retryBudget: 9, maxTotalExpansions: 17});
  assert.equal(r.initialBudgetSuccess, true);
  assert.equal(r.retried, false);
  assert.equal(r.attempts.length, 1);
  assert.equal(r.finalResult.pathLength, 4);
  assert.equal(r.totalExpanded, 8);
  assert.equal(r.totalBudgetAllocated, 8);
});

test('response policy does not retry an exhausted unreachable search', () => {
  const map = makeMap(3, 3, [[2, 1], [1, 2]]);
  const r = planAStarWithOneRetry(map, {initialBudget: 8, retryBudget: 9, maxTotalExpansions: 17});
  assert.equal(r.finalResult.reason, 'UNREACHABLE');
  assert.equal(r.retried, false);
  assert.equal(r.attempts.length, 1);
  assert.equal(r.totalExpanded, 6);
});

test('retry success retains the original failure and charges both attempts', () => {
  const map = connected();
  const r = planAStarWithOneRetry(map, {initialBudget: 2, retryBudget: 8, maxTotalExpansions: 10});
  assert.equal(r.initialBudgetSuccess, false);
  assert.deepEqual(r.attempts[0].result, plan(map, 'astar', 2));
  assert.equal(r.attempts[0].result.reason, 'BUDGET_EXCEEDED');
  assert.deepEqual(r.attempts.map(a => a.budget), [2, 8]);
  assert.equal(r.finalResult.success, true);
  assert.equal(r.finalResult.pathLength, 4);
  assert.equal(r.totalExpanded, 10);
  assert.equal(r.totalBudgetAllocated, 10);
});

test('a second budget failure stops after one retry rather than silently escalating', () => {
  const r = planAStarWithOneRetry(connected(), {initialBudget: 2, retryBudget: 4, maxTotalExpansions: 6});
  assert.equal(r.attempts.length, 2);
  assert.equal(r.finalResult.success, false);
  assert.equal(r.finalResult.reason, 'BUDGET_EXCEEDED');
  assert.equal(r.totalExpanded, 6);
  assert.deepEqual(r.attempts.map(a => a.result.expanded), [2, 4]);
});

test('invalid or unbounded budget configurations are rejected before searching', () => {
  const good = {initialBudget: 2, retryBudget: 8, maxTotalExpansions: 10};
  assert.throws(() => planAStarWithOneRetry(connected(), {...good, initialBudget: Infinity}), /positive safe integers/);
  assert.throws(() => planAStarWithOneRetry(connected(), {...good, retryBudget: 2}), /exceed the initial/);
  assert.throws(() => planAStarWithOneRetry(connected(), {...good, maxTotalExpansions: 9}), /total cap/);
});

test('the selected A* tie rule applies on the initial search and the retry', () => {
  const map = makeMap(3, 3, [[1, 1]]);
  const first = planAStarWithOneRetry(map, {initialBudget: 5, retryBudget: 8, maxTotalExpansions: 13, tieBreak: 'closer-goal'});
  assert.equal(first.initialBudgetSuccess, true);
  assert.equal(first.retried, false);
  assert.equal(first.totalExpanded, 5);
  const second = planAStarWithOneRetry(map, {initialBudget: 4, retryBudget: 5, maxTotalExpansions: 9, tieBreak: 'closer-goal'});
  assert.equal(second.retried, true);
  assert.equal(second.finalResult.success, true);
  assert.equal(second.finalResult.pathLength, 4);
  assert.equal(second.totalExpanded, 9);
});
