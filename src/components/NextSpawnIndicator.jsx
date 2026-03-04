export function NextSpawnIndicator({ nextSpawnEnemy, laneColors, laneNames }) {
  const isBossNext = Boolean(nextSpawnEnemy?.isBoss);
  const nextLaneColor = nextSpawnEnemy ? laneColors[nextSpawnEnemy.lane] : "#1e2a3a";

  return (
    <div
      className={nextSpawnEnemy ? "next-spawn-panel" : undefined}
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: 8,
        marginBottom: 10,
        padding: "8px 10px",
        background: isBossNext
          ? "linear-gradient(135deg, rgba(76, 44, 121, 0.7), rgba(13, 17, 23, 0.95))"
          : "#0d1117",
        border: isBossNext ? "1px solid #f1c40f" : "1px solid #1e2a3a",
        borderRadius: 10,
        ...(nextSpawnEnemy ? { "--next-glow-color": nextLaneColor } : {}),
      }}
    >
      <span style={{ fontSize: 11, color: isBossNext ? "#ffe08a" : "#888" }}>
        {isBossNext ? "次の出現 (BOSS)" : "次の出現列"}
      </span>
      {nextSpawnEnemy ? (
        <>
          <div
            className="next-spawn-dot"
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: nextLaneColor,
              boxShadow: `0 0 10px ${nextLaneColor}88`,
            }}
          />
          <span
            style={{
              fontSize: 14,
              fontWeight: "bold",
              color: nextLaneColor,
              textShadow: `0 0 10px ${nextLaneColor}66`,
            }}
          >
            レーン {laneNames[nextSpawnEnemy.lane]}{isBossNext ? "  👑BOSS" : ""}
          </span>
        </>
      ) : (
        <span style={{ fontSize: 12, color: "#555" }}>待機中の敵なし</span>
      )}
    </div>
  );
}
