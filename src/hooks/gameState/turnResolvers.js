import { applyLaneDamage } from "../../game/grid";
import { ENEMY_BALANCE } from "../../game/config";

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
    const laneDamageResult = applyLaneDamage(nextGrid, nextTileDamage, nextTileRoles, lane, totalDamage);
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
    retaliationLogs.push(`💥 レーン${laneThreat.laneName}: 反撃${laneDamageResult.damageTaken}`);
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
