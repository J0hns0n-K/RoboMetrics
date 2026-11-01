// AI policy implementation of the student's offered A*-after-family choice.
// Candidate ranking uses analytic time; fallback A* optimizes unit move count.
import {makeMap,plan} from './core.mjs';
import {boundedStopTurnTime} from './bounded-path-time.mjs';
import {minimumTurnDegrees} from './path-rotation.mjs';

const coordinate=p=>Array.isArray(p) && p.length===2 && Array.from(p).every(Number.isInteger);
const same=(p,q)=>coordinate(p) && coordinate(q) && p[0]===q[0] && p[1]===q[1];
function pathIssues(map,path) {
  if(!Array.isArray(path) || !path.length)return [{reason:'EMPTY_PATH'}];
  const issues=[];
  if(!same(path[0],map.start))issues.push({reason:'WRONG_START'});
  if(!same(path.at(-1),map.goal))issues.push({reason:'WRONG_GOAL'});
  Array.from(path).forEach((p,index)=>{
    if(!coordinate(p)){issues.push({reason:'INVALID_COORDINATE',index});return;}
    const [x,y]=p;
    if(x<0 || y<0 || x>=map.width || y>=map.height)issues.push({reason:'OUT_OF_BOUNDS',index});
    else if(map.cells[y*map.width+x])issues.push({reason:'BLOCKED_POINT_CELL',index,point:[x,y]});
    if(index && coordinate(path[index-1]) && Math.abs(x-path[index-1][0])+Math.abs(y-path[index-1][1])!==1) {
      issues.push({reason:'NON_UNIT_CARDINAL_STEP',index});
    }
  });
  return issues;
}

export function selectCandidateOrAstar(world,candidates,{motionLimits,maxExpansions=20}={}) {
  if(!Array.isArray(candidates))throw new TypeError('Candidates must be an array.');
  if(!(maxExpansions===Infinity || (Number.isInteger(maxExpansions) && maxExpansions>=1))) {
    throw new TypeError('Use a positive integer A* expansion budget or Infinity.');
  }
  const positive=['linearSpeed','linearAcceleration','angularSpeedDegrees','angularAccelerationMagnitudeDegreesPerSecondSquared'];
  if(!motionLimits || !positive.every(key=>Number.isFinite(motionLimits[key]) && motionLimits[key]>0)) {
    throw new TypeError('Use finite positive declared motion limits.');
  }
  minimumTurnDegrees(motionLimits.initialHeading,motionLimits.initialHeading);
  if(!['turns-only','every-waypoint'].includes(motionLimits.stopPolicy??'turns-only'))throw new TypeError('Unknown stop policy.');
  const ids=new Set();
  for(const candidate of candidates) {
    if(!candidate || typeof candidate.id!=='string' || !candidate.id.trim() || ids.has(candidate.id)) {
      throw new TypeError('Candidate IDs must be unique nonempty strings.');
    }
    ids.add(candidate.id);
  }
  const map=makeMap(world.width,world.height,world.blockedCells??[],world.start,world.goal);
  let best=null,candidateTimingEvaluations=0;
  const checks=candidates.map(candidate=>{
    const issues=pathIssues(map,candidate.path);
    if(issues.length)return {id:candidate.id,status:'INVALID_POINT_PATH',issues,modelSeconds:null};
    const timing=boundedStopTurnTime(candidate.path,motionLimits);
    candidateTimingEvaluations++;
    if(!best || timing.modelSeconds<best.timing.modelSeconds) {
      best={id:candidate.id,path:candidate.path.map(p=>[...p]),timing};
    }
    return {id:candidate.id,status:'VALID_POINT_PATH',issues:[],modelSeconds:timing.modelSeconds};
  });
  const common={familyStatus:best?'HAS_VALID_MEMBER':'NO_VALID_MEMBER_IN_REGISTERED_FAMILY',
    candidateChecks:candidates.length,candidateTimingEvaluations,candidates:checks};
  if(best)return {...common,status:'ROUTE_FOUND',selectedSource:'REGISTERED_CANDIDATE',
    selectedCandidateId:best.id,path:best.path,pathLength:best.path.length-1,timing:best.timing,
    astar:null,astarCalls:0,astarExpanded:0,fallbackTimingEvaluations:0};
  const astar=plan(map,'astar',maxExpansions,{tieBreak:'fifo'});
  const path=astar.path.map(p=>[...p]);
  return {...common,status:astar.success?'ROUTE_FOUND':astar.reason,selectedSource:'ASTAR_FALLBACK',
    selectedCandidateId:null,path,pathLength:astar.pathLength,
    timing:astar.success?boundedStopTurnTime(path,motionLimits):null,
    astar,astarCalls:1,astarExpanded:astar.expanded,fallbackTimingEvaluations:astar.success?1:0};
}
