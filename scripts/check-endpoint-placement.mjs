// AI known-case endpoint control. Goal changes must never regenerate or silently clear the map.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {resolve,relative,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {makeMap} from '../src/core.mjs';
import {resolveDiskResolution} from '../src/resolution-policy.mjs';
import {resolveDiskResolutionQuality} from '../src/resolution-quality-policy.mjs';
import {referenceResolutionGraph,rowsOf} from './resolution-cohort.mjs';
import {auditWorldPolyline} from './check-two-cell-doorway.mjs';

async function main(){
  const [inputPath,outputPath]=process.argv.slice(2);
  if(!inputPath||!outputPath?.endsWith('.json'))throw new Error('Usage: node scripts/check-endpoint-placement.mjs PROTOCOL.json NEW-OUTPUT.json');
  const root=fileURLToPath(new URL('../',import.meta.url));
  const local=path=>{const p=relative(root,resolve(path)).replaceAll('\\','/');if(p==='..'||p.startsWith('../')||p.includes(':'))throw new Error('Use project paths.');return p;};
  const protocolFile=local(inputPath),outputFile=local(outputPath);
  try{await access(resolve(root,outputFile));throw new Error('Output already exists; choose a new name.');}catch(e){if(e.code!=='ENOENT')throw e;}
  const p=JSON.parse(await readFile(resolve(root,protocolFile),'utf8'));
  assert.equal(p.status,'ready');assert.equal(p.tieBreak,'fifo');
  assert.deepEqual([p.selectedCase,p.width,p.height,p.start,p.radius,p.clearance,p.coarseBudget,p.fineBudget],
    [{trial:10,seed:20268037},9,7,[1,3],.4,.15,100,100]);
  assert.deepEqual(p.goals,[{id:'G-original',position:[7,3],aiExpectedEndpointValid:false},
    {id:'A-reference',position:[7,2],aiExpectedEndpointValid:true},{id:'B-control',position:[7,4],aiExpectedEndpointValid:false}]);
  assert.deepEqual(p.modes,['always-fine','quality-checked']);
  const prior=JSON.parse(await readFile(resolve(root,p.sourceValidation),'utf8'));
  const sources=['src/core.mjs','src/disk-footprint.mjs','src/resolution-policy.mjs','src/resolution-quality-policy.mjs',
    'scripts/resolution-cohort.mjs','scripts/run-scenario.mjs','scripts/check-current-position-detour.mjs','scripts/check-two-cell-doorway.mjs',
    'scripts/check-endpoint-placement.mjs',protocolFile,p.studentResponseRecord,p.sourceRaw,p.sourceValidation,p.selectedModel,prior.tests.path];
  const git=args=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
  if(git(['status','--porcelain','--',...sources]))throw new Error('Commit controls/source before execution.');
  const sha=b=>createHash('sha256').update(b).digest('hex'),hashes={};
  for(const file of sources){const blob=execFileSync('git',['show','HEAD:'+file],{cwd:root});
    assert.equal(sha(Buffer.from((await readFile(resolve(root,file),'utf8')).replace(/\r\n/g,'\n'))),sha(blob));hashes[file]=sha(blob);
    if(prior.sourceHashesGitBlobs[file])assert.equal(hashes[file],prior.sourceHashesGitBlobs[file]);}
  assert.equal(sha(await readFile(resolve(root,p.sourceRaw))),prior.raw.sha256);
  const source=JSON.parse(await readFile(resolve(root,p.sourceRaw),'utf8'));
  const old=source.records.find(r=>r.trial===p.selectedCase.trial);assert.equal(old.seed,p.selectedCase.seed);
  const obstacles=old.originalRows.flatMap((line,y)=>[...line].flatMap((v,x)=>v==='#'?[[x,y]]:[]));
  const records=[];
  for(const goal of p.goals){
    assert.equal(old.originalRows[goal.position[1]][goal.position[0]],'.');
    const map=makeMap(p.width,p.height,obstacles,p.start,goal.position);
    const references={coarse:referenceResolutionGraph(map,{...p,spacing:1}),fine:referenceResolutionGraph(map,{...p,spacing:.5})};
    assert.deepEqual(rowsOf(map),old.originalRows);
    for(const key of ['coarse','fine']){
      assert.deepEqual(references[key].rows,old.references[key].rows);
      assert.equal(references[key].endpointValid,goal.aiExpectedEndpointValid);
    }
    const policies={};
    for(const mode of p.modes){
      const out=mode==='always-fine'?resolveDiskResolution(map,{...p,mode}):resolveDiskResolutionQuality(map,p);
      const stages=out.stages.map((stage,i)=>{
        const refKey=stage.spacing===1?'coarse':'fine',ref=references[refKey],space=stage.outcome.configurationSpace;
        assert.deepEqual(rowsOf(space),ref.rows);assert.deepEqual(stage.outcome.invalidEndpoints,ref.invalidEndpoints);
        if(stage.outcome.status==='ROUTE_FOUND')assert.equal(stage.outcome.planningResult.pathLength,ref.bfsEdgeDistance);
        if(!ref.endpointValid){assert.equal(stage.outcome.status,'INVALID_ENDPOINT_CLEARANCE');assert.equal(stage.outcome.planningResult,null);}
        const {cells,...metadata}=space,outcome={...stage.outcome,configurationSpace:metadata};
        if(goal.id==='G-original')assert.deepEqual(outcome,old.policies[mode].stages[i].outcome);
        return {...stage,referenceKey:refKey,outcome};
      });
      const returnedSpacing=out.status==='ROUTE_FOUND'?(out.returnedSpacing??out.finalSpacing):null;
      const audit=out.status==='ROUTE_FOUND'?auditWorldPolyline(map,out.worldPath,p.radius+p.clearance):null;
      if(audit){assert.ok(audit.valid);assert.deepEqual(out.worldPath[0],[1.5,3.5]);assert.deepEqual(out.worldPath.at(-1),goal.position.map(v=>v+.5));}
      assert.equal(out.expanded,stages.reduce((n,s)=>n+(s.outcome.planningResult?.expanded??0),0));
      assert.equal(out.plannerCalls,stages.filter(s=>s.outcome.planningResult!==null).length);
      assert.ok(out.expanded<=out.maxExpansionsCap);assert.deepEqual(rowsOf(map),old.originalRows);
      policies[mode]={...out,returnedSpacing,stages,returnedWorldAudit:audit};
    }
    const x=goal.position[0]+.5,y=goal.position[1]+.5;
    let centerClearance=Math.min(x,y,p.width-x,p.height-y);
    for(const [ox,oy]of obstacles){const dx=Math.max(ox-x,x-ox-1,0),dy=Math.max(oy-y,y-oy-1,0);centerClearance=Math.min(centerClearance,Math.hypot(dx,dy));}
    assert.equal(centerClearance>p.radius+p.clearance,goal.aiExpectedEndpointValid);
    records.push({goalId:goal.id,goal:goal.position,goalCenterWorld:[x,y],goalCenterClearance:centerClearance,originalRows:rowsOf(map),references,policies});
  }
  const all=records.flatMap(r=>Object.values(r.policies));
  const output={schemaVersion:1,label:'AI REFERENCE ENDPOINT CONTROL; STUDENT DID NOT SELECT A GOAL',protocol:p,records,
    execution:{operator:'AI assistant CLI',executedAtUTC:new Date().toISOString(),sourceCommit:git(['rev-parse','HEAD']),sourceInputsDirty:false,
      sourceHashesGitBlobs:hashes,workspaceStatus:git(['status','--porcelain']),node:process.version,platform:`${process.platform}/${process.arch}`,
      newMapGeneration:0,archivedLayouts:1,endpointAssignments:3,policyEvaluations:all.length,
      plannerCalls:all.reduce((n,r)=>n+r.plannerCalls,0),examinedNodes:all.reduce((n,r)=>n+r.expanded,0),geometryStages:all.reduce((n,r)=>n+r.stages.length,0),
      referenceBfsCalls:records.reduce((n,r)=>n+Object.values(r.references).filter(s=>s.bfsPerformed).length,0),
      referencePointAudits:records.reduce((n,r)=>n+Object.values(r.references).reduce((a,s)=>a+s.candidatePointAudits,0),0),
      fullSuiteRerun:false,existingTests:prior.tests,provenance:p.attribution}};
  await mkdir(dirname(resolve(root,outputFile)),{recursive:true});await writeFile(resolve(root,outputFile),JSON.stringify(output,null,2)+'\n',{flag:'wx'});
  console.table(records.flatMap(r=>p.modes.map(mode=>({goal:r.goalId,mode,clearance:r.goalCenterClearance,status:r.policies[mode].status,
    length:r.policies[mode].geometricLength,examined:r.policies[mode].expanded,calls:r.policies[mode].plannerCalls}))));
  console.log(JSON.stringify(output.execution,null,2));
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
