import {
  COLS,
  ROWS,
  ENEMY_MAX_STEPS,
  SHOT_ANIMATION_STAGGER,
  LANE_COLORS,
  LANE_NAMES,
} from "./constants";
import { getEnemyReward } from "./config";

function buildEffectKey(prefix, enemyId, lane, row, effectIndex) {
  return `${prefix}-${enemyId}-${lane}-${row}-${effectIndex}`;
}

function buildBurst(damage, enemy, lane, row, delayMs, effectIndex) {
  return {
    key: buildEffectKey("burst", enemy.id, lane, row, effectIndex),
    targetId: enemy.id,
    lane,
    top: Math.min(1, enemy.step / ENEMY_MAX_STEPS) * 72,
    damage,
    fontSize: Math.min(30, 16 + Math.floor(Math.log2(Math.max(damage, 1))) * 2),
    delayMs,
  };
}

function buildTrace(shotPower, enemy, lane, row, delayMs, blocked, effectIndex) {
  const color = blocked ? "#f1c40f" : LANE_COLORS[lane];

  return {
    key: buildEffectKey("trace", enemy.id, lane, row, effectIndex),
    lane,
    top: Math.min(1, enemy.step / ENEMY_MAX_STEPS) * 72,
    width: Math.min(10, 3 + Math.floor(Math.log2(Math.max(shotPower, 1))) * 0.75),
    color,
    blocked,
    delayMs,
  };
}

function advanceEnemies(enemies) {
  const newlyDeployedIds = new Set();
  const advancedEnemies = enemies.map((enemy) => {
    const nextStep = enemy.step + 1;
    if (enemy.step <= 0 && nextStep > 0) {
      newlyDeployedIds.add(enemy.id);
    }

    return { ...enemy, step: nextStep };
  });

  return { advancedEnemies, newlyDeployedIds };
}

export function resolveCombatTurn({ grid, enemies, lives }) {
  const { advancedEnemies, newlyDeployedIds } = advanceEnemies(enemies);
  let nextEnemies = advancedEnemies.map((enemy) => ({ ...enemy }));
  let nextLives = lives;
  let scoreGained = 0;
  let shotOrder = 0;
  let effectIndex = 0;

  const attackColumns = [];
  const damageByLane = {};
  const damageBursts = [];
  const shotTraces = [];
  const logMessages = [];

  for (let lane = 0; lane < COLS; lane += 1) {
    let laneDidAttack = false;

    for (let row = 0; row < ROWS; row += 1) {
      const shotPower = grid[row][lane];
      if (!shotPower) {
        continue;
      }

      const targets = nextEnemies
        .filter((enemy) => enemy.lane === lane && enemy.step > 0 && !newlyDeployedIds.has(enemy.id))
        .sort((left, right) => right.step - left.step);

      if (!targets.length) {
        break;
      }

      const target = targets[0];
      const delayMs = shotOrder * SHOT_ANIMATION_STAGGER;
      shotOrder += 1;

      if (shotPower <= target.armor) {
        shotTraces.push(buildTrace(shotPower, target, lane, row, delayMs, true, effectIndex));
        effectIndex += 1;
        logMessages.push(`🛡️ レーン${LANE_NAMES[lane]}: ${shotPower}砲撃が装甲${target.armor}に弾かれた！`);
        continue;
      }

      const damage = shotPower - target.armor;
      damageByLane[lane] = (damageByLane[lane] ?? 0) + damage;
      laneDidAttack = true;

      damageBursts.push(buildBurst(damage, target, lane, row, delayMs, effectIndex));
      shotTraces.push(buildTrace(shotPower, target, lane, row, delayMs, false, effectIndex));
      effectIndex += 1;

      nextEnemies = nextEnemies.map((enemy) => (
        enemy.id === target.id
          ? { ...enemy, hp: enemy.hp - damage }
          : enemy
      ));
    }

    if (laneDidAttack) {
      attackColumns.push(lane);
    }
  }

  const defeatedEnemies = nextEnemies.filter((enemy) => enemy.hp <= 0);
  defeatedEnemies.forEach((enemy) => {
    const reward = getEnemyReward(enemy);
    scoreGained += reward;
    logMessages.push(`${enemy.isBoss ? "💥ボス" : "✅"}撃破！+${reward}pts`);
  });
  nextEnemies = nextEnemies.filter((enemy) => enemy.hp > 0);

  const breachedEnemies = nextEnemies.filter((enemy) => enemy.step >= ENEMY_MAX_STEPS);
  if (breachedEnemies.length) {
    nextLives = Math.max(0, nextLives - breachedEnemies.length);
    logMessages.push(`⚠️ ${breachedEnemies.length}体突破！-${breachedEnemies.length}ライフ`);
  }
  nextEnemies = nextEnemies.filter((enemy) => enemy.step < ENEMY_MAX_STEPS);

  return {
    nextEnemies,
    nextLives,
    scoreGained,
    attackColumns,
    damageByLane,
    damageBursts,
    shotTraces,
    logMessages,
    effectDuration: Math.max(650, shotOrder * SHOT_ANIMATION_STAGGER + 420),
  };
}
