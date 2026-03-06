import { memo } from "react";

import { GAME_PHASES } from "../game/config";

function createButtonStyle(color, disabled) {
  return {
    background: disabled ? "#1a1a2e" : color,
    color: disabled ? "#333" : "#fff",
    border: "none",
    borderRadius: 10,
    padding: "10px 0",
    fontSize: 20,
    fontWeight: "bold",
    cursor: disabled ? "default" : "pointer",
    width: "100%",
    transition: "all 0.1s",
    boxShadow: disabled ? "none" : `0 4px 12px ${color}66`,
  };
}

export const ActionPanel = memo(function ActionPanel({ phase, isDesktop, score, onRestart, onBackToTitle }) {
  return (
    <div style={{ marginBottom: isDesktop ? 0 : 8 }}>
      {phase === GAME_PHASES.RESOLVING && (
        <div style={{ textAlign: "center", padding: "12px 0", color: "#e74c3c", fontSize: 15, fontWeight: "bold" }}>
          ⚔️ 攻撃解決中...
        </div>
      )}
      {phase === GAME_PHASES.GAMEOVER && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.58)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            zIndex: 1100,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 360,
              background: "#0f172a",
              border: "1px solid #334155",
              borderRadius: 14,
              padding: "14px 12px 12px",
              boxShadow: "0 16px 40px rgba(0,0,0,0.45)",
            }}
          >
            <div style={{ textAlign: "center", color: "#e74c3c", fontSize: 22, fontWeight: "bold", marginBottom: 6 }}>
              💀 GAME OVER
            </div>
            <div style={{ textAlign: "center", color: "#94a3b8", fontSize: 13, marginBottom: 10 }}>
              最終スコア: <span style={{ color: "#f1c40f", fontWeight: "bold" }}>{score.toLocaleString()}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8 }}>
              <button
                onClick={onRestart}
                style={{ ...createButtonStyle("#3498db", false), width: "100%", fontSize: 15, padding: "12px 0" }}
              >
                🔄 もう一度プレイ
              </button>
              <button
                onClick={onBackToTitle}
                style={{ ...createButtonStyle("#7c3aed", false), width: "100%", fontSize: 14, padding: "10px 0" }}
              >
                🏠 タイトルに戻る
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
