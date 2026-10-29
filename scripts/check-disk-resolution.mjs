// AI-operated known-map resolution control, not a robot controller or independent cohort.
import assert from 'node:assert/strict';
import {readFile, writeFile, mkdir, access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {resolve, relative, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {makeMap} from '../src/core.mjs';
import {planSampledDiskPath} from '../src/disk-footprint.mjs';
import {auditWorldPolyline} from './check-two-cell-doorway.mjs';
import {bfsDistance} from './check-current-position-detour.mjs';

async function main() {
  const [inputPath, outputPath] = process.argv.slice(2);
  if (!inputPath || !outputPath?.endsWith('.json')) throw new Error('Usage: node scripts/check-disk-resolution.mjs PROTOCOL.json NEW-OUTPUT.json');
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
  assert.deepEqual([p.width,p.height,p.barrierColumn,p.openingRows,p.start,p.goal], [9,7,4,[2,3],[1,3],[7,3]]);
  assert.equal(p.radius,.4); assert.equal(p.clearance,.15);
  assert.deepEqual(p.cases,[{id:'coarse-budget100',spacing:1,maxExpansions:100},
    {id:'coarse-budget200',spacing:1,maxExpansions:200},{id:'half-step-budget100',spacing:.5,maxExpansions:100}]);
  const sources = ['src/core.mjs','src/disk-footprint.mjs','scripts/run-scenario.mjs',
    'scripts/check-current-position-detour.mjs','scripts/check-two-cell-doorway.mjs','scripts/check-disk-resolution.mjs',
    'test/disk-footprint.test.mjs','test/sampled-disk.test.mjs','test/two-cell-doorway.test.mjs',
    'data/footprint/disk-resolution-tests-01.tap',protocolFile,p.selectedModel,p.studentChoiceRecord,p.parentProtocol,p.parentRaw];
  const git = args => execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
  if (git(['status','--porcelain','--',...sources])) throw new Error('Commit inputs and source first.');
  const sha = b => createHash('sha256').update(b).digest('hex'), hashes = {};
  for (const file of sources) {
    const blob = execFileSync('git',['show','HEAD:'+file],{cwd:root});
    assert.equal(sha(Buffer.from((await readFile(resolve(root,file),'utf8')).replace(/\r\n/g,'\n'))),sha(blob));
    hashes[file]=sha(blob);
  }
  const chosen = JSON.parse(await readFile(resolve(root,p.selectedModel),'utf8'));
  assert.equal(chosen.radius,p.radius); assert.equal(chosen.clearance,p.clearance);
  assert.equal(chosen.effectiveRadius,p.radius+p.clearance);
  const parent = JSON.parse(await readFile(resolve(root,p.parentRaw),'utf8'));
  const blocked=Array.from({length:p.height},(_,y)=>[p.barrierColumn,y]).filter(([,y])=>!p.openingRows.includes(y));
  const map=makeMap(p.width,p.height,blocked,p.start,p.goal);
  const savedCells=[...map.cells];
  const rowsOf = m => Array.from({length:m.height},(_,y)=>Array.from({length:m.width},(_,x)=>m.cells[y*m.width+x]?'#':'.').join(''));
  assert.deepEqual(rowsOf(map),parent.originalRows);
  const cases=p.cases.map(c=>{
    const outcome=planSampledDiskPath(map,{...c,radius:p.radius,clearance:p.clearance,tieBreak:p.tieBreak});
    assert.deepEqual(outcome.invalidEndpoints,[]);
    const space=outcome.configurationSpace, configurationRows=rowsOf(space);
    const distance=bfsDistance(configurationRows,space.start,space.goal);
    assert.equal(outcome.planningResult.pathLength,distance);
    let centerAuditCount=0;
    for(let y=0;y<space.height;y++)for(let x=0;x<space.width;x++) {
      const point=[.5+x*c.spacing,.5+y*c.spacing];
      const audit=auditWorldPolyline(map,[point,point],p.radius+p.clearance);
      assert.equal(space.cells[y*space.width+x],audit.valid?0:1); centerAuditCount++;
    }
    const worldAudit=outcome.planningResult.success?auditWorldPolyline(map,outcome.worldPath,p.radius+p.clearance):null;
    if(c.spacing===1) {
      assert.equal(outcome.status,'UNREACHABLE'); assert.equal(outcome.geometricLength,null);
      assert.deepEqual(outcome.worldPath,[]); assert.deepEqual(outcome.planningResult.path,[]);
      assert.deepEqual(outcome.planningResult,parent.cases.find(v=>v.configuration.id==='selected-margin').outcome.planningResult);
    } else {
      assert.equal(outcome.status,'ROUTE_FOUND'); assert.equal(distance,14);
      assert.equal(outcome.geometricLength,7); assert.ok(worldAudit.valid);
      assert.deepEqual(outcome.worldPath[0],[1.5,3.5]); assert.deepEqual(outcome.worldPath.at(-1),[7.5,3.5]);
      assert.ok(outcome.worldPath.some(([x,y])=>x===4.5&&y===3));
    }
    assert.deepEqual([...map.cells],savedCells);
    const {cells,...metadata}=space;
    return {configuration:c,configurationRows,outcome:{...outcome,configurationSpace:metadata},
      independentBfsEdgeDistance:distance,originalWorldPathAudit:worldAudit,centerAuditCount};
  });
  const output={schemaVersion:1,label:'KNOWN VIRTUAL SAMPLING CONTROL; NO PHYSICAL ROBOT',protocol:p,originalRows:rowsOf(map),cases,
    execution:{operator:'AI assistant CLI',executedAtUTC:new Date().toISOString(),sourceCommit:git(['rev-parse','HEAD']),
      sourceInputsDirty:false,sourceHashesGitBlobs:hashes,workspaceStatus:git(['status','--porcelain']),
      node:process.version,platform:`${process.platform}/${process.arch}`,plannerCalls:cases.length,
      examinedNodes:cases.reduce((n,c)=>n+c.outcome.planningResult.expanded,0),independentBfsCalls:cases.length,
      candidatePointAudits:cases.reduce((n,c)=>n+c.centerAuditCount,0),provenance:p.attribution}};
  await mkdir(dirname(resolve(root,outputFile)),{recursive:true});
  await writeFile(resolve(root,outputFile),JSON.stringify(output,null,2)+'\n',{flag:'wx'});
  console.table(cases.map(c=>({case:c.configuration.id,graph:`${c.outcome.configurationSpace.width}x${c.outcome.configurationSpace.height}`,
    status:c.outcome.status,edges:c.outcome.planningResult.pathLength,worldLength:c.outcome.geometricLength,examined:c.outcome.planningResult.expanded})));
  console.log(`Saved ${outputFile}; source ${output.execution.sourceCommit}`);
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
