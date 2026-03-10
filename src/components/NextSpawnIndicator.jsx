import { memo, useEffect, useRef } from "react";
import { getMasterVolume, getSeVolume } from "../audio/settings";

export const NextSpawnIndicator = memo(function NextSpawnIndicator({ nextSpawnEnemy, laneColors, laneNames }) {
  const bossAlertSeRef = useRef(null);
  const lastAlertedBossIdRef = useRef(null);
  const isBossNext = Boolean(nextSpawnEnemy?.isBoss);
  const isFastNext = nextSpawnEnemy?.type === "fast";
  const isHealerNext = nextSpawnEnemy?.type === "healer";
  const isPoisonNext = nextSpawnEnemy?.type === "poison";
  const isSplitterNext = nextSpawnEnemy?.type === "splitter";
  const isSplitChildNext = nextSpawnEnemy?.type === "split_child";

  useEffect(() => {
    const audio = new Audio("/se/boss_alert.mp3");
    audio.preload = "auto";
    bossAlertSeRef.current = audio;

    return () => {
      audio.pause();
      bossAlertSeRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!isBossNext || !nextSpawnEnemy?.id) {
      return;
    }

    if (lastAlertedBossIdRef.current === nextSpawnEnemy.id) {
      return;
    }

    lastAlertedBossIdRef.current = nextSpawnEnemy.id;
    const audio = bossAlertSeRef.current;
    if (!audio) {
      return;
    }

    audio.volume = Math.min(1, Math.max(0, 0.7 * getMasterVolume() * getSeVolume()));
    audio.currentTime = 0;
    audio.play().catch(() => { });
  }, [isBossNext, nextSpawnEnemy?.id]);

  const nextLaneColor = nextSpawnEnemy ? laneColors[nextSpawnEnemy.lane] : "#1e2a3a";
  const typeAccentColor = isBossNext
    ? "#f1c40f"
    : isHealerNext
      ? "#f472b6"
      : isPoisonNext
        ? "#34d399"
      : isSplitterNext
        ? "#ff9f43"
        : isFastNext
          ? "#3ddcff"
          : isSplitChildNext
            ? "#ffd166"
            : nextLaneColor;
  const panelLabel = isBossNext
    ? "次の出現 (BOSS)"
    : isHealerNext
      ? "次の出現 (HEAL)"
      : isPoisonNext
        ? "次の出現 (POISON)"
      : isSplitterNext
        ? "次の出現 (SPLIT)"
        : isFastNext
          ? "次の出現 (FAST)"
          : isSplitChildNext
            ? "次の出現 (MINI)"
            : "次の出現列";
  const panelTypeTag = isBossNext
    ? "👑BOSS"
    : isHealerNext
      ? "💖HEAL"
      : isPoisonNext
        ? "POISON"
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
          : isHealerNext
            ? "linear-gradient(135deg, rgba(157, 23, 77, 0.62), rgba(13, 17, 23, 0.95))"
            : isPoisonNext
              ? "linear-gradient(135deg, rgba(6, 95, 70, 0.66), rgba(13, 17, 23, 0.95))"
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
      <span style={{ fontSize: 13, color: nextSpawnEnemy ? typeAccentColor : "#888", fontWeight: 800 }}>
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
              fontSize: 16,
              fontWeight: 800,
              color: typeAccentColor,
              textShadow: `0 0 10px ${typeAccentColor}66`,
            }}
          >
            レーン {laneNames[nextSpawnEnemy.lane]}{panelTypeTag ? `  ${panelTypeTag}` : ""}
          </span>
        </>
      ) : (
        <span style={{ fontSize: 14, color: "#64748b", fontWeight: 700 }}>待機中の敵なし</span>
      )}
    </div>
  );
});
