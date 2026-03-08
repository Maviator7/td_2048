import { beforeEach, describe, expect, test } from "vitest";

import { GAME_PHASES, TILE_ROLE_ORDER } from "./config";
import { COLS, ROWS } from "./constants";
import { clearSavedGame, getSavedGameMeta, loadGameSnapshot, saveGameSnapshot } from "./saveRepository";

const STORAGE_KEY = "merge-fortress-2048:save-data:v1";

function createGrid(valueFactory) {
  return Array.from({ length: ROWS }, (_, rowIndex) => (
    Array.from({ length: COLS }, (_, colIndex) => valueFactory(rowIndex, colIndex))
  ));
}

function createValidSnapshot() {
  return {
    boardState: {
      grid: createGrid((row, col) => (row === 0 && col === 0 ? 2 : 0)),
      tileDamage: createGrid(() => 0),
      tileRoles: createGrid(() => null),
    },
    enemies: [
      {
        id: "e3",
        type: "normal",
        lane: 1,
        hp: 20,
        maxHp: 20,
        armor: 0,
        speed: 1,
        step: 2.5,
        isBoss: false,
      },
    ],
    lives: 4,
    wave: 2,
    score: 128,
    phase: GAME_PHASES.PLAYER,
    movesPerTurn: 3,
    movesLeft: 2,
    log: ["log-1", "log-2"],
    roleMetrics: Object.fromEntries(
      TILE_ROLE_ORDER.map((roleKey) => [roleKey, { dealt: 0, taken: 0, repair: 0 }]),
    ),
  };
}

describe("saveRepository", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test("saves and loads a valid snapshot", () => {
    const snapshot = createValidSnapshot();

    const saveResult = saveGameSnapshot(snapshot);
    expect(saveResult.ok).toBe(true);

    const meta = getSavedGameMeta();
    expect(meta.exists).toBe(true);
    expect(meta.summary.wave).toBe(snapshot.wave);
    expect(meta.summary.score).toBe(snapshot.score);

    const loadResult = loadGameSnapshot();
    expect(loadResult.ok).toBe(true);
    expect(loadResult.snapshot.wave).toBe(snapshot.wave);
    expect(loadResult.snapshot.score).toBe(snapshot.score);
    expect(loadResult.snapshot.boardState.grid).toEqual(snapshot.boardState.grid);
  });

  test("detects tampered data and rejects loading", () => {
    const snapshot = createValidSnapshot();
    saveGameSnapshot(snapshot);

    const record = JSON.parse(localStorage.getItem(STORAGE_KEY));
    record.snapshot.score = 999999;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record));

    const loadResult = loadGameSnapshot();
    expect(loadResult).toEqual({ ok: false, reason: "not_found_or_invalid" });
  });

  test("rejects invalid snapshot data", () => {
    const invalidSnapshot = createValidSnapshot();
    invalidSnapshot.boardState.grid[0][0] = 3;

    const saveResult = saveGameSnapshot(invalidSnapshot);
    expect(saveResult).toEqual({ ok: false, reason: "invalid_snapshot" });
  });

  test("clearSavedGame removes save data", () => {
    saveGameSnapshot(createValidSnapshot());
    clearSavedGame();
    expect(getSavedGameMeta()).toEqual({ exists: false });
  });
});
