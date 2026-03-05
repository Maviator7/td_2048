import { memo } from "react";

import { COLS } from "../game/constants";
import { getRowRole, ROW_ROLES } from "../game/config";
import { getEffectiveTileValue, getTileColors } from "../game/grid";

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

function getTileLevel(value) {
  if (!value) {
    return null;
  }

  return Math.log2(value);
}

function getRowBonusLabel(rowIndex) {
  const rowRole = getRowRole(rowIndex);

  if (rowRole === ROW_ROLES.FRONTLINE) {
    return "前衛 ATK+";
  }

  if (rowRole === ROW_ROLES.MIDLINE) {
    return "中衛 DEF+";
  }

  return "後衛 回復+";
}

function getRowRoleClassName(rowIndex) {
  const rowRole = getRowRole(rowIndex);

  if (rowRole === ROW_ROLES.FRONTLINE) {
    return "tile-row-frontline";
  }

  if (rowRole === ROW_ROLES.MIDLINE) {
    return "tile-row-midline";
  }

  return "tile-row-backline";
}

export const TowerGrid = memo(function TowerGrid({
  grid,
  tileDamage,
  retaliationHits,
  repairHighlights,
  mergeHighlights,
  tileHeight,
  isDesktop,
}) {
  const retaliationHitMap = new Map(retaliationHits.map((hit) => [hit.key, hit.damage]));
  const repairMap = new Map(repairHighlights.map((repair) => [repair.key, repair.repair]));

  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${COLS},1fr)`, gap: 4, marginBottom: 8 }}>
      {grid.map((row, rowIndex) => row.map((value, columnIndex) => {
        const cellKey = `${rowIndex}-${columnIndex}`;
        const damage = tileDamage[rowIndex][columnIndex];
        const effectiveValue = getEffectiveTileValue(value, damage);
        const [background, color] = value ? getTileColors(value) : ["#1c1c2e", "#1c1c2e"];
        const isMerged = mergeHighlights.includes(cellKey);
        const retaliationDamage = retaliationHitMap.get(cellKey);
        const repairAmount = repairMap.get(cellKey);
        const isDamaged = value > 0 && damage > 0;
        const tileLevel = getTileLevel(value);
        const rowRoleClassName = getRowRoleClassName(rowIndex);
        const rowBonusLabel = columnIndex === 0 ? getRowBonusLabel(rowIndex) : null;
        const tileClassName = [
          rowRoleClassName,
          retaliationDamage ? "tile-retaliation-flash" : null,
          repairAmount ? "tile-repair-flash" : null,
        ].filter(Boolean).join(" ");

        return (
          <div
            key={`${rowIndex}-${columnIndex}`}
            className={tileClassName}
            style={{
              background: isMerged ? "#fff3b0" : background,
              color: isDamaged && !isMerged ? "#2b2b2b" : color,
              borderRadius: 8,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              height: tileHeight,
              fontWeight: "bold",
              fontSize: getTileFontSize(effectiveValue || value, isDesktop),
              boxShadow: value ? `0 3px 8px ${background}66` : "none",
              border: retaliationDamage
                ? "2px solid rgba(231, 76, 60, 0.7)"
                : isMerged
                  ? "2px solid #f1c40f"
                  : isDamaged
                    ? "2px solid rgba(231, 76, 60, 0.4)"
                    : "2px solid transparent",
              transition: "all 0.15s",
              transform: isMerged ? "scale(1.08)" : "scale(1)",
              opacity: value && !effectiveValue ? 0.5 : 1,
              animationDelay: retaliationDamage ? "40ms" : undefined,
            }}
          >
            {rowBonusLabel && (
              <div
                className="row-bonus-badge"
                style={{
                  position: "absolute",
                  top: 2,
                  right: 4,
                  fontSize: isDesktop ? 8 : 7,
                  fontWeight: 800,
                  lineHeight: 1,
                  letterSpacing: 0.2,
                  color: "rgba(0, 0, 0, 0.58)",
                }}
              >
                {rowBonusLabel}
              </div>
            )}
            {tileLevel && (
              <div
                style={{
                  position: "absolute",
                  top: 3,
                  left: 4,
                  fontSize: isDesktop ? 11 : 10,
                  fontWeight: "700",
                  lineHeight: 1,
                  color: isDamaged && !isMerged ? "#6b2a2a" : "rgba(0, 0, 0, 0.62)",
                }}
              >
                Lv.{tileLevel}
              </div>
            )}
            {value ? effectiveValue : ""}
            {isDamaged && effectiveValue > 0 && (
              <div style={{ fontSize: isDesktop ? 9 : 8, color: "#a94442", lineHeight: 1 }}>
                -{damage}
              </div>
            )}
            {retaliationDamage && (
              <div
                style={{
                  position: "absolute",
                  bottom: 3,
                  right: 4,
                  fontSize: isDesktop ? 9 : 8,
                  fontWeight: "700",
                  color: "#c0392b",
                  lineHeight: 1,
                }}
              >
                HIT {retaliationDamage}
              </div>
            )}
            {repairAmount && (
              <div
                style={{
                  position: "absolute",
                  bottom: 3,
                  left: 4,
                  fontSize: isDesktop ? 9 : 8,
                  fontWeight: "700",
                  color: "#1e8449",
                  lineHeight: 1,
                }}
              >
                +{repairAmount}
              </div>
            )}
          </div>
        );
      }))}
    </div>
  );
});
