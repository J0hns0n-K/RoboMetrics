// AI tests of the declared ideal arithmetic, not physical timing validation.
import test from 'node:test';
import assert from 'node:assert/strict';
import {nominalStopTurnTime} from '../src/nominal-path-time.mjs';

const rates = {initialHeading:'down', linearSpeed:1, angularSpeedDegrees:90};

test('the offered X/Y paths give twelve and ten nominal seconds under the declared rates', () => {
  const x = [[0,0],[1,0],[1,1],[2,1],[2,2],[3,2],[3,3]];
  const y = [[0,0],[0,1],[0,2],[0,3],[0,4],[1,4],[2,4],[3,4],[3,3]];
  const a = nominalStopTurnTime(x, rates), b = nominalStopTurnTime(y, rates);
  assert.deepEqual([a.translationSeconds, a.rotationSeconds, a.nominalSeconds], [6,6,12]);
  assert.deepEqual([b.translationSeconds, b.rotationSeconds, b.nominalSeconds], [8,2,10]);
});

test('translation and rotation add sequentially, including initial alignment', () => {
  const r = nominalStopTurnTime([[0,0],[1,0],[1,1]],
    {initialHeading:'up', linearSpeed:2, angularSpeedDegrees:90});
  assert.equal(r.initialAlignmentDegrees, 90);
  assert.equal(r.pathRotationDegrees, 90);
  assert.deepEqual([r.translationSeconds, r.rotationSeconds, r.nominalSeconds], [1,2,3]);
});

test('subdividing straight movement preserves world distance and nominal duration', () => {
  const coarse = [[0,0],[1,0],[1,1]];
  const fine = [[0,0],[.5,0],[1,0],[1,.5],[1,1]];
  const options = {initialHeading:'right', linearSpeed:2, angularSpeedDegrees:45};
  assert.deepEqual(nominalStopTurnTime(coarse, options), nominalStopTurnTime(fine, options));
  assert.equal(nominalStopTurnTime(fine, options).nominalSeconds, 3);
});

test('changing one rate affects only its duration component', () => {
  const path = [[0,0],[1,0],[1,1]];
  const options = {initialHeading:'right', linearSpeed:1, angularSpeedDegrees:90};
  const base = nominalStopTurnTime(path, options);
  const slowerMove = nominalStopTurnTime(path, {...options, linearSpeed:.5});
  const slowerTurn = nominalStopTurnTime(path, {...options, angularSpeedDegrees:45});
  assert.equal(slowerMove.translationSeconds, 2 * base.translationSeconds);
  assert.equal(slowerMove.rotationSeconds, base.rotationSeconds);
  assert.equal(slowerTurn.translationSeconds, base.translationSeconds);
  assert.equal(slowerTurn.rotationSeconds, 2 * base.rotationSeconds);
});

test('a singleton is stationary; missing and nonpositive or nonfinite speeds are rejected', () => {
  assert.equal(nominalStopTurnTime([[2,2]], rates).nominalSeconds, 0);
  assert.throws(() => nominalStopTurnTime([[0,0]]), TypeError);
  for (const speed of [0, -1, NaN, Infinity, '1']) {
    assert.throws(() => nominalStopTurnTime([[0,0]], {...rates, linearSpeed:speed}), TypeError);
    assert.throws(() => nominalStopTurnTime([[0,0]], {...rates, angularSpeedDegrees:speed}), TypeError);
  }
});

test('invalid paths or headings and overflowing distances or duration are rejected', () => {
  for (const path of [[], [[0,0],[0,0]], [[0,0],[1,1]]]) {
    assert.throws(() => nominalStopTurnTime(path, rates), TypeError);
  }
  assert.throws(() => nominalStopTurnTime([[0,0]], {...rates, initialHeading:undefined}), TypeError);
  assert.throws(() => nominalStopTurnTime([[0,0],[1e308,0],[1e308,1e308]], rates), RangeError);
  assert.throws(() => nominalStopTurnTime([[0,0],[1,0]], {...rates, linearSpeed:Number.MIN_VALUE}), RangeError);
});
