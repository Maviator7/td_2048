import { useCallback, useEffect, useRef } from "react";
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
  const prevMovesLeftRef = useRef(null);
  const prevPhaseRef = useRef(null);
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
    tampered,
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
      tampered,
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

  const createSnapshot = useCallback(() => ({
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
  }), [enemies, grid, lives, log, movesLeft, movesPerTurn, phase, roleMetrics, score, tileDamage, tileRoles, wave]);

  useEffect(() => {
    if (prevMovesLeftRef.current === null) {
      prevMovesLeftRef.current = movesLeft;
      return;
    }

    const didSpendMove = movesLeft < prevMovesLeftRef.current;
    prevMovesLeftRef.current = movesLeft;

    // Resolve phase snapshots are normalized on load; avoid autosaving there to prevent turn rollback.
    if (tampered || !didSpendMove || phase !== GAME_PHASES.PLAYER) {
      return;
    }

    saveRepository.save(createSnapshot());
  }, [createSnapshot, movesLeft, phase, tampered]);

  useEffect(() => {
    if (prevPhaseRef.current === null) {
      prevPhaseRef.current = phase;
      return;
    }

    const wasResolving = prevPhaseRef.current === GAME_PHASES.RESOLVING;
    const wasWaveClear = prevPhaseRef.current === GAME_PHASES.WAVECLEAR;
    const enteredPlayer = phase === GAME_PHASES.PLAYER;
    prevPhaseRef.current = phase;

    if (tampered || (!wasResolving && !wasWaveClear) || !enteredPlayer) {
      return;
    }

    saveRepository.save(createSnapshot());
  }, [createSnapshot, phase, tampered]);

  useEffect(() => {
    if (tampered) {
      return;
    }

    if (!saveRepository.isSnapshotValid(createSnapshot())) {
      setters.setTampered(true);
      helpers.pushLog("🚫 不正なゲーム状態を検知: セーブ整合性チェックに失敗");
    }
  }, [
    createSnapshot,
    helpers,
    setters,
    tampered,
  ]);

  const applySnapshot = (snapshot) => {
    const shouldNormalizeResolving = snapshot.phase === GAME_PHASES.RESOLVING;
    const nextPhase = shouldNormalizeResolving ? GAME_PHASES.PLAYER : snapshot.phase;
    const nextMovesLeft = shouldNormalizeResolving
      ? Math.max(1, snapshot.movesLeft)
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
    setters.setTampered(false);
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
    tampered,
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
