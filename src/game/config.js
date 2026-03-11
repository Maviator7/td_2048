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
  healer: {
    startWave: 4,
    spawnChance: 0.12,
    healRatio: 0.05,
  },
  poison: {
    startWave: 5,
    spawnChance: 0.12,
    bonusRatio: 0.3,
    minBonus: 1,
    turns: 1,
  },
  wave: {
    startWave: 6,
    spawnChance: 0.13,
    healAmount: 1,
  },
  splitter: {
    startWave: 3,
    spawnChance: 0.16,
    splitCount: 3,
    childHpRatio: 0.34,
    childSpeed: 1.25,
  },
  sniper: {
    startWave: 5,
    spawnChance: 0.12,
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
  healerKillMultiplier: 3,
  poisonKillMultiplier: 3,
  waveKillMultiplier: 3,
  splitterKillMultiplier: 4,
  sniperKillMultiplier: 4,
  splitChildKillMultiplier: 1,
  bossKillMultiplier: 5,
};

export const FORMATION_BONUSES = {
  frontlineAttackMultiplier: 1.25,
  backlineAttackMultiplier: 0.8,
  midlineDamageReduction: 0.25,
  backlineRepairRatio: 0.1,
  engineerDamageTakenMultiplier: 0.65,
  engineerTurnRepairRatio: 0.05,
};

export const ROLE_BONUSES = {
  gamblerMinMultiplier: 0.8,
  gamblerMaxMultiplier: 2,
  chainRates: [0.45, 0.25, 0.15],
};

export const ROLE_RULES = {
  minSelectableLevel: 7,
};

export const ROW_ROLES = {
  FRONTLINE: "frontline",
  MIDLINE: "midline",
  BACKLINE: "backline",
};

export const TILE_ROLES = {
  SUPPRESSOR: "suppressor",
  ENGINEER: "engineer",
  CHAINER: "chainer",
  GAMBLER: "gambler",
};

export const TILE_ROLE_ORDER = [
  TILE_ROLES.SUPPRESSOR,
  TILE_ROLES.ENGINEER,
  TILE_ROLES.CHAINER,
  TILE_ROLES.GAMBLER,
];

export const TILE_ROLE_DEFS = {
  [TILE_ROLES.SUPPRESSOR]: {
    icon: "🕸️",
    label: "制圧兵",
    description: "攻撃した敵を次のターンに減速させます。速い敵を防衛線手前で足止めしたい時に有効です。",
  },
  [TILE_ROLES.ENGINEER]: {
    icon: "🛠️",
    label: "整備士",
    description: "ターン終了時に自分のダメージを少し修復します。傷んだ高レベル砲塔の維持に向いています。",
  },
  [TILE_ROLES.CHAINER]: {
    icon: "⚡",
    label: "連鎖兵",
    description: "先頭の敵を攻撃した後、後続の敵にも連鎖ダメージを与えます。敵が密集するレーンで強力です。",
  },
  [TILE_ROLES.GAMBLER]: {
    icon: "🎲",
    label: "賭博師",
    description: "攻撃ごとの威力が大きく上下します。高火力も狙えますが、安定性は低めです。",
  },
};

export const WAVE_FEATURES = {
  fastEnemiesStartWave: ENEMY_BALANCE.fast.startWave,
  healerEnemiesStartWave: ENEMY_BALANCE.healer.startWave,
  poisonEnemiesStartWave: ENEMY_BALANCE.poison.startWave,
  waveEnemiesStartWave: ENEMY_BALANCE.wave.startWave,
  splitterEnemiesStartWave: ENEMY_BALANCE.splitter.startWave,
  sniperEnemiesStartWave: ENEMY_BALANCE.sniper.startWave,
  armoredEnemiesStartWave: ENEMY_BALANCE.armor.startWave,
};

export const ENEMY_TYPES = {
  NORMAL: "normal",
  FAST: "fast",
  HEALER: "healer",
  POISON: "poison",
  WAVE: "wave",
  SPLITTER: "splitter",
  SNIPER: "sniper",
  SPLIT_CHILD: "split_child",
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
  [ENEMY_TYPES.HEALER]: {
    hpMultiplier: 0.95,
    armorMultiplier: 1,
    armorFlatBonus: 0,
    speed: 0.95,
    rewardMultiplier: SCORE_RULES.healerKillMultiplier,
    isBoss: false,
  },
  [ENEMY_TYPES.POISON]: {
    hpMultiplier: 0.9,
    armorMultiplier: 1,
    armorFlatBonus: 0,
    speed: 1.05,
    rewardMultiplier: SCORE_RULES.poisonKillMultiplier,
    isBoss: false,
  },
  [ENEMY_TYPES.WAVE]: {
    hpMultiplier: 1.05,
    armorMultiplier: 1,
    armorFlatBonus: 0,
    speed: 0.9,
    rewardMultiplier: SCORE_RULES.waveKillMultiplier,
    isBoss: false,
  },
  [ENEMY_TYPES.SPLITTER]: {
    hpMultiplier: 1,
    armorMultiplier: 1,
    armorFlatBonus: 0,
    speed: 1,
    rewardMultiplier: SCORE_RULES.splitterKillMultiplier,
    isBoss: false,
  },
  [ENEMY_TYPES.SNIPER]: {
    hpMultiplier: 0.92,
    armorMultiplier: 1,
    armorFlatBonus: 0,
    speed: 1.08,
    rewardMultiplier: SCORE_RULES.sniperKillMultiplier,
    isBoss: false,
  },
  [ENEMY_TYPES.SPLIT_CHILD]: {
    hpMultiplier: ENEMY_BALANCE.splitter.childHpRatio,
    armorMultiplier: 1,
    armorFlatBonus: 0,
    speed: ENEMY_BALANCE.splitter.childSpeed,
    rewardMultiplier: SCORE_RULES.splitChildKillMultiplier,
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

export function isHealerUnlocked(waveNumber) {
  return waveNumber >= WAVE_FEATURES.healerEnemiesStartWave;
}

export function isPoisonUnlocked(waveNumber) {
  return waveNumber >= WAVE_FEATURES.poisonEnemiesStartWave;
}

export function isWaveUnlocked(waveNumber) {
  return waveNumber >= WAVE_FEATURES.waveEnemiesStartWave;
}

export function isSplitterUnlocked(waveNumber) {
  return waveNumber >= WAVE_FEATURES.splitterEnemiesStartWave;
}

export function isSniperUnlocked(waveNumber) {
  return waveNumber >= WAVE_FEATURES.sniperEnemiesStartWave;
}

export function getEnemyType({ waveNumber, isLastEnemyInWave }) {
  if (isLastEnemyInWave) {
    return ENEMY_TYPES.BOSS;
  }

  if (isSplitterUnlocked(waveNumber) && Math.random() < ENEMY_BALANCE.splitter.spawnChance) {
    return ENEMY_TYPES.SPLITTER;
  }

  if (isHealerUnlocked(waveNumber) && Math.random() < ENEMY_BALANCE.healer.spawnChance) {
    return ENEMY_TYPES.HEALER;
  }

  if (isPoisonUnlocked(waveNumber) && Math.random() < ENEMY_BALANCE.poison.spawnChance) {
    return ENEMY_TYPES.POISON;
  }

  if (isSniperUnlocked(waveNumber) && Math.random() < ENEMY_BALANCE.sniper.spawnChance) {
    return ENEMY_TYPES.SNIPER;
  }

  if (isWaveUnlocked(waveNumber) && Math.random() < ENEMY_BALANCE.wave.spawnChance) {
    return ENEMY_TYPES.WAVE;
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

export function getEngineerTurnRepairAmount(baseValue) {
  if (baseValue <= 0) {
    return 0;
  }

  return Math.max(1, Math.ceil(baseValue * FORMATION_BONUSES.engineerTurnRepairRatio));
}

export function getTileRoleDef(tileRole) {
  return TILE_ROLE_DEFS[tileRole] ?? null;
}

export function getTileRoleIcon(tileRole) {
  return getTileRoleDef(tileRole)?.icon ?? "";
}

export function getAutoTileRoleForValue(value) {
  if (value < 256) {
    return null;
  }

  const valueLevel = Math.log2(value);
  const offset = Math.max(0, valueLevel - 8);
  return TILE_ROLE_ORDER[offset % TILE_ROLE_ORDER.length];
}

export function canSelectRoleByTileValue(value) {
  if (value <= 0) {
    return false;
  }

  return Math.log2(value) >= ROLE_RULES.minSelectableLevel;
}

export function isArmorUnlocked(waveNumber) {
  return waveNumber >= WAVE_FEATURES.armoredEnemiesStartWave;
}

export function getWaveStartMessage(waveNumber) {
  const suffixes = ["最後にボス出現！"];
  if (isFastUnlocked(waveNumber)) {
    suffixes.push("疾駆兵に注意！");
  }
  if (isSplitterUnlocked(waveNumber)) {
    suffixes.push("増殖核が出現！");
  }
  if (isSniperUnlocked(waveNumber)) {
    suffixes.push("狙撃兵に警戒！");
  }
  if (isArmorUnlocked(waveNumber)) {
    suffixes.push("装甲敵が登場！");
  }

  return `⚔️ Wave ${waveNumber} 開始！${suffixes.join(" ")}`;
}
