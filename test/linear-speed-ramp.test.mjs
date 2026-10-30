// AI tests for analytic reference arithmetic, not robot calibration or control.
import test from 'node:test';
import assert from 'node:assert/strict';
import {sampleLinearSpeedRamp} from '../src/linear-speed-ramp.mjs';
const close = (a,b) => assert.ok(Math.abs(a-b) < 1e-12, `${a} versus ${b}`);

test('the taught one- and two-second profiles share mean speed but differ in distance and acceleration', () => {
  const a = sampleLinearSpeedRamp({initialSpeed:0, finalSpeed:1, duration:1});
  const b = sampleLinearSpeedRamp({initialSpeed:0, finalSpeed:1, duration:2});
  assert.deepEqual([a.fullRampAverageSpeed, a.fullRampDistance, a.acceleration], [.5,.5,1]);
  assert.deepEqual([b.fullRampAverageSpeed, b.fullRampDistance, b.acceleration], [.5,1,.5]);
});

test('instantaneous speed, full-interval mean and partial displacement are separate', () => {
  const input = {initialSpeed:0, finalSpeed:1, duration:2};
  const start = sampleLinearSpeedRamp(input,0), mid = sampleLinearSpeedRamp(input,1), end = sampleLinearSpeedRamp(input,2);
  assert.deepEqual([start.currentSpeed,start.fullRampAverageSpeed,start.displacement],[0,.5,0]);
  assert.deepEqual([mid.currentSpeed,mid.fullRampAverageSpeed,mid.displacement],[.5,.5,.25]);
  assert.deepEqual([end.currentSpeed,end.fullRampAverageSpeed,end.displacement],[1,.5,1]);
});

test('constant, stationary and decelerating nonnegative profiles remain supported', () => {
  const constant = sampleLinearSpeedRamp({initialSpeed:2,finalSpeed:2,duration:3});
  assert.deepEqual([constant.acceleration,constant.fullRampDistance],[0,6]);
  assert.equal(sampleLinearSpeedRamp({initialSpeed:0,finalSpeed:0,duration:3}).fullRampDistance,0);
  const input = {initialSpeed:1,finalSpeed:0,duration:2};
  let previous = 0;
  for (let i=0; i<=8; i++) {
    const r = sampleLinearSpeedRamp(input,i/4);
    assert.ok(r.currentSpeed>=0 && r.displacement>=previous);
    previous=r.displacement;
  }
  assert.deepEqual([sampleLinearSpeedRamp(input).acceleration,previous],[-.5,1]);
});

test('sampled velocity integrals and independent constant-acceleration displacement agree', () => {
  const input = {initialSpeed:.2,finalSpeed:1.4,duration:3};
  const a=(input.finalSpeed-input.initialSpeed)/input.duration;
  for (const t of [0,.3,1.5,3]) {
    close(sampleLinearSpeedRamp(input,t).displacement,input.initialSpeed*t+.5*a*t*t);
  }
  for (const n of [2,8,64]) {
    const dt=input.duration/n;
    let integral=0;
    for (let i=0;i<n;i++) integral += (sampleLinearSpeedRamp(input,i*dt).currentSpeed
      + sampleLinearSpeedRamp(input,(i+1)*dt).currentSpeed)*dt/2;
    close(integral,sampleLinearSpeedRamp(input).fullRampDistance);
  }
});

test('invalid endpoint speeds, durations and out-of-range sample times are rejected', () => {
  assert.throws(()=>sampleLinearSpeedRamp(),TypeError);
  for (const value of [-1,NaN,Infinity,'1']) {
    assert.throws(()=>sampleLinearSpeedRamp({initialSpeed:value,finalSpeed:1,duration:2}),TypeError);
    assert.throws(()=>sampleLinearSpeedRamp({initialSpeed:0,finalSpeed:value,duration:2}),TypeError);
  }
  for (const value of [0,-1,NaN,Infinity]) {
    assert.throws(()=>sampleLinearSpeedRamp({initialSpeed:0,finalSpeed:1,duration:value}),TypeError);
  }
  for (const value of [-1,3,NaN,Infinity]) {
    assert.throws(()=>sampleLinearSpeedRamp({initialSpeed:0,finalSpeed:1,duration:2},value),RangeError);
  }
});

test('finite large means avoid addition overflow, but unrepresentable state is rejected', () => {
  assert.equal(sampleLinearSpeedRamp({initialSpeed:1e308,finalSpeed:1e308,duration:1}).fullRampDistance,1e308);
  assert.throws(()=>sampleLinearSpeedRamp({initialSpeed:1e308,finalSpeed:1e308,duration:10}),RangeError);
  assert.throws(()=>sampleLinearSpeedRamp({initialSpeed:0,finalSpeed:1,duration:Number.MIN_VALUE}),RangeError);
});
