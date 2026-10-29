// AI formalization of the guided accepted criterion, separate from planner behavior.
import {RESOLUTION_STATUSES} from './resolution-cohort.mjs';
const modes=['always-fine','quality-checked'];
const mean=a=>a.length?a.reduce((n,v)=>n+v,0)/a.length:null;

export function compareValidRoutes(first,second){
  if(first.status!=='ROUTE_FOUND'||second.status!=='ROUTE_FOUND')return {winner:'not-comparable',reason:'REQUIRES_TWO_VALID_ROUTES'};
  for(const r of [first,second]){
    if(!Number.isFinite(r.geometricLength)||r.geometricLength<0||!Number.isSafeInteger(r.expanded)||r.expanded<0)throw new Error('Invalid comparable metrics.');
  }
  if(first.geometricLength!==second.geometricLength)return {winner:first.geometricLength<second.geometricLength?'first':'second',reason:'WORLD_LENGTH'};
  if(first.expanded!==second.expanded)return {winner:first.expanded<second.expanded?'first':'second',reason:'EXAMINED_WORK'};
  return {winner:'tie',reason:'EQUAL_LENGTH_AND_WORK'};
}

export function summarizeProspective(records){
  if(!Array.isArray(records)||!records.length)throw new Error('Need nonempty cohort.');
  const valid=records.filter(r=>r.references.fine.endpointValid);
  const summary={mapCount:records.length,endpointValidMaps:valid.length,endpointInvalidMaps:records.length-valid.length,
    fineGraph:{reachable:valid.filter(r=>r.references.fine.graphReachable).length,
      unreachable:valid.filter(r=>!r.references.fine.graphReachable).length,notClassifiedInvalidEndpoints:records.length-valid.length},modes:{}};
  for(const mode of modes){
    const counts=Object.fromEntries(RESOLUTION_STATUSES.map(s=>[s,0]));
    for(const r of records){if(!RESOLUTION_STATUSES.includes(r.policies[mode].status))throw new Error('Unknown status.');counts[r.policies[mode].status]++;}
    const successes=records.filter(r=>r.policies[mode].status==='ROUTE_FOUND');
    summary.modes[mode]={denominator:records.length,statusCounts:counts,successfulMaps:successes.length,
      totalExamined:records.reduce((n,r)=>n+r.policies[mode].expanded,0),
      plannerCalls:records.reduce((n,r)=>n+r.policies[mode].plannerCalls,0),geometryStages:records.reduce((n,r)=>n+r.policies[mode].stages.length,0),
      endpointValidDenominator:valid.length,meanExaminedEndpointValid:mean(valid.map(r=>r.policies[mode].expanded)),
      worldLength:{successfulMapDenominator:successes.length,mean:mean(successes.map(r=>r.policies[mode].geometricLength))}};
  }
  const joint=records.filter(r=>modes.every(m=>r.policies[m].status==='ROUTE_FOUND'));
  const equal=joint.filter(r=>r.policies[modes[0]].geometricLength===r.policies[modes[1]].geometricLength);
  const totals=Object.fromEntries(modes.map(m=>[m,equal.length?equal.reduce((n,r)=>n+r.policies[m].expanded,0):null]));
  summary.jointSuccess={denominator:joint.length,trialIds:joint.map(r=>r.trial),
    worldLengthMeanByMode:Object.fromEntries(modes.map(m=>[m,mean(joint.map(r=>r.policies[m].geometricLength))])),
    unequalLengthCases:joint.filter(r=>!equal.includes(r)).map(r=>({trial:r.trial,seed:r.seed,
      lengths:Object.fromEntries(modes.map(m=>[m,r.policies[m].geometricLength]))}))};
  summary.equalLengthWork={denominator:equal.length,trialIds:equal.map(r=>r.trial),totals,
    means:Object.fromEntries(modes.map(m=>[m,equal.length?totals[m]/equal.length:null])),
    lowerTotalMode:!equal.length?null:totals[modes[0]]===totals[modes[1]]?'tie':totals[modes[0]]<totals[modes[1]]?modes[0]:modes[1]};
  const preferences={first:0,second:0,tie:0,'not-comparable':0};
  for(const r of records)preferences[compareValidRoutes(r.policies[modes[0]],r.policies[modes[1]]).winner]++;
  summary.perMapCriterion={firstMode:modes[0],secondMode:modes[1],counts:preferences,
    scope:'Only jointly valid routes are ranked; shorter world length first, lower full examined work on equal length. Failures are not cheap wins.'};
  return summary;
}
