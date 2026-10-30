// AI-provided analytic 1D examples; student attempts/interpretation are recorded separately.
import {readFile} from 'node:fs/promises';
import {sampleLinearSpeedRamp} from '../src/linear-speed-ramp.mjs';

const config = JSON.parse(await readFile(new URL('../experiments/linear-speed-ramp-01.config.json', import.meta.url), 'utf8'));
export const results = config.profiles.map(profile => ({id:profile.id, input:{...profile},
  samples:config.sampleFractions.map(fraction => sampleLinearSpeedRamp(profile, profile.duration * fraction))}));
console.log('가상 1차원 속도 변화의 해석적 계산입니다. 시간: 초, 속도: 칸/초, 변위: 칸.');
console.table(results.flatMap(({id, samples}) => samples.map(state => ({
  profile:id, elapsedSeconds:state.elapsed, currentSpeed:state.currentSpeed,
  fullRampAverageSpeed:state.fullRampAverageSpeed, displacement:state.displacement
}))));
