// AI policy integration controls, not independent research samples.
import test from 'node:test';
import assert from 'node:assert/strict';
import {makeMap} from '../src/core.mjs';
import {planSampledDiskPath} from '../src/disk-footprint.mjs';
import {resolveDiskResolution} from '../src/resolution-policy.mjs';
const options = {radius: .4, clearance: .15};
const empty = () => makeMap(9,7,[],[1,3],[7,3]);
const doorway = () => makeMap(9,7,[0,1,4,5,6].map(y=>[4,y]),[1,3],[7,3]);

test('coarse success returns immediately; direct fine remains an explicit comparator', () => {
  const staged=resolveDiskResolution(empty(),options),fine=resolveDiskResolution(empty(),{...options,mode:'always-fine'});
  assert.equal(staged.status,'ROUTE_FOUND');assert.equal(staged.refined,false);
  assert.equal(staged.stages.length,1);assert.equal(staged.plannerCalls,1);assert.equal(staged.expanded,7);
  assert.equal(fine.stages.length,1);assert.equal(fine.expanded,13);
  assert.equal(staged.geometricLength,6);assert.equal(fine.geometricLength,6);
  assert.equal(staged.maxExpansionsCap,200);assert.equal(fine.maxExpansionsCap,100);
});
test('coarse graph exhaustion triggers one fresh fine search and retains both raw outcomes', () => {
  const map=doorway(),result=resolveDiskResolution(map,options);
  assert.equal(result.refined,true);assert.equal(result.status,'ROUTE_FOUND');
  assert.deepEqual(result.stages.map(s=>s.spacing),[1,.5]);
  assert.equal(result.stages[0].outcome.status,'UNREACHABLE');
  assert.deepEqual(result.stages[0].outcome.planningResult.path,[]);
  assert.equal(result.stages[0].outcome.planningResult.pathLength,null);
  for(const stage of result.stages)assert.deepEqual(stage.outcome,
    planSampledDiskPath(map,{...options,spacing:stage.spacing,maxExpansions:stage.maxExpansions}));
  assert.equal(result.expanded,12+28);assert.equal(result.plannerCalls,2);assert.equal(result.geometricLength,7);
});
test('coarse budget exhaustion stops without misclassifying it as graph disconnection', () => {
  const result=resolveDiskResolution(empty(),{...options,coarseBudget:1});
  assert.equal(result.status,'BUDGET_EXCEEDED');assert.equal(result.refined,false);
  assert.equal(result.stages.length,1);assert.equal(result.expanded,1);
  assert.deepEqual(result.worldPath,[]);assert.equal(result.geometricLength,null);
});
test('invalid original endpoint clearance stops before any planner or retry', () => {
  const result=resolveDiskResolution(makeMap(5,5,[],[0,0],[3,3]),options);
  assert.equal(result.status,'INVALID_ENDPOINT_CLEARANCE');assert.equal(result.refined,false);
  assert.equal(result.stages.length,1);assert.equal(result.plannerCalls,0);assert.equal(result.expanded,0);
  assert.equal(result.stages[0].outcome.planningResult,null);
});
test('fine exhaustion preserves both failures and ends after at most two stages', () => {
  const sealed=makeMap(9,7,Array.from({length:7},(_,y)=>[4,y]),[1,3],[7,3]);
  const r=resolveDiskResolution(sealed,options);
  assert.equal(r.status,'UNREACHABLE');assert.equal(r.stages.length,2);
  assert.deepEqual(r.worldPath,[]);assert.equal(r.geometricLength,null);
  assert.equal(r.expanded,r.stages.reduce((n,s)=>n+s.outcome.planningResult.expanded,0));
  assert.ok(r.expanded<=r.maxExpansionsCap);
});
test('fine budget failure is final and includes the failed coarse work', () => {
  const r=resolveDiskResolution(doorway(),{...options,fineBudget:1});
  assert.equal(r.status,'BUDGET_EXCEEDED');assert.equal(r.stages.length,2);
  assert.equal(r.stages[0].outcome.status,'UNREACHABLE');assert.equal(r.expanded,13);
  assert.deepEqual(r.worldPath,[]);assert.equal(r.geometricLength,null);
});
test('policy rejects invalid budgets/mode and preserves map and detached public path', () => {
  const map=empty(),cells=[...map.cells],start=[...map.start];
  for(const b of [0,-1,1.5,NaN,Infinity,'100'])for(const key of ['coarseBudget','fineBudget']) {
    assert.throws(()=>resolveDiskResolution(map,{...options,[key]:b}));
  }
  assert.throws(()=>resolveDiskResolution(map,{...options,mode:'unknown'}));
  assert.throws(()=>resolveDiskResolution(map,{...options,coarseBudget:Number.MAX_SAFE_INTEGER,fineBudget:1}));
  const r=resolveDiskResolution(map,options);r.worldPath[0][0]=999;
  assert.deepEqual(r.stages[0].outcome.worldPath[0],[1.5,3.5]);
  assert.deepEqual([...map.cells],cells);assert.deepEqual(map.start,start);
});
