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

export function ActionPanel({ phase, isDesktop, score, onRestart }) {
  return (
    <div style={{ marginBottom: isDesktop ? 0 : 8 }}>
      {phase === GAME_PHASES.RESOLVING && (
        <div style={{ textAlign: "center", padding: "12px 0", color: "#e74c3c", fontSize: 15, fontWeight: "bold" }}>
          ⚔️ 攻撃解決中...
        </div>
      )}
      {phase === GAME_PHASES.GAMEOVER && (
        <div>
          <div style={{ textAlign: "center", color: "#e74c3c", fontSize: 20, fontWeight: "bold", marginBottom: 6 }}>
            💀 GAME OVER
          </div>
          <div style={{ textAlign: "center", color: "#888", fontSize: 13, marginBottom: 8 }}>
            最終スコア: <span style={{ color: "#f1c40f" }}>{score.toLocaleString()}</span>
          </div>
          <button
            onClick={onRestart}
            style={{ ...createButtonStyle("#3498db", false), width: "100%", fontSize: 15, padding: "12px 0" }}
          >
            🔄 もう一度プレイ
          </button>
        </div>
      )}
    </div>
  );
}
