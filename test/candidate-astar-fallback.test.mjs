import test from 'node:test';
import assert from 'node:assert/strict';
import {selectCandidateOrAstar} from '../src/candidate-astar-fallback.mjs';
const motionLimits={initialHeading:'down',linearSpeed:1,linearAcceleration:1,angularSpeedDegrees:180,
  angularAccelerationMagnitudeDegreesPerSecondSquared:360,stopPolicy:'turns-only'};
const open={width:4,height:5,start:[0,0],goal:[3,3],blockedCells:[]};
const detour={...open,blockedCells:[[1,0],[1,1],[1,2],[1,3],[2,3]]};
const downPath=[[0,0],[0,1],[0,2],[0,3],[1,3],[2,3],[3,3]];
const zigzag=[[0,0],[1,0],[1,1],[2,1],[2,2],[3,2],[3,3]];
const witness=[[0,0],[0,1],[0,2],[0,3],[0,4],[1,4],[2,4],[3,4],[3,3]];
const family=[{id:'x',path:zigzag},{id:'student',path:downPath}];
const options={motionLimits,maxExpansions:20};

test('a valid family selects bounded-time minimum and skips A* even with a tiny search budget',()=>{
  const r=selectCandidateOrAstar(open,family,{...options,maxExpansions:1});
  assert.equal(r.status,'ROUTE_FOUND');assert.equal(r.selectedSource,'REGISTERED_CANDIDATE');
  assert.equal(r.selectedCandidateId,'student');assert.equal(r.timing.modelSeconds,9);
  assert.equal(r.candidateChecks,2);assert.equal(r.candidateTimingEvaluations,2);
  assert.equal(r.astarCalls,0);assert.equal(r.astarExpanded,0);assert.equal(r.astar,null);
});

test('family exhaustion invokes A* and recovers the longer point-path witness',()=>{
  const r=selectCandidateOrAstar(detour,family,options);
  assert.equal(r.familyStatus,'NO_VALID_MEMBER_IN_REGISTERED_FAMILY');assert.equal(r.selectedSource,'ASTAR_FALLBACK');
  assert.equal(r.status,'ROUTE_FOUND');assert.deepEqual(r.path,witness);assert.equal(r.pathLength,8);
  assert.equal(r.timing.modelSeconds,13);assert.equal(r.astarCalls,1);assert.equal(r.astarExpanded,9);
  assert.equal(r.candidateTimingEvaluations,0);assert.equal(r.fallbackTimingEvaluations,1);
  assert.ok(r.candidates.every(c=>c.modelSeconds===null));
});

test('reachable grid with unfinished A* frontier returns budget exceeded and no bogus time',()=>{
  const r=selectCandidateOrAstar(detour,family,{...options,maxExpansions:5});
  assert.equal(r.status,'BUDGET_EXCEEDED');assert.equal(r.astarExpanded,5);
  assert.deepEqual(r.path,[]);assert.equal(r.pathLength,null);assert.equal(r.timing,null);
  assert.equal(r.fallbackTimingEvaluations,0);assert.equal(r.astar.reason,'BUDGET_EXCEEDED');
});

test('exhausting the entire reachable graph is unreachable even at the exact numeric budget',()=>{
  const sealed={...detour,blockedCells:[...detour.blockedCells,[1,4]]};
  const r=selectCandidateOrAstar(sealed,family,{...options,maxExpansions:5});
  assert.equal(r.status,'UNREACHABLE');assert.equal(r.astarExpanded,5);
  assert.equal(r.astar.reason,'UNREACHABLE');assert.equal(r.timing,null);assert.equal(r.pathLength,null);
});

test('malformed, fractional, blocked and non-unit candidates cannot enter the time ranking',()=>{
  const candidates=[{id:'empty',path:[]},{id:'fractional',path:[[0,0],[.5,.5],[3,3]]},
    {id:'jump',path:[[0,0],[3,3]]},{id:'outside',path:[[0,0],[-1,0],[3,3]]},
    {id:'hole',path:[[0,0],...Array(1),[3,3]]},
    {id:'good',path:downPath}];
  const r=selectCandidateOrAstar(open,candidates,options);
  assert.equal(r.selectedCandidateId,'good');assert.equal(r.candidateTimingEvaluations,1);
  assert.ok(r.candidates.slice(0,-1).every(c=>c.status==='INVALID_POINT_PATH' && c.modelSeconds===null));
  const blocked=selectCandidateOrAstar(detour,[{id:'blocked',path:downPath}],options);
  assert.ok(blocked.candidates[0].issues.some(i=>i.reason==='BLOCKED_POINT_CELL'));
});

test('an empty registered family still searches the graph and reports a shortest move path',()=>{
  const r=selectCandidateOrAstar(open,[],options);
  assert.equal(r.status,'ROUTE_FOUND');assert.equal(r.candidateChecks,0);assert.equal(r.astarCalls,1);
  assert.equal(r.pathLength,6);assert.equal(r.selectedCandidateId,null);assert.ok(r.timing.modelSeconds>=9);
});

test('stable equal-time selection retains the first registered candidate',()=>{
  const r=selectCandidateOrAstar(open,[{id:'first',path:downPath},{id:'second',path:downPath}],options);
  assert.equal(r.selectedCandidateId,'first');assert.equal(r.timing.modelSeconds,9);
});

test('policy leaves inputs intact and returns a selected path detached from candidate coordinates',()=>{
  const world=structuredClone(open),candidates=structuredClone(family),opts=structuredClone(options);
  const before=JSON.stringify({world,candidates,opts});
  const r=selectCandidateOrAstar(world,candidates,opts);
  assert.equal(JSON.stringify({world,candidates,opts}),before);
  r.path[0][0]=99;assert.equal(candidates[1].path[0][0],0);
});

test('invalid budgets, motion options, IDs and endpoint maps fail before claiming a search result',()=>{
  for(const maxExpansions of [0,-1,1.5,NaN])assert.throws(()=>selectCandidateOrAstar(open,[],{...options,maxExpansions}),TypeError);
  for(const key of ['linearSpeed','linearAcceleration','angularSpeedDegrees','angularAccelerationMagnitudeDegreesPerSecondSquared']) {
    assert.throws(()=>selectCandidateOrAstar(detour,[],{...options,motionLimits:{...motionLimits,[key]:0}}),TypeError);
  }
  assert.throws(()=>selectCandidateOrAstar(open,[],{...options,motionLimits:{...motionLimits,initialHeading:'unknown'}}),TypeError);
  assert.throws(()=>selectCandidateOrAstar(open,[],{...options,motionLimits:{...motionLimits,stopPolicy:'unknown'}}),TypeError);
  assert.throws(()=>selectCandidateOrAstar(open,[{id:'a',path:downPath},{id:'a',path:downPath}],options),TypeError);
  assert.throws(()=>selectCandidateOrAstar(open,null,options),TypeError);
  assert.throws(()=>selectCandidateOrAstar({...open,blockedCells:[[0,0]]},[],options));
});

test('zero-move success at start equals goal is not mistaken for an absent route',()=>{
  const world={...open,start:[1,1],goal:[1,1]};
  const r=selectCandidateOrAstar(world,[],options);
  assert.equal(r.status,'ROUTE_FOUND');assert.equal(r.pathLength,0);assert.deepEqual(r.path,[[1,1]]);
  assert.equal(r.astarExpanded,1);assert.equal(r.timing.modelSeconds,0);
});
