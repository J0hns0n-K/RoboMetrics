// AI analytic composition of the two existing rest-to-rest references.
// Sequential axis translations/in-place rotations; no coupled wheel controller.
import {linearAccelStopTurnTime} from './linear-accel-path-time.mjs';
import {angularRestToRestProfile} from './angular-speed-profile.mjs';

export function boundedStopTurnTime(path, {
  angularAccelerationMagnitudeDegreesPerSecondSquared, ...limits
} = {}) {
  if (!Number.isFinite(angularAccelerationMagnitudeDegreesPerSecondSquared)
    || angularAccelerationMagnitudeDegreesPerSecondSquared <= 0) {
    throw new TypeError('Use a finite positive angular acceleration/braking magnitude.');
  }
  const reference=linearAccelStopTurnTime(path,limits);
  let clock=0,rotationSeconds=0;
  const operations=reference.operations.map(operation=>{
    let profile=operation.profile,durationSeconds=operation.durationSeconds;
    if(operation.kind==='rotate') {
      profile=angularRestToRestProfile(operation.angleDegrees,{
        maxAngularSpeedDegreesPerSecond:reference.angularSpeedDegrees,
        angularAccelerationMagnitudeDegreesPerSecondSquared
      });
      durationSeconds=profile.modelSeconds;
      rotationSeconds+=durationSeconds;
    }
    const startSeconds=clock,endSeconds=clock+durationSeconds;
    if(!Number.isFinite(endSeconds) || !Number.isFinite(rotationSeconds)) {
      throw new RangeError('Bounded path schedule must remain finite.');
    }
    clock=endSeconds;
    return {...operation,profile,durationSeconds,startSeconds,endSeconds};
  });
  return {...reference,timingModel:'bounded-linear-and-angular-stop-turn',
    angularAccelerationMagnitudeDegreesPerSecondSquared,
    rotationSeconds,modelSeconds:clock,operations};
}
