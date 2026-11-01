// AI exhaustive restricted-family runner; student owns the prior route/forecast.
import {readFile} from 'node:fs/promises';
import {boundedStopTurnTime} from '../src/bounded-path-time.mjs';
const config=JSON.parse(await readFile(new URL('../experiments/bounded-path-monotone-enumeration-01.config.json',import.meta.url),'utf8'));
const {start,rightMoves,downMoves,expectedCandidates,goal}=config.family;
if(rightMoves!==3 || downMoves!==3 || start[0]!==0 || start[1]!==0 || goal[0]!==3 || goal[1]!==3 || expectedCandidates!==20) {
  throw new Error('This control is registered for the fixed20six-move family only.');
}
export const candidates=[];
function visit(path,sequence,rightUsed,downUsed) {
  if(rightUsed===rightMoves && downUsed===downMoves) {
    const result=boundedStopTurnTime(path,config.motionLimits);
    const {worldLength,directionChanges,initialAlignmentDegrees,totalRotationDegrees,translationRuns,
      rotationOperations,translationSeconds,rotationSeconds,modelSeconds}=result;
    candidates.push({id:`path-${String(candidates.length+1).padStart(2,'0')}`,sequence,path,
      worldLength,directionChanges,initialAlignmentDegrees,totalRotationDegrees,translationRuns,
      rotationOperations,translationSeconds,rotationSeconds,modelSeconds});
    return;
  }
  const [x,y]=path.at(-1);
  if(rightUsed<rightMoves)visit([...path,[x+1,y]],[...sequence,'right'],rightUsed+1,downUsed);
  if(downUsed<downMoves)visit([...path,[x,y+1]],[...sequence,'down'],rightUsed,downUsed+1);
}
visit([[...start]],[],0,0);
if(candidates.length!==expectedCandidates)throw new Error('Incomplete registered candidate family.');
const student=candidates.find(c=>JSON.stringify(c.path)===JSON.stringify(config.studentReferencePath));
if(!student)throw new Error('Missing registered student reference.');
const minimumSeconds=Math.min(...candidates.map(c=>c.modelSeconds));
export const summary={candidateCount:candidates.length,studentReferenceId:student.id,
  studentReferenceSeconds:student.modelSeconds,minimumSeconds,
  maximumSeconds:Math.max(...candidates.map(c=>c.modelSeconds)),
  minimumIds:candidates.filter(c=>c.modelSeconds===minimumSeconds).map(c=>c.id),
  fasterThanStudent:candidates.filter(c=>c.modelSeconds<student.modelSeconds).length,
  equalToStudent:candidates.filter(c=>c.modelSeconds===student.modelSeconds).length,
  slowerThanStudent:candidates.filter(c=>c.modelSeconds>student.modelSeconds).length};
console.log('장애물 없는 설명용6칸 경로20개를 비교한 가상 모델입니다.');
console.table(candidates.map(({id,sequence,rotationOperations,modelSeconds})=>({
  id,sequence:sequence.map(h=>h==='right'?'→':'↓').join(' '),rotationOperations,modelSeconds
})));
