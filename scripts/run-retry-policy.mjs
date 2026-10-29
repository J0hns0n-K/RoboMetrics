// AI-authored CLI; configured demonstrations remain separate from benchmark rows.
import assert from 'node:assert/strict';
import {readFile, writeFile, mkdir, access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {resolve, relative, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseScenario} from './run-scenario.mjs';
import {planAStarWithOneRetry} from '../src/retry-policy.mjs';

async function main() {
  const [configPath, outputPath] = process.argv.slice(2);
  if (!configPath || !outputPath?.endsWith('.json')) {
    throw new Error('Usage: node scripts/run-retry-policy.mjs CONFIG.json NEW-OUTPUT.json');
  }
  const root = fileURLToPath(new URL('../', import.meta.url));
  const projectPath = path => {
    const rel = relative(root, resolve(path)).replaceAll('\\', '/');
    if (rel === '..' || rel.startsWith('../') || rel.includes(':')) throw new Error('Use paths inside this project.');
    return rel;
  };
  const configFile = projectPath(configPath), outputFile = projectPath(outputPath);
  try {
    await access(resolve(root, outputFile));
    throw new Error('Output already exists; choose a new name.');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  const config = JSON.parse(await readFile(resolve(root, configFile), 'utf8'));
  if (config.status !== 'ready') throw new Error('Record the choices and commit a ready configuration first.');
  if (typeof config.mapScenario !== 'string') throw new Error('Missing map scenario.');
  const mapFile = projectPath(resolve(root, config.mapScenario));
  const git = args => execFileSync('git', args, {cwd: root, encoding: 'utf8'}).trim();
  const sourceFiles = ['src/core.mjs', 'src/retry-policy.mjs', 'scripts/run-scenario.mjs',
    'scripts/run-retry-policy.mjs', configFile, mapFile];
  if (git(['status', '--porcelain', '--', ...sourceFiles])) throw new Error('Commit configuration and sources before running.');
  const sha = data => createHash('sha256').update(data).digest('hex');
  const hashes = {};
  for (const path of sourceFiles) {
    const blob = execFileSync('git', ['show', 'HEAD:' + path], {cwd: root});
    const workingLF = (await readFile(resolve(root, path), 'utf8')).replace(/\r\n/g, '\n');
    assert.equal(sha(Buffer.from(workingLF)), sha(blob), `Working source differs: ${path}`);
    hashes[path] = sha(blob);
  }
  const mapScenario = JSON.parse(await readFile(resolve(root, mapFile), 'utf8'));
  const map = parseScenario(mapScenario);
  const result = planAStarWithOneRetry(map, config.policy);
  const output = {
    schemaVersion: 1, label: 'AI-OPERATED CONFIGURED RETRY DEMONSTRATION; NOT FIXED-BUDGET BENCHMARK DATA',
    configuration: config, map: {source: mapFile, rows: mapScenario.rows}, result,
    execution: {
      operator: 'AI assistant CLI', executedAtUTC: new Date().toISOString(),
      sourceCommit: git(['rev-parse', 'HEAD']), sourceInputsDirty: false,
      sourceHashesGitBlobs: hashes, workspaceStatus: git(['status', '--porcelain']),
      node: process.version, platform: `${process.platform}/${process.arch}`,
      provenance: 'Student mode/preference and assistant numeric interpretation are retained in configuration. AI supplies code and execution; prior map forecasts are not new retry-outcome predictions.'
    }
  };
  await mkdir(dirname(resolve(root, outputFile)), {recursive: true});
  await writeFile(resolve(root, outputFile), JSON.stringify(output, null, 2) + '\n', {flag: 'wx'});
  console.log(`Saved ${outputFile}; source ${output.execution.sourceCommit}`);
  console.table(result.attempts.map(a => ({attempt: a.number, budget: a.budget,
    success: a.result.success, reason: a.result.reason, moves: a.result.pathLength, examined: a.result.expanded})));
  console.log(`Total examined: ${result.totalExpanded}; cap: ${config.policy.maxTotalExpansions}`);
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
