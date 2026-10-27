import test from 'node:test';import assert from 'node:assert/strict';
import {makeMap,randomMap,plan,verifyPath,benchmark} from '../src/core.mjs';
test('open 3x3 grid: shortest path is Manhattan distance 4',()=>{
 const m=makeMap(3,3);for(const algo of ['astar','dijkstra','greedy']){
 const r=plan(m,algo);assert.equal(r.success,true);assert.equal(r.pathLength,4);assert.ok(verifyPath(m,r.path));
 }});
test('blocked goal is unreachable and explicit',()=>{
 const m=makeMap(3,3,[[1,0],[0,1]]);const r=plan(m,'astar');assert.equal(r.success,false);assert.equal(r.reason,'UNREACHABLE');
 });
test('budget limit is distinguishable from unreachable',()=>{
 const r=plan(makeMap(8,8),'astar',1);assert.equal(r.success,false);assert.equal(r.reason,'BUDGET_EXCEEDED');
});
test('deterministic map and deterministic search',()=>{
 const m1=randomMap(20261027),m2=randomMap(20261027);assert.deepEqual([...m1.cells],[...m2.cells]);
 assert.deepEqual(plan(m1,'astar'),plan(m2,'astar'));
});
test('A* path is optimal on sampled solvable static grids',()=>{
 let count=0;for(let seed=1;seed<70;seed++){const m=randomMap(seed,12,10,0.19);const d=plan(m,'dijkstra');if(!d.success)continue;
 const a=plan(m,'astar');assert.equal(a.pathLength,d.pathLength);assert.equal(verifyPath(m,a.path),true);count++;
 }assert.ok(count>10);
});
test('paired benchmark reproducible and metrics within bounds',()=>{
 const a=benchmark({seed:42,runs:6,maxExpansions:60}),b=benchmark({seed:42,runs:6,maxExpansions:60});assert.deepEqual(a,b);assert.equal(a.rows.length,6);
 for(const row of a.rows){assert.ok(Number.isInteger(row.seed));for(const algo of ['astar','greedy']){const r=row.results[algo];assert.ok(!r.success||r.pathLength>=row.referenceLength)}}
 for(const algo of ['astar','greedy'])assert.ok(a.summary[algo].successRate>=0&&a.summary[algo].successRate<=1);
});
