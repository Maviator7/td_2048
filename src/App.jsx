import { useEffect, useState } from "react";
import {
  LANE_COLORS,
  LANE_NAMES,
  COLS,
} from "./game/constants";
import { GAME_PHASES } from "./game/config";
import {
  canSelectRoleByTileValue,
  ROLE_RULES,
  TILE_ROLE_DEFS,
  TILE_ROLE_ORDER,
} from "./game/config";
import { StatusHud } from "./components/StatusHud";
import { MovesIndicator } from "./components/MovesIndicator";
import { WaveClearBanner } from "./components/WaveClearBanner";
import { NextSpawnIndicator } from "./components/NextSpawnIndicator";
import { EventLog } from "./components/EventLog";
import { GuideCards } from "./components/GuideCards";
import { TitleScreen } from "./components/TitleScreen";
import { RankingScreen } from "./components/RankingScreen";
import { RoleBalancePanel } from "./components/RoleBalancePanel";
import { ColumnPowerLabels } from "./components/ColumnPowerLabels";
import { EnemyLanes } from "./components/EnemyLanes";
import { TowerGrid } from "./components/TowerGrid";
import { ActionPanel } from "./components/ActionPanel";
import { DebugPanel } from "./components/DebugPanel";
import { useGameState } from "./hooks/useGameState";
import { getLocalRankings, saveLocalRanking } from "./game/rankings";

const SCREENS = {
  TITLE: "title",
  GAME: "game",
  RANKING: "ranking",
};

export default function MergeTowerDefense() {
  const [viewportWidth, setViewportWidth] = useState(() => window.innerWidth);
  const [screen, setScreen] = useState(SCREENS.TITLE);
  const [rankings, setRankings] = useState(() => getLocalRankings());
  const [latestRankingEntryId, setLatestRankingEntryId] = useState(null);
  const {
    grid,
    tileDamage,
    tileRoles,
    enemies,
    lives,
    wave,
    score,
    phase,
    movesPerTurn,
    movesLeft,
    log,
    atkCols,
    dmgMap,
    hitEffects,
    damageBursts,
    shotTraces,
    chainTraces,
    retaliationCols,
    retaliationHits,
    repairHighlights,
    mergeHL,
    colPower,
    roleMetrics,
    nextSpawnEnemy,
    handleTouchStart,
    handleTouchEnd,
    nextWave,
    restart,
    setTileRoleAt,
    debug,
  } = useGameState();
  const [roleModal, setRoleModal] = useState(null);
  const [isBalanceModeEnabled, setIsBalanceModeEnabled] = useState(false);
  const isDebugMode = import.meta.env.VITE_ENABLE_DEBUG_PANEL === "true";
  const [isDebugPanelOpen, setIsDebugPanelOpen] = useState(() => isDebugMode);
  const [debugBoostTarget, setDebugBoostTarget] = useState({ row: 0, col: 0 });
  const [didPersistCurrentRun, setDidPersistCurrentRun] = useState(false);

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (phase !== GAME_PHASES.GAMEOVER || didPersistCurrentRun) {
      return;
    }

    const { entry, rankings: nextRankings } = saveLocalRanking({ score, wave });
    setRankings(nextRankings);
    setLatestRankingEntryId(entry.id);
    setDidPersistCurrentRun(true);
    setScreen(SCREENS.RANKING);
  }, [didPersistCurrentRun, phase, score, wave]);

  const isDesktop = viewportWidth >= 768;
  const isWideDesktop = viewportWidth >= 1200;
  const tileHeight = isWideDesktop ? 62 : isDesktop ? 56 : 54;
  const laneHeight = isWideDesktop ? 160 : isDesktop ? 140 : 130;
  const canEditRoles = phase === GAME_PHASES.PLAYER;

  const openRoleModal = (tile) => {
    if (!canEditRoles) {
      return;
    }
    if (!canSelectRoleByTileValue(tile.value)) {
      return;
    }
    if (tile.role) {
      return;
    }

    setRoleModal(tile);
  };

  const closeRoleModal = () => {
    setRoleModal(null);
  };

  const selectRole = (nextRole) => {
    if (!roleModal) {
      return;
    }

    setTileRoleAt(roleModal.row, roleModal.col, nextRole);
    closeRoleModal();
  };

  const handleTileClick = (tile) => {
    setDebugBoostTarget({ row: tile.row, col: tile.col });
  };

  const startGame = () => {
    restart();
    setRoleModal(null);
    setLatestRankingEntryId(null);
    setDidPersistCurrentRun(false);
    setScreen(SCREENS.GAME);
  };

  const backToTitle = () => {
    setRoleModal(null);
    setScreen(SCREENS.TITLE);
  };

  const openRanking = () => {
    setRankings(getLocalRankings());
    setScreen(SCREENS.RANKING);
  };

  if (screen === SCREENS.TITLE) {
    return <TitleScreen onStart={startGame} onOpenRanking={openRanking} topScore={rankings[0]?.score ?? null} />;
  }

  if (screen === SCREENS.RANKING) {
    return (
      <RankingScreen
        rankings={rankings}
        latestEntryId={latestRankingEntryId}
        onStart={startGame}
        onBackToTitle={backToTitle}
      />
    );
  }

  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#0f0e17 0%,#1a1a2e 100%)",display:"flex",justifyContent:"center",padding:"12px 8px",fontFamily:"'Segoe UI',sans-serif"}}>
      <div style={{width:"100%",maxWidth:isDesktop?"100%":420}}>

        {/* Title */}
        <div style={{textAlign:"center",marginBottom:10}}>
          <h1 style={{margin:0,fontSize:22,color:"#f1c40f",letterSpacing:1,textShadow:"0 0 12px #f1c40f88"}}>🗼 MERGE FORTRESS 2048</h1>
          <div style={{fontSize:11,color:"#555",marginTop:2}}>スライドで砲塔合体 → 敵を撃退せよ</div>
        </div>

        <StatusHud lives={lives} wave={wave} score={score} />
        <MovesIndicator
          movesLeft={movesLeft}
          totalMoves={movesPerTurn}
          isResolving={phase === GAME_PHASES.RESOLVING}
        />
        {isDebugMode && (
          <div style={{ marginBottom: 8 }}>
            <button
              type="button"
              onClick={() => setIsDebugPanelOpen((current) => !current)}
              style={{
                width: "100%",
                border: "1px solid #475569",
                borderRadius: 10,
                padding: "8px 10px",
                background: "#111827",
                color: "#e2e8f0",
                fontSize: 12,
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              {isDebugPanelOpen ? "🧪 デバッグパネルを閉じる" : "🧪 デバッグパネルを開く"}
            </button>
            {isDebugPanelOpen && (
              <DebugPanel
                wave={wave}
                lives={lives}
                score={score}
                movesLeft={movesLeft}
                phase={phase}
                boostRow={debugBoostTarget.row}
                boostCol={debugBoostTarget.col}
                onSetWave={debug.setWave}
                onSetLives={debug.setLives}
                onSetScore={debug.setScore}
                onSetMovesLeft={debug.setMovesLeft}
                onSetPhase={debug.setPhase}
                onBoostTile={debug.boostTile}
                onKillAllEnemies={debug.killAllEnemies}
                onRespawnWaveEnemies={debug.respawnWaveEnemies}
                onNextWave={nextWave}
              />
            )}
          </div>
        )}

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
              hitEffects={hitEffects}
              damageByLane={dmgMap}
              damageBursts={damageBursts}
              shotTraces={shotTraces}
              chainTraces={chainTraces}
              retaliationCols={retaliationCols}
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
              tileDamage={tileDamage}
              tileRoles={tileRoles}
              retaliationHits={retaliationHits}
              repairHighlights={repairHighlights}
              mergeHighlights={mergeHL}
              tileHeight={tileHeight}
              isDesktop={isDesktop}
              onTileClick={openRoleModal}
              onAnyTileClick={handleTileClick}
            />
            <ActionPanel
              phase={phase}
              isDesktop={isDesktop}
              score={score}
              onRestart={restart}
              onBackToTitle={backToTitle}
            />
          </div>

          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            <RoleBalancePanel
              isEnabled={isBalanceModeEnabled}
              onToggle={() => setIsBalanceModeEnabled((current) => !current)}
              roleMetrics={roleMetrics}
            />
            <EventLog log={log} isDesktop={isDesktop} />
            <GuideCards isDesktop={isDesktop} />
          </div>
        </div>
      </div>
      {roleModal && (
        <div
          onClick={closeRoleModal}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 16,
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 360,
              background: "#111827",
              border: "1px solid #334155",
              borderRadius: 12,
              padding: 14,
              boxShadow: "0 14px 30px rgba(0, 0, 0, 0.4)",
            }}
          >
            <div style={{ fontSize: 13, color: "#e5e7eb", fontWeight: "700", marginBottom: 4 }}>
              役職を選択
            </div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 10 }}>
              タイル {roleModal.value}（Lv.{ROLE_RULES.minSelectableLevel}以上・未役職のみ）
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {TILE_ROLE_ORDER.map((roleKey) => {
                const roleDef = TILE_ROLE_DEFS[roleKey];
                const selected = roleModal.role === roleKey;
                return (
                  <button
                    key={roleKey}
                    type="button"
                    onClick={() => selectRole(roleKey)}
                    style={{
                      border: selected ? "1px solid #fbbf24" : "1px solid #475569",
                      background: selected ? "#1f2937" : "#0f172a",
                      color: "#e5e7eb",
                      borderRadius: 10,
                      padding: "10px 8px",
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    {roleDef.icon} {roleDef.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
