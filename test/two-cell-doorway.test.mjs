// AI checker tests: supplied world-coordinate witnesses, not new research observations.
import test from 'node:test';
import assert from 'node:assert/strict';
import {makeMap} from '../src/core.mjs';
import {auditWorldPolyline} from '../scripts/check-two-cell-doorway.mjs';

test('world witness uses the gap midpoint and exact swept clearance', () => {
  const map = makeMap(9, 7, [0,1,4,5,6].map(y => [4,y]), [1,3], [7,3]);
  const result = auditWorldPolyline(map, [[1.5,3.5],[1.5,3],[7.5,3],[7.5,3.5]], .55);
  assert.ok(result.valid); assert.equal(result.minimumCenterClearance, 1);
  assert.equal(result.geometricLength, 7);
  assert.equal(auditWorldPolyline(map, [[1.5,3.5],[7.5,3.5]], .55).valid, false);
});
test('swept obstacle test rejects safe endpoints with an intervening square', () => {
  const map = makeMap(7, 5, [[3,2]], [1,2], [5,2]);
  for (const p of [[1.5,2.5], [5.5,2.5]]) assert.ok(auditWorldPolyline(map, [p,p], .4).valid);
  const result = auditWorldPolyline(map, [[1.5,2.5],[5.5,2.5]], .4);
  assert.equal(result.valid, false); assert.equal(result.minimumCenterClearance, 0);
});
test('contact and world boundaries reject equality, square corners use Euclidean distance', () => {
  const map = makeMap(5, 5, [[2,2]], [0,0], [4,4]);
  assert.equal(auditWorldPolyline(map, [[1.5,1.5],[1.5,1.5]], .7).valid, true);
  assert.equal(auditWorldPolyline(map, [[1.5,1.5],[1.5,1.5]], .71).valid, false);
  const empty = makeMap(5,5);
  assert.equal(auditWorldPolyline(empty, [[.5,1.5],[.5,3.5]], .5).valid, false);
  assert.equal(auditWorldPolyline(empty, [[.5,1.5],[.5,3.5]], .499).valid, true);
  assert.equal(auditWorldPolyline(empty, [[-.5,1.5],[1.5,1.5]], 0).valid, false);
});
test('checker rejects diagonals, malformed world points and invalid effective radii', () => {
  const map = makeMap(5,5);
  for (const path of [[], [[1,1]], [[1,1],[2,2]], [[1,1],[NaN,1]], [[1,1],[2]], [null,[1,1]]]) {
    assert.throws(() => auditWorldPolyline(map, path, .4));
  }
  for (const radius of [-1, NaN, Infinity, '.4']) assert.throws(() => auditWorldPolyline(map, [[1,1],[2,1]], radius));
});
