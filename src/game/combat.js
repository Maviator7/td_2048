import {
  COLS,
  ROWS,
  ENEMY_MAX_STEPS,
  SHOT_ANIMATION_STAGGER,
  LANE_COLORS,
  LANE_NAMES,
} from "./constants";
import { ENEMY_TYPES, getAttackMultiplierForRow, getEnemyReward } from "./config";
import { spawnSplitChildren } from "./enemies";

const MAX_VISUAL_EFFECTS = 10;

function buildHitEffect(enemy, lane, row, delayMs, effectIndex) {
  return {
    key: `hit-${enemy.id}-${lane}-${row}-${effectIndex}`,
    targetId: enemy.id,
    lane,
    top: Math.min(1, enemy.step / ENEMY_MAX_STEPS) * 72,
    delayMs,
  };
}

function buildDamageBurst(enemy, lane, row, damage, delayMs, effectIndex) {
  return {
    key: `burst-${enemy.id}-${lane}-${row}-${effectIndex}`,
    targetId: enemy.id,
    lane,
    top: Math.min(1, enemy.step / ENEMY_MAX_STEPS) * 72,
    damage,
    fontSize: Math.min(24, 14 + Math.floor(Math.log2(Math.max(damage, 1))) * 2),
    delayMs,
  };
}

function buildShotTrace(enemy, lane, row, delayMs, blocked, effectIndex) {
  return {
    key: `trace-${enemy.id}-${lane}-${row}-${effectIndex}`,
    lane,
    top: Math.min(1, enemy.step / ENEMY_MAX_STEPS) * 72,
    width: blocked ? 3 : 2,
    color: blocked ? "#f1c40f" : LANE_COLORS[lane],
    blocked,
    delayMs,
  };
}

function advanceEnemies(enemies) {
  const newlyDeployedIds = new Set();
  const advancedEnemies = enemies.map((enemy) => {
    const nextStep = enemy.step + (enemy.speed ?? 1);
    if (enemy.step <= 0 && nextStep > 0) {
      newlyDeployedIds.add(enemy.id);
    }

    return { ...enemy, step: nextStep };
  });

  return { advancedEnemies, newlyDeployedIds };
}

function buildLaneTargets(enemies, newlyDeployedIds) {
  const laneTargets = Array.from({ length: COLS }, () => []);

  for (const enemy of enemies) {
    if (enemy.step > 0 && !newlyDeployedIds.has(enemy.id)) {
      laneTargets[enemy.lane].push(enemy);
    }
  }

  for (const lane of laneTargets) {
    lane.sort((left, right) => right.step - left.step);
  }

  return laneTargets;
}

export function resolveCombatTurn({ grid, enemies, lives }) {
  const { advancedEnemies, newlyDeployedIds } = advanceEnemies(enemies);
  let nextEnemies = advancedEnemies.map((enemy) => ({ ...enemy }));
  const laneTargets = buildLaneTargets(nextEnemies, newlyDeployedIds);
  const laneTargetIndexes = Array(COLS).fill(0);
  let nextLives = lives;
  let scoreGained = 0;
  let shotOrder = 0;
  let effectIndex = 0;

  const attackColumns = [];
  const damageByLane = {};
  const hitEffects = [];
  const damageBursts = [];
  const shotTraces = [];
  const logMessages = [];

  for (let lane = 0; lane < COLS; lane += 1) {
    let laneDidAttack = false;
    const targets = laneTargets[lane];

    for (let row = 0; row < ROWS; row += 1) {
      const basePower = grid[row][lane];
      if (!basePower) {
        continue;
      }
      const shotPower = Math.round(basePower * getAttackMultiplierForRow(row));

      while (laneTargetIndexes[lane] < targets.length && targets[laneTargetIndexes[lane]].hp <= 0) {
        laneTargetIndexes[lane] += 1;
      }

      if (laneTargetIndexes[lane] >= targets.length) {
        break;
      }

      const target = targets[laneTargetIndexes[lane]];
      const delayMs = shotOrder * SHOT_ANIMATION_STAGGER;
      shotOrder += 1;

      if (shotPower <= target.armor) {
        if (shotTraces.length < MAX_VISUAL_EFFECTS) {
          shotTraces.push(buildShotTrace(target, lane, row, delayMs, true, effectIndex));
        }
        effectIndex += 1;
        logMessages.push(`🛡️ レーン${LANE_NAMES[lane]}: ${shotPower}砲撃が装甲${target.armor}に弾かれた！`);
        continue;
      }

      const damage = shotPower - target.armor;
      damageByLane[lane] = (damageByLane[lane] ?? 0) + damage;
      laneDidAttack = true;

      hitEffects.push(buildHitEffect(target, lane, row, delayMs, effectIndex));
      if (damageBursts.length < MAX_VISUAL_EFFECTS) {
        damageBursts.push(buildDamageBurst(target, lane, row, damage, delayMs, effectIndex));
      }
      if (shotTraces.length < MAX_VISUAL_EFFECTS) {
        shotTraces.push(buildShotTrace(target, lane, row, delayMs, false, effectIndex));
      }
      effectIndex += 1;
      target.hp -= damage;
    }

    if (laneDidAttack) {
      attackColumns.push(lane);
    }
  }

  const defeatedEnemies = nextEnemies.filter((enemy) => enemy.hp <= 0);
  const spawnedChildren = [];
  defeatedEnemies.forEach((enemy) => {
    const reward = getEnemyReward(enemy);
    scoreGained += reward;
    const enemyLabel = enemy.isBoss
      ? "💥ボス"
      : enemy.type === ENEMY_TYPES.FAST
        ? "⚡高速敵"
        : enemy.type === ENEMY_TYPES.SPLITTER
          ? "🧬分裂敵"
          : enemy.type === ENEMY_TYPES.SPLIT_CHILD
            ? "✳️分裂子"
        : "✅";
    logMessages.push(`${enemyLabel}撃破！+${reward}pts`);

    if (enemy.type === ENEMY_TYPES.SPLITTER) {
      const splitChildren = spawnSplitChildren(enemy);
      spawnedChildren.push(...splitChildren);
      logMessages.push(`🧬 分裂！レーン${LANE_NAMES[enemy.lane]}に${splitChildren.length}体出現`);
    }
  });
  nextEnemies = nextEnemies.filter((enemy) => enemy.hp > 0);
  if (spawnedChildren.length) {
    nextEnemies = nextEnemies.concat(spawnedChildren);
  }

  const breachedEnemies = nextEnemies.filter((enemy) => enemy.step >= ENEMY_MAX_STEPS);
  if (breachedEnemies.length) {
    nextLives = Math.max(0, nextLives - breachedEnemies.length);
    logMessages.push(`⚠️ ${breachedEnemies.length}体突破！-${breachedEnemies.length}ライフ`);
  }
  nextEnemies = nextEnemies.filter((enemy) => enemy.step < ENEMY_MAX_STEPS);

  const remainingLaneThreats = Array(COLS).fill(null);
  for (let lane = 0; lane < COLS; lane += 1) {
    const laneEnemies = nextEnemies
      .filter((enemy) => enemy.lane === lane && enemy.step > 0 && !newlyDeployedIds.has(enemy.id))
      .sort((left, right) => right.step - left.step);

    if (laneEnemies.length) {
      remainingLaneThreats[lane] = {
        lane,
        laneName: LANE_NAMES[lane],
        damage: laneEnemies[0].hp,
      };
    }
  }

  return {
    nextEnemies,
    nextLives,
    scoreGained,
    attackColumns,
    damageByLane,
    hitEffects,
    damageBursts,
    shotTraces,
    logMessages,
    remainingLaneThreats,
    effectDuration: Math.max(650, shotOrder * SHOT_ANIMATION_STAGGER + 420),
  };
}
