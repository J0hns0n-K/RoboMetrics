// AI implementation/operation; student selected A* after candidate-family failure.
import {readFile} from 'node:fs/promises';
import {selectCandidateOrAstar} from '../src/candidate-astar-fallback.mjs';
const config=JSON.parse(await readFile(new URL('../experiments/candidate-astar-fallback-01.config.json',import.meta.url),'utf8'));
const archive=JSON.parse(await readFile(new URL(`../${config.candidateSource}`,import.meta.url),'utf8'));
const registered=archive.configuredRun.candidates.map(({id,path})=>({id,path}));
export const results=config.cases.map(({id,world,maxExpansions})=>({id,world,maxExpansions,
  result:selectCandidateOrAstar(world,registered,{motionLimits:config.motionLimits,maxExpansions})
}));
console.log('등록 후보가 없을 때 A*로 이어 가며, 예산 초과와 점 그래프 도달 불가를 구분합니다.');
console.table(results.map(({id,maxExpansions,result:r})=>({
  id,status:r.status,source:r.selectedSource,candidateChecks:r.candidateChecks,
  candidateTimings:r.candidateTimingEvaluations,astarCalls:r.astarCalls,
  astarExpanded:r.astarExpanded,astarBudget:maxExpansions,
  pathLength:r.pathLength,modelSeconds:r.timing?.modelSeconds??null
})));
