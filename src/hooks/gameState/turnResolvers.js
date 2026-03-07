import { applyLaneDamage } from "../../game/grid";

export function resolveRetaliationTurn(baseGrid, currentTileDamage, currentTileRoles, laneThreats) {
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

    const laneDamageResult = applyLaneDamage(nextGrid, nextTileDamage, nextTileRoles, lane, laneThreat.damage);
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
