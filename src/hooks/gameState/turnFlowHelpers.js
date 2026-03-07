import { resolveCombatTurn } from "../../game/combat";
import {
  addRandomTile,
  applyBacklineRepair,
  applyEngineerTurnRepair,
  getEffectiveGrid,
  slideGrid,
} from "../../game/grid";
import { resolveRetaliationTurn } from "./turnResolvers";

export function resolveCombatPhase({ grid, tileDamage, tileRoles, enemies, lives }) {
  const attackGrid = getEffectiveGrid(grid, tileDamage);
  return resolveCombatTurn({
    grid: attackGrid,
    tileRoles,
    enemies,
    lives,
  });
}

export function resolveSlideStep({ grid, tileDamage, tileRoles, direction }) {
  const slideResult = slideGrid(grid, tileDamage, tileRoles, direction);
  if (!slideResult.moved) {
    return slideResult;
  }

  const spawnedState = addRandomTile(
    slideResult.grid,
    slideResult.tileDamage,
    slideResult.tileRoles,
  );
  const repairResult = applyBacklineRepair(spawnedState.grid, spawnedState.tileDamage);

  return {
    ...slideResult,
    nextTurnGrid: repairResult.grid,
    nextTurnTileDamage: repairResult.tileDamage,
    nextTurnTileRoles: spawnedState.tileRoles,
    repairedAmount: repairResult.repairedAmount,
    repairedCells: repairResult.repairedCells,
  };
}

export function resolveRetaliationPhase({ grid, tileDamage, tileRoles, remainingLaneThreats }) {
  const retaliationResult = resolveRetaliationTurn(
    grid,
    tileDamage,
    tileRoles,
    remainingLaneThreats,
  );
  const engineerRepairResult = applyEngineerTurnRepair(
    retaliationResult.nextGrid,
    retaliationResult.nextTileDamage,
    retaliationResult.nextTileRoles,
  );
  const turnEndLogs = [...retaliationResult.retaliationLogs];

  if (engineerRepairResult.repairedAmount > 0) {
    turnEndLogs.push(`🛠️ 整備士修復 +${engineerRepairResult.repairedAmount}`);
  }

  return {
    retaliationResult,
    engineerRepairResult,
    turnEndLogs,
  };
}
