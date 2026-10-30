// AI reference implementation of the student's offered stop-policy selection.
import {readFile} from 'node:fs/promises';
import {linearAccelStopTurnTime} from '../src/linear-accel-path-time.mjs';

const config = JSON.parse(await readFile(new URL('../experiments/linear-accel-path-01.config.json', import.meta.url), 'utf8'));
const fixtures = JSON.parse(await readFile(new URL('../experiments/path-turn-score-01.config.json', import.meta.url), 'utf8'));
const policies = [config.primaryPolicy,config.controlPolicy];
export const results = fixtures.routes.flatMap(({id,path}) => policies.map(stopPolicy => ({
  route:id,...linearAccelStopTurnTime(path,{...config.motionLimits,stopPolicy})
})));
export const straightResults = config.straightControls.flatMap(({id,path,initialHeading}) => policies.map(stopPolicy => ({
  control:id,...linearAccelStopTurnTime(path,{...config.motionLimits,initialHeading,stopPolicy})
})));
console.log('가상 모델: 직진은 가속·감속을 반영하고, 회전은 기존 일정 각속도 가정을 유지합니다.');
console.table(results.map(({route,stopPolicy,intermediateStops,translationSeconds,rotationSeconds,modelSeconds}) => ({
  route,stopPolicy,intermediateStops,translationSeconds,rotationSeconds,modelSeconds
})));
