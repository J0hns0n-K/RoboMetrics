// AI-authored checks on known controls; not student-operated research trials.
import test from 'node:test';
import assert from 'node:assert/strict';
import {makeMap, plan, verifyPath} from '../src/core.mjs';
import {createAStarSession} from '../src/resumable-astar.mjs';

test('resuming retains the unexamined candidate and previous returned results', () => {
  const map = makeMap(3, 3, [[2, 1]]), session = createAStarSession(map);
  const first = session.advanceTo(2), saved = structuredClone(first);
  assert.equal(first.state, 'paused');
  assert.equal(first.result.reason, 'BUDGET_EXCEEDED');
  const last = session.advanceTo(8);
  assert.deepEqual(first, saved);
  assert.equal(last.expandedThisCall, 6);
  assert.deepEqual(last.result, plan(map, 'astar', 8));
  assert.ok(verifyPath(map, last.result.path));
});

test('all 1024 small layouts match original A* at each of 12 budgets for both tie rules', () => {
  const candidates = Array.from({length: 10}, (_, i) => [((i + 1) % 4), Math.floor((i + 1) / 4)]);
  let checks = 0;
  for (let mask = 0; mask < 1024; mask++) {
    const map = makeMap(4, 3, candidates.filter((_, i) => mask & (1 << i)));
    for (const tieBreak of ['fifo', 'closer-goal']) {
      const session = createAStarSession(map, {tieBreak});
      let summed = 0;
      for (let budget = 1; budget <= 12; budget++) {
        const resumed = session.advanceTo(budget);
        summed += resumed.expandedThisCall;
        assert.equal(summed, resumed.cumulativeExpanded);
        assert.deepEqual(resumed.result, plan(map, 'astar', budget, {tieBreak}), `mask=${mask}, ${tieBreak}, budget=${budget}`);
        checks++;
      }
    }
  }
  assert.equal(checks, 24576);
});

test('exact exhaustion reports unreachable, then performs no further work', () => {
  const map = makeMap(3, 3, [[2, 1], [1, 2]]), session = createAStarSession(map);
  assert.equal(session.advanceTo(5).state, 'paused');
  const exhausted = session.advanceTo(6);
  assert.equal(exhausted.state, 'complete');
  assert.deepEqual(exhausted.result, plan(map, 'astar', 6));
  assert.equal(exhausted.result.reason, 'UNREACHABLE');
  assert.equal(session.advanceTo(9).expandedThisCall, 0);
});

test('terminal success is stable and returned paths cannot mutate session state', () => {
  const map = makeMap(3, 3), session = createAStarSession(map);
  const expected = plan(map, 'astar', 20);
  const result = session.advanceTo(20);
  result.result.path[0][0] = 99;
  result.result.path.push([99, 99]);
  const again = session.advanceTo(21);
  assert.equal(again.expandedThisCall, 0);
  assert.deepEqual(again.result, expected);
  const alreadyAtGoal = makeMap(2, 2, [], [1, 1], [1, 1]);
  const trivial = createAStarSession(alreadyAtGoal).advanceTo(1);
  assert.equal(trivial.state, 'complete');
  assert.deepEqual(trivial.result, plan(alreadyAtGoal, 'astar', 1));
});

test('cumulative budgets are finite positive safe integers, nondecreasing and idempotent', () => {
  assert.throws(() => createAStarSession(makeMap(3, 3), {tieBreak: 'unknown'}));
  const session = createAStarSession(makeMap(3, 3));
  for (const budget of [0, -1, 1.5, Infinity, NaN, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => session.advanceTo(budget));
  }
  const first = session.advanceTo(2), again = session.advanceTo(2);
  assert.equal(again.expandedThisCall, 0);
  assert.deepEqual(again.result, first.result);
  assert.throws(() => session.advanceTo(1));
});

test('session owns a fixed map snapshot despite later caller edits', () => {
  const map = makeMap(3, 3, [[2, 1]]), expected = plan(map, 'astar', 8);
  const session = createAStarSession(map);
  session.advanceTo(2);
  map.cells.fill(1);
  map.start[0] = 2;
  map.goal[0] = 0;
  map.width = 8;
  assert.deepEqual(session.advanceTo(8).result, expected);
});
