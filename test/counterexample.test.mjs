// AI-selected regression case; original algorithms and tie-breaking are unchanged.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {randomMap, plan, verifyPath} from '../src/core.mjs';
import {parseScenario} from '../scripts/run-scenario.mjs';

const input = JSON.parse(readFileSync(new URL('../experiments/reference-greedy-detour.json', import.meta.url), 'utf8'));

test('selected seed-260 case gives valid Greedy path longer than a proven shortest path', () => {
  const map = parseScenario(input);
  assert.deepEqual(map, randomMap(260, 5, 5, .28));
  // A valid eight-move route matches the Manhattan lower bound between these corners.
  const lowerBound = Math.abs(map.start[0]-map.goal[0]) + Math.abs(map.start[1]-map.goal[1]);
  const a = plan(map, 'astar'), g = plan(map, 'greedy'), d = plan(map, 'dijkstra');
  for (const result of [a,g,d]) assert.ok(result.success && verifyPath(map, result.path));
  assert.equal(a.pathLength, lowerBound);
  assert.equal(a.pathLength, 8);
  assert.equal(d.pathLength, 8);
  assert.equal(g.pathLength, 12);
  assert.ok(g.expanded < a.expanded);
});

test('same counterexample separates budgeted success from path quality', () => {
  const map = parseScenario(input);
  const a14 = plan(map, 'astar', 14), g14 = plan(map, 'greedy', 14);
  assert.equal(a14.success, false);
  assert.equal(a14.reason, 'BUDGET_EXCEEDED');
  assert.equal(g14.success, true);
  assert.ok(verifyPath(map, g14.path));
  const a20 = plan(map, 'astar', 20), g20 = plan(map, 'greedy', 20);
  assert.equal(a20.success, true);
  assert.equal(g20.success, true);
  assert.equal(a20.pathLength, 8);
  assert.equal(g20.pathLength, 12);
});
