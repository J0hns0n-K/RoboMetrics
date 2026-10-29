// AI reference geometry: fixed circular body on a known square-cell map.
// Units are assumed cell-side lengths, not measured robot dimensions or motion dynamics.
import {makeMap, plan, verifyPath} from './core.mjs';

function model(map, radius, clearance) {
  if (!Number.isFinite(radius) || radius < 0 || !Number.isFinite(clearance) || clearance < 0
    || !Number.isFinite(radius + clearance) || !Number.isFinite(2 * radius)) throw new Error('Use finite nonnegative radius/clearance.');
  if (!Number.isInteger(map?.width) || !Number.isInteger(map?.height) || map.width < 2 || map.height < 2
    || map.width > 80 || map.height > 80 || map.cells?.length !== map.width * map.height) throw new Error('Invalid grid.');
  const obstacles = [];
  for (let k = 0; k < map.cells.length; k++) if (map.cells[k]) obstacles.push([k % map.width, Math.floor(k / map.width)]);
  const snapshot = makeMap(map.width, map.height, obstacles, map.start, map.goal);
  return {snapshot, obstacles, radius, clearance, effectiveRadius: radius + clearance};
}

// For a point or axis-aligned segment, its bounding box is the exact center trace.
function violation(box, geometry) {
  const {snapshot: map, obstacles, effectiveRadius: r} = geometry;
  const boundaryDistance = Math.min(box.x0, box.y0, map.width - box.x1, map.height - box.y1);
  if (boundaryDistance <= r) return {kind: 'WORLD_BOUNDARY_CLEARANCE', centerClearance: boundaryDistance};
  for (const [x, y] of obstacles) {
    const dx = Math.max(x - box.x1, box.x0 - (x + 1), 0);
    const dy = Math.max(y - box.y1, box.y0 - (y + 1), 0);
    if (dx * dx + dy * dy <= r * r) return {kind: 'OBSTACLE_CLEARANCE', obstacle: [x, y], centerClearance: Math.hypot(dx, dy)};
  }
  return null;
}

export function buildDiskConfigurationSpace(map, {radius, clearance = 0} = {}) {
  const geometry = model(map, radius, clearance), m = geometry.snapshot;
  const cells = new Uint8Array(m.cells.length);
  for (let y = 0; y < m.height; y++) for (let x = 0; x < m.width; x++) {
    cells[y * m.width + x] = violation({x0: x + .5, x1: x + .5, y0: y + .5, y1: y + .5}, geometry) ? 1 : 0;
  }
  return {width: m.width, height: m.height, cells, start: [...m.start], goal: [...m.goal],
    parameters: {shape: 'disk', radius, diameter: 2 * radius, clearance, effectiveRadius: geometry.effectiveRadius,
      cellSide: 1, units: 'assumed grid-cell lengths; not physical measurements', contactIsCollision: true},
    originalBlockedCount: geometry.obstacles.length, configurationBlockedCount: [...cells].filter(Boolean).length};
}

export function validateDiskPath(map, path, {radius, clearance = 0} = {}) {
  const geometry = model(map, radius, clearance), m = geometry.snapshot;
  const eq = (a, b) => a[0] === b[0] && a[1] === b[1];
  if (!Array.isArray(path) || !path.length || path.some(p => !Array.isArray(p) || p.length !== 2
    || !p.every(Number.isInteger) || p[0] < 0 || p[1] < 0 || p[0] >= m.width || p[1] >= m.height)
    || !eq(path[0], m.start) || !eq(path.at(-1), m.goal)
    || path.some((p, i) => i > 0 && Math.abs(p[0] - path[i - 1][0]) + Math.abs(p[1] - path[i - 1][1]) !== 1)) {
    return {valid: false, reason: 'INVALID_GRID_PATH'};
  }
  for (let i = 0; i < path.length; i++) {
    const a = path[Math.max(0, i - 1)], b = path[i];
    const problem = violation({x0: Math.min(a[0], b[0]) + .5, x1: Math.max(a[0], b[0]) + .5,
      y0: Math.min(a[1], b[1]) + .5, y1: Math.max(a[1], b[1]) + .5}, geometry);
    if (problem) return {valid: false, reason: problem.kind, waypointIndex: i, ...problem};
  }
  return {valid: true, reason: null, sweptSegmentsChecked: path.length - 1,
    scope: 'axis-aligned center segments against original closed squares/world boundary; no motion dynamics'};
}

export function planDiskPath(map, {radius, clearance = 0, maxExpansions = 100, tieBreak = 'fifo'} = {}) {
  if (!Number.isSafeInteger(maxExpansions) || maxExpansions < 1) throw new Error('Use a finite positive expansion budget.');
  if (!['fifo', 'closer-goal'].includes(tieBreak)) throw new Error('Unknown tie rule.');
  const space = buildDiskConfigurationSpace(map, {radius, clearance});
  const invalidEndpoints = ['start', 'goal'].filter(name => space.cells[space[name][1] * space.width + space[name][0]]);
  if (invalidEndpoints.length) return {status: 'INVALID_ENDPOINT_CLEARANCE', invalidEndpoints,
    configurationSpace: space, planningResult: null, sweptPathValidation: null,
    scope: 'Chosen endpoint centers violate assumed geometric clearance; no search performed.'};
  const blocked = [];
  for (let k = 0; k < space.cells.length; k++) if (space.cells[k]) blocked.push([k % space.width, Math.floor(k / space.width)]);
  const centerMap = makeMap(space.width, space.height, blocked, space.start, space.goal);
  const result = plan(centerMap, 'astar', maxExpansions, {tieBreak});
  const swept = result.success ? validateDiskPath(map, result.path, {radius, clearance}) : null;
  if (result.success && (!verifyPath(centerMap, result.path) || !swept.valid)) throw new Error('Returned path violates the geometric model.');
  return {status: result.success ? 'ROUTE_FOUND' : result.reason, invalidEndpoints: [],
    configurationSpace: space, planningResult: result, sweptPathValidation: swept,
    scope: 'Cell-center disk configuration graph; UNREACHABLE is not a claim about all continuous robot motions.'};
}
