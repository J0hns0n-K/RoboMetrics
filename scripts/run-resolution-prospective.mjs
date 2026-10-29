// AI-operated prospective fixed-input comparison; policy/generator source is frozen separately.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {resolve,relative,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {resolveDiskResolution} from '../src/resolution-policy.mjs';
import {resolveDiskResolutionQuality} from '../src/resolution-quality-policy.mjs';
import {generateResolutionMap,referenceResolutionGraph,rowsOf} from './resolution-cohort.mjs';
import {summarizeProspective} from './resolution-comparison.mjs';
import {auditWorldPolyline} from './check-two-cell-doorway.mjs';

async function main(){
  const [inputPath,outputPath]=process.argv.slice(2);
  if(!inputPath||!outputPath?.endsWith('.json'))throw new Error('Usage: node scripts/run-resolution-prospective.mjs PROTOCOL.json NEW-OUTPUT.json');
  const root=fileURLToPath(new URL('../',import.meta.url));
  const local=path=>{const p=relative(root,resolve(path)).replaceAll('\\','/');
    if(p==='..'||p.startsWith('../')||p.includes(':'))throw new Error('Use project paths.');return p;};
  const protocolFile=local(inputPath),outputFile=local(outputPath);
  try{await access(resolve(root,outputFile));throw new Error('Output already exists; choose a new name.');}catch(e){if(e.code!=='ENOENT')throw e;}
  const p=JSON.parse(await readFile(resolve(root,protocolFile),'utf8'));
  assert.equal(p.status,'ready');
  assert.deepEqual([p.count,p.baseSeed,p.width,p.height,p.density,p.start,p.goal,p.radius,p.clearance,p.tieBreak,p.coarseBudget,p.fineBudget],
    [30,20268027,9,7,.15,[1,3],[7,3],.4,.15,'fifo',100,100]);
  assert.deepEqual(p.modes,['always-fine','quality-checked']);
  const git=args=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
  const frozen=JSON.parse(execFileSync('git',['show',p.inputsFrozenCommit+':'+protocolFile],{cwd:root,encoding:'utf8'}));
  for(const key of ['count','baseSeed','width','height','density','start','goal','radius','clearance','tieBreak','coarseBudget','fineBudget','modes','fixedSourceHashesGitBlobs'])assert.deepEqual(p[key],frozen[key]);
  const sources=[...Object.keys(p.fixedSourceHashesGitBlobs),'scripts/resolution-comparison.mjs','scripts/run-resolution-prospective.mjs',
    'scripts/run-scenario.mjs','scripts/check-current-position-detour.mjs','scripts/check-two-cell-doorway.mjs',
    'test/resolution-comparison.test.mjs','data/footprint/resolution-prospective-tests-01.tap',
    protocolFile,p.criterionRecord,p.studentPredictionRecord,p.priorCodeValidation,p.selectedModel];
  if(git(['status','--porcelain','--',...sources]))throw new Error('Commit source, fixed inputs and prediction before target generation.');
  const sha=b=>createHash('sha256').update(b).digest('hex'),hashes={};
  for(const file of sources){const blob=execFileSync('git',['show','HEAD:'+file],{cwd:root});
    assert.equal(sha(Buffer.from((await readFile(resolve(root,file),'utf8')).replace(/\r\n/g,'\n'))),sha(blob));hashes[file]=sha(blob);
    if(p.fixedSourceHashesGitBlobs[file])assert.equal(hashes[file],p.fixedSourceHashesGitBlobs[file]);}
  const prediction=JSON.parse(await readFile(resolve(root,p.studentPredictionRecord),'utf8'));assert.equal(prediction.studentResponseVerbatim,'2');
  const model=JSON.parse(await readFile(resolve(root,p.selectedModel),'utf8'));assert.equal(model.radius,p.radius);assert.equal(model.clearance,p.clearance);
  const records=[];
  for(let trial=1;trial<=p.count;trial++){
    const seed=p.baseSeed+trial,map=generateResolutionMap(seed,p),originalRows=rowsOf(map);
    const references={coarse:referenceResolutionGraph(map,{...p,spacing:1}),fine:referenceResolutionGraph(map,{...p,spacing:.5})};
    assert.deepEqual(references.coarse.invalidEndpoints,references.fine.invalidEndpoints);
    const policies={};
    for(const mode of p.modes){
      const raw=mode==='always-fine'?resolveDiskResolution(map,{...p,mode}):resolveDiskResolutionQuality(map,p);
      const stages=raw.stages.map(stage=>{
        const referenceKey=stage.spacing===1?'coarse':'fine',ref=references[referenceKey],space=stage.outcome.configurationSpace,o=stage.outcome;
        assert.deepEqual(rowsOf(space),ref.rows);assert.deepEqual(o.invalidEndpoints,ref.invalidEndpoints);
        let worldAudit=null;
        if(!ref.endpointValid){assert.equal(o.status,'INVALID_ENDPOINT_CLEARANCE');assert.equal(o.planningResult,null);}
        else if(o.status==='ROUTE_FOUND'){
          assert.equal(o.planningResult.pathLength,ref.bfsEdgeDistance);assert.equal(o.geometricLength,ref.bfsEdgeDistance*stage.spacing);
          worldAudit=auditWorldPolyline(map,o.worldPath,p.radius+p.clearance);assert.ok(worldAudit.valid);
        }else{
          assert.ok(['UNREACHABLE','BUDGET_EXCEEDED'].includes(o.status));
          if(o.status==='UNREACHABLE')assert.equal(ref.graphReachable,false);
          if(o.status==='BUDGET_EXCEEDED')assert.equal(o.planningResult.expanded,stage.maxExpansions);
          assert.deepEqual(o.planningResult.path,[]);assert.equal(o.planningResult.pathLength,null);
        }
        if(o.status!=='ROUTE_FOUND'){assert.deepEqual(o.worldPath,[]);assert.equal(o.geometricLength,null);}
        const {cells,...metadata}=space;
        return {...stage,referenceKey,outcome:{...o,configurationSpace:metadata},originalWorldPathAudit:worldAudit};
      });
      const returnedSpacing=raw.status==='ROUTE_FOUND'?(raw.returnedSpacing??raw.finalSpacing):null;
      const returnedWorldAudit=raw.status==='ROUTE_FOUND'?auditWorldPolyline(map,raw.worldPath,p.radius+p.clearance):null;
      if(returnedWorldAudit){
        assert.ok(returnedWorldAudit.valid);const ref=returnedSpacing===1?references.coarse:references.fine;
        assert.equal(raw.geometricLength,ref.bfsEdgeDistance*returnedSpacing);
        assert.deepEqual(raw.worldPath[0],[1.5,3.5]);assert.deepEqual(raw.worldPath.at(-1),[7.5,3.5]);
      }
      assert.equal(raw.expanded,stages.reduce((n,s)=>n+(s.outcome.planningResult?.expanded??0),0));
      assert.equal(raw.plannerCalls,stages.filter(s=>s.outcome.planningResult!==null).length);
      assert.equal(raw.maxExpansionsCap,mode==='always-fine'?100:200);assert.ok(raw.expanded<=raw.maxExpansionsCap);assert.ok(stages.length<=2);
      policies[mode]={...raw,returnedSpacing,stages,returnedWorldAudit};
    }
    assert.deepEqual(rowsOf(map),originalRows);records.push({trial,seed,originalRows,references,policies});
  }
  const summary=summarizeProspective(records),lower=summary.equalLengthWork.lowerTotalMode;
  const predictionAssessment={record:p.studentPredictionRecord,expectedMode:'quality-checked',equalLengthMapCount:summary.equalLengthWork.denominator,
    observedLowerTotalMode:lower,outcome:lower===null?'UNAVAILABLE':lower==='tie'?'TIE':lower==='quality-checked'?'SUPPORTED_ON_THIS_CONDITION':'NOT_SUPPORTED_ON_THIS_CONDITION'};
  const output={schemaVersion:1,label:'PROSPECTIVE NEW SEED CONDITION WITH PRE-GENERATION PREDICTION; SYNTHETIC ONLY',protocol:p,records,summary,predictionAssessment,
    execution:{operator:'AI assistant CLI',executedAtUTC:new Date().toISOString(),sourceCommit:git(['rev-parse','HEAD']),inputsFrozenCommit:p.inputsFrozenCommit,
      sourceInputsDirty:false,sourceHashesGitBlobs:hashes,workspaceStatus:git(['status','--porcelain']),node:process.version,platform:`${process.platform}/${process.arch}`,
      generatedMaps:records.length,rejectedMaps:0,policyEvaluations:records.length*p.modes.length,
      plannerCalls:p.modes.reduce((n,m)=>n+summary.modes[m].plannerCalls,0),examinedNodes:p.modes.reduce((n,m)=>n+summary.modes[m].totalExamined,0),
      geometryStages:p.modes.reduce((n,m)=>n+summary.modes[m].geometryStages,0),
      referenceBfsCalls:records.reduce((n,r)=>n+Object.values(r.references).filter(s=>s.bfsPerformed).length,0),
      referencePointAudits:records.reduce((n,r)=>n+Object.values(r.references).reduce((a,s)=>a+s.candidatePointAudits,0),0),
      provenance:'Student predicts quality-checked lower work on equal-length joint successes. AI supplies exact fixed inputs, code/tests, operation and analysis; no tuning after outcomes.'}};
  await mkdir(dirname(resolve(root,outputFile)),{recursive:true});
  await writeFile(resolve(root,outputFile),JSON.stringify(output,null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({summary,predictionAssessment,execution:output.execution},null,2));console.log(`Saved ${outputFile}`);
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
