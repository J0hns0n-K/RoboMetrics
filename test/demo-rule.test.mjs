import test from 'node:test';
import assert from 'node:assert/strict';
import {benchmark,randomMap,plan} from '../src/core.mjs';

test('benchmark exports the selected A* tie rule and applies it without changing paired maps or Greedy',()=>{
  const config={seed:42,runs:6,width:8,height:6,density:.19,maxExpansions:50};
  const fifo=benchmark({...config,astarTieBreak:'fifo'});
  const goal=benchmark({...config,astarTieBreak:'closer-goal'});
  assert.equal(fifo.configuration.astarTieBreak,'fifo');
  assert.equal(goal.configuration.astarTieBreak,'closer-goal');
  assert.equal(benchmark(config).configuration.astarTieBreak,'fifo');
  assert.deepEqual(fifo.rows.map(r=>r.seed),goal.rows.map(r=>r.seed));
  for(let i=0;i<goal.rows.length;i++){
    assert.deepEqual(fifo.rows[i].results.greedy,goal.rows[i].results.greedy);
    for(const [batch,mode] of [[fifo,'fifo'],[goal,'closer-goal']]){
      const row=batch.rows[i];
      const r=plan(randomMap(row.seed,config.width,config.height,config.density),'astar',config.maxExpansions,{tieBreak:mode});
      for(const key of ['success','reason','pathLength','expanded'])assert.equal(row.results.astar[key],r[key]);
    }
  }
});
