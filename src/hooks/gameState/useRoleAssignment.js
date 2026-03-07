import { useCallback } from "react";

import { canSelectRoleByTileValue, getTileRoleDef } from "../../game/config";

export function useRoleAssignment({ setBoardState, pushLog }) {
  const setTileRoleAt = useCallback((row, col, nextRole) => {
    setBoardState((currentState) => {
      const tileValue = currentState.grid[row]?.[col] ?? 0;
      if (!canSelectRoleByTileValue(tileValue)) {
        return currentState;
      }
      if (currentState.tileRoles[row][col]) {
        return currentState;
      }
      if (!nextRole) {
        return currentState;
      }

      const currentRole = currentState.tileRoles[row][col] ?? null;
      if (currentRole === (nextRole ?? null)) {
        return currentState;
      }

      const nextTileRoles = currentState.tileRoles.map((roleRow) => [...roleRow]);
      nextTileRoles[row][col] = nextRole ?? null;
      return {
        ...currentState,
        tileRoles: nextTileRoles,
      };
    });

    const roleLabel = getTileRoleDef(nextRole)?.label ?? "役職";
    pushLog(`🎖️ ${roleLabel} を配置`);
  }, [pushLog, setBoardState]);

  return { setTileRoleAt };
}
