import test from 'node:test';
import assert from 'node:assert/strict';
import {boundedStopTurnTime} from '../src/bounded-path-time.mjs';
import {linearAccelStopTurnTime} from '../src/linear-accel-path-time.mjs';
const limits={initialHeading:'down',linearSpeed:1,linearAcceleration:1,angularSpeedDegrees:180,
  angularAccelerationMagnitudeDegreesPerSecondSquared:360};
const x=[[0,0],[1,0],[1,1],[2,1],[2,2],[3,2],[3,3]];
const student=[[0,0],[0,1],[0,2],[0,3],[1,3],[2,3],[3,3]];
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} versus ${b}`);

test('matched paths gain different bounded-angular penalties without changing translation',()=>{
  for(const [path,oldSeconds,newSeconds,rotations] of [[x,15,18,6],[student,8.5,9,1]]) {
    const old=linearAccelStopTurnTime(path,limits),r=boundedStopTurnTime(path,limits);
    close(old.modelSeconds,oldSeconds);close(r.modelSeconds,newSeconds);
    close(r.translationSeconds,old.translationSeconds);assert.equal(r.rotationOperations,rotations);
    for(const key of ['worldLength','directionChanges','intermediateStops','initialAlignmentDegrees','pathRotationDegrees','totalRotationDegrees']) {
      assert.equal(r[key],old[key]);
    }
    close(r.rotationSeconds,r.rotationOperations);
  }
});

test('initial alignment gets an angular profile independently of internal turns',()=>{
  const path=[[0,0],[1,0]],r=boundedStopTurnTime(path,limits);
  assert.equal(r.directionChanges,0);assert.equal(r.initialAlignmentDegrees,90);
  assert.equal(r.operations[0].kind,'rotate');close(r.operations[0].profile.modelSeconds,1);
  close(r.modelSeconds,3);
  const aligned=boundedStopTurnTime(path,{...limits,initialHeading:'right'});
  assert.equal(aligned.rotationOperations,0);close(aligned.modelSeconds,2);
});

test('a reversal uses a minimum180degree rest-to-rest profile without final alignment',()=>{
  const r=boundedStopTurnTime([[0,0],[1,0],[0,0]],{...limits,initialHeading:'right'});
  const turns=r.operations.filter(op=>op.kind==='rotate');
  assert.equal(turns.length,1);assert.equal(turns[0].angleDegrees,180);
  close(turns[0].profile.modelSeconds,1.5);close(r.modelSeconds,5.5);
  assert.equal(r.operations.at(-1).kind,'translate');
});

test('collinear sampling invariance survives angular composition but explicit stops remain distinct',()=>{
  const coarse=[[0,0],[1,0],[1,1]],fine=[[0,0],[.5,0],[1,0],[1,.5],[1,1]];
  const opts={...limits,initialHeading:'right'};
  const a=boundedStopTurnTime(coarse,opts),b=boundedStopTurnTime(fine,opts);
  close(a.modelSeconds,5);close(a.modelSeconds,b.modelSeconds);close(a.rotationSeconds,b.rotationSeconds);
  assert.equal(a.translationRuns,b.translationRuns);
  const every=boundedStopTurnTime(fine,{...opts,stopPolicy:'every-waypoint'});
  assert.ok(every.translationSeconds>b.translationSeconds);close(every.rotationSeconds,b.rotationSeconds);
});

test('serial schedule and component profiles preserve rest, geometry and duration sums',()=>{
  const old=linearAccelStopTurnTime(x,limits),r=boundedStopTurnTime(x,limits);
  let clock=0,translation=0,rotation=0;
  for(let i=0;i<r.operations.length;i++) {
    const op=r.operations[i];close(op.startSeconds,clock);close(op.endSeconds-op.startSeconds,op.durationSeconds);clock=op.endSeconds;
    if(op.kind==='translate') {
      assert.deepEqual(op.profile,old.operations[i].profile);
      assert.deepEqual(op.from,old.operations[i].from);assert.deepEqual(op.to,old.operations[i].to);
      assert.equal(op.profile.phases[0].initialSpeed,0);assert.equal(op.profile.phases.at(-1).finalSpeed,0);
      close(op.durationSeconds,op.profile.totalSeconds);translation+=op.durationSeconds;
    } else {
      assert.equal(op.profile.phases[0].initialAngularSpeedDegreesPerSecond,0);
      assert.equal(op.profile.phases.at(-1).finalAngularSpeedDegreesPerSecond,0);
      close(op.durationSeconds,op.profile.modelSeconds);rotation+=op.durationSeconds;
    }
  }
  close(clock,r.modelSeconds);close(translation,r.translationSeconds);close(rotation,r.rotationSeconds);
  close(translation+rotation,r.modelSeconds);
});

test('stationary input adds no target-heading operation and keeps zero totals',()=>{
  const r=boundedStopTurnTime([[2,2]],limits);
  assert.deepEqual(r.operations,[]);close(r.modelSeconds,0);close(r.rotationSeconds,0);
  assert.equal(r.rotationOperations,0);assert.equal(r.intermediateStops,0);
});

test('invalid angular limits and inherited invalid path/options fail explicitly',()=>{
  for(const value of [undefined,0,-1,NaN,Infinity]) {
    assert.throws(()=>boundedStopTurnTime(student,{...limits,angularAccelerationMagnitudeDegreesPerSecondSquared:value}),TypeError);
  }
  for(const path of [[],[[0,0],[0,0]],[[0,0],[1,1]]])assert.throws(()=>boundedStopTurnTime(path,limits),TypeError);
  assert.throws(()=>boundedStopTurnTime(student,{...limits,initialHeading:'unknown'}),TypeError);
  assert.throws(()=>boundedStopTurnTime(student,{...limits,stopPolicy:'unknown'}),TypeError);
  assert.throws(()=>boundedStopTurnTime(x,{...limits,angularAccelerationMagnitudeDegreesPerSecondSquared:Number.MIN_VALUE}),RangeError);
});

test('new composition leaves input options/path and legacy reference output unchanged',()=>{
  const path=structuredClone(student),opts={...limits},saved=JSON.stringify({path,opts});
  const before=JSON.stringify(linearAccelStopTurnTime(path,opts));
  const r=boundedStopTurnTime(path,opts);
  assert.equal(JSON.stringify({path,opts}),saved);
  assert.equal(JSON.stringify(linearAccelStopTurnTime(path,opts)),before);
  assert.notEqual(r.modelSeconds,JSON.parse(before).modelSeconds);
});
