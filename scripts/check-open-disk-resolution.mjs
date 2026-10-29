// AI-operated empty-map cost control using the already-tested disk sampling adapter.
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
  const [inputPath,outputPath]=process.argv.slice(2);
  if(!inputPath||!outputPath?.endsWith('.json'))throw new Error('Usage: node scripts/check-open-disk-resolution.mjs PROTOCOL.json NEW-OUTPUT.json');
  const root=fileURLToPath(new URL('../',import.meta.url));
  const local=path=>{
    const p=relative(root,resolve(path)).replaceAll('\\','/');
    if(p==='..'||p.startsWith('../')||p.includes(':'))throw new Error('Use project paths.');
    return p;
  };
  const protocolFile=local(inputPath),outputFile=local(outputPath);
  try{await access(resolve(root,outputFile));throw new Error('Output already exists; choose a new name.');}
  catch(error){if(error.code!=='ENOENT')throw error;}
  const p=JSON.parse(await readFile(resolve(root,protocolFile),'utf8'));
  assert.equal(p.status,'ready');assert.equal(p.tieBreak,'fifo');assert.equal(p.maxExpansions,100);
  assert.deepEqual([p.width,p.height,p.blocked,p.start,p.goal,p.radius,p.clearance],[9,7,[],[1,3],[7,3],.4,.15]);
  assert.deepEqual(p.cases,[{id:'unit-step',spacing:1},{id:'half-step',spacing:.5}]);
  const prior=JSON.parse(await readFile(resolve(root,p.priorValidation),'utf8'));
  const sources=['src/core.mjs','src/disk-footprint.mjs','scripts/run-scenario.mjs',
    'scripts/check-current-position-detour.mjs','scripts/check-two-cell-doorway.mjs',
    'test/disk-footprint.test.mjs','test/sampled-disk.test.mjs','test/two-cell-doorway.test.mjs',
    prior.tests.path,p.priorValidation,p.selectedModel,p.studentPredictionRecord,protocolFile,'scripts/check-open-disk-resolution.mjs'];
  const git=args=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
  if(git(['status','--porcelain','--',...sources]))throw new Error('Commit inputs and source first.');
  const sha=b=>createHash('sha256').update(b).digest('hex'),hashes={};
  for(const file of sources){
    const blob=execFileSync('git',['show','HEAD:'+file],{cwd:root});
    assert.equal(sha(Buffer.from((await readFile(resolve(root,file),'utf8')).replace(/\r\n/g,'\n'))),sha(blob));
    hashes[file]=sha(blob);
    if(prior.sourceHashesGitBlobs[file])assert.equal(hashes[file],prior.sourceHashesGitBlobs[file]);
  }
  const selected=JSON.parse(await readFile(resolve(root,p.selectedModel),'utf8'));
  assert.equal(selected.radius,p.radius);assert.equal(selected.clearance,p.clearance);
  const map=makeMap(p.width,p.height,p.blocked,p.start,p.goal),snapshot=[...map.cells];
  const rowsOf=m=>Array.from({length:m.height},(_,y)=>Array.from({length:m.width},(_,x)=>m.cells[y*m.width+x]?'#':'.').join(''));
  const cases=p.cases.map(c=>{
    const outcome=planSampledDiskPath(map,{...c,radius:p.radius,clearance:p.clearance,
      maxExpansions:p.maxExpansions,tieBreak:p.tieBreak});
    assert.equal(outcome.status,'ROUTE_FOUND');assert.deepEqual(outcome.invalidEndpoints,[]);
    const space=outcome.configurationSpace,configurationRows=rowsOf(space);
    const bfs=bfsDistance(configurationRows,space.start,space.goal);
    assert.equal(bfs,6/c.spacing);assert.equal(outcome.planningResult.pathLength,bfs);
    assert.equal(outcome.planningResult.expanded,bfs+1);assert.equal(outcome.geometricLength,6);
    assert.deepEqual(outcome.worldPath,Array.from({length:bfs+1},(_,i)=>[1.5+i*c.spacing,3.5]));
    const worldAudit=auditWorldPolyline(map,outcome.worldPath,p.radius+p.clearance);assert.ok(worldAudit.valid);
    for(let y=0;y<space.height;y++)for(let x=0;x<space.width;x++){
      const point=[.5+x*c.spacing,.5+y*c.spacing];
      const audit=auditWorldPolyline(map,[point,point],p.radius+p.clearance);
      assert.equal(space.cells[y*space.width+x],audit.valid?0:1);
    }
    assert.deepEqual([...map.cells],snapshot);
    const {cells,...metadata}=space;
    return {configuration:c,configurationRows,outcome:{...outcome,configurationSpace:metadata},
      independentBfsEdgeDistance:bfs,originalWorldPathAudit:worldAudit,candidateCount:cells.length,
      unblockedCandidateCount:[...cells].filter(v=>!v).length};
  });
  const output={schemaVersion:1,label:'KNOWN VIRTUAL EMPTY-MAP CONTROL; NO PHYSICAL ROBOT',protocol:p,originalRows:rowsOf(map),cases,
    execution:{operator:'AI assistant CLI',executedAtUTC:new Date().toISOString(),sourceCommit:git(['rev-parse','HEAD']),
      sourceInputsDirty:false,sourceHashesGitBlobs:hashes,workspaceStatus:git(['status','--porcelain']),node:process.version,
      platform:`${process.platform}/${process.arch}`,plannerCalls:cases.length,
      examinedNodes:cases.reduce((n,c)=>n+c.outcome.planningResult.expanded,0),independentBfsCalls:cases.length,
      candidatePointAudits:cases.reduce((n,c)=>n+c.candidateCount,0),fullSuiteRerun:false,provenance:p.attribution}};
  await mkdir(dirname(resolve(root,outputFile)),{recursive:true});
  await writeFile(resolve(root,outputFile),JSON.stringify(output,null,2)+'\n',{flag:'wx'});
  console.table(cases.map(c=>({case:c.configuration.id,candidates:c.candidateCount,examined:c.outcome.planningResult.expanded,
    edges:c.outcome.planningResult.pathLength,worldLength:c.outcome.geometricLength,status:c.outcome.status})));
  console.log(`Saved ${outputFile}; source ${output.execution.sourceCommit}`);
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
