import { memo } from "react";

import { COLS } from "../game/constants";
import {
  canSelectRoleByTileValue,
  getAttackMultiplierForRow,
  getRowRole,
  getTileRoleIcon,
  ROW_ROLES,
} from "../game/config";
import { getEffectiveTileValue, getTileColors } from "../game/grid";
import { createTileSurfaceStyle, selectableTileHintStyle } from "./ui/styles";

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

function getRowBonusIcons(rowIndex) {
  const rowRole = getRowRole(rowIndex);

  if (rowRole === ROW_ROLES.FRONTLINE) {
    return "🔥";
  }

  if (rowRole === ROW_ROLES.MIDLINE) {
    return "⛨";
  }

  return "🔻💚";
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

function getDisplayedAttackValue(effectiveValue, rowIndex) {
  if (!effectiveValue) {
    return 0;
  }

  return Math.round(effectiveValue * getAttackMultiplierForRow(rowIndex));
}

export const TowerGrid = memo(function TowerGrid({
  grid,
  tileDamage,
  tileRoles,
  retaliationHits,
  repairHighlights,
  mergeHighlights,
  tileHeight,
  isDesktop,
  onTileClick,
  onAnyTileClick,
}) {
  const retaliationHitMap = new Map(retaliationHits.map((hit) => [hit.key, hit.damage]));
  const repairMap = new Map(repairHighlights.map((repair) => [repair.key, repair.repair]));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 8 }}>
      {grid.map((row, rowIndex) => (
        <div
          key={rowIndex}
          className={`row-floor ${getRowRoleClassName(rowIndex)}`}
          style={{
            position: "relative",
            borderRadius: 8,
            padding: 0,
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${COLS},1fr)`, gap: 4, position: "relative", zIndex: 2 }}>
            {row.map((value, columnIndex) => {
              const cellKey = `${rowIndex}-${columnIndex}`;
              const damage = tileDamage[rowIndex][columnIndex];
              const effectiveValue = getEffectiveTileValue(value, damage);
              const [background, color] = value ? getTileColors(value) : ["#1c1c2e", "#1c1c2e"];
              const isMerged = mergeHighlights.includes(cellKey);
              const retaliationDamage = retaliationHitMap.get(cellKey);
              const repairAmount = repairMap.get(cellKey);
              const tileRole = tileRoles[rowIndex][columnIndex];
              const tileRoleIcon = getTileRoleIcon(tileRole);
              const isDamaged = value > 0 && damage > 0;
              const tileLevel = getTileLevel(value);
              const displayedAttackValue = getDisplayedAttackValue(effectiveValue, rowIndex);
              const rowBonusIcons = getRowBonusIcons(rowIndex);
              const isRoleSelectable = canSelectRoleByTileValue(value) && !tileRole && Boolean(onTileClick);
              const isInteractive = isRoleSelectable || Boolean(onAnyTileClick);
              const tileClassName = [
                retaliationDamage ? "tile-retaliation-flash" : null,
                repairAmount ? "tile-repair-flash" : null,
              ].filter(Boolean).join(" ");

              return (
                <div
                  key={`${rowIndex}-${columnIndex}`}
                  className={tileClassName}
                  onClick={() => {
                    const originXPercent = ((columnIndex + 0.5) / COLS) * 100;
                    const originYPercent = ((rowIndex + 0.5) / grid.length) * 100;
                    onAnyTileClick?.({
                      row: rowIndex,
                      col: columnIndex,
                      value,
                      role: tileRole,
                      originXPercent,
                      originYPercent,
                    });
                    if (isRoleSelectable) {
                      onTileClick?.({
                        row: rowIndex,
                        col: columnIndex,
                        value,
                        role: tileRole,
                        originXPercent,
                        originYPercent,
                      });
                    }
                  }}
                  style={{
                    color: isDamaged && !isMerged ? "#2b2b2b" : color,
                    fontWeight: "bold",
                    fontSize: getTileFontSize(effectiveValue || value, isDesktop),
                    ...createTileSurfaceStyle({
                      background: value ? background : "#1c1c2e",
                      color: isDamaged && !isMerged ? "#2b2b2b" : color,
                      isMerged,
                      isDamaged,
                      retaliationDamage,
                      effectiveValue: value ? effectiveValue : 1,
                      isInteractive,
                      tileHeight,
                    }),
                  }}
                >
                  {isRoleSelectable && <div style={selectableTileHintStyle} />}
                  {tileLevel && (
                    <div
                      style={{
                        position: "absolute",
                        top: 3,
                        left: 4,
                        fontSize: isDesktop ? 12 : 11,
                        fontWeight: 800,
                        lineHeight: 1,
                        color: isDamaged && !isMerged ? "#6b2a2a" : "rgba(0, 0, 0, 0.62)",
                      }}
                    >
                      Lv.{tileLevel}
                    </div>
                  )}
                  {tileRoleIcon && (
                    <div
                      style={{
                        position: "absolute",
                        top: 3,
                        right: 4,
                        fontSize: isDesktop ? 12 : 11,
                        lineHeight: 1,
                        opacity: 0.9,
                        pointerEvents: "none",
                      }}
                    >
                      {tileRoleIcon}
                    </div>
                  )}
                  {value ? displayedAttackValue : ""}
                  {isDamaged && effectiveValue > 0 && (
                    <div style={{ fontSize: isDesktop ? 10 : 9, color: "#a94442", lineHeight: 1, fontWeight: 700 }}>
                      -{damage}
                    </div>
                  )}
                  {retaliationDamage && (
                    <div
                      style={{
                        position: "absolute",
                        bottom: 3,
                        right: 4,
                        fontSize: isDesktop ? 10 : 9,
                        fontWeight: 800,
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
                        fontSize: isDesktop ? 10 : 9,
                        fontWeight: 800,
                        color: "#1e8449",
                        lineHeight: 1,
                      }}
                    >
                      +{repairAmount}
                    </div>
                  )}
                  <div
                    style={{
                      position: "absolute",
                      bottom: retaliationDamage ? 16 : 3,
                      right: 4,
                      fontSize: isDesktop ? 14 : 13,
                      lineHeight: 1,
                      opacity: 0.72,
                      pointerEvents: "none",
                    }}
                  >
                    {rowBonusIcons}
                  </div>
                  {isRoleSelectable && (
                    <div
                      style={{
                        position: "absolute",
                        bottom: 4,
                        left: 4,
                        padding: "2px 5px",
                        borderRadius: 999,
                        background: "rgba(15, 23, 42, 0.74)",
                        color: "#e2e8f0",
                        fontSize: isDesktop ? 9 : 8,
                        fontWeight: 800,
                        lineHeight: 1,
                        letterSpacing: 0.4,
                      }}
                    >
                      ROLE
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
});
