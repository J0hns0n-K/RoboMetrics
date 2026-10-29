// AI-authored reference extension: pause/resume on a fixed snapshot, not dynamic replanning.
import {makeMap} from './core.mjs';

export function createAStarSession(map, {tieBreak = 'fifo'} = {}) {
  if (!['fifo', 'closer-goal'].includes(tieBreak)) throw new Error('Unknown tie-breaking rule.');
  // Validate and copy the input so later caller edits cannot invalidate saved search state.
  const blocked = [];
  if (map.cells?.length !== map.width * map.height) throw new Error('Invalid cell array.');
  for (let k = 0; k < map.cells.length; k++) {
    if (map.cells[k]) blocked.push([k % map.width, Math.floor(k / map.width)]);
  }
  const {width: w, height: h, cells, start, goal} = makeMap(map.width, map.height, blocked, map.start, map.goal);
  const goalKey = goal[1] * w + goal[0], startKey = start[1] * w + start[0];
  const heuristic = (x, y) => Math.abs(x - goal[0]) + Math.abs(y - goal[1]);
  const distances = Array(w * h).fill(Infinity);
  const parents = new Int32Array(w * h).fill(-1), closed = new Uint8Array(w * h);
  let order = 0, expanded = 0, previousBudget = 0, terminal = null;
  distances[startKey] = 0;
  const frontier = [{k: startKey, g: 0, priority: heuristic(...start), order: order++}];
  const failure = reason => ({success: false, reason, path: [], pathLength: null, expanded});

  return {
    advanceTo(cumulativeBudget) {
      if (!Number.isSafeInteger(cumulativeBudget) || cumulativeBudget < 1 || cumulativeBudget < previousBudget) {
        throw new Error('Use a positive safe integer cumulative budget that never decreases.');
      }
      previousBudget = cumulativeBudget;
      const before = expanded;
      while (!terminal && frontier.length) {
        frontier.sort((a, b) => a.priority - b.priority
          || (tieBreak === 'closer-goal' ? b.g - a.g : 0) || a.order - b.order);
        const current = frontier[0];
        if (closed[current.k] || current.g !== distances[current.k]) { frontier.shift(); continue; }
        // Keep this valid candidate queued when pausing; it has not been examined yet.
        if (expanded >= cumulativeBudget) break;
        frontier.shift();
        expanded++;
        closed[current.k] = 1;
        if (current.k === goalKey) {
          const path = [];
          for (let k = goalKey; k !== -1; k = parents[k]) path.push([k % w, Math.floor(k / w)]);
          path.reverse();
          terminal = {success: true, reason: null, path, pathLength: path.length - 1, expanded};
          break;
        }
        const x = current.k % w, y = Math.floor(current.k / w);
        for (const [dx, dy] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          const k = ny * w + nx, g = current.g + 1;
          if (cells[k] || closed[k] || g >= distances[k]) continue;
          distances[k] = g;
          parents[k] = current.k;
          frontier.push({k, g, priority: g + heuristic(nx, ny), order: order++});
        }
      }
      if (!terminal && !frontier.length) terminal = failure('UNREACHABLE');
      const result = terminal || failure('BUDGET_EXCEEDED');
      return {
        state: terminal ? 'complete' : 'paused', cumulativeBudget,
        expandedThisCall: expanded - before, cumulativeExpanded: expanded,
        result: {...result, path: result.path.map(point => [...point])}
      };
    }
  };
}
