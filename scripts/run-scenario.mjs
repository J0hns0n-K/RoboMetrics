// AI-authored experiment helper. Student map design/interpretation is recorded separately.
import {makeMap, plan, verifyPath} from '../src/core.mjs';
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {resolve, dirname, relative} from 'node:path';
import {fileURLToPath} from 'node:url';

export function parseScenario(input) {
  if (input.status !== 'ready') throw new Error('Set status to ready only after writing your prediction and attribution.');
  for (const field of ['id', 'prediction', 'contributor', 'assistance']) {
    if (typeof input[field] !== 'string' || !input[field].trim()) throw new Error(`Missing ${field}.`);
  }
  if (!['ai-reference', 'student-declared'].includes(input.contributionType)) throw new Error('Invalid contributionType.');
  const {rows, budgets} = input;
  if (!Array.isArray(rows) || rows.length < 2 || rows.length > 80 || typeof rows[0] !== 'string'
    || rows[0].length < 2 || rows[0].length > 80) throw new Error('Use a 2–80 by 2–80 text grid.');
  const width = rows[0].length, blocked = [], starts = [], goals = [];
  rows.forEach((row, y) => {
    if (typeof row !== 'string' || row.length !== width || !/^[.#SG]+$/.test(row)) throw new Error('Equal-width rows may contain only . # S G.');
    [...row].forEach((cell, x) => {
      if (cell === '#') blocked.push([x, y]);
      if (cell === 'S') starts.push([x, y]);
      if (cell === 'G') goals.push([x, y]);
    });
  });
  if (starts.length !== 1 || goals.length !== 1) throw new Error('Use exactly one S and one G.');
  if (!Array.isArray(budgets) || !budgets.length || budgets.length > 20
    || budgets.some(n => !Number.isInteger(n) || n < 1 || n > 6400)
    || new Set(budgets).size !== budgets.length) throw new Error('Use 1–20 distinct positive integer budgets, at most 6400.');
  return makeMap(width, rows.length, blocked, starts[0], goals[0]);
}

export function evaluateScenario(input) {
  const map = parseScenario(input);
  const algorithms = ['astar', 'greedy', 'dijkstra'];
  const reference = plan(map, 'dijkstra');
  const measure = (algorithm, budget) => {
    const result = plan(map, algorithm, budget);
    if (result.success && !verifyPath(map, result.path)) throw new Error('Engine returned an invalid path.');
    return {...result, relativeLength: result.success ? result.pathLength / reference.pathLength : null};
  };
  return {
    schemaVersion: 1,
    label: 'SYNTHETIC FIXED GRID — NOT PHYSICAL ROBOT DATA',
    scenario: input,
    authorship: {declaredType: input.contributionType, contributor: input.contributor,
      assistance: input.assistance, independentlyVerified: false},
    conventions: {
      pathLength: 'Number of moves; start is zero moves.',
      expanded: 'Distinct nodes removed for examination, INCLUDING start and goal.',
      movement: 'Four neighbors; unit cost; static fully known obstacles.',
      tieBreak: 'FIFO insertion order at equal priority; neighbor order right, down, left, up.',
      reference: 'Dijkstra shares the starter search engine; independent BFS is in test/audit.test.mjs.'
    },
    referenceLength: reference.pathLength,
    unlimited: Object.fromEntries(algorithms.map(a => [a, measure(a, Infinity)])),
    trials: input.budgets.map(budget => ({budget,
      results: Object.fromEntries(algorithms.map(a => [a, measure(a, budget)]))}))
  };
}

async function main() {
  const [inputPath, outputPath] = process.argv.slice(2);
  if (!inputPath || !outputPath) throw new Error('Usage: node scripts/run-scenario.mjs INPUT.json OUTPUT.json');
  const root = fileURLToPath(new URL('../', import.meta.url));
  const inputText = await readFile(resolve(inputPath), 'utf8');
  const result = evaluateScenario(JSON.parse(inputText));
  const git = args => execFileSync('git', args, {cwd: root, encoding: 'utf8'}).trim();
  const sha256 = text => createHash('sha256').update(text).digest('hex');
  result.execution = {
    executedBy: 'Command operator; student execution is not inferred from a generated file.',
    timestamp: new Date().toISOString(), node: process.version,
    platform: `${process.platform}/${process.arch}`,
    sourceCommit: git(['rev-parse', 'HEAD']),
    workspaceDirty: Boolean(git(['status', '--porcelain', '--untracked-files=all'])),
    inputFile: relative(root, resolve(inputPath)).replaceAll('\\', '/'),
    inputSha256: sha256(inputText),
    coreSha256: sha256(await readFile(new URL('../src/core.mjs', import.meta.url))),
    runnerSha256: sha256(await readFile(import.meta.url.startsWith('file:') ? new URL(import.meta.url) : import.meta.url))
  };
  await mkdir(dirname(resolve(outputPath)), {recursive: true});
  await writeFile(resolve(outputPath), JSON.stringify(result, null, 2) + '\n', {flag: 'wx'});
  console.log(`Saved ${outputPath}; source ${result.execution.sourceCommit}; dirty=${result.execution.workspaceDirty}`);
  console.table(Object.entries(result.unlimited).map(([algorithm, r]) => ({algorithm,
    success: r.success, pathLength: r.pathLength, expanded: r.expanded})));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
