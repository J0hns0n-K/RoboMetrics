// AI analytic 1D reference; no hardware calibration, real-time integrator or controller.
export function sampleLinearSpeedRamp({initialSpeed, finalSpeed, duration} = {}, elapsed = duration) {
  if (![initialSpeed, finalSpeed].every(speed => Number.isFinite(speed) && speed >= 0)
    || !Number.isFinite(duration) || duration <= 0) {
    throw new TypeError('Use finite nonnegative endpoint speeds and a finite positive duration.');
  }
  if (!Number.isFinite(elapsed) || elapsed < 0 || elapsed > duration) {
    throw new RangeError('Elapsed time must lie within the ramp interval.');
  }
  const acceleration = (finalSpeed - initialSpeed) / duration;
  const fullRampAverageSpeed = initialSpeed / 2 + finalSpeed / 2;
  const fullRampDistance = fullRampAverageSpeed * duration;
  const fraction = elapsed / duration;
  const currentSpeed = elapsed === 0 ? initialSpeed : elapsed === duration ? finalSpeed
    : initialSpeed * (1 - fraction) + finalSpeed * fraction;
  const displacement = (initialSpeed / 2 + currentSpeed / 2) * elapsed;
  if (![acceleration, fullRampAverageSpeed, fullRampDistance, currentSpeed, displacement].every(Number.isFinite)) {
    throw new RangeError('Ramp state must remain finite.');
  }
  return {initialSpeed, finalSpeed, duration, elapsed, acceleration,
    fullRampAverageSpeed, fullRampDistance, currentSpeed, displacement};
}
