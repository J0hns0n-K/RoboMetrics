// AI geometry controls with hand-derived widths/distances; not physical robot experiments.
import test from 'node:test';
import assert from 'node:assert/strict';
import {makeMap, plan} from '../src/core.mjs';
import {buildDiskConfigurationSpace, validateDiskPath, planDiskPath} from '../src/disk-footprint.mjs';
const doorway = (halfOpening = 0) => makeMap(9, 7,
  Array.from({length: 7}, (_, y) => [4, y]).filter(([, y]) => Math.abs(y - 3) > halfOpening), [1, 3], [7, 3]);

test('zero radius and zero margin reproduce point-map occupancy and route result', () => {
  const map = doorway(), saved = [...map.cells], space = buildDiskConfigurationSpace(map, {radius: 0});
  assert.deepEqual([...space.cells], saved); assert.deepEqual([...map.cells], saved);
  assert.deepEqual(planDiskPath(map, {radius: 0}).planningResult, plan(map, 'astar', 100));
});

test('one-cell opening passes a diameter0.8 disk and blocks diameter1.2 with valid endpoints', () => {
  const small = planDiskPath(doorway(), {radius: .4}), large = planDiskPath(doorway(), {radius: .6});
  assert.equal(small.status, 'ROUTE_FOUND'); assert.equal(small.planningResult.pathLength, 6);
  assert.equal(small.sweptPathValidation.valid, true);
  assert.deepEqual(large.invalidEndpoints, []); assert.equal(large.status, 'UNREACHABLE');
  assert.deepEqual(large.planningResult.path, []); assert.equal(large.planningResult.pathLength, null);
});

test('tangency is contact: just below half-width passes, exactly half-width does not', () => {
  assert.equal(planDiskPath(doorway(), {radius: .499}).status, 'ROUTE_FOUND');
  assert.equal(planDiskPath(doorway(), {radius: .5}).status, 'UNREACHABLE');
  assert.equal(planDiskPath(doorway(), {radius: .501}).status, 'UNREACHABLE');
});

test('Euclidean square-corner clearance differs from square-neighborhood dilation', () => {
  const map = makeMap(5, 5, [[2, 2]], [0, 0], [4, 4]);
  const r06 = buildDiskConfigurationSpace(map, {radius: .6}), r071 = buildDiskConfigurationSpace(map, {radius: .71});
  assert.equal(r06.cells[2 * 5 + 1], 1); // side distance .5
  assert.equal(r06.cells[1 * 5 + 1], 0); // corner distance sqrt(.5) > .6
  assert.equal(r071.cells[1 * 5 + 1], 1);
});

test('world boundary and endpoint clearance are reported before search', () => {
  const result = planDiskPath(makeMap(5, 5, [], [0, 0], [2, 2]), {radius: .6});
  assert.equal(result.status, 'INVALID_ENDPOINT_CLEARANCE'); assert.deepEqual(result.invalidEndpoints, ['start']);
  assert.equal(result.planningResult, null); assert.equal(result.sweptPathValidation, null);
});

test('original-geometry swept-edge validation rejects oversized, diagonal and malformed paths', () => {
  const map = doorway(), path = plan(map, 'astar', 100).path;
  assert.equal(validateDiskPath(map, path, {radius: .4}).valid, true);
  assert.equal(validateDiskPath(map, path, {radius: .6}).valid, false);
  assert.equal(validateDiskPath(map, [], {radius: .4}).reason, 'INVALID_GRID_PATH');
  assert.equal(validateDiskPath(makeMap(2, 2), [[0, 0], [1, 1]], {radius: 0}).reason, 'INVALID_GRID_PATH');
});

test('wider opening restores the larger disk route; margin and invalid parameters are explicit', () => {
  assert.equal(planDiskPath(doorway(1), {radius: .6}).planningResult.pathLength, 6);
  const byMargin = buildDiskConfigurationSpace(doorway(), {radius: .4, clearance: .2});
  const byBody = buildDiskConfigurationSpace(doorway(), {radius: .6});
  assert.deepEqual([...byMargin.cells], [...byBody.cells]);
  for (const radius of [-1, NaN, Infinity, '0.4']) assert.throws(() => planDiskPath(doorway(), {radius}));
  assert.throws(() => planDiskPath(doorway(), {radius: .4, clearance: -1}));
  assert.throws(() => planDiskPath(doorway(), {radius: .4, maxExpansions: Infinity}));
});
