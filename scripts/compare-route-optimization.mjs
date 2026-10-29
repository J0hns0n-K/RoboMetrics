// AI known-fixture comparison of explicit retention and the student-selected default.
import assert from 'node:assert/strict';
import {readFile, writeFile, mkdir, access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {resolve, relative, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseScenario} from './run-scenario.mjs';
import {bfsDistance} from './check-current-position-detour.mjs';
import {verifyPath} from '../src/core.mjs';
import {resolveRouteUpdate} from '../src/route-update-policy.mjs';

async function main() {
  const [inputPath, outputPath] = process.argv.slice(2);
  if (!inputPath || !outputPath?.endsWith('.json')) throw new Error('Usage: node scripts/compare-route-optimization.mjs CONFIG.json NEW-OUTPUT.json');
  const root = fileURLToPath(new URL('../', import.meta.url));
  const local = path => {
    const p = relative(root, resolve(path)).replaceAll('\\', '/');
    if (p === '..' || p.startsWith('../') || p.includes(':')) throw new Error('Use project paths.');
    return p;
  };
  const configFile = local(inputPath), outputFile = local(outputPath);
  try { await access(resolve(root, outputFile)); throw new Error('Output already exists; choose a new name.'); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  const config = JSON.parse(await readFile(resolve(root, configFile), 'utf8'));
  assert.equal(config.status, 'ready'); assert.equal(config.defaultOptimization, 'reoptimize'); assert.equal(config.tieBreak, 'fifo');
  const choiceFile = local(resolve(root, config.studentChoiceRecord));
  const sources = ['src/core.mjs', 'src/route-update-policy.mjs', 'scripts/run-scenario.mjs',
    'scripts/check-current-position-detour.mjs', 'scripts/compare-route-optimization.mjs',
    'test/route-update-policy.test.mjs', configFile, choiceFile];
  const git = args => execFileSync('git', args, {cwd: root, encoding: 'utf8'}).trim();
  if (git(['status', '--porcelain', '--', ...sources])) throw new Error('Commit inputs and source first.');
  const sha = b => createHash('sha256').update(b).digest('hex'), hashes = {};
  for (const file of sources) {
    const blob = execFileSync('git', ['show', 'HEAD:' + file], {cwd: root});
    assert.equal(sha(Buffer.from((await readFile(resolve(root, file), 'utf8')).replace(/\r\n/g, '\n'))), sha(blob));
    hashes[file] = sha(blob);
  }
  const maps = new Map();
  const parse = (id, rows, budget = 30) => parseScenario({id, rows, budgets: [budget], status: 'ready',
    contributionType: 'ai-reference', contributor: 'AI assistant', assistance: config.attribution,
    prediction: 'AI expected reference behavior; no student outcome forecast.'});
  for (const definition of config.maps) {
    assert.ok(!maps.has(definition.id));
    const map = parse(definition.id, definition.rows), old = parse(definition.id + '-old', definition.oldRows);
    assert.equal(map.width, old.width); assert.equal(map.height, old.height);
    assert.deepEqual(map.start, old.start); assert.deepEqual(map.goal, old.goal);
    assert.ok(verifyPath(old, config.priorPath)); assert.ok(verifyPath(map, config.priorPath));
    const changes = [];
    for (let k = 0; k < map.cells.length; k++) if (old.cells[k] !== map.cells[k]) {
      changes.push({coordinate: [k % map.width, Math.floor(k / map.width)], from: old.cells[k], to: map.cells[k]});
    }
    assert.deepEqual(changes, definition.changes);
    maps.set(definition.id, {definition, map, shortestDistance: bfsDistance(definition.rows, map.start, map.goal)});
  }
  const cases = config.cases.map(control => {
    const entry = maps.get(control.map); assert.ok(entry);
    assert.ok(['keep-valid', 'default'].includes(control.optimization));
    const options = {maxExpansions: control.budget, tieBreak: config.tieBreak};
    if (control.optimization !== 'default') options.optimization = control.optimization;
    const output = resolveRouteUpdate(entry.map, config.priorPath, options);
    assert.equal(output.decisionReason, control.expectedDecisionByAI);
    assert.equal(output.optimization, control.optimization === 'default' ? config.defaultOptimization : control.optimization);
    assert.ok(verifyPath(entry.map, output.path));
    if (output.optimizationStatus === 'OPTIMAL') assert.equal(output.pathLength, entry.shortestDistance);
    if (output.optimizationStatus === 'BUDGET_EXCEEDED') {
      assert.equal(output.status, 'KEEP_ROUTE'); assert.deepEqual(output.path, config.priorPath);
      assert.equal(output.planningResult.reason, 'BUDGET_EXCEEDED');
      assert.equal(output.planningResult.pathLength, null); assert.deepEqual(output.planningResult.path, []);
    }
    return {...control, rows: entry.definition.rows, independentShortestDistance: entry.shortestDistance, output};
  });
  const output = {schemaVersion: 1, label: 'AI KNOWN-CONTROL REOPTIMIZATION COMPARISON; NOT PHYSICAL DATA', configuration: config,
    cases, execution: {operator: 'AI assistant CLI', executedAtUTC: new Date().toISOString(), sourceCommit: git(['rev-parse', 'HEAD']),
      sourceInputsDirty: false, sourceHashesGitBlobs: hashes, workspaceStatus: git(['status', '--porcelain']),
      node: process.version, platform: `${process.platform}/${process.arch}`, policyEvaluations: cases.length,
      newPlannerCalls: cases.reduce((n, c) => n + c.output.plannerCalls, 0),
      newExaminedNodes: cases.reduce((n, c) => n + c.output.expanded, 0), independentBfsCalls: maps.size,
      provenance: config.attribution}};
  await mkdir(dirname(resolve(root, outputFile)), {recursive: true});
  await writeFile(resolve(root, outputFile), JSON.stringify(output, null, 2) + '\n', {flag: 'wx'});
  console.table(cases.map(c => ({id: c.id, decision: c.output.decisionReason, moves: c.output.pathLength,
    planning: c.output.optimizationStatus, examined: c.output.expanded})));
  console.log(`Saved ${outputFile}; source ${output.execution.sourceCommit}`);
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
