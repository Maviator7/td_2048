import { describe, expect, test } from "vitest";

import { TILE_ROLES } from "./config";
import { canMove, createEmptyDamageGrid, createEmptyGrid, createEmptyRoleGrid, slideGrid } from "./grid";

describe("canMove", () => {
  test("returns false when board is full and same-value neighbors cannot merge due to role mismatch", () => {
    const grid = createEmptyGrid();
    const tileDamage = createEmptyDamageGrid();
    const tileRoles = createEmptyRoleGrid();
    let seedValue = 10;

    for (let rowIndex = 0; rowIndex < grid.length; rowIndex += 1) {
      for (let colIndex = 0; colIndex < grid[rowIndex].length; colIndex += 1) {
        grid[rowIndex][colIndex] = seedValue;
        seedValue += 1;
        tileRoles[rowIndex][colIndex] = TILE_ROLES.SUPPRESSOR;
      }
    }

    // Create a same-value neighbor pair with different roles. Raw value match exists,
    // but merge should still be blocked by role mismatch.
    grid[0][0] = 999;
    grid[0][1] = 999;
    tileRoles[0][0] = TILE_ROLES.SUPPRESSOR;
    tileRoles[0][1] = TILE_ROLES.ENGINEER;

    const byDirection = ["left", "right", "up", "down"].map((direction) => ({
      direction,
      moved: slideGrid(grid, tileDamage, tileRoles, direction).moved,
    }));
    expect(byDirection).toEqual([
      { direction: "left", moved: false },
      { direction: "right", moved: false },
      { direction: "up", moved: false },
      { direction: "down", moved: false },
    ]);
    expect(canMove(grid, tileDamage, tileRoles)).toBe(false);
  });

  test("returns true when an empty cell exists", () => {
    const grid = createEmptyGrid();
    const tileDamage = createEmptyDamageGrid();
    const tileRoles = createEmptyRoleGrid();

    grid[0][0] = 2;
    grid[0][1] = 4;

    expect(canMove(grid, tileDamage, tileRoles)).toBe(true);
  });
});
