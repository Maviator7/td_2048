import {
  COLS,
  ROWS,
  ENEMY_MAX_STEPS,
  SHOT_ANIMATION_STAGGER,
  LANE_COLORS,
  LANE_NAMES,
} from "./constants";
import {
  ENEMY_TYPES,
  ROLE_BONUSES,
  TILE_ROLES,
  getAttackMultiplierForRow,
  getEnemyReward,
} from "./config";
import { spawnSplitChildren } from "./enemies";

const MAX_VISUAL_EFFECTS = 10;
const MAX_CHAIN_VISUAL_EFFECTS = 12;

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

function buildChainTrace(fromEnemy, toEnemy, lane, delayMs, effectIndex, chainLevel) {
  const fromTop = Math.min(1, fromEnemy.step / ENEMY_MAX_STEPS) * 72 + 10;
  const toTop = Math.min(1, toEnemy.step / ENEMY_MAX_STEPS) * 72 + 10;

  return {
    key: `chain-${fromEnemy.id}-${toEnemy.id}-${lane}-${effectIndex}`,
    lane,
    fromTop,
    toTop,
    delayMs,
    chainLevel,
  };
}

function advanceEnemies(enemies) {
  const newlyDeployedIds = new Set();
  const advancedEnemies = enemies.map((enemy) => {
    const isSlowed = (enemy.slowTurns ?? 0) > 0;
    const stepDelta = (enemy.speed ?? 1) * (isSlowed ? 0.5 : 1);
    const nextStep = enemy.step + stepDelta;
    if (enemy.step <= 0 && nextStep > 0) {
      newlyDeployedIds.add(enemy.id);
    }

    return {
      ...enemy,
      step: nextStep,
      slowTurns: Math.max(0, (enemy.slowTurns ?? 0) - 1),
    };
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

export function resolveCombatTurn({ grid, tileRoles, enemies, lives }) {
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
  const chainTraces = [];
  const roleDamageByRole = {};
  const logMessages = [];

  for (let lane = 0; lane < COLS; lane += 1) {
    let laneDidAttack = false;
    const targets = laneTargets[lane];

    for (let row = 0; row < ROWS; row += 1) {
      const basePower = grid[row][lane];
      if (!basePower) {
        continue;
      }
      const tileRole = tileRoles[row][lane];
      const gambleMultiplier = tileRole === TILE_ROLES.GAMBLER
        ? ROLE_BONUSES.gamblerMinMultiplier + Math.random() * (ROLE_BONUSES.gamblerMaxMultiplier - ROLE_BONUSES.gamblerMinMultiplier)
        : 1;
      const shotPower = Math.round(basePower * getAttackMultiplierForRow(row) * gambleMultiplier);

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
      if (tileRole) {
        roleDamageByRole[tileRole] = (roleDamageByRole[tileRole] ?? 0) + damage;
      }
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

      if (tileRole === TILE_ROLES.SUPPRESSOR) {
        target.slowTurns = Math.max(target.slowTurns ?? 0, 1);
      }

      if (tileRole === TILE_ROLES.CHAINER) {
        let chainTargetIndex = laneTargetIndexes[lane] + 1;
        for (let chainLevel = 0; chainLevel < ROLE_BONUSES.chainRates.length; chainLevel += 1) {
          while (chainTargetIndex < targets.length && targets[chainTargetIndex].hp <= 0) {
            chainTargetIndex += 1;
          }

          if (chainTargetIndex >= targets.length) {
            break;
          }

          const chainedTarget = targets[chainTargetIndex];
          const chainedBaseDamage = Math.max(1, Math.round(damage * ROLE_BONUSES.chainRates[chainLevel]));
          if (chainedBaseDamage <= chainedTarget.armor) {
            chainTargetIndex += 1;
            continue;
          }

          const chainedDamage = chainedBaseDamage - chainedTarget.armor;
          chainedTarget.hp -= chainedDamage;
          damageByLane[lane] = (damageByLane[lane] ?? 0) + chainedDamage;
          if (tileRole) {
            roleDamageByRole[tileRole] = (roleDamageByRole[tileRole] ?? 0) + chainedDamage;
          }
          if (chainTraces.length < MAX_CHAIN_VISUAL_EFFECTS) {
            chainTraces.push(
              buildChainTrace(
                target,
                chainedTarget,
                lane,
                delayMs + (chainLevel + 1) * 40,
                effectIndex,
                chainLevel,
              ),
            );
          }

          if (damageBursts.length < MAX_VISUAL_EFFECTS) {
            damageBursts.push(buildDamageBurst(chainedTarget, lane, row, chainedDamage, delayMs + (chainLevel + 1) * 40, effectIndex));
          }
          effectIndex += 1;
          chainTargetIndex += 1;
        }
      }
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
    chainTraces,
    roleDamageByRole,
    logMessages,
    remainingLaneThreats,
    effectDuration: Math.max(650, shotOrder * SHOT_ANIMATION_STAGGER + 420),
  };
}
