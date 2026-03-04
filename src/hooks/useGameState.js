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
  applyLaneDamage,
  canMove,
  createEmptyDamageGrid,
  createEmptyGrid,
  getEffectiveGrid,
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
  const emptyGrid = createEmptyGrid();
  const emptyDamage = createEmptyDamageGrid();
  const firstTile = addRandomTile(emptyGrid, emptyDamage);
  return addRandomTile(firstTile.grid, firstTile.tileDamage);
}

export function useGameState() {
  const [boardState, setBoardState] = useState(createInitialGrid);
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
  const [retaliationCols, setRetaliationCols] = useState([]);
  const [retaliationHits, setRetaliationHits] = useState([]);
  const [mergeHL, setMergeHL] = useState([]);

  const touchStartRef = useRef(null);
  const timeoutIdsRef = useRef([]);
  const { grid, tileDamage } = boardState;

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

  const clearRetaliationEffects = useCallback(() => {
    setRetaliationCols([]);
    setRetaliationHits([]);
  }, []);

  const setBoard = useCallback((nextGrid, nextTileDamage) => {
    setBoardState({ grid: nextGrid, tileDamage: nextTileDamage });
  }, []);

  const resolveRetaliation = useCallback((baseGrid, currentTileDamage, laneThreats) => {
    let nextGrid = baseGrid;
    let nextTileDamage = currentTileDamage;
    const retaliationLogs = [];
    const nextRetaliationCols = [];
    const nextRetaliationHits = [];

    for (let lane = 0; lane < laneThreats.length; lane += 1) {
      const laneThreat = laneThreats[lane];
      if (!laneThreat) {
        continue;
      }

      const laneDamageResult = applyLaneDamage(nextGrid, nextTileDamage, lane, laneThreat.damage);
      nextGrid = laneDamageResult.grid;
      nextTileDamage = laneDamageResult.tileDamage;

      if (laneDamageResult.damageTaken > 0) {
        nextRetaliationCols.push(lane);
        nextRetaliationHits.push(...laneDamageResult.affectedCells);
        retaliationLogs.push(`💥 レーン${laneThreat.laneName}: 反撃${laneDamageResult.damageTaken}`);
      }
    }

    if (retaliationLogs.length) {
      setRetaliationCols(nextRetaliationCols);
      setRetaliationHits(nextRetaliationHits);
      setBoard(nextGrid, nextTileDamage);
      pushLogs(retaliationLogs);
      scheduleTimeout(clearRetaliationEffects, 320);
      return true;
    }

    return false;
  }, [clearRetaliationEffects, pushLogs, scheduleTimeout, setBoard]);

  const resolveTurn = useCallback((baseGrid, currentTileDamage, currentEnemies, currentLives, currentWave) => {
    const attackGrid = getEffectiveGrid(baseGrid, currentTileDamage);
    const result = resolveCombatTurn({
      grid: attackGrid,
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
      const hadRetaliation = resolveRetaliation(baseGrid, currentTileDamage, result.remainingLaneThreats);

      scheduleTimeout(() => {
        setMovesLeft(MOVES_PER_TURN);
        setPhase(GAME_PHASES.PLAYER);
        pushLog(`🔄 新ターン！残り${MOVES_PER_TURN}手`);
      }, hadRetaliation ? 260 : 80);
    }, result.effectDuration);
  }, [clearCombatEffects, pushLog, pushLogs, resolveRetaliation, scheduleTimeout]);

  const handleSlide = useCallback((direction) => {
    if (phase !== GAME_PHASES.PLAYER) {
      return;
    }

    const {
      grid: nextGrid,
      tileDamage: nextTileDamage,
      score: gainedScore,
      moved,
      mergedCells,
    } = slideGrid(grid, tileDamage, direction);
    if (!moved) {
      return;
    }

    const nextState = addRandomTile(nextGrid, nextTileDamage);
    const gridWithNewTile = nextState.grid;
    const gridWithNewTileDamage = nextState.tileDamage;

    setBoard(gridWithNewTile, gridWithNewTileDamage);
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
      scheduleTimeout(() => resolveTurn(gridWithNewTile, gridWithNewTileDamage, enemies, lives, wave), 200);
      return;
    }

    pushLog(`残り${nextMovesLeft}手`);
  }, [enemies, grid, lives, movesLeft, phase, pushLog, resolveTurn, scheduleTimeout, setBoard, tileDamage, wave]);

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
    const initialState = createInitialGrid();
    setBoard(initialState.grid, initialState.tileDamage);
    setEnemies(spawnWave(0));
    setLives(INIT_LIVES);
    setWave(1);
    setScore(0);
    setMovesLeft(MOVES_PER_TURN);
    setPhase(GAME_PHASES.PLAYER);
    setLog([INITIAL_LOG]);
    clearCombatEffects();
    clearRetaliationEffects();
    setMergeHL([]);
  }, [clearCombatEffects, clearRetaliationEffects, clearScheduledTimeouts, setBoard]);

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
    tileDamage,
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
    retaliationCols,
    retaliationHits,
    mergeHL,
    colPower: getColumnPowers(grid, tileDamage),
    nextSpawnEnemy: getNextSpawnEnemy(enemies),
    handleTouchStart,
    handleTouchEnd,
    nextWave,
    restart,
  };
}
