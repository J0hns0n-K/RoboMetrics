// AI comparison implementation/operation; student forecast: route2 is quicker after reducing the cap.
import {readFile} from 'node:fs/promises';
import {boundedStopTurnTime} from '../src/bounded-path-time.mjs';
const config=JSON.parse(await readFile(new URL('../experiments/equal-turn-speed-cap-01.config.json',import.meta.url),'utf8'));
export const results=config.candidates.map(candidate=>({...candidate,
  timing:boundedStopTurnTime(candidate.path,config.motionLimits)
}));
console.log('같은 두 경로에서 직진 최고 속도만 1로 낮춥니다. 가상 조건의 모델 시간입니다.');
console.table(results.map(({id,sequence,straightRunLengths,timing:t})=>({
  id,sequence,straightRunLengths:straightRunLengths.join(','),moves:t.worldLength,
  turns:t.directionChanges,translationModelSeconds:t.translationSeconds,
  rotationModelSeconds:t.rotationSeconds,totalModelSeconds:t.modelSeconds
})));
