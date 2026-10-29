// AI implementation controls, not independent research trials or student-written code.
import test from 'node:test';
import assert from 'node:assert/strict';
import {makeMap} from '../src/core.mjs';
import {buildDiskConfigurationSpace, buildSampledDiskConfigurationSpace, planDiskPath, planSampledDiskPath} from '../src/disk-footprint.mjs';
import {auditWorldPolyline} from '../scripts/check-two-cell-doorway.mjs';
import {bfsDistance} from '../scripts/check-current-position-detour.mjs';
const fixture = () => makeMap(9,7,[0,1,4,5,6].map(y => [4,y]),[1,3],[7,3]);
const options = {radius: .4, clearance: .15};

test('spacing1 preserves the original occupancy and every core result field', () => {
  const map = fixture(), old = planDiskPath(map, options), sampled = planSampledDiskPath(map, {...options, spacing: 1});
  assert.deepEqual(sampled.planningResult, old.planningResult);
  assert.deepEqual([...sampled.configurationSpace.cells], [...buildDiskConfigurationSpace(map, options).cells]);
  assert.equal(sampled.status,'UNREACHABLE');
  assert.deepEqual(sampled.worldPath,[]); assert.equal(sampled.geometricLength,null);
});
test('half-step samples include the midpoint without shrinking original geometry', () => {
  const map = fixture(), original = [...map.cells], result = planSampledDiskPath(map, options);
  assert.equal(result.status,'ROUTE_FOUND');
  assert.deepEqual([result.configurationSpace.width,result.configurationSpace.height],[17,13]);
  assert.deepEqual(result.configurationSpace.sampling.originalWorldSize,[9,7]);
  assert.equal(result.configurationSpace.parameters.effectiveRadius,.55);
  assert.equal(result.planningResult.pathLength,14); assert.equal(result.geometricLength,7);
  assert.deepEqual(result.worldPath[0],[1.5,3.5]); assert.deepEqual(result.worldPath.at(-1),[7.5,3.5]);
  assert.ok(result.worldPath.some(([x,y]) => x===4.5 && y===3));
  assert.ok(auditWorldPolyline(map,result.worldPath,.55).valid);
  assert.deepEqual([...map.cells],original);
});
test('fine graph retains distinct budget, exhausted and invalid-endpoint statuses', () => {
  assert.equal(planSampledDiskPath(fixture(),{...options,maxExpansions:1}).status,'BUDGET_EXCEEDED');
  const sealed=makeMap(9,7,Array.from({length:7},(_,y)=>[4,y]),[1,3],[7,3]);
  const exhausted=planSampledDiskPath(sealed,{...options,maxExpansions:300});
  assert.equal(exhausted.status,'UNREACHABLE'); assert.deepEqual(exhausted.worldPath,[]);
  assert.equal(exhausted.geometricLength,null);
  const bad=planSampledDiskPath(makeMap(5,5,[],[0,0],[3,3]),options);
  assert.equal(bad.status,'INVALID_ENDPOINT_CLEARANCE'); assert.equal(bad.planningResult,null);
});
test('small-layout parity: BFS distance and swept original geometry on both nested lattices', () => {
  const candidates=[[2,1],[2,2],[1,2],[2,3]];
  for(let mask=0;mask<16;mask++)for(const spacing of [1,.5]) {
    const map=makeMap(5,5,candidates.filter((_,i)=>mask&(1<<i)),[1,1],[3,3]);
    const r=planSampledDiskPath(map,{...options,spacing,maxExpansions:300});
    if(r.status==='INVALID_ENDPOINT_CLEARANCE')continue;
    const s=r.configurationSpace;
    const rows=Array.from({length:s.height},(_,y)=>Array.from({length:s.width},(_,x)=>s.cells[y*s.width+x]?'#':'.').join(''));
    const d=bfsDistance(rows,s.start,s.goal);
    assert.equal(r.planningResult.pathLength,d);
    if(d!==null) {
      assert.equal(r.geometricLength,d*spacing);
      assert.ok(auditWorldPolyline(map,r.worldPath,.55).valid);
    }
  }
});
test('unsupported spacing and oversized graph reject without scaling the world', () => {
  for(const spacing of [0,-1,.25,2,NaN,'0.5'])assert.throws(()=>buildSampledDiskConfigurationSpace(fixture(),{...options,spacing}));
  assert.throws(()=>buildSampledDiskConfigurationSpace(makeMap(41,5),options),/limit80/);
  assert.throws(()=>planSampledDiskPath(fixture(),{...options,maxExpansions:Infinity}));
  assert.throws(()=>planSampledDiskPath(fixture(),{...options,tieBreak:'unknown'}));
});
