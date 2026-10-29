// AI-authored reference policy for an explicitly supplied latest static map.
// No sensor, motion command, incremental search-state repair or physical safety guarantee.
import {makeMap, plan, verifyPath} from './core.mjs';
import {createAStarSession} from './resumable-astar.mjs';

export function resolveRouteUpdate(map, priorPath, {
  currentPathIndex = 0, maxExpansions, tieBreak = 'fifo', optimization = 'reoptimize', skipProvenOptimal = true,
  timeoutResponse = 'continue', additionalExpansions = 50, continuationStrategy = 'resume'
} = {}) {
  if (!Number.isSafeInteger(maxExpansions) || maxExpansions < 1) throw new Error('Supply a finite positive safe integer search budget.');
  if (!['fifo', 'closer-goal'].includes(tieBreak)) throw new Error('Unknown tie-breaking rule.');
  if (!['keep-valid', 'reoptimize'].includes(optimization)) throw new Error('Unknown optimization policy.');
  if (typeof skipProvenOptimal !== 'boolean') throw new Error('skipProvenOptimal must be boolean.');
  if (!['retain', 'continue'].includes(timeoutResponse)) throw new Error('Unknown timeout response.');
  if (!['resume', 'restart'].includes(continuationStrategy)) throw new Error('Unknown continuation strategy.');
  if (!Number.isSafeInteger(additionalExpansions) || additionalExpansions < 1
    || (timeoutResponse === 'continue' && !Number.isSafeInteger(maxExpansions + additionalExpansions))) throw new Error('Invalid additional budget.');
  if (!Array.isArray(priorPath) || !priorPath.length || !Number.isSafeInteger(currentPathIndex)
    || currentPathIndex < 0 || currentPathIndex >= priorPath.length) throw new Error('Invalid prior path/index.');
  if (!Array.isArray(map.cells) && !ArrayBuffer.isView(map.cells)) throw new Error('Invalid cells.');
  if (map.cells.length !== map.width * map.height) throw new Error('Invalid cell count.');
  const blocked = [];
  for (let k = 0; k < map.cells.length; k++) if (map.cells[k]) blocked.push([k % map.width, Math.floor(k / map.width)]);
  const snapshot = makeMap(map.width, map.height, blocked, map.start, map.goal);
  if (priorPath.some(p => !Array.isArray(p) || p.length !== 2 || !p.every(Number.isSafeInteger)
    || p[0] < 0 || p[1] < 0 || p[0] >= snapshot.width || p[1] >= snapshot.height)) throw new Error('Invalid waypoint.');
  const current = priorPath[currentPathIndex];
  if (current[0] !== snapshot.start[0] || current[1] !== snapshot.start[1]) throw new Error('Current index must match the supplied current start.');
  const remaining = priorPath.slice(currentPathIndex).map(p => [...p]);
  const priorValid = verifyPath(snapshot, remaining);
  const lowerBound = Math.abs(snapshot.start[0] - snapshot.goal[0]) + Math.abs(snapshot.start[1] - snapshot.goal[1]);
  const stages = [];
  let searchSessions = 0, corePlanCalls = 0, resumeAdvanceCalls = 0;
  const copyResult = result => ({...result, path: result.path.map(p => [...p])});
  const response = (status, path, decisionReason, optimizationStatus, result = null) => ({
    status, optimization, skipProvenOptimal, lowerBound, decisionReason, optimizationStatus,
    timeoutResponse, additionalExpansions, continuationStrategy, continued: stages.length > 1,
    continuationTarget: timeoutResponse === 'continue' ? maxExpansions + additionalExpansions : null,
    maximumContinuationSteps: 1, searchSessions, corePlanCalls, resumeAdvanceCalls,
    searchStages: stages.map(stage => ({...stage, result: copyResult(stage.result)})),
    optimalityEvidence: optimizationStatus === 'OPTIMAL' ? (result?.success ? 'ASTAR_COMPLETED' : 'MANHATTAN_BOUND') : null,
    priorRemainingPathValid: priorValid, priorValidPathLength: priorValid ? remaining.length - 1 : null,
    path: path.map(p => [...p]), pathLength: path.length ? path.length - 1 : null,
    expanded: stages.reduce((sum, stage) => sum + stage.expandedThisStage, 0), plannerCalls: searchSessions,
    planningResult: result ? copyResult(result) : null
  });
  if (priorValid && remaining.length === 1) {
    return response('KEEP_ROUTE', remaining, 'ALREADY_AT_GOAL', 'OPTIMAL');
  }
  if (priorValid && optimization === 'keep-valid') {
    return response('KEEP_ROUTE', remaining, 'VALID_ROUTE_RETAINED', 'NOT_REQUESTED');
  }
  // Student adopted this AI-proposed rule: only a verified route attaining the bound can skip.
  if (priorValid && skipProvenOptimal && remaining.length - 1 === lowerBound) {
    return response('KEEP_ROUTE', remaining, 'LOWER_BOUND_OPTIMAL', 'OPTIMAL');
  }
  // Continuation is authorized only for a verified fallback. Invalid-route failures remain one-shot.
  const useSession = priorValid && timeoutResponse === 'continue' && continuationStrategy === 'resume';
  const session = useSession ? createAStarSession(snapshot, {tieBreak}) : null;
  const runStage = (budget, phase) => {
    if (session) {
      if (stages.length === 0) searchSessions++;
      const step = session.advanceTo(budget); resumeAdvanceCalls++;
      stages.push({phase, engine: 'resumable-astar', budgetType: 'cumulative target', budget,
        searchSession: searchSessions, expandedThisStage: step.expandedThisCall,
        searchCumulativeExpanded: step.cumulativeExpanded, result: step.result});
      return step.result;
    }
    searchSessions++; corePlanCalls++;
    const result = plan(snapshot, 'astar', budget, {tieBreak});
    stages.push({phase, engine: 'one-shot-astar', budgetType: 'fresh-search limit', budget,
      searchSession: searchSessions, expandedThisStage: result.expanded,
      searchCumulativeExpanded: result.expanded, result});
    return result;
  };
  let result = runStage(maxExpansions, 'initial');
  if (priorValid && timeoutResponse === 'continue' && result.reason === 'BUDGET_EXCEEDED') {
    result = runStage(maxExpansions + additionalExpansions, continuationStrategy === 'resume' ? 'resume' : 'restart');
  }
  if (result.success && !verifyPath(snapshot, result.path)) throw new Error('Planner returned an invalid route.');
  if (result.success) {
    if (!priorValid) return response('NEW_ROUTE_FOUND', result.path, 'REPLACEMENT_FOUND', 'OPTIMAL', result);
    if (result.pathLength > remaining.length - 1) throw new Error('Fresh A* returned longer than a known valid route.');
    return result.pathLength < remaining.length - 1
      ? response('NEW_ROUTE_FOUND', result.path, 'SHORTER_ROUTE_FOUND', 'OPTIMAL', result)
      : response('KEEP_ROUTE', remaining, 'OPTIMALITY_CONFIRMED', 'OPTIMAL', result);
  }
  if (priorValid) {
    if (result.reason !== 'BUDGET_EXCEEDED') throw new Error('Search contradicts a verified valid route.');
    // AI fallback: keep the verified route and retain the failed optimization attempt separately.
    return response('KEEP_ROUTE', remaining, 'OPTIMIZATION_BUDGET_EXCEEDED', 'BUDGET_EXCEEDED', result);
  }
  return response(result.reason, [], result.reason, result.reason, result);
}
