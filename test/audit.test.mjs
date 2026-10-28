// AI-authored audit, independent of student design tasks.
import test from 'node:test';
import assert from 'node:assert/strict';
import {makeMap, plan, verifyPath} from '../src/core.mjs';
import {parseScenario, evaluateScenario} from '../scripts/run-scenario.mjs';

// Independent queue-based BFS: no imports from the planner and no shared frontier/score logic.
function bfs(map) {
  const queue = [[...map.start, 0]], seen = new Set([map.start.join(',')]);
  for (let i = 0; i < queue.length; i++) {
    const [x, y, distance] = queue[i];
    if (x === map.goal[0] && y === map.goal[1]) return distance;
    for (const [nx, ny] of [[x, y-1], [x-1, y], [x, y+1], [x+1, y]]) {
      const key = `${nx},${ny}`;
      if (nx < 0 || ny < 0 || nx >= map.width || ny >= map.height || seen.has(key)
        || map.cells[ny*map.width+nx]) continue;
      seen.add(key); queue.push([nx, ny, distance+1]);
    }
  }
  return null;
}

test('all 1024 obstacle configurations of a 4x3 grid agree with independent BFS', () => {
  const candidates = [];
  for (let y = 0; y < 3; y++) for (let x = 0; x < 4; x++) {
    if (!(x === 0 && y === 0) && !(x === 3 && y === 2)) candidates.push([x, y]);
  }
  for (let mask = 0; mask < 2**candidates.length; mask++) {
    const map = makeMap(4, 3, candidates.filter((_, i) => mask & (1 << i)));
    const expected = bfs(map);
    for (const algorithm of ['astar', 'dijkstra', 'greedy']) {
      const r = plan(map, algorithm);
      assert.equal(r.success, expected !== null, `${algorithm}, mask ${mask}`);
      if (r.success) {
        assert.ok(verifyPath(map, r.path));
        assert.ok(r.pathLength >= expected);
        if (algorithm !== 'greedy') assert.equal(r.pathLength, expected);
      } else assert.equal(r.reason, 'UNREACHABLE');
    }
  }
});

test('exact expansion budget includes examining the goal', () => {
  const map = makeMap(3, 3);
  for (const algorithm of ['astar', 'greedy', 'dijkstra']) {
    const unlimited = plan(map, algorithm);
    const low = plan(map, algorithm, unlimited.expanded-1);
    assert.equal(low.success, false);
    assert.equal(low.reason, 'BUDGET_EXCEEDED');
    assert.equal(low.expanded, unlimited.expanded-1);
    assert.deepEqual(plan(map, algorithm, unlimited.expanded), unlimited);
  }
});

const scenario = {id: 'audit', status: 'ready', contributionType: 'ai-reference',
  contributor: 'AI audit', assistance: 'AI-authored', prediction: 'Four moves on open grid.',
  rows: ['S..', '...', '..G'], budgets: [4, 5, 8, 9]};

test('fixed-map runner distinguishes path length from computation budget', () => {
  const result = evaluateScenario(scenario);
  assert.equal(result.referenceLength, 4);
  assert.equal(result.unlimited.astar.expanded, 9);
  assert.equal(result.unlimited.greedy.expanded, 5);
  assert.equal(result.trials[1].results.astar.success, false);
  assert.equal(result.trials[1].results.greedy.success, true);
  assert.equal(result.authorship.independentlyVerified, false);
});

test('scenario parser rejects unfinished attribution, malformed maps, and invalid budgets', () => {
  for (const change of [
    {status: 'template'}, {prediction: ''}, {contributor: ''}, {assistance: ''},
    {rows: ['S..', '..G.']}, {rows: ['S..', '.SG']}, {rows: ['S..', '..?']},
    {budgets: [0]}, {budgets: [1.5]}, {budgets: [5, 5]}, {budgets: []}
  ]) assert.throws(() => parseScenario({...scenario, ...change}));
});

test('unreachable scenarios preserve failure reason and null length ratios', () => {
  const r = evaluateScenario({...scenario, rows: ['S#.', '#..', '..G']});
  assert.equal(r.referenceLength, null);
  for (const result of Object.values(r.unlimited)) {
    assert.equal(result.reason, 'UNREACHABLE');
    assert.equal(result.relativeLength, null);
  }
});
