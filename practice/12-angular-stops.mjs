// AI analytic reference for the student's prior two-stop-case prediction.
import {readFile} from 'node:fs/promises';
import {stoppedAngularSequenceTime} from '../src/angular-speed-profile.mjs';
const config=JSON.parse(await readFile(new URL('../experiments/angular-ramp-stop-01.config.json',import.meta.url),'utf8'));
export const results=config.cases.map(({id,anglesDegrees})=>({id,anglesDegrees,
  ...stoppedAngularSequenceTime(anglesDegrees,config.limits),
  instantaneousRateControlSeconds:anglesDegrees.reduce((sum,angle)=>sum+angle/config.limits.maxAngularSpeedDegreesPerSecond,0)
}));
console.log('회전 가속·감속과 중간 정지를 비교한 가상 모델입니다. 실제 로봇 측정값이 아닙니다.');
console.table(results.map(({id,totalAngleDegrees,intermediateRestBoundaries,extraDwellSeconds,modelSeconds,instantaneousRateControlSeconds})=>({
  id,totalAngleDegrees,intermediateRestBoundaries,extraDwellSeconds,modelSeconds,instantaneousRateControlSeconds
})));
