// Student owns the arrow sequence; AI owns transcription and comparison code.
import {readFile} from 'node:fs/promises';
import {linearAccelStopTurnTime} from '../src/linear-accel-path-time.mjs';

const config = JSON.parse(await readFile(new URL('../experiments/linear-accel-route-01.config.json', import.meta.url), 'utf8'));
const fixtures = JSON.parse(await readFile(new URL('../experiments/path-turn-score-01.config.json', import.meta.url), 'utf8'));
const baseline = fixtures.routes.find(route => route.id === config.baselineId);
if (!baseline) throw new Error('Missing configured baseline.');
export const results = [
  {route:'baseline-X', path:baseline.path},
  {route:'student-route-01', path:config.studentPath}
].map(({route,path}) => ({route,path,...linearAccelStopTurnTime(path,config.motionLimits)}));
console.log('같은 출발·도착·6칸 거리에서 이동 순서만 비교한 가상 모델입니다.');
console.table(results.map(({route,worldLength,intermediateStops,totalRotationDegrees,translationSeconds,rotationSeconds,modelSeconds}) => ({
  route,worldLength,intermediateStops,totalRotationDegrees,translationSeconds,rotationSeconds,modelSeconds
})));
