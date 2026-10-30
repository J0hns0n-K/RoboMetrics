// AI reference arithmetic under explicitly assumed weights; not measured motion cost.
import {countDirectionChanges} from './path-metrics.mjs';

export function scoreAxisPath(path, {perWorldUnit = 1, perDirectionChange = 2} = {}) {
  if (![perWorldUnit, perDirectionChange].every(value => Number.isFinite(value) && value >= 0)) {
    throw new TypeError('Use finite nonnegative score weights.');
  }
  const directionChanges = countDirectionChanges(path);
  const worldLength = path.slice(1).reduce((sum, point, index) => sum
    + Math.abs(point[0] - path[index][0]) + Math.abs(point[1] - path[index][1]), 0);
  const virtualScore = worldLength * perWorldUnit + directionChanges * perDirectionChange;
  if (!Number.isFinite(worldLength) || !Number.isFinite(virtualScore)) {
    throw new RangeError('Path length and score must remain finite.');
  }
  return {worldLength, directionChanges, virtualScore,
    weights: {perWorldUnit, perDirectionChange}};
}
