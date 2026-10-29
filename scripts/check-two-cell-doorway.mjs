// AI-operated model-limit control: continuous geometry versus original cell-center graph.
import assert from 'node:assert/strict';
import {readFile, writeFile, mkdir, access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {resolve, relative, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {makeMap} from '../src/core.mjs';
import {planDiskPath} from '../src/disk-footprint.mjs';
import {bfsDistance} from './check-current-position-detour.mjs';

// Audit a supplied axis-aligned polyline in WORLD coordinates, not original cell indices.
// This is a feasibility witness checker, not a continuous planner or shortest-path proof.
export function auditWorldPolyline(map, path, effectiveRadius) {
  assert.ok(Number.isFinite(effectiveRadius) && effectiveRadius >= 0);
  assert.ok(Array.isArray(path) && path.length >= 2);
  for (const p of path) assert.ok(Array.isArray(p) && p.length === 2 && p.every(Number.isFinite));
  const segments = [];
  for (let i = 1; i < path.length; i++) {
    const [a, b] = [path[i - 1], path[i]];
    assert.ok(a[0] === b[0] || a[1] === b[1], 'Only axis-aligned segments supported.');
    const lo = [Math.min(a[0], b[0]), Math.min(a[1], b[1])];
    const hi = [Math.max(a[0], b[0]), Math.max(a[1], b[1])];
    let minimumCenterClearance = Math.min(lo[0], lo[1], map.width - hi[0], map.height - hi[1]);
    for (let k = 0; k < map.cells.length; k++) if (map.cells[k]) {
      const square = [k % map.width, Math.floor(k / map.width)];
      const gaps = square.map((v, axis) => hi[axis] < v ? v - hi[axis] : lo[axis] > v + 1 ? lo[axis] - v - 1 : 0);
      minimumCenterClearance = Math.min(minimumCenterClearance, Math.hypot(...gaps));
    }
    segments.push({from: [...a], to: [...b], length: Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]),
      minimumCenterClearance, valid: minimumCenterClearance > effectiveRadius});
  }
  return {valid: segments.every(s => s.valid), effectiveRadius, contactIsCollision: true,
    minimumCenterClearance: Math.min(...segments.map(s => s.minimumCenterClearance)),
    geometricLength: segments.reduce((n, s) => n + s.length, 0), segments,
    scope: 'Exact axis-aligned segment/square and world-boundary distances for this assumed disk; no dynamics or global continuous optimality.'};
}

const rowsOf = map => Array.from({length: map.height}, (_, y) => Array.from({length: map.width}, (_, x) =>
  map.cells[y * map.width + x] ? '#' : '.').join(''));

async function main() {
  const [inputPath, outputPath] = process.argv.slice(2);
  if (!inputPath || !outputPath?.endsWith('.json')) throw new Error('Usage: node scripts/check-two-cell-doorway.mjs PROTOCOL.json NEW-OUTPUT.json');
  const root = fileURLToPath(new URL('../', import.meta.url));
  const local = path => {
    const p = relative(root, resolve(path)).replaceAll('\\', '/');
    if (p === '..' || p.startsWith('../') || p.includes(':')) throw new Error('Use project paths.');
    return p;
  };
  const protocolFile = local(inputPath), outputFile = local(outputPath);
  try { await access(resolve(root, outputFile)); throw new Error('Output already exists; choose a new name.'); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  const p = JSON.parse(await readFile(resolve(root, protocolFile), 'utf8'));
  assert.equal(p.status, 'ready'); assert.equal(p.tieBreak, 'fifo');
  // Deliberately specific known control, not a generic geometry experiment generator.
  assert.deepEqual([p.width, p.height, p.barrierColumn, p.openingRows], [9, 7, 4, [2, 3]]);
  assert.deepEqual(p.start, [1, 3]); assert.deepEqual(p.goal, [7, 3]);
  assert.equal(p.maxExpansions, 100);
  assert.deepEqual(p.cases, [{id: 'smaller-margin-control', radius: .4, clearance: .05},
    {id: 'selected-margin', radius: .4, clearance: .15}]);
  const sources = ['src/core.mjs', 'src/disk-footprint.mjs', 'scripts/run-scenario.mjs',
    'scripts/check-current-position-detour.mjs', 'scripts/check-two-cell-doorway.mjs',
    'test/two-cell-doorway.test.mjs', 'data/footprint/two-cell-doorway-tests-01.txt', protocolFile,
    p.selectedModel, p.studentExpectationRecord];
  const git = args => execFileSync('git', args, {cwd: root, encoding: 'utf8'}).trim();
  if (git(['status', '--porcelain', '--', ...sources])) throw new Error('Commit inputs and source first.');
  const sha = b => createHash('sha256').update(b).digest('hex'), hashes = {};
  for (const file of sources) {
    const blob = execFileSync('git', ['show', 'HEAD:' + file], {cwd: root});
    assert.equal(sha(Buffer.from((await readFile(resolve(root, file), 'utf8')).replace(/\r\n/g, '\n'))), sha(blob));
    hashes[file] = sha(blob);
  }
  const selectedModel = JSON.parse(await readFile(resolve(root, p.selectedModel), 'utf8'));
  assert.equal(selectedModel.radius, .4); assert.equal(selectedModel.clearance, .15);
  assert.equal(selectedModel.effectiveRadius, .55); assert.equal(selectedModel.contactIsCollision, true);
  const blocked = Array.from({length: p.height}, (_, y) => [p.barrierColumn, y]).filter(([, y]) => !p.openingRows.includes(y));
  const map = makeMap(p.width, p.height, blocked, p.start, p.goal);
  const cases = p.cases.map(c => {
    const outcome = planDiskPath(map, {...c, maxExpansions: p.maxExpansions, tieBreak: p.tieBreak});
    assert.deepEqual(outcome.invalidEndpoints, []);
    const space = outcome.configurationSpace, configurationRows = rowsOf(space);
    const distance = bfsDistance(configurationRows, space.start, space.goal);
    const minimumPointClearances = [];
    for (let y = 0; y < p.height; y++) for (let x = 0; x < p.width; x++) {
      const point = [x + .5, y + .5];
      const audit = auditWorldPolyline(map, [point, point], c.radius + c.clearance);
      assert.equal(space.cells[y * p.width + x], audit.valid ? 0 : 1);
      minimumPointClearances.push(audit.minimumCenterClearance);
    }
    assert.equal(outcome.planningResult.success, distance !== null);
    const centerWitness = structuredClone(p.continuousWitnessWorld);
    assert.deepEqual(centerWitness[0], p.start.map(v => v + .5));
    assert.deepEqual(centerWitness.at(-1), p.goal.map(v => v + .5));
    const continuousWitness = auditWorldPolyline(map, centerWitness, c.radius + c.clearance);
    assert.ok(continuousWitness.valid); assert.equal(continuousWitness.geometricLength, 7);
    if (c.id === 'selected-margin') {
      assert.equal(outcome.status, 'UNREACHABLE');
      assert.equal(distance, null); assert.equal(outcome.planningResult.pathLength, null);
      assert.deepEqual(outcome.planningResult.path, []);
    } else {
      assert.equal(outcome.status, 'ROUTE_FOUND'); assert.equal(distance, 6);
      const worldPath = outcome.planningResult.path.map(pt => pt.map(v => v + .5));
      assert.ok(auditWorldPolyline(map, worldPath, c.radius + c.clearance).valid);
    }
    const {cells, ...metadata} = space;
    return {configuration: c, configurationRows, minimumPointClearances,
      outcome: {...outcome, configurationSpace: metadata}, configurationBfsDistance: distance, continuousWitness};
  });
  const output = {schemaVersion: 1, label: 'KNOWN VIRTUAL GEOMETRY CONTROL; NO PHYSICAL ROBOT',
    protocol: p, originalRows: rowsOf(map), cases,
    execution: {operator: 'AI assistant CLI', executedAtUTC: new Date().toISOString(),
      sourceCommit: git(['rev-parse', 'HEAD']), sourceInputsDirty: false, sourceHashesGitBlobs: hashes,
      workspaceStatus: git(['status', '--porcelain']), node: process.version, platform: `${process.platform}/${process.arch}`,
      plannerCalls: cases.length, examinedNodes: cases.reduce((n,c) => n + c.outcome.planningResult.expanded, 0),
      configurationBfsCalls: cases.length, centerClearanceChecks: cases.length * map.cells.length,
      continuousWitnessChecks: cases.length, provenance: p.attribution}};
  await mkdir(dirname(resolve(root, outputFile)), {recursive: true});
  await writeFile(resolve(root, outputFile), JSON.stringify(output, null, 2) + '\n', {flag: 'wx'});
  console.table(cases.map(c => ({case: c.configuration.id, gridStatus: c.outcome.status,
    moves: c.outcome.planningResult.pathLength, examined: c.outcome.planningResult.expanded,
    continuousWitnessValid: c.continuousWitness.valid, witnessLength: c.continuousWitness.geometricLength})));
  console.log(`Saved ${outputFile}; source ${output.execution.sourceCommit}`);
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => {console.error(error.message); process.exitCode = 1;});
}
