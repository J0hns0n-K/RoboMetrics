import {randomMap,plan,benchmark,verifyPath} from './core.mjs';
const $=id=>document.getElementById(id);
let batch=null;
function config(){return {seed:Math.max(1,Number($('seed').value)||1),density:Number($('density').value),maxExpansions:Number($('budget').value)};}
function svg(map,path){
 const scale=20,pts=new Set(path.map(([x,y])=>y*map.width+x));
 let out=`<svg viewBox="0 0 ${map.width*scale} ${map.height*scale}" xmlns="http://www.w3.org/2000/svg">`;
 for(let y=0;y<map.height;y++)for(let x=0;x<map.width;x++){
  const k=y*map.width+x,b=map.cells[k],onPath=pts.has(k);
  const fill=b?'#516072':onPath?'#5baddc':'#243143';
  out+=`<rect x="${x*scale+0.75}" y="${y*scale+0.75}" width="${scale-1.5}" height="${scale-1.5}" rx="2" fill="${fill}"/>`;
 }
 for(const [p,t] of [[map.start,'S'],[map.goal,'G']]){
  const [x,y]=p; out+=`<rect x="${x*scale+1}" y="${y*scale+1}" width="${scale-2}" height="${scale-2}" rx="2" fill="${t==='S'?'#2b9967':'#b77b35'}"/><text x="${(x+0.5)*scale}" y="${(y+0.67)*scale}" font-size="12" text-anchor="middle" font-weight="700" fill="white">${t}</text>`;
 }
 return out+'</svg>';
}
function showPair(){const c=config(),m=randomMap(c.seed,16,12,c.density);for(const a of ['astar','greedy']){
  const r=plan(m,a,c.maxExpansions); $('map-'+a).innerHTML=svg(m,r.path);
  $('result-'+a).textContent=r.success?`Path ${r.pathLength} steps · ${r.expanded} expanded · verified ${verifyPath(m,r.path)}`:`No path within budget (${r.reason}); ${r.expanded} expanded`;
 }}
function percent(x){return `${(x*100).toFixed(1)}%`};
function report(){if(!batch)return;const a=batch.summary.astar,g=batch.summary.greedy;const m=x=>x===null?'—':x.toFixed(2);
 $('report').innerHTML=`<span class="tag">Synthetic simulation, ${batch.configuration.runs} paired solvable maps</span><table><thead><tr><th>Metric</th><th>A*</th><th>Greedy</th></tr></thead><tbody><tr><td>Budgeted solve rate</td><td>${percent(a.successRate)}</td><td>${percent(g.successRate)}</td></tr><tr><td>Mean path steps (success only)</td><td>${m(a.meanPathLength)}</td><td>${m(g.meanPathLength)}</td></tr><tr><td>Mean path / shortest</td><td>${m(a.meanRelativeLength)}</td><td>${m(g.meanRelativeLength)}</td></tr><tr><td>Mean expanded nodes (all trials)</td><td>${m(a.meanExpanded)}</td><td>${m(g.meanExpanded)}</td></tr></tbody></table><p class="hint">Length statistics condition on success and may be biased when solve rates differ. This does not measure actual robot collisions or sensor robustness. Dataset includes full seeded trial rows.</p>`;
}
$('generate').addEventListener('click',()=>{const c=config();$('seed').value=String(c.seed+1);showPair()});
$('batch').addEventListener('click',()=>{try{batch=benchmark({...config(),runs:30});report();$('export').disabled=false}catch(e){$('report').textContent=String(e.message)}});
$('export').addEventListener('click',()=>{if(!batch)return;const url=URL.createObjectURL(new Blob([JSON.stringify(batch,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='robometrics-synthetic-benchmark.json';a.click();URL.revokeObjectURL(url)});
for(const id of ['density','budget','seed'])$(id).addEventListener('change',showPair);
showPair();
