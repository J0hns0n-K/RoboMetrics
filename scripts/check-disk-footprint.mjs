// AI-operated assumed geometry controls, not physical robot measurements.
import assert from 'node:assert/strict';
import {readFile, writeFile, mkdir, access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {resolve, relative, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {makeMap, verifyPath} from '../src/core.mjs';
import {planDiskPath, validateDiskPath} from '../src/disk-footprint.mjs';
import {bfsDistance} from './check-current-position-detour.mjs';
const rowsOf = map => Array.from({length: map.height}, (_, y) => Array.from({length: map.width}, (_, x) =>
  map.cells[y * map.width + x] ? '#' : '.').join(''));

async function main() {
  const [inputPath, outputPath] = process.argv.slice(2);
  if (!inputPath || !outputPath?.endsWith('.json')) throw new Error('Usage: node scripts/check-disk-footprint.mjs PROTOCOL.json NEW-OUTPUT.json');
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
  const hardwareFile = local(resolve(root, p.hardwareContext));
  const sources = ['src/core.mjs', 'src/disk-footprint.mjs', 'scripts/check-current-position-detour.mjs',
    'scripts/check-disk-footprint.mjs', 'test/disk-footprint.test.mjs', protocolFile, hardwareFile];
  const git = args => execFileSync('git', args, {cwd: root, encoding: 'utf8'}).trim();
  if (git(['status', '--porcelain', '--', ...sources])) throw new Error('Commit inputs and source first.');
  const sha = b => createHash('sha256').update(b).digest('hex'), hashes = {};
  for (const file of sources) {
    const blob = execFileSync('git', ['show', 'HEAD:' + file], {cwd: root});
    assert.equal(sha(Buffer.from((await readFile(resolve(root, file), 'utf8')).replace(/\r\n/g, '\n'))), sha(blob));
    hashes[file] = sha(blob);
  }
  const cases = p.cases.map(control => {
    assert.ok(Number.isInteger(control.openingCells) && control.openingCells > 0 && control.openingCells % 2 === 1);
    const half = (control.openingCells - 1) / 2;
    const blocked = Array.from({length: p.height}, (_, y) => [p.barrierColumn, y])
      .filter(([, y]) => Math.abs(y - p.openingCenterRow) > half);
    const original = makeMap(p.width, p.height, blocked, p.start, p.goal);
    const outcome = planDiskPath(original, {...control, maxExpansions: p.maxExpansions, tieBreak: p.tieBreak});
    assert.deepEqual(outcome.invalidEndpoints, []);
    const space = outcome.configurationSpace, configurationRows = rowsOf(space);
    const distance = bfsDistance(configurationRows, space.start, space.goal);
    const fits = 2 * space.parameters.effectiveRadius < control.openingCells;
    assert.equal(outcome.planningResult.success, fits);
    if (fits) {
      assert.equal(outcome.planningResult.pathLength, distance);
      assert.equal(distance, p.goal[0] - p.start[0]);
      assert.ok(verifyPath(original, outcome.planningResult.path));
      assert.equal(outcome.sweptPathValidation.valid, true);
    } else {
      assert.equal(distance, null); assert.equal(outcome.status, 'UNREACHABLE');
      assert.equal(outcome.planningResult.reason, 'UNREACHABLE');
      assert.equal(outcome.planningResult.pathLength, null); assert.deepEqual(outcome.planningResult.path, []);
    }
    const {cells, ...metadata} = space;
    return {configuration: control, originalRows: rowsOf(original), configurationRows,
      outcome: {...outcome, configurationSpace: metadata},
      independentConfigurationBfsDistance: distance,
      analyticWidthCheck: {openingWidth: control.openingCells, effectiveDiameter: 2 * space.parameters.effectiveRadius,
        contactForbidden: true, canPassTheseFixtures: fits}};
  });
  const point = cases.find(c => c.configuration.id === 'narrow-point'); assert.ok(point);
  const oldPointPathChecks = cases.filter(c => c.configuration.openingCells === 1).map(c => {
    const blocked = [];c.originalRows.forEach((line,y)=>[...line].forEach((cell,x)=>{if(cell==='#')blocked.push([x,y]);}));
    const original = makeMap(p.width, p.height, blocked, p.start, p.goal);
    return {caseId: c.configuration.id, validation: validateDiskPath(original, point.outcome.planningResult.path, c.configuration)};
  });
  const output = {schemaVersion: 1, label: 'ASSUMED DISK GEOMETRY; NO PHYSICAL ROBOT OR MOTION MEASUREMENTS', protocol: p,
    cases, oldPointPathChecks, execution: {operator: 'AI assistant CLI', executedAtUTC: new Date().toISOString(),
      sourceCommit: git(['rev-parse', 'HEAD']), sourceInputsDirty: false, sourceHashesGitBlobs: hashes,
      workspaceStatus: git(['status', '--porcelain']), node: process.version, platform: `${process.platform}/${process.arch}`,
      configuredCases: cases.length, sharedPlannerCalls: cases.filter(c => c.outcome.planningResult).length,
      newExaminedNodes: cases.reduce((n,c)=>n+(c.outcome.planningResult?.expanded??0),0), independentBfsCalls: cases.length,
      provenance: p.attribution}};
  await mkdir(dirname(resolve(root, outputFile)), {recursive: true});
  await writeFile(resolve(root, outputFile), JSON.stringify(output, null, 2) + '\n', {flag: 'wx'});
  console.table(cases.map(c=>({case:c.configuration.id, opening:c.configuration.openingCells,
    diameter:c.outcome.configurationSpace.parameters.diameter, margin:c.configuration.clearance,
    status:c.outcome.status, moves:c.outcome.planningResult?.pathLength, examined:c.outcome.planningResult?.expanded})));
  console.log(`Saved ${outputFile}; source ${output.execution.sourceCommit}`);
}

main().catch(error=>{console.error(error.message);process.exitCode=1;});
