import { useEffect, useId, useRef } from "react";

import { ENEMY_TYPES } from "../game/config";
import { LANE_COLORS } from "../game/constants";
import { createModalSurface, createPrimaryButtonStyle } from "./ui/styles";
import { useModalTransition } from "../hooks/useModalTransition";

const CODEX_ENTRIES = [
  {
    type: ENEMY_TYPES.NORMAL,
    name: "通常敵",
    description: "基本タイプ。標準速度で前進する。",
  },
  {
    type: ENEMY_TYPES.FAST,
    name: "高速敵",
    description: "通常より早く DEFENSE LINE に接近する。",
  },
  {
    type: ENEMY_TYPES.HEALER,
    name: "回復敵",
    description: "ターンの終了時に他の敵のHPを回復させる。",
  },
  {
    type: ENEMY_TYPES.POISON,
    name: "毒敵",
    description: "攻撃が当たったレーンに次ターン追加ダメージを付与。",
  },
  {
    type: ENEMY_TYPES.SPLITTER,
    name: "分裂敵",
    description: "撃破時に小型敵3体へ分裂する。",
  },
  {
    type: ENEMY_TYPES.SPLIT_CHILD,
    name: "分裂子",
    description: "分裂敵から発生する小型タイプ。",
  },
  {
    type: ENEMY_TYPES.BOSS,
    name: "ボス",
    description: "各Wave最後に出現。耐久と装甲が高い。",
  },
];

function createFigureStyle(type) {
  const base = {
    width: 28,
    height: 28,
    borderRadius: "50%",
    border: "2px solid transparent",
    boxShadow: "0 0 8px rgba(255,255,255,0.12)",
    flexShrink: 0,
  };

  if (type === ENEMY_TYPES.BOSS) {
    return {
      ...base,
      borderRadius: 6,
      background: "radial-gradient(circle at 30% 30%, #b37feb 0%, #8e44ad 45%, #4a235a 100%)",
      border: "2px solid #f1c40f",
      boxShadow: "0 0 14px rgba(241,196,15,0.45), 0 0 16px rgba(142,68,173,0.35)",
    };
  }

  if (type === ENEMY_TYPES.FAST) {
    return {
      ...base,
      borderRadius: 4,
      clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
      background: "linear-gradient(145deg, #22d3ee 0%, #0ea5b7 55%, #0b6170 100%)",
      border: "2px solid #7ce7ff",
      boxShadow: "0 0 10px rgba(34,211,238,0.4)",
    };
  }

  if (type === ENEMY_TYPES.HEALER) {
    return {
      ...base,
      borderRadius: 4,
      background: "linear-gradient(145deg, #fbcfe8 0%, #f472b6 55%, #db2777 100%)",
      border: "2px solid #fdf2f8",
      boxShadow: "0 0 10px rgba(244,114,182,0.4)",
      clipPath: "polygon(35% 0%, 65% 0%, 65% 35%, 100% 35%, 100% 65%, 65% 65%, 65% 100%, 35% 100%, 35% 65%, 0% 65%, 0% 35%, 35% 35%)",
    };
  }

  if (type === ENEMY_TYPES.POISON) {
    return {
      ...base,
      borderRadius: 6,
      background: "linear-gradient(145deg, #6ee7b7 0%, #10b981 55%, #047857 100%)",
      border: "2px solid #a7f3d0",
      boxShadow: "0 0 10px rgba(16,185,129,0.45)",
      clipPath: "polygon(50% 0%, 78% 8%, 100% 35%, 92% 62%, 70% 92%, 50% 100%, 30% 92%, 8% 62%, 0% 35%, 22% 8%)",
    };
  }

  if (type === ENEMY_TYPES.SPLITTER) {
    return {
      ...base,
      borderRadius: 5,
      clipPath: "polygon(50% 0%, 96% 28%, 82% 100%, 18% 100%, 4% 28%)",
      background: "linear-gradient(145deg, #f7b267 0%, #f79d65 45%, #b85616 100%)",
      border: "2px solid #ffd39a",
      boxShadow: "0 0 10px rgba(247,178,103,0.38)",
    };
  }

  if (type === ENEMY_TYPES.SPLIT_CHILD) {
    return {
      ...base,
      width: 22,
      height: 22,
      borderRadius: 3,
      clipPath: "polygon(25% 8%, 75% 8%, 100% 50%, 75% 92%, 25% 92%, 0% 50%)",
      background: "linear-gradient(145deg, #ffe28a 0%, #ffd166 58%, #d09a20 100%)",
      border: "1px solid #fff0bf",
      boxShadow: "0 0 8px rgba(255,209,102,0.35)",
    };
  }

  return {
    ...base,
    background: "transparent",
    border: "none",
    boxShadow: "none",
  };
}

function NormalEnemyFigure() {
  return (
    <div style={{ display: "flex", gap: 3, alignItems: "center", minWidth: 34 }}>
      {LANE_COLORS.map((color) => (
        <div
          key={color}
          style={{
            width: 9,
            height: 9,
            borderRadius: "50%",
            background: color,
            boxShadow: `0 0 6px ${color}88`,
          }}
        />
      ))}
    </div>
  );
}

export function EnemyCodexModal({ isOpen, discoveredEnemyTypes, onClose }) {
  const dialogRef = useRef(null);
  const titleId = useId();
  const descriptionId = useId();
  const discoveredSet = new Set(discoveredEnemyTypes ?? []);
  const { isRendered, phase } = useModalTransition(isOpen);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const previousActiveElement = document.activeElement;
    const focusTarget = dialogRef.current?.querySelector("button");
    focusTarget?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      previousActiveElement?.focus?.();
    };
  }, [isOpen, onClose]);

  if (!isRendered) {
    return null;
  }

  return (
    <div
      className={`modal-backdrop modal-backdrop-${phase}`}
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.62)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        zIndex: 1250,
      }}
    >
      <div
        className={`modal-surface modal-surface-${phase}`}
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onClick={(event) => event.stopPropagation()}
        style={createModalSurface({
          maxWidth: 560,
          maxHeight: "84vh",
          background: "#0f172a",
          borderRadius: 14,
          padding: "12px 12px 10px",
          boxShadow: "0 18px 46px rgba(0,0,0,0.52)",
        })}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div id={titleId} style={{ fontSize: 18, fontWeight: 800, color: "#f8fafc" }}>📘 敵図鑑</div>
          <button
            type="button"
            onClick={onClose}
            aria-label="敵図鑑を閉じる"
            style={{
              border: "none",
              background: "transparent",
              color: "#94a3b8",
              fontSize: 18,
              cursor: "pointer",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
        <div id={descriptionId} style={{ fontSize: 12, color: "#94a3b8", marginBottom: 10, lineHeight: 1.55 }}>
          一度でも出現した敵は詳細を表示します。未遭遇の敵は「？？？」のままです。
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8, marginBottom: 10 }}>
          {CODEX_ENTRIES.map((entry, index) => {
            const discovered = discoveredSet.has(entry.type);
            return (
              <div
                key={entry.type}
                className={`codex-entry ${phase === "exiting" ? "" : "codex-entry-stagger"}`}
                style={{
                  animationDelay: `${index * 45}ms`,
                }}
              >
                <div
                  style={{
                    border: `1px solid ${discovered ? "#334155" : "#1f2937"}`,
                    background: discovered ? "rgba(15,23,42,0.75)" : "rgba(2,6,23,0.66)",
                    borderRadius: 10,
                    padding: "9px 10px",
                  }}
                >
                  {discovered ? (
                    <>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {entry.type === ENEMY_TYPES.NORMAL ? (
                          <NormalEnemyFigure />
                        ) : (
                          <div style={createFigureStyle(entry.type)} />
                        )}
                        <div style={{ fontSize: 14, color: "#e2e8f0", fontWeight: 800 }}>
                          {entry.name}
                        </div>
                      </div>
                      <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 3 }}>{entry.description}</div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: 14, color: "#64748b", fontWeight: 800 }}>
                        ❓ ？？？
                      </div>
                      <div style={{ fontSize: 12, color: "#475569", marginTop: 3 }}>未遭遇</div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onClose}
          style={createPrimaryButtonStyle({
            background: "#1e293b",
            color: "#e2e8f0",
            borderRadius: 10,
            padding: "10px 0",
            fontWeight: 700,
            boxShadow: "none",
          })}
        >
          閉じる
        </button>
      </div>
    </div>
  );
}
