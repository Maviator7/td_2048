import { COLS, ENEMY_MAX_STEPS } from "../game/constants";
import { countQueuedEnemiesInLane, getLaneEnemies } from "../game/enemies";

function ShotTrace({ trace }) {
  return (
    <div
      className={trace.blocked ? "shot-trace shot-trace-blocked" : "shot-trace"}
      style={{
        position: "absolute",
        top: `${trace.top + 8}%`,
        bottom: 4,
        left: "50%",
        width: trace.width,
        transform: "translateX(-50%)",
        borderRadius: 999,
        background: `linear-gradient(180deg, ${trace.color} 0%, rgba(255,255,255,0.92) 28%, ${trace.color}88 72%, transparent 100%)`,
        boxShadow: `0 0 12px ${trace.color}, 0 0 22px ${trace.color}66`,
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
        textShadow: "0 0 10px rgba(255, 208, 84, 0.95), 0 0 18px rgba(255, 98, 0, 0.65)",
        pointerEvents: "none",
        animationDelay: `${burst.delayMs}ms`,
      }}
    >
      -{burst.damage}
    </div>
  );
}

function LaneEnemy({ enemy, laneColor, hitBurst }) {
  const top = Math.min(1, enemy.step / ENEMY_MAX_STEPS) * 72;
  const hpRatio = enemy.hp / enemy.maxHp;
  const isHit = Boolean(hitBurst);
  const size = enemy.isBoss ? 36 : 30;

  return (
    <div
      style={{
        position: "absolute",
        top: `${top}%`,
        left: "50%",
        transform: "translateX(-50%)",
        width: enemy.isBoss ? 42 : 34,
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
            textShadow: "0 0 8px rgba(255,220,120,0.95)",
          }}
        >
          👑
        </div>
      )}
      <div
        className={`${isHit ? "enemy-hit-flash" : ""}${enemy.isBoss ? " boss-enemy-core" : ""}`}
        style={{
          width: size,
          height: size,
          margin: "0 auto",
          borderRadius: enemy.isBoss ? 6 : "50%",
          background: enemy.isBoss
            ? "radial-gradient(circle at 30% 30%, #b37feb 0%, #8e44ad 45%, #4a235a 100%)"
            : laneColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: enemy.isBoss ? 10 : 9,
          color: "#fff",
          fontWeight: "bold",
          border: enemy.isBoss
            ? "2px solid #f1c40f"
            : enemy.armor
              ? "2px solid #f1c40f"
              : "2px solid transparent",
          boxShadow: isHit
            ? `0 0 18px rgba(255,255,255,0.8), 0 0 24px ${laneColor}cc`
            : enemy.isBoss
              ? "0 0 14px rgba(241,196,15,0.65), 0 0 20px rgba(142,68,173,0.55)"
              : `0 0 6px ${laneColor}88`,
          animationDelay: isHit ? `${hitBurst.delayMs}ms` : undefined,
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

function EnemyLane({
  laneIndex,
  enemies,
  atkCols,
  nextSpawnEnemy,
  shotTraces,
  damageByLane,
  damageBursts,
  laneColors,
}) {
  const laneEnemies = getLaneEnemies(enemies, laneIndex);
  const queuedCount = countQueuedEnemiesInLane(enemies, laneIndex);
  const isAttacking = atkCols.includes(laneIndex);
  const isNextSpawnLane = nextSpawnEnemy?.lane === laneIndex;
  const laneColor = laneColors[laneIndex];
  const laneTraces = shotTraces.filter((trace) => trace.lane === laneIndex);
  const laneBursts = damageBursts.filter((burst) => burst.lane === laneIndex);

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
            boxShadow: `0 0 10px ${laneColor}88`,
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
            background: `linear-gradient(180deg, ${laneColor}20 0%, transparent 38%, ${laneColor}16 100%)`,
            zIndex: 1,
            pointerEvents: "none",
          }}
        />
      )}
      {isAttacking && <div style={{ position: "absolute", inset: 0, background: `${laneColor}22`, zIndex: 2 }} />}
      {laneTraces.map((trace) => <ShotTrace key={trace.key} trace={trace} />)}
      {damageByLane[laneIndex] && (
        <div
          style={{
            position: "absolute",
            top: 4,
            left: "50%",
            transform: "translateX(-50%)",
            color: "#ffdd00",
            fontSize: 13,
            fontWeight: "bold",
            zIndex: 3,
            textShadow: "0 0 6px #ff0",
          }}
        >
          -{damageByLane[laneIndex]}
        </div>
      )}
      {laneBursts.map((burst) => <DamageBurst key={burst.key} burst={burst} />)}
      {laneEnemies.map((enemy) => {
        const hitBurst = damageBursts.find((burst) => burst.targetId === enemy.id);
        return <LaneEnemy key={enemy.id} enemy={enemy} laneColor={laneColor} hitBurst={hitBurst} />;
      })}
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
          +{queuedCount}待機{enemies.some((enemy) => enemy.lane === laneIndex && enemy.step <= 0 && enemy.isBoss) ? " 👑" : ""}
        </div>
      )}
    </div>
  );
}

export function EnemyLanes({
  enemies,
  atkCols,
  nextSpawnEnemy,
  shotTraces,
  damageByLane,
  damageBursts,
  laneHeight,
  laneColors,
}) {
  return (
    <div style={{ display: "flex", gap: 4, height: laneHeight, marginBottom: 6 }}>
      {Array.from({ length: COLS }).map((_, laneIndex) => (
        <EnemyLane
          key={laneIndex}
          laneIndex={laneIndex}
          enemies={enemies}
          atkCols={atkCols}
          nextSpawnEnemy={nextSpawnEnemy}
          shotTraces={shotTraces}
          damageByLane={damageByLane}
          damageBursts={damageBursts}
          laneColors={laneColors}
        />
      ))}
    </div>
  );
}
