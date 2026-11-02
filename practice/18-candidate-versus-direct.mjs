// AI-controlled comparison; the student reported no prediction ("몰라").
import {readFile} from 'node:fs/promises';
import {makeMap,plan} from '../src/core.mjs';
import {selectCandidateOrAstar} from '../src/candidate-astar-fallback.mjs';
import {boundedStopTurnTime} from '../src/bounded-path-time.mjs';

const protocol=JSON.parse(await readFile(new URL('../experiments/candidate-astar-direct-comparison-01.protocol.json',import.meta.url),'utf8'));
const config=JSON.parse(await readFile(new URL(`../${protocol.config}`,import.meta.url),'utf8'));
const {world}=config.cases.find(c=>c.id===protocol.caseId);
const archive=JSON.parse(await readFile(new URL(`../${config.candidateSource}`,import.meta.url),'utf8'));
const registered=archive.configuredRun.candidates.map(({id,path})=>({id,path}));
const candidateFirst=selectCandidateOrAstar(world,registered,{motionLimits:config.motionLimits,maxExpansions:protocol.astar.maxExpansions});
const astar=plan(makeMap(world.width,world.height,world.blockedCells,world.start,world.goal),'astar',protocol.astar.maxExpansions,{tieBreak:protocol.astar.tieBreak});
export const results={world,motionLimits:config.motionLimits,candidateFirst,directAstar:{
  status:astar.success?'ROUTE_FOUND':astar.reason,astar,
  timing:astar.success?boundedStopTurnTime(astar.path,config.motionLimits):null,
  candidateChecks:0,candidateTimingEvaluations:0,astarCalls:1,
  astarExpanded:astar.expanded,returnedPathTimingEvaluations:astar.success?1:0
}};
console.log('같은 점 지도에서 후보 시간 비교와 이동 횟수 기준 A*를 비교합니다. 실제 로봇 시간은 아닙니다.');
console.table([
  {method:'candidate-first',moves:candidateFirst.pathLength,modelSeconds:candidateFirst.timing?.modelSeconds??null,astarExpanded:candidateFirst.astarExpanded},
  {method:'direct-A*',moves:astar.pathLength,modelSeconds:results.directAstar.timing?.modelSeconds??null,astarExpanded:astar.expanded}
]);
