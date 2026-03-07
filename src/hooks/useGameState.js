import { useCallback, useEffect, useRef, useState } from "react";
import {
  INIT_LIVES,
  MOVES_PER_TURN,
  SWIPE_THRESHOLD,
  INITIAL_LOG,
} from "../game/constants";
import {
  canSelectRoleByTileValue,
  GAME_PHASES,
  getTileRoleDef,
  getWaveStartMessage,
} from "../game/config";
import {
  addRandomTile,
  applyBacklineRepair,
  applyEngineerTurnRepair,
  canMove,
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
import {
  buildRoleMetricDeltaFromAmountMap,
  buildRoleMetricDeltaFromCells,
  createInitialGrid,
  createRoleMetricsState,
} from "./gameState/stateHelpers";
import { useScheduledGameEffects } from "./gameState/useScheduledGameEffects";
import { useGameDebugActions } from "./gameState/useGameDebugActions";
import { resolveRetaliationTurn } from "./gameState/turnResolvers";

const KEYBOARD_MOVE_MAP = {
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowUp: "up",
  ArrowDown: "down",
};

export function useGameState() {
  const [boardState, setBoardState] = useState(createInitialGrid);
  const [enemies, setEnemies] = useState(() => spawnWave(0));
  const [lives, setLives] = useState(INIT_LIVES);
  const [wave, setWave] = useState(1);
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState(GAME_PHASES.PLAYER);
  const [movesPerTurn, setMovesPerTurn] = useState(MOVES_PER_TURN);
  const [movesLeft, setMovesLeft] = useState(MOVES_PER_TURN);
  const [log, setLog] = useState([INITIAL_LOG]);
  const [roleMetrics, setRoleMetrics] = useState(createRoleMetricsState);

  const touchStartRef = useRef(null);
  const effects = useScheduledGameEffects();
  const { grid, tileDamage, tileRoles } = boardState;

  const pushLog = useCallback((message) => {
    setLog((currentLog) => [message, ...currentLog].slice(0, 8));
  }, []);

  const pushLogs = useCallback((messages) => {
    if (!messages.length) {
      return;
    }

    setLog((currentLog) => [...messages].reverse().concat(currentLog).slice(0, 8));
  }, []);

  const addRoleMetrics = useCallback((delta) => {
    if (!delta || !Object.keys(delta).length) {
      return;
    }

    setRoleMetrics((currentMetrics) => {
      const nextMetrics = { ...currentMetrics };
      Object.entries(delta).forEach(([roleKey, updates]) => {
        const current = nextMetrics[roleKey] ?? { dealt: 0, taken: 0, repair: 0 };
        nextMetrics[roleKey] = {
          dealt: current.dealt + (updates.dealt ?? 0),
          taken: current.taken + (updates.taken ?? 0),
          repair: current.repair + (updates.repair ?? 0),
        };
      });
      return nextMetrics;
    });
  }, []);

  const setBoard = useCallback((nextGrid, nextTileDamage, nextTileRoles) => {
    setBoardState({ grid: nextGrid, tileDamage: nextTileDamage, tileRoles: nextTileRoles });
  }, []);

  const resolveTurn = useCallback((baseGrid, currentTileDamage, currentTileRoles, currentEnemies, currentLives, currentWave) => {
    const attackGrid = getEffectiveGrid(baseGrid, currentTileDamage);
    const result = resolveCombatTurn({
      grid: attackGrid,
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
      const retaliationResult = resolveRetaliationTurn(baseGrid, currentTileDamage, currentTileRoles, result.remainingLaneThreats);
      const engineerRepairResult = applyEngineerTurnRepair(
        retaliationResult.nextGrid,
        retaliationResult.nextTileDamage,
        retaliationResult.nextTileRoles,
      );
      const turnEndLogs = [...retaliationResult.retaliationLogs];

      if (engineerRepairResult.repairedAmount > 0) {
        turnEndLogs.push(`🛠️ 整備士修復 +${engineerRepairResult.repairedAmount}`);
      }

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
  }, [addRoleMetrics, effects, movesPerTurn, pushLog, pushLogs, setBoard]);

  const handleSlide = useCallback((direction) => {
    if (phase !== GAME_PHASES.PLAYER) {
      return;
    }

    const {
      grid: nextGrid,
      tileDamage: nextTileDamage,
      tileRoles: nextTileRoles,
      score: gainedScore,
      moved,
      mergedCells,
    } = slideGrid(grid, tileDamage, tileRoles, direction);
    if (!moved) {
      return;
    }

    const nextState = addRandomTile(nextGrid, nextTileDamage, nextTileRoles);
    const gridWithNewTile = nextState.grid;
    const gridWithNewTileDamage = nextState.tileDamage;
    const gridWithNewTileRoles = nextState.tileRoles;

    const repairResult = applyBacklineRepair(gridWithNewTile, gridWithNewTileDamage);
    const nextTurnGrid = repairResult.grid;
    const nextTurnTileDamage = repairResult.tileDamage;
    const nextTurnTileRoles = gridWithNewTileRoles;

    setBoard(nextTurnGrid, nextTurnTileDamage, nextTurnTileRoles);
    if (repairResult.repairedAmount > 0) {
      effects.setRepairHighlights(repairResult.repairedCells);
      effects.scheduleTimeout(effects.clearRepairEffects, 360);
      addRoleMetrics(buildRoleMetricDeltaFromCells(repairResult.repairedCells, "repair", nextTurnTileRoles));
      pushLog(`🛠️ 後衛修復 +${repairResult.repairedAmount}`);
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
  }, [addRoleMetrics, effects, enemies, grid, lives, movesLeft, phase, pushLog, resolveTurn, setBoard, tileDamage, tileRoles, wave]);

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

  const setTileRoleAt = useCallback((row, col, nextRole) => {
    setBoardState((currentState) => {
      const tileValue = currentState.grid[row]?.[col] ?? 0;
      if (!canSelectRoleByTileValue(tileValue)) {
        return currentState;
      }
      if (currentState.tileRoles[row][col]) {
        return currentState;
      }
      if (!nextRole) {
        return currentState;
      }

      const currentRole = currentState.tileRoles[row][col] ?? null;
      if (currentRole === (nextRole ?? null)) {
        return currentState;
      }

      const nextTileRoles = currentState.tileRoles.map((roleRow) => [...roleRow]);
      nextTileRoles[row][col] = nextRole ?? null;
      return {
        ...currentState,
        tileRoles: nextTileRoles,
      };
    });

    const roleLabel = getTileRoleDef(nextRole)?.label ?? "役職";
    pushLog(`🎖️ ${roleLabel} を配置`);
  }, [pushLog]);

  const nextWave = useCallback(() => {
    const nextWaveNumber = wave + 1;
    setWave(nextWaveNumber);
    setEnemies(spawnWave(nextWaveNumber - 1));
    setMovesLeft(movesPerTurn);
    setPhase(GAME_PHASES.PLAYER);
    effects.clearCombatEffects();
    pushLog(getWaveStartMessage(nextWaveNumber));
  }, [effects, movesPerTurn, pushLog, wave]);

  const debug = useGameDebugActions({
    clearScheduledTimeouts: effects.clearScheduledTimeouts,
    clearCombatEffects: effects.clearCombatEffects,
    clearRetaliationEffects: effects.clearRetaliationEffects,
    clearRepairEffects: effects.clearRepairEffects,
    movesPerTurn,
    phase,
    pushLog,
    setEnemies,
    setLives,
    setMergeHL: effects.setMergeHL,
    setMovesLeft,
    setMovesPerTurn,
    setPhase,
    setScore,
    setWave,
    setBoardState,
    wave,
    lives,
  });

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
  }, [effects, setBoard]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      const direction = KEYBOARD_MOVE_MAP[event.key];
      if (!direction) {
        return;
      }

      event.preventDefault();
      handleSlide(direction);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSlide]);

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
    colPower: getColumnPowers(grid, tileDamage),
    tileRoles,
    roleMetrics,
    nextSpawnEnemy: getNextSpawnEnemy(enemies),
    handleTouchStart,
    handleTouchEnd,
    nextWave,
    restart,
    setTileRoleAt,
    debug,
  };
}
