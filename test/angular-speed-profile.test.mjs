import test from 'node:test';
import assert from 'node:assert/strict';
import {angularRestToRestProfile,stoppedAngularSequenceTime} from '../src/angular-speed-profile.mjs';
const limits={maxAngularSpeedDegreesPerSecond:180,angularAccelerationMagnitudeDegreesPerSecondSquared:180};
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} versus ${b}`);

test('angular units distinguish short, threshold, cruising and stationary rotations',()=>{
  const short=angularRestToRestProfile(90,limits),threshold=angularRestToRestProfile(180,limits);
  assert.equal(short.shape,'triangular');close(short.modelSeconds,Math.SQRT2);
  close(short.peakAngularSpeedDegreesPerSecond,180/Math.SQRT2);
  close(threshold.modelSeconds,2);close(threshold.peakAngularSpeedDegreesPerSecond,180);
  const long=angularRestToRestProfile(360,limits);
  assert.equal(long.shape,'trapezoidal');close(long.modelSeconds,3);
  assert.deepEqual(long.phases.map(p=>p.kind),['accelerate','cruise','brake']);
  assert.deepEqual(angularRestToRestProfile(0,limits).phases,[]);
  close(angularRestToRestProfile(0,limits).modelSeconds,0);
});

test('angular velocity integrals reconstruct angle with bounded acceleration and rest endpoints',()=>{
  for (const angle of [1,45,90,180,360]) {
    const r=angularRestToRestProfile(angle,limits);
    assert.equal(r.phases[0].initialAngularSpeedDegreesPerSecond,0);
    assert.equal(r.phases.at(-1).finalAngularSpeedDegreesPerSecond,0);
    let integratedAngle=0,time=0;
    r.phases.forEach((p,i)=>{
      const u=p.initialAngularSpeedDegreesPerSecond,v=p.finalAngularSpeedDegreesPerSecond;
      close((u+v)*p.durationSeconds/2,p.angleDegrees);
      close((v-u)/p.durationSeconds,p.angularAccelerationDegreesPerSecondSquared);
      assert.ok(Math.max(u,v)<=180 && Math.min(u,v)>=0);
      assert.ok(Math.abs(p.angularAccelerationDegreesPerSecondSquared)<=180+1e-9);
      if(i)close(r.phases[i-1].finalAngularSpeedDegreesPerSecond,u);
      integratedAngle+=p.angleDegrees;time+=p.durationSeconds;
    });
    close(integratedAngle,angle);close(time,r.modelSeconds);
  }
});

test('same total rotation with an intermediate full stop costs more without any dwell',()=>{
  const one=stoppedAngularSequenceTime([180],limits),two=stoppedAngularSequenceTime([90,90],limits);
  close(one.totalAngleDegrees,two.totalAngleDegrees);close(one.modelSeconds,2);
  close(two.modelSeconds,2*Math.SQRT2);assert.ok(two.modelSeconds>one.modelSeconds);
  assert.equal(one.intermediateRestBoundaries,0);assert.equal(two.intermediateRestBoundaries,1);
  assert.equal(two.extraDwellSeconds,0);
  assert.equal(two.operations[0].profile.phases.at(-1).finalAngularSpeedDegreesPerSecond,0);
  assert.equal(two.operations[1].profile.phases[0].initialAngularSpeedDegreesPerSecond,0);
});

test('instantaneous constant-rate control ties and is separate from the bounded model',()=>{
  const one=[180].reduce((s,a)=>s+a/180,0),two=[90,90].reduce((s,a)=>s+a/180,0);
  assert.equal(one,1);assert.equal(two,1);
  assert.ok(stoppedAngularSequenceTime([180],limits).modelSeconds>one);
});

test('sequence schedule is serial, preserves input and sums requested angles and profile times',()=>{
  const angles=[45,90,180],saved=JSON.stringify(angles),r=stoppedAngularSequenceTime(angles,limits);
  let clock=0;
  for(const op of r.operations){close(op.startSeconds,clock);close(op.endSeconds-op.startSeconds,op.profile.modelSeconds);clock=op.endSeconds;}
  close(clock,r.modelSeconds);close(r.totalAngleDegrees,315);assert.equal(JSON.stringify(angles),saved);
});

test('angular-unit rescaling preserves time when angle, rate and acceleration scale together',()=>{
  const radiansPerDegree=Math.PI/180;
  const degrees=angularRestToRestProfile(90,limits);
  const rescaled=angularRestToRestProfile(90*radiansPerDegree,{
    maxAngularSpeedDegreesPerSecond:180*radiansPerDegree,
    angularAccelerationMagnitudeDegreesPerSecondSquared:180*radiansPerDegree
  });
  close(degrees.modelSeconds,rescaled.modelSeconds);
  close(degrees.peakAngularSpeedDegreesPerSecond*radiansPerDegree,rescaled.peakAngularSpeedDegreesPerSecond);
});

test('invalid angles, limits and unrepresentable profiles are rejected',()=>{
  for(const angle of [-1,NaN,Infinity])assert.throws(()=>angularRestToRestProfile(angle,limits),TypeError);
  for(const name of Object.keys(limits))for(const value of [0,-1,NaN,Infinity]){
    assert.throws(()=>angularRestToRestProfile(90,{...limits,[name]:value}),TypeError);
  }
  for(const input of [[],[0],[90,-1],[NaN],Array(2),null])assert.throws(()=>stoppedAngularSequenceTime(input,limits),TypeError);
  assert.throws(()=>angularRestToRestProfile(90),TypeError);
  assert.throws(()=>angularRestToRestProfile(1,{...limits,maxAngularSpeedDegreesPerSecond:1e308}),RangeError);
});
