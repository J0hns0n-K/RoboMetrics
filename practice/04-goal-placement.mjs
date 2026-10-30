// AI-provided guided parameter exercise on an archived map; not student-written algorithm code.
import {readFile} from 'node:fs/promises';
import {makeMap} from '../src/core.mjs';
import {resolveDiskResolution} from '../src/resolution-policy.mjs';

// Change only this goal from [7, 3] (original G) to [7, 2] (AI-explained A), then save.
const goal = [7, 2];

const source = JSON.parse(await readFile(new URL('../data/footprint/resolution-quality-prospective-run-01.json', import.meta.url), 'utf8'));
const model = JSON.parse(await readFile(new URL('../experiments/disk-model-clearance015-01.config.json', import.meta.url), 'utf8'));
const fixture = source.records.find(row => row.trial === 10);
const blocked = fixture.originalRows.flatMap((line, y) => [...line].flatMap((value, x) => value === '#' ? [[x, y]] : []));
const map = makeMap(9, 7, blocked, source.protocol.start, goal);
const result = resolveDiskResolution(map, {
  mode: 'always-fine', radius: model.radius, clearance: model.clearance,
  coarseBudget: 100, fineBudget: 100, tieBreak: 'fifo'
});
console.log('도착점만 바꾸는 안내된 연습입니다. 원래 실험 자료는 수정하거나 덮어쓰지 않습니다.');
console.table([{goal: goal.join(','), result: result.status, worldLength: result.geometricLength, examined: result.expanded}]);
