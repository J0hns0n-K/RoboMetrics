// AI-operated integration/accounting replay of the selected resolution policy on known layouts.
import assert from 'node:assert/strict';
import {readFile, writeFile, mkdir, access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {resolve, relative, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {makeMap} from '../src/core.mjs';
import {resolveDiskResolution} from '../src/resolution-policy.mjs';
import {auditWorldPolyline} from './check-two-cell-doorway.mjs';
import {bfsDistance} from './check-current-position-detour.mjs';

async function main() {
  const [inputPath, outputPath] = process.argv.slice(2);
  if (!inputPath || !outputPath?.endsWith('.json')) throw new Error('Usage: node scripts/check-resolution-policy.mjs PROTOCOL.json NEW-OUTPUT.json');
  const root = fileURLToPath(new URL('../', import.meta.url));
  const local = path => {
    const p = relative(root, resolve(path)).replaceAll('\\','/');
    if (p === '..' || p.startsWith('../') || p.includes(':')) throw new Error('Use project paths.');
    return p;
  };
  const protocolFile = local(inputPath), outputFile = local(outputPath);
  try { await access(resolve(root,outputFile)); throw new Error('Output already exists; choose a new name.'); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  const p = JSON.parse(await readFile(resolve(root,protocolFile),'utf8'));
  assert.equal(p.status,'ready'); assert.equal(p.tieBreak,'fifo');
  assert.deepEqual([p.width,p.height,p.start,p.goal,p.radius,p.clearance,p.coarseBudget,p.fineBudget],
    [9,7,[1,3],[7,3],.4,.15,100,100]);
  assert.deepEqual(p.modes,['always-fine','coarse-first']);
  assert.deepEqual(p.layouts,[{id:'empty',blocked:[]},{id:'doorway',blocked:[[4,0],[4,1],[4,4],[4,5],[4,6]]}]);
  const sources = ['src/core.mjs','src/disk-footprint.mjs','src/resolution-policy.mjs','scripts/run-scenario.mjs',
    'scripts/check-current-position-detour.mjs','scripts/check-two-cell-doorway.mjs','scripts/check-resolution-policy.mjs',
    'test/resolution-policy.test.mjs','data/footprint/resolution-policy-tests-01.tap',protocolFile,
    p.selectedModel,p.studentChoiceRecord,...Object.values(p.parentRaw)];
  const git = args => execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
  if (git(['status','--porcelain','--',...sources])) throw new Error('Commit inputs and source first.');
  const sha = b => createHash('sha256').update(b).digest('hex'), hashes = {};
  for (const file of sources) {
    const blob = execFileSync('git',['show','HEAD:'+file],{cwd:root});
    assert.equal(sha(Buffer.from((await readFile(resolve(root,file),'utf8')).replace(/\r\n/g,'\n'))),sha(blob));
    hashes[file] = sha(blob);
  }
  const model = JSON.parse(await readFile(resolve(root,p.selectedModel),'utf8'));
  assert.equal(model.radius,p.radius); assert.equal(model.clearance,p.clearance);
  const parents = {};
  for (const [key,file] of Object.entries(p.parentRaw)) {
    parents[key] = JSON.parse(await readFile(resolve(root,file),'utf8'));
    for (const f of ['src/core.mjs','src/disk-footprint.mjs']) assert.equal(hashes[f],parents[key].execution.sourceHashesGitBlobs[f]);
  }
  const rowsOf = m => Array.from({length:m.height},(_,y)=>Array.from({length:m.width},(_,x)=>m.cells[y*m.width+x]?'#':'.').join(''));
  const cases = [];
  for (const layout of p.layouts) for (const mode of p.modes) {
    const map = makeMap(p.width,p.height,layout.blocked,p.start,p.goal), originalRows = rowsOf(map);
    assert.deepEqual(originalRows,parents[layout.id].originalRows);
    const result = resolveDiskResolution(map,{mode,radius:p.radius,clearance:p.clearance,
      coarseBudget:p.coarseBudget,fineBudget:p.fineBudget,tieBreak:p.tieBreak});
    const stages = result.stages.map(stage => {
      const space = stage.outcome.configurationSpace, configurationRows = rowsOf(space), {cells,...metadata} = space;
      const outcome = {...stage.outcome,configurationSpace:metadata};
      const parentId = layout.id === 'empty' ? (stage.spacing === 1 ? 'unit-step' : 'half-step')
        : (stage.spacing === 1 ? 'coarse-budget100' : 'half-step-budget100');
      const reference = parents[layout.id].cases.find(c=>c.configuration.id === parentId);
      assert.ok(reference); assert.deepEqual(outcome,reference.outcome); assert.deepEqual(configurationRows,reference.configurationRows);
      const distance = bfsDistance(configurationRows,space.start,space.goal);
      assert.equal(stage.outcome.planningResult.pathLength,distance);
      const worldAudit = outcome.status === 'ROUTE_FOUND' ? auditWorldPolyline(map,outcome.worldPath,p.radius+p.clearance) : null;
      if (worldAudit) assert.ok(worldAudit.valid);
      return {...stage,outcome,configurationRows,archivedReference:{raw:p.parentRaw[layout.id],caseId:parentId},
        independentBfsEdgeDistance:distance,originalWorldPathAudit:worldAudit};
    });
    assert.equal(result.status,'ROUTE_FOUND');
    assert.equal(result.expanded,stages.reduce((n,s)=>n+s.outcome.planningResult.expanded,0));
    assert.equal(result.plannerCalls,stages.length); assert.ok(result.expanded <= result.maxExpansionsCap);
    assert.deepEqual(result.worldPath,stages.at(-1).outcome.worldPath);
    assert.equal(result.geometricLength,stages.at(-1).outcome.geometricLength);
    assert.deepEqual(rowsOf(map),originalRows);
    cases.push({layoutId:layout.id,mode,originalRows,result:{...result,stages}});
  }
  const output = {schemaVersion:1,label:'KNOWN VIRTUAL RESOLUTION-POLICY CONTROLS; NO PHYSICAL ROBOT',protocol:p,cases,
    execution:{operator:'AI assistant CLI',executedAtUTC:new Date().toISOString(),sourceCommit:git(['rev-parse','HEAD']),
      sourceInputsDirty:false,sourceHashesGitBlobs:hashes,workspaceStatus:git(['status','--porcelain']),node:process.version,
      platform:`${process.platform}/${process.arch}`,policyEvaluations:cases.length,
      plannerCalls:cases.reduce((n,c)=>n+c.result.plannerCalls,0),examinedNodes:cases.reduce((n,c)=>n+c.result.expanded,0),
      independentBfsCalls:cases.reduce((n,c)=>n+c.result.stages.length,0),provenance:p.attribution}};
  await mkdir(dirname(resolve(root,outputFile)),{recursive:true});
  await writeFile(resolve(root,outputFile),JSON.stringify(output,null,2)+'\n',{flag:'wx'});
  console.table(cases.map(c=>({layout:c.layoutId,mode:c.mode,status:c.result.status,
    stages:c.result.stages.length,examined:c.result.expanded,worldLength:c.result.geometricLength,cap:c.result.maxExpansionsCap})));
  console.log(`Saved ${outputFile}; source ${output.execution.sourceCommit}`);
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
