import { TILE_ROLE_ORDER } from "../../game/config";
import { addRandomTile, createEmptyDamageGrid, createEmptyGrid, createEmptyRoleGrid } from "../../game/grid";

export function createInitialGrid() {
  const emptyGrid = createEmptyGrid();
  const emptyDamage = createEmptyDamageGrid();
  const emptyRoles = createEmptyRoleGrid();
  const firstTile = addRandomTile(emptyGrid, emptyDamage, emptyRoles);
  return addRandomTile(firstTile.grid, firstTile.tileDamage, firstTile.tileRoles);
}

export function createRoleMetricsState() {
  return Object.fromEntries(
    TILE_ROLE_ORDER.map((roleKey) => [roleKey, { dealt: 0, taken: 0, repair: 0 }]),
  );
}

export function buildRoleMetricDeltaFromAmountMap(amountMap, metricKey) {
  const delta = {};
  Object.entries(amountMap ?? {}).forEach(([roleKey, amount]) => {
    if (!amount) {
      return;
    }

    delta[roleKey] = {
      dealt: 0,
      taken: 0,
      repair: 0,
      [metricKey]: amount,
    };
  });
  return delta;
}

export function buildRoleMetricDeltaFromCells(cells, metricKey, fallbackRolesGrid) {
  const delta = {};
  (cells ?? []).forEach((cell) => {
    const roleKey = cell.role ?? fallbackRolesGrid?.[cell.row]?.[cell.col] ?? null;
    if (!roleKey) {
      return;
    }

    const amount = cell[metricKey] ?? 0;
    if (!amount) {
      return;
    }

    if (!delta[roleKey]) {
      delta[roleKey] = { dealt: 0, taken: 0, repair: 0 };
    }
    delta[roleKey][metricKey] += amount;
  });
  return delta;
}
