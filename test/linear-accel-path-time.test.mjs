import test from 'node:test';
import assert from 'node:assert/strict';
import {restToRestProfile,linearAccelStopTurnTime} from '../src/linear-accel-path-time.mjs';
import {nominalStopTurnTime} from '../src/nominal-path-time.mjs';
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} versus ${b}`);
const limits={initialHeading:'down',linearSpeed:1,linearAcceleration:1,angularSpeedDegrees:180};

test('rest-to-rest profiles distinguish triangular, cruise and stationary cases',()=>{
  const short=restToRestProfile(.25,{maxSpeed:1,acceleration:1});
  assert.equal(short.shape,'triangular');close(short.peakSpeed,.5);close(short.totalSeconds,1);
  const long=restToRestProfile(3,{maxSpeed:1,acceleration:1});
  assert.equal(long.shape,'trapezoidal');close(long.totalSeconds,4);
  assert.deepEqual(long.phases.map(p=>p.kind),['accelerate','cruise','brake']);
  assert.equal(restToRestProfile(0,{maxSpeed:1,acceleration:1}).totalSeconds,0);
});
test('threshold profiles are continuous and respect speed and acceleration caps',()=>{
  for(const d of [1-1e-8,1,1+1e-8]){
    const r=restToRestProfile(d,{maxSpeed:1,acceleration:1});
    assert.ok(r.peakSpeed<=1);close(r.phases.reduce((s,p)=>s+p.distance,0),d);
    assert.ok(r.phases.every(p=>Math.abs(p.acceleration)<=1+1e-12));
    assert.ok(Math.abs(r.totalSeconds-2)<2e-8);
  }
});
test('phase integrals, continuity and endpoint rest reconstruct requested distance',()=>{
  for(const d of [.5,1,3,9]){
    const r=restToRestProfile(d,{maxSpeed:2,acceleration:1});
    assert.equal(r.phases[0].initialSpeed,0);assert.equal(r.phases.at(-1).finalSpeed,0);
    for(let i=0;i<r.phases.length;i++){
      const p=r.phases[i];close(p.distance,(p.initialSpeed+p.finalSpeed)*p.duration/2);
      if(i)close(r.phases[i-1].finalSpeed,p.initialSpeed);
      assert.ok(Math.max(p.initialSpeed,p.finalSpeed)<=2);
    }
    close(r.phases.reduce((s,p)=>s+p.distance,0),d);
  }
});
test('straight continuation avoids two unnecessary restarts in the offered three-unit control',()=>{
  const p=[[0,0],[1,0],[2,0],[3,0]];
  const a=linearAccelStopTurnTime(p,{...limits,initialHeading:'right'});
  const b=linearAccelStopTurnTime(p,{...limits,initialHeading:'right',stopPolicy:'every-waypoint'});
  close(a.modelSeconds,4);close(b.modelSeconds,6);
  assert.equal(a.translationRuns,1);assert.equal(a.intermediateStops,0);
  assert.equal(b.translationRuns,3);assert.equal(b.intermediateStops,2);
});
test('turns-only is invariant to collinear half-step sampling; explicit waypoint stops are not',()=>{
  const coarse=[[0,0],[1,0],[2,0],[3,0]],fine=[[0,0],[.5,0],[1,0],[1.5,0],[2,0],[2.5,0],[3,0]];
  const saved=JSON.stringify(fine);
  const a=linearAccelStopTurnTime(coarse,{...limits,initialHeading:'right'});
  const b=linearAccelStopTurnTime(fine,{...limits,initialHeading:'right'});
  for(const key of ['worldLength','translationRuns','intermediateStops','modelSeconds'])close(a[key],b[key]);
  const every=linearAccelStopTurnTime(fine,{...limits,initialHeading:'right',stopPolicy:'every-waypoint'});
  assert.ok(every.modelSeconds>6);assert.equal(every.intermediateStops,5);
  assert.equal(JSON.stringify(fine),saved);
});
test('an all-turn path is a counterexample to strict improvement from merging',()=>{
  const x=[[0,0],[1,0],[1,1],[2,1],[2,2],[3,2],[3,3]];
  const a=linearAccelStopTurnTime(x,limits),b=linearAccelStopTurnTime(x,{...limits,stopPolicy:'every-waypoint'});
  close(a.modelSeconds,15);close(a.modelSeconds,b.modelSeconds);assert.equal(a.intermediateStops,5);
});
test('the offered longer straight runs gain five model seconds under identical limits',()=>{
  const y=[[0,0],[0,1],[0,2],[0,3],[0,4],[1,4],[2,4],[3,4],[3,3]];
  const a=linearAccelStopTurnTime(y,limits),b=linearAccelStopTurnTime(y,{...limits,stopPolicy:'every-waypoint'});
  close(a.translationSeconds,11);close(a.rotationSeconds,1);close(a.modelSeconds,12);
  close(b.modelSeconds,17);close(b.modelSeconds-a.modelSeconds,5);
});
test('constant-rate legacy timing is preserved separately and is a lower control for this schedule',()=>{
  const path=[[0,0],[1,0],[1,1]];
  const old=nominalStopTurnTime(path,{...limits,initialHeading:'right'});
  close(old.nominalSeconds,2.5);
  const added=linearAccelStopTurnTime(path,{...limits,initialHeading:'right'});
  close(added.modelSeconds,4.5);assert.ok(added.translationSeconds>=old.translationSeconds);
});
test('a reversal is not merged into a straight run and initial alignment remains explicit',()=>{
  const r=linearAccelStopTurnTime([[0,0],[1,0],[0,0]],{...limits,initialHeading:'right'});
  assert.equal(r.translationRuns,2);assert.equal(r.directionChanges,1);assert.equal(r.totalRotationDegrees,180);
  close(r.modelSeconds,5);
  assert.equal(linearAccelStopTurnTime([[0,0],[1,0]],limits).initialAlignmentDegrees,90);
});
test('stationary paths add no operation or target-heading alignment',()=>{
  const r=linearAccelStopTurnTime([[2,2]],limits);
  assert.equal(r.modelSeconds,0);assert.equal(r.operations.length,0);assert.equal(r.intermediateStops,0);
});
test('invalid paths, limits, policies and unrepresentable profile transitions are rejected',()=>{
  for(const path of [[],[[0,0],[0,0]],[[0,0],[1,1]]])assert.throws(()=>linearAccelStopTurnTime(path,limits),TypeError);
  for(const key of ['linearSpeed','linearAcceleration','angularSpeedDegrees'])for(const value of [0,-1,NaN,Infinity]){
    assert.throws(()=>linearAccelStopTurnTime([[0,0]],{...limits,[key]:value}),TypeError);
  }
  assert.throws(()=>linearAccelStopTurnTime([[0,0]],{...limits,initialHeading:undefined}),TypeError);
  assert.throws(()=>linearAccelStopTurnTime([[0,0]],{...limits,stopPolicy:'unknown'}),TypeError);
  assert.throws(()=>restToRestProfile(-1,{maxSpeed:1,acceleration:1}),TypeError);
  assert.throws(()=>restToRestProfile(1,{maxSpeed:1e308,acceleration:1}),RangeError);
  assert.throws(()=>restToRestProfile(Number.MIN_VALUE,{maxSpeed:1,acceleration:1e308}),RangeError);
});
test('analytic operation schedule is serial and both duration components add to the total',()=>{
  const r=linearAccelStopTurnTime([[0,0],[1,0],[2,0],[2,1]],{...limits,initialHeading:'up'});
  let time=0;
  for(const op of r.operations){close(op.startSeconds,time);close(op.endSeconds-op.startSeconds,op.durationSeconds);time=op.endSeconds;}
  close(time,r.modelSeconds);close(r.translationSeconds+r.rotationSeconds,r.modelSeconds);
  assert.equal(r.totalRotationDegrees,180);
});
