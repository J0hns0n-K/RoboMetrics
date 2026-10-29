// AI-authored configured map-update control, not a dynamic replanning engine.
import assert from 'node:assert/strict';
import {readFile, writeFile, mkdir, access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {resolve, relative, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseScenario} from './run-scenario.mjs';
import {plan, verifyPath} from '../src/core.mjs';

// Separate queue traversal; does not call the shared planner or its heuristic.
export function bfsDistance(rows, start, goal) {
  const queue = [[...start, 0]], seen = new Set([start.join(',')]);
  for (let i = 0; i < queue.length; i++) {
    const [x, y, distance] = queue[i];
    if (x === goal[0] && y === goal[1]) return distance;
    for (const [nx, ny] of [[x - 1, y], [x, y - 1], [x + 1, y], [x, y + 1]]) {
      if (ny < 0 || ny >= rows.length || nx < 0 || nx >= rows[0].length
        || rows[ny][nx] === '#' || seen.has(`${nx},${ny}`)) continue;
      seen.add(`${nx},${ny}`);
      queue.push([nx, ny, distance + 1]);
    }
  }
  return null;
}

async function main() {
  const [inputPath, outputPath] = process.argv.slice(2);
  if (!inputPath || !outputPath?.endsWith('.json')) throw new Error('Usage: node scripts/check-current-position-detour.mjs SCENARIO.json NEW-OUTPUT.json');
  const root = fileURLToPath(new URL('../', import.meta.url));
  const projectPath = path => {
    const p = relative(root, resolve(path)).replaceAll('\\', '/');
    if (p === '..' || p.startsWith('../') || p.includes(':')) throw new Error('Use project paths.');
    return p;
  };
  const inputFile = projectPath(inputPath), outputFile = projectPath(outputPath);
  try { await access(resolve(root, outputFile)); throw new Error('Output already exists; choose a new name.'); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  const git = args => execFileSync('git', args, {cwd: root, encoding: 'utf8'}).trim();
  const sources = ['src/core.mjs', 'scripts/run-scenario.mjs', 'scripts/check-current-position-detour.mjs', inputFile];
  if (git(['status', '--porcelain', '--', ...sources])) throw new Error('Commit source and scenario before execution.');
  const sha = bytes => createHash('sha256').update(bytes).digest('hex'), hashes = {};
  for (const file of sources) {
    const blob = execFileSync('git', ['show', 'HEAD:' + file], {cwd: root});
    assert.equal(sha(Buffer.from((await readFile(resolve(root, file), 'utf8')).replace(/\r\n/g, '\n'))), sha(blob));
    hashes[file] = sha(blob);
  }
  const input = JSON.parse(await readFile(resolve(root, inputFile), 'utf8'));
  const map = parseScenario(input), oldMap = parseScenario({...input, rows: input.oldRows});
  assert.equal(input.algorithm, 'astar'); assert.equal(input.tieBreak, 'fifo');
  assert.equal(input.budgets.length, 1);
  assert.ok(Number.isSafeInteger(input.studentPredictedRemainingMoves) && input.studentPredictedRemainingMoves >= 0);
  assert.deepEqual(map.start, input.currentPosition); assert.deepEqual(oldMap.start, map.start);
  assert.deepEqual(map.goal, input.goal); assert.deepEqual(oldMap.goal, map.goal);
  assert.equal(oldMap.width, map.width); assert.equal(oldMap.height, map.height);
  const changes = [];
  for (let k = 0; k < map.cells.length; k++) if (oldMap.cells[k] !== map.cells[k]) {
    changes.push({coordinate: [k % map.width, Math.floor(k / map.width)], from: oldMap.cells[k], to: map.cells[k]});
  }
  assert.deepEqual(changes, [{coordinate: input.newObstacle, from: 0, to: 1}]);
  assert.ok(Number.isSafeInteger(input.currentPathIndex) && input.currentPathIndex >= 0 && input.currentPathIndex < input.oldPlannedRoute.length);
  assert.deepEqual(input.oldPlannedRoute[input.currentPathIndex], map.start);
  assert.ok(verifyPath({...oldMap, start: input.originalDeparture}, input.oldPlannedRoute));
  const remaining = input.oldPlannedRoute.slice(input.currentPathIndex);
  const beforeValid = verifyPath(oldMap, remaining), afterValid = verifyPath(map, remaining);
  assert.equal(beforeValid, true); assert.equal(afterValid, false);
  const blockedWaypoints = remaining.filter(([x, y]) => map.cells[y * map.width + x]);
  assert.deepEqual(blockedWaypoints, [input.newObstacle]);
  const freshResult = plan(map, 'astar', input.budgets[0], {tieBreak: input.tieBreak});
  const shortestRemainingDistance = bfsDistance(input.rows, map.start, map.goal);
  if (freshResult.success) {
    assert.ok(verifyPath(map, freshResult.path));
    assert.equal(freshResult.pathLength, shortestRemainingDistance);
  } else if (freshResult.reason === 'UNREACHABLE') assert.equal(shortestRemainingDistance, null);
  const output = {
    schemaVersion: 1, label: 'AI-OPERATED SYNTHETIC MAP UPDATE; FRESH STATIC PLANNING FROM CURRENT POSITION',
    scenario: input, changes,
    oldRouteValidation: {fullRouteOnOldMapValid: true, currentPathIndex: input.currentPathIndex,
      remainingPath: remaining, remainingOnOldMapValid: beforeValid, remainingOnChangedMapValid: afterValid,
      blockedWaypoints, status: 'OLD_REMAINING_PATH_INVALID',
      semantics: 'Path validation status, not BUDGET_EXCEEDED or UNREACHABLE; says nothing alone about alternative routes.'},
    freshPlan: {algorithm: input.algorithm, tieBreak: input.tieBreak, budget: input.budgets[0], result: freshResult},
    independentCheck: {method: 'Separate BFS on text-grid rows', shortestRemainingDistance},
    predictionComparison: {predictedRemainingMoves: input.studentPredictedRemainingMoves,
      matchesShortestDistance: input.studentPredictedRemainingMoves === shortestRemainingDistance},
    execution: {operator: 'AI assistant CLI', executedAtUTC: new Date().toISOString(),
      sourceCommit: git(['rev-parse', 'HEAD']), sourceInputsDirty: false, sourceHashesGitBlobs: hashes,
      workspaceStatus: git(['status', '--porcelain']), node: process.version, platform: `${process.platform}/${process.arch}`,
      sharedPlannerCalls: 1, independentBfsCalls: 1,
      attribution: 'Student supplied the quoted remaining-length prediction only. AI supplied map, method, source, execution and validation. No saved session was updated or reused.'}
  };
  await mkdir(dirname(resolve(root, outputFile)), {recursive: true});
  await writeFile(resolve(root, outputFile), JSON.stringify(output, null, 2) + '\n', {flag: 'wx'});
  console.log(`Old remaining route valid: ${beforeValid} -> ${afterValid}`);
  console.log(`Fresh plan: ${freshResult.reason ?? 'SUCCESS'}, moves=${freshResult.pathLength}, examined=${freshResult.expanded}; independent BFS=${shortestRemainingDistance}`);
  console.log(`Saved ${outputFile}; source ${output.execution.sourceCommit}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
