import { useEffect, useId, useRef } from "react";

import { createModalSurface, createPrimaryButtonStyle } from "./ui/styles";

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
  saveMeta,
  statusMessage,
}) {
  const dialogRef = useRef(null);
  const titleId = useId();
  const descId = useId();

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

  if (!isOpen) {
    return null;
  }

  return (
    <div
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
