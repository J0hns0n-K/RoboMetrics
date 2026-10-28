// AI-authored paired evaluator; student choices and forecasts remain in the input.
import assert from 'node:assert/strict';
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {resolve, dirname, relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {plan, verifyPath} from '../src/core.mjs';
import {parseScenario} from './run-scenario.mjs';

export function evaluateFixedTies(input) {
  const map = parseScenario(input);
  assert.deepEqual(input.variants, ['fifo', 'closer-goal'], 'Specify both tie rules in collection order.');
  const reference = plan(map, 'dijkstra');
  if (reference.success) assert.ok(verifyPath(map, reference.path));
  const trials = input.budgets.map(budget => {
    const results = Object.fromEntries(input.variants.map(tieBreak => {
      const result = plan(map, 'astar', budget, {tieBreak});
      assert.ok(result.expanded <= budget);
      if (result.success) {
        assert.ok(reference.success && verifyPath(map, result.path));
        assert.equal(result.pathLength, reference.pathLength);
      }
      return [tieBreak, {...result,
        relativeLength: result.success ? result.pathLength / reference.pathLength : null}];
    }));
    const fifo = results.fifo, closer = results['closer-goal'];
    const commonSuccess = fifo.success && closer.success;
    return {budget, results, comparison: {
      commonSuccess,
      savedExaminedNodes: fifo.expanded - closer.expanded,
      pathLengthDifference: commonSuccess ? closer.pathLength - fifo.pathLength : null
    }};
  });
  return {
    schemaVersion: 1,
    label: 'AI-OPERATED FIXED-MAP A* TIE COMPARISON; SYNTHETIC GRID',
    scenario: input,
    conventions: {
      primaryScore: 'Both A* variants use g+h; only equal-f ordering differs.',
      examinedNodes: 'Distinct examined nodes, including start and goal; not runtime or energy.',
      pathLength: 'Number of moves, excluding the start cell.',
      reference: 'Dijkstra shares the planner; independent BFS audit is in test/audit.test.mjs.',
      attribution: 'Input retains guided student choices and forecast; evaluator and execution are AI support.'
    },
    reference, trials
  };
}

async function main() {
  const [inputPath, outputPath] = process.argv.slice(2);
  if (!inputPath || !outputPath?.endsWith('.json')) {
    throw new Error('Usage: node scripts/compare-fixed-ties.mjs INPUT.json NEW-OUTPUT.json');
  }
  const root = fileURLToPath(new URL('../', import.meta.url));
  const git = args => execFileSync('git', args, {cwd: root, encoding: 'utf8'}).trim();
  const inputFile = relative(root, resolve(inputPath)).replaceAll('\\', '/');
  const sourceFiles = ['src/core.mjs', 'scripts/run-scenario.mjs', 'scripts/compare-fixed-ties.mjs', inputFile];
  const inputStatus = git(['status', '--porcelain', '--', ...sourceFiles]);
  if (inputStatus) throw new Error('Commit the scenario and comparison sources before execution.');
  const sha = data => createHash('sha256').update(data).digest('hex');
  const sourceHashesGitBlobs = {};
  for (const path of sourceFiles) {
    const blob = execFileSync('git', ['show', 'HEAD:' + path], {cwd: root});
    const workingLF = (await readFile(resolve(root, path), 'utf8')).replace(/\r\n/g, '\n');
    assert.equal(sha(Buffer.from(workingLF)), sha(blob), `Working source differs: ${path}`);
    sourceHashesGitBlobs[path] = sha(blob);
  }
  const inputBytes = await readFile(resolve(inputPath));
  const result = evaluateFixedTies(JSON.parse(inputBytes.toString('utf8')));
  result.execution = {
    operator: 'AI assistant CLI',
    executedAtUTC: new Date().toISOString(),
    sourceCommit: git(['rev-parse', 'HEAD']),
    sourceInputsDirty: false,
    workspaceStatus: git(['status', '--porcelain']),
    sourceHashesGitBlobs,
    inputFile, inputWorkingBytesSha256: sha(inputBytes),
    node: process.version, platform: `${process.platform}/${process.arch}`,
    provenance: 'Student supplied guided choices and forecast; this command is assistant-operated. No student execution or independent map sample is inferred.'
  };
  await mkdir(dirname(resolve(outputPath)), {recursive: true});
  await writeFile(resolve(outputPath), JSON.stringify(result, null, 2) + '\n', {flag: 'wx'});
  console.log(`Saved ${outputPath}; source ${result.execution.sourceCommit}`);
  console.table(result.trials.flatMap(trial => Object.entries(trial.results).map(([rule, r]) => ({
    budget: trial.budget, rule, success: r.success, moves: r.pathLength, examined: r.expanded
  }))));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
