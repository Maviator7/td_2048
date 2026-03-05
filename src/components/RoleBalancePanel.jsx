import { memo } from "react";

import { TILE_ROLE_DEFS, TILE_ROLE_ORDER } from "../game/config";

function formatStat(value) {
  return (value ?? 0).toLocaleString();
}

export const RoleBalancePanel = memo(function RoleBalancePanel({ isEnabled, onToggle, roleMetrics }) {
  return (
    <div
      style={{
        background: "#0d1117",
        border: "1px solid #1e2a3a",
        borderRadius: 10,
        padding: "8px 10px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ fontSize: 12, color: "#cbd5e1", fontWeight: 700 }}>
          バランス検証
        </div>
        <button
          type="button"
          onClick={onToggle}
          style={{
            border: "1px solid #334155",
            borderRadius: 999,
            background: isEnabled ? "#1f3b2f" : "#111827",
            color: isEnabled ? "#86efac" : "#94a3b8",
            fontSize: 11,
            fontWeight: 700,
            padding: "3px 8px",
            cursor: "pointer",
          }}
        >
          {isEnabled ? "ON" : "OFF"}
        </button>
      </div>

      {!isEnabled && (
        <div style={{ fontSize: 11, color: "#64748b" }}>
          ONで役職別の与ダメ / 被ダメ / 修復量を表示
        </div>
      )}

      {isEnabled && (
        <div style={{ display: "grid", gap: 6 }}>
          {TILE_ROLE_ORDER.map((roleKey) => {
            const roleDef = TILE_ROLE_DEFS[roleKey];
            const metrics = roleMetrics[roleKey] ?? { dealt: 0, taken: 0, repair: 0 };
            return (
              <div
                key={roleKey}
                style={{
                  border: "1px solid #1f2937",
                  borderRadius: 8,
                  background: "#0b1220",
                  padding: "6px 7px",
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, color: "#e5e7eb", marginBottom: 3 }}>
                  {roleDef.icon} {roleDef.label}
                </div>
                <div style={{ fontSize: 11, color: "#93c5fd" }}>与ダメ {formatStat(metrics.dealt)}</div>
                <div style={{ fontSize: 11, color: "#fda4af" }}>被ダメ {formatStat(metrics.taken)}</div>
                <div style={{ fontSize: 11, color: "#86efac" }}>修復量 {formatStat(metrics.repair)}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});
