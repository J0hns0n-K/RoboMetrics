// AI bounded continuation control: retain, resume and restart on identical known snapshots.
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
  if (!inputPath || !outputPath?.endsWith('.json')) throw new Error('Usage: node scripts/compare-route-continuation.mjs PROTOCOL.json NEW-OUTPUT.json');
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
  assert.deepEqual(p.arms, ['retain', 'resume', 'restart']); assert.equal(p.maximumContinuations, 1);
  assert.ok([p.initialBudget, p.additionalExpansions, p.commonComparisonWorkCeilingPerCase].every(n => Number.isSafeInteger(n) && n > 0));
  assert.equal(p.continuationTarget, p.initialBudget + p.additionalExpansions);
  assert.equal(p.maximumWorkPerCase.resume, p.continuationTarget);
  assert.equal(p.maximumWorkPerCase.restart, p.initialBudget + p.continuationTarget);
  assert.ok(Object.values(p.maximumWorkPerCase).every(n => n <= p.commonComparisonWorkCeilingPerCase));
  const ref100File = local(resolve(root, p.reference100)), ref300File = local(resolve(root, p.reference300));
  const choiceFile = local(resolve(root, p.studentChoiceRecord));
  const sources = ['src/core.mjs', 'src/resumable-astar.mjs', 'src/route-update-policy.mjs',
    'scripts/compare-route-continuation.mjs', 'test/route-continuation.test.mjs', protocolFile, ref100File, ref300File, choiceFile];
  const git = args => execFileSync('git', args, {cwd: root, encoding: 'utf8'}).trim();
  if (git(['status', '--porcelain', '--', ...sources])) throw new Error('Commit inputs and source first.');
  const sha = b => createHash('sha256').update(b).digest('hex'), hashes = {};
  for (const file of sources) {
    const blob = execFileSync('git', ['show', 'HEAD:' + file], {cwd: root});
    assert.equal(sha(Buffer.from((await readFile(resolve(root, file), 'utf8')).replace(/\r\n/g, '\n'))), sha(blob));
    hashes[file] = sha(blob);
  }
  const ref100 = JSON.parse(await readFile(resolve(root, ref100File), 'utf8'));
  const ref300 = JSON.parse(await readFile(resolve(root, ref300File), 'utf8'));
  assert.equal(ref100.rows.length, p.runs); assert.equal(ref300.rows.length, p.runs);
  assert.equal(ref100.protocol.maxExpansions, p.initialBudget);
  for (const ref of [ref100, ref300]) assert.equal(ref.execution.sourceHashesGitBlobs['src/core.mjs'], hashes['src/core.mjs']);
  const rows = ref100.rows.map((reference, i) => {
    const full = ref300.rows[i]; assert.equal(reference.seed, full.seed);
    assert.deepEqual(reference.editedRows, full.editedRows); assert.deepEqual(reference.priorPath, full.priorPath);
    const blocked = [];
    reference.editedRows.forEach((line, y) => {
      assert.ok(line.length === reference.editedRows[0].length && /^[.#]+$/.test(line));
      [...line].forEach((cell, x) => { if (cell === '#') blocked.push([x, y]); });
    });
    const map = makeMap(reference.editedRows[0].length, reference.editedRows.length, blocked, reference.start, reference.goal);
    assert.ok(verifyPath(map, reference.priorPath));
    const results = {};
    for (const arm of p.arms) {
      const output = resolveRouteUpdate(map, reference.priorPath, {maxExpansions: p.initialBudget,
        additionalExpansions: p.additionalExpansions, tieBreak: p.tieBreak,
        timeoutResponse: arm === 'retain' ? 'retain' : 'continue', continuationStrategy: arm === 'restart' ? 'restart' : 'resume'});
      assert.ok(verifyPath(map, output.path)); assert.ok(output.expanded <= p.maximumWorkPerCase[arm]);
      assert.equal(output.expanded, output.searchStages.reduce((n, s) => n + s.expandedThisStage, 0));
      assert.equal(output.plannerCalls, output.searchSessions); assert.ok(output.searchStages.length <= 2);
      if (output.searchStages.length) assert.deepEqual(output.searchStages[0].result, reference.revised.planningResult);
      else assert.equal(reference.revised.planningResult, null);
      if (output.continued) {
        assert.equal(reference.revised.optimizationStatus, 'BUDGET_EXCEEDED');
        assert.equal(output.searchStages[0].result.reason, 'BUDGET_EXCEEDED');
        assert.equal(output.searchStages[1].budget, p.continuationTarget);
      }
      if (output.optimizationStatus === 'OPTIMAL') assert.equal(output.pathLength, reference.archivedBfsDistance);
      else {
        assert.equal(output.optimizationStatus, 'BUDGET_EXCEEDED'); assert.deepEqual(output.path, reference.priorPath);
        assert.equal(output.planningResult.reason, 'BUDGET_EXCEEDED');
        assert.deepEqual(output.planningResult.path, []); assert.equal(output.planningResult.pathLength, null);
      }
      results[arm] = output;
    }
    for (const key of Object.keys(reference.revised)) assert.deepEqual(results.retain[key], reference.revised[key]);
    assert.deepEqual(results.resume.path, results.restart.path);
    assert.deepEqual(results.resume.planningResult, results.restart.planningResult);
    if (full.revised.planningResult && full.revised.planningResult.expanded <= p.continuationTarget) {
      assert.deepEqual(results.resume.planningResult, full.revised.planningResult);
    }
    return {trial: reference.trial, seed: reference.seed, editedRows: reference.editedRows,
      start: reference.start, goal: reference.goal, priorPath: reference.priorPath,
      archivedBfsDistance: reference.archivedBfsDistance, retainOriginalFieldsMatched: true, results};
  });
  const summary = {};
  for (const arm of p.arms) {
    const values = rows.map(r => r.results[arm]);
    summary[arm] = {denominator: rows.length, usableRoutes: values.filter(o => o.path.length > 0).length,
      meanReturnedMoves: values.reduce((n, o) => n + o.pathLength, 0) / rows.length,
      boundProofs: values.filter(o => o.optimalityEvidence === 'MANHATTAN_BOUND').length,
      completedOptimizations: values.filter(o => o.planningResult?.success).length,
      finalBudgetFailures: values.filter(o => o.optimizationStatus === 'BUDGET_EXCEEDED').length,
      continuedCases: values.filter(o => o.continued).length,
      preservedIntermediateBudgetFailures: values.reduce((n, o) => n + o.searchStages.filter(s => s.result.reason === 'BUDGET_EXCEEDED').length, 0),
      searchSessions: values.reduce((n, o) => n + o.searchSessions, 0),
      budgetStages: values.reduce((n, o) => n + o.searchStages.length, 0),
      corePlanCalls: values.reduce((n, o) => n + o.corePlanCalls, 0),
      resumeAdvanceCalls: values.reduce((n, o) => n + o.resumeAdvanceCalls, 0),
      totalExamined: values.reduce((n, o) => n + o.expanded, 0),
      meanExamined: values.reduce((n, o) => n + o.expanded, 0) / rows.length};
  }
  const output = {schemaVersion: 1, label: 'AI BOUNDED CONTINUATION ACCOUNTING ON KNOWN DENSE INPUTS', protocol: p, summary, rows,
    execution: {operator: 'AI assistant CLI', executedAtUTC: new Date().toISOString(), sourceCommit: git(['rev-parse', 'HEAD']),
      sourceInputsDirty: false, sourceHashesGitBlobs: hashes, workspaceStatus: git(['status', '--porcelain']),
      node: process.version, platform: `${process.platform}/${process.arch}`, policyEvaluations: rows.length * p.arms.length,
      newAStarSearchSessions: Object.values(summary).reduce((n, s) => n + s.searchSessions, 0),
      newCorePlanCalls: Object.values(summary).reduce((n, s) => n + s.corePlanCalls, 0),
      newResumeAdvanceCalls: Object.values(summary).reduce((n, s) => n + s.resumeAdvanceCalls, 0),
      newExaminedNodes: Object.values(summary).reduce((n, s) => n + s.totalExamined, 0),
      newPriorAcquisitionCalls: 0, newIndependentBfsCalls: 0, provenance: p.attribution}};
  await mkdir(dirname(resolve(root, outputFile)), {recursive: true});
  await writeFile(resolve(root, outputFile), JSON.stringify(output, null, 2) + '\n', {flag: 'wx'});
  console.log(JSON.stringify(summary, null, 2)); console.log(`Saved ${outputFile}; source ${output.execution.sourceCommit}`);
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
