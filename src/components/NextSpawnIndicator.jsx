import { memo } from "react";

export const NextSpawnIndicator = memo(function NextSpawnIndicator({ nextSpawnEnemy, laneColors, laneNames }) {
  const isBossNext = Boolean(nextSpawnEnemy?.isBoss);
  const isFastNext = nextSpawnEnemy?.type === "fast";
  const isSplitterNext = nextSpawnEnemy?.type === "splitter";
  const isSplitChildNext = nextSpawnEnemy?.type === "split_child";
  const nextLaneColor = nextSpawnEnemy ? laneColors[nextSpawnEnemy.lane] : "#1e2a3a";
  const typeAccentColor = isBossNext
    ? "#f1c40f"
    : isSplitterNext
      ? "#ff9f43"
      : isFastNext
        ? "#3ddcff"
        : isSplitChildNext
          ? "#ffd166"
          : nextLaneColor;
  const panelLabel = isBossNext
    ? "次の出現 (BOSS)"
    : isSplitterNext
      ? "次の出現 (SPLIT)"
      : isFastNext
        ? "次の出現 (FAST)"
        : isSplitChildNext
          ? "次の出現 (MINI)"
          : "次の出現列";
  const panelTypeTag = isBossNext
    ? "👑BOSS"
    : isSplitterNext
      ? "🧬SPLIT"
      : isFastNext
        ? "⚡FAST"
        : isSplitChildNext
          ? "✳️MINI"
          : "";

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
          : isSplitterNext
            ? "linear-gradient(135deg, rgba(120, 64, 18, 0.68), rgba(13, 17, 23, 0.95))"
          : isFastNext
            ? "linear-gradient(135deg, rgba(15, 83, 108, 0.62), rgba(13, 17, 23, 0.95))"
          : "#0d1117",
        border: nextSpawnEnemy ? `1px solid ${typeAccentColor}` : "1px solid #1e2a3a",
        borderRadius: 10,
        ...(nextSpawnEnemy ? { "--next-glow-color": typeAccentColor } : {}),
      }}
    >
      <span style={{ fontSize: 11, color: nextSpawnEnemy ? typeAccentColor : "#888" }}>
        {panelLabel}
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
              color: typeAccentColor,
              textShadow: `0 0 10px ${typeAccentColor}66`,
            }}
          >
            レーン {laneNames[nextSpawnEnemy.lane]}{panelTypeTag ? `  ${panelTypeTag}` : ""}
          </span>
        </>
      ) : (
        <span style={{ fontSize: 12, color: "#555" }}>待機中の敵なし</span>
      )}
    </div>
  );
});
