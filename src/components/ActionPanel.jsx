import { memo } from "react";

import { GAME_PHASES } from "../game/config";

export const ActionPanel = memo(function ActionPanel({ phase, isDesktop }) {
  return (
    <div style={{ marginBottom: isDesktop ? 0 : 8 }}>
      {phase === GAME_PHASES.RESOLVING && (
        <div style={{ textAlign: "center", padding: "12px 0", color: "#e74c3c", fontSize: 15, fontWeight: "bold" }}>
          ⚔️ 攻撃解決中...
        </div>
      )}
    </div>
  );
});
