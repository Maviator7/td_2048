import { useEffect, useId, useRef } from "react";

import { useModalTransition } from "../hooks/useModalTransition";
import { createModalSurface, createPrimaryButtonStyle } from "./ui/styles";

export function GameOverModal({ isOpen, score, wave, onOpenRanking, onBackToTitle }) {
  const dialogRef = useRef(null);
  const titleId = useId();
  const descId = useId();
  const { isRendered, phase } = useModalTransition(isOpen);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const focusTarget = dialogRef.current?.querySelector("button");
    focusTarget?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onOpenRanking?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onOpenRanking]);

  if (!isRendered) {
    return null;
  }

  return (
    <div
      className={`modal-backdrop modal-backdrop-${phase}`}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(2, 6, 23, 0.74)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1300,
        padding: 16,
      }}
    >
      <div
        className={`modal-surface modal-surface-${phase}`}
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        style={createModalSurface({
          maxWidth: 360,
          border: "1px solid #ef4444",
          background: "linear-gradient(180deg,#1b0f13 0%,#0f172a 100%)",
        })}
      >
        <div id={titleId} style={{ fontSize: 24, color: "#fca5a5", fontWeight: 900, marginBottom: 8, textAlign: "center" }}>
          GAME OVER
        </div>
        <div id={descId} style={{ fontSize: 13, color: "#fca5a5", marginBottom: 14, textAlign: "center" }}>
          防衛ラインが突破されました
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
          <div style={{ border: "1px solid #7f1d1d", borderRadius: 10, padding: "10px 8px", textAlign: "center", background: "rgba(127,29,29,0.25)" }}>
            <div style={{ fontSize: 11, color: "#fecaca", marginBottom: 4 }}>SCORE</div>
            <div style={{ fontSize: 18, color: "#f8fafc", fontWeight: 800 }}>{score.toLocaleString()}</div>
          </div>
          <div style={{ border: "1px solid #7f1d1d", borderRadius: 10, padding: "10px 8px", textAlign: "center", background: "rgba(127,29,29,0.25)" }}>
            <div style={{ fontSize: 11, color: "#fecaca", marginBottom: 4 }}>WAVE</div>
            <div style={{ fontSize: 18, color: "#f8fafc", fontWeight: 800 }}>{wave}</div>
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenRanking}
          style={createPrimaryButtonStyle({
            background: "linear-gradient(90deg,#f97316 0%,#ef4444 100%)",
            color: "#fff7ed",
            fontSize: 16,
          })}
        >
          ランキングへ
        </button>
        <button
          type="button"
          onClick={onBackToTitle}
          style={createPrimaryButtonStyle({
            marginTop: 8,
            background: "linear-gradient(90deg,#334155 0%,#1e293b 100%)",
            color: "#e2e8f0",
            fontSize: 15,
          })}
        >
          タイトルへ戻る
        </button>
      </div>
    </div>
  );
}
