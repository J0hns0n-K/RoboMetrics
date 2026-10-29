// AI metric tests on known fixtures; prospective target seeds are never generated here.
import test from 'node:test';
import assert from 'node:assert/strict';
import {makeMap} from '../src/core.mjs';
import {resolveDiskResolution} from '../src/resolution-policy.mjs';
import {resolveDiskResolutionQuality} from '../src/resolution-quality-policy.mjs';
import {referenceResolutionGraph} from '../scripts/resolution-cohort.mjs';
import {compareValidRoutes,summarizeProspective} from '../scripts/resolution-comparison.mjs';
const ok=(geometricLength,expanded)=>({status:'ROUTE_FOUND',geometricLength,expanded});
test('shorter valid route beats lower work, then equal length uses work, then exact tie',()=>{
  assert.deepEqual(compareValidRoutes(ok(7,100),ok(8,1)),{winner:'first',reason:'WORLD_LENGTH'});
  assert.deepEqual(compareValidRoutes(ok(7,36),ok(7,24)),{winner:'second',reason:'EXAMINED_WORK'});
  assert.equal(compareValidRoutes(ok(7,24),ok(7,24)).winner,'tie');
  assert.throws(()=>compareValidRoutes(ok(null,1),ok(1,1)));
});
test('zero-work endpoint failures cannot be ranked as efficiency winners',()=>{
  const fail={status:'INVALID_ENDPOINT_CLEARANCE',geometricLength:null,expanded:0};
  assert.equal(compareValidRoutes(fail,ok(6,10)).winner,'not-comparable');
  assert.equal(compareValidRoutes(fail,fail).winner,'not-comparable');
});
const body={radius:.4,clearance:.15};
const record=(trial,map,fineBudget=100)=>({trial,seed:trial,references:{fine:referenceResolutionGraph(map,{...body,spacing:.5})},
  policies:{'always-fine':resolveDiskResolution(map,{...body,mode:'always-fine',fineBudget}),
    'quality-checked':resolveDiskResolutionQuality(map,{...body,fineBudget})}});
test('no joint successes means unavailable matched totals, not zero-cost tied winners',()=>{
  const s=summarizeProspective([record(1,makeMap(5,5,[],[0,0],[3,3]))]);
  assert.equal(s.mapCount,1);assert.equal(s.endpointInvalidMaps,1);assert.equal(s.equalLengthWork.denominator,0);
  assert.equal(s.equalLengthWork.totals['always-fine'],null);assert.equal(s.equalLengthWork.lowerTotalMode,null);
  assert.equal(s.perMapCriterion.counts['not-comparable'],1);assert.equal(s.perMapCriterion.counts.tie,0);
});
test('all-map work and single-policy successes do not replace matched equal-length denominator',()=>{
  const empty=()=>makeMap(9,7,[],[1,3],[7,3]);
  const s=summarizeProspective([record(1,empty()),record(2,makeMap(5,5,[],[0,0],[3,3])),record(3,empty(),1)]);
  assert.equal(s.mapCount,3);assert.equal(s.endpointValidMaps,2);
  assert.equal(s.modes['always-fine'].totalExamined,14);assert.equal(s.modes['quality-checked'].totalExamined,14);
  assert.equal(s.modes['always-fine'].worldLength.successfulMapDenominator,1);
  assert.equal(s.modes['quality-checked'].worldLength.successfulMapDenominator,2);
  assert.equal(s.equalLengthWork.denominator,1);assert.deepEqual(s.equalLengthWork.trialIds,[1]);
  assert.deepEqual(s.equalLengthWork.totals,{'always-fine':13,'quality-checked':7});
  assert.equal(s.equalLengthWork.lowerTotalMode,'quality-checked');assert.equal(s.perMapCriterion.counts['not-comparable'],2);
});
