import { applyLaneDamage, getEffectiveTileValue } from "../../game/grid";
import { ENEMY_BALANCE, ENEMY_TYPES, FORMATION_BONUSES, TILE_ROLES } from "../../game/config";

function findSniperTarget(grid, tileDamage) {
  let best = null;

  for (let row = 0; row < grid.length; row += 1) {
    for (let col = 0; col < grid[row].length; col += 1) {
      const baseValue = grid[row][col];
      if (!baseValue) {
        continue;
      }

      const effectiveValue = getEffectiveTileValue(baseValue, tileDamage[row][col]);
      if (effectiveValue <= 0) {
        continue;
      }

      if (!best) {
        best = { row, col, baseValue, effectiveValue };
        continue;
      }

      if (
        baseValue > best.baseValue
        || (baseValue === best.baseValue && effectiveValue > best.effectiveValue)
      ) {
        best = { row, col, baseValue, effectiveValue };
      }
    }
  }

  return best;
}

function applySniperDamage(grid, tileDamage, tileRoles, damageAmount) {
  if (damageAmount <= 0) {
    return { grid, tileDamage, tileRoles, damageTaken: 0, affectedCells: [] };
  }

  const target = findSniperTarget(grid, tileDamage);
  if (!target) {
    return { grid, tileDamage, tileRoles, damageTaken: 0, affectedCells: [] };
  }

  const { row, col, baseValue, effectiveValue } = target;
  const nextDamage = tileDamage.map((damageRow) => [...damageRow]);
  const absorbedDamage = Math.min(effectiveValue, damageAmount);
  const tileRole = tileRoles[row][col];
  const appliedDamage = tileRole === TILE_ROLES.ENGINEER
    ? Math.max(1, Math.round(absorbedDamage * FORMATION_BONUSES.engineerDamageTakenMultiplier))
    : absorbedDamage;
  nextDamage[row][col] = Math.min(baseValue, nextDamage[row][col] + appliedDamage);

  return {
    grid,
    tileDamage: nextDamage,
    tileRoles,
    damageTaken: appliedDamage,
    affectedCells: [
      {
        key: `${row}-${col}`,
        row,
        col,
        damage: appliedDamage,
        role: tileRole ?? null,
      },
    ],
    target,
  };
}

export function resolveRetaliationTurn(baseGrid, currentTileDamage, currentTileRoles, laneThreats, lanePoisonTurns = []) {
  let nextGrid = baseGrid;
  let nextTileDamage = currentTileDamage;
  const nextTileRoles = currentTileRoles;
  const retaliationLogs = [];
  const nextRetaliationCols = [];
  const nextRetaliationHits = [];
  const roleTakenByRole = {};

  for (let lane = 0; lane < laneThreats.length; lane += 1) {
    const laneThreat = laneThreats[lane];
    if (!laneThreat) {
      continue;
    }

    const poisonTurns = lanePoisonTurns[lane] ?? 0;
    const bonusDamage = poisonTurns > 0
      ? Math.max(
        ENEMY_BALANCE.poison.minBonus,
        Math.floor(laneThreat.damage * ENEMY_BALANCE.poison.bonusRatio),
      )
      : 0;
    const totalDamage = laneThreat.damage + bonusDamage;
    const isSniperAttack = laneThreat.attackerType === ENEMY_TYPES.SNIPER;
    const laneDamageResult = isSniperAttack
      ? applySniperDamage(nextGrid, nextTileDamage, nextTileRoles, totalDamage)
      : applyLaneDamage(nextGrid, nextTileDamage, nextTileRoles, lane, totalDamage);
    nextGrid = laneDamageResult.grid;
    nextTileDamage = laneDamageResult.tileDamage;

    if (laneDamageResult.damageTaken <= 0) {
      continue;
    }

    nextRetaliationCols.push(lane);
    nextRetaliationHits.push(...laneDamageResult.affectedCells);
    laneDamageResult.affectedCells.forEach((cell) => {
      if (!cell.role) {
        return;
      }
      roleTakenByRole[cell.role] = (roleTakenByRole[cell.role] ?? 0) + cell.damage;
    });
    if (isSniperAttack) {
      const targetLabel = laneDamageResult.target
        ? ` → Lv.${Math.log2(laneDamageResult.target.baseValue)}(R${laneDamageResult.target.row + 1}C${laneDamageResult.target.col + 1})`
        : "";
      retaliationLogs.push(`🎯 レーン${laneThreat.laneName}: 狙撃${laneDamageResult.damageTaken}${targetLabel}`);
    } else {
      retaliationLogs.push(`💥 レーン${laneThreat.laneName}: 反撃${laneDamageResult.damageTaken}`);
    }
    if (bonusDamage > 0) {
      retaliationLogs.push(`☠️ レーン${laneThreat.laneName}: 毒で追加ダメージ${bonusDamage}`);
    }
  }

  return {
    nextGrid,
    nextTileDamage,
    nextTileRoles,
    retaliationLogs,
    nextRetaliationCols,
    nextRetaliationHits,
    roleTakenByRole,
    hadRetaliation: nextRetaliationCols.length > 0,
  };
}
