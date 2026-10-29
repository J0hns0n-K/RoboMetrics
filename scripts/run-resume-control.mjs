// AI-operated known-case control; archived direct/restart arms are reused, never overwritten.
import assert from 'node:assert/strict';
import {readFile, writeFile, mkdir, access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {resolve, relative, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseScenario} from './run-scenario.mjs';
import {verifyPath} from '../src/core.mjs';
import {createAStarSession} from '../src/resumable-astar.mjs';

async function main() {
  const [configPath, outputPath] = process.argv.slice(2);
  if (!configPath || !outputPath?.endsWith('.json')) throw new Error('Usage: node scripts/run-resume-control.mjs CONFIG.json NEW-OUTPUT.json');
  const root = fileURLToPath(new URL('../', import.meta.url));
  const projectPath = path => {
    const p = relative(root, resolve(path)).replaceAll('\\', '/');
    if (p === '..' || p.startsWith('../') || p.includes(':')) throw new Error('Use project paths.');
    return p;
  };
  const configFile = projectPath(configPath), outputFile = projectPath(outputPath);
  try { await access(resolve(root, outputFile)); throw new Error('Output already exists; choose a new name.'); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  const config = JSON.parse(await readFile(resolve(root, configFile), 'utf8'));
  assert.equal(config.status, 'ready');
  assert.equal(config.algorithm, 'astar');
  const budgets = config.cumulativeBudgets;
  assert.ok(Array.isArray(budgets) && budgets.length > 1);
  assert.ok(budgets.every((b, i) => Number.isSafeInteger(b) && b > 0 && (!i || b > budgets[i - 1])));
  const mapFile = projectPath(resolve(root, config.mapScenario));
  const priorFile = projectPath(resolve(root, config.priorComparison));
  const sourceFiles = ['src/core.mjs', 'src/resumable-astar.mjs', 'scripts/run-scenario.mjs',
    'scripts/run-resume-control.mjs', 'test/resumable-astar.test.mjs', configFile, mapFile, priorFile];
  const git = args => execFileSync('git', args, {cwd: root, encoding: 'utf8'}).trim();
  if (git(['status', '--porcelain', '--', ...sourceFiles])) throw new Error('Commit source and inputs first.');
  const sha = bytes => createHash('sha256').update(bytes).digest('hex'), hashes = {};
  for (const path of sourceFiles) {
    const blob = execFileSync('git', ['show', 'HEAD:' + path], {cwd: root});
    assert.equal(sha(Buffer.from((await readFile(resolve(root, path), 'utf8')).replace(/\r\n/g, '\n'))), sha(blob));
    hashes[path] = sha(blob);
  }
  const prior = JSON.parse(await readFile(resolve(root, priorFile), 'utf8'));
  const scenario = JSON.parse(await readFile(resolve(root, mapFile), 'utf8'));
  assert.equal(prior.map.source, mapFile);
  assert.deepEqual(prior.map.rows, scenario.rows);
  assert.equal(prior.configuration.tieBreak, config.tieBreak);
  assert.equal(prior.execution.sourceHashesGitBlobs['src/core.mjs'], hashes['src/core.mjs']);
  assert.equal(prior.direct.budget, budgets.at(-1));
  assert.equal(prior.restart.policy.initialBudget, budgets[0]);
  assert.equal(prior.restart.policy.retryBudget, budgets.at(-1));
  const map = parseScenario(scenario), session = createAStarSession(map, {tieBreak: config.tieBreak});
  const calls = budgets.map(budget => session.advanceTo(budget));
  const totalExpanded = calls.reduce((sum, call) => sum + call.expandedThisCall, 0);
  const final = calls.at(-1);
  assert.deepEqual(calls[0].result, prior.restart.attempts[0].result);
  assert.deepEqual(final.result, prior.direct.result);
  assert.deepEqual(final.result, prior.restart.finalResult);
  assert.ok(verifyPath(map, final.result.path));
  assert.equal(totalExpanded, final.cumulativeExpanded);
  assert.equal(totalExpanded, prior.direct.totalExpanded);
  assert.ok(totalExpanded <= budgets.at(-1));
  const output = {
    schemaVersion: 1, label: 'AI REFERENCE RESUME CONTROL; ONE PREVIOUSLY STUDIED STATIC MAP',
    configuration: config, map: {source: mapFile, rows: scenario.rows},
    resume: {calls, totalExpanded, finalResult: final.result},
    archivedComparison: {source: priorFile, sha256GitBlob: hashes[priorFile],
      sourceCommit: prior.execution.sourceCommit, directExpanded: prior.direct.totalExpanded,
      restartExpanded: prior.restart.totalExpanded},
    checks: {sameMapAndCoreSource: true, firstPauseMatchesArchivedFailure: true,
      finalResultAndPathMatchBothArchivedArms: true, successfulPathValid: true,
      summedCallDeltasEqualCumulativeWork: true, resumeWorkEqualsDirectWork: true,
      fewerExpansionsThanArchivedRestart: totalExpanded < prior.restart.totalExpanded},
    execution: {operator: 'AI assistant CLI', executedAtUTC: new Date().toISOString(),
      sourceCommit: git(['rev-parse', 'HEAD']), sourceInputsDirty: false, sourceHashesGitBlobs: hashes,
      workspaceStatus: git(['status', '--porcelain']), node: process.version, platform: `${process.platform}/${process.arch}`,
      newSearchSessions: 1, advanceCalls: calls.length, archivedArmsRerun: false,
      provenance: 'AI supplied the state-reuse idea and all implementation/operation. Student response supplied no design or forecast. Node counts exclude sorting, memory and serialization costs.'}
  };
  await mkdir(dirname(resolve(root, outputFile)), {recursive: true});
  await writeFile(resolve(root, outputFile), JSON.stringify(output, null, 2) + '\n', {flag: 'wx'});
  console.table(calls.map(call => ({target: call.cumulativeBudget, state: call.state,
    additionalExamined: call.expandedThisCall, cumulativeExamined: call.cumulativeExpanded})));
  console.log(`Saved ${outputFile}; source ${output.execution.sourceCommit}`);
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
