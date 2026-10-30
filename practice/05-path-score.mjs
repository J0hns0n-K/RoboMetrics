// AI-provided score exercise; student calculations/edits are recorded separately.
import {readFile} from 'node:fs/promises';
import {scoreAxisPath} from '../src/virtual-path-score.mjs';

// Arbitrary score points per direction-change event, not seconds or energy.
const perDirectionChange = 0.5;

const fixtures = JSON.parse(await readFile(new URL('../experiments/path-turn-score-01.config.json', import.meta.url), 'utf8'));
export const results = fixtures.routes.map(({id, path}) => ({route: id,
  ...scoreAxisPath(path, {perWorldUnit: 1, perDirectionChange})}));
console.log('가상 점수 = 세계 길이 × 1 + 방향 전환 횟수 × ' + perDirectionChange);
console.table(results.map(({route, worldLength, directionChanges, virtualScore}) => ({
  route, worldLength, directionChanges, virtualScore
})));
