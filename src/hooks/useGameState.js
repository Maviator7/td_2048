import { useScheduledGameEffects } from "./gameState/useScheduledGameEffects";
import { useGameDebugActions } from "./gameState/useGameDebugActions";
import { useRoleAssignment } from "./gameState/useRoleAssignment";
import { useGameDerivedState } from "./gameState/useGameDerivedState";
import { useGameInput } from "./gameState/useGameInput";
import { useGameTurnFlow } from "./gameState/useGameTurnFlow";
import { useGameCoreState } from "./gameState/useGameCoreState";

export function useGameState() {
  const { state, setters, helpers } = useGameCoreState();
  const effects = useScheduledGameEffects();
  const {
    boardState,
    enemies,
    lives,
    wave,
    score,
    phase,
    movesPerTurn,
    movesLeft,
    log,
    roleMetrics,
  } = state;
  const { grid, tileDamage, tileRoles } = boardState;

  const debug = useGameDebugActions({
    clearScheduledTimeouts: effects.clearScheduledTimeouts,
    clearCombatEffects: effects.clearCombatEffects,
    clearRetaliationEffects: effects.clearRetaliationEffects,
    clearRepairEffects: effects.clearRepairEffects,
    movesPerTurn,
    phase,
    pushLog: helpers.pushLog,
    setEnemies: setters.setEnemies,
    setLives: setters.setLives,
    setMergeHL: effects.setMergeHL,
    setMovesLeft: setters.setMovesLeft,
    setMovesPerTurn: setters.setMovesPerTurn,
    setPhase: setters.setPhase,
    setScore: setters.setScore,
    setWave: setters.setWave,
    setBoardState: setters.setBoardState,
    wave,
    lives,
  });

  const { setTileRoleAt } = useRoleAssignment({
    setBoardState: setters.setBoardState,
    pushLog: helpers.pushLog,
  });

  const { handleSlide, nextWave, restart } = useGameTurnFlow({
    effects,
    state: {
      enemies,
      grid,
      lives,
      movesLeft,
      movesPerTurn,
      phase,
      tileDamage,
      tileRoles,
      wave,
    },
    setters,
    helpers,
  });

  const { handleTouchStart, handleTouchEnd } = useGameInput({
    phase,
    onSlide: handleSlide,
  });

  const { colPower, nextSpawnEnemy } = useGameDerivedState({
    grid,
    tileDamage,
    enemies,
  });

  return {
    grid,
    tileDamage,
    enemies,
    lives,
    wave,
    score,
    phase,
    movesPerTurn,
    movesLeft,
    log,
    atkCols: effects.atkCols,
    dmgMap: effects.dmgMap,
    hitEffects: effects.hitEffects,
    damageBursts: effects.damageBursts,
    shotTraces: effects.shotTraces,
    chainTraces: effects.chainTraces,
    retaliationCols: effects.retaliationCols,
    retaliationHits: effects.retaliationHits,
    repairHighlights: effects.repairHighlights,
    mergeHL: effects.mergeHL,
    colPower,
    tileRoles,
    roleMetrics,
    nextSpawnEnemy,
    handleTouchStart,
    handleTouchEnd,
    nextWave,
    restart,
    setTileRoleAt,
    debug,
  };
}
