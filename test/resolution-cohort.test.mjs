// AI method tests on hand-known fixtures, never on the registered target seeds.
import test from 'node:test';
import assert from 'node:assert/strict';
import {makeMap} from '../src/core.mjs';
import {resolveDiskResolution} from '../src/resolution-policy.mjs';
import {generateResolutionMap,referenceResolutionGraph,summarizeResolutionCohort,rowsOf} from '../scripts/resolution-cohort.mjs';
const body={radius:.4,clearance:.15};
test('row-major LCG skips only point endpoints and retains a disconnected seed1 fixture',()=>{
  const config={width:2,height:2,density:.5,start:[0,0],goal:[1,1]};
  assert.deepEqual(rowsOf(generateResolutionMap(1,config)),['.#','#.']);
  assert.deepEqual(rowsOf(generateResolutionMap(1,{...config,density:0})),['..','..']);
  assert.deepEqual(rowsOf(generateResolutionMap(1,config)),['.#','#.']);
  for(const seed of [0,-1,1.2,NaN,0x100000000])assert.throws(()=>generateResolutionMap(seed,config));
});
test('reference skips BFS on blocked body endpoints instead of allowing a blocked start to escape',()=>{
  const map=makeMap(5,5,[[2,1]],[1,1],[3,3]);
  for(const spacing of [1,.5]){
    const r=referenceResolutionGraph(map,{...body,spacing});
    assert.equal(r.endpointValid,false);assert.equal(r.bfsPerformed,false);
    assert.deepEqual(r.invalidEndpoints,['start']);assert.equal(r.graphReachable,null);assert.equal(r.bfsEdgeDistance,null);
  }
});
test('reference labels a coarse-disconnected/fine-reachable passage and audits both masks',()=>{
  const map=makeMap(9,7,[0,1,4,5,6].map(y=>[4,y]),[1,3],[7,3]);
  const coarse=referenceResolutionGraph(map,{...body,spacing:1}),fine=referenceResolutionGraph(map,{...body,spacing:.5});
  assert.equal(coarse.graphReachable,false);assert.equal(coarse.bfsEdgeDistance,null);
  assert.equal(fine.graphReachable,true);assert.equal(fine.bfsEdgeDistance,14);
});
test('summary keeps invalid/failure rows and separates individual from joint-success length means',()=>{
  const maps=[makeMap(9,7,[],[1,3],[7,3]),makeMap(5,5,[],[0,0],[3,3])];
  const records=maps.map((map,i)=>({trial:i+1,references:{fine:referenceResolutionGraph(map,{...body,spacing:.5})},
    policies:Object.fromEntries(['always-fine','coarse-first'].map(mode=>[mode,resolveDiskResolution(map,{...body,mode,fineBudget:1})]))}));
  const s=summarizeResolutionCohort(records);
  assert.equal(s.mapCount,2);assert.equal(s.endpointValidMaps,1);assert.equal(s.endpointInvalidMaps,1);
  assert.equal(s.modes['always-fine'].statusCounts.BUDGET_EXCEEDED,1);
  assert.equal(s.modes['always-fine'].statusCounts.INVALID_ENDPOINT_CLEARANCE,1);
  assert.equal(s.modes['always-fine'].worldLength.mean,null);
  assert.equal(s.modes['coarse-first'].worldLength.successfulMapDenominator,1);
  assert.equal(s.modes['coarse-first'].worldLength.mean,6);
  assert.equal(s.jointSuccess.denominator,0);assert.equal(s.jointSuccess.worldLengthMeanByMode['coarse-first'],null);
  assert.equal(s.modes['coarse-first'].meanExaminedAllMaps,3.5);
  assert.equal(s.modes['coarse-first'].meanExaminedEndpointValidMaps,7);
});
