// AI-authored paired study: offline prior-route acquisition is separate from policy work.
import assert from 'node:assert/strict';
import {readFile, writeFile, mkdir, access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {resolve, relative, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {makeMap, randomMap, plan, verifyPath} from '../src/core.mjs';
import {resolveRouteUpdate} from '../src/route-update-policy.mjs';
import {bfsDistance} from './check-current-position-detour.mjs';

export function textRows(map) {
  return Array.from({length: map.height}, (_, y) => Array.from({length: map.width}, (_, x) =>
    map.cells[y * map.width + x] ? '#' : '.').join(''));
}

export function classifyCandidate(map, seed) {
  const wallCount = [...map.cells].filter(Boolean).length;
  const distance = bfsDistance(textRows(map), map.start, map.goal);
  const rejectionReason = distance === null ? 'UNREACHABLE' : wallCount === 0 ? 'NO_WALL' : null;
  return {seed, wallCount, originalBfsDistance: distance, accepted: rejectionReason === null, rejectionReason};
}

export function removeSeededWall(map, seed) {
  assert.ok(Number.isSafeInteger(seed) && seed >= 0);
  const walls = [];
  for (let k = 0; k < map.cells.length; k++) if (map.cells[k]) walls.push([k % map.width, Math.floor(k / map.width)]);
  assert.ok(walls.length > 0);
  const selectedIndex = seed % walls.length, removedWall = walls[selectedIndex];
  const edited = makeMap(map.width, map.height, walls.filter((_, i) => i !== selectedIndex), map.start, map.goal);
  assert.equal([...map.cells].filter((v, k) => v !== edited.cells[k]).length, 1);
  return {edited, removedWall, selectedIndex, originalWallCount: walls.length};
}

export function evaluateRemoval(map, candidate, budget, tieBreak = 'fifo') {
  assert.equal(candidate.accepted, true);
  const prior = plan(map, 'astar', Infinity, {tieBreak});
  assert.equal(prior.success, true); assert.ok(verifyPath(map, prior.path));
  assert.equal(prior.pathLength, candidate.originalBfsDistance);
  const {edited, ...edit} = removeSeededWall(map, candidate.seed);
  assert.ok(verifyPath(edited, prior.path));
  const editedDistance = bfsDistance(textRows(edited), edited.start, edited.goal);
  assert.notEqual(editedDistance, null); assert.ok(editedDistance <= prior.pathLength);
  const results = {};
  for (const optimization of ['keep-valid', 'reoptimize']) {
    // Preserve the frozen original study: it predates the later lower-bound skip rule.
    const output = resolveRouteUpdate(edited, prior.path, {maxExpansions: budget, tieBreak, optimization, skipProvenOptimal: false});
    assert.ok(verifyPath(edited, output.path)); assert.equal(output.priorRemainingPathValid, true);
    assert.ok(output.pathLength <= prior.pathLength && output.pathLength >= editedDistance);
    if (optimization === 'keep-valid') { assert.equal(output.plannerCalls, 0); assert.deepEqual(output.path, prior.path); }
    else {
      assert.equal(output.plannerCalls, 1);
      if (output.optimizationStatus === 'OPTIMAL') assert.equal(output.pathLength, editedDistance);
      else {
        assert.equal(output.optimizationStatus, 'BUDGET_EXCEEDED'); assert.deepEqual(output.path, prior.path);
        assert.equal(output.planningResult.reason, 'BUDGET_EXCEEDED');
        assert.equal(output.planningResult.pathLength, null); assert.deepEqual(output.planningResult.path, []);
      }
    }
    results[optimization] = output;
  }
  return {seed: candidate.seed, originalRows: textRows(map), editedRows: textRows(edited),
    start: map.start, goal: map.goal, edit, priorAcquisition: {algorithm: 'astar', tieBreak, budget: 'unlimited offline reference', result: prior},
    originalBfsDistance: candidate.originalBfsDistance, editedBfsDistance: editedDistance,
    theoreticalSavedMoves: prior.pathLength - editedDistance,
    realizedSavedMoves: prior.pathLength - results.reoptimize.pathLength, results};
}

export function summarizeRemovalRows(rows) {
  assert.ok(rows.length > 0);
  const sum = values => values.reduce((a, b) => a + b, 0), n = rows.length;
  const policies = {};
  for (const policy of ['keep-valid', 'reoptimize']) {
    const values = rows.map(r => r.results[policy]);
    policies[policy] = {denominator: n, usableRoutes: values.filter(r => r.path.length > 0).length,
      meanReturnedMoves: sum(values.map(r => r.pathLength)) / n,
      totalNewPlannerCalls: sum(values.map(r => r.plannerCalls)), totalNewExamined: sum(values.map(r => r.expanded)),
      meanNewExamined: sum(values.map(r => r.expanded)) / n,
      optimalityConfirmed: values.filter(r => r.optimizationStatus === 'OPTIMAL').length,
      optimizationBudgetExceeded: values.filter(r => r.optimizationStatus === 'BUDGET_EXCEEDED').length,
      returnedLengthEqualsBfs: rows.filter(r => r.results[policy].pathLength === r.editedBfsDistance).length};
  }
  return {denominator: n, theoreticallyShorterMaps: rows.filter(r => r.theoreticalSavedMoves > 0).length,
    actuallyShorterMaps: rows.filter(r => r.realizedSavedMoves > 0).length,
    unchangedReturnedLengthMaps: rows.filter(r => r.realizedSavedMoves === 0).length,
    missedPotentialImprovementMaps: rows.filter(r => r.theoreticalSavedMoves > 0 && r.realizedSavedMoves === 0).length,
    totalPotentialSavedMoves: sum(rows.map(r => r.theoreticalSavedMoves)), totalRealizedSavedMoves: sum(rows.map(r => r.realizedSavedMoves)),
    policies};
}

async function main() {
  const [inputPath, outputPath] = process.argv.slice(2);
  if (!inputPath || !outputPath?.endsWith('.json')) throw new Error('Usage: node scripts/run-route-reoptimization-batch.mjs PROTOCOL.json NEW-OUTPUT.json');
  const root = fileURLToPath(new URL('../', import.meta.url));
  const local = path => {
    const p = relative(root, resolve(path)).replaceAll('\\', '/');
    if (p === '..' || p.startsWith('../') || p.includes(':')) throw new Error('Use project paths.');
    return p;
  };
  const protocolFile = local(inputPath), outputFile = local(outputPath);
  try { await access(resolve(root, outputFile)); throw new Error('Output already exists; choose a new name.'); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  const config = JSON.parse(await readFile(resolve(root, protocolFile), 'utf8'));
  assert.equal(config.status, 'ready'); assert.equal(config.tieBreak, 'fifo');
  assert.deepEqual(config.policies, ['keep-valid', 'reoptimize']);
  assert.ok(Number.isSafeInteger(config.runs) && config.runs > 0 && config.runs <= 250);
  assert.ok(Number.isSafeInteger(config.maxCandidateChecks) && config.maxCandidateChecks >= config.runs && config.maxCandidateChecks <= 10000);
  assert.ok(Number.isSafeInteger(config.baseSeed) && config.baseSeed >= 0 && Number.isSafeInteger(config.baseSeed + config.maxCandidateChecks));
  assert.ok(Number.isSafeInteger(config.maxExpansions) && config.maxExpansions > 0);
  const sources = ['src/core.mjs', 'src/route-update-policy.mjs', 'scripts/check-current-position-detour.mjs',
    'scripts/run-route-reoptimization-batch.mjs', 'test/route-reoptimization-batch.test.mjs', protocolFile];
  const git = args => execFileSync('git', args, {cwd: root, encoding: 'utf8'}).trim();
  if (git(['status', '--porcelain', '--', ...sources])) throw new Error('Commit protocol and source first.');
  const sha = b => createHash('sha256').update(b).digest('hex'), hashes = {};
  for (const file of sources) {
    const blob = execFileSync('git', ['show', 'HEAD:' + file], {cwd: root});
    assert.equal(sha(Buffer.from((await readFile(resolve(root, file), 'utf8')).replace(/\r\n/g, '\n'))), sha(blob));
    hashes[file] = sha(blob);
  }
  const candidates = [], rows = [];
  for (let offset = 1; rows.length < config.runs && offset <= config.maxCandidateChecks; offset++) {
    const seed = config.baseSeed + offset, map = randomMap(seed, config.width, config.height, config.density);
    const candidate = classifyCandidate(map, seed); candidates.push(candidate);
    if (candidate.accepted) rows.push({trial: rows.length + 1, ...evaluateRemoval(map, candidate, config.maxExpansions, config.tieBreak)});
  }
  if (rows.length !== config.runs) throw new Error('Cohort incomplete; no output published.');
  const summary = summarizeRemovalRows(rows);
  const output = {schemaVersion: 1, label: 'AI-OPERATED MATCHED SINGLE-WALL REMOVALS; SYNTHETIC DATA', protocol: config,
    sampling: {checked: candidates.length, accepted: rows.length, rejected: candidates.filter(c => !c.accepted).length, candidates},
    summary, rows,
    accounting: {offlinePriorPlannerCalls: rows.length, offlinePriorExamined: rows.reduce((n, r) => n + r.priorAcquisition.result.expanded, 0),
      onlinePolicyEvaluations: rows.length * 2, onlinePlannerCalls: Object.values(summary.policies).reduce((n, p) => n + p.totalNewPlannerCalls, 0),
      onlineExamined: Object.values(summary.policies).reduce((n, p) => n + p.totalNewExamined, 0),
      candidateBfsCalls: candidates.length, editedMapBfsCalls: rows.length},
    execution: {operator: 'AI assistant CLI', executedAtUTC: new Date().toISOString(), sourceCommit: git(['rev-parse', 'HEAD']),
      sourceInputsDirty: false, sourceHashesGitBlobs: hashes, workspaceStatus: git(['status', '--porcelain']),
      node: process.version, platform: `${process.platform}/${process.arch}`, provenance: config.attribution}};
  await mkdir(dirname(resolve(root, outputFile)), {recursive: true});
  await writeFile(resolve(root, outputFile), JSON.stringify(output, null, 2) + '\n', {flag: 'wx'});
  console.log(JSON.stringify({sampling: {checked: candidates.length, accepted: rows.length}, summary, accounting: output.accounting}, null, 2));
  console.log(`Saved ${outputFile}; source ${output.execution.sourceCommit}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
