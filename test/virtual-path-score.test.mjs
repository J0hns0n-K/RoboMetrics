// AI arithmetic controls, not evidence of measured robot costs.
import test from 'node:test';
import assert from 'node:assert/strict';
import {scoreAxisPath} from '../src/virtual-path-score.mjs';

test('the offered X/Y paths score sixteen and twelve at assumed weights one/two', () => {
  const x = [[0,0],[1,0],[1,1],[2,1],[2,2],[3,2],[3,3]];
  const y = [[0,0],[0,1],[0,2],[0,3],[0,4],[1,4],[2,4],[3,4],[3,3]];
  assert.equal(scoreAxisPath(x).virtualScore, 16);
  assert.equal(scoreAxisPath(y).virtualScore, 12);
});

test('half-step subdivision preserves world distance and score rather than charging per edge', () => {
  const coarse = [[0,0],[1,0],[1,1]];
  const fine = [[0,0],[.5,0],[1,0],[1,.5],[1,1]];
  assert.deepEqual(scoreAxisPath(coarse), scoreAxisPath(fine));
  assert.equal(scoreAxisPath(fine).virtualScore, 4);
});

test('explicit custom and zero penalties use their declared arithmetic; singleton score is zero', () => {
  assert.equal(scoreAxisPath([[0,0],[1,0],[1,1]], {perWorldUnit: 3, perDirectionChange: .5}).virtualScore, 6.5);
  assert.equal(scoreAxisPath([[0,0],[1,0],[1,1]], {perDirectionChange: 0}).virtualScore, 2);
  assert.equal(scoreAxisPath([[0,0],[1,0]], {perWorldUnit: 0, perDirectionChange: 0}).virtualScore, 0);
  assert.equal(scoreAxisPath([[3,3]]).virtualScore, 0);
});

test('invalid weights and absent or invalid axis paths are rejected', () => {
  for (const value of [-1, NaN, Infinity, '2']) {
    assert.throws(() => scoreAxisPath([[0,0]], {perWorldUnit: value}), TypeError);
    assert.throws(() => scoreAxisPath([[0,0]], {perDirectionChange: value}), TypeError);
  }
  for (const path of [[], [[0,0],[0,0]], [[0,0],[1,1]]]) {
    assert.throws(() => scoreAxisPath(path), TypeError);
  }
});

test('overflowing summed distance or weighted score is rejected', () => {
  assert.throws(() => scoreAxisPath([[0,0],[1e308,0],[1e308,1e308]]), RangeError);
  assert.throws(() => scoreAxisPath([[0,0],[2,0]], {perWorldUnit: Number.MAX_VALUE}), RangeError);
});
