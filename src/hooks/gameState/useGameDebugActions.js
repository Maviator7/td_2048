import { useCallback } from "react";

import { GAME_PHASES } from "../../game/config";
import { COLS, ROWS } from "../../game/constants";
import { spawnWave } from "../../game/enemies";

export function useGameDebugActions({
  clearScheduledTimeouts,
  clearCombatEffects,
  clearRetaliationEffects,
  clearRepairEffects,
  movesPerTurn,
  phase,
  pushLog,
  setEnemies,
  setLives,
  setMergeHL,
  setMovesLeft,
  setMovesPerTurn,
  setPhase,
  setScore,
  setWave,
  setBoardState,
  wave,
  lives,
}) {
  const spawnTileDebug = useCallback((rawLevel, useRandomLevel = false) => {
    let spawned = null;
    let generatedValue = 0;

    setBoardState((currentState) => {
      const emptyCells = [];
      for (let rowIndex = 0; rowIndex < ROWS; rowIndex += 1) {
        for (let colIndex = 0; colIndex < COLS; colIndex += 1) {
          if (!currentState.grid[rowIndex][colIndex]) {
            emptyCells.push([rowIndex, colIndex]);
          }
        }
      }

      if (!emptyCells.length) {
        return currentState;
      }

      const [spawnRow, spawnCol] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      const requestedLevel = Number.isFinite(Number(rawLevel))
        ? Math.max(1, Math.min(16, Math.floor(Number(rawLevel))))
        : 1;
      const level = useRandomLevel
        ? Math.floor(Math.random() * 8) + 1
        : requestedLevel;
      generatedValue = 2 ** level;

      const nextGrid = currentState.grid.map((row) => [...row]);
      const nextTileDamage = currentState.tileDamage.map((row) => [...row]);
      const nextTileRoles = currentState.tileRoles.map((row) => [...row]);
      nextGrid[spawnRow][spawnCol] = generatedValue;
      nextTileDamage[spawnRow][spawnCol] = 0;
      nextTileRoles[spawnRow][spawnCol] = null;
      spawned = { row: spawnRow, col: spawnCol, level };

      return {
        grid: nextGrid,
        tileDamage: nextTileDamage,
        tileRoles: nextTileRoles,
      };
    });

    if (!spawned) {
      pushLog("🧪 DEBUG: 空きマスがないためタイル生成できません");
      return;
    }

    const modeLabel = useRandomLevel ? "ランダム" : "指定";
    pushLog(`🧪 DEBUG: ${modeLabel}Lv${spawned.level}タイルを生成 (${spawned.row},${spawned.col}) -> ${generatedValue}`);
  }, [pushLog, setBoardState]);

  const setWaveDebug = useCallback((rawWaveNumber) => {
    const nextWaveNumber = Number.isFinite(Number(rawWaveNumber))
      ? Math.max(1, Math.floor(Number(rawWaveNumber)))
      : 1;
    clearScheduledTimeouts();
    clearCombatEffects();
    clearRetaliationEffects();
    clearRepairEffects();
    setMergeHL([]);
    setWave(nextWaveNumber);
    setEnemies(spawnWave(nextWaveNumber - 1));
    setMovesLeft(movesPerTurn);
    setPhase(GAME_PHASES.PLAYER);
    pushLog(`🧪 DEBUG: Wave ${nextWaveNumber} に設定`);
  }, [clearCombatEffects, clearRepairEffects, clearRetaliationEffects, clearScheduledTimeouts, movesPerTurn, pushLog, setEnemies, setMergeHL, setMovesLeft, setPhase, setWave]);

  const setLivesDebug = useCallback((rawLives) => {
    const nextLives = Number.isFinite(Number(rawLives))
      ? Math.max(0, Math.floor(Number(rawLives)))
      : 0;
    clearScheduledTimeouts();
    setLives(nextLives);
    if (nextLives <= 0) {
      setPhase(GAME_PHASES.GAMEOVER);
      pushLog("🧪 DEBUG: ライフを0に設定（ゲームオーバー）");
      return;
    }
    if (phase === GAME_PHASES.GAMEOVER) {
      setPhase(GAME_PHASES.PLAYER);
    }
    pushLog(`🧪 DEBUG: ライフ ${nextLives}`);
  }, [clearScheduledTimeouts, phase, pushLog, setLives, setPhase]);

  const setScoreDebug = useCallback((rawScore) => {
    const nextScore = Number.isFinite(Number(rawScore))
      ? Math.max(0, Math.floor(Number(rawScore)))
      : 0;
    setScore(nextScore);
    pushLog(`🧪 DEBUG: スコア ${nextScore.toLocaleString()}`);
  }, [pushLog, setScore]);

  const setMovesLeftDebug = useCallback((rawMovesLeft) => {
    const nextMovesPerTurn = Number.isFinite(Number(rawMovesLeft))
      ? Math.max(1, Math.floor(Number(rawMovesLeft)))
      : 1;
    setMovesPerTurn(nextMovesPerTurn);
    setMovesLeft(nextMovesPerTurn);
    pushLog(`🧪 DEBUG: 1ターン手数を ${nextMovesPerTurn} に設定`);
  }, [pushLog, setMovesLeft, setMovesPerTurn]);

  const setPhaseDebug = useCallback((nextPhase) => {
    if (!Object.values(GAME_PHASES).includes(nextPhase)) {
      return;
    }
    clearScheduledTimeouts();
    setPhase(nextPhase);
    pushLog(`🧪 DEBUG: フェーズ ${nextPhase}`);
  }, [clearScheduledTimeouts, pushLog, setPhase]);

  const boostTileDebug = useCallback((rawRow, rawCol) => {
    const rowIndex = Number.isFinite(Number(rawRow)) ? Math.floor(Number(rawRow)) : -1;
    const colIndex = Number.isFinite(Number(rawCol)) ? Math.floor(Number(rawCol)) : -1;
    let boostedValue = 0;

    setBoardState((currentState) => {
      if (!currentState.grid[rowIndex] || typeof currentState.grid[rowIndex][colIndex] !== "number") {
        return currentState;
      }

      const currentValue = currentState.grid[rowIndex][colIndex];
      if (currentValue <= 0) {
        return currentState;
      }

      boostedValue = currentValue * 2;
      const nextGrid = currentState.grid.map((row) => [...row]);
      const nextTileDamage = currentState.tileDamage.map((row) => [...row]);
      const nextTileRoles = currentState.tileRoles.map((row) => [...row]);
      nextGrid[rowIndex][colIndex] = boostedValue;
      nextTileDamage[rowIndex][colIndex] = Math.min(nextTileDamage[rowIndex][colIndex], boostedValue);

      return {
        grid: nextGrid,
        tileDamage: nextTileDamage,
        tileRoles: nextTileRoles,
      };
    });

    if (boostedValue > 0) {
      pushLog(`🧪 DEBUG: タイル(${rowIndex},${colIndex})を Lv+1 → ${boostedValue}`);
      return;
    }

    pushLog(`🧪 DEBUG: タイル(${rowIndex},${colIndex})は強化できません`);
  }, [pushLog, setBoardState]);

  const killAllEnemiesDebug = useCallback(() => {
    clearScheduledTimeouts();
    clearCombatEffects();
    clearRetaliationEffects();
    setEnemies([]);
    setPhase(GAME_PHASES.WAVECLEAR);
    pushLog("🧪 DEBUG: 敵を全滅扱いにしました");
  }, [clearCombatEffects, clearRetaliationEffects, clearScheduledTimeouts, pushLog, setEnemies, setPhase]);

  const respawnWaveEnemiesDebug = useCallback(() => {
    clearScheduledTimeouts();
    clearCombatEffects();
    clearRetaliationEffects();
    setEnemies(spawnWave(wave - 1));
    if (lives > 0) {
      setPhase(GAME_PHASES.PLAYER);
    }
    setMovesLeft(movesPerTurn);
    pushLog(`🧪 DEBUG: Wave ${wave} の敵を再生成`);
  }, [clearCombatEffects, clearRetaliationEffects, clearScheduledTimeouts, lives, movesPerTurn, pushLog, setEnemies, setMovesLeft, setPhase, wave]);

  return {
    setWave: setWaveDebug,
    setLives: setLivesDebug,
    setScore: setScoreDebug,
    setMovesLeft: setMovesLeftDebug,
    setPhase: setPhaseDebug,
    boostTile: boostTileDebug,
    spawnTile: spawnTileDebug,
    killAllEnemies: killAllEnemiesDebug,
    respawnWaveEnemies: respawnWaveEnemiesDebug,
  };
}
