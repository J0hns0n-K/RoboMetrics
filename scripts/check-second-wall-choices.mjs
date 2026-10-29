// AI-authored orchestration of existing planners/checks; one additional wall per case.
import assert from 'node:assert/strict';
import {readFile, writeFile, mkdir, access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {resolve, relative, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {plan, verifyPath} from '../src/core.mjs';
import {parseScenario} from './run-scenario.mjs';
import {bfsDistance} from './check-current-position-detour.mjs';

async function main() {
  const [inputPath, outputPath] = process.argv.slice(2);
  if (!inputPath || !outputPath?.endsWith('.json')) throw new Error('Usage: node scripts/check-second-wall-choices.mjs CONFIG.json NEW-OUTPUT.json');
  const root = fileURLToPath(new URL('../', import.meta.url));
  const projectPath = path => {
    const p = relative(root, resolve(path)).replaceAll('\\', '/');
    if (p === '..' || p.startsWith('../') || p.includes(':')) throw new Error('Use project paths.');
    return p;
  };
  const inputFile = projectPath(inputPath), outputFile = projectPath(outputPath);
  try { await access(resolve(root, outputFile)); throw new Error('Output already exists; choose a new name.'); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  const config = JSON.parse(await readFile(resolve(root, inputFile), 'utf8'));
  assert.equal(config.status, 'ready'); assert.equal(config.algorithm, 'astar'); assert.equal(config.tieBreak, 'fifo');
  assert.ok(Number.isSafeInteger(config.budgetPerCase) && config.budgetPerCase > 0 && config.budgetPerCase <= 6400);
  assert.ok(Array.isArray(config.studentPredictedUnreachableChoices) && config.studentPredictedUnreachableChoices.length > 0);
  assert.ok(Array.isArray(config.aiControlChoices));
  const choices = [...config.studentPredictedUnreachableChoices, ...config.aiControlChoices];
  assert.equal(new Set(choices).size, choices.length);
  assert.ok(choices.every(n => Number.isInteger(n) && n >= 1 && n <= 5));
  const parentFile = projectPath(resolve(root, config.parentScenario)), parentRawFile = projectPath(resolve(root, config.parentResult));
  const sources = ['src/core.mjs', 'scripts/run-scenario.mjs', 'scripts/check-current-position-detour.mjs',
    'scripts/check-second-wall-choices.mjs', inputFile, parentFile, parentRawFile];
  const git = args => execFileSync('git', args, {cwd: root, encoding: 'utf8'}).trim();
  if (git(['status', '--porcelain', '--', ...sources])) throw new Error('Commit source and inputs before execution.');
  const sha = bytes => createHash('sha256').update(bytes).digest('hex'), hashes = {};
  for (const file of sources) {
    const blob = execFileSync('git', ['show', 'HEAD:' + file], {cwd: root});
    assert.equal(sha(Buffer.from((await readFile(resolve(root, file), 'utf8')).replace(/\r\n/g, '\n'))), sha(blob));
    hashes[file] = sha(blob);
  }
  const parent = JSON.parse(await readFile(resolve(root, parentFile), 'utf8'));
  const parentRaw = JSON.parse(await readFile(resolve(root, parentRawFile), 'utf8'));
  assert.deepEqual(parentRaw.scenario, parent);
  for (const file of ['src/core.mjs', 'scripts/run-scenario.mjs', 'scripts/check-current-position-detour.mjs']) {
    assert.equal(hashes[file], parentRaw.execution.sourceHashesGitBlobs[file]);
  }
  const parentMap = parseScenario(parent), priorPath = parentRaw.freshPlan.result.path;
  assert.equal(parentMap.width, 5); assert.equal(parentMap.height, 2);
  assert.deepEqual(parentMap.start, [2, 0]); assert.deepEqual(parentMap.goal, [4, 0]);
  assert.equal(parentRaw.freshPlan.result.success, true); assert.ok(verifyPath(parentMap, priorPath));
  const cases = choices.map(choice => {
    const coordinate = [choice - 1, 1], rows = [...parent.rows];
    assert.equal(rows[1][coordinate[0]], '.');
    rows[1] = rows[1].slice(0, coordinate[0]) + '#' + rows[1].slice(coordinate[0] + 1);
    const map = parseScenario({...parent, rows, budgets: [config.budgetPerCase]});
    assert.deepEqual(map.start, parentMap.start); assert.deepEqual(map.goal, parentMap.goal);
    assert.equal([...map.cells].filter((v, k) => v !== parentMap.cells[k]).length, 1);
    const result = plan(map, config.algorithm, config.budgetPerCase, {tieBreak: config.tieBreak});
    const distance = bfsDistance(rows, map.start, map.goal);
    if (result.success) { assert.ok(verifyPath(map, result.path)); assert.equal(result.pathLength, distance); }
    else if (result.reason === 'UNREACHABLE') assert.equal(distance, null);
    const studentPredicted = config.studentPredictedUnreachableChoices.includes(choice);
    return {choice, addedWall: coordinate, rows, role: studentPredicted ? 'student-selected prediction case' : 'AI-added control; no student prediction',
      parentRouteStillValid: verifyPath(map, priorPath), result,
      independentBfsDistance: distance, studentPrediction: studentPredicted ? 'UNREACHABLE' : null,
      studentPredictionMatched: studentPredicted ? result.reason === 'UNREACHABLE' && distance === null : null};
  });
  const output = {
    schemaVersion: 1, label: 'SINGLE-WALL VARIANTS OF ONE SYNTHETIC MAP; NOT PHYSICAL DATA',
    configuration: config, parent: {scenario: parentFile, raw: parentRawFile, rawSha256GitBlob: hashes[parentRawFile],
      reusedPath: priorPath, rerun: false}, cases,
    execution: {operator: 'AI assistant CLI', executedAtUTC: new Date().toISOString(), sourceCommit: git(['rev-parse', 'HEAD']),
      sourceInputsDirty: false, sourceHashesGitBlobs: hashes, workspaceStatus: git(['status', '--porcelain']),
      node: process.version, platform: `${process.platform}/${process.arch}`, sharedPlannerCalls: cases.length,
      independentBfsCalls: cases.length, provenance: config.attribution}
  };
  await mkdir(dirname(resolve(root, outputFile)), {recursive: true});
  await writeFile(resolve(root, outputFile), JSON.stringify(output, null, 2) + '\n', {flag: 'wx'});
  console.table(cases.map(c => ({choice: c.choice, role: c.role, success: c.result.success,
    reason: c.result.reason, moves: c.result.pathLength, examined: c.result.expanded, parentRouteValid: c.parentRouteStillValid})));
  console.log(`Saved ${outputFile}; source ${output.execution.sourceCommit}`);
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
