import { useScheduledGameEffects } from "./gameState/useScheduledGameEffects";
import { useGameDebugActions } from "./gameState/useGameDebugActions";
import { useRoleAssignment } from "./gameState/useRoleAssignment";
import { useGameDerivedState } from "./gameState/useGameDerivedState";
import { useGameInput } from "./gameState/useGameInput";
import { useGameTurnFlow } from "./gameState/useGameTurnFlow";
import { useGameCoreState } from "./gameState/useGameCoreState";
import { GAME_PHASES } from "../game/config";
import { resetEnemyIds, syncEnemyIdCounter } from "../game/enemies";
import { saveRepository } from "../game/saveRepository";

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

  const createSnapshot = () => ({
    boardState: {
      grid: grid.map((row) => [...row]),
      tileDamage: tileDamage.map((row) => [...row]),
      tileRoles: tileRoles.map((row) => [...row]),
    },
    enemies: enemies.map((enemy) => ({ ...enemy })),
    lives,
    wave,
    score,
    phase,
    movesPerTurn,
    movesLeft,
    log: [...log],
    roleMetrics: Object.fromEntries(
      Object.entries(roleMetrics).map(([roleKey, metrics]) => [roleKey, { ...metrics }]),
    ),
  });

  const applySnapshot = (snapshot) => {
    const shouldNormalizeResolving = snapshot.phase === GAME_PHASES.RESOLVING;
    const nextPhase = shouldNormalizeResolving ? GAME_PHASES.PLAYER : snapshot.phase;
    const nextMovesLeft = shouldNormalizeResolving
      ? Math.max(1, snapshot.movesPerTurn)
      : snapshot.movesLeft;
    const nextLog = shouldNormalizeResolving
      ? ["📂 ロード: 解決中ターンを安全に再開しました。", ...snapshot.log].slice(0, 8)
      : snapshot.log;

    effects.clearScheduledTimeouts();
    effects.clearCombatEffects();
    effects.clearRetaliationEffects();
    effects.clearRepairEffects();
    effects.setMergeHL([]);
    resetEnemyIds();
    syncEnemyIdCounter(snapshot.enemies);
    setters.setBoard(snapshot.boardState.grid, snapshot.boardState.tileDamage, snapshot.boardState.tileRoles);
    setters.setEnemies(snapshot.enemies);
    setters.setLives(snapshot.lives);
    setters.setWave(snapshot.wave);
    setters.setScore(snapshot.score);
    setters.setPhase(nextPhase);
    setters.setMovesPerTurn(snapshot.movesPerTurn);
    setters.setMovesLeft(nextMovesLeft);
    setters.setLog(nextLog);
    setters.setRoleMetrics(snapshot.roleMetrics);
  };

  const saveGame = () => saveRepository.save(createSnapshot());

  const loadGame = () => {
    const result = saveRepository.load();
    if (!result.ok) {
      return result;
    }

    applySnapshot(result.snapshot);
    return {
      ok: true,
      savedAt: result.savedAt,
      summary: {
        wave: result.snapshot.wave,
        score: result.snapshot.score,
        phase: result.snapshot.phase,
      },
    };
  };

  const getSaveMeta = () => saveRepository.getMeta();

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
    saveGame,
    loadGame,
    getSaveMeta,
    setTileRoleAt,
    debug,
  };
}
