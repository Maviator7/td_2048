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

function ChainTrace({ trace }) {
  const top = Math.min(trace.fromTop, trace.toTop);
  const height = Math.max(6, Math.abs(trace.toTop - trace.fromTop));
  const tilt = trace.toTop >= trace.fromTop ? 6 : -6;

  return (
    <div
      className="chain-trace"
      style={{
        position: "absolute",
        top: `${top}%`,
        left: "50%",
        width: 2,
        height: `${height}%`,
        transform: `translateX(-50%) rotate(${tilt}deg)`,
        transformOrigin: "center top",
        borderRadius: 999,
        background: "linear-gradient(180deg, #d6f4ff 0%, #7ce7ff 55%, #38bdf8 100%)",
        boxShadow: "0 0 8px rgba(124, 231, 255, 0.65)",
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
  const xOffset = enemy.laneOffsetPx ?? 0;
  const hpRatio = enemy.hp / enemy.maxHp;
  const isHit = Boolean(hitEffect);
  const isFast = enemy.type === "fast";
  const isHealer = enemy.type === "healer";
  const isPoison = enemy.type === "poison";
  const isSplitter = enemy.type === "splitter";
  const isSplitChild = enemy.type === "split_child";
  const isSlowed = (enemy.slowTurns ?? 0) > 0;
  const size = enemy.isBoss ? 36 : isSplitter ? 33 : isPoison ? 32 : isHealer ? 32 : isFast ? 28 : isSplitChild ? 21 : 30;

  return (
    <div
      style={{
        position: "absolute",
        top: `${top}%`,
        left: "50%",
        transform: `translateX(calc(-50% + ${xOffset}px))`,
        width: enemy.isBoss ? 42 : isSplitter ? 40 : isPoison ? 38 : isFast ? 38 : isSplitChild ? 30 : 34,
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
      {isHealer && (
        <div
          style={{
            position: "absolute",
            top: -10,
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: 10,
            zIndex: 8,
          }}
        >
          💖
        </div>
      )}
      {isSplitter && (
        <div
          style={{
            position: "absolute",
            top: -11,
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: 10,
            zIndex: 8,
          }}
        >
          🧬
        </div>
      )}
      {isSplitChild && (
        <div
          style={{
            position: "absolute",
            top: -8,
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: 9,
            zIndex: 8,
          }}
        >
          ✳️
        </div>
      )}
      {isSlowed && (
        <div
          style={{
            position: "absolute",
            top: -8,
            right: 0,
            fontSize: 10,
            zIndex: 8,
          }}
        >
          🕸️
        </div>
      )}
      <div
        className={`${isHit ? "enemy-hit-flash " : ""}${isFast ? "fast-enemy-core " : ""}${isHealer ? "healer-enemy-core " : ""}${isPoison ? "poison-enemy-core " : ""}${isSplitter ? "splitter-enemy-core " : ""}${isSplitChild ? "split-child-enemy-core" : ""}`.trim()}
        style={{
          width: size,
          height: size,
          margin: "0 auto",
          borderRadius: enemy.isBoss ? 6 : isSplitChild ? 3 : isFast || isHealer || isPoison ? 4 : "50%",
          clipPath: isFast
            ? "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)"
            : isHealer
              ? "polygon(35% 0%, 65% 0%, 65% 35%, 100% 35%, 100% 65%, 65% 65%, 65% 100%, 35% 100%, 35% 65%, 0% 65%, 0% 35%, 35% 35%)"
              : isPoison
                ? "polygon(50% 0%, 78% 8%, 100% 35%, 92% 62%, 70% 92%, 50% 100%, 30% 92%, 8% 62%, 0% 35%, 22% 8%)"
                : isSplitter
                  ? "polygon(50% 0%, 96% 28%, 82% 100%, 18% 100%, 4% 28%)"
                  : isSplitChild
                    ? "polygon(25% 8%, 75% 8%, 100% 50%, 75% 92%, 25% 92%, 0% 50%)"
                    : "none",
          background: enemy.isBoss
            ? "radial-gradient(circle at 30% 30%, #b37feb 0%, #8e44ad 45%, #4a235a 100%)"
            : isHealer
              ? "linear-gradient(145deg, #fbcfe8 0%, #f472b6 55%, #db2777 100%)"
              : isPoison
                ? "linear-gradient(145deg, #6ee7b7 0%, #10b981 55%, #047857 100%)"
                : isSplitter
                  ? "linear-gradient(145deg, #f7b267 0%, #f79d65 45%, #b85616 100%)"
                  : isFast
                    ? "linear-gradient(145deg, #22d3ee 0%, #0ea5b7 55%, #0b6170 100%)"
                    : isSplitChild
                      ? "linear-gradient(145deg, #ffe28a 0%, #ffd166 58%, #d09a20 100%)"
                      : laneColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: enemy.isBoss ? 12 : isSplitter ? 10 : isFast ? 10 : isSplitChild ? 9 : 11,
          color: "#fff",
          fontWeight: 800,
          textShadow: "0 1px 4px rgba(0, 0, 0, 0.45)",
          border: enemy.armor
            ? "2px solid #f1c40f"
            : isHealer
              ? "2px solid #fdf2f8"
              : isPoison
                ? "2px solid #a7f3d0"
                : isSplitter
                  ? "2px solid #ffd39a"
                  : isFast
                    ? "2px solid #7ce7ff"
                    : isSplitChild
                      ? "1px solid #fff0bf"
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
      {enemy.armor > 0 && (
        <div style={{ fontSize: 9, color: "#fde047", textAlign: "center", fontWeight: 800, marginTop: 1 }}>
          🛡{enemy.armor}
        </div>
      )}
    </div>
  );
}

function buildLaneRenderData(enemies, hitEffects, damageBursts, shotTraces, chainTraces) {
  const laneEnemies = Array.from({ length: COLS }, () => []);
  const queuedCounts = Array(COLS).fill(0);
  const queuedBossFlags = Array(COLS).fill(false);
  const queuedFastFlags = Array(COLS).fill(false);
  const queuedHealerFlags = Array(COLS).fill(false);
  const queuedPoisonFlags = Array(COLS).fill(false);
  const queuedSplitterFlags = Array(COLS).fill(false);
  const queuedSplitChildFlags = Array(COLS).fill(false);
  const hitEffectByEnemyId = new Map();
  const burstsByLane = Array.from({ length: COLS }, () => []);
  const tracesByLane = Array.from({ length: COLS }, () => []);
  const chainsByLane = Array.from({ length: COLS }, () => []);

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
      if (enemy.type === "healer") {
        queuedHealerFlags[enemy.lane] = true;
      }
      if (enemy.type === "poison") {
        queuedPoisonFlags[enemy.lane] = true;
      }
      if (enemy.type === "splitter") {
        queuedSplitterFlags[enemy.lane] = true;
      }
      if (enemy.type === "split_child") {
        queuedSplitChildFlags[enemy.lane] = true;
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

  for (const chainTrace of chainTraces) {
    chainsByLane[chainTrace.lane].push(chainTrace);
  }

  return {
    laneEnemies,
    queuedCounts,
    queuedBossFlags,
    queuedFastFlags,
    queuedHealerFlags,
    queuedPoisonFlags,
    queuedSplitterFlags,
    queuedSplitChildFlags,
    hitEffectByEnemyId,
    burstsByLane,
    tracesByLane,
    chainsByLane,
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
  hasQueuedHealer,
  hasQueuedPoison,
  hasQueuedSplitter,
  hasQueuedSplitChild,
  hitEffectByEnemyId,
  laneBursts,
  laneTraces,
  laneChains,
  showCombatOverlay,
  combatDebug,
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
      {laneChains.map((chainTrace) => <ChainTrace key={chainTrace.key} trace={chainTrace} />)}
      {showCombatOverlay && combatDebug && (
        <div
          style={{
            position: "absolute",
            top: 4,
            left: 4,
            zIndex: 9,
            background: "rgba(2, 6, 23, 0.84)",
            border: "1px solid rgba(148, 163, 184, 0.42)",
            borderRadius: 7,
            padding: "3px 5px",
            color: "#cbd5e1",
            fontSize: 9,
            lineHeight: 1.25,
            fontWeight: 700,
            pointerEvents: "none",
            textAlign: "left",
            minWidth: 64,
          }}
        >
          <div>TGT {combatDebug.targetsAtStart}</div>
          <div>SHOT {combatDebug.shots}</div>
          <div>HIT {combatDebug.hits} / BLK {combatDebug.blocked}</div>
          <div>CHAIN {combatDebug.chains}</div>
          <div>DMG {combatDebug.damage}</div>
        </div>
      )}
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
            fontSize: 10,
            color: "#cbd5e1",
            fontWeight: 700,
            background: "rgba(15, 23, 42, 0.88)",
            border: "1px solid rgba(71, 85, 105, 0.8)",
            padding: "3px 7px",
            borderRadius: 999,
            whiteSpace: "nowrap",
          }}
        >
          +{queuedCount}待機
          {hasQueuedBoss ? " 👑" : ""}
          {hasQueuedHealer ? " 💖" : ""}
          {hasQueuedFast ? " ⚡" : ""}
          {hasQueuedPoison ? " ☠️" : ""}
          {hasQueuedSplitter ? " 🧬" : ""}
          {hasQueuedSplitChild ? " ✳️" : ""}
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
            background: "rgba(248, 113, 113, 0.88)",
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
  chainTraces,
  combatDebugByLane,
  showCombatOverlay = false,
  laneHeight,
  laneColors,
}) {
  const laneRenderData = buildLaneRenderData(enemies, hitEffects, damageBursts, shotTraces, chainTraces);

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
          hasQueuedHealer={laneRenderData.queuedHealerFlags[laneIndex]}
          hasQueuedPoison={laneRenderData.queuedPoisonFlags[laneIndex]}
          hasQueuedSplitter={laneRenderData.queuedSplitterFlags[laneIndex]}
          hasQueuedSplitChild={laneRenderData.queuedSplitChildFlags[laneIndex]}
          hitEffectByEnemyId={laneRenderData.hitEffectByEnemyId}
          laneBursts={laneRenderData.burstsByLane[laneIndex]}
          laneTraces={laneRenderData.tracesByLane[laneIndex]}
          laneChains={laneRenderData.chainsByLane[laneIndex]}
          showCombatOverlay={showCombatOverlay}
          combatDebug={combatDebugByLane?.[laneIndex] ?? null}
        />
      ))}
    </div>
  );
});
