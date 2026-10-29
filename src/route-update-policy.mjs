// AI-authored reference policy for an explicitly supplied latest static map.
// No sensor, motion command, incremental search-state repair or physical safety guarantee.
import {makeMap, plan, verifyPath} from './core.mjs';

export function resolveRouteUpdate(map, priorPath, {
  currentPathIndex = 0, maxExpansions, tieBreak = 'fifo'
} = {}) {
  if (!Number.isSafeInteger(maxExpansions) || maxExpansions < 1) throw new Error('Supply a finite positive safe integer search budget.');
  if (!['fifo', 'closer-goal'].includes(tieBreak)) throw new Error('Unknown tie-breaking rule.');
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
  if (verifyPath(snapshot, remaining)) {
    return {status: 'KEEP_ROUTE', priorRemainingPathValid: true, path: remaining,
      pathLength: remaining.length - 1, expanded: 0, plannerCalls: 0, planningResult: null};
  }
  const result = plan(snapshot, 'astar', maxExpansions, {tieBreak});
  if (result.success && !verifyPath(snapshot, result.path)) throw new Error('Planner returned an invalid route.');
  return {status: result.success ? 'NEW_ROUTE_FOUND' : result.reason,
    priorRemainingPathValid: false, path: result.path.map(p => [...p]), pathLength: result.pathLength,
    expanded: result.expanded, plannerCalls: 1,
    planningResult: {...result, path: result.path.map(p => [...p])}};
}
