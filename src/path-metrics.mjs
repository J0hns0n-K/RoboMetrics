// AI reference descriptor, not a motion model or a search objective.
// Count changes between consecutive axis headings, excluding initial alignment.
// A reversal is one direction-change event, not one quarter-turn or a measured cost.
export function countDirectionChanges(path) {
  if (!Array.isArray(path) || !path.length || path.some(point => !Array.isArray(point)
    || point.length !== 2 || !point.every(Number.isFinite))) {
    throw new TypeError('Use a nonempty path of finite [x, y] points.');
  }
  let previousHeading = null;
  let changes = 0;
  for (let i = 1; i < path.length; i++) {
    const dx = path[i][0] - path[i - 1][0];
    const dy = path[i][1] - path[i - 1][1];
    if (!Number.isFinite(dx) || !Number.isFinite(dy) || (dx === 0) === (dy === 0)) {
      throw new TypeError('Each path segment must be nonzero, finite and axis-aligned.');
    }
    const heading = dx > 0 ? 'right' : dx < 0 ? 'left' : dy > 0 ? 'down' : 'up';
    if (previousHeading !== null && heading !== previousHeading) changes++;
    previousHeading = heading;
  }
  return changes;
}
