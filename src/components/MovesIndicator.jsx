export function MovesIndicator({ movesLeft, totalMoves, isResolving }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 8, alignItems: "center" }}>
      <span style={{ fontSize: 11, color: "#888" }}>残り手数：</span>
      {Array.from({ length: totalMoves }).map((_, index) => {
        const isActive = index < movesLeft;
        return (
          <div
            key={index}
            style={{
              width: 22,
              height: 22,
              borderRadius: 6,
              background: isActive ? "#f1c40f" : "#1e2a3a",
              border: `2px solid ${isActive ? "#f1c40f" : "#2a3a4a"}`,
              transition: "all 0.2s",
              boxShadow: isActive ? "0 0 8px #f1c40f88" : "none",
            }}
          />
        );
      })}
      {isResolving && <span style={{ fontSize: 11, color: "#e74c3c", marginLeft: 4 }}>⚔️ 攻撃中...</span>}
    </div>
  );
}
