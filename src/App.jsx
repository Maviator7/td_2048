import { useState, useEffect, useCallback } from "react";

const COLS = 4, ROWS = 6, INIT_LIVES = 5, ENEMY_MAX_STEPS = 9;
const MOVES_PER_TURN = 3; // ← 1ターンに動かせる回数
const LANE_COLORS = ["#e74c3c","#3498db","#27ae60","#9b59b6"];
const LANE_NAMES = ["A","B","C","D"];

function slideLine(line) {
  const nums = line.filter(Boolean); const result = []; let score = 0, i = 0;
  while (i < nums.length) {
    if (i+1 < nums.length && nums[i]===nums[i+1]) { const v=nums[i]*2; result.push(v); score+=v; i+=2; }
    else { result.push(nums[i]); i++; }
  }
  while (result.length < line.length) result.push(0);
  return { line: result, score };
}

function slideGrid(grid, dir) {
  const g = grid.map(r=>[...r]); let score=0, moved=false;
  const proc = line => {
    const b=line.join(); const {line:a,score:s}=slideLine(line);
    if(a.join()!==b) moved=true; score+=s; return a;
  };
  if(dir==="left")       for(let r=0;r<ROWS;r++) g[r]=proc(g[r]);
  else if(dir==="right") for(let r=0;r<ROWS;r++) g[r]=proc([...g[r]].reverse()).reverse();
  else if(dir==="up")    for(let c=0;c<COLS;c++){const col=proc(g.map(r=>r[c]));col.forEach((v,r)=>g[r][c]=v);}
  else if(dir==="down")  for(let c=0;c<COLS;c++){const col=proc(g.map(r=>r[c]).reverse()).reverse();col.forEach((v,r)=>g[r][c]=v);}
  return {grid:g,score,moved};
}

const emptyGrid = () => Array(ROWS).fill(null).map(()=>Array(COLS).fill(0));
function addTile(grid) {
  const empty=[]; for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++) if(!grid[r][c]) empty.push([r,c]);
  if(!empty.length) return grid;
  const [r,c]=empty[Math.floor(Math.random()*empty.length)];
  const ng=grid.map(row=>[...row]); ng[r][c]=Math.random()<0.85?2:4; return ng;
}
function canMove(grid) {
  for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++){
    if(!grid[r][c]) return true;
    if(c+1<COLS&&grid[r][c]===grid[r][c+1]) return true;
    if(r+1<ROWS&&grid[r][c]===grid[r+1][c]) return true;
  } return false;
}

let eid=0;
function makeEnemy(lane, waveNum) {
  const base=(waveNum+1)*18, hp=Math.floor(base*(0.7+Math.random()*0.6));
  const armor=waveNum>=4?Math.pow(2,Math.min(Math.floor((waveNum-2)/2),7)):0;
  const isBoss=waveNum>0&&Math.random()<0.15;
  return {id:`e${eid++}`,lane,hp:isBoss?hp*3:hp,maxHp:isBoss?hp*3:hp,armor:isBoss?armor*2:armor,step:0,isBoss};
}
function spawnWave(waveNum) {
  const count=4+waveNum*2;
  return Array.from({length:count},(_,i)=>{const e=makeEnemy(Math.floor(Math.random()*COLS),waveNum);e.step=-(i*1.5);return e;});
}

function tileColor(val) {
  const map={2:["#eee4da","#776e65"],4:["#ede0c8","#776e65"],8:["#f2b179","#fff"],16:["#f59563","#fff"],32:["#f67c5f","#fff"],64:["#f65e3b","#fff"],128:["#edcf72","#f9f6f2"],256:["#edcc61","#f9f6f2"],512:["#edc850","#f9f6f2"],1024:["#edc53f","#f9f6f2"],2048:["#edc22e","#f9f6f2"]};
  return map[val]||["#3c3a32","#f9f6f2"];
}

export default function MergeTowerDefense() {
  const [grid, setGrid]       = useState(()=>addTile(addTile(emptyGrid())));
  const [enemies, setEnemies] = useState(()=>spawnWave(0));
  const [lives, setLives]     = useState(INIT_LIVES);
  const [wave, setWave]       = useState(1);
  const [score, setScore]     = useState(0);
  const [phase, setPhase]     = useState("player"); // "player" | "resolving" | "waveclear" | "gameover"
  const [movesLeft, setMovesLeft] = useState(MOVES_PER_TURN);
  const [log, setLog]         = useState(["⚔️ Wave 1 開始！3回スライドして備えよ！"]);
  const [atkCols, setAtkCols] = useState([]);
  const [dmgMap, setDmgMap]   = useState({});
  const [mergeHL, setMergeHL] = useState([]);
  const [viewportWidth, setViewportWidth] = useState(() => window.innerWidth);

  const pushLog = useCallback(msg => setLog(l=>[msg,...l].slice(0,8)), []);

  // ── Battle resolution (called when movesLeft hits 0) ──────────────
  const resolveTurn = useCallback((currentGrid, currentEnemies, currentLives, currentWave) => {
    let cur = currentEnemies.map(e=>({...e}));
    let newLives = currentLives, gainedScore = 0;
    const atkSet=[], dmg={};

    const newlyDeployedIds = new Set();
    cur = cur.map(e => {
      const nextStep = e.step + 1;
      if (e.step <= 0 && nextStep > 0) newlyDeployedIds.add(e.id);
      return {...e, step: nextStep};
    });

    for(let c=0;c<COLS;c++){
      let power=0; for(let r=0;r<ROWS;r++) power+=currentGrid[r][c];
      if(!power) continue;
      const targets=cur
        .filter(e => e.lane===c && e.step>0 && !newlyDeployedIds.has(e.id))
        .sort((a,b)=>b.step-a.step);
      if(!targets.length) continue;
      const t=targets[0];
      if(power<=t.armor){pushLog(`🛡️ レーン${LANE_NAMES[c]}: 装甲${t.armor}に弾かれた！`);continue;}
      const d=power-t.armor; dmg[c]=d; atkSet.push(c);
      cur=cur.map(e=>e.id===t.id?{...e,hp:e.hp-d}:e);
    }

    const killed=cur.filter(e=>e.hp<=0);
    killed.forEach(e=>{const s=e.maxHp*(e.isBoss?5:2);gainedScore+=s;pushLog(`${e.isBoss?"💥ボス":"✅"}撃破！+${s}pts`);});
    cur=cur.filter(e=>e.hp>0);

    const reached=cur.filter(e=>e.step>=ENEMY_MAX_STEPS);
    if(reached.length){newLives=Math.max(0,newLives-reached.length);pushLog(`⚠️ ${reached.length}体突破！-${reached.length}ライフ`);}
    cur=cur.filter(e=>e.step<ENEMY_MAX_STEPS);

    setAtkCols(atkSet); setDmgMap(dmg);
    setTimeout(()=>{setAtkCols([]);setDmgMap({});},500);

    setEnemies(cur); setLives(newLives); setScore(s=>s+gainedScore);

    if(newLives<=0){ setPhase("gameover"); pushLog("💀 ライフ0！ゲームオーバー！"); return; }
    if(cur.length===0){ setPhase("waveclear"); pushLog(`🎉 Wave ${currentWave} クリア！`); return; }

    // Next player turn
    setTimeout(()=>{
      setMovesLeft(MOVES_PER_TURN);
      setPhase("player");
      pushLog(`🔄 新ターン！残り${MOVES_PER_TURN}手`);
    }, 600);
  }, [pushLog]);

  // ── Slide ─────────────────────────────────────────────────────────
  const handleSlide = useCallback(dir => {
    if(phase !== "player") return;
    const {grid:ng, score:gained, moved} = slideGrid(grid, dir);
    if(!moved) return;

    const merged=[];
    for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++) if(ng[r][c]!==grid[r][c]&&ng[r][c]>0) merged.push(`${r}-${c}`);
    const wt = addTile(ng);
    setGrid(wt);
    if(gained){ setScore(s=>s+gained); pushLog(`🔀 合体！+${gained}pts`); }
    if(merged.length){ setMergeHL(merged); setTimeout(()=>setMergeHL([]),400); }

    if(!canMove(wt)){ setPhase("gameover"); pushLog("💀 グリッド満杯！ゲームオーバー！"); return; }

    const next = movesLeft - 1;
    setMovesLeft(next);
    if(next <= 0){
      pushLog("⚔️ 手数終了 → 攻撃！");
      setPhase("resolving");
      setTimeout(()=>resolveTurn(wt, enemies, lives, wave), 200);
    } else {
      pushLog(`残り${next}手`);
    }
  }, [grid, phase, movesLeft, enemies, lives, wave, pushLog, resolveTurn]);

  const nextWave = useCallback(()=>{
    const nw=wave+1; setWave(nw); setEnemies(spawnWave(nw-1));
    setMovesLeft(MOVES_PER_TURN); setPhase("player");
    pushLog(`⚔️ Wave ${nw} 開始！${nw>=4?"装甲敵が登場！":""}`);
  },[wave,pushLog]);

  const restart = ()=>{
    eid=0; setGrid(addTile(addTile(emptyGrid()))); setEnemies(spawnWave(0));
    setLives(INIT_LIVES); setWave(1); setScore(0);
    setMovesLeft(MOVES_PER_TURN); setPhase("player");
    setLog(["⚔️ Wave 1 開始！3回スライドして備えよ！"]);
  };

  // Keyboard
  useEffect(()=>{
    const h=e=>{
      const m={ArrowLeft:"left",ArrowRight:"right",ArrowUp:"up",ArrowDown:"down"};
      if(m[e.key]){e.preventDefault();handleSlide(m[e.key]);}
    };
    window.addEventListener("keydown",h);
    return()=>window.removeEventListener("keydown",h);
  },[handleSlide]);

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const colPower=Array(COLS).fill(0).map((_,c)=>{let p=0;for(let r=0;r<ROWS;r++)p+=grid[r][c];return p;});
  const queuedEnemies = enemies.filter(e => e.step <= 0);
  const nextSpawnEnemy = queuedEnemies.length
    ? [...queuedEnemies].sort((a, b) => b.step - a.step)[0]
    : null;
  const isPlayer = phase==="player";
  const isDesktop = viewportWidth >= 768;
  const isWideDesktop = viewportWidth >= 1200;
  const tileHeight = isWideDesktop ? 62 : isDesktop ? 56 : 54;
  const laneHeight = isWideDesktop ? 160 : isDesktop ? 140 : 130;

  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#0f0e17 0%,#1a1a2e 100%)",display:"flex",justifyContent:"center",padding:"12px 8px",fontFamily:"'Segoe UI',sans-serif"}}>
      <div style={{width:"100%",maxWidth:isDesktop?"100%":420}}>

        {/* Title */}
        <div style={{textAlign:"center",marginBottom:10}}>
          <h1 style={{margin:0,fontSize:22,color:"#f1c40f",letterSpacing:1,textShadow:"0 0 12px #f1c40f88"}}>🗼 MERGE TOWER DEFENSE</h1>
          <div style={{fontSize:11,color:"#555",marginTop:2}}>スライドで砲塔合体 → 敵を撃退せよ</div>
        </div>

        {/* HUD */}
        <div style={{display:"flex",justifyContent:"space-between",background:"#16213e",borderRadius:12,padding:"10px 16px",marginBottom:10,border:"1px solid #2a2a4a"}}>
          <div style={{textAlign:"center"}}><div style={{fontSize:9,color:"#555"}}>LIVES</div><div style={{fontSize:15,color:"#e74c3c"}}>{lives>0?("❤️".repeat(Math.min(lives,5))+(lives>5?`+${lives-5}`:"")):"💀"}</div></div>
          <div style={{textAlign:"center"}}><div style={{fontSize:9,color:"#555"}}>WAVE</div><div style={{fontSize:26,fontWeight:"bold",color:"#f1c40f",lineHeight:1.1}}>{wave}</div></div>
          <div style={{textAlign:"center"}}><div style={{fontSize:9,color:"#555"}}>SCORE</div><div style={{fontSize:15,color:"#2ecc71"}}>{score.toLocaleString()}</div></div>
        </div>

        {/* Moves indicator */}
        <div style={{display:"flex",justifyContent:"center",gap:6,marginBottom:8,alignItems:"center"}}>
          <span style={{fontSize:11,color:"#888"}}>残り手数：</span>
          {Array(MOVES_PER_TURN).fill(0).map((_,i)=>(
            <div key={i} style={{width:22,height:22,borderRadius:6,background:i<movesLeft?"#f1c40f":"#1e2a3a",border:`2px solid ${i<movesLeft?"#f1c40f":"#2a3a4a"}`,transition:"all 0.2s",boxShadow:i<movesLeft?"0 0 8px #f1c40f88":"none"}}/>
          ))}
          {phase==="resolving"&&<span style={{fontSize:11,color:"#e74c3c",marginLeft:4}}>⚔️ 攻撃中...</span>}
        </div>

        <div
          className={nextSpawnEnemy ? "next-spawn-panel" : undefined}
          style={{
            display:"flex",
            justifyContent:"center",
            alignItems:"center",
            gap:8,
            marginBottom:10,
            padding:"8px 10px",
            background:"#0d1117",
            border:"1px solid #1e2a3a",
            borderRadius:10,
            ...(nextSpawnEnemy ? {"--next-glow-color": LANE_COLORS[nextSpawnEnemy.lane]} : {}),
          }}
        >
          <span style={{fontSize:11,color:"#888"}}>次の出現列</span>
          {nextSpawnEnemy ? (
            <>
              <div className="next-spawn-dot" style={{width:12,height:12,borderRadius:"50%",background:LANE_COLORS[nextSpawnEnemy.lane],boxShadow:`0 0 10px ${LANE_COLORS[nextSpawnEnemy.lane]}88`}} />
              <span style={{fontSize:14,fontWeight:"bold",color:LANE_COLORS[nextSpawnEnemy.lane],textShadow:`0 0 10px ${LANE_COLORS[nextSpawnEnemy.lane]}66`}}>
                レーン {LANE_NAMES[nextSpawnEnemy.lane]}
              </span>
            </>
          ) : (
            <span style={{fontSize:12,color:"#555"}}>待機中の敵なし</span>
          )}
        </div>

        <div style={{display:"grid",gridTemplateColumns:isDesktop?"minmax(0,1fr) minmax(280px,360px)":"1fr",gap:12,alignItems:"start"}}>
          <div style={{width:"100%"}}>
            {/* Column power labels */}
            <div style={{display:"flex",gap:4,marginBottom:3}}>
              {Array(COLS).fill(0).map((_,c)=>(
                <div
                  key={c}
                  style={{
                    flex:1,
                    textAlign:"center",
                    fontSize:isDesktop?12:10,
                    color:LANE_COLORS[c],
                    fontWeight:"bold",
                    borderRadius:999,
                    padding:"2px 0",
                    background:nextSpawnEnemy?.lane===c ? `${LANE_COLORS[c]}22` : "transparent",
                    boxShadow:nextSpawnEnemy?.lane===c ? `0 0 12px ${LANE_COLORS[c]}33` : "none",
                    textShadow:nextSpawnEnemy?.lane===c ? `0 0 8px ${LANE_COLORS[c]}66` : "none",
                    transition:"all 0.2s",
                  }}
                >
                  {LANE_NAMES[c]} 砲:{colPower[c]}{nextSpawnEnemy?.lane===c?"  NEXT":""}
                </div>
              ))}
            </div>

            {/* Enemy Lanes */}
            <div style={{display:"flex",gap:4,height:laneHeight,marginBottom:6}}>
              {Array(COLS).fill(0).map((_,c)=>{
                const laneEnemies=enemies.filter(e=>e.lane===c&&e.step>0).sort((a,b)=>b.step-a.step);
                const queued=enemies.filter(e=>e.lane===c&&e.step<=0).length;
                const isAtk=atkCols.includes(c);
                const isNextSpawnLane = nextSpawnEnemy?.lane === c;
                return (
                  <div
                    key={c}
                    className={isNextSpawnLane ? "next-lane-pulse" : undefined}
                    style={{
                      flex:1,
                      position:"relative",
                      background:isAtk?"#1a1000":isNextSpawnLane?`${LANE_COLORS[c]}14`:"#0d1117",
                      border:`2px solid ${isAtk?"#f1c40f":isNextSpawnLane?LANE_COLORS[c]:LANE_COLORS[c]+"44"}`,
                      borderRadius:8,
                      overflow:"hidden",
                      transition:"all 0.2s",
                      ...(isNextSpawnLane ? {"--next-glow-color": LANE_COLORS[c]} : {}),
                    }}
                  >
                    {isNextSpawnLane&&<div style={{position:"absolute",top:4,right:4,padding:"2px 5px",borderRadius:999,fontSize:8,fontWeight:"bold",letterSpacing:0.6,color:"#fff",background:LANE_COLORS[c],boxShadow:`0 0 10px ${LANE_COLORS[c]}88`,zIndex:4}}>NEXT</div>}
                    {isNextSpawnLane&&<div style={{position:"absolute",inset:0,background:`linear-gradient(180deg, ${LANE_COLORS[c]}20 0%, transparent 38%, ${LANE_COLORS[c]}16 100%)`,zIndex:1,pointerEvents:"none"}}/>}
                    {isAtk&&<div style={{position:"absolute",inset:0,background:LANE_COLORS[c]+"22",zIndex:2}}/>}
                    {dmgMap[c]&&<div style={{position:"absolute",top:4,left:"50%",transform:"translateX(-50%)",color:"#ffdd00",fontSize:13,fontWeight:"bold",zIndex:3,textShadow:"0 0 6px #ff0"}}>-{dmgMap[c]}</div>}
                    {laneEnemies.map(e=>{
                      const pct=Math.min(1,e.step/ENEMY_MAX_STEPS),top=pct*72,hp=e.hp/e.maxHp;
                      return (
                        <div key={e.id} style={{position:"absolute",top:`${top}%`,left:"50%",transform:"translateX(-50%)",width:34,transition:"top 0.35s ease"}}>
                          <div style={{width:30,height:30,margin:"0 auto",borderRadius:e.isBoss?6:"50%",background:e.isBoss?"#8e44ad":LANE_COLORS[c],display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"#fff",fontWeight:"bold",border:e.armor?"2px solid #f1c40f":"2px solid transparent",boxShadow:`0 0 6px ${LANE_COLORS[c]}88`}}>{e.hp}</div>
                          <div style={{height:3,background:"#222",borderRadius:2,marginTop:1}}>
                            <div style={{width:`${hp*100}%`,height:"100%",background:hp>0.5?"#2ecc71":hp>0.25?"#f39c12":"#e74c3c",borderRadius:2,transition:"width 0.2s"}}/>
                          </div>
                          {e.armor>0&&<div style={{fontSize:7,color:"#f1c40f",textAlign:"center"}}>🛡{e.armor}</div>}
                        </div>
                      );
                    })}
                    {queued>0&&<div style={{position:"absolute",bottom:3,left:"50%",transform:"translateX(-50%)",fontSize:9,color:"#444"}}>+{queued}待機</div>}
                  </div>
                );
              })}
            </div>

            {/* Defense Line */}
            <div style={{display:"flex",alignItems:"center",gap:6,margin:"6px 0"}}>
              <div style={{flex:1,height:2,background:"#e74c3c"}}/>
              <div style={{fontSize:11,color:"#e74c3c",fontWeight:"bold",whiteSpace:"nowrap"}}>⚔️ DEFENSE LINE ⚔️</div>
              <div style={{flex:1,height:2,background:"#e74c3c"}}/>
            </div>

            {/* Tower Grid */}
            <div style={{display:"grid",gridTemplateColumns:`repeat(${COLS},1fr)`,gap:4,marginBottom:8}}>
              {grid.map((row,r)=>row.map((val,c)=>{
                const [bg,clr]=val?tileColor(val):["#1c1c2e","#1c1c2e"];
                const isMerged=mergeHL.includes(`${r}-${c}`);
                const isAtk=atkCols.includes(c)&&val>0;
                return (
                  <div key={`${r}-${c}`} style={{background:isAtk?"#fffbe6":isMerged?"#fff3b0":bg,color:clr,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",height:tileHeight,fontWeight:"bold",fontSize:isDesktop?(val>=1024?16:val>=128?19:22):(val>=1024?13:val>=128?15:18),boxShadow:val?`0 3px 8px ${bg}88`:"none",border:isMerged||isAtk?"2px solid #f1c40f":"2px solid transparent",transition:"all 0.15s",transform:isMerged?"scale(1.08)":"scale(1)"}}>
                    {val||""}
                  </div>
                );
              }))}
            </div>

            {!isDesktop && (
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:4,marginBottom:6}}>
                <div/>
                <button onClick={()=>handleSlide("up")}    disabled={!isPlayer} style={btnS("#3498db",!isPlayer)}>↑</button>
                <div/>
                <button onClick={()=>handleSlide("left")}  disabled={!isPlayer} style={btnS("#3498db",!isPlayer)}>←</button>
                <button onClick={()=>handleSlide("down")}  disabled={!isPlayer} style={btnS("#3498db",!isPlayer)}>↓</button>
                <button onClick={()=>handleSlide("right")} disabled={!isPlayer} style={btnS("#3498db",!isPlayer)}>→</button>
              </div>
            )}

            {/* Action buttons */}
            <div style={{marginBottom:isDesktop?0:8}}>
              {phase==="resolving"&&(
                <div style={{textAlign:"center",padding:"12px 0",color:"#e74c3c",fontSize:15,fontWeight:"bold"}}>⚔️ 攻撃解決中...</div>
              )}
              {phase==="waveclear"&&(
                <button onClick={nextWave} style={{...btnS("#27ae60",false),width:"100%",fontSize:15,padding:"12px 0"}}>🎉 次のウェーブへ！(Wave {wave+1})</button>
              )}
              {phase==="gameover"&&(
                <div>
                  <div style={{textAlign:"center",color:"#e74c3c",fontSize:20,fontWeight:"bold",marginBottom:6}}>💀 GAME OVER</div>
                  <div style={{textAlign:"center",color:"#888",fontSize:13,marginBottom:8}}>最終スコア: <span style={{color:"#f1c40f"}}>{score.toLocaleString()}</span></div>
                  <button onClick={restart} style={{...btnS("#3498db",false),width:"100%",fontSize:15,padding:"12px 0"}}>🔄 もう一度プレイ</button>
                </div>
              )}
            </div>
          </div>

          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {isDesktop && (
              <div style={{background:"#0d1117",border:"1px solid #1e2a3a",borderRadius:10,padding:"10px"}}>
                <div style={{fontSize:11,color:"#888",marginBottom:6,textAlign:"center"}}>操作ボタン</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:4}}>
                  <div/>
                  <button onClick={()=>handleSlide("up")}    disabled={!isPlayer} style={btnS("#3498db",!isPlayer)}>↑</button>
                  <div/>
                  <button onClick={()=>handleSlide("left")}  disabled={!isPlayer} style={btnS("#3498db",!isPlayer)}>←</button>
                  <button onClick={()=>handleSlide("down")}  disabled={!isPlayer} style={btnS("#3498db",!isPlayer)}>↓</button>
                  <button onClick={()=>handleSlide("right")} disabled={!isPlayer} style={btnS("#3498db",!isPlayer)}>→</button>
                </div>
              </div>
            )}

            {/* Log */}
            <div style={{background:"#0d1117",border:"1px solid #1e2a3a",borderRadius:10,padding:"8px 10px",maxHeight:isDesktop?220:90,overflowY:"auto"}}>
              {log.map((msg,i)=><div key={i} style={{fontSize:isDesktop?12:11,color:i===0?"#ddd":"#444",marginBottom:2,lineHeight:1.4}}>{msg}</div>)}
            </div>

            {/* Guide */}
            <div style={{display:"grid",gridTemplateColumns:isDesktop?"1fr":"1fr 1fr",gap:4}}>
              {[["🟡 手数マス","3マス分スライドしたら自動攻撃"],["🛡️ 装甲敵","Wave4〜 砲塔値>装甲値が必要"],["💀 敗北条件","ライフ0 or グリッド満杯"]].map(([t,d])=>(
                <div key={t} style={{background:"#0d1117",border:"1px solid #1e2a3a",borderRadius:8,padding:"6px 8px"}}>
                  <div style={{fontSize:11,color:"#aaa",fontWeight:"bold"}}>{t}</div>
                  <div style={{fontSize:10,color:"#555",marginTop:2}}>{d}</div>
                </div>
              ))}
            </div>
            <div style={{textAlign:"center",color:"#333",fontSize:10,marginTop:2}}>矢印キー: スライド</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function btnS(color, disabled){
  return {background:disabled?"#1a1a2e":color,color:disabled?"#333":"#fff",border:"none",borderRadius:10,padding:"10px 0",fontSize:20,fontWeight:"bold",cursor:disabled?"default":"pointer",width:"100%",transition:"all 0.1s",boxShadow:disabled?"none":`0 4px 12px ${color}66`};
}
