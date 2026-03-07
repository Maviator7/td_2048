import { beforeEach, describe, expect, test, vi } from "vitest";

import { ENEMY_TYPES, TILE_ROLES } from "../../game/config";
import { createEmptyDamageGrid, createEmptyGrid, createEmptyRoleGrid } from "../../game/grid";
import {
  resolveCombatPhase,
  resolveRetaliationPhase,
  resolveSlideStep,
} from "./turnFlowHelpers";

describe("turnFlowHelpers", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test("resolveCombatPhase uses effective tile power after damage", () => {
    const grid = createEmptyGrid();
    const tileDamage = createEmptyDamageGrid();
    const tileRoles = createEmptyRoleGrid();

    grid[0][0] = 8;
    tileDamage[0][0] = 3;

    const result = resolveCombatPhase({
      grid,
      tileDamage,
      tileRoles,
      enemies: [{
        id: "enemy-1",
        lane: 0,
        step: 1,
        hp: 5,
        maxHp: 5,
        armor: 0,
        speed: 1,
        type: ENEMY_TYPES.NORMAL,
        isBoss: false,
      }],
      lives: 5,
    });

    expect(result.nextEnemies).toHaveLength(0);
    expect(result.scoreGained).toBe(10);
    expect(result.damageByLane[0]).toBe(6);
  });

  test("resolveSlideStep applies backline repair after spawning a new tile", () => {
    vi.spyOn(Math, "random")
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0);

    const grid = createEmptyGrid();
    const tileDamage = createEmptyDamageGrid();
    const tileRoles = createEmptyRoleGrid();

    grid[0][0] = 2;
    grid[0][1] = 2;
    grid[5][0] = 8;
    tileDamage[5][0] = 1;

    const result = resolveSlideStep({
      grid,
      tileDamage,
      tileRoles,
      direction: "left",
    });

    expect(result.moved).toBe(true);
    expect(result.score).toBe(4);
    expect(result.nextTurnGrid[0][0]).toBe(4);
    expect(result.nextTurnGrid[0][1]).toBe(2);
    expect(result.repairedAmount).toBe(1);
    expect(result.nextTurnTileDamage[5][0]).toBe(0);
  });

  test("resolveRetaliationPhase aggregates retaliation damage and engineer repair logs", () => {
    const grid = createEmptyGrid();
    const tileDamage = createEmptyDamageGrid();
    const tileRoles = createEmptyRoleGrid();

    grid[0][0] = 4;
    tileRoles[0][0] = TILE_ROLES.ENGINEER;

    const result = resolveRetaliationPhase({
      grid,
      tileDamage,
      tileRoles,
      remainingLaneThreats: [{ laneName: "A", damage: 3 }, null, null, null],
    });

    expect(result.retaliationResult.hadRetaliation).toBe(true);
    expect(result.retaliationResult.roleTakenByRole[TILE_ROLES.ENGINEER]).toBe(2);
    expect(result.engineerRepairResult.repairedAmount).toBe(1);
    expect(result.engineerRepairResult.tileDamage[0][0]).toBe(1);
    expect(result.turnEndLogs).toContain("💥 レーンA: 反撃2");
    expect(result.turnEndLogs).toContain("🛠️ 整備士修復 +1");
  });
});
