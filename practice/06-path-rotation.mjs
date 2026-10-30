// AI-provided geometric orientation exercise, not measured robot motion.
import {readFile} from 'node:fs/promises';
import {countDirectionChanges} from '../src/path-metrics.mjs';
import {measureAxisPathRotation} from '../src/path-rotation.mjs';

const initialHeading = 'right';

const fixtures = JSON.parse(await readFile(new URL('../experiments/path-turn-score-01.config.json', import.meta.url), 'utf8'));
export const results = fixtures.routes.map(({id, path}) => ({route: id,
  directionChanges: countDirectionChanges(path), ...measureAxisPathRotation(path, {initialHeading})}));
console.log('설명용 경로의 최소 회전 각도 합계입니다. 처음 방향: ' + initialHeading);
console.table(results.map(({route, directionChanges, initialAlignmentDegrees, pathRotationDegrees, totalRotationDegrees}) => ({
  route, directionChanges, initialAlignmentDegrees, pathRotationDegrees, totalRotationDegrees
})));
