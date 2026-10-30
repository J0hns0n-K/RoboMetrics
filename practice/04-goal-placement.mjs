// AI-provided guided parameter exercise on an archived map; not student-written algorithm code.
import {readFile} from 'node:fs/promises';
import {makeMap} from '../src/core.mjs';
import {resolveDiskResolution} from '../src/resolution-policy.mjs';
import {countDirectionChanges} from '../src/path-metrics.mjs';

// Goal choices and saved edits are attributed separately in data/learning/endpoint-student-choice-*.json.
const goal = [6, 1];

const source = JSON.parse(await readFile(new URL('../data/footprint/resolution-quality-prospective-run-01.json', import.meta.url), 'utf8'));
const model = JSON.parse(await readFile(new URL('../experiments/disk-model-clearance015-01.config.json', import.meta.url), 'utf8'));
const fixture = source.records.find(row => row.trial === 10);
const blocked = fixture.originalRows.flatMap((line, y) => [...line].flatMap((value, x) => value === '#' ? [[x, y]] : []));
const map = makeMap(9, 7, blocked, source.protocol.start, goal);
export const result = resolveDiskResolution(map, {
  mode: 'always-fine', radius: model.radius, clearance: model.clearance,
  coarseBudget: 100, fineBudget: 200, tieBreak: 'fifo'
});
console.log('도착점만 바꾸는 안내된 연습입니다. 원래 실험 자료는 수정하거나 덮어쓰지 않습니다.');
// A failed search has no returned path to measure, so the descriptor is null, not zero.
const directionChanges = result.status === 'ROUTE_FOUND' ? countDirectionChanges(result.worldPath) : null;
console.table([{goal: goal.join(','), result: result.status, worldLength: result.geometricLength,
  examined: result.expanded, directionChanges}]);
// AI-written example after the student requested more help; not student-authored wording.
if (result.status === 'INVALID_ENDPOINT_CLEARANCE') {
  console.log('로봇 몸체와 여유폭을 확보할 공간이 부족하니, 벽과 지도 경계에서 더 떨어진 위치를 선택하세요.');
}
