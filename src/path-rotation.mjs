// AI geometric heading-alignment descriptor, not a controller or timed motion model.
import {countDirectionChanges} from './path-metrics.mjs';

const headings = new Map([['right', 0], ['down', 90], ['left', 180], ['up', 270]]);

export function minimumTurnDegrees(from, to) {
  if (!headings.has(from) || !headings.has(to)) {
    throw new TypeError('Use right, down, left or up headings.');
  }
  const difference = Math.abs(headings.get(to) - headings.get(from));
  return Math.min(difference, 360 - difference);
}

export function measureAxisPathRotation(path, {initialHeading} = {}) {
  minimumTurnDegrees(initialHeading, initialHeading); // Require an explicit valid heading.
  countDirectionChanges(path); // Reuse finite, nonempty, nonzero axis-path validation.
  let previousHeading = null;
  let initialAlignmentDegrees = 0;
  let pathRotationDegrees = 0;
  for (let i = 1; i < path.length; i++) {
    const dx = path[i][0] - path[i - 1][0];
    const dy = path[i][1] - path[i - 1][1];
    const heading = dx > 0 ? 'right' : dx < 0 ? 'left' : dy > 0 ? 'down' : 'up';
    if (previousHeading === null) initialAlignmentDegrees = minimumTurnDegrees(initialHeading, heading);
    else pathRotationDegrees += minimumTurnDegrees(previousHeading, heading);
    previousHeading = heading;
  }
  return {initialHeading, initialAlignmentDegrees, pathRotationDegrees,
    totalRotationDegrees: initialAlignmentDegrees + pathRotationDegrees};
}
