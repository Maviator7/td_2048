import { useCallback, useEffect, useRef, useState } from "react";
import {
  INIT_LIVES,
  MOVES_PER_TURN,
  SWIPE_THRESHOLD,
  INITIAL_LOG,
} from "../game/constants";
import { GAME_PHASES, getWaveStartMessage } from "../game/config";
import {
  addRandomTile,
  canMove,
  createEmptyGrid,
  findMergedCells,
  getColumnPowers,
  slideGrid,
} from "../game/grid";
import {
  getNextSpawnEnemy,
  resetEnemyIds,
  spawnWave,
} from "../game/enemies";
import { resolveCombatTurn } from "../game/combat";

function createInitialGrid() {
  return addRandomTile(addRandomTile(createEmptyGrid()));
}

export function useGameState() {
  const [grid, setGrid] = useState(createInitialGrid);
  const [enemies, setEnemies] = useState(() => spawnWave(0));
  const [lives, setLives] = useState(INIT_LIVES);
  const [wave, setWave] = useState(1);
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState(GAME_PHASES.PLAYER);
  const [movesLeft, setMovesLeft] = useState(MOVES_PER_TURN);
  const [log, setLog] = useState([INITIAL_LOG]);
  const [atkCols, setAtkCols] = useState([]);
  const [dmgMap, setDmgMap] = useState({});
  const [hitEffects, setHitEffects] = useState([]);
  const [damageBursts, setDamageBursts] = useState([]);
  const [shotTraces, setShotTraces] = useState([]);
  const [mergeHL, setMergeHL] = useState([]);

  const touchStartRef = useRef(null);
  const timeoutIdsRef = useRef([]);

  const scheduleTimeout = useCallback((callback, delayMs) => {
    const timeoutId = window.setTimeout(() => {
      timeoutIdsRef.current = timeoutIdsRef.current.filter((currentId) => currentId !== timeoutId);
      callback();
    }, delayMs);

    timeoutIdsRef.current.push(timeoutId);
    return timeoutId;
  }, []);

  const clearScheduledTimeouts = useCallback(() => {
    timeoutIdsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    timeoutIdsRef.current = [];
  }, []);

  const pushLog = useCallback((message) => {
    setLog((currentLog) => [message, ...currentLog].slice(0, 8));
  }, []);

  const pushLogs = useCallback((messages) => {
    if (!messages.length) {
      return;
    }

    setLog((currentLog) => [...messages].reverse().concat(currentLog).slice(0, 8));
  }, []);

  const clearCombatEffects = useCallback(() => {
    setAtkCols([]);
    setDmgMap({});
    setHitEffects([]);
    setDamageBursts([]);
    setShotTraces([]);
  }, []);

  const resolveTurn = useCallback((currentGrid, currentEnemies, currentLives, currentWave) => {
    const result = resolveCombatTurn({
      grid: currentGrid,
      enemies: currentEnemies,
      lives: currentLives,
    });

    setAtkCols(result.attackColumns);
    setDmgMap(result.damageByLane);
    setHitEffects(result.hitEffects);
    setDamageBursts(result.damageBursts);
    setShotTraces(result.shotTraces);
    scheduleTimeout(clearCombatEffects, result.effectDuration);

    setEnemies(result.nextEnemies);
    setLives(result.nextLives);
    setScore((currentScore) => currentScore + result.scoreGained);
    pushLogs(result.logMessages);

    if (result.nextLives <= 0) {
      setPhase(GAME_PHASES.GAMEOVER);
      pushLog("💀 ライフ0！ゲームオーバー！");
      return;
    }

    if (result.nextEnemies.length === 0) {
      setPhase(GAME_PHASES.WAVECLEAR);
      pushLog(`🎉 Wave ${currentWave} クリア！`);
      return;
    }

    scheduleTimeout(() => {
      setMovesLeft(MOVES_PER_TURN);
      setPhase(GAME_PHASES.PLAYER);
      pushLog(`🔄 新ターン！残り${MOVES_PER_TURN}手`);
    }, 600);
  }, [clearCombatEffects, pushLog, pushLogs, scheduleTimeout]);

  const handleSlide = useCallback((direction) => {
    if (phase !== GAME_PHASES.PLAYER) {
      return;
    }

    const { grid: nextGrid, score: gainedScore, moved } = slideGrid(grid, direction);
    if (!moved) {
      return;
    }

    const mergedCells = findMergedCells(grid, nextGrid);
    const gridWithNewTile = addRandomTile(nextGrid);

    setGrid(gridWithNewTile);
    if (gainedScore) {
      setScore((currentScore) => currentScore + gainedScore);
      pushLog(`🔀 合体！+${gainedScore}pts`);
    }

    if (mergedCells.length) {
      setMergeHL(mergedCells);
      scheduleTimeout(() => setMergeHL([]), 400);
    }

    if (!canMove(gridWithNewTile)) {
      setPhase(GAME_PHASES.GAMEOVER);
      pushLog("💀 グリッド満杯！ゲームオーバー！");
      return;
    }

    const nextMovesLeft = movesLeft - 1;
    setMovesLeft(nextMovesLeft);

    if (nextMovesLeft <= 0) {
      pushLog("⚔️ 手数終了 → 攻撃！");
      setPhase(GAME_PHASES.RESOLVING);
      scheduleTimeout(() => resolveTurn(gridWithNewTile, enemies, lives, wave), 200);
      return;
    }

    pushLog(`残り${nextMovesLeft}手`);
  }, [enemies, grid, lives, movesLeft, phase, pushLog, resolveTurn, scheduleTimeout, wave]);

  const handleTouchStart = useCallback((event) => {
    const touch = event.touches?.[0];
    if (!touch) {
      return;
    }

    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const handleTouchEnd = useCallback((event) => {
    const start = touchStartRef.current;
    touchStartRef.current = null;

    if (!start || phase !== GAME_PHASES.PLAYER) {
      return;
    }

    const touch = event.changedTouches?.[0];
    if (!touch) {
      return;
    }

    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    if (Math.max(absX, absY) < SWIPE_THRESHOLD) {
      return;
    }

    if (absX > absY) {
      handleSlide(dx > 0 ? "right" : "left");
      return;
    }

    handleSlide(dy > 0 ? "down" : "up");
  }, [handleSlide, phase]);

  const nextWave = useCallback(() => {
    const nextWaveNumber = wave + 1;
    setWave(nextWaveNumber);
    setEnemies(spawnWave(nextWaveNumber - 1));
    setMovesLeft(MOVES_PER_TURN);
    setPhase(GAME_PHASES.PLAYER);
    clearCombatEffects();
    pushLog(getWaveStartMessage(nextWaveNumber));
  }, [clearCombatEffects, pushLog, wave]);

  const restart = useCallback(() => {
    clearScheduledTimeouts();
    resetEnemyIds();
    setGrid(createInitialGrid());
    setEnemies(spawnWave(0));
    setLives(INIT_LIVES);
    setWave(1);
    setScore(0);
    setMovesLeft(MOVES_PER_TURN);
    setPhase(GAME_PHASES.PLAYER);
    setLog([INITIAL_LOG]);
    clearCombatEffects();
    setMergeHL([]);
  }, [clearCombatEffects, clearScheduledTimeouts]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      const moveMap = {
        ArrowLeft: "left",
        ArrowRight: "right",
        ArrowUp: "up",
        ArrowDown: "down",
      };

      const direction = moveMap[event.key];
      if (!direction) {
        return;
      }

      event.preventDefault();
      handleSlide(direction);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSlide]);

  useEffect(() => clearScheduledTimeouts, [clearScheduledTimeouts]);

  return {
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
    hitEffects,
    damageBursts,
    shotTraces,
    mergeHL,
    colPower: getColumnPowers(grid),
    nextSpawnEnemy: getNextSpawnEnemy(enemies),
    handleTouchStart,
    handleTouchEnd,
    nextWave,
    restart,
  };
}
