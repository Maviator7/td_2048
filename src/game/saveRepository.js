import { GAME_PHASES, TILE_ROLE_ORDER } from "./config";
import { COLS, INIT_LIVES, MOVES_PER_TURN, ROWS } from "./constants";

const STORAGE_KEY = "merge-fortress-2048:save-data:v1";
const SIGNING_PEPPER = "mf2048-save-guard::v1";
const SAVE_VERSION = 1;

const GAME_PHASE_VALUES = Object.values(GAME_PHASES);
const TILE_ROLE_SET = new Set(TILE_ROLE_ORDER);

function cloneSnapshot(snapshot) {
  return {
    boardState: {
      grid: snapshot.boardState.grid.map((row) => [...row]),
      tileDamage: snapshot.boardState.tileDamage.map((row) => [...row]),
      tileRoles: snapshot.boardState.tileRoles.map((row) => [...row]),
    },
    enemies: snapshot.enemies.map((enemy) => ({ ...enemy })),
    lives: snapshot.lives,
    wave: snapshot.wave,
    score: snapshot.score,
    phase: snapshot.phase,
    movesPerTurn: snapshot.movesPerTurn,
    movesLeft: snapshot.movesLeft,
    log: [...snapshot.log],
    roleMetrics: Object.fromEntries(
      TILE_ROLE_ORDER.map((roleKey) => [roleKey, { ...snapshot.roleMetrics[roleKey] }]),
    ),
  };
}

function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  if (value && typeof value === "object") {
    const sortedKeys = Object.keys(value).sort();
    return `{${sortedKeys.map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
  }

  return JSON.stringify(value);
}

function fnv1a(input, seed = 0x811c9dc5) {
  let hash = seed >>> 0;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

function computeSignature({ snapshot, savedAt }) {
  const payload = `${SAVE_VERSION}|${savedAt}|${stableStringify(snapshot)}|${SIGNING_PEPPER}`;
  const h1 = fnv1a(payload, 0x811c9dc5).toString(16).padStart(8, "0");
  const h2 = fnv1a(payload, 0x9e3779b9).toString(16).padStart(8, "0");
  return `${h1}${h2}`;
}

function isInteger(value) {
  return Number.isInteger(value);
}

function isNonNegativeInteger(value) {
  return isInteger(value) && value >= 0;
}

function isValidGridShape(matrix) {
  return Array.isArray(matrix)
    && matrix.length === ROWS
    && matrix.every((row) => Array.isArray(row) && row.length === COLS);
}

function isPowerOfTwo(value) {
  return value > 0 && (value & (value - 1)) === 0;
}

function isValidBoardState(boardState) {
  if (!boardState || typeof boardState !== "object") {
    return false;
  }

  const { grid, tileDamage, tileRoles } = boardState;
  if (!isValidGridShape(grid) || !isValidGridShape(tileDamage) || !isValidGridShape(tileRoles)) {
    return false;
  }

  for (let rowIndex = 0; rowIndex < ROWS; rowIndex += 1) {
    for (let colIndex = 0; colIndex < COLS; colIndex += 1) {
      const value = grid[rowIndex][colIndex];
      const damage = tileDamage[rowIndex][colIndex];
      const role = tileRoles[rowIndex][colIndex];

      if (!isNonNegativeInteger(value) || (value !== 0 && !isPowerOfTwo(value))) {
        return false;
      }

      if (!isNonNegativeInteger(damage) || damage > value) {
        return false;
      }

      if (role !== null && !TILE_ROLE_SET.has(role)) {
        return false;
      }
    }
  }

  return true;
}

function isValidEnemy(enemy) {
  if (!enemy || typeof enemy !== "object") {
    return false;
  }

  if (typeof enemy.id !== "string" || enemy.id.length === 0) {
    return false;
  }

  if (!isInteger(enemy.lane) || enemy.lane < 0 || enemy.lane >= COLS) {
    return false;
  }

  if (!isNonNegativeInteger(enemy.hp) || !isNonNegativeInteger(enemy.maxHp) || enemy.maxHp < 1 || enemy.hp > enemy.maxHp) {
    return false;
  }

  if (typeof enemy.step !== "number" || Number.isNaN(enemy.step)) {
    return false;
  }

  if (typeof enemy.speed !== "number" || enemy.speed <= 0) {
    return false;
  }

  if (!isNonNegativeInteger(enemy.armor)) {
    return false;
  }

  if (typeof enemy.type !== "string" || typeof enemy.isBoss !== "boolean") {
    return false;
  }

  return true;
}

function isValidRoleMetrics(roleMetrics) {
  if (!roleMetrics || typeof roleMetrics !== "object") {
    return false;
  }

  return TILE_ROLE_ORDER.every((roleKey) => {
    const item = roleMetrics[roleKey];
    if (!item || typeof item !== "object") {
      return false;
    }

    return isNonNegativeInteger(item.dealt)
      && isNonNegativeInteger(item.taken)
      && isNonNegativeInteger(item.repair);
  });
}

function validateSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== "object") {
    return false;
  }

  if (!isValidBoardState(snapshot.boardState)) {
    return false;
  }

  if (!Array.isArray(snapshot.enemies) || !snapshot.enemies.every((enemy) => isValidEnemy(enemy))) {
    return false;
  }

  if (!isInteger(snapshot.lives) || snapshot.lives < 0 || snapshot.lives > INIT_LIVES) {
    return false;
  }

  if (!isInteger(snapshot.wave) || snapshot.wave < 1 || snapshot.wave > 999) {
    return false;
  }

  if (!isNonNegativeInteger(snapshot.score)) {
    return false;
  }

  if (!GAME_PHASE_VALUES.includes(snapshot.phase)) {
    return false;
  }

  if (!isInteger(snapshot.movesPerTurn) || snapshot.movesPerTurn < 1 || snapshot.movesPerTurn > MOVES_PER_TURN) {
    return false;
  }

  if (!isInteger(snapshot.movesLeft) || snapshot.movesLeft < 0 || snapshot.movesLeft > snapshot.movesPerTurn) {
    return false;
  }

  if (!Array.isArray(snapshot.log) || snapshot.log.length === 0 || snapshot.log.length > 8) {
    return false;
  }
  if (!snapshot.log.every((item) => typeof item === "string")) {
    return false;
  }

  if (!isValidRoleMetrics(snapshot.roleMetrics)) {
    return false;
  }

  return true;
}

function normalizeRecord(record) {
  if (!record || typeof record !== "object") {
    return null;
  }

  if (record.version !== SAVE_VERSION || typeof record.savedAt !== "number" || typeof record.signature !== "string") {
    return null;
  }

  if (!validateSnapshot(record.snapshot)) {
    return null;
  }

  const expectedSignature = computeSignature({
    snapshot: record.snapshot,
    savedAt: record.savedAt,
  });
  if (expectedSignature !== record.signature) {
    return null;
  }

  return {
    version: record.version,
    savedAt: record.savedAt,
    signature: record.signature,
    snapshot: cloneSnapshot(record.snapshot),
  };
}

function readRecord() {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);
    return normalizeRecord(parsed);
  } catch {
    return null;
  }
}

function writeRecord(record) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
}

function removeRecord() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
}

export function saveGameSnapshot(snapshot) {
  if (!validateSnapshot(snapshot)) {
    return { ok: false, reason: "invalid_snapshot" };
  }

  const normalizedSnapshot = cloneSnapshot(snapshot);
  const savedAt = Date.now();
  const record = {
    version: SAVE_VERSION,
    savedAt,
    snapshot: normalizedSnapshot,
    signature: computeSignature({ snapshot: normalizedSnapshot, savedAt }),
  };
  writeRecord(record);
  return {
    ok: true,
    savedAt,
    summary: {
      wave: normalizedSnapshot.wave,
      score: normalizedSnapshot.score,
      phase: normalizedSnapshot.phase,
    },
  };
}

export function loadGameSnapshot() {
  const record = readRecord();
  if (!record) {
    return { ok: false, reason: "not_found_or_invalid" };
  }

  return {
    ok: true,
    savedAt: record.savedAt,
    snapshot: cloneSnapshot(record.snapshot),
  };
}

export function clearSavedGame() {
  removeRecord();
}

export function getSavedGameMeta() {
  const record = readRecord();
  if (!record) {
    return { exists: false };
  }

  return {
    exists: true,
    savedAt: record.savedAt,
    summary: {
      wave: record.snapshot.wave,
      score: record.snapshot.score,
      phase: record.snapshot.phase,
    },
  };
}

export const saveRepository = {
  save: saveGameSnapshot,
  load: loadGameSnapshot,
  clear: clearSavedGame,
  getMeta: getSavedGameMeta,
};
