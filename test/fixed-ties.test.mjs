// AI-authored integration controls; the selected dead-end map is not run here.
import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateFixedTies} from '../scripts/compare-fixed-ties.mjs';

const scenario = (rows, budgets) => ({
  id: 'known-fixed-tie-control', status: 'ready', contributionType: 'ai-reference',
  contributor: 'AI assistant', assistance: 'Previously known integration control, not student work.',
  prediction: 'Check recorded control outcomes, not a new research forecast.',
  rows, budgets, variants: ['fifo', 'closer-goal']
});

test('paired evaluator applies both distinct rules on the known center-obstacle control', () => {
  const r = evaluateFixedTies(scenario(['S..', '.#.', '..G'], [300]));
  assert.equal(r.reference.pathLength, 4);
  const trial = r.trials[0];
  assert.equal(trial.results.fifo.expanded, 8);
  assert.equal(trial.results['closer-goal'].expanded, 5);
  assert.equal(trial.results.fifo.pathLength, 4);
  assert.equal(trial.results['closer-goal'].pathLength, 4);
  assert.deepEqual(trial.comparison, {commonSuccess: true, savedExaminedNodes: 3, pathLengthDifference: 0});
});

test('paired evaluator preserves exact goal-in-budget boundaries separately for each rule', () => {
  const r = evaluateFixedTies(scenario(['S.', '.G'], [2, 3, 4]));
  const [low, boundary, ample] = r.trials;
  for (const result of Object.values(low.results)) {
    assert.equal(result.success, false);
    assert.equal(result.reason, 'BUDGET_EXCEEDED');
    assert.equal(result.expanded, 2);
  }
  assert.equal(boundary.results.fifo.reason, 'BUDGET_EXCEEDED');
  assert.equal(boundary.results['closer-goal'].success, true);
  assert.equal(boundary.results['closer-goal'].expanded, 3);
  assert.equal(boundary.comparison.pathLengthDifference, null);
  for (const result of Object.values(ample.results)) {
    assert.equal(result.success, true);
    assert.equal(result.pathLength, 2);
  }
});

test('paired evaluator retains unreachable outcomes rather than treating them as budget failures', () => {
  const r = evaluateFixedTies(scenario(['S#', '#G'], [300]));
  assert.equal(r.reference.success, false);
  for (const result of Object.values(r.trials[0].results)) {
    assert.equal(result.success, false);
    assert.equal(result.reason, 'UNREACHABLE');
    assert.equal(result.relativeLength, null);
    assert.equal(result.pathLength, null);
  }
  assert.equal(r.trials[0].comparison.commonSuccess, false);
});
