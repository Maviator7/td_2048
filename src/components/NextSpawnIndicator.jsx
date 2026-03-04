export function NextSpawnIndicator({ nextSpawnEnemy, laneColors, laneNames }) {
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
        background: "#0d1117",
        border: "1px solid #1e2a3a",
        borderRadius: 10,
        ...(nextSpawnEnemy ? { "--next-glow-color": laneColors[nextSpawnEnemy.lane] } : {}),
      }}
    >
      <span style={{ fontSize: 11, color: "#888" }}>次の出現列</span>
      {nextSpawnEnemy ? (
        <>
          <div
            className="next-spawn-dot"
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: laneColors[nextSpawnEnemy.lane],
              boxShadow: `0 0 10px ${laneColors[nextSpawnEnemy.lane]}88`,
            }}
          />
          <span
            style={{
              fontSize: 14,
              fontWeight: "bold",
              color: laneColors[nextSpawnEnemy.lane],
              textShadow: `0 0 10px ${laneColors[nextSpawnEnemy.lane]}66`,
            }}
          >
            レーン {laneNames[nextSpawnEnemy.lane]}
          </span>
        </>
      ) : (
        <span style={{ fontSize: 12, color: "#555" }}>待機中の敵なし</span>
      )}
    </div>
  );
}
