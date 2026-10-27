// AI-authored, fixed-map teaching aid. Original engine files are not modified.
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {dirname, resolve} from 'node:path';
import assert from 'node:assert/strict';
import {makeMap, plan} from '../src/core.mjs';

const coreBytes = await readFile(new URL('../src/core.mjs', import.meta.url));
const source = coreBytes.toString('utf8');
const marker = /expansions\+\+;\r?\n/g;
assert.equal([...source.matchAll(marker)].length, 1, 'Expected one expansion increment');
const instrumentedSource = source.replace(marker,
  'expansions++;\n    globalThis.__roboLearningTrace.push([current.k%w, Math.floor(current.k/w)]);\n');
const instrumented = await import('data:text/javascript;base64,' + Buffer.from(instrumentedSource).toString('base64'));
const map = makeMap(3, 3, [[1, 1]]);
const policies = {};
let checked = 0;
try {
  for (const algorithm of ['astar', 'greedy']) {
    const cases = {};
    for (const budget of [1, 2, 3, 4, 5, 6, 7, 8, 9, Infinity]) {
      globalThis.__roboLearningTrace = [];
      const observed = instrumented.plan(map, algorithm, budget);
      const original = plan(map, algorithm, budget);
      assert.deepEqual(observed, original, 'Observation changed engine result');
      assert.equal(globalThis.__roboLearningTrace.length, original.expanded);
      checked++;
      if (budget === Infinity) {
        policies[algorithm] = {trace: [...globalThis.__roboLearningTrace], fullResult: original, cases};
      } else cases[budget] = {success: original.success, reason: original.reason,
        pathLength: original.pathLength, expanded: original.expanded};
    }
    for (const budget of [1, 2, 3, 4, 5, 6, 7, 8, 9]) {
      globalThis.__roboLearningTrace = [];
      instrumented.plan(map, algorithm, budget);
      assert.deepEqual(globalThis.__roboLearningTrace,
        policies[algorithm].trace.slice(0, policies[algorithm].cases[budget].expanded));
    }
  }
} finally { delete globalThis.__roboLearningTrace; }

const data = {
  label: 'AI-AUTHORED FIXED-MAP LEARNING REPLAY; NOT STUDENT RESEARCH',
  date: '2026-10-28',
  coreSha256: createHash('sha256').update(coreBytes).digest('hex'),
  observation: 'Passive trace push after expansion increment in an in-memory copy; original engine files unchanged.',
  validation: {matchedOriginalEngineCases: checked, prefixChecks: 18},
  rows: ['S..', '.#.', '..G'], policies
};
const target = resolve(process.argv[2] || 'data/learning/center-map-trace.json');
await mkdir(dirname(target), {recursive: true});
await writeFile(target, JSON.stringify(data, null, 2) + '\n', {flag: 'wx'});
console.log(JSON.stringify({target, validation: data.validation,
  traces: Object.fromEntries(Object.entries(policies).map(([a, p]) => [a, p.trace]))}));
