// AI controls for geometric minimum heading alignment, not measured robot motion.
import test from 'node:test';
import assert from 'node:assert/strict';
import {countDirectionChanges} from '../src/path-metrics.mjs';
import {minimumTurnDegrees, measureAxisPathRotation} from '../src/path-rotation.mjs';

test('the offered right-to-down and right-to-left cases need ninety and one-eighty degrees', () => {
  assert.equal(minimumTurnDegrees('right', 'down'), 90);
  assert.equal(minimumTurnDegrees('right', 'left'), 180);
});

test('all cardinal pairs use unsigned shortest angles, including wraparound', () => {
  const names = ['right', 'down', 'left', 'up'];
  const expected = [[0,90,180,90],[90,0,90,180],[180,90,0,90],[90,180,90,0]];
  for (let i = 0; i < names.length; i++) for (let j = 0; j < names.length; j++) {
    assert.equal(minimumTurnDegrees(names[i], names[j]), expected[i][j]);
  }
});

test('initial alignment is separate from internal path turns and stationary paths add none', () => {
  const path = [[0,0],[0,1],[0,2]];
  assert.deepEqual(measureAxisPathRotation(path, {initialHeading:'right'}), {
    initialHeading:'right', initialAlignmentDegrees:90, pathRotationDegrees:0, totalRotationDegrees:90
  });
  assert.equal(measureAxisPathRotation(path, {initialHeading:'down'}).totalRotationDegrees, 0);
  assert.equal(measureAxisPathRotation([[2,2]], {initialHeading:'left'}).totalRotationDegrees, 0);
});

test('a reversal is one existing change event but requires one-eighty in the forward-heading model', () => {
  const path = [[0,0],[1,0],[0,0]];
  assert.equal(countDirectionChanges(path), 1);
  assert.equal(measureAxisPathRotation(path, {initialHeading:'right'}).pathRotationDegrees, 180);
});

test('straight-segment subdivision preserves angle totals, which are not net heading differences', () => {
  const coarse = [[0,0],[1,0],[1,1],[2,1]];
  const fine = [[0,0],[.5,0],[1,0],[1,.5],[1,1],[1.5,1],[2,1]];
  assert.deepEqual(measureAxisPathRotation(coarse, {initialHeading:'up'}),
    measureAxisPathRotation(fine, {initialHeading:'up'}));
  assert.equal(measureAxisPathRotation(coarse, {initialHeading:'up'}).totalRotationDegrees, 270);
});

test('missing or unsupported headings and invalid paths are rejected', () => {
  for (const heading of [undefined, null, 'east', '__proto__', 0]) {
    assert.throws(() => minimumTurnDegrees('right', heading), TypeError);
    assert.throws(() => measureAxisPathRotation([[0,0]], {initialHeading:heading}), TypeError);
  }
  for (const path of [[], [[0,0],[0,0]], [[0,0],[1,1]], [[0,NaN]]]) {
    assert.throws(() => measureAxisPathRotation(path, {initialHeading:'right'}), TypeError);
  }
});
