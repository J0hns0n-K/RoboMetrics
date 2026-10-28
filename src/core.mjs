/**
 * RoboMetrics mentor starter reference implementation.
 * Created for kickoff 2026-10-27. NOT evidence of Junmo's independent code or experiments.
 * Grid-based GLOBAL PATH PLANNING only. No real robot, sensing, collision dynamics, or IoT.
 * Optional A* tie-breaking extension added by AI on 2026-10-28; FIFO remains the default.
 */
const VALID_ALGORITHMS = new Set(['astar', 'greedy', 'dijkstra']);
const VALID_TIE_BREAKS = new Set(['fifo', 'closer-goal']);
const OFFSETS = [[1,0],[0,1],[-1,0],[0,-1]];

export function makeMap(width, height, blocked = [], start = [0,0], goal = [width-1,height-1]) {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 2 || height < 2 || width > 80 || height > 80) throw new Error('Invalid grid size (2–80).');
  const inside = ([x,y]) => Number.isInteger(x) && Number.isInteger(y) && x >= 0 && y >= 0 && x < width && y < height;
  if (!inside(start) || !inside(goal)) throw new Error('Start and goal must be inside map.');
  const cells = new Uint8Array(width * height);
  for (const p of blocked) {
    if (!inside(p)) throw new Error('Obstacle coordinate outside grid.');
    cells[p[1]*width + p[0]] = 1;
  }
  if (cells[start[1]*width + start[0]] || cells[goal[1]*width + goal[0]]) throw new Error('Start and goal cannot be blocked.');
  return { width, height, cells, start: [...start], goal: [...goal] };
}

function rng(seed) {
  let s = (Math.floor(seed) >>> 0) || 1;
  return () => { s = (Math.imul(1664525,s)+1013904223)>>>0; return s / 4294967296; };
}
export function randomMap(seed, width=16, height=12, density=0.19) {
  if (!(density >= 0 && density <= 0.65)) throw new Error('Density should be 0–0.65.');
  const rand=rng(seed), blocked=[];
  for(let y=0;y<height;y++) for(let x=0;x<width;x++) {
    if ((x===0&&y===0) || (x===width-1&&y===height-1)) continue;
    if(rand()<density) blocked.push([x,y]);
  }
  return makeMap(width,height,blocked);
}

function key(x,y,w) { return y*w+x; }
function heuristic(a,b) { return Math.abs(a[0]-b[0]) + Math.abs(a[1]-b[1]); }
function score(algorithm, g, h) { return algorithm==='astar' ? g+h : algorithm==='greedy' ? h : g; }

export function plan(map, algorithm='astar', maxExpansions=Infinity, {tieBreak='fifo'}={}) {
  if(!VALID_ALGORITHMS.has(algorithm)) throw new Error('Unknown algorithm.');
  if(!(maxExpansions===Infinity || (Number.isInteger(maxExpansions) && maxExpansions>=1))) throw new Error('Invalid expansion budget.');
  if(!VALID_TIE_BREAKS.has(tieBreak)) throw new Error('Unknown tie-breaking rule.');
  if(algorithm!=='astar' && tieBreak!=='fifo') throw new Error('The optional tie-break applies only to A*.');
  const { width:w,height:h,cells,start,goal } = map;
  const goalKey=key(goal[0],goal[1],w), startKey=key(start[0],start[1],w);
  const distances=Array(w*h).fill(Infinity), parents=new Int32Array(w*h).fill(-1), closed=new Uint8Array(w*h);
  let tie=0, expansions=0;
  distances[startKey]=0;
  const frontier=[{k:startKey,g:0,priority:score(algorithm,0,heuristic(start,goal)),order:tie++}];
  while(frontier.length) {
    // A stable comparator makes seeded runs deterministic; no claim about CPU-independent timing.
    // At equal A* f=g+h, larger g is exactly smaller h. Primary f is unchanged.
    frontier.sort((a,b)=>a.priority-b.priority
      || (algorithm==='astar' && tieBreak==='closer-goal' ? b.g-a.g : 0)
      || a.order-b.order);
    const current=frontier.shift();
    if(closed[current.k] || current.g!==distances[current.k]) continue;
    if(expansions>=maxExpansions) return {success:false,reason:'BUDGET_EXCEEDED',path:[],pathLength:null,expanded:expansions};
    expansions++;
    closed[current.k]=1;
    if(current.k===goalKey) {
      const path=[]; let cursor=current.k;
      while(cursor!==-1) { path.push([cursor%w,Math.floor(cursor/w)]); cursor=parents[cursor]; }
      path.reverse();
      return {success:true,reason:null,path,pathLength:path.length-1,expanded:expansions};
    }
    const x=current.k%w,y=Math.floor(current.k/w);
    for (const [dx,dy] of OFFSETS) {
      const nx=x+dx,ny=y+dy;
      if(nx<0||ny<0||nx>=w||ny>=h) continue;
      const nk=key(nx,ny,w);
      if(cells[nk] || closed[nk]) continue;
      const cand=distances[current.k]+1;
      if(cand<distances[nk]) {
        distances[nk]=cand; parents[nk]=current.k;
        frontier.push({k:nk,g:cand,priority:score(algorithm,cand,heuristic([nx,ny],goal)),order:tie++});
      }
    }
  }
  return {success:false,reason:'UNREACHABLE',path:[],pathLength:null,expanded:expansions};
}

export function verifyPath(map,path) {
  if(!Array.isArray(path)||!path.length) return false;
  const eq=(a,b)=>a[0]===b[0]&&a[1]===b[1];
  if(!eq(path[0],map.start)||!eq(path[path.length-1],map.goal)) return false;
  return path.every(([x,y],i)=> x>=0&&y>=0&&x<map.width&&y<map.height&&!map.cells[y*map.width+x]
     &&(i===0||Math.abs(x-path[i-1][0])+Math.abs(y-path[i-1][1])===1));
}

/** Paired experiment on same solvable synthetic maps, filtered BEFORE algorithm comparison. */
export function benchmark({seed=20261027,runs=30,width=16,height=12,density=0.19,maxExpansions=180,astarTieBreak='fifo'}={}) {
  if(!Number.isInteger(runs)||runs<1||runs>250) throw new Error('Runs must be 1–250.');
  if(!VALID_TIE_BREAKS.has(astarTieBreak)) throw new Error('Unknown A* tie-breaking rule.');
  const algorithms=['astar','greedy'];
  const rows=[]; let checked=0;
  for(let n=0;n<runs;) {
    if(checked++ > runs*150) throw new Error('Could not sample enough solvable maps. Try lower density.');
    const candidateSeed=seed+checked;
    const map=randomMap(candidateSeed,width,height,density);
    const reference=plan(map,'dijkstra');
    if(!reference.success) continue;
    const results={};
    for(const a of algorithms) {
      const r=plan(map,a,maxExpansions,a==='astar'?{tieBreak:astarTieBreak}:{});
      results[a]={success:r.success,reason:r.reason,pathLength:r.pathLength,expanded:r.expanded,
        relativeLength:r.success ? r.pathLength/reference.pathLength : null};
    }
    rows.push({trial:n+1,seed:candidateSeed,referenceLength:reference.pathLength,results}); n++;
  }
  const summary={};
  for(const a of algorithms) {
    const trials=rows.map(r=>r.results[a]); const ok=trials.filter(t=>t.success);
    const mean=v=>v.length?v.reduce((s,x)=>s+x,0)/v.length:null;
    summary[a]={successRate:ok.length/runs,meanPathLength:mean(ok.map(r=>r.pathLength)),
      meanRelativeLength:mean(ok.map(r=>r.relativeLength)),meanExpanded:mean(trials.map(r=>r.expanded)),successful:ok.length};
  }
  return {label:'SYNTHETIC SIMULATION — NOT PHYSICAL ROBOT DATA',date:'2026-10-27 starter engine',
    configuration:{seed,runs,width,height,density,maxExpansions,astarTieBreak,neighborMode:'4-neighbor',obstacles:'static / fully known',sampling:'solvable only; rejection sample',algorithms}, summary,rows};
}
