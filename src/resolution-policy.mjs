// AI reference policy implementing the student's offered coarse-first direction.
// A retry changes the graph: it is a fresh search, not a resumed coarse frontier.
import {makeMap} from './core.mjs';
import {planSampledDiskPath} from './disk-footprint.mjs';

export function resolveDiskResolution(map, {mode = 'coarse-first', radius, clearance = 0,
  coarseBudget = 100, fineBudget = 100, tieBreak = 'fifo'} = {}) {
  if (!['coarse-first', 'always-fine'].includes(mode)) throw new Error('Unknown resolution policy.');
  for (const n of [coarseBudget, fineBudget]) {
    if (!Number.isSafeInteger(n) || n < 1) throw new Error('Use positive safe integer stage budgets.');
  }
  const maxExpansionsCap = mode === 'coarse-first' ? coarseBudget + fineBudget : fineBudget;
  if (!Number.isSafeInteger(maxExpansionsCap)) throw new Error('Unsafe summed expansion cap.');
  if (!Number.isInteger(map?.width) || !Number.isInteger(map?.height)
    || map.width < 2 || map.height < 2 || map.width > 80 || map.height > 80
    || map.cells?.length !== map.width * map.height) throw new Error('Invalid original grid.');
  const blocked = [];
  for (let k = 0; k < map.cells.length; k++) if (map.cells[k]) blocked.push([k % map.width, Math.floor(k / map.width)]);
  const snapshot = makeMap(map.width, map.height, blocked, map.start, map.goal);
  const stages = [];
  const run = (spacing, maxExpansions) => {
    const outcome = planSampledDiskPath(snapshot, {radius, clearance, spacing, maxExpansions, tieBreak});
    stages.push({spacing, maxExpansions, outcome});
    return outcome;
  };
  let final;
  if (mode === 'always-fine') final = run(.5, fineBudget);
  else {
    final = run(1, coarseBudget);
    // Budget exhaustion is not evidence of graph disconnection. Invalid endpoints also stop.
    if (final.status === 'UNREACHABLE') final = run(.5, fineBudget);
  }
  return {status: final.status, worldPath: final.worldPath.map(p => [...p]), geometricLength: final.geometricLength,
    finalSpacing: stages.at(-1).spacing, mode, refined: mode === 'coarse-first' && stages.length === 2,
    stages, plannerCalls: stages.filter(s => s.outcome.planningResult !== null).length,
    expanded: stages.reduce((n, s) => n + (s.outcome.planningResult?.expanded ?? 0), 0),
    maxExpansionsCap, stageBudgets: {coarse: coarseBudget, fine: fineBudget},
    scope: 'Fixed original virtual geometry; retry once only on coarse UNREACHABLE. Sum all stage expansions. No state reuse, global continuous optimality or physical/runtime claim.'};
}
