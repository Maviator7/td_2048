import { useEffect, useId, useRef, useState } from "react";

import { createModalSurface, createPrimaryButtonStyle } from "./ui/styles";
import { useModalTransition } from "../hooks/useModalTransition";

export function TitleSettingsModal({
  isOpen,
  onClose,
  bgmMuted,
  masterVolume,
  bgmVolume,
  seVolume,
  onToggleBgmMute,
  onChangeMasterVolume,
  onChangeBgmVolume,
  onChangeSeVolume,
  onUnlockAudio,
  rankingName,
  onChangeRankingName,
}) {
  const dialogRef = useRef(null);
  const titleId = useId();
  const descriptionId = useId();
  const { isRendered, phase } = useModalTransition(isOpen);
  const [nameDraftOverride, setNameDraftOverride] = useState(null);
  const [nameError, setNameError] = useState("");
  const nameDraft = nameDraftOverride ?? (rankingName ?? "");

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

  const handleSaveRankingName = () => {
    const result = onChangeRankingName?.(nameDraft);
    if (!result?.ok) {
      setNameError(result?.error ?? "名前の保存に失敗しました。");
      return;
    }

    setNameDraftOverride(null);
    setNameError("");
  };

  return (
    <div
      className={`modal-backdrop modal-backdrop-${phase}`}
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
        className={`modal-surface modal-surface-${phase}`}
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
          マスター、BGM、SEの音量を調整できます。
        </div>

        <div style={{ border: "1px solid #334155", borderRadius: 10, padding: "9px 10px", background: "rgba(15,23,42,0.74)", marginBottom: 8 }}>
          <div style={{ fontSize: 13, color: "#cbd5e1", fontWeight: 700, marginBottom: 7 }}>ランキング登録名</div>
          <input
            type="text"
            value={nameDraft}
            onChange={(event) => {
              setNameDraftOverride(event.target.value);
              if (nameError) {
                setNameError("");
              }
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                handleSaveRankingName();
              }
            }}
            maxLength={32}
            placeholder="名前を入力"
            style={{
              width: "100%",
              borderRadius: 8,
              border: `1px solid ${nameError ? "#ef4444" : "#475569"}`,
              background: "#020617",
              color: "#e2e8f0",
              fontSize: 13,
              padding: "7px 9px",
              boxSizing: "border-box",
            }}
          />
          <div style={{ marginTop: 6, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
            <div style={{ fontSize: 11, color: nameError ? "#fca5a5" : "#94a3b8" }}>
              {nameError || "1〜12文字で入力できます。"}
            </div>
            <button
              type="button"
              onClick={handleSaveRankingName}
              style={{
                border: "1px solid #475569",
                borderRadius: 8,
                padding: "5px 8px",
                background: "#0f172a",
                color: "#e2e8f0",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              名前を保存
            </button>
          </div>
        </div>

        <div style={{ border: "1px solid #334155", borderRadius: 10, padding: "9px 10px", background: "rgba(15,23,42,0.74)", marginBottom: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
            <div style={{ fontSize: 13, color: "#cbd5e1", fontWeight: 700 }}>MASTER</div>
            <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 700 }}>
              {Math.round((masterVolume ?? 0.5) * 100)}%
            </div>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={masterVolume ?? 0.5}
            onChange={(event) => {
              onUnlockAudio?.();
              onChangeMasterVolume?.(Number(event.target.value));
            }}
            style={{ width: "100%" }}
          />
        </div>

        <div style={{ border: "1px solid #334155", borderRadius: 10, padding: "9px 10px", background: "rgba(15,23,42,0.74)", marginBottom: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
            <div style={{ fontSize: 13, color: "#cbd5e1", fontWeight: 700 }}>BGM</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 700 }}>
                {Math.round((bgmVolume ?? 0.5) * 100)}%
              </div>
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
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={bgmVolume ?? 0.5}
            onChange={(event) => {
              onUnlockAudio?.();
              onChangeBgmVolume?.(Number(event.target.value));
            }}
            style={{ width: "100%" }}
          />
        </div>

        <div style={{ border: "1px solid #334155", borderRadius: 10, padding: "9px 10px", background: "rgba(15,23,42,0.74)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
            <div style={{ fontSize: 13, color: "#cbd5e1", fontWeight: 700 }}>SE</div>
            <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 700 }}>
              {Math.round((seVolume ?? 0.5) * 100)}%
            </div>
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={seVolume ?? 0.5}
            onChange={(event) => {
              onUnlockAudio?.();
              onChangeSeVolume?.(Number(event.target.value));
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
