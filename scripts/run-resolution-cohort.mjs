// AI-operated fixed-seed unfiltered paired cohort; no acceptance/replacement loop.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {resolve,relative,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {resolveDiskResolution} from '../src/resolution-policy.mjs';
import {generateResolutionMap,referenceResolutionGraph,summarizeResolutionCohort,rowsOf} from './resolution-cohort.mjs';
import {auditWorldPolyline} from './check-two-cell-doorway.mjs';

async function main(){
  const [inputPath,outputPath]=process.argv.slice(2);
  if(!inputPath||!outputPath?.endsWith('.json'))throw new Error('Usage: node scripts/run-resolution-cohort.mjs PROTOCOL.json NEW-OUTPUT.json');
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
  assert.equal(p.status,'ready');assert.equal(p.tieBreak,'fifo');
  assert.deepEqual([p.count,p.baseSeed,p.width,p.height,p.density,p.start,p.goal,p.radius,p.clearance,p.coarseBudget,p.fineBudget],
    [30,20267027,9,7,.15,[1,3],[7,3],.4,.15,100,100]);
  assert.deepEqual(p.modes,['always-fine','coarse-first']);
  const sources=['src/core.mjs','src/disk-footprint.mjs','src/resolution-policy.mjs',
    'scripts/resolution-cohort.mjs','scripts/run-resolution-cohort.mjs','scripts/run-scenario.mjs',
    'scripts/check-current-position-detour.mjs','scripts/check-two-cell-doorway.mjs',
    'test/resolution-cohort.test.mjs','data/footprint/resolution-cohort-tests-01.tap',
    protocolFile,p.selectedModel,p.studentChoiceRecord,p.priorPolicyValidation];
  const git=args=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
  if(git(['status','--porcelain','--',...sources]))throw new Error('Commit inputs and source before generation.');
  const sha=b=>createHash('sha256').update(b).digest('hex'),hashes={};
  for(const file of sources){
    const blob=execFileSync('git',['show','HEAD:'+file],{cwd:root});
    assert.equal(sha(Buffer.from((await readFile(resolve(root,file),'utf8')).replace(/\r\n/g,'\n'))),sha(blob));
    hashes[file]=sha(blob);
  }
  const model=JSON.parse(await readFile(resolve(root,p.selectedModel),'utf8'));
  assert.equal(model.radius,p.radius);assert.equal(model.clearance,p.clearance);
  const prior=JSON.parse(await readFile(resolve(root,p.priorPolicyValidation),'utf8'));
  for(const f of ['src/core.mjs','src/disk-footprint.mjs','src/resolution-policy.mjs'])assert.equal(hashes[f],prior.sourceHashesGitBlobs[f]);
  const records=[];
  for(let trial=1;trial<=p.count;trial++){
    const seed=p.baseSeed+trial,map=generateResolutionMap(seed,p),originalRows=rowsOf(map);
    const references={coarse:referenceResolutionGraph(map,{...p,spacing:1}),fine:referenceResolutionGraph(map,{...p,spacing:.5})};
    assert.deepEqual(references.coarse.invalidEndpoints,references.fine.invalidEndpoints);
    if(references.coarse.graphReachable){
      assert.equal(references.fine.graphReachable,true);
      assert.ok(references.fine.bfsEdgeDistance*.5<=references.coarse.bfsEdgeDistance);
    }
    const policies={};
    for(const mode of p.modes){
      const result=resolveDiskResolution(map,{...p,mode});
      const stages=result.stages.map(stage=>{
        const referenceKey=stage.spacing===1?'coarse':'fine',ref=references[referenceKey],space=stage.outcome.configurationSpace;
        assert.deepEqual(rowsOf(space),ref.rows);assert.deepEqual(stage.outcome.invalidEndpoints,ref.invalidEndpoints);
        let worldAudit=null;
        if(!ref.endpointValid){
          assert.equal(stage.outcome.status,'INVALID_ENDPOINT_CLEARANCE');assert.equal(stage.outcome.planningResult,null);
        }else{
          const search=stage.outcome.planningResult;assert.ok(search);assert.ok(search.expanded<=stage.maxExpansions);
          if(stage.outcome.status==='ROUTE_FOUND'){
            assert.equal(search.pathLength,ref.bfsEdgeDistance);
            assert.equal(stage.outcome.geometricLength,search.pathLength*stage.spacing);
            worldAudit=auditWorldPolyline(map,stage.outcome.worldPath,p.radius+p.clearance);assert.ok(worldAudit.valid);
            assert.deepEqual(stage.outcome.worldPath[0],p.start.map(v=>v+.5));
            assert.deepEqual(stage.outcome.worldPath.at(-1),p.goal.map(v=>v+.5));
          }else{
            assert.ok(['UNREACHABLE','BUDGET_EXCEEDED'].includes(stage.outcome.status));
            if(stage.outcome.status==='UNREACHABLE')assert.equal(ref.graphReachable,false);
            assert.deepEqual(search.path,[]);assert.equal(search.pathLength,null);
          }
        }
        if(stage.outcome.status!=='ROUTE_FOUND'){
          assert.deepEqual(stage.outcome.worldPath,[]);assert.equal(stage.outcome.geometricLength,null);
        }
        const {cells,...metadata}=space;
        return {...stage,referenceKey,outcome:{...stage.outcome,configurationSpace:metadata},originalWorldPathAudit:worldAudit};
      });
      assert.equal(result.status,stages.at(-1).outcome.status);
      assert.equal(result.expanded,stages.reduce((n,s)=>n+(s.outcome.planningResult?.expanded??0),0));
      assert.equal(result.plannerCalls,stages.filter(s=>s.outcome.planningResult!==null).length);
      assert.equal(result.maxExpansionsCap,mode==='always-fine'?100:200);
      assert.ok(result.expanded<=result.maxExpansionsCap);
      assert.equal(stages.length,mode==='coarse-first'&&stages[0].outcome.status==='UNREACHABLE'?2:1);
      assert.deepEqual(result.worldPath,stages.at(-1).outcome.worldPath);
      policies[mode]={...result,stages};
    }
    assert.deepEqual(rowsOf(map),originalRows);
    records.push({trial,seed,originalRows,references,policies});
  }
  assert.equal(records.length,p.count);
  const summary=summarizeResolutionCohort(records);
  const output={schemaVersion:1,label:'NEW UNFILTERED SYNTHETIC COHORT; NO PHYSICAL ROBOT',protocol:p,records,summary,
    execution:{operator:'AI assistant CLI',executedAtUTC:new Date().toISOString(),sourceCommit:git(['rev-parse','HEAD']),
      sourceInputsDirty:false,sourceHashesGitBlobs:hashes,workspaceStatus:git(['status','--porcelain']),node:process.version,
      platform:`${process.platform}/${process.arch}`,generatedMaps:records.length,rejectedMaps:0,policyEvaluations:records.length*p.modes.length,
      plannerCalls:p.modes.reduce((n,m)=>n+summary.modes[m].plannerCalls,0),
      examinedNodes:p.modes.reduce((n,m)=>n+summary.modes[m].totalExamined,0),
      geometryStages:p.modes.reduce((n,m)=>n+summary.modes[m].geometryStages,0),
      independentBfsCalls:records.reduce((n,r)=>n+Object.values(r.references).filter(s=>s.bfsPerformed).length,0),
      referencePointAudits:records.reduce((n,r)=>n+Object.values(r.references).reduce((a,s)=>a+s.candidatePointAudits,0),0),
      provenance:p.attribution}};
  await mkdir(dirname(resolve(root,outputFile)),{recursive:true});
  await writeFile(resolve(root,outputFile),JSON.stringify(output,null,2)+'\n',{flag:'wx'});
  console.table(p.modes.map(mode=>({mode,...summary.modes[mode].statusCounts,
    examined:summary.modes[mode].totalExamined,plannerCalls:summary.modes[mode].plannerCalls})));
  console.log(JSON.stringify({endpointValid:summary.endpointValidMaps,fineGraph:summary.fineGraph,jointSuccess:summary.jointSuccess,execution:output.execution},null,2));
  console.log(`Saved ${outputFile}`);
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
