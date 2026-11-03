// AI comparison implementation/operation; student forecast: route1 is quicker.
import {readFile} from 'node:fs/promises';
import {boundedStopTurnTime} from '../src/bounded-path-time.mjs';
const config=JSON.parse(await readFile(new URL('../experiments/equal-turn-run-lengths-01.config.json',import.meta.url),'utf8'));
export const results=config.candidates.map(candidate=>({...candidate,
  timing:boundedStopTurnTime(candidate.path,config.motionLimits)
}));
console.log('같은 이동·회전 횟수에서 직선 길이 배치를 비교합니다. 가상 조건의 모델 시간입니다.');
console.table(results.map(({id,sequence,straightRunLengths,timing:t})=>({
  id,sequence,straightRunLengths:straightRunLengths.join(','),moves:t.worldLength,
  turns:t.directionChanges,translationModelSeconds:t.translationSeconds,
  rotationModelSeconds:t.rotationSeconds,totalModelSeconds:t.modelSeconds
})));
