// AI-provided nominal-duration exercise; the rates are assumptions, not calibration.
import {readFile} from 'node:fs/promises';
import {nominalStopTurnTime} from '../src/nominal-path-time.mjs';

const initialHeading = 'down';
const linearSpeed = 1; // Virtual cells per second.
const angularSpeedDegrees = 180; // Degrees per second.

const fixtures = JSON.parse(await readFile(new URL('../experiments/path-turn-score-01.config.json', import.meta.url), 'utf8'));
export const results = fixtures.routes.map(({id, path}) => ({route: id,
  ...nominalStopTurnTime(path, {initialHeading, linearSpeed, angularSpeedDegrees})}));
console.log('가정한 속도: ' + linearSpeed + '칸/초, ' + angularSpeedDegrees + '도/초. 직진과 회전을 순서대로 계산합니다.');
console.table(results.map(({route, worldLength, totalRotationDegrees, translationSeconds, rotationSeconds, nominalSeconds}) => ({
  route, worldLength, totalRotationDegrees, translationSeconds, rotationSeconds, nominalSeconds
})));
