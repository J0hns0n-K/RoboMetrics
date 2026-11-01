// AI validity/control runner; student selected the offered wall position.
import {readFile} from 'node:fs/promises';
import {boundedStopTurnTime} from '../src/bounded-path-time.mjs';
const config=JSON.parse(await readFile(new URL('../experiments/bounded-path-single-wall-01.config.json',import.meta.url),'utf8'));
const archive=JSON.parse(await readFile(new URL(`../${config.candidateSource}`,import.meta.url),'utf8'));
const registered=archive.configuredRun.candidates;
if(registered.length!==20)throw new Error('Expected archived20candidate family.');
export const candidates=registered.map(({id,sequence,path})=>{
  const blockedCells=config.blockedCells.filter(([x,y])=>path.some(([px,py])=>px===x && py===y));
  if(blockedCells.length) {
    return {id,sequence,path,status:'BLOCKED_POINT_CELL',blockedCells,
      modelSeconds:null,translationSeconds:null,rotationSeconds:null};
  }
  const {worldLength,directionChanges,initialAlignmentDegrees,totalRotationDegrees,
    rotationOperations,translationSeconds,rotationSeconds,modelSeconds}=boundedStopTurnTime(path,config.motionLimits);
  return {id,sequence,path,status:'POINT_PATH_VALID',blockedCells:[],worldLength,directionChanges,
    initialAlignmentDegrees,totalRotationDegrees,rotationOperations,translationSeconds,rotationSeconds,modelSeconds};
});
const valid=candidates.filter(c=>c.status==='POINT_PATH_VALID');
const minimumSeconds=valid.length?Math.min(...valid.map(c=>c.modelSeconds)):null;
const student=candidates.find(c=>c.id===archive.configuredRun.summary.studentReferenceId);
if(!student)throw new Error('Missing student reference candidate.');
export const summary={candidateCount:candidates.length,blockedCount:candidates.length-valid.length,
  validCount:valid.length,minimumValidSeconds:minimumSeconds,
  minimumValidIds:valid.filter(c=>c.modelSeconds===minimumSeconds).map(c=>c.id),
  studentReferenceId:student.id,studentReferenceStatus:student.status,studentReferenceSeconds:student.modelSeconds,
  evaluatedValidCandidates:valid.length};
console.log('점 장애물 유효성을 먼저 확인한 뒤, 통과 가능한 후보의 모델 시간만 비교합니다.');
console.table(candidates.map(({id,status,modelSeconds})=>({id,status,modelSeconds})));
