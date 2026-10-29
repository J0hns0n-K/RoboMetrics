// AI-operated development-cohort replay; no new-map acquisition or baseline re-execution.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {resolve,relative,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {makeMap} from '../src/core.mjs';
import {resolveDiskResolutionQuality} from '../src/resolution-quality-policy.mjs';
import {rowsOf,RESOLUTION_STATUSES} from './resolution-cohort.mjs';
import {auditWorldPolyline} from './check-two-cell-doorway.mjs';

async function main(){
  const [inputPath,outputPath]=process.argv.slice(2);
  if(!inputPath||!outputPath?.endsWith('.json'))throw new Error('Usage: node scripts/replay-resolution-quality.mjs PROTOCOL.json NEW-OUTPUT.json');
  const root=fileURLToPath(new URL('../',import.meta.url));
  const local=path=>{const p=relative(root,resolve(path)).replaceAll('\\','/');
    if(p==='..'||p.startsWith('../')||p.includes(':'))throw new Error('Use project paths.');return p;};
  const protocolFile=local(inputPath),outputFile=local(outputPath);
  try{await access(resolve(root,outputFile));throw new Error('Output already exists; choose a new name.');}
  catch(e){if(e.code!=='ENOENT')throw e;}
  const p=JSON.parse(await readFile(resolve(root,protocolFile),'utf8'));
  assert.equal(p.status,'ready');assert.equal(p.tieBreak,'fifo');
  assert.deepEqual([p.count,p.radius,p.clearance,p.coarseBudget,p.fineBudget],[30,.4,.15,100,100]);
  assert.deepEqual(p.fallbackControl,{trial:12,seed:20267039,coarseBudget:100,fineBudget:1,
    scope:'Separate AI known-case control, outside30-map summary. Expect retained length8 and failed optimization, not completed optimality.'});
  const sources=['src/core.mjs','src/disk-footprint.mjs','src/resolution-policy.mjs','src/resolution-quality-policy.mjs',
    'scripts/resolution-cohort.mjs','scripts/replay-resolution-quality.mjs','scripts/run-scenario.mjs',
    'scripts/check-current-position-detour.mjs','scripts/check-two-cell-doorway.mjs','test/resolution-quality.test.mjs',
    'data/footprint/resolution-quality-tests-01.tap',protocolFile,p.sourceRaw,p.sourceValidation,p.selectedModel,p.studentChoiceRecord];
  const git=args=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
  if(git(['status','--porcelain','--',...sources]))throw new Error('Commit inputs and source before replay.');
  const sha=b=>createHash('sha256').update(b).digest('hex'),hashes={};
  for(const file of sources){const blob=execFileSync('git',['show','HEAD:'+file],{cwd:root});
    assert.equal(sha(Buffer.from((await readFile(resolve(root,file),'utf8')).replace(/\r\n/g,'\n'))),sha(blob));hashes[file]=sha(blob);}
  const source=JSON.parse(await readFile(resolve(root,p.sourceRaw),'utf8'));
  const validation=JSON.parse(await readFile(resolve(root,p.sourceValidation),'utf8'));
  assert.equal(sha(await readFile(resolve(root,p.sourceRaw))),validation.raw.sha256);
  for(const f of ['src/core.mjs','src/disk-footprint.mjs','src/resolution-policy.mjs'])assert.equal(hashes[f],validation.sourceHashesGitBlobs[f]);
  assert.equal(source.records.length,30);
  const run=(old,options)=>{
    const blocked=old.originalRows.flatMap((line,y)=>[...line].flatMap((v,x)=>v==='#'?[[x,y]]:[]));
    const map=makeMap(source.protocol.width,source.protocol.height,blocked,source.protocol.start,source.protocol.goal);
    const result=resolveDiskResolutionQuality(map,{...p,...options});
    const prior=old.policies['coarse-first'];
    const stages=result.stages.map((stage,i)=>{
      const refKey=stage.spacing===1?'coarse':'fine',ref=old.references[refKey],space=stage.outcome.configurationSpace;
      assert.deepEqual(rowsOf(space),ref.rows);
      const {cells,...metadata}=space,outcome={...stage.outcome,configurationSpace:metadata};
      if(stage.purpose==='ACQUISITION')assert.deepEqual(outcome,prior.stages[i].outcome);
      else if(stage.maxExpansions===100)assert.deepEqual(outcome,old.policies['always-fine'].stages[0].outcome);
      if(outcome.status==='ROUTE_FOUND')assert.equal(outcome.planningResult.pathLength,ref.bfsEdgeDistance);
      if(outcome.status==='BUDGET_EXCEEDED'){
        assert.deepEqual(outcome.planningResult.path,[]);assert.equal(outcome.planningResult.pathLength,null);
      }
      return {...stage,outcome,referenceKey:refKey};
    });
    const returnedWorldAudit=result.status==='ROUTE_FOUND'?auditWorldPolyline(map,result.worldPath,p.radius+p.clearance):null;
    if(returnedWorldAudit){
      assert.ok(returnedWorldAudit.valid);
      const ref=result.returnedSpacing===1?old.references.coarse:old.references.fine;
      assert.equal(result.geometricLength,ref.bfsEdgeDistance*result.returnedSpacing);
    }
    assert.equal(result.expanded,stages.reduce((n,s)=>n+(s.outcome.planningResult?.expanded??0),0));
    assert.equal(result.plannerCalls,stages.filter(s=>s.outcome.planningResult!==null).length);
    assert.ok(stages.length<=2);assert.ok(result.expanded<=result.maxExpansionsCap);
    assert.deepEqual(rowsOf(map),old.originalRows);
    return {trial:old.trial,seed:old.seed,originalRows:old.originalRows,references:old.references,
      result:{...result,stages},returnedWorldAudit};
  };
  const records=source.records.map((old,i)=>{assert.equal(old.trial,i+1);return run(old,{});});
  const controlSource=source.records.find(r=>r.trial===p.fallbackControl.trial);
  assert.equal(controlSource.seed,p.fallbackControl.seed);
  const fallbackControl=run(controlSource,{coarseBudget:100,fineBudget:1});
  assert.equal(fallbackControl.result.status,'ROUTE_FOUND');assert.equal(fallbackControl.result.optimizationStatus,'BUDGET_EXCEEDED');
  assert.equal(fallbackControl.result.geometricLength,8);assert.equal(fallbackControl.result.expanded,13);
  const statusCounts=Object.fromEntries(RESOLUTION_STATUSES.map(s=>[s,0])),optimizationStatusCounts={},routeSourceCounts={};
  for(const r of records){statusCounts[r.result.status]++;optimizationStatusCounts[r.result.optimizationStatus]=(optimizationStatusCounts[r.result.optimizationStatus]??0)+1;
    routeSourceCounts[r.result.routeSource]=(routeSourceCounts[r.result.routeSource]??0)+1;}
  const successes=records.filter(r=>r.result.status==='ROUTE_FOUND');
  const improved=records.filter(r=>r.result.optimizationImproved);
  const summary={reusedMaps:30,newMaps:0,statusCounts,optimizationStatusCounts,routeSourceCounts,
    optimizationAttempts:records.filter(r=>r.result.optimizationAttempted).length,
    optimizedShorterMaps:improved.map(r=>r.trial),successfulMapDenominator:successes.length,
    meanWorldLengthOnSuccesses:successes.length?successes.reduce((n,r)=>n+r.result.geometricLength,0)/successes.length:null,
    totalExamined:records.reduce((n,r)=>n+r.result.expanded,0),plannerCalls:records.reduce((n,r)=>n+r.result.plannerCalls,0),
    geometryStages:records.reduce((n,r)=>n+r.result.stages.length,0),
    archivedComparators:{raw:p.sourceRaw,summary:source.summary}};
  const all=[...records,fallbackControl];
  const output={schemaVersion:1,label:'DEVELOPMENT-COHORT REPLAY AND SEPARATE FALLBACK CONTROL; NO NEW MAPS',protocol:p,records,summary,
    separateControls:[{id:'optimization-budget1-fallback',...fallbackControl}],
    execution:{operator:'AI assistant CLI',executedAtUTC:new Date().toISOString(),sourceCommit:git(['rev-parse','HEAD']),
      sourceInputsDirty:false,sourceHashesGitBlobs:hashes,workspaceStatus:git(['status','--porcelain']),node:process.version,
      platform:`${process.platform}/${process.arch}`,newMaps:0,replayedMaps:30,separateKnownControls:1,
      policyEvaluations:31,plannerCalls:all.reduce((n,r)=>n+r.result.plannerCalls,0),
      examinedNodes:all.reduce((n,r)=>n+r.result.expanded,0),geometryStages:all.reduce((n,r)=>n+r.result.stages.length,0),
      newBfsCalls:0,referenceScope:'Archived validated masks/BFS labels reused; independent follow-up validation counted separately.',provenance:p.attribution}};
  await mkdir(dirname(resolve(root,outputFile)),{recursive:true});
  await writeFile(resolve(root,outputFile),JSON.stringify(output,null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({summary,control:{status:fallbackControl.result.status,optimization:fallbackControl.result.optimizationStatus,
    returnedSpacing:fallbackControl.result.returnedSpacing,lastSpacing:fallbackControl.result.finalSpacing,
    length:fallbackControl.result.geometricLength,examined:fallbackControl.result.expanded},execution:output.execution},null,2));
  console.log(`Saved ${outputFile}`);
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
