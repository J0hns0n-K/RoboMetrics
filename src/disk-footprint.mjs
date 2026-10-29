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

// AI reference extension: refine candidate centers, keeping ORIGINAL unit squares/body/world units.
// Only nested 1/.5 lattices are supported here; one graph edge costs one in core A*.
export function buildSampledDiskConfigurationSpace(map, {radius, clearance = 0, spacing = .5} = {}) {
  if (![1, .5].includes(spacing)) throw new Error('Supported sample spacings are 1 and 0.5.');
  const geometry = model(map, radius, clearance), m = geometry.snapshot;
  const width = (m.width - 1) / spacing + 1, height = (m.height - 1) / spacing + 1;
  if (width > 80 || height > 80) throw new Error('Sample graph exceeds core limit80; world is not resized.');
  const cells = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const wx = .5 + x * spacing, wy = .5 + y * spacing;
    cells[y * width + x] = violation({x0: wx, x1: wx, y0: wy, y1: wy}, geometry) ? 1 : 0;
  }
  return {width, height, cells, start: m.start.map(v => v / spacing), goal: m.goal.map(v => v / spacing),
    parameters: {shape: 'disk', radius, diameter: 2 * radius, clearance, effectiveRadius: geometry.effectiveRadius,
      cellSide: 1, units: 'original virtual cell-side lengths; not physical measurements', contactIsCollision: true},
    sampling: {spacing, origin: [.5, .5], originalWorldSize: [m.width, m.height],
      graphEdgeLength: spacing, scope: 'Nested four-neighbor candidate lattice; original obstacle squares/world/body unchanged.'}};
}

export function planSampledDiskPath(map, {radius, clearance = 0, spacing = .5, maxExpansions = 100, tieBreak = 'fifo'} = {}) {
  if (!Number.isSafeInteger(maxExpansions) || maxExpansions < 1) throw new Error('Use a finite positive expansion budget.');
  if (!['fifo', 'closer-goal'].includes(tieBreak)) throw new Error('Unknown tie rule.');
  const space = buildSampledDiskConfigurationSpace(map, {radius, clearance, spacing});
  const invalidEndpoints = ['start', 'goal'].filter(name => space.cells[space[name][1] * space.width + space[name][0]]);
  const base = {configurationSpace: space, worldPath: [], geometricLength: null,
    scope: 'Sample-graph shortest edge count when completed; geometric length=edge count*spacing, not global continuous optimum or runtime.'};
  if (invalidEndpoints.length) return {...base, status: 'INVALID_ENDPOINT_CLEARANCE', invalidEndpoints,
    planningResult: null, sweptPathValidation: null};
  const blocked = [];
  for (let k = 0; k < space.cells.length; k++) if (space.cells[k]) blocked.push([k % space.width, Math.floor(k / space.width)]);
  const sampled = makeMap(space.width, space.height, blocked, space.start, space.goal);
  const result = plan(sampled, 'astar', maxExpansions, {tieBreak});
  if (!result.success) return {...base, status: result.reason, invalidEndpoints: [], planningResult: result, sweptPathValidation: null};
  if (!verifyPath(sampled, result.path)) throw new Error('Invalid sampled-grid path.');
  const worldPath = result.path.map(p => p.map(v => .5 + v * spacing));
  const geometry = model(map, radius, clearance);
  for (let i = 0; i < worldPath.length; i++) {
    const a = worldPath[Math.max(0, i - 1)], b = worldPath[i];
    if (violation({x0: Math.min(a[0], b[0]), x1: Math.max(a[0], b[0]),
      y0: Math.min(a[1], b[1]), y1: Math.max(a[1], b[1])}, geometry)) throw new Error('Sampled edge violates original geometry.');
  }
  return {...base, status: 'ROUTE_FOUND', invalidEndpoints: [], planningResult: result, worldPath,
    geometricLength: result.pathLength * spacing,
    sweptPathValidation: {valid: true, sweptSegmentsChecked: worldPath.length - 1,
      scope: 'All axis-aligned world-center segments checked against original closed squares/boundary; no dynamics.'}};
}
