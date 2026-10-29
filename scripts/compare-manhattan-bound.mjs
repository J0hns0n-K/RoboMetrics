// AI-operated same-cohort replay; both new arms are charged, old artifacts remain immutable.
import assert from 'node:assert/strict';
import {readFile, writeFile, mkdir, access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {resolve, relative, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {makeMap, verifyPath} from '../src/core.mjs';
import {resolveRouteUpdate} from '../src/route-update-policy.mjs';

async function main() {
  const [inputPath, outputPath] = process.argv.slice(2);
  if (!inputPath || !outputPath?.endsWith('.json')) throw new Error('Usage: node scripts/compare-manhattan-bound.mjs PROTOCOL.json NEW-OUTPUT.json');
  const root = fileURLToPath(new URL('../', import.meta.url));
  const local = path => {
    const p = relative(root, resolve(path)).replaceAll('\\', '/');
    if (p === '..' || p.startsWith('../') || p.includes(':')) throw new Error('Use project paths.');
    return p;
  };
  const protocolFile = local(inputPath), outputFile = local(outputPath);
  try { await access(resolve(root, outputFile)); throw new Error('Output already exists; choose a new name.'); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  const protocol = JSON.parse(await readFile(resolve(root, protocolFile), 'utf8'));
  assert.equal(protocol.status, 'ready'); assert.equal(protocol.tieBreak, 'fifo');
  assert.ok(Number.isSafeInteger(protocol.maxExpansions) && protocol.maxExpansions > 0);
  const baselineFile = local(resolve(root, protocol.baselineRaw)), choiceFile = local(resolve(root, protocol.studentChoiceRecord));
  const sources = ['src/core.mjs', 'src/route-update-policy.mjs', 'scripts/compare-manhattan-bound.mjs',
    'test/manhattan-bound-skip.test.mjs', protocolFile, baselineFile, choiceFile];
  const git = args => execFileSync('git', args, {cwd: root, encoding: 'utf8'}).trim();
  if (git(['status', '--porcelain', '--', ...sources])) throw new Error('Commit inputs and source first.');
  const sha = b => createHash('sha256').update(b).digest('hex'), hashes = {};
  for (const file of sources) {
    const blob = execFileSync('git', ['show', 'HEAD:' + file], {cwd: root});
    assert.equal(sha(Buffer.from((await readFile(resolve(root, file), 'utf8')).replace(/\r\n/g, '\n'))), sha(blob));
    hashes[file] = sha(blob);
  }
  const archived = JSON.parse(await readFile(resolve(root, baselineFile), 'utf8'));
  assert.equal(archived.rows.length, protocol.runs);
  assert.equal(archived.protocol.maxExpansions, protocol.maxExpansions);
  assert.equal(archived.protocol.tieBreak, protocol.tieBreak);
  assert.equal(archived.execution.sourceHashesGitBlobs['src/core.mjs'], hashes['src/core.mjs']);
  const rows = archived.rows.map(row => {
    const width = row.editedRows[0].length, height = row.editedRows.length, blocked = [];
    row.editedRows.forEach((line, y) => {
      assert.ok(line.length === width && /^[.#]+$/.test(line));
      [...line].forEach((cell, x) => { if (cell === '#') blocked.push([x, y]); });
    });
    const map = makeMap(width, height, blocked, row.start, row.goal), prior = row.priorAcquisition.result.path;
    assert.ok(verifyPath(map, prior));
    const options = {maxExpansions: protocol.maxExpansions, tieBreak: protocol.tieBreak, optimization: 'reoptimize'};
    const baseline = resolveRouteUpdate(map, prior, {...options, skipProvenOptimal: false});
    const revised = resolveRouteUpdate(map, prior, options);
    assert.equal(revised.skipProvenOptimal, true);
    for (const key of Object.keys(row.results.reoptimize)) assert.deepEqual(baseline[key], row.results.reoptimize[key]);
    for (const result of [baseline, revised]) {
      assert.ok(verifyPath(map, result.path)); assert.equal(result.pathLength, row.editedBfsDistance);
    }
    assert.deepEqual(revised.path, baseline.path);
    if (revised.decisionReason === 'LOWER_BOUND_OPTIMAL') {
      assert.equal(revised.pathLength, revised.lowerBound); assert.equal(revised.plannerCalls, 0);
      assert.equal(revised.expanded, 0); assert.equal(revised.planningResult, null);
      assert.equal(revised.optimalityEvidence, 'MANHATTAN_BOUND');
    } else {
      assert.equal(revised.plannerCalls, 1); assert.equal(revised.optimalityEvidence, 'ASTAR_COMPLETED');
      assert.equal(revised.expanded, baseline.expanded);
    }
    return {trial: row.trial, seed: row.seed, editedRows: row.editedRows, start: row.start, goal: row.goal,
      priorPath: prior, archivedBfsDistance: row.editedBfsDistance, baselineOriginalFieldsMatched: true, baseline, revised};
  });
  const summarize = key => ({denominator: rows.length, usableRoutes: rows.filter(r => r[key].path.length > 0).length,
    meanReturnedMoves: rows.reduce((s, r) => s + r[key].pathLength, 0) / rows.length,
    plannerCalls: rows.reduce((s, r) => s + r[key].plannerCalls, 0),
    totalExamined: rows.reduce((s, r) => s + r[key].expanded, 0),
    meanExamined: rows.reduce((s, r) => s + r[key].expanded, 0) / rows.length,
    boundProofs: rows.filter(r => r[key].optimalityEvidence === 'MANHATTAN_BOUND').length,
    completedSearches: rows.filter(r => r[key].planningResult?.success).length,
    optimizationBudgetExceeded: rows.filter(r => r[key].optimizationStatus === 'BUDGET_EXCEEDED').length});
  const baseline = summarize('baseline'), revised = summarize('revised');
  const output = {schemaVersion: 1, label: 'AI PAIRED BOUND-CHECK COMPARISON; COHORT SCOPE IS DEFINED BY THE FROZEN PROTOCOL', protocol,
    archivedSource: {path: baselineFile, sha256GitBlob: hashes[baselineFile], sourceCommit: archived.execution.sourceCommit},
    summary: {baseline, revised, sameReturnedLengthMaps: rows.length, sameReturnedPathMaps: rows.length,
      savedExpansions: baseline.totalExamined - revised.totalExamined,
      expansionReductionFraction: baseline.totalExamined ? (baseline.totalExamined - revised.totalExamined) / baseline.totalExamined : null}, rows,
    execution: {operator: 'AI assistant CLI', executedAtUTC: new Date().toISOString(), sourceCommit: git(['rev-parse', 'HEAD']),
      sourceInputsDirty: false, sourceHashesGitBlobs: hashes, workspaceStatus: git(['status', '--porcelain']),
      node: process.version, platform: `${process.platform}/${process.arch}`, policyEvaluations: rows.length * 2,
      newPlannerCalls: baseline.plannerCalls + revised.plannerCalls, newExaminedNodes: baseline.totalExamined + revised.totalExamined,
      newPriorAcquisitionCalls: 0, newIndependentBfsCalls: 0, provenance: protocol.attribution}};
  await mkdir(dirname(resolve(root, outputFile)), {recursive: true});
  await writeFile(resolve(root, outputFile), JSON.stringify(output, null, 2) + '\n', {flag: 'wx'});
  console.log(JSON.stringify(output.summary, null, 2));
  console.log(`Saved ${outputFile}; source ${output.execution.sourceCommit}`);
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
