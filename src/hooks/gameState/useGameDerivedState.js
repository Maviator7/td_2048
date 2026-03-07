import { useMemo } from "react";

import { getNextSpawnEnemy } from "../../game/enemies";
import { getColumnPowers } from "../../game/grid";

export function useGameDerivedState({ grid, tileDamage, enemies }) {
  const colPower = useMemo(() => getColumnPowers(grid, tileDamage), [grid, tileDamage]);
  const nextSpawnEnemy = useMemo(() => getNextSpawnEnemy(enemies), [enemies]);

  return {
    colPower,
    nextSpawnEnemy,
  };
}
