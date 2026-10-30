// AI analytic timing reference: finite LINEAR acceleration/braking only.
// Rotation retains the previous instantaneous-rate-change, in-place model.
import {sampleLinearSpeedRamp} from './linear-speed-ramp.mjs';
import {countDirectionChanges} from './path-metrics.mjs';
import {minimumTurnDegrees} from './path-rotation.mjs';

export function restToRestProfile(distance, {maxSpeed, acceleration} = {}) {
  if (!Number.isFinite(distance) || distance < 0
    || ![maxSpeed, acceleration].every(value => Number.isFinite(value) && value > 0)) {
    throw new TypeError('Use finite nonnegative distance and finite positive speed/acceleration.');
  }
  if (distance === 0) return {distance, maxSpeed, acceleration, shape:'stationary',
    peakSpeed:0, totalSeconds:0, phases:[]};
  const capRampSeconds = maxSpeed / acceleration;
  const capRampDistance = maxSpeed * capRampSeconds;
  if (![capRampSeconds, capRampDistance].every(value => Number.isFinite(value) && value > 0)) {
    throw new RangeError('Profile transition must remain representable.');
  }
  const triangular = distance <= capRampDistance;
  const rampSeconds = triangular ? Math.sqrt(distance / acceleration) : capRampSeconds;
  const peakSpeed = triangular ? Math.min(maxSpeed, acceleration * rampSeconds) : maxSpeed;
  const cruiseDistance = triangular ? 0 : distance - capRampDistance;
  const cruiseSeconds = cruiseDistance / peakSpeed;
  if (![rampSeconds, peakSpeed].every(value => Number.isFinite(value) && value > 0)
    || !Number.isFinite(cruiseSeconds) || cruiseSeconds < 0) {
    throw new RangeError('Profile phases must remain finite and nonzero when moving.');
  }
  const phase = (kind, initialSpeed, finalSpeed, duration) => {
    const state = sampleLinearSpeedRamp({initialSpeed, finalSpeed, duration});
    return {kind, duration, initialSpeed, finalSpeed, acceleration:state.acceleration,
      distance:state.fullRampDistance};
  };
  const phases = [phase('accelerate', 0, peakSpeed, rampSeconds)];
  if (cruiseSeconds > 0) phases.push(phase('cruise', peakSpeed, peakSpeed, cruiseSeconds));
  phases.push(phase('brake', peakSpeed, 0, rampSeconds));
  const integratedDistance = phases.reduce((sum, p) => sum + p.distance, 0);
  const totalSeconds = phases.reduce((sum, p) => sum + p.duration, 0);
  if (!Number.isFinite(integratedDistance) || !Number.isFinite(totalSeconds)
    || Math.abs(integratedDistance/distance-1) > 1e-10
    || phases.some(p => Math.abs(p.acceleration) > acceleration*(1+1e-10))) {
    throw new RangeError('Profile distance, time or acceleration invariant failed.');
  }
  return {distance, maxSpeed, acceleration, shape:triangular?'triangular':'trapezoidal',
    peakSpeed, totalSeconds, phases};
}

export function linearAccelStopTurnTime(path, {initialHeading, linearSpeed, linearAcceleration,
  angularSpeedDegrees, stopPolicy = 'turns-only'} = {}) {
  if (!['turns-only','every-waypoint'].includes(stopPolicy)) throw new TypeError('Unknown stop policy.');
  if (![linearSpeed,linearAcceleration,angularSpeedDegrees].every(value => Number.isFinite(value) && value > 0)) {
    throw new TypeError('Use finite positive declared motion limits.');
  }
  minimumTurnDegrees(initialHeading, initialHeading);
  const directionChanges = countDirectionChanges(path);
  const legs = [];
  for (let i=1; i<path.length; i++) {
    const dx=path[i][0]-path[i-1][0], dy=path[i][1]-path[i-1][1];
    const heading=dx>0?'right':dx<0?'left':dy>0?'down':'up';
    const length=Math.abs(dx)+Math.abs(dy);
    const previous=legs.at(-1);
    if (stopPolicy==='turns-only' && previous?.heading===heading) {
      previous.length+=length;
      previous.to=[...path[i]];
      previous.toIndex=i;
      if (!Number.isFinite(previous.length)) throw new RangeError('Run length overflow.');
    } else legs.push({from:[...path[i-1]],to:[...path[i]],fromIndex:i-1,toIndex:i,heading,length});
  }
  const operations=[];
  let clock=0, translationSeconds=0, rotationSeconds=0, worldLength=0, totalRotationDegrees=0;
  let heading=initialHeading;
  const initialAlignmentDegrees=legs.length?minimumTurnDegrees(initialHeading,legs[0].heading):0;
  const append = operation => {
    const endSeconds=clock+operation.durationSeconds;
    if (!Number.isFinite(endSeconds)) throw new RangeError('Schedule time overflow.');
    operations.push({...operation,startSeconds:clock,endSeconds});
    clock=endSeconds;
  };
  for (const leg of legs) {
    const angleDegrees=minimumTurnDegrees(heading,leg.heading);
    if (angleDegrees>0) {
      const durationSeconds=angleDegrees/angularSpeedDegrees;
      append({kind:'rotate',at:[...leg.from],fromHeading:heading,toHeading:leg.heading,angleDegrees,durationSeconds});
      rotationSeconds+=durationSeconds;
      totalRotationDegrees+=angleDegrees;
    }
    const profile=restToRestProfile(leg.length,{maxSpeed:linearSpeed,acceleration:linearAcceleration});
    append({kind:'translate',...leg,profile,durationSeconds:profile.totalSeconds});
    translationSeconds+=profile.totalSeconds;
    worldLength+=leg.length;
    heading=leg.heading;
  }
  if (![worldLength,translationSeconds,rotationSeconds,clock].every(Number.isFinite)) throw new RangeError('Path total overflow.');
  return {initialHeading,stopPolicy,linearSpeed,linearAcceleration,angularSpeedDegrees,
    worldLength,directionChanges,initialAlignmentDegrees,
    pathRotationDegrees:totalRotationDegrees-initialAlignmentDegrees,totalRotationDegrees,
    translationRuns:legs.length,intermediateStops:Math.max(0,legs.length-1),
    rotationOperations:operations.filter(op=>op.kind==='rotate').length,
    translationSeconds,rotationSeconds,modelSeconds:clock,operations};
}
