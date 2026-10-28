// AI-authored experiment orchestration; original planner and benchmark are unchanged.
import assert from 'node:assert/strict';
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {benchmark, randomMap, plan} from '../src/core.mjs';

const mean = values => values.length ? values.reduce((sum,n)=>sum+n,0)/values.length : null;

export function auditSampling(configuration, rows) {
  const {seed, runs, width, height, density} = configuration;
  assert.equal(rows.length, runs);
  const lastSeed = rows.at(-1).seed;
  assert.ok(Number.isInteger(lastSeed) && lastSeed > seed && lastSeed-seed <= runs*150+1);
  const accepted = [], rejectedSeeds = [];
  for (let candidateSeed=seed+1; candidateSeed<=lastSeed; candidateSeed++) {
    const reference=plan(randomMap(candidateSeed,width,height,density),'dijkstra');
    if (reference.success) accepted.push({seed:candidateSeed, referenceLength:reference.pathLength});
    else rejectedSeeds.push(candidateSeed);
  }
  assert.deepEqual(accepted,rows.map(row=>({seed:row.seed,referenceLength:row.referenceLength})),
    'Accepted maps differ from the documented rejection-sampling stream');
  return {density, candidatesExamined:lastSeed-seed, acceptedCount:accepted.length,
    rejectedCount:rejectedSeeds.length, acceptedSeeds:accepted.map(row=>row.seed), rejectedSeeds,
    sampling:'Reachable-only rejection sample; candidate seed starts at base seed + 1'};
}

export function analyzeRows(rows) {
  const policies = {};
  for (const algorithm of ['astar','greedy']) {
    const successes=rows.filter(row=>row.results[algorithm].success);
    const optimal=successes.filter(row=>row.results[algorithm].pathLength===row.referenceLength);
    policies[algorithm]={successes:successes.length,successDenominator:rows.length,
      lengthDenominator:successes.length,optimalWithinBudget:optimal.length,
      optimalWithinBudgetDenominator:rows.length};
  }
  const both=rows.filter(row=>row.results.astar.success && row.results.greedy.success);
  return {policies,pairedSuccess:{denominator:both.length,
    meanAstarMoves:mean(both.map(row=>row.results.astar.pathLength)),
    meanGreedyMoves:mean(both.map(row=>row.results.greedy.pathLength)),
    meanGreedyMinusAstarMoves:mean(both.map(row=>row.results.greedy.pathLength-row.results.astar.pathLength)),
    greedyLongerCount:both.filter(row=>row.results.greedy.pathLength>row.results.astar.pathLength).length,
    equalLengthCount:both.filter(row=>row.results.greedy.pathLength===row.results.astar.pathLength).length}};
}

export function runMatrix(protocol) {
  const {seed,runs,width,height,densities,budgets} = protocol;
  assert.ok(Number.isSafeInteger(seed) && seed>=1 && seed<=1e9);
  assert.ok(Number.isInteger(runs) && runs>=1 && runs<=250);
  assert.ok(Number.isInteger(width) && width>=2 && width<=80);
  assert.ok(Number.isInteger(height) && height>=2 && height<=80);
  assert.ok(Array.isArray(densities) && densities.length>=1 && densities.length<=10);
  assert.ok(densities.every(n=>Number.isFinite(n)&&n>=0&&n<=.65));
  assert.equal(new Set(densities).size,densities.length);
  assert.ok(Array.isArray(budgets) && budgets.length>=1 && budgets.length<=20);
  assert.ok(budgets.every(n=>Number.isInteger(n)&&n>=1&&n<=6400));
  assert.equal(new Set(budgets).size,budgets.length);
  const cohorts=[], conditions=[];
  for (const density of densities) {
    let expectedRows=null;
    for (const maxExpansions of budgets) {
      const batch=benchmark({seed,runs,width,height,density,maxExpansions});
      const identities=batch.rows.map(row=>({seed:row.seed,referenceLength:row.referenceLength}));
      if (!expectedRows) {
        cohorts.push(auditSampling(batch.configuration,batch.rows));
        expectedRows=identities;
      } else assert.deepEqual(identities,expectedRows,'Budgets must share exactly the same maps');
      assert.ok(batch.rows.every(row=>Object.values(row.results).every(r=>r.success || r.reason==='BUDGET_EXCEEDED')),
        'Reachable-only cohort unexpectedly produced an unreachable result');
      conditions.push({...batch,analysis:analyzeRows(batch.rows)});
    }
  }
  return {schemaVersion:1,label:'SYNTHETIC GRID MATRIX — NOT PHYSICAL ROBOT DATA',protocol,cohorts,conditions,
    counts:{densitySpecificCohortEntries:cohorts.reduce((n,c)=>n+c.acceptedCount,0),
      pairedMapBudgetConditions:conditions.reduce((n,c)=>n+c.rows.length,0),
      policyRuns:conditions.reduce((n,c)=>n+c.rows.length*2,0)},
    limitations:[
      'Only solvable maps are retained; rejected counts and seeds are recorded.',
      'Within one density, both policies and every budget share the accepted maps.',
      'Accepted cohorts can differ across densities; do not treat density comparisons as identical-map pairs.',
      'Budgets reuse maps and are not independent samples. Density-specific cohorts use a common candidate seed stream.',
      'Original path means condition on each policy succeeding; pairedSuccess uses only maps where both succeed.',
      'Node expansions are not runtime, energy use, physical reliability or original algorithm invention.'
    ]};
}

export function summaryCsv(result) {
  const rows=[['density','budget','n_maps','astar_success','greedy_success','astar_mean_moves_success_only',
    'astar_length_n','greedy_mean_moves_success_only','greedy_length_n','astar_mean_expanded_all',
    'greedy_mean_expanded_all','paired_success_n','paired_mean_greedy_minus_astar_moves',
    'astar_optimal_within_budget','greedy_optimal_within_budget']];
  for (const c of result.conditions) rows.push([c.configuration.density,c.configuration.maxExpansions,
    c.rows.length,c.analysis.policies.astar.successes,c.analysis.policies.greedy.successes,
    c.summary.astar.meanPathLength,c.analysis.policies.astar.lengthDenominator,
    c.summary.greedy.meanPathLength,c.analysis.policies.greedy.lengthDenominator,
    c.summary.astar.meanExpanded,c.summary.greedy.meanExpanded,
    c.analysis.pairedSuccess.denominator,c.analysis.pairedSuccess.meanGreedyMinusAstarMoves,
    c.analysis.policies.astar.optimalWithinBudget,c.analysis.policies.greedy.optimalWithinBudget]);
  return rows.map(row=>row.map(value=>value===null?'':String(value)).join(',')).join('\n')+'\n';
}

async function main() {
  const [protocolPath,outputPath,operator='unspecified'] = process.argv.slice(2);
  if(!protocolPath || !outputPath || !outputPath.endsWith('.json'))
    throw new Error('Usage: node scripts/run-matrix.mjs PROTOCOL.json OUTPUT.json [DECLARED_OPERATOR]');
  const root=fileURLToPath(new URL('../',import.meta.url));
  const git=args=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
  const sha256=bytes=>createHash('sha256').update(bytes).digest('hex');
  const protocolBytes=await readFile(resolve(protocolPath));
  const sourceCommit=git(['rev-parse','HEAD']);
  const workspaceDirty=Boolean(git(['status','--porcelain','--untracked-files=all']));
  const result=runMatrix(JSON.parse(protocolBytes));
  result.execution={timestamp:new Date().toISOString(),sourceCommit,workspaceDirty,
    declaredOperator:operator,studentExecutionIndependentlyVerified:false,node:process.version,
    platform:`${process.platform}/${process.arch}`,protocolSha256:sha256(protocolBytes),
    coreSha256:sha256(await readFile(new URL('../src/core.mjs',import.meta.url))),
    matrixRunnerSha256:sha256(await readFile(new URL(import.meta.url)))};
  await mkdir(dirname(resolve(outputPath)),{recursive:true});
  await writeFile(resolve(outputPath),JSON.stringify(result,null,2)+'\n',{flag:'wx'});
  await writeFile(resolve(outputPath.replace(/\.json$/,'.csv')),summaryCsv(result),{flag:'wx'});
  console.log(`Saved ${outputPath}; source ${sourceCommit}; dirty=${workspaceDirty}; operator=${operator}`);
  console.table(result.conditions.map(c=>({density:c.configuration.density,budget:c.configuration.maxExpansions,
    n:c.rows.length,astarSuccess:c.analysis.policies.astar.successes,
    greedySuccess:c.analysis.policies.greedy.successes,pairedSuccess:c.analysis.pairedSuccess.denominator,
    pairedExtraGreedyMoves:c.analysis.pairedSuccess.meanGreedyMinusAstarMoves})));
}

if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  main().catch(error=>{console.error(error.message);process.exitCode=1;});
}
