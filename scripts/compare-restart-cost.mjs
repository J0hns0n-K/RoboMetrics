// AI-authored configured comparison; all policy attempts are retained separately.
import assert from 'node:assert/strict';
import {readFile, writeFile, mkdir, access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {resolve, relative, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseScenario} from './run-scenario.mjs';
import {plan, verifyPath} from '../src/core.mjs';
import {planAStarWithOneRetry} from '../src/retry-policy.mjs';

async function main() {
  const [configPath, outputPath] = process.argv.slice(2);
  if (!configPath || !outputPath?.endsWith('.json')) throw new Error('Usage: node scripts/compare-restart-cost.mjs CONFIG.json NEW-OUTPUT.json');
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
  if (config.status !== 'ready' || config.algorithm !== 'astar') throw new Error('Use a ready A* comparison configuration.');
  const {directBudget, restartInitialBudget, restartFinalBudget, maxTotalExpansionsPerPolicy, tieBreak} = config;
  assert.ok([directBudget, restartInitialBudget, restartFinalBudget, maxTotalExpansionsPerPolicy].every(v => Number.isSafeInteger(v) && v > 0));
  assert.equal(directBudget, restartFinalBudget);
  assert.ok(restartInitialBudget < restartFinalBudget);
  assert.ok(restartInitialBudget + restartFinalBudget <= maxTotalExpansionsPerPolicy);
  const mapFile = projectPath(resolve(root, config.mapScenario));
  const git = args => execFileSync('git', args, {cwd: root, encoding: 'utf8'}).trim();
  const sourceFiles = ['src/core.mjs', 'src/retry-policy.mjs', 'scripts/run-scenario.mjs',
    'scripts/compare-restart-cost.mjs', configFile, mapFile];
  if (git(['status', '--porcelain', '--', ...sourceFiles])) throw new Error('Commit inputs and sources first.');
  const sha = bytes => createHash('sha256').update(bytes).digest('hex'), hashes = {};
  for (const path of sourceFiles) {
    const blob = execFileSync('git', ['show', 'HEAD:' + path], {cwd: root});
    assert.equal(sha(Buffer.from((await readFile(resolve(root, path), 'utf8')).replace(/\r\n/g, '\n'))), sha(blob));
    hashes[path] = sha(blob);
  }
  const scenario = JSON.parse(await readFile(resolve(root, mapFile), 'utf8'));
  const map = parseScenario(scenario);
  const directResult = plan(map, 'astar', directBudget, {tieBreak});
  if (directResult.success) assert.ok(verifyPath(map, directResult.path));
  const restart = planAStarWithOneRetry(map, {initialBudget: restartInitialBudget,
    retryBudget: restartFinalBudget, maxTotalExpansions: maxTotalExpansionsPerPolicy, tieBreak});
  const direct = {budget: directBudget, result: directResult, totalExpanded: directResult.expanded};
  const output = {
    schemaVersion: 1, label: 'AI-OPERATED DIRECT VERSUS RESTART ACCOUNTING; KNOWN FIXED MAP',
    configuration: config, map: {source: mapFile, rows: scenario.rows}, direct, restart,
    comparison: {
      bothSuccess: directResult.success && restart.finalResult.success,
      sameReturnedLength: directResult.success && restart.finalResult.success
        ? directResult.pathLength === restart.finalResult.pathLength : null,
      extraExpandedForRestart: restart.totalExpanded - direct.totalExpanded,
      directUsesLessWork: direct.totalExpanded < restart.totalExpanded,
      comparisonStudyTotalExpanded: direct.totalExpanded + restart.totalExpanded
    },
    execution: {operator: 'AI assistant CLI', executedAtUTC: new Date().toISOString(),
      sourceCommit: git(['rev-parse', 'HEAD']), sourceInputsDirty: false, sourceHashesGitBlobs: hashes,
      workspaceStatus: git(['status', '--porcelain']), node: process.version, platform: `${process.platform}/${process.arch}`,
      provenance: 'Student supplied a tentative direction after seeing prior evidence. AI supplied configuration/method and execution. Costs are per policy; study total is not one policy budget. No new independent map sample.'}
  };
  await mkdir(dirname(resolve(root, outputFile)), {recursive: true});
  await writeFile(resolve(root, outputFile), JSON.stringify(output, null, 2) + '\n', {flag: 'wx'});
  console.table([{policy: 'direct', attempts: 1, success: directResult.success,
    moves: directResult.pathLength, examined: direct.totalExpanded},
  {policy: 'restart', attempts: restart.attempts.length, success: restart.finalResult.success,
    moves: restart.finalResult.pathLength, examined: restart.totalExpanded}]);
  console.log(`Saved ${outputFile}; source ${output.execution.sourceCommit}`);
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
