import { GAME_PHASES } from "../game/config";
import { LANE_COLORS, LANE_NAMES } from "../game/constants";
import { ActionPanel } from "./ActionPanel";
import { ColumnPowerLabels } from "./ColumnPowerLabels";
import { DebugPanel } from "./DebugPanel";
import { EnemyLanes } from "./EnemyLanes";
import { NextSpawnIndicator } from "./NextSpawnIndicator";
import { TowerGrid } from "./TowerGrid";
import { WaveClearBanner } from "./WaveClearBanner";
import {
  createSecondaryPanelButtonStyle,
  debugToggleWrapStyle,
  defenseLineStyle,
  laneDividerLabelStyle,
  laneDividerLineStyle,
} from "./ui/styles";

export function GameBoardSection({
  game,
  isDesktop,
  laneHeight,
  tileHeight,
  isDebugMode,
  isDebugPanelOpen,
  onToggleDebugPanel,
  debugBoostTarget,
  onOpenRoleModal,
  onAnyTileClick,
}) {
  const {
    grid,
    tileDamage,
    tileRoles,
    enemies,
    wave,
    score,
    phase,
    movesLeft,
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
    nextSpawnEnemy,
    handleTouchStart,
    handleTouchEnd,
    nextWave,
    debug,
  } = game;

  return (
    <div style={{ width: "100%", touchAction: isDesktop ? "auto" : "none" }} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      {isDebugMode && (
        <div style={debugToggleWrapStyle}>
          <button
            type="button"
            onClick={onToggleDebugPanel}
            style={createSecondaryPanelButtonStyle({ subdued: true })}
          >
            {isDebugPanelOpen ? "🧪 デバッグパネルを閉じる" : "🧪 デバッグパネルを開く"}
          </button>
          {isDebugPanelOpen && (
            <DebugPanel
              wave={wave}
              lives={game.lives}
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

      {phase === GAME_PHASES.WAVECLEAR && <WaveClearBanner wave={wave} onNextWave={nextWave} />}

      <NextSpawnIndicator nextSpawnEnemy={nextSpawnEnemy} laneColors={LANE_COLORS} laneNames={LANE_NAMES} />
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

      <div style={defenseLineStyle}>
        <div style={laneDividerLineStyle} />
        <div style={laneDividerLabelStyle}>⚔️ DEFENSE LINE ⚔️</div>
        <div style={laneDividerLineStyle} />
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
        onTileClick={onOpenRoleModal}
        onAnyTileClick={onAnyTileClick}
      />
      <ActionPanel phase={phase} isDesktop={isDesktop} />
    </div>
  );
}
