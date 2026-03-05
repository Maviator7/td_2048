import { COLS } from "./constants";
import {
  getBaseArmor,
  getEnemyType,
  getEnemyTypeDef,
  getEnemySpawnOffset,
  getRolledEnemyHp,
  getWaveEnemyCount,
} from "./config";

let enemyIdCounter = 0;

function createEnemy(lane, waveNumber, isLastEnemyInWave) {
  const rolledHp = getRolledEnemyHp(waveNumber);
  const baseArmor = getBaseArmor(waveNumber);
  const type = getEnemyType({ waveNumber, isLastEnemyInWave });
  const typeDef = getEnemyTypeDef(type);
  const maxHp = Math.max(1, Math.floor(rolledHp * typeDef.hpMultiplier));

  return {
    id: `e${enemyIdCounter++}`,
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

export function spawnWave(waveNumber) {
  const enemyCount = getWaveEnemyCount(waveNumber);

  return Array.from({ length: enemyCount }, (_, index) => {
    const isLastEnemyInWave = index === enemyCount - 1;
    const enemy = createEnemy(Math.floor(Math.random() * COLS), waveNumber, isLastEnemyInWave);
    enemy.step = getEnemySpawnOffset(index);
    return enemy;
  });
}

export function resetEnemyIds() {
  enemyIdCounter = 0;
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
