import { useEffect, useId, useRef } from "react";

import { createModalSurface, createPrimaryButtonStyle } from "./ui/styles";

export function TitleSettingsModal({
  isOpen,
  onClose,
  bgmMuted,
  bgmVolume,
  onToggleBgmMute,
  onChangeBgmVolume,
  onUnlockAudio,
}) {
  const dialogRef = useRef(null);
  const titleId = useId();
  const descriptionId = useId();

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
        background: "rgba(0,0,0,0.56)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        zIndex: 1200,
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onClick={(event) => event.stopPropagation()}
        style={createModalSurface({
          maxWidth: 420,
          background: "#0f172a",
          borderRadius: 14,
          padding: "13px 13px 12px",
          boxShadow: "0 16px 40px rgba(0,0,0,0.42)",
        })}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div id={titleId} style={{ fontSize: 17, fontWeight: 800, color: "#f8fafc" }}>⚙️ 設定</div>
          <button
            type="button"
            onClick={onClose}
            aria-label="設定を閉じる"
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
        <div id={descriptionId} style={{ fontSize: 13, color: "#94a3b8", marginBottom: 10 }}>
          BGMの再生状態と音量を調整できます。
        </div>

        <div style={{ border: "1px solid #334155", borderRadius: 10, padding: "9px 10px", background: "rgba(15,23,42,0.74)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
            <div style={{ fontSize: 13, color: "#cbd5e1", fontWeight: 700 }}>BGM</div>
            <button
              type="button"
              onClick={() => {
                onUnlockAudio?.();
                onToggleBgmMute?.();
              }}
              style={{
                border: "1px solid #475569",
                borderRadius: 8,
                padding: "5px 8px",
                background: "#0f172a",
                color: "#e2e8f0",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {bgmMuted ? "🔇 OFF" : "🔊 ON"}
            </button>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={bgmVolume ?? 0.6}
            onChange={(event) => {
              onUnlockAudio?.();
              onChangeBgmVolume?.(Number(event.target.value));
            }}
            style={{ width: "100%" }}
          />
        </div>

        <button
          type="button"
          onClick={onClose}
          style={createPrimaryButtonStyle({
            marginTop: 10,
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
