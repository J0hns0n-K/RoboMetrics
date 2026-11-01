// AI control/validation/reference code; student supplied the eight-arrow witness.
import {readFile} from 'node:fs/promises';
import {makeMap,plan} from '../src/core.mjs';
import {boundedStopTurnTime} from '../src/bounded-path-time.mjs';
const config=JSON.parse(await readFile(new URL('../experiments/bounded-path-detour-witness-01.config.json',import.meta.url),'utf8'));
const archive=JSON.parse(await readFile(new URL(`../${config.restrictedCandidateSource}`,import.meta.url),'utf8'));
const world=config.map;
const coordinate=p=>Array.isArray(p) && p.length===2 && p.every(Number.isInteger);
const same=(p,q)=>coordinate(p) && coordinate(q) && p[0]===q[0] && p[1]===q[1];
function validate(path) {
  if(!Array.isArray(path) || !path.length)return {valid:false,issues:[{reason:'EMPTY_PATH'}]};
  const issues=[];
  if(!same(path[0],world.start))issues.push({reason:'WRONG_START'});
  if(!same(path.at(-1),world.goal))issues.push({reason:'WRONG_GOAL'});
  path.forEach((point,index)=>{
    if(!coordinate(point)){issues.push({reason:'INVALID_COORDINATE',index});return;}
    const [x,y]=point;
    if(x<0 || y<0 || x>=world.width || y>=world.height)issues.push({reason:'OUT_OF_BOUNDS',index,point});
    if(world.blockedCells.some(cell=>same(cell,point)))issues.push({reason:'BLOCKED_POINT_CELL',index,point});
    if(index && coordinate(path[index-1]) && Math.abs(x-path[index-1][0])+Math.abs(y-path[index-1][1])!==1) {
      issues.push({reason:'NON_UNIT_CARDINAL_STEP',index});
    }
  });
  return {valid:issues.length===0,issues};
}
const studentValidation=validate(config.studentPath);
const classified=archive.configuredRun.candidates.map(({id,path})=>{
  const validation=validate(path);
  return {id,validation,modelSeconds:null};
});
const map=makeMap(world.width,world.height,world.blockedCells,world.start,world.goal);
const astarReference=plan(map,config.referencePlanner.algorithm,config.referencePlanner.maxExpansions,
  {tieBreak:config.referencePlanner.tieBreak});
export const results={
  studentWitness:{path:config.studentPath,validation:studentValidation,
    moveCount:config.studentPath.length-1,
    timing:studentValidation.valid?boundedStopTurnTime(config.studentPath,config.motionLimits):null},
  restrictedFamily:{candidateCount:classified.length,validCount:classified.filter(c=>c.validation.valid).length,
    invalidCount:classified.filter(c=>!c.validation.valid).length,
    status:classified.some(c=>c.validation.valid)?'HAS_VALID_MEMBER':'NO_VALID_MEMBER_IN_REGISTERED_FAMILY',
    candidates:classified},
  astarReference
};
console.log('새 점 지도에서 학생의 우회 경로와6칸 후보군의 범위를 확인합니다. 실제 로봇 실험이 아닙니다.');
console.table([{studentPathValid:studentValidation.valid,studentMoves:results.studentWitness.moveCount,
  studentModelSeconds:results.studentWitness.timing?.modelSeconds??null,
  sixMoveValidCandidates:results.restrictedFamily.validCount,
  astarSuccess:astarReference.success,astarMoves:astarReference.pathLength}]);
