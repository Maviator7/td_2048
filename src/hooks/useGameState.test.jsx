import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { createEmptyDamageGrid, createEmptyGrid, createEmptyRoleGrid } from "../game/grid";
import { TILE_ROLE_ORDER } from "../game/config";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const { clearSaveSpy, getPhase, setPhase } = vi.hoisted(() => {
  let currentPhase = "player";
  return {
    clearSaveSpy: vi.fn(),
    getPhase: () => currentPhase,
    setPhase: (nextPhase) => {
      currentPhase = nextPhase;
    },
  };
});

vi.mock("./gameState/useScheduledGameEffects", () => ({
  useScheduledGameEffects: () => ({
    clearScheduledTimeouts: vi.fn(),
    clearCombatEffects: vi.fn(),
    clearRetaliationEffects: vi.fn(),
    clearRepairEffects: vi.fn(),
    setMergeHL: vi.fn(),
    atkCols: [],
    dmgMap: {},
    hitEffects: [],
    damageBursts: [],
    shotTraces: [],
    chainTraces: [],
    combatDebugByLane: {},
    retaliationCols: [],
    retaliationHits: [],
    repairHighlights: [],
    mergeHL: [],
  }),
}));

vi.mock("./gameState/useGameDebugActions", () => ({
  useGameDebugActions: () => ({}),
}));

vi.mock("./gameState/useRoleAssignment", () => ({
  useRoleAssignment: () => ({
    setTileRoleAt: vi.fn(),
  }),
}));

vi.mock("./gameState/useGameDerivedState", () => ({
  useGameDerivedState: () => ({
    colPower: [0, 0, 0, 0],
    nextSpawnEnemy: null,
  }),
}));

vi.mock("./gameState/useGameInput", () => ({
  useGameInput: () => ({
    handleTouchStart: vi.fn(),
    handleTouchEnd: vi.fn(),
  }),
}));

vi.mock("./gameState/useGameTurnFlow", () => ({
  useGameTurnFlow: () => ({
    handleSlide: vi.fn(),
    nextWave: vi.fn(),
    restart: vi.fn(),
  }),
}));

vi.mock("./gameState/useGameCoreState", () => ({
  useGameCoreState: () => ({
    state: {
      boardState: {
        grid: createEmptyGrid(),
        tileDamage: createEmptyDamageGrid(),
        tileRoles: createEmptyRoleGrid(),
      },
      enemies: [],
      lives: 5,
      wave: 1,
      score: 0,
      phase: getPhase(),
      movesPerTurn: 3,
      movesLeft: 3,
      log: ["test"],
      lanePoisonTurns: [0, 0, 0, 0],
      roleMetrics: Object.fromEntries(
        TILE_ROLE_ORDER.map((roleKey) => [roleKey, { dealt: 0, taken: 0, repair: 0 }]),
      ),
      tampered: false,
    },
    setters: {
      setBoardState: vi.fn(),
      setEnemies: vi.fn(),
      setLives: vi.fn(),
      setWave: vi.fn(),
      setScore: vi.fn(),
      setPhase: vi.fn(),
      setMovesPerTurn: vi.fn(),
      setMovesLeft: vi.fn(),
      setLog: vi.fn(),
      setRoleMetrics: vi.fn(),
      setTampered: vi.fn(),
      setBoard: vi.fn(),
    },
    helpers: {
      pushLog: vi.fn(),
      pushLogs: vi.fn(),
      addRoleMetrics: vi.fn(),
    },
  }),
}));

vi.mock("../game/enemies", () => ({
  resetEnemyIds: vi.fn(),
  syncEnemyIdCounter: vi.fn(),
}));

vi.mock("../game/saveRepository", () => ({
  saveRepository: {
    save: vi.fn(() => ({ ok: true })),
    load: vi.fn(() => ({ ok: false, reason: "not_found_or_invalid" })),
    clear: clearSaveSpy,
    getMeta: vi.fn(() => ({ exists: false })),
    isSnapshotValid: vi.fn(() => true),
  },
}));

import { useGameState } from "./useGameState";

function HookHarness() {
  useGameState();
  return null;
}

describe("useGameState", () => {
  let container;
  let root;

  beforeEach(() => {
    clearSaveSpy.mockClear();
    setPhase("player");
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  test("clears saved game when phase is gameover", () => {
    setPhase("gameover");

    act(() => {
      root.render(<HookHarness />);
    });

    expect(clearSaveSpy).toHaveBeenCalledTimes(1);
  });

  test("does not clear saved game during non-gameover phases", () => {
    setPhase("player");

    act(() => {
      root.render(<HookHarness />);
    });

    expect(clearSaveSpy).not.toHaveBeenCalled();
  });
});
