import { useCallback, useEffect, useRef } from "react";

import { INIT_LIVES, INITIAL_LOG, MOVES_PER_TURN } from "../../game/constants";
import { GAME_PHASES, getEnemyReward, getWaveStartMessage } from "../../game/config";
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
import { getMasterVolume, getSeVolume } from "../../audio/settings";

function getGridTotal(grid) {
  return grid.reduce(
    (sum, row) => sum + row.reduce((rowSum, value) => rowSum + Math.max(0, value), 0),
    0,
  );
}

function getMaxCombatScoreGain(enemies) {
  return enemies.reduce((sum, enemy) => sum + getEnemyReward(enemy), 0);
}

const AUTO_NEXT_WAVE_DELAY_MS = 2700;

export function useGameTurnFlow({
  effects,
  state,
  setters,
  helpers,
}) {
  const moveSeRef = useRef(null);
  const attackSeRef = useRef(null);
  const attackSeFallbackRef = useRef(null);
  const waveClearSeRef = useRef(null);
  const waveClearSeFallbackRef = useRef(null);

  useEffect(() => {
    const audio = new Audio("/se/move_tile.mp3");
    audio.preload = "auto";
    audio.volume = 0.55;
    moveSeRef.current = audio;

    const attackAudio = new Audio("/se/attack.mp3");
    attackAudio.preload = "auto";
    attackAudio.volume = 0.62;
    attackSeRef.current = attackAudio;

    const attackFallbackAudio = new Audio("/se/move_tile.mp3");
    attackFallbackAudio.preload = "auto";
    attackFallbackAudio.volume = 0.5;
    attackSeFallbackRef.current = attackFallbackAudio;

    const waveClearAudio = new Audio("/se/wave_clear.mp3");
    waveClearAudio.preload = "auto";
    waveClearAudio.volume = 0.7;
    waveClearSeRef.current = waveClearAudio;

    const waveClearFallbackAudio = new Audio("/se/move_tile.mp3");
    waveClearFallbackAudio.preload = "auto";
    waveClearFallbackAudio.volume = 0.5;
    waveClearSeFallbackRef.current = waveClearFallbackAudio;

    return () => {
      audio.pause();
      moveSeRef.current = null;
      attackAudio.pause();
      attackSeRef.current = null;
      attackFallbackAudio.pause();
      attackSeFallbackRef.current = null;
      waveClearAudio.pause();
      waveClearSeRef.current = null;
      waveClearFallbackAudio.pause();
      waveClearSeFallbackRef.current = null;
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
    setTampered,
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

    audio.volume = Math.min(1, Math.max(0, 0.55 * getMasterVolume() * getSeVolume()));
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }, []);

  const playAttackSe = useCallback(() => {
    const attackAudio = attackSeRef.current;
    const fallbackAudio = attackSeFallbackRef.current;
    const attackVolume = Math.min(1, Math.max(0, 0.62 * getMasterVolume() * getSeVolume()));
    const fallbackVolume = Math.min(1, Math.max(0, 0.5 * getMasterVolume() * getSeVolume()));

    if (attackAudio) {
      attackAudio.volume = attackVolume;
      attackAudio.currentTime = 0;
      attackAudio.play().catch(() => {
        if (!fallbackAudio) {
          return;
        }
        fallbackAudio.volume = fallbackVolume;
        fallbackAudio.currentTime = 0;
        fallbackAudio.play().catch(() => {});
      });
      return;
    }

    if (!fallbackAudio) {
      return;
    }

    fallbackAudio.volume = fallbackVolume;
    fallbackAudio.currentTime = 0;
    fallbackAudio.play().catch(() => {});
  }, []);

  const playWaveClearSe = useCallback(() => {
    const audio = waveClearSeRef.current;
    const fallbackAudio = waveClearSeFallbackRef.current;
    if (!audio) {
      if (!fallbackAudio) {
        return;
      }
      fallbackAudio.volume = Math.min(1, Math.max(0, 0.5 * getMasterVolume() * getSeVolume()));
      fallbackAudio.currentTime = 0;
      fallbackAudio.play().catch(() => {});
      return;
    }

    const targetVolume = Math.min(1, Math.max(0, 0.7 * getMasterVolume() * getSeVolume()));
    const fallbackVolume = Math.min(1, Math.max(0, 0.5 * getMasterVolume() * getSeVolume()));
    audio.volume = targetVolume;
    audio.currentTime = 0;
    audio.play().catch(() => {
      if (!fallbackAudio) {
        return;
      }
      fallbackAudio.volume = fallbackVolume;
      fallbackAudio.currentTime = 0;
      fallbackAudio.play().catch(() => {});
    });
  }, []);

  const flagTamper = useCallback((reason) => {
    setTampered(true);
    setPhase(GAME_PHASES.GAMEOVER);
    pushLog(`🚫 不正なゲーム状態を検知: ${reason}`);
  }, [pushLog, setPhase, setTampered]);

  const resolveTurn = useCallback((baseGrid, currentTileDamage, currentTileRoles, currentEnemies, currentLives, currentWave) => {
    const result = resolveCombatPhase({
      grid: baseGrid,
      tileDamage: currentTileDamage,
      tileRoles: currentTileRoles,
      enemies: currentEnemies,
      lives: currentLives,
    });
    const maxCombatScoreGain = getMaxCombatScoreGain(currentEnemies);
    if (
      !Number.isInteger(result.scoreGained)
      || result.scoreGained < 0
      || result.scoreGained > maxCombatScoreGain
      || !Number.isInteger(result.nextLives)
      || result.nextLives < 0
      || result.nextLives > currentLives
    ) {
      flagTamper("戦闘スコアまたはライフ遷移が不正");
      return;
    }

    effects.setAtkCols(result.attackColumns);
    effects.setDmgMap(result.damageByLane);
    effects.setHitEffects(result.hitEffects);
    effects.setDamageBursts(result.damageBursts);
    effects.setShotTraces(result.shotTraces);
    effects.setChainTraces(result.chainTraces);
    effects.setCombatDebugByLane(result.combatDebugByLane ?? []);
    effects.scheduleTimeout(effects.clearCombatEffects, result.effectDuration);
    if (result.attackColumns.length > 0) {
      playAttackSe();
    }

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

    if (result.bossDefeated || result.nextEnemies.length === 0) {
      const engineerRepairResult = applyEngineerTurnRepair(baseGrid, currentTileDamage, currentTileRoles);
      if (engineerRepairResult.repairedAmount > 0) {
        setBoard(engineerRepairResult.grid, engineerRepairResult.tileDamage, engineerRepairResult.tileRoles);
        addRoleMetrics(buildRoleMetricDeltaFromCells(engineerRepairResult.repairedCells, "repair"));
        pushLog(`🛠️ 整備士修復 +${engineerRepairResult.repairedAmount}`);
      }
      if (result.bossDefeated) {
        setEnemies([]);
      }
      playWaveClearSe();
      setPhase(GAME_PHASES.WAVECLEAR);
      pushLog(`🎉 Wave ${currentWave} クリア！`);
      effects.scheduleTimeout(() => {
        const nextWaveNumber = currentWave + 1;
        setWave(nextWaveNumber);
        setEnemies(spawnWave(nextWaveNumber - 1));
        setMovesLeft(movesPerTurn);
        setPhase(GAME_PHASES.PLAYER);
        effects.clearCombatEffects();
        pushLog(getWaveStartMessage(nextWaveNumber));
      }, AUTO_NEXT_WAVE_DELAY_MS);
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
  }, [addRoleMetrics, effects, flagTamper, movesPerTurn, playAttackSe, playWaveClearSe, pushLog, pushLogs, setBoard, setEnemies, setLives, setMovesLeft, setPhase, setScore]);

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
      if (!canMove(grid)) {
        setPhase(GAME_PHASES.GAMEOVER);
        pushLog("💀 グリッド満杯！ゲームオーバー！");
      }
      return;
    }
    const maxSlideScoreGain = getGridTotal(grid);
    if (!Number.isInteger(gainedScore) || gainedScore < 0 || gainedScore > maxSlideScoreGain) {
      flagTamper("移動スコア増分が不正");
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
  }, [addRoleMetrics, effects, enemies, flagTamper, grid, lives, movesLeft, phase, playMoveSe, pushLog, resolveTurn, setBoard, setMovesLeft, setPhase, setScore, tileDamage, tileRoles, wave]);

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
    setTampered(false);
    setLog([INITIAL_LOG]);
    setRoleMetrics(createRoleMetricsState());
    effects.clearCombatEffects();
    effects.clearRetaliationEffects();
    effects.clearRepairEffects();
    effects.setMergeHL([]);
  }, [effects, setBoard, setEnemies, setLives, setLog, setMovesLeft, setMovesPerTurn, setPhase, setRoleMetrics, setScore, setTampered, setWave]);

  return {
    handleSlide,
    nextWave,
    restart,
  };
}
