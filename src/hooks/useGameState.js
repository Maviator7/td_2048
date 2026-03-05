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
  TILE_ROLE_ORDER,
  getTileRoleDef,
  getWaveStartMessage,
} from "../game/config";
import {
  addRandomTile,
  applyBacklineRepair,
  applyEngineerTurnRepair,
  applyLaneDamage,
  canMove,
  createEmptyDamageGrid,
  createEmptyGrid,
  createEmptyRoleGrid,
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
  const emptyRoles = createEmptyRoleGrid();
  const firstTile = addRandomTile(emptyGrid, emptyDamage, emptyRoles);
  return addRandomTile(firstTile.grid, firstTile.tileDamage, firstTile.tileRoles);
}

function createRoleMetricsState() {
  return Object.fromEntries(
    TILE_ROLE_ORDER.map((roleKey) => [roleKey, { dealt: 0, taken: 0, repair: 0 }]),
  );
}

function buildRoleMetricDeltaFromAmountMap(amountMap, metricKey) {
  const delta = {};
  Object.entries(amountMap ?? {}).forEach(([roleKey, amount]) => {
    if (!amount) {
      return;
    }

    delta[roleKey] = {
      dealt: 0,
      taken: 0,
      repair: 0,
      [metricKey]: amount,
    };
  });
  return delta;
}

function buildRoleMetricDeltaFromCells(cells, metricKey, fallbackRolesGrid) {
  const delta = {};
  (cells ?? []).forEach((cell) => {
    const roleKey = cell.role ?? fallbackRolesGrid?.[cell.row]?.[cell.col] ?? null;
    if (!roleKey) {
      return;
    }

    const amount = cell[metricKey] ?? 0;
    if (!amount) {
      return;
    }

    if (!delta[roleKey]) {
      delta[roleKey] = { dealt: 0, taken: 0, repair: 0 };
    }
    delta[roleKey][metricKey] += amount;
  });
  return delta;
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
  const [chainTraces, setChainTraces] = useState([]);
  const [retaliationCols, setRetaliationCols] = useState([]);
  const [retaliationHits, setRetaliationHits] = useState([]);
  const [repairHighlights, setRepairHighlights] = useState([]);
  const [mergeHL, setMergeHL] = useState([]);
  const [roleMetrics, setRoleMetrics] = useState(createRoleMetricsState);

  const touchStartRef = useRef(null);
  const timeoutIdsRef = useRef([]);
  const { grid, tileDamage, tileRoles } = boardState;

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
    setChainTraces([]);
  }, []);

  const clearRetaliationEffects = useCallback(() => {
    setRetaliationCols([]);
    setRetaliationHits([]);
  }, []);

  const clearRepairEffects = useCallback(() => {
    setRepairHighlights([]);
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

  const resolveRetaliation = useCallback((baseGrid, currentTileDamage, currentTileRoles, laneThreats) => {
    let nextGrid = baseGrid;
    let nextTileDamage = currentTileDamage;
    const nextTileRoles = currentTileRoles;
    const retaliationLogs = [];
    const nextRetaliationCols = [];
    const nextRetaliationHits = [];
    const roleTakenByRole = {};

    for (let lane = 0; lane < laneThreats.length; lane += 1) {
      const laneThreat = laneThreats[lane];
      if (!laneThreat) {
        continue;
      }

      const laneDamageResult = applyLaneDamage(nextGrid, nextTileDamage, nextTileRoles, lane, laneThreat.damage);
      nextGrid = laneDamageResult.grid;
      nextTileDamage = laneDamageResult.tileDamage;

      if (laneDamageResult.damageTaken > 0) {
        nextRetaliationCols.push(lane);
        nextRetaliationHits.push(...laneDamageResult.affectedCells);
        laneDamageResult.affectedCells.forEach((cell) => {
          if (!cell.role) {
            return;
          }
          roleTakenByRole[cell.role] = (roleTakenByRole[cell.role] ?? 0) + cell.damage;
        });
        retaliationLogs.push(`💥 レーン${laneThreat.laneName}: 反撃${laneDamageResult.damageTaken}`);
      }
    }

    return {
      nextGrid,
      nextTileDamage,
      nextTileRoles,
      retaliationLogs,
      nextRetaliationCols,
      nextRetaliationHits,
      roleTakenByRole,
      hadRetaliation: nextRetaliationCols.length > 0,
    };
  }, []);

  const resolveTurn = useCallback((baseGrid, currentTileDamage, currentTileRoles, currentEnemies, currentLives, currentWave) => {
    const attackGrid = getEffectiveGrid(baseGrid, currentTileDamage);
    const result = resolveCombatTurn({
      grid: attackGrid,
      tileRoles: currentTileRoles,
      enemies: currentEnemies,
      lives: currentLives,
    });

    setAtkCols(result.attackColumns);
    setDmgMap(result.damageByLane);
    setHitEffects(result.hitEffects);
    setDamageBursts(result.damageBursts);
    setShotTraces(result.shotTraces);
    setChainTraces(result.chainTraces);
    scheduleTimeout(clearCombatEffects, result.effectDuration);

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

    scheduleTimeout(() => {
      const retaliationResult = resolveRetaliation(baseGrid, currentTileDamage, currentTileRoles, result.remainingLaneThreats);
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
        setRetaliationCols(retaliationResult.nextRetaliationCols);
        setRetaliationHits(retaliationResult.nextRetaliationHits);
        scheduleTimeout(clearRetaliationEffects, 320);
      }

      if (turnEndLogs.length) {
        setBoard(engineerRepairResult.grid, engineerRepairResult.tileDamage, engineerRepairResult.tileRoles);
      }

      if (turnEndLogs.length) {
        pushLogs(turnEndLogs);
      }

      scheduleTimeout(() => {
        setMovesLeft(MOVES_PER_TURN);
        setPhase(GAME_PHASES.PLAYER);
        pushLog(`🔄 新ターン！残り${MOVES_PER_TURN}手`);
      }, retaliationResult.hadRetaliation ? 260 : 80);
    }, result.effectDuration);
  }, [addRoleMetrics, clearCombatEffects, clearRetaliationEffects, pushLog, pushLogs, resolveRetaliation, scheduleTimeout, setBoard]);

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
      setRepairHighlights(repairResult.repairedCells);
      scheduleTimeout(clearRepairEffects, 360);
      addRoleMetrics(buildRoleMetricDeltaFromCells(repairResult.repairedCells, "repair", nextTurnTileRoles));
      pushLog(`🛠️ 後衛修復 +${repairResult.repairedAmount}`);
    }

    if (gainedScore) {
      setScore((currentScore) => currentScore + gainedScore);
      pushLog(`🔀 合体！+${gainedScore}pts`);
    }

    if (mergedCells.length) {
      setMergeHL(mergedCells);
      scheduleTimeout(() => setMergeHL([]), 400);
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
      scheduleTimeout(() => resolveTurn(nextTurnGrid, nextTurnTileDamage, nextTurnTileRoles, enemies, lives, wave), 200);
      return;
    }

    pushLog(`残り${nextMovesLeft}手`);
  }, [addRoleMetrics, clearRepairEffects, enemies, grid, lives, movesLeft, phase, pushLog, resolveTurn, scheduleTimeout, setBoard, tileDamage, tileRoles, wave]);

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
    setMovesLeft(MOVES_PER_TURN);
    setPhase(GAME_PHASES.PLAYER);
    clearCombatEffects();
    pushLog(getWaveStartMessage(nextWaveNumber));
  }, [clearCombatEffects, pushLog, wave]);

  const restart = useCallback(() => {
    clearScheduledTimeouts();
    resetEnemyIds();
    const initialState = createInitialGrid();
    setBoard(initialState.grid, initialState.tileDamage, initialState.tileRoles);
    setEnemies(spawnWave(0));
    setLives(INIT_LIVES);
    setWave(1);
    setScore(0);
    setMovesLeft(MOVES_PER_TURN);
    setPhase(GAME_PHASES.PLAYER);
    setLog([INITIAL_LOG]);
    setRoleMetrics(createRoleMetricsState());
    clearCombatEffects();
    clearRetaliationEffects();
    clearRepairEffects();
    setMergeHL([]);
  }, [clearCombatEffects, clearRepairEffects, clearRetaliationEffects, clearScheduledTimeouts, setBoard]);

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
    chainTraces,
    retaliationCols,
    retaliationHits,
    repairHighlights,
    mergeHL,
    colPower: getColumnPowers(grid, tileDamage),
    tileRoles,
    roleMetrics,
    nextSpawnEnemy: getNextSpawnEnemy(enemies),
    handleTouchStart,
    handleTouchEnd,
    nextWave,
    restart,
    setTileRoleAt,
  };
}
