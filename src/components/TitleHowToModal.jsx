import { useEffect, useId, useRef } from "react";
import { createModalSurface, createPrimaryButtonStyle } from "./ui/styles";
import { useModalTransition } from "../hooks/useModalTransition";

export function TitleHowToModal({ isOpen, onClose }) {
  const dialogRef = useRef(null);
  const titleId = useId();
  const descriptionId = useId();
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
        zIndex: 1200,
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
          maxHeight: "86vh",
          background: "#0f172a",
          borderRadius: 14,
          padding: "14px 14px 12px",
          boxShadow: "0 18px 44px rgba(0,0,0,0.5)",
        })}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div id={titleId} style={{ fontSize: 18, fontWeight: 800, color: "#f8fafc" }}>📘 遊び方</div>
          <button
            type="button"
            onClick={onClose}
            aria-label="遊び方を閉じる"
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
        <div id={descriptionId} style={{ fontSize: 14, color: "#94a3b8", marginBottom: 10, lineHeight: 1.6 }}>
          Merge Fortress 2048 は、2048パズルとタワーディフェンスを組み合わせた手数制ストラテジーです。
        </div>

        <div style={{ fontSize: 14, color: "#e2e8f0", fontWeight: 700, marginBottom: 4 }}>1. ターンの流れ</div>
        <ul style={{ margin: "0 0 10px 18px", padding: 0, color: "#cbd5e1", fontSize: 13, lineHeight: 1.6 }}>
          <li>1ターンに 3 手スライドできます。</li>
          <li>3手使うと自動で攻撃フェーズへ移行します。</li>
          <li>攻撃後、生き残った敵が前進します。</li>
        </ul>

        <div style={{ fontSize: 14, color: "#e2e8f0", fontWeight: 700, marginBottom: 4 }}>2. 攻撃の仕組み</div>
        <ul style={{ margin: "0 0 10px 18px", padding: 0, color: "#cbd5e1", fontSize: 13, lineHeight: 1.6 }}>
          <li>各レーンはグリッド内の同じ列の砲塔値を使って攻撃します。</li>
          <li>敵の装甲以上の火力がないとダメージが通りません。</li>
          <li>敵を倒すとスコアを獲得します。</li>
        </ul>

        <div style={{ fontSize: 14, color: "#e2e8f0", fontWeight: 700, marginBottom: 4 }}>3. 敵タイプ</div>
        <ul style={{ margin: "0 0 10px 18px", padding: 0, color: "#cbd5e1", fontSize: 13, lineHeight: 1.6 }}>
          <li>通常敵: 基本タイプ。</li>
          <li>⚡ 高速敵: 通常より速く DEFENSE LINE に接近。</li>
          <li>🧬 分裂敵: 撃破すると小型敵 3 体に分裂。</li>
          <li>👑 ボス: 各 Wave の最後に必ず出現。体力・装甲が高め。</li>
        </ul>

        <div style={{ fontSize: 14, color: "#e2e8f0", fontWeight: 700, marginBottom: 4 }}>4. 役職システム</div>
        <ul style={{ margin: "0 0 10px 18px", padding: 0, color: "#cbd5e1", fontSize: 13, lineHeight: 1.6 }}>
          <li>一定レベル以上のタイルに役職を設定できます。</li>
          <li>役職によって火力・防御・補助の性能が変化します。</li>
          <li>右側パネルで役職バランスの確認が可能です。</li>
        </ul>

        <div style={{ fontSize: 14, color: "#e2e8f0", fontWeight: 700, marginBottom: 4 }}>5. 行ボーナス（陣形効果）</div>
        <ul style={{ margin: "0 0 10px 18px", padding: 0, color: "#cbd5e1", fontSize: 13, lineHeight: 1.6 }}>
          <li>前衛（上段）: 攻撃倍率が上がり、与ダメージが増加。</li>
          <li>中衛（中央）: 受けるダメージが軽減。</li>
          <li>後衛（下段）: ターン終了時の修復効果が強化。</li>
        </ul>

        <div style={{ fontSize: 14, color: "#e2e8f0", fontWeight: 700, marginBottom: 4 }}>6. 勝敗条件</div>
        <ul style={{ margin: "0 0 10px 18px", padding: 0, color: "#cbd5e1", fontSize: 13, lineHeight: 1.6 }}>
          <li>敵が DEFENSE LINE を突破するとライフ減少。</li>
          <li>ライフが 0 になる、または盤面が詰まるとゲームオーバー。</li>
          <li>Wave を進めてハイスコア更新を目指します。</li>
        </ul>

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
