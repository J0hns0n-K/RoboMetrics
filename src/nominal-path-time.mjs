// AI ideal-model arithmetic: world-units/s and degrees/s, not measured elapsed time.
import {measureAxisPathRotation} from './path-rotation.mjs';

export function nominalStopTurnTime(path, {initialHeading, linearSpeed, angularSpeedDegrees} = {}) {
  if (![linearSpeed, angularSpeedDegrees].every(speed => Number.isFinite(speed) && speed > 0)) {
    throw new TypeError('Use explicit finite positive linear and angular speeds.');
  }
  const rotation = measureAxisPathRotation(path, {initialHeading});
  const worldLength = path.slice(1).reduce((sum, point, index) => sum
    + Math.abs(point[0] - path[index][0]) + Math.abs(point[1] - path[index][1]), 0);
  const translationSeconds = worldLength / linearSpeed;
  const rotationSeconds = rotation.totalRotationDegrees / angularSpeedDegrees;
  const nominalSeconds = translationSeconds + rotationSeconds;
  if (![worldLength, translationSeconds, rotationSeconds, nominalSeconds].every(Number.isFinite)) {
    throw new RangeError('Nominal distance and durations must remain finite.');
  }
  return {worldLength, ...rotation, linearSpeed, angularSpeedDegrees,
    translationSeconds, rotationSeconds, nominalSeconds};
}
