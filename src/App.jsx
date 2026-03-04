import { useEffect, useState } from "react";
import {
  MOVES_PER_TURN,
  LANE_COLORS,
  LANE_NAMES,
  COLS,
} from "./game/constants";
import { GAME_PHASES } from "./game/config";
import { StatusHud } from "./components/StatusHud";
import { MovesIndicator } from "./components/MovesIndicator";
import { WaveClearBanner } from "./components/WaveClearBanner";
import { NextSpawnIndicator } from "./components/NextSpawnIndicator";
import { EventLog } from "./components/EventLog";
import { GuideCards } from "./components/GuideCards";
import { ColumnPowerLabels } from "./components/ColumnPowerLabels";
import { EnemyLanes } from "./components/EnemyLanes";
import { TowerGrid } from "./components/TowerGrid";
import { ActionPanel } from "./components/ActionPanel";
import { useGameState } from "./hooks/useGameState";

export default function MergeTowerDefense() {
  const [viewportWidth, setViewportWidth] = useState(() => window.innerWidth);
  const {
    grid,
    enemies,
    lives,
    wave,
    score,
    phase,
    movesLeft,
    log,
    atkCols,
    dmgMap,
    damageBursts,
    shotTraces,
    mergeHL,
    colPower,
    nextSpawnEnemy,
    handleTouchStart,
    handleTouchEnd,
    nextWave,
    restart,
  } = useGameState();

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

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

        <StatusHud lives={lives} wave={wave} score={score} />
        <MovesIndicator
          movesLeft={movesLeft}
          totalMoves={MOVES_PER_TURN}
          isResolving={phase === GAME_PHASES.RESOLVING}
        />

        {phase===GAME_PHASES.WAVECLEAR&&(
          <WaveClearBanner wave={wave} onNextWave={nextWave} />
        )}

        <NextSpawnIndicator
          nextSpawnEnemy={nextSpawnEnemy}
          laneColors={LANE_COLORS}
          laneNames={LANE_NAMES}
        />

        <div style={{display:"grid",gridTemplateColumns:isDesktop?"minmax(0,1fr) minmax(280px,360px)":"1fr",gap:12,alignItems:"start"}}>
          <div
            style={{width:"100%",touchAction:isDesktop?"auto":"none"}}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <ColumnPowerLabels
              columnPowers={colPower}
              nextSpawnEnemy={nextSpawnEnemy}
              isDesktop={isDesktop}
              laneColors={LANE_COLORS}
              laneNames={LANE_NAMES}
            />
            <EnemyLanes
              enemies={enemies}
              atkCols={atkCols}
              nextSpawnEnemy={nextSpawnEnemy}
              shotTraces={shotTraces}
              damageByLane={dmgMap}
              damageBursts={damageBursts}
              laneHeight={laneHeight}
              laneColors={LANE_COLORS}
            />

            {/* Defense Line */}
            <div style={{display:"flex",alignItems:"center",gap:6,margin:"6px 0"}}>
              <div style={{flex:1,height:2,background:"#e74c3c"}}/>
              <div style={{fontSize:11,color:"#e74c3c",fontWeight:"bold",whiteSpace:"nowrap"}}>⚔️ DEFENSE LINE ⚔️</div>
              <div style={{flex:1,height:2,background:"#e74c3c"}}/>
            </div>

            <TowerGrid
              grid={grid}
              mergeHighlights={mergeHL}
              attackColumns={atkCols}
              tileHeight={tileHeight}
              isDesktop={isDesktop}
            />
            <ActionPanel
              phase={phase}
              isDesktop={isDesktop}
              score={score}
              onRestart={restart}
            />
          </div>

          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            <EventLog log={log} isDesktop={isDesktop} />
            <GuideCards isDesktop={isDesktop} />
          </div>
        </div>
      </div>
    </div>
  );
}
