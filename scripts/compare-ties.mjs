// AI-authored controlled comparison on the original, already committed map cohorts.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {resolve,dirname,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {makeMap,randomMap,plan,verifyPath} from '../src/core.mjs';

const mean=values=>values.length?values.reduce((a,b)=>a+b,0)/values.length:null;
const metrics=(r,referenceLength)=>({success:r.success,reason:r.reason,pathLength:r.pathLength,expanded:r.expanded,
  relativeLength:r.success?r.pathLength/referenceLength:null});
const summarize=rows=>{
  const ok=rows.filter(r=>r.success);
  return {successes:ok.length,denominator:rows.length,meanExpandedAll:mean(rows.map(r=>r.expanded)),
    meanMovesSuccessOnly:mean(ok.map(r=>r.pathLength)),lengthDenominator:ok.length};
};

export function compareTies(baseline){
  const conditions=[],maps=new Map(),caseReports=[];
  let compatibilityPolicyChecks=0,astarRuns=0;
  for(const original of baseline.conditions){
    const config=original.configuration;
    const rows=[];
    let selectedExample=false;
    for(const row of original.rows){
      const mapKey=`${config.density}:${row.seed}`;
      if(!maps.has(mapKey)){
        const map=randomMap(row.seed,config.width,config.height,config.density);
        const reference=plan(map,'dijkstra');
        assert.ok(reference.success&&verifyPath(map,reference.path));
        maps.set(mapKey,{map,reference});
      }
      const {map,reference}=maps.get(mapKey);
      assert.equal(reference.pathLength,row.referenceLength);
      const fifo=plan(map,'astar',config.maxExpansions);
      const closerGoal=plan(map,'astar',config.maxExpansions,{tieBreak:'closer-goal'});
      const greedy=plan(map,'greedy',config.maxExpansions);
      assert.deepEqual(metrics(fifo,row.referenceLength),row.results.astar,'Default A* changed from baseline');
      assert.deepEqual(metrics(greedy,row.referenceLength),row.results.greedy,'Greedy changed from baseline');
      compatibilityPolicyChecks+=2;astarRuns+=2;
      for(const result of [fifo,closerGoal,greedy]){
        assert.ok(result.expanded<=config.maxExpansions);
        if(result.success)assert.ok(verifyPath(map,result.path));
        else assert.equal(result.reason,'BUDGET_EXCEEDED');
      }
      for(const result of [fifo,closerGoal])if(result.success)assert.equal(result.pathLength,row.referenceLength);
      rows.push({trial:row.trial,seed:row.seed,referenceLength:row.referenceLength,
        fifo:metrics(fifo,row.referenceLength),closerGoal:metrics(closerGoal,row.referenceLength),greedyReference:metrics(greedy,row.referenceLength)});
      if(!selectedExample&&(fifo.success!==closerGoal.success||fifo.expanded!==closerGoal.expanded)){
        caseReports.push({selection:'AI post-hoc first differing trial per condition; not an independent sample',
          configuration:config,seed:row.seed,fifo,closerGoal,reference});
        selectedExample=true;
      }
    }
    const both=rows.filter(r=>r.fifo.success&&r.closerGoal.success);
    conditions.push({configuration:config,summary:{fifo:summarize(rows.map(r=>r.fifo)),closerGoal:summarize(rows.map(r=>r.closerGoal))},
      paired:{denominator:rows.length,commonSuccesses:both.length,
        successGains:rows.filter(r=>!r.fifo.success&&r.closerGoal.success).length,
        successLosses:rows.filter(r=>r.fifo.success&&!r.closerGoal.success).length,
        meanSavedExpansionsAll:mean(rows.map(r=>r.fifo.expanded-r.closerGoal.expanded)),
        meanSavedExpansionsCommonSuccess:mean(both.map(r=>r.fifo.expanded-r.closerGoal.expanded)),
        commonSuccessPathLengthDifferences:both.filter(r=>r.fifo.pathLength!==r.closerGoal.pathLength).length},rows});
  }
  const control=makeMap(3,3,[[1,1]]);
  return {schemaVersion:1,label:'AI-IMPLEMENTED A* TIE-BREAK COMPARISON — SYNTHETIC GRID ONLY',conditions,caseReports,
    smallControl:{rows:['S..','.#.','..G'],fifo:plan(control,'astar'),closerGoal:plan(control,'astar',Infinity,{tieBreak:'closer-goal'})},
    counts:{densitySpecificCohortEntries:maps.size,pairedMapBudgetConditions:astarRuns/2,astarVariantRuns:astarRuns,
      greedyCompatibilityReplays:astarRuns/2,dijkstraReferenceChecks:maps.size,
      defaultPolicyCompatibilityChecks:compatibilityPolicyChecks},
    limitations:['Same fixed reachable-only cohorts as baseline; no new independent maps.',
      'Node expansions are not runtime or energy. Budgeted means include capped failures; use ample-budget comparisons for completed searches.',
      'Both rules retain f=g+h as the primary score; the alternative only changes equal-f ordering.',
      'Tie-breaking is established, not a claimed new algorithm. Cohort-specific findings do not guarantee universal gains.']};
}

export function comparisonCsv(result){
  const rows=[['density','budget','n','fifo_successes','closer_goal_successes','fifo_mean_expanded_all',
    'closer_goal_mean_expanded_all','success_gains','success_losses','common_success_n','common_path_length_differences']];
  for(const c of result.conditions)rows.push([c.configuration.density,c.configuration.maxExpansions,c.rows.length,
    c.summary.fifo.successes,c.summary.closerGoal.successes,c.summary.fifo.meanExpandedAll,c.summary.closerGoal.meanExpandedAll,
    c.paired.successGains,c.paired.successLosses,c.paired.commonSuccesses,c.paired.commonSuccessPathLengthDifferences]);
  return rows.map(row=>row.join(',')).join('\n')+'\n';
}

async function main(){
  const [protocolPath,outputPath,operator='unspecified']=process.argv.slice(2);
  if(!protocolPath||!outputPath?.endsWith('.json'))throw new Error('Usage: node scripts/compare-ties.mjs PROTOCOL.json OUTPUT.json [DECLARED_OPERATOR]');
  const root=fileURLToPath(new URL('../',import.meta.url));
  const git=args=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
  const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
  const protocolBytes=await readFile(resolve(protocolPath));
  const protocol=JSON.parse(protocolBytes);
  const baselineBytes=await readFile(new URL('../'+protocol.baselineMatrix,import.meta.url));
  const baseline=JSON.parse(baselineBytes);
  assert.equal(baseline.execution.sourceCommit,protocol.baselineSourceCommit);
  const sourcePaths=['src/core.mjs','scripts/compare-ties.mjs',relative(root,resolve(protocolPath)).replaceAll('\\','/'),protocol.baselineMatrix];
  const experimentInputsDirty=Boolean(git(['diff','--name-only','HEAD','--',...sourcePaths]));
  if(experimentInputsDirty)throw new Error('Commit experiment inputs before comparison');
  const sourceCommit=git(['rev-parse','HEAD']);
  const workspaceStatus=git(['status','--porcelain','--untracked-files=all']);
  const result=compareTies(baseline);
  result.protocol=protocol;
  result.execution={timestamp:new Date().toISOString(),sourceCommit,workspaceDirty:Boolean(workspaceStatus),workspaceStatus,
    experimentInputsDirty,declaredOperator:operator,studentExecutionIndependentlyVerified:false,node:process.version,
    platform:`${process.platform}/${process.arch}`,protocolSha256:sha(protocolBytes),baselineMatrixSha256:sha(baselineBytes),
    coreSha256:sha(await readFile(new URL('../src/core.mjs',import.meta.url))),runnerSha256:sha(await readFile(new URL(import.meta.url)))};
  await mkdir(dirname(resolve(outputPath)),{recursive:true});
  await writeFile(resolve(outputPath),JSON.stringify(result,null,2)+'\n',{flag:'wx'});
  await writeFile(resolve(outputPath.replace(/\.json$/,'.csv')),comparisonCsv(result),{flag:'wx'});
  console.table(result.conditions.map(c=>({density:c.configuration.density,budget:c.configuration.maxExpansions,
    fifoSuccess:c.summary.fifo.successes,goalSuccess:c.summary.closerGoal.successes,
    fifoExpanded:c.summary.fifo.meanExpandedAll,goalExpanded:c.summary.closerGoal.meanExpandedAll,
    gains:c.paired.successGains,losses:c.paired.successLosses})));
  console.log(`Saved ${outputPath}; source ${sourceCommit}; experimentInputsDirty=${experimentInputsDirty}`);
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  main().catch(error=>{console.error(error.message);process.exitCode=1;});
}
