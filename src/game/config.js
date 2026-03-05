export const GAME_PHASES = {
  PLAYER: "player",
  RESOLVING: "resolving",
  WAVECLEAR: "waveclear",
  GAMEOVER: "gameover",
};

export const ENEMY_BALANCE = {
  baseCount: 4,
  countPerWave: 2,
  spawnStepSpacing: 1.5,
  baseHpFactor: 18,
  hpRollMin: 0.7,
  hpRollRange: 0.6,
  fast: {
    startWave: 2,
    spawnChance: 0.28,
  },
  armor: {
    startWave: 4,
    growthOffset: 2,
    growthEvery: 2,
    maxExponent: 7,
  },
};

export const SCORE_RULES = {
  normalKillMultiplier: 2,
  fastKillMultiplier: 3,
  bossKillMultiplier: 5,
};

export const FORMATION_BONUSES = {
  frontlineAttackMultiplier: 1.25,
  backlineAttackMultiplier: 0.8,
  midlineDamageReduction: 0.25,
  backlineRepairRatio: 0.1,
};

export const ROW_ROLES = {
  FRONTLINE: "frontline",
  MIDLINE: "midline",
  BACKLINE: "backline",
};

export const WAVE_FEATURES = {
  fastEnemiesStartWave: ENEMY_BALANCE.fast.startWave,
  armoredEnemiesStartWave: ENEMY_BALANCE.armor.startWave,
};

export const ENEMY_TYPES = {
  NORMAL: "normal",
  FAST: "fast",
  BOSS: "boss",
};

export const ENEMY_TYPE_DEFS = {
  [ENEMY_TYPES.NORMAL]: {
    hpMultiplier: 1,
    armorMultiplier: 1,
    armorFlatBonus: 0,
    speed: 1,
    rewardMultiplier: SCORE_RULES.normalKillMultiplier,
    isBoss: false,
  },
  [ENEMY_TYPES.FAST]: {
    hpMultiplier: 0.85,
    armorMultiplier: 1,
    armorFlatBonus: 0,
    speed: 1.7,
    rewardMultiplier: SCORE_RULES.fastKillMultiplier,
    isBoss: false,
  },
  [ENEMY_TYPES.BOSS]: {
    hpMultiplier: 2.2,
    armorMultiplier: 1,
    armorFlatBonus: 6,
    speed: 1,
    rewardMultiplier: SCORE_RULES.bossKillMultiplier,
    isBoss: true,
  },
};

export function getWaveEnemyCount(waveNumber) {
  return ENEMY_BALANCE.baseCount + waveNumber * ENEMY_BALANCE.countPerWave;
}

export function getEnemySpawnOffset(index) {
  return -(index * ENEMY_BALANCE.spawnStepSpacing);
}

export function getRolledEnemyHp(waveNumber) {
  const baseHp = (waveNumber + 1) * ENEMY_BALANCE.baseHpFactor;
  const hpMultiplier = ENEMY_BALANCE.hpRollMin + Math.random() * ENEMY_BALANCE.hpRollRange;
  return Math.floor(baseHp * hpMultiplier);
}

export function isFastUnlocked(waveNumber) {
  return waveNumber >= WAVE_FEATURES.fastEnemiesStartWave;
}

export function getEnemyType({ waveNumber, isLastEnemyInWave }) {
  if (isLastEnemyInWave) {
    return ENEMY_TYPES.BOSS;
  }

  if (isFastUnlocked(waveNumber) && Math.random() < ENEMY_BALANCE.fast.spawnChance) {
    return ENEMY_TYPES.FAST;
  }

  return ENEMY_TYPES.NORMAL;
}

export function getEnemyTypeDef(enemyType) {
  return ENEMY_TYPE_DEFS[enemyType] ?? ENEMY_TYPE_DEFS[ENEMY_TYPES.NORMAL];
}

export function getBaseArmor(waveNumber) {
  if (waveNumber < ENEMY_BALANCE.armor.startWave) {
    return 0;
  }

  const exponent = Math.min(
    Math.floor((waveNumber - ENEMY_BALANCE.armor.growthOffset) / ENEMY_BALANCE.armor.growthEvery),
    ENEMY_BALANCE.armor.maxExponent,
  );

  return Math.pow(2, exponent);
}

export function getEnemyReward(enemy) {
  return enemy.maxHp * getEnemyTypeDef(enemy.type).rewardMultiplier;
}

export function getRowRole(rowIndex) {
  if (rowIndex <= 1) {
    return ROW_ROLES.FRONTLINE;
  }

  if (rowIndex <= 3) {
    return ROW_ROLES.MIDLINE;
  }

  return ROW_ROLES.BACKLINE;
}

export function getAttackMultiplierForRow(rowIndex) {
  const rowRole = getRowRole(rowIndex);

  if (rowRole === ROW_ROLES.FRONTLINE) {
    return FORMATION_BONUSES.frontlineAttackMultiplier;
  }

  if (rowRole === ROW_ROLES.BACKLINE) {
    return FORMATION_BONUSES.backlineAttackMultiplier;
  }

  return 1;
}

export function getMidlineReductionForRow(rowIndex) {
  return getRowRole(rowIndex) === ROW_ROLES.MIDLINE
    ? FORMATION_BONUSES.midlineDamageReduction
    : 0;
}

export function getBacklineRepairAmount(baseValue) {
  if (baseValue <= 0) {
    return 0;
  }

  return Math.ceil(baseValue * FORMATION_BONUSES.backlineRepairRatio);
}

export function isArmorUnlocked(waveNumber) {
  return waveNumber >= WAVE_FEATURES.armoredEnemiesStartWave;
}

export function getWaveStartMessage(waveNumber) {
  const suffixes = ["最後にボス出現！"];
  if (isFastUnlocked(waveNumber)) {
    suffixes.push("高速敵に注意！");
  }
  if (isArmorUnlocked(waveNumber)) {
    suffixes.push("装甲敵が登場！");
  }

  return `⚔️ Wave ${waveNumber} 開始！${suffixes.join(" ")}`;
}
