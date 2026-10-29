// AI-operated integration controls reusing archived maps/results, not a new research cohort.
import assert from 'node:assert/strict';
import {readFile, writeFile, mkdir, access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {resolve, relative, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseScenario} from './run-scenario.mjs';
import {verifyPath} from '../src/core.mjs';
import {resolveRouteUpdate} from '../src/route-update-policy.mjs';

async function main() {
  const [inputPath, outputPath] = process.argv.slice(2);
  if (!inputPath || !outputPath?.endsWith('.json')) throw new Error('Usage: node scripts/check-route-update-policy.mjs CONFIG.json NEW-OUTPUT.json');
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
  assert.equal(config.status, 'ready'); assert.equal(config.tieBreak, 'fifo');
  assert.ok([config.budget, config.smallBudget].every(b => Number.isSafeInteger(b) && b > 0));
  assert.ok(config.smallBudget < config.budget);
  const baseFile = local(resolve(root, config.baselineRaw)), wallsFile = local(resolve(root, config.wallChoicesRaw));
  const sources = ['src/core.mjs', 'src/route-update-policy.mjs', 'scripts/run-scenario.mjs',
    'scripts/check-route-update-policy.mjs', 'test/route-update-policy.test.mjs', configFile, baseFile, wallsFile];
  const git = args => execFileSync('git', args, {cwd: root, encoding: 'utf8'}).trim();
  if (git(['status', '--porcelain', '--', ...sources])) throw new Error('Commit inputs and source first.');
  const sha = b => createHash('sha256').update(b).digest('hex'), hashes = {};
  for (const file of sources) {
    const blob = execFileSync('git', ['show', 'HEAD:' + file], {cwd: root});
    assert.equal(sha(Buffer.from((await readFile(resolve(root, file), 'utf8')).replace(/\r\n/g, '\n'))), sha(blob));
    hashes[file] = sha(blob);
  }
  const base = JSON.parse(await readFile(resolve(root, baseFile), 'utf8'));
  const walls = JSON.parse(await readFile(resolve(root, wallsFile), 'utf8'));
  for (const archive of [base, walls]) assert.equal(archive.execution.sourceHashesGitBlobs['src/core.mjs'], hashes['src/core.mjs']);
  assert.equal(base.freshPlan.budget, config.budget); assert.equal(walls.configuration.budgetPerCase, config.budget);
  const cases = [];
  const evaluate = (id, rows, priorPath, currentPathIndex, budget, expected, archivedResult = null) => {
    const map = parseScenario({...base.scenario, rows, budgets: [budget]});
    const output = resolveRouteUpdate(map, priorPath, {currentPathIndex, maxExpansions: budget, tieBreak: config.tieBreak});
    assert.equal(output.status, expected);
    if (output.path.length) assert.ok(verifyPath(map, output.path));
    if (archivedResult && output.planningResult) assert.deepEqual(output.planningResult, archivedResult);
    if (output.status === 'KEEP_ROUTE') {
      assert.equal(output.planningResult, null); assert.equal(output.expanded, 0); assert.equal(output.plannerCalls, 0);
      assert.deepEqual(output.path, priorPath.slice(currentPathIndex));
    }
    cases.push({id, rows, priorPath, currentPathIndex, budget, expectedByAI: expected, output,
      archivedPlanningResultMatched: archivedResult && output.planningResult ? true : null});
  };
  evaluate('blocked-route-detour', base.scenario.rows, base.scenario.oldPlannedRoute, base.scenario.currentPathIndex,
    config.budget, 'NEW_ROUTE_FOUND', base.freshPlan.result);
  for (const c of walls.cases) evaluate(`wall-${c.choice}`, c.rows, base.freshPlan.result.path, 0, config.budget,
    c.result.success ? 'KEEP_ROUTE' : c.result.reason, c.result);
  evaluate('blocked-route-small-budget', base.scenario.rows, base.scenario.oldPlannedRoute, base.scenario.currentPathIndex,
    config.smallBudget, 'BUDGET_EXCEEDED');
  const output = {schemaVersion: 1, label: 'AI REFERENCE POLICY INTEGRATION; KNOWN ARCHIVED FIXTURES', configuration: config,
    cases, execution: {operator: 'AI assistant CLI', executedAtUTC: new Date().toISOString(), sourceCommit: git(['rev-parse', 'HEAD']),
      sourceInputsDirty: false, sourceHashesGitBlobs: hashes, workspaceStatus: git(['status', '--porcelain']),
      node: process.version, platform: `${process.platform}/${process.arch}`, policyEvaluations: cases.length,
      newPlannerCalls: cases.reduce((n, c) => n + c.output.plannerCalls, 0),
      newExaminedNodes: cases.reduce((n, c) => n + c.output.expanded, 0), independentBfsCalls: 0,
      provenance: 'Archive results serve as known controls; planner calls made by the new wrapper are reruns and are charged above. No new independent maps, student predictions or student operation.'}};
  await mkdir(dirname(resolve(root, outputFile)), {recursive: true});
  await writeFile(resolve(root, outputFile), JSON.stringify(output, null, 2) + '\n', {flag: 'wx'});
  console.table(cases.map(c => ({id: c.id, status: c.output.status, moves: c.output.pathLength,
    newPlannerCalls: c.output.plannerCalls, newExamined: c.output.expanded})));
  console.log(`Saved ${outputFile}; source ${output.execution.sourceCommit}`);
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
