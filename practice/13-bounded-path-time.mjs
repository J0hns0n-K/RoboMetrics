// AI composition/control code; student owns the earlier one-turn arrow design.
import {readFile} from 'node:fs/promises';
import {linearAccelStopTurnTime} from '../src/linear-accel-path-time.mjs';
import {boundedStopTurnTime} from '../src/bounded-path-time.mjs';
const config=JSON.parse(await readFile(new URL('../experiments/bounded-path-angular-01.config.json',import.meta.url),'utf8'));
export const comparisons=config.routes.map(({id,path})=>{
  const reference=linearAccelStopTurnTime(path,config.motionLimits);
  const bounded=boundedStopTurnTime(path,config.motionLimits);
  return {id,path,reference,bounded,addedModelSeconds:bounded.modelSeconds-reference.modelSeconds};
});
console.log('직진과 회전의 가속·감속을 합친 가상 경로 모델입니다. 실제 로봇 측정값이 아닙니다.');
console.table(comparisons.map(({id,reference,bounded,addedModelSeconds})=>({
  id,rotationOperations:bounded.rotationOperations,translationSeconds:bounded.translationSeconds,
  referenceSeconds:reference.modelSeconds,boundedSeconds:bounded.modelSeconds,addedModelSeconds
})));
