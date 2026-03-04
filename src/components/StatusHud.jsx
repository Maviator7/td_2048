import { memo } from "react";

function formatLives(lives) {
  if (lives <= 0) {
    return "💀";
  }

  return "❤️".repeat(Math.min(lives, 5)) + (lives > 5 ? `+${lives - 5}` : "");
}

export const StatusHud = memo(function StatusHud({ lives, wave, score }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        background: "#16213e",
        borderRadius: 12,
        padding: "10px 16px",
        marginBottom: 10,
        border: "1px solid #2a2a4a",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 9, color: "#555" }}>LIVES</div>
        <div style={{ fontSize: 15, color: "#e74c3c" }}>{formatLives(lives)}</div>
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 9, color: "#555" }}>WAVE</div>
        <div style={{ fontSize: 26, fontWeight: "bold", color: "#f1c40f", lineHeight: 1.1 }}>{wave}</div>
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 9, color: "#555" }}>SCORE</div>
        <div style={{ fontSize: 15, color: "#2ecc71" }}>{score.toLocaleString()}</div>
      </div>
    </div>
  );
});
