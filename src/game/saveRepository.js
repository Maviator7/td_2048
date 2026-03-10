import { ENEMY_TYPES, GAME_PHASES, TILE_ROLE_ORDER } from "./config";
import { COLS, ENEMY_MAX_STEPS, INIT_LIVES, MOVES_PER_TURN, ROWS } from "./constants";

const STORAGE_KEY = "merge-fortress-2048:save-data:v1";
const SIGNING_PEPPER = "mf2048-save-guard::v1";
const SAVE_VERSION = 1;

const GAME_PHASE_VALUES = Object.values(GAME_PHASES);
const TILE_ROLE_SET = new Set(TILE_ROLE_ORDER);
const ALLOWED_ENEMY_TYPES = new Set(Object.values(ENEMY_TYPES));
const SNAPSHOT_KEYS = new Set([
  "boardState",
  "enemies",
  "lives",
  "wave",
  "score",
  "phase",
  "movesPerTurn",
  "movesLeft",
  "log",
  "roleMetrics",
  "lanePoisonTurns",
]);
const BOARD_STATE_KEYS = new Set(["grid", "tileDamage", "tileRoles"]);
const ROLE_METRIC_KEYS = new Set(["dealt", "taken", "repair"]);
const ENEMY_KEYS = new Set([
  "id",
  "type",
  "lane",
  "hp",
  "maxHp",
  "armor",
  "speed",
  "step",
  "isBoss",
  "slowTurns",
  "laneOffsetPx",
]);

function hasOnlyKeys(value, allowedKeys) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  return Object.keys(value).every((key) => allowedKeys.has(key));
}

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
    lanePoisonTurns: Array.isArray(snapshot.lanePoisonTurns)
      ? [...snapshot.lanePoisonTurns]
      : Array.from({ length: COLS }, () => 0),
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
  if (!hasOnlyKeys(boardState, BOARD_STATE_KEYS)) {
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

      if (value === 0 && (damage !== 0 || role !== null)) {
        return false;
      }
    }
  }

  return true;
}

function isValidEnemy(enemy) {
  if (!hasOnlyKeys(enemy, ENEMY_KEYS)) {
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
  if (enemy.step < -200 || enemy.step > ENEMY_MAX_STEPS + 1) {
    return false;
  }

  if (typeof enemy.speed !== "number" || enemy.speed <= 0) {
    return false;
  }
  if (enemy.speed > 4) {
    return false;
  }

  if (!isNonNegativeInteger(enemy.armor)) {
    return false;
  }

  if (typeof enemy.type !== "string" || !ALLOWED_ENEMY_TYPES.has(enemy.type) || typeof enemy.isBoss !== "boolean") {
    return false;
  }
  if ((enemy.type === ENEMY_TYPES.BOSS) !== enemy.isBoss) {
    return false;
  }
  if (enemy.slowTurns !== undefined && (!isNonNegativeInteger(enemy.slowTurns) || enemy.slowTurns > 10)) {
    return false;
  }
  if (enemy.laneOffsetPx !== undefined && (typeof enemy.laneOffsetPx !== "number" || Number.isNaN(enemy.laneOffsetPx) || Math.abs(enemy.laneOffsetPx) > 80)) {
    return false;
  }

  return true;
}

function isValidRoleMetrics(roleMetrics) {
  if (!roleMetrics || typeof roleMetrics !== "object" || Array.isArray(roleMetrics)) {
    return false;
  }
  if (!Object.keys(roleMetrics).every((roleKey) => TILE_ROLE_SET.has(roleKey))) {
    return false;
  }

  return TILE_ROLE_ORDER.every((roleKey) => {
    const item = roleMetrics[roleKey];
    if (!hasOnlyKeys(item, ROLE_METRIC_KEYS)) {
      return false;
    }

    return isNonNegativeInteger(item.dealt)
      && isNonNegativeInteger(item.taken)
      && isNonNegativeInteger(item.repair);
  });
}

function validateSnapshot(snapshot) {
  if (!hasOnlyKeys(snapshot, SNAPSHOT_KEYS)) {
    return false;
  }

  if (!isValidBoardState(snapshot.boardState)) {
    return false;
  }

  if (!Array.isArray(snapshot.enemies) || !snapshot.enemies.every((enemy) => isValidEnemy(enemy))) {
    return false;
  }
  const enemyIds = snapshot.enemies.map((enemy) => enemy.id);
  if (new Set(enemyIds).size !== enemyIds.length) {
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

  if (snapshot.lanePoisonTurns !== undefined) {
    if (!Array.isArray(snapshot.lanePoisonTurns) || snapshot.lanePoisonTurns.length !== COLS) {
      return false;
    }
    if (!snapshot.lanePoisonTurns.every((value) => isNonNegativeInteger(value) && value <= 9)) {
      return false;
    }
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

export function isSnapshotValid(snapshot) {
  return validateSnapshot(snapshot);
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
  isSnapshotValid,
};
