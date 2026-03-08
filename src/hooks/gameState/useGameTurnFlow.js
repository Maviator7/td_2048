import { useCallback, useEffect, useRef } from "react";

import { INIT_LIVES, INITIAL_LOG, MOVES_PER_TURN } from "../../game/constants";
import { GAME_PHASES, getWaveStartMessage } from "../../game/config";
import { resetEnemyIds, spawnWave } from "../../game/enemies";
import {
  applyEngineerTurnRepair,
  canMove,
} from "../../game/grid";
import {
  buildRoleMetricDeltaFromAmountMap,
  buildRoleMetricDeltaFromCells,
  createInitialGrid,
  createRoleMetricsState,
} from "./stateHelpers";
import { resolveCombatPhase, resolveRetaliationPhase, resolveSlideStep } from "./turnFlowHelpers";

export function useGameTurnFlow({
  effects,
  state,
  setters,
  helpers,
}) {
  const moveSeRef = useRef(null);

  useEffect(() => {
    const audio = new Audio("/se/move_tile.mp3");
    audio.preload = "auto";
    audio.volume = 0.55;
    moveSeRef.current = audio;

    return () => {
      audio.pause();
      moveSeRef.current = null;
    };
  }, []);

  const {
    enemies,
    grid,
    lives,
    movesLeft,
    movesPerTurn,
    phase,
    tileDamage,
    tileRoles,
    wave,
  } = state;
  const {
    setBoard,
    setEnemies,
    setLives,
    setLog,
    setMovesLeft,
    setMovesPerTurn,
    setPhase,
    setRoleMetrics,
    setScore,
    setWave,
  } = setters;
  const {
    addRoleMetrics,
    pushLog,
    pushLogs,
  } = helpers;

  const playMoveSe = useCallback(() => {
    const audio = moveSeRef.current;
    if (!audio) {
      return;
    }

    audio.currentTime = 0;
    audio.play().catch(() => {});
  }, []);

  const resolveTurn = useCallback((baseGrid, currentTileDamage, currentTileRoles, currentEnemies, currentLives, currentWave) => {
    const result = resolveCombatPhase({
      grid: baseGrid,
      tileDamage: currentTileDamage,
      tileRoles: currentTileRoles,
      enemies: currentEnemies,
      lives: currentLives,
    });

    effects.setAtkCols(result.attackColumns);
    effects.setDmgMap(result.damageByLane);
    effects.setHitEffects(result.hitEffects);
    effects.setDamageBursts(result.damageBursts);
    effects.setShotTraces(result.shotTraces);
    effects.setChainTraces(result.chainTraces);
    effects.scheduleTimeout(effects.clearCombatEffects, result.effectDuration);

    setEnemies(result.nextEnemies);
    setLives(result.nextLives);
    setScore((currentScore) => currentScore + result.scoreGained);
    addRoleMetrics(buildRoleMetricDeltaFromAmountMap(result.roleDamageByRole, "dealt"));
    pushLogs(result.logMessages);

    if (result.nextLives <= 0) {
      setPhase(GAME_PHASES.GAMEOVER);
      pushLog("💀 ライフ0！ゲームオーバー！");
      return;
    }

    if (result.nextEnemies.length === 0) {
      const engineerRepairResult = applyEngineerTurnRepair(baseGrid, currentTileDamage, currentTileRoles);
      if (engineerRepairResult.repairedAmount > 0) {
        setBoard(engineerRepairResult.grid, engineerRepairResult.tileDamage, engineerRepairResult.tileRoles);
        addRoleMetrics(buildRoleMetricDeltaFromCells(engineerRepairResult.repairedCells, "repair"));
        pushLog(`🛠️ 整備士修復 +${engineerRepairResult.repairedAmount}`);
      }
      setPhase(GAME_PHASES.WAVECLEAR);
      pushLog(`🎉 Wave ${currentWave} クリア！`);
      return;
    }

    effects.scheduleTimeout(() => {
      const { retaliationResult, engineerRepairResult, turnEndLogs } = resolveRetaliationPhase({
        grid: baseGrid,
        tileDamage: currentTileDamage,
        tileRoles: currentTileRoles,
        remainingLaneThreats: result.remainingLaneThreats,
      });

      addRoleMetrics(buildRoleMetricDeltaFromAmountMap(retaliationResult.roleTakenByRole, "taken"));
      addRoleMetrics(buildRoleMetricDeltaFromCells(engineerRepairResult.repairedCells, "repair"));

      if (retaliationResult.hadRetaliation) {
        effects.setRetaliationCols(retaliationResult.nextRetaliationCols);
        effects.setRetaliationHits(retaliationResult.nextRetaliationHits);
        effects.scheduleTimeout(effects.clearRetaliationEffects, 320);
      }

      if (turnEndLogs.length) {
        setBoard(engineerRepairResult.grid, engineerRepairResult.tileDamage, engineerRepairResult.tileRoles);
      }

      if (turnEndLogs.length) {
        pushLogs(turnEndLogs);
      }

      effects.scheduleTimeout(() => {
        setMovesLeft(movesPerTurn);
        setPhase(GAME_PHASES.PLAYER);
        pushLog(`🔄 新ターン！残り${movesPerTurn}手`);
      }, retaliationResult.hadRetaliation ? 260 : 80);
    }, result.effectDuration);
  }, [addRoleMetrics, effects, movesPerTurn, pushLog, pushLogs, setBoard, setEnemies, setLives, setMovesLeft, setPhase, setScore]);

  const handleSlide = useCallback((direction) => {
    if (phase !== GAME_PHASES.PLAYER) {
      return;
    }

    const {
      score: gainedScore,
      moved,
      mergedCells,
      nextTurnGrid,
      nextTurnTileDamage,
      nextTurnTileRoles,
      repairedAmount,
      repairedCells,
    } = resolveSlideStep({
      grid,
      tileDamage,
      tileRoles,
      direction,
    });
    if (!moved) {
      return;
    }

    playMoveSe();
    setBoard(nextTurnGrid, nextTurnTileDamage, nextTurnTileRoles);
    if (repairedAmount > 0) {
      effects.setRepairHighlights(repairedCells);
      effects.scheduleTimeout(effects.clearRepairEffects, 360);
      addRoleMetrics(buildRoleMetricDeltaFromCells(repairedCells, "repair", nextTurnTileRoles));
      pushLog(`🛠️ 後衛修復 +${repairedAmount}`);
    }

    if (gainedScore) {
      setScore((currentScore) => currentScore + gainedScore);
      pushLog(`🔀 合体！+${gainedScore}pts`);
    }

    if (mergedCells.length) {
      effects.setMergeHL(mergedCells);
      effects.scheduleTimeout(() => effects.setMergeHL([]), 400);
    }

    if (!canMove(nextTurnGrid)) {
      setPhase(GAME_PHASES.GAMEOVER);
      pushLog("💀 グリッド満杯！ゲームオーバー！");
      return;
    }

    const nextMovesLeft = movesLeft - 1;
    setMovesLeft(nextMovesLeft);

    if (nextMovesLeft <= 0) {
      pushLog("⚔️ 手数終了 → 攻撃！");
      setPhase(GAME_PHASES.RESOLVING);
      effects.scheduleTimeout(() => resolveTurn(nextTurnGrid, nextTurnTileDamage, nextTurnTileRoles, enemies, lives, wave), 200);
      return;
    }

    pushLog(`残り${nextMovesLeft}手`);
  }, [addRoleMetrics, effects, enemies, grid, lives, movesLeft, phase, playMoveSe, pushLog, resolveTurn, setBoard, setMovesLeft, setPhase, setScore, tileDamage, tileRoles, wave]);

  const nextWave = useCallback(() => {
    const nextWaveNumber = wave + 1;
    setWave(nextWaveNumber);
    setEnemies(spawnWave(nextWaveNumber - 1));
    setMovesLeft(movesPerTurn);
    setPhase(GAME_PHASES.PLAYER);
    effects.clearCombatEffects();
    pushLog(getWaveStartMessage(nextWaveNumber));
  }, [effects, movesPerTurn, pushLog, setEnemies, setMovesLeft, setPhase, setWave, wave]);

  const restart = useCallback(() => {
    effects.clearScheduledTimeouts();
    resetEnemyIds();
    const initialState = createInitialGrid();
    setBoard(initialState.grid, initialState.tileDamage, initialState.tileRoles);
    setEnemies(spawnWave(0));
    setLives(INIT_LIVES);
    setWave(1);
    setScore(0);
    setMovesPerTurn(MOVES_PER_TURN);
    setMovesLeft(MOVES_PER_TURN);
    setPhase(GAME_PHASES.PLAYER);
    setLog([INITIAL_LOG]);
    setRoleMetrics(createRoleMetricsState());
    effects.clearCombatEffects();
    effects.clearRetaliationEffects();
    effects.clearRepairEffects();
    effects.setMergeHL([]);
  }, [effects, setBoard, setEnemies, setLives, setLog, setMovesLeft, setMovesPerTurn, setPhase, setRoleMetrics, setScore, setWave]);

  return {
    handleSlide,
    nextWave,
    restart,
  };
}
