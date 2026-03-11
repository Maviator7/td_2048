import { COLS, ENEMY_MAX_STEPS } from "./constants";
import {
  ENEMY_BALANCE,
  ENEMY_TYPES,
  getBaseArmor,
  getEnemyType,
  getEnemyTypeDef,
  getEnemySpawnOffset,
  getRolledEnemyHp,
  getWaveEnemyCount,
} from "./config";

let enemyIdCounter = 0;

function createEnemyId() {
  return `e${enemyIdCounter++}`;
}

function createEnemy(lane, waveNumber, isLastEnemyInWave) {
  const rolledHp = getRolledEnemyHp(waveNumber);
  const baseArmor = getBaseArmor(waveNumber);
  const type = getEnemyType({ waveNumber, isLastEnemyInWave });
  const typeDef = getEnemyTypeDef(type);
  const maxHp = Math.max(1, Math.floor(rolledHp * typeDef.hpMultiplier));

  return {
    id: createEnemyId(),
    type,
    lane,
    hp: maxHp,
    maxHp,
    armor: baseArmor * typeDef.armorMultiplier + (typeDef.armorFlatBonus ?? 0),
    speed: typeDef.speed ?? 1,
    step: 0,
    isBoss: typeDef.isBoss,
  };
}

function getSpawnLaneForType(type) {
  if (type !== ENEMY_TYPES.SNIPER) {
    return Math.floor(Math.random() * COLS);
  }

  // B/Cレーン（index 1/2）に寄せる重み付け
  const roll = Math.random();
  if (roll < 0.12) {
    return 0;
  }
  if (roll < 0.5) {
    return 1;
  }
  if (roll < 0.88) {
    return 2;
  }
  return 3;
}

export function spawnWave(waveNumber) {
  const enemyCount = getWaveEnemyCount(waveNumber);

  return Array.from({ length: enemyCount }, (_, index) => {
    const isLastEnemyInWave = index === enemyCount - 1;
    const enemy = createEnemy(0, waveNumber, isLastEnemyInWave);
    enemy.lane = getSpawnLaneForType(enemy.type);
    enemy.step = getEnemySpawnOffset(index);
    return enemy;
  });
}

export function spawnSplitChildren(parentEnemy) {
  const childTypeDef = getEnemyTypeDef(ENEMY_TYPES.SPLIT_CHILD);
  const childCount = ENEMY_BALANCE.splitter.splitCount;
  const childBaseHp = Math.max(1, Math.floor(parentEnemy.maxHp * ENEMY_BALANCE.splitter.childHpRatio));
  const baseChildStep = Math.min(ENEMY_MAX_STEPS - 0.2, Math.max(0.2, parentEnemy.step - 1));
  const laneOffsets = [-9, 0, 9];

  return Array.from({ length: childCount }, (_, index) => ({
    id: createEnemyId(),
    type: ENEMY_TYPES.SPLIT_CHILD,
    lane: parentEnemy.lane,
    hp: childBaseHp,
    maxHp: childBaseHp,
    armor: 0,
    speed: childTypeDef.speed ?? 1,
    step: Math.min(ENEMY_MAX_STEPS - 0.1, baseChildStep + index * 0.16),
    laneOffsetPx: laneOffsets[index % laneOffsets.length],
    isBoss: false,
  }));
}

export function resetEnemyIds() {
  enemyIdCounter = 0;
}

export function syncEnemyIdCounter(enemies) {
  if (!Array.isArray(enemies) || !enemies.length) {
    enemyIdCounter = Math.max(enemyIdCounter, 0);
    return;
  }

  const maxId = enemies.reduce((currentMax, enemy) => {
    if (typeof enemy?.id !== "string") {
      return currentMax;
    }

    const matched = enemy.id.match(/^e(\d+)$/);
    if (!matched) {
      return currentMax;
    }

    const numericId = Number.parseInt(matched[1], 10);
    if (Number.isNaN(numericId)) {
      return currentMax;
    }

    return Math.max(currentMax, numericId);
  }, -1);

  enemyIdCounter = Math.max(enemyIdCounter, maxId + 1);
}

export function getQueuedEnemies(enemies) {
  return enemies.filter((enemy) => enemy.step <= 0);
}

export function getNextSpawnEnemy(enemies) {
  const queuedEnemies = getQueuedEnemies(enemies);
  if (!queuedEnemies.length) {
    return null;
  }

  return [...queuedEnemies].sort((left, right) => right.step - left.step)[0];
}

export function getLaneEnemies(enemies, lane) {
  return enemies
    .filter((enemy) => enemy.lane === lane && enemy.step > 0)
    .sort((left, right) => right.step - left.step);
}

export function countQueuedEnemiesInLane(enemies, lane) {
  return enemies.filter((enemy) => enemy.lane === lane && enemy.step <= 0).length;
}
