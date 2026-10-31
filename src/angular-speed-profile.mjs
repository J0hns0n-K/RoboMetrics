// AI analytic angular adapter for the existing scalar rest-to-rest equations.
// Degrees are model inputs; no wheel actuation, calibration or path composition.
import {restToRestProfile} from './linear-accel-path-time.mjs';

export function angularRestToRestProfile(angleDegrees, {
  maxAngularSpeedDegreesPerSecond,
  angularAccelerationMagnitudeDegreesPerSecondSquared
} = {}) {
  if (!Number.isFinite(angleDegrees) || angleDegrees < 0
    || ![maxAngularSpeedDegreesPerSecond, angularAccelerationMagnitudeDegreesPerSecondSquared]
      .every(value => Number.isFinite(value) && value > 0)) {
    throw new TypeError('Use finite nonnegative angle and finite positive angular limits.');
  }
  const scalar = restToRestProfile(angleDegrees, {
    maxSpeed:maxAngularSpeedDegreesPerSecond,
    acceleration:angularAccelerationMagnitudeDegreesPerSecondSquared
  });
  return {angleDegrees, maxAngularSpeedDegreesPerSecond,
    angularAccelerationMagnitudeDegreesPerSecondSquared,
    shape:scalar.shape, peakAngularSpeedDegreesPerSecond:scalar.peakSpeed,
    modelSeconds:scalar.totalSeconds,
    phases:scalar.phases.map(p => ({kind:p.kind, durationSeconds:p.duration,
      initialAngularSpeedDegreesPerSecond:p.initialSpeed,
      finalAngularSpeedDegreesPerSecond:p.finalSpeed,
      angularAccelerationDegreesPerSecondSquared:p.acceleration,
      angleDegrees:p.distance}))};
}

export function stoppedAngularSequenceTime(anglesDegrees, limits) {
  if (!Array.isArray(anglesDegrees) || anglesDegrees.length === 0
    || Array.from(anglesDegrees).some(angle => !Number.isFinite(angle) || angle <= 0)) {
    throw new TypeError('Use a nonempty array of finite positive same-direction rotation angles.');
  }
  let modelSeconds=0, totalAngleDegrees=0;
  const operations=anglesDegrees.map(angle => {
    const profile=angularRestToRestProfile(angle,limits);
    const startSeconds=modelSeconds;
    modelSeconds+=profile.modelSeconds;
    totalAngleDegrees+=angle;
    if (![modelSeconds,totalAngleDegrees].every(Number.isFinite)) {
      throw new RangeError('Angular sequence totals must remain finite.');
    }
    return {startSeconds,endSeconds:modelSeconds,profile};
  });
  return {totalAngleDegrees, intermediateRestBoundaries:anglesDegrees.length-1,
    extraDwellSeconds:0, modelSeconds, operations};
}
