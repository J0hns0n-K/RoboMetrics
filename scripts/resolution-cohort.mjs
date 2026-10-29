// AI acquisition/reference/summary utilities; no target-cohort execution on import.
import assert from 'node:assert/strict';
import {makeMap} from '../src/core.mjs';
import {buildSampledDiskConfigurationSpace} from '../src/disk-footprint.mjs';
import {bfsDistance} from './check-current-position-detour.mjs';

export const RESOLUTION_STATUSES = ['ROUTE_FOUND','BUDGET_EXCEEDED','UNREACHABLE','INVALID_ENDPOINT_CLEARANCE'];
const modes = ['always-fine','coarse-first'];
export const rowsOf = m => Array.from({length:m.height},(_,y)=>Array.from({length:m.width},(_,x)=>m.cells[y*m.width+x]?'#':'.').join(''));

export function generateResolutionMap(seed, {width,height,density,start,goal}) {
  if (!Number.isSafeInteger(seed) || seed < 1 || seed > 0xffffffff) throw new Error('Use uint32 positive seed.');
  if (!Number.isFinite(density) || density < 0 || density > .65) throw new Error('Density out of range0..0.65.');
  makeMap(width,height,[],start,goal); // Validate point endpoints before draws.
  let state = seed >>> 0;
  const blocked = [];
  for (let y=0;y<height;y++) for (let x=0;x<width;x++) {
    if ((x===start[0] && y===start[1]) || (x===goal[0] && y===goal[1])) continue;
    state = (Math.imul(1664525,state)+1013904223)>>>0;
    if (state / 4294967296 < density) blocked.push([x,y]);
  }
  return makeMap(width,height,blocked,start,goal);
}

// Separate projection/clamping audit, rather than production violation() or world-polyline checker.
export function referenceResolutionGraph(map, {radius,clearance,spacing}) {
  const graph = buildSampledDiskConfigurationSpace(map,{radius,clearance,spacing}), rows = rowsOf(graph);
  const obstacles = [];
  for (let k=0;k<map.cells.length;k++) if (map.cells[k]) obstacles.push([k%map.width,Math.floor(k/map.width)]);
  for (let y=0;y<graph.height;y++) for (let x=0;x<graph.width;x++) {
    const px=.5+x*spacing, py=.5+y*spacing;
    let distance = Math.min(px,py,map.width-px,map.height-py);
    for (const [ox,oy] of obstacles) {
      const qx=Math.max(ox,Math.min(px,ox+1)), qy=Math.max(oy,Math.min(py,oy+1));
      distance=Math.min(distance,Math.hypot(px-qx,py-qy));
    }
    assert.equal(graph.cells[y*graph.width+x],distance>radius+clearance?0:1);
  }
  const invalidEndpoints=['start','goal'].filter(name=>graph.cells[graph[name][1]*graph.width+graph[name][0]]);
  const endpointValid=invalidEndpoints.length===0;
  const distance=endpointValid?bfsDistance(rows,graph.start,graph.goal):null;
  return {spacing,width:graph.width,height:graph.height,start:graph.start,goal:graph.goal,
    rows,invalidEndpoints,endpointValid,bfsPerformed:endpointValid,bfsEdgeDistance:distance,
    graphReachable:endpointValid?distance!==null:null,candidatePointAudits:graph.cells.length};
}

export function summarizeResolutionCohort(records) {
  if (!Array.isArray(records) || records.length===0) throw new Error('Need a nonempty cohort.');
  const endpointValid = records.filter(r=>r.references.fine.endpointValid);
  const summary={mapCount:records.length,endpointValidMaps:endpointValid.length,endpointInvalidMaps:records.length-endpointValid.length,
    fineGraph:{reachable:endpointValid.filter(r=>r.references.fine.graphReachable).length,
      unreachable:endpointValid.filter(r=>!r.references.fine.graphReachable).length,
      notClassifiedInvalidEndpoints:records.length-endpointValid.length},modes:{}};
  const mean=a=>a.length?a.reduce((n,v)=>n+v,0)/a.length:null;
  for (const mode of modes) {
    const statusCounts=Object.fromEntries(RESOLUTION_STATUSES.map(s=>[s,0]));
    for (const r of records) {
      const result=r.policies[mode];
      if (!RESOLUTION_STATUSES.includes(result.status)) throw new Error('Unknown policy status.');
      statusCounts[result.status]++;
    }
    const successes=records.filter(r=>r.policies[mode].status==='ROUTE_FOUND');
    summary.modes[mode]={statusCounts,denominator:records.length,successfulMaps:successes.length,
      successRate:successes.length/records.length,
      plannerCalls:records.reduce((n,r)=>n+r.policies[mode].plannerCalls,0),
      geometryStages:records.reduce((n,r)=>n+r.policies[mode].stages.length,0),
      totalExamined:records.reduce((n,r)=>n+r.policies[mode].expanded,0),
      meanExaminedAllMaps:mean(records.map(r=>r.policies[mode].expanded)),
      endpointValidDenominator:endpointValid.length,
      meanExaminedEndpointValidMaps:mean(endpointValid.map(r=>r.policies[mode].expanded)),
      worldLength:{successfulMapDenominator:successes.length,mean:mean(successes.map(r=>r.policies[mode].geometricLength))}};
  }
  const joint=records.filter(r=>modes.every(m=>r.policies[m].status==='ROUTE_FOUND'));
  summary.jointSuccess={denominator:joint.length,trialIds:joint.map(r=>r.trial),
    worldLengthMeanByMode:Object.fromEntries(modes.map(m=>[m,mean(joint.map(r=>r.policies[m].geometricLength))])),
    equalWorldLengthCount:joint.filter(r=>r.policies['always-fine'].geometricLength===r.policies['coarse-first'].geometricLength).length};
  summary.refinedMaps=records.filter(r=>r.policies['coarse-first'].refined).length;
  summary.scope='Paired fixed synthetic inputs, all failures retained; length comparisons use joint-success denominator. Cheap failures/invalid endpoints are not efficiency wins.';
  return summary;
}
