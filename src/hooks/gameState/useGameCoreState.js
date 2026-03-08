import { useCallback, useState } from "react";

import { INIT_LIVES, INITIAL_LOG, MOVES_PER_TURN } from "../../game/constants";
import { GAME_PHASES } from "../../game/config";
import { spawnWave } from "../../game/enemies";
import { createInitialGrid, createRoleMetricsState } from "./stateHelpers";

export function useGameCoreState() {
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
  const [tampered, setTampered] = useState(false);

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

  return {
    state: {
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
    },
    setters: {
      setBoardState,
      setEnemies,
      setLives,
      setWave,
      setScore,
      setPhase,
      setMovesPerTurn,
      setMovesLeft,
      setLog,
      setRoleMetrics,
      setTampered,
      setBoard,
    },
    helpers: {
      pushLog,
      pushLogs,
      addRoleMetrics,
    },
  };
}
