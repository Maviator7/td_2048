import { COLS } from "../game/constants";
import { getTileColors } from "../game/grid";

function getTileFontSize(value, isDesktop) {
  if (isDesktop) {
    if (value >= 1024) {
      return 16;
    }
    if (value >= 128) {
      return 19;
    }
    return 22;
  }

  if (value >= 1024) {
    return 13;
  }
  if (value >= 128) {
    return 15;
  }
  return 18;
}

export function TowerGrid({ grid, mergeHighlights, attackColumns, tileHeight, isDesktop }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${COLS},1fr)`, gap: 4, marginBottom: 8 }}>
      {grid.map((row, rowIndex) => row.map((value, columnIndex) => {
        const [background, color] = value ? getTileColors(value) : ["#1c1c2e", "#1c1c2e"];
        const isMerged = mergeHighlights.includes(`${rowIndex}-${columnIndex}`);
        const isAttacking = attackColumns.includes(columnIndex) && value > 0;

        return (
          <div
            key={`${rowIndex}-${columnIndex}`}
            style={{
              background: isAttacking ? "#fffbe6" : isMerged ? "#fff3b0" : background,
              color,
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: tileHeight,
              fontWeight: "bold",
              fontSize: getTileFontSize(value, isDesktop),
              boxShadow: value ? `0 3px 8px ${background}88` : "none",
              border: isMerged || isAttacking ? "2px solid #f1c40f" : "2px solid transparent",
              transition: "all 0.15s",
              transform: isMerged ? "scale(1.08)" : "scale(1)",
            }}
          >
            {value || ""}
          </div>
        );
      }))}
    </div>
  );
}
