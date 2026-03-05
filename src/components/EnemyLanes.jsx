import { memo } from "react";

import { COLS, ENEMY_MAX_STEPS } from "../game/constants";

function ShotTrace({ trace }) {
  return (
    <div
      className={trace.blocked ? "shot-trace shot-trace-blocked" : "shot-trace"}
      style={{
        position: "absolute",
        top: `${trace.top + 10}%`,
        bottom: 6,
        left: "50%",
        width: trace.width,
        transform: "translateX(-50%)",
        borderRadius: 999,
        background: trace.color,
        opacity: trace.blocked ? 0.7 : 0.9,
        zIndex: 5,
        pointerEvents: "none",
        animationDelay: `${trace.delayMs}ms`,
      }}
    />
  );
}

function DamageBurst({ burst }) {
  return (
    <div
      className="damage-burst"
      style={{
        position: "absolute",
        top: `${burst.top}%`,
        left: "50%",
        transform: "translate(-50%, -50%)",
        color: "#ffe082",
        fontSize: burst.fontSize,
        fontWeight: "bold",
        zIndex: 6,
        pointerEvents: "none",
        animationDelay: `${burst.delayMs}ms`,
      }}
    >
      -{burst.damage}
    </div>
  );
}

function LaneEnemy({ enemy, laneColor, hitEffect }) {
  const top = Math.min(1, enemy.step / ENEMY_MAX_STEPS) * 72;
  const hpRatio = enemy.hp / enemy.maxHp;
  const isHit = Boolean(hitEffect);
  const isFast = enemy.type === "fast";
  const size = enemy.isBoss ? 36 : isFast ? 28 : 30;

  return (
    <div
      style={{
        position: "absolute",
        top: `${top}%`,
        left: "50%",
        transform: "translateX(-50%)",
        width: enemy.isBoss ? 42 : isFast ? 38 : 34,
        transition: "top 0.35s ease",
      }}
    >
      {enemy.isBoss && (
        <div
          style={{
            position: "absolute",
            top: -11,
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: 11,
            zIndex: 8,
          }}
        >
          👑
        </div>
      )}
      {isFast && (
        <div
          style={{
            position: "absolute",
            top: -9,
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: 10,
            zIndex: 8,
          }}
        >
          ⚡
        </div>
      )}
      <div
        className={`${isHit ? "enemy-hit-flash " : ""}${isFast ? "fast-enemy-core" : ""}`.trim()}
        style={{
          width: size,
          height: size,
          margin: "0 auto",
          borderRadius: enemy.isBoss ? 6 : isFast ? 4 : "50%",
          clipPath: isFast ? "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" : "none",
          background: enemy.isBoss
            ? "radial-gradient(circle at 30% 30%, #b37feb 0%, #8e44ad 45%, #4a235a 100%)"
            : isFast
              ? "linear-gradient(145deg, #22d3ee 0%, #0ea5b7 55%, #0b6170 100%)"
            : laneColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: enemy.isBoss ? 10 : isFast ? 8 : 9,
          color: "#fff",
          fontWeight: "bold",
          border: enemy.armor
            ? "2px solid #f1c40f"
            : isFast
              ? "2px solid #7ce7ff"
              : "2px solid transparent",
          opacity: isHit ? 0.82 : 1,
          animationDelay: isHit ? `${hitEffect.delayMs}ms` : undefined,
        }}
      >
        {enemy.hp}
      </div>
      <div style={{ height: 3, background: "#222", borderRadius: 2, marginTop: 1 }}>
        <div
          style={{
            width: `${hpRatio * 100}%`,
            height: "100%",
            background: hpRatio > 0.5 ? "#2ecc71" : hpRatio > 0.25 ? "#f39c12" : "#e74c3c",
            borderRadius: 2,
            transition: "width 0.2s",
          }}
        />
      </div>
      {enemy.armor > 0 && <div style={{ fontSize: 7, color: "#f1c40f", textAlign: "center" }}>🛡{enemy.armor}</div>}
    </div>
  );
}

function buildLaneRenderData(enemies, hitEffects, damageBursts, shotTraces) {
  const laneEnemies = Array.from({ length: COLS }, () => []);
  const queuedCounts = Array(COLS).fill(0);
  const queuedBossFlags = Array(COLS).fill(false);
  const queuedFastFlags = Array(COLS).fill(false);
  const hitEffectByEnemyId = new Map();
  const burstsByLane = Array.from({ length: COLS }, () => []);
  const tracesByLane = Array.from({ length: COLS }, () => []);

  for (const enemy of enemies) {
    if (enemy.step > 0) {
      laneEnemies[enemy.lane].push(enemy);
    } else {
      queuedCounts[enemy.lane] += 1;
      if (enemy.isBoss) {
        queuedBossFlags[enemy.lane] = true;
      }
      if (enemy.type === "fast") {
        queuedFastFlags[enemy.lane] = true;
      }
    }
  }

  for (const lane of laneEnemies) {
    lane.sort((left, right) => right.step - left.step);
  }

  for (const hitEffect of hitEffects) {
    if (!hitEffectByEnemyId.has(hitEffect.targetId)) {
      hitEffectByEnemyId.set(hitEffect.targetId, hitEffect);
    }
  }

  for (const burst of damageBursts) {
    burstsByLane[burst.lane].push(burst);
  }

  for (const trace of shotTraces) {
    tracesByLane[trace.lane].push(trace);
  }

  return {
    laneEnemies,
    queuedCounts,
    queuedBossFlags,
    queuedFastFlags,
    hitEffectByEnemyId,
    burstsByLane,
    tracesByLane,
  };
}

function EnemyLane({
  laneIndex,
  atkCols,
  retaliationCols,
  nextSpawnEnemy,
  damageByLane,
  laneColors,
  laneEnemies,
  queuedCount,
  hasQueuedBoss,
  hasQueuedFast,
  hitEffectByEnemyId,
  laneBursts,
  laneTraces,
}) {
  const isAttacking = atkCols.includes(laneIndex);
  const isCounterAttacking = retaliationCols.includes(laneIndex);
  const isNextSpawnLane = nextSpawnEnemy?.lane === laneIndex;
  const laneColor = laneColors[laneIndex];

  return (
    <div
      className={isNextSpawnLane ? "next-lane-pulse" : undefined}
      style={{
        flex: 1,
        position: "relative",
        background: isAttacking ? "#1a1000" : isNextSpawnLane ? `${laneColor}14` : "#0d1117",
        border: `2px solid ${isAttacking ? "#f1c40f" : isNextSpawnLane ? laneColor : `${laneColor}44`}`,
        borderRadius: 8,
        overflow: "hidden",
        transition: "all 0.2s",
        ...(isNextSpawnLane ? { "--next-glow-color": laneColor } : {}),
      }}
    >
      {isNextSpawnLane && (
        <div
          style={{
            position: "absolute",
            top: 4,
            right: 4,
            padding: "2px 5px",
            borderRadius: 999,
            fontSize: 8,
            fontWeight: "bold",
            letterSpacing: 0.6,
            color: "#fff",
            background: laneColor,
            zIndex: 4,
          }}
        >
          NEXT
        </div>
      )}
      {isNextSpawnLane && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(180deg, ${laneColor}14 0%, transparent 42%, ${laneColor}12 100%)`,
            zIndex: 1,
            pointerEvents: "none",
          }}
        />
      )}
      {isAttacking && <div style={{ position: "absolute", inset: 0, background: `${laneColor}18`, zIndex: 2 }} />}
      {isCounterAttacking && (
        <div
          className="retaliation-lane-flash"
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(231, 76, 60, 0.14)",
            zIndex: 3,
            pointerEvents: "none",
          }}
        />
      )}
      {laneTraces.map((trace) => <ShotTrace key={trace.key} trace={trace} />)}
      {damageByLane[laneIndex] && (
        <div
          style={{
            position: "absolute",
            top: 4,
            left: "50%",
            transform: "translateX(-50%)",
            color: "#ffd54f",
            fontSize: 12,
            fontWeight: "bold",
            zIndex: 3,
          }}
        >
          -{damageByLane[laneIndex]}
        </div>
      )}
      {laneBursts.map((burst) => <DamageBurst key={burst.key} burst={burst} />)}
      {laneEnemies.map((enemy) => (
        <LaneEnemy
          key={enemy.id}
          enemy={enemy}
          laneColor={laneColor}
          hitEffect={hitEffectByEnemyId.get(enemy.id)}
        />
      ))}
      {queuedCount > 0 && (
        <div
          style={{
            position: "absolute",
            bottom: 3,
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: 9,
            color: "#444",
          }}
        >
          +{queuedCount}待機{hasQueuedBoss ? " 👑" : ""}{hasQueuedFast ? " ⚡" : ""}
        </div>
      )}
      {isCounterAttacking && (
        <div
          style={{
            position: "absolute",
            bottom: 4,
            right: 4,
            padding: "2px 4px",
            borderRadius: 999,
            fontSize: 7,
            fontWeight: "bold",
            color: "#fff",
            background: "rgba(231, 76, 60, 0.78)",
            zIndex: 8,
          }}
        >
          HIT
        </div>
      )}
    </div>
  );
}

export const EnemyLanes = memo(function EnemyLanes({
  enemies,
  atkCols,
  retaliationCols,
  nextSpawnEnemy,
  hitEffects,
  damageByLane,
  damageBursts,
  shotTraces,
  laneHeight,
  laneColors,
}) {
  const laneRenderData = buildLaneRenderData(enemies, hitEffects, damageBursts, shotTraces);

  return (
    <div style={{ display: "flex", gap: 4, height: laneHeight, marginBottom: 6 }}>
      {Array.from({ length: COLS }).map((_, laneIndex) => (
        <EnemyLane
          key={laneIndex}
          laneIndex={laneIndex}
          atkCols={atkCols}
          retaliationCols={retaliationCols}
          nextSpawnEnemy={nextSpawnEnemy}
          damageByLane={damageByLane}
          laneColors={laneColors}
          laneEnemies={laneRenderData.laneEnemies[laneIndex]}
          queuedCount={laneRenderData.queuedCounts[laneIndex]}
          hasQueuedBoss={laneRenderData.queuedBossFlags[laneIndex]}
          hasQueuedFast={laneRenderData.queuedFastFlags[laneIndex]}
          hitEffectByEnemyId={laneRenderData.hitEffectByEnemyId}
          laneBursts={laneRenderData.burstsByLane[laneIndex]}
          laneTraces={laneRenderData.tracesByLane[laneIndex]}
        />
      ))}
    </div>
  );
});
