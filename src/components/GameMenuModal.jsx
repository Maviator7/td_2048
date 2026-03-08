import { useEffect, useId, useRef } from "react";

import { createModalSurface, createPrimaryButtonStyle } from "./ui/styles";
import { useModalTransition } from "../hooks/useModalTransition";

function formatSavedAt(savedAt) {
  if (!savedAt) {
    return "未保存";
  }

  return new Date(savedAt).toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function GameMenuModal({
  isOpen,
  onClose,
  onSave,
  onLoad,
  onBackToTitle,
  onOpenEnemyCodex,
  bgmMuted,
  masterVolume,
  bgmVolume,
  seVolume,
  onToggleBgmMute,
  onChangeMasterVolume,
  onChangeBgmVolume,
  onChangeSeVolume,
  saveMeta,
  statusMessage,
}) {
  const dialogRef = useRef(null);
  const titleId = useId();
  const descId = useId();
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
        background: "rgba(0, 0, 0, 0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1200,
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
        onClick={(event) => event.stopPropagation()}
        style={createModalSurface({ maxWidth: 360 })}
      >
        <div id={titleId} style={{ fontSize: 18, color: "#f8fafc", fontWeight: 800, marginBottom: 6 }}>
          ゲームメニュー
        </div>
        <div id={descId} style={{ fontSize: 13, color: "#94a3b8", marginBottom: 12, lineHeight: 1.5 }}>
          セーブデータは署名付きで保存され、読み込み時に整合性を検証します。
        </div>
        <div style={{ fontSize: 12, color: "#e2e8f0", marginBottom: 8 }}>
          最終保存: {formatSavedAt(saveMeta?.savedAt)}
        </div>
        <div style={{ marginBottom: 8, border: "1px solid #334155", borderRadius: 10, padding: "8px 9px", background: "rgba(15,23,42,0.66)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <div style={{ fontSize: 12, color: "#cbd5e1", fontWeight: 700 }}>MASTER</div>
            <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700 }}>
              {Math.round((masterVolume ?? 0.5) * 100)}%
            </div>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={masterVolume ?? 0.5}
            onChange={(event) => onChangeMasterVolume?.(Number(event.target.value))}
            style={{ width: "100%", marginBottom: 8 }}
          />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <div style={{ fontSize: 12, color: "#cbd5e1", fontWeight: 700 }}>BGM</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700 }}>
                {Math.round((bgmVolume ?? 0.5) * 100)}%
              </div>
              <button
                type="button"
                onClick={onToggleBgmMute}
                style={{
                  border: "1px solid #475569",
                  borderRadius: 8,
                  padding: "4px 8px",
                  background: "#0f172a",
                  color: "#e2e8f0",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {bgmMuted ? "🔇 OFF" : "🔊 ON"}
              </button>
            </div>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={bgmVolume ?? 0.5}
            onChange={(event) => onChangeBgmVolume?.(Number(event.target.value))}
            style={{ width: "100%", marginBottom: 8 }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <div style={{ fontSize: 12, color: "#cbd5e1", fontWeight: 700 }}>SE</div>
            <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700 }}>
              {Math.round((seVolume ?? 0.5) * 100)}%
            </div>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={seVolume ?? 0.5}
            onChange={(event) => onChangeSeVolume?.(Number(event.target.value))}
            style={{ width: "100%" }}
          />
        </div>
        <button
          type="button"
          onClick={onOpenEnemyCodex}
          style={createPrimaryButtonStyle({
            background: "linear-gradient(90deg,#38bdf8 0%,#0ea5e9 100%)",
            color: "#082f49",
            fontSize: 15,
            padding: "10px 10px",
            fontWeight: 800,
          })}
        >
          📘 敵図鑑
        </button>
        <button
          type="button"
          onClick={onSave}
          style={createPrimaryButtonStyle({
            marginTop: 8,
            background: "linear-gradient(90deg,#0ea5e9 0%,#0284c7 100%)",
            color: "#f8fafc",
            fontSize: 15,
            padding: "10px 10px",
          })}
        >
          💾 セーブ
        </button>
        <button
          type="button"
          onClick={onLoad}
          disabled={!saveMeta?.exists}
          style={{
            ...createPrimaryButtonStyle({
              marginTop: 8,
              background: "linear-gradient(90deg,#14532d 0%,#166534 100%)",
              color: "#dcfce7",
              fontSize: 15,
              padding: "10px 10px",
            }),
            opacity: saveMeta?.exists ? 1 : 0.45,
            cursor: saveMeta?.exists ? "pointer" : "not-allowed",
          }}
        >
          📂 ロード
        </button>
        <button
          type="button"
          onClick={onBackToTitle}
          style={createPrimaryButtonStyle({
            marginTop: 8,
            background: "linear-gradient(90deg,#7f1d1d 0%,#991b1b 100%)",
            color: "#fee2e2",
            fontSize: 15,
            padding: "10px 10px",
          })}
        >
          🏠 タイトルへ戻る
        </button>
        {statusMessage && (
          <div style={{ marginTop: 10, fontSize: 12, color: "#f8fafc", minHeight: 18 }}>
            {statusMessage}
          </div>
        )}
        <button
          type="button"
          onClick={onClose}
          style={createPrimaryButtonStyle({
            marginTop: 10,
            border: "1px solid #334155",
            background: "#0f172a",
            color: "#cbd5e1",
            padding: "9px 10px",
            boxShadow: "none",
          })}
        >
          閉じる
        </button>
      </div>
    </div>
  );
}
