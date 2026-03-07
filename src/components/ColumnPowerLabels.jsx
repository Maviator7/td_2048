import { COLS } from "../game/constants";

export function ColumnPowerLabels({ columnPowers, nextSpawnEnemy, isDesktop, laneColors, laneNames }) {
  return (
    <div style={{ display: "flex", gap: 4, marginBottom: 3 }}>
      {Array.from({ length: COLS }).map((_, columnIndex) => {
        const isNextSpawnLane = nextSpawnEnemy?.lane === columnIndex;

        return (
          <div
            key={columnIndex}
            style={{
              flex: 1,
              textAlign: "center",
              fontSize: isDesktop ? 13 : 12,
              color: laneColors[columnIndex],
              fontWeight: 800,
              borderRadius: 999,
              padding: "3px 0",
              background: isNextSpawnLane ? `${laneColors[columnIndex]}22` : "transparent",
              boxShadow: isNextSpawnLane ? `0 0 12px ${laneColors[columnIndex]}33` : "none",
              textShadow: isNextSpawnLane ? `0 0 8px ${laneColors[columnIndex]}66` : "none",
              transition: "all 0.2s",
            }}
          >
            {laneNames[columnIndex]} 💥 {columnPowers[columnIndex]}
            {isNextSpawnLane ? "  NEXT" : ""}
          </div>
        );
      })}
    </div>
  );
}
