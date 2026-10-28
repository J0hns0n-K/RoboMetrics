import {randomMap,plan,benchmark,verifyPath} from './core.mjs';
const $=id=>document.getElementById(id);
let batch=null;
const rules={'closer-goal':'② 목표에 가까운 후보 먼저',fifo:'① 먼저 등록된 후보 먼저'};
function config(){
 const seed=Math.min(1e9,Math.max(1,Math.trunc(Number($('seed').value)||1)));
 $('seed').value=String(seed);
 return {seed,density:Number($('density').value),maxExpansions:Number($('budget').value),astarTieBreak:$('tie-break').value};
}
function clearBatch(){batch=null;$('export').disabled=true;$('report').textContent='설정이 바뀌었습니다. 새 조건으로 ‘지도 30장 비교’를 눌러 주세요.';}
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
function showPair(){const c=config(),m=randomMap(c.seed,16,12,c.density);$('astar-rule').textContent=`동점일 때: ${rules[c.astarTieBreak]}`;for(const a of ['astar','greedy']){
  const r=plan(m,a,c.maxExpansions,a==='astar'?{tieBreak:c.astarTieBreak}:{});
  if(r.success&&!verifyPath(m,r.path))throw new Error('경로 검증에 실패했습니다.');
  $('map-'+a).innerHTML=svg(m,r.path);
  $('result-'+a).textContent=r.success?`경로: ${r.pathLength}번 이동 · 검토: ${r.expanded}칸`:
   r.reason==='BUDGET_EXCEEDED'?`검토 예산 초과 · ${r.expanded}칸 검토`:`연결 경로 없음 · ${r.expanded}칸 검토`;
 }}
function percent(x){return `${(x*100).toFixed(1)}%`};
function report(){if(!batch)return;const a=batch.summary.astar,g=batch.summary.greedy;const m=x=>x===null?'—':x.toFixed(2);
 const c=batch.configuration;
 $('report').innerHTML=`<span class="tag">${c.runs}장 · 검토 예산 ${c.maxExpansions}칸 · A*: ${rules[c.astarTieBreak]}</span><p class="hint">지도 기준 번호 ${c.seed} · 장애물 생성 확률 ${(c.density*100).toFixed(0)}%</p><table><thead><tr><th>비교 항목</th><th>A*</th><th>Greedy</th></tr></thead><tbody><tr><td>길을 찾은 지도 수</td><td>${a.successful}/${c.runs}장 (${percent(a.successRate)})</td><td>${g.successful}/${c.runs}장 (${percent(g.successRate)})</td></tr><tr><td>평균 이동 횟수<br>(성공한 지도만)</td><td>${m(a.meanPathLength)}번 · ${a.successful}장 기준</td><td>${m(g.meanPathLength)}번 · ${g.successful}장 기준</td></tr><tr><td>최단경로 대비 평균 배수<br>(성공한 지도만)</td><td>${m(a.meanRelativeLength)}배</td><td>${m(g.meanRelativeLength)}배</td></tr><tr><td>평균 검토 칸 수<br>(모든 지도)</td><td>${m(a.meanExpanded)}칸</td><td>${m(g.meanExpanded)}칸</td></tr></tbody></table><p class="hint">두 방법에서 성공한 지도가 다르면 평균 이동 횟수의 비교 대상도 달라집니다. 전체 원시 행과 선택한 동점 규칙은 JSON에 포함됩니다.</p>`;
}
$('generate').addEventListener('click',()=>{const c=config();$('seed').value=String(c.seed<1e9?c.seed+1:1);clearBatch();showPair()});
$('batch').addEventListener('click',()=>{try{
 batch={...benchmark({...config(),runs:30}),browserExport:{generatedAtUTC:new Date().toISOString(),sourceCommit:null,
  provenance:'Browser demonstration; exact source revision and execution operator are not independently recorded here. Use the commit-bound CLI outputs for research provenance.'}};
 report();$('export').disabled=false;
 }catch(e){clearBatch();$('report').textContent=String(e.message)}});
$('export').addEventListener('click',()=>{if(!batch)return;const url=URL.createObjectURL(new Blob([JSON.stringify(batch,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;const c=batch.configuration;a.download=`robometrics-${c.astarTieBreak}-seed-${c.seed}-budget-${c.maxExpansions}.json`;a.click();URL.revokeObjectURL(url)});
for(const id of ['density','budget','seed','tie-break'])$(id).addEventListener('change',()=>{clearBatch();showPair()});
showPair();
