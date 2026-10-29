// AI reference: student-selected path-quality objective on fixed virtual geometry.
// Original acquisition policy remains unchanged; optimization failure retains its valid route.
import {makeMap} from './core.mjs';
import {planSampledDiskPath} from './disk-footprint.mjs';
import {resolveDiskResolution} from './resolution-policy.mjs';

export function resolveDiskResolutionQuality(map, {radius,clearance=0,coarseBudget=100,fineBudget=100,tieBreak='fifo'}={}) {
  if (map?.cells?.length !== map?.width*map?.height) throw new Error('Invalid original grid.');
  const blocked=[];
  for (let k=0;k<map.cells.length;k++) if(map.cells[k]) blocked.push([k%map.width,Math.floor(k/map.width)]);
  const snapshot=makeMap(map.width,map.height,blocked,map.start,map.goal);
  const base=resolveDiskResolution(snapshot,{radius,clearance,coarseBudget,fineBudget,tieBreak,mode:'coarse-first'});
  const axisManhattanLowerBound=Math.abs(snapshot.goal[0]-snapshot.start[0])+Math.abs(snapshot.goal[1]-snapshot.start[1]);
  const common={...base,mode:'quality-checked',stages:base.stages.map(s=>({...s,purpose:'ACQUISITION'})),
    axisManhattanLowerBound,returnedSpacing:base.status==='ROUTE_FOUND'?base.finalSpacing:null,
    optimizationAttempted:false,optimizationImproved:false,optimalityEvidence:null,routeSource:'none',
    scope:'Fixed world; coarse route at axis-Manhattan bound skips optimization. Otherwise at most one fine check, preserving valid fallback/raw failures and all actual work. Optimality refers to axis-aligned sample graphs, not global continuous motion.'};
  if(base.status!=='ROUTE_FOUND') return {...common,optimizationStatus:'NO_USABLE_ROUTE'};
  if(base.finalSpacing===.5) return {...common,optimizationStatus:'NOT_NEEDED_FINE_GRAPH_RESULT',
    optimalityEvidence:'FINE_GRAPH_SEARCH',routeSource:'fine-acquisition'};
  if(base.geometricLength===axisManhattanLowerBound) return {...common,optimizationStatus:'SKIPPED_LOWER_BOUND',
    optimalityEvidence:'AXIS_MANHATTAN_BOUND',routeSource:'coarse-bound'};
  const fine=planSampledDiskPath(snapshot,{radius,clearance,spacing:.5,maxExpansions:fineBudget,tieBreak});
  if(!['ROUTE_FOUND','BUDGET_EXCEEDED'].includes(fine.status)) {
    throw new Error('Fine graph contradicts the valid nested coarse path.');
  }
  if(fine.status==='ROUTE_FOUND'&&fine.geometricLength>base.geometricLength) throw new Error('Completed fine path is longer than nested coarse route.');
  const completed=fine.status==='ROUTE_FOUND';
  return {...common,status:'ROUTE_FOUND',
    stages:[...common.stages,{spacing:.5,maxExpansions:fineBudget,purpose:'OPTIMIZATION',outcome:fine}],
    worldPath:(completed?fine.worldPath:base.worldPath).map(p=>[...p]),
    geometricLength:completed?fine.geometricLength:base.geometricLength,
    returnedSpacing:completed ? .5 : 1,finalSpacing:.5,refined:true,
    plannerCalls:base.plannerCalls+1,expanded:base.expanded+fine.planningResult.expanded,
    optimizationAttempted:true,optimizationStatus:completed?'COMPLETED':'BUDGET_EXCEEDED',
    optimizationImproved:completed&&fine.geometricLength<base.geometricLength,
    optimalityEvidence:completed?'FINE_GRAPH_SEARCH':'COARSE_GRAPH_ONLY',
    routeSource:completed?'fine-optimization':'coarse-fallback'};
}
