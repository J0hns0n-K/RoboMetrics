// AI-authored reference policy for an explicitly supplied latest static map.
// No sensor, motion command, incremental search-state repair or physical safety guarantee.
import {makeMap, plan, verifyPath} from './core.mjs';

export function resolveRouteUpdate(map, priorPath, {
  currentPathIndex = 0, maxExpansions, tieBreak = 'fifo', optimization = 'reoptimize'
} = {}) {
  if (!Number.isSafeInteger(maxExpansions) || maxExpansions < 1) throw new Error('Supply a finite positive safe integer search budget.');
  if (!['fifo', 'closer-goal'].includes(tieBreak)) throw new Error('Unknown tie-breaking rule.');
  if (!['keep-valid', 'reoptimize'].includes(optimization)) throw new Error('Unknown optimization policy.');
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
  const response = (status, path, decisionReason, optimizationStatus, result = null) => ({
    status, optimization, decisionReason, optimizationStatus,
    priorRemainingPathValid: priorValid, priorValidPathLength: priorValid ? remaining.length - 1 : null,
    path: path.map(p => [...p]), pathLength: path.length ? path.length - 1 : null,
    expanded: result?.expanded ?? 0, plannerCalls: result ? 1 : 0,
    planningResult: result ? {...result, path: result.path.map(p => [...p])} : null
  });
  if (priorValid && remaining.length === 1) {
    return response('KEEP_ROUTE', remaining, 'ALREADY_AT_GOAL', 'OPTIMAL');
  }
  if (priorValid && optimization === 'keep-valid') {
    return response('KEEP_ROUTE', remaining, 'VALID_ROUTE_RETAINED', 'NOT_REQUESTED');
  }
  const result = plan(snapshot, 'astar', maxExpansions, {tieBreak});
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
