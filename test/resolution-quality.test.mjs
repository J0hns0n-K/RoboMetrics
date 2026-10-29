// AI regressions on known controls/development-cohort cases, not new samples.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {makeMap} from '../src/core.mjs';
import {resolveDiskResolution} from '../src/resolution-policy.mjs';
import {resolveDiskResolutionQuality} from '../src/resolution-quality-policy.mjs';
import {auditWorldPolyline} from '../scripts/check-two-cell-doorway.mjs';
const p={radius:.4,clearance:.15};
const cohort=JSON.parse(readFileSync(new URL('../data/footprint/resolution-policy-unfiltered-run-01.json',import.meta.url),'utf8'));
const fromRows=rows=>makeMap(9,7,rows.flatMap((row,y)=>[...row].flatMap((v,x)=>v==='#'?[[x,y]]:[])),[1,3],[7,3]);
const known=trial=>fromRows(cohort.records[trial-1].originalRows);

test('a coarse route at axis lower bound skips fine search with explicit evidence',()=>{
  const r=resolveDiskResolutionQuality(makeMap(9,7,[],[1,3],[7,3]),p);
  assert.equal(r.optimizationStatus,'SKIPPED_LOWER_BOUND');assert.equal(r.optimizationAttempted,false);
  assert.equal(r.optimalityEvidence,'AXIS_MANHATTAN_BOUND');assert.equal(r.stages.length,1);
  assert.equal(r.expanded,7);assert.equal(r.geometricLength,6);assert.equal(r.returnedSpacing,1);
});
test('known longer coarse paths receive one fine check and preserve acquisition outputs',()=>{
  for(const trial of [12,23]){
    const map=known(trial),base=resolveDiskResolution(map,p),r=resolveDiskResolutionQuality(map,p);
    assert.equal(r.optimizationStatus,'COMPLETED');assert.equal(r.optimizationImproved,true);
    assert.equal(r.geometricLength,7);assert.equal(base.geometricLength,8);
    assert.equal(r.stages.length,2);assert.deepEqual(r.stages[0].outcome,base.stages[0].outcome);
    assert.equal(r.stages[1].purpose,'OPTIMIZATION');assert.equal(r.returnedSpacing,.5);
    assert.equal(r.optimalityEvidence,'FINE_GRAPH_SEARCH');assert.ok(auditWorldPolyline(map,r.worldPath,.55).valid);
  }
});
test('optimization timeout retains usable coarse path while last raw search stays failed',()=>{
  const map=known(12),r=resolveDiskResolutionQuality(map,{...p,fineBudget:1});
  assert.equal(r.status,'ROUTE_FOUND');assert.equal(r.optimizationStatus,'BUDGET_EXCEEDED');
  assert.equal(r.optimizationImproved,false);assert.equal(r.optimalityEvidence,'COARSE_GRAPH_ONLY');
  assert.equal(r.geometricLength,8);assert.equal(r.routeSource,'coarse-fallback');
  assert.equal(r.returnedSpacing,1);assert.equal(r.finalSpacing,.5);assert.equal(r.expanded,13);
  assert.equal(r.stages[1].outcome.status,'BUDGET_EXCEEDED');
  assert.deepEqual(r.stages[1].outcome.planningResult.path,[]);assert.equal(r.stages[1].outcome.planningResult.pathLength,null);
  assert.ok(auditWorldPolyline(map,r.worldPath,.55).valid);
});
test('fine acquisition result is already graph-optimal and never gets a third search',()=>{
  const map=makeMap(9,7,[0,1,4,5,6].map(y=>[4,y]),[1,3],[7,3]);
  const r=resolveDiskResolutionQuality(map,p);
  assert.equal(r.stages.length,2);assert.equal(r.optimizationAttempted,false);
  assert.equal(r.optimizationStatus,'NOT_NEEDED_FINE_GRAPH_RESULT');assert.equal(r.routeSource,'fine-acquisition');
  assert.equal(r.expanded,40);assert.equal(r.geometricLength,7);
});
test('initial failures retain distinct statuses and never manufacture a valid fallback',()=>{
  const maps=[{map:known(7),extra:{coarseBudget:1},status:'BUDGET_EXCEEDED'},
    {map:makeMap(5,5,[],[0,0],[3,3]),extra:{},status:'INVALID_ENDPOINT_CLEARANCE'},
    {map:makeMap(9,7,Array.from({length:7},(_,y)=>[4,y]),[1,3],[7,3]),extra:{},status:'UNREACHABLE'}];
  for(const {map,extra,status}of maps){const r=resolveDiskResolutionQuality(map,{...p,...extra});
    assert.equal(r.status,status);assert.equal(r.optimizationStatus,'NO_USABLE_ROUTE');
    assert.equal(r.optimalityEvidence,null);assert.equal(r.returnedSpacing,null);assert.deepEqual(r.worldPath,[]);
  }
});
test('completed extra search without shortening is not counted as an improvement',()=>{
  const map=makeMap(9,7,[[4,3]],[1,3],[7,3]);
  const r=resolveDiskResolutionQuality(map,{radius:.4,clearance:.05});
  assert.equal(r.optimizationStatus,'COMPLETED');assert.equal(r.optimizationAttempted,true);
  assert.equal(r.optimizationImproved,false);assert.equal(r.geometricLength,8);
});
test('quality API preserves input and rejects invalid parameters through acquisition validation',()=>{
  const map=known(12),saved=[...map.cells];
  assert.throws(()=>resolveDiskResolutionQuality(map,{...p,fineBudget:0}));
  assert.throws(()=>resolveDiskResolutionQuality(null,p));
  const r=resolveDiskResolutionQuality(map,p);r.worldPath[0][0]=999;
  assert.deepEqual([...map.cells],saved);assert.deepEqual(r.stages.at(-1).outcome.worldPath[0],[1.5,3.5]);
});
