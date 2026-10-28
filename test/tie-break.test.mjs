import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {makeMap,randomMap,plan,verifyPath} from '../src/core.mjs';

test('optional tie-break preserves all 720 recorded default A*/Greedy policy metrics',()=>{
  const matrix=JSON.parse(readFileSync(new URL('../data/batch/early-matrix-run-01.json',import.meta.url),'utf8'));
  let checked=0;
  for(const condition of matrix.conditions)for(const row of condition.rows){
    const c=condition.configuration;
    const map=randomMap(row.seed,c.width,c.height,c.density);
    for(const algorithm of ['astar','greedy']){
      const actual=plan(map,algorithm,c.maxExpansions);
      for(const key of ['success','reason','pathLength','expanded'])assert.equal(actual[key],row.results[algorithm][key]);
      if(actual.success)assert.ok(verifyPath(map,actual.path));
      assert.deepEqual(plan(map,algorithm,c.maxExpansions,{tieBreak:'fifo'}),actual);
      checked++;
    }
  }
  assert.equal(checked,720);
});

test('goal-directed ties retain optimality and reachability on every 4x3 obstacle layout',()=>{
  const cells=[];
  for(let y=0;y<3;y++)for(let x=0;x<4;x++)if(!(x===0&&y===0)&&!(x===3&&y===2))cells.push([x,y]);
  for(let mask=0;mask<2**cells.length;mask++){
    const map=makeMap(4,3,cells.filter((_,i)=>mask&(1<<i)));
    // The separate audit suite checks this default Dijkstra against independent BFS on all these layouts.
    const reference=plan(map,'dijkstra');
    const variant=plan(map,'astar',Infinity,{tieBreak:'closer-goal'});
    assert.equal(variant.success,reference.success);
    assert.equal(variant.pathLength,reference.pathLength);
    if(variant.success){
      assert.ok(verifyPath(map,variant.path));
      assert.deepEqual(plan(map,'astar',variant.expanded,{tieBreak:'closer-goal'}),variant);
      assert.equal(plan(map,'astar',variant.expanded-1,{tieBreak:'closer-goal'}).reason,'BUDGET_EXCEEDED');
    }
  }
});

test('small control can keep the same optimal route length with different examined-node counts',()=>{
  const map=makeMap(3,3,[[1,1]]);
  const fifo=plan(map,'astar');
  const goal=plan(map,'astar',Infinity,{tieBreak:'closer-goal'});
  assert.equal(fifo.pathLength,4);assert.equal(goal.pathLength,4);
  assert.equal(fifo.expanded,8);assert.equal(goal.expanded,5);
  assert.ok(verifyPath(map,goal.path));
  assert.equal(plan(map,'astar',5).success,false);
  assert.equal(plan(map,'astar',5,{tieBreak:'closer-goal'}).success,true);
});
