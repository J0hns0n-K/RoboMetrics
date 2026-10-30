// AI-written metric controls; student supplied the A/B counts, not this code.
import test from 'node:test';
import assert from 'node:assert/strict';
import {countDirectionChanges} from '../src/path-metrics.mjs';

test('same six-step displacement can have one or five direction changes', () => {
  const a = [[0,0],[1,0],[2,0],[3,0],[3,1],[3,2],[3,3]];
  const b = [[0,0],[1,0],[1,1],[2,1],[2,2],[3,2],[3,3]];
  assert.equal(countDirectionChanges(a), 1);
  assert.equal(countDirectionChanges(b), 5);
});

test('a stationary singleton or straight path has no heading change; initial heading is excluded', () => {
  assert.equal(countDirectionChanges([[2,3]]), 0);
  assert.equal(countDirectionChanges([[2,3],[1,3],[0,3]]), 0);
  assert.equal(countDirectionChanges([[2,3],[2,2],[2,1]]), 0);
});

test('subdividing a straight segment into half-steps does not add changes', () => {
  const coarse = [[1.5,1.5],[2.5,1.5],[2.5,2.5]];
  const fine = [[1.5,1.5],[2,1.5],[2.5,1.5],[2.5,2],[2.5,2.5]];
  assert.equal(countDirectionChanges(coarse), 1);
  assert.equal(countDirectionChanges(fine), 1);
});

test('a reversal is one change event rather than a ninety-degree rotation count', () => {
  assert.equal(countDirectionChanges([[0,0],[1,0],[0,0]]), 1);
});

test('missing, empty, malformed, diagonal, repeated or overflowing segments are rejected', () => {
  for (const path of [null, [], [[0]], [[0,NaN]], [[0,Infinity]], [[0,0],[0,0]],
    [[0,0],[1,1]], [[1e308,0],[-1e308,0]]]) {
    assert.throws(() => countDirectionChanges(path), TypeError);
  }
});
