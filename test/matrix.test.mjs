import test from 'node:test';
import assert from 'node:assert/strict';
import {benchmark} from '../src/core.mjs';
import {runMatrix,auditSampling,summaryCsv} from '../scripts/run-matrix.mjs';

test('matrix preserves matched maps, original benchmark rows and deterministic sampling audit',()=>{
  const protocol={seed:42,runs:6,width:8,height:6,densities:[.19,.28],budgets:[5,50]};
  const result=runMatrix(protocol);
  assert.deepEqual(runMatrix(protocol),result);
  assert.equal(result.counts.densitySpecificCohortEntries,12);
  assert.equal(result.counts.pairedMapBudgetConditions,24);
  assert.equal(result.counts.policyRuns,48);
  for(const cohort of result.cohorts) {
    assert.equal(cohort.candidatesExamined,cohort.acceptedCount+cohort.rejectedCount);
    assert.equal(new Set([...cohort.acceptedSeeds,...cohort.rejectedSeeds]).size,cohort.candidatesExamined);
    const conditions=result.conditions.filter(c=>c.configuration.density===cohort.density);
    assert.deepEqual(conditions[0].rows.map(r=>r.seed),conditions[1].rows.map(r=>r.seed));
    for(const c of conditions) {
      assert.deepEqual(c.rows,benchmark(c.configuration).rows);
      if(c.configuration.maxExpansions===50) {
        assert.equal(c.analysis.policies.astar.successes,6);
        assert.equal(c.analysis.policies.greedy.successes,6);
      }
    }
  }
});

test('common-success lengths avoid comparing different success subsets on known counterexample',()=>{
  const result=runMatrix({seed:259,runs:1,width:5,height:5,densities:[.28],budgets:[14,25]});
  const [limited,ample]=result.conditions;
  assert.equal(limited.analysis.policies.astar.successes,0);
  assert.equal(limited.analysis.policies.greedy.successes,1);
  assert.equal(limited.analysis.pairedSuccess.denominator,0);
  assert.equal(limited.analysis.pairedSuccess.meanGreedyMinusAstarMoves,null);
  assert.equal(ample.analysis.pairedSuccess.denominator,1);
  assert.equal(ample.analysis.pairedSuccess.meanGreedyMinusAstarMoves,4);
  assert.equal(ample.analysis.policies.astar.optimalWithinBudget,1);
  assert.equal(ample.analysis.policies.greedy.optimalWithinBudget,0);
  assert.equal(ample.analysis.policies.greedy.successDenominator,1);
  assert.equal(summaryCsv(result).trim().split('\n').length,3);
});

test('sampling audit detects a substituted map seed rather than accepting an unpaired cohort',()=>{
  const batch=benchmark({seed:42,runs:4,width:8,height:6,density:.28,maxExpansions:50});
  const changed=structuredClone(batch.rows);
  changed[0].seed++;
  assert.throws(()=>auditSampling(batch.configuration,changed));
});
