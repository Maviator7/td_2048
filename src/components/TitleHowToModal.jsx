import { useEffect, useId, useRef, useState } from "react";
import { createModalSurface, createPrimaryButtonStyle } from "./ui/styles";
import { useModalTransition } from "../hooks/useModalTransition";

const GUIDE_TABS = [
  {
    key: "flow",
    label: "基本進行",
    title: "1. ターンの流れ",
    items: [
      "プレイヤーフェーズ中はスライド操作ができ、1ターンで3手まで動かせます。",
      "有効な移動をすると手数が1減少し、0手になると攻撃フェーズへ移行します。",
      "攻撃後は敵の反撃・毒処理・ターン終了処理を行い、次ターンで再び3手に戻ります。",
    ],
  },
  {
    key: "combat",
    label: "戦闘",
    title: "2. 攻撃と被ダメージ",
    items: [
      "各レーンは同じ列のタイルが上から順に攻撃し、与ダメージは「攻撃力 - 装甲」で計算されます。",
      "敵の装甲以上の火力がない攻撃は無効化されます。",
      "敵が防衛線を突破すると1体につきライフが1減少します。ライフ0でゲームオーバーです。",
    ],
  },
  {
    key: "roles",
    label: "役職",
    title: "3. 役職システム（具体）",
    items: [
      "役職はLv.7以上（値128以上）かつ未設定タイルに付与できます。",
      "制圧兵: 命中した敵を1ターン減速（移動量0.5倍）。",
      "整備士: 被ダメージを約35%軽減（65%適用）し、ターン終了時に自己修復（最大値の5%、最低1）。",
      "連鎖兵: 先頭への命中後、後続に45%→25%→15%の連鎖ダメージ。",
      "賭博師: 攻撃倍率が毎回0.8〜2.0で変動。",
      "役職付きタイル同士は同じ役職でのみ合体できます。",
    ],
  },
  {
    key: "formation",
    label: "陣形",
    title: "4. 行ボーナス（陣形効果）",
    items: [
      "前衛（上2行）: 攻撃1.25倍",
      "中衛（中央2行）: 被ダメージ25%軽減",
      "後衛（下2行）: スライドごとに自動修復（最大値の10%）",
    ],
  },
  {
    key: "winlose",
    label: "勝敗",
    title: "5. 勝敗条件とWave進行",
    items: [
      "ボス撃破、または敵全滅でWaveクリアになります。",
      "Waveクリア時は演出後に次Waveへ進み、手数は3にリセットされます。",
      "盤面が詰まって有効なスライドができない場合もゲームオーバーです。",
    ],
  },
];

export function TitleHowToModal({ isOpen, onClose }) {
  const dialogRef = useRef(null);
  const titleId = useId();
  const descriptionId = useId();
  const [activeTabKey, setActiveTabKey] = useState(GUIDE_TABS[0].key);
  const { isRendered, phase } = useModalTransition(isOpen);
  const activeTab = GUIDE_TABS.find((tab) => tab.key === activeTabKey) ?? GUIDE_TABS[0];

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

  useEffect(() => {
    if (isOpen) {
      setActiveTabKey(GUIDE_TABS[0].key);
    }
  }, [isOpen]);

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
          maxWidth: 620,
          maxHeight: "86vh",
          background: "#0f172a",
          borderRadius: 14,
          padding: "16px 16px 14px",
          boxShadow: "0 18px 44px rgba(0,0,0,0.5)",
        })}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div id={titleId} style={{ fontSize: 22, fontWeight: 800, color: "#f8fafc" }}>📘 遊び方</div>
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
        <div id={descriptionId} style={{ fontSize: 15, color: "#cbd5e1", marginBottom: 14, lineHeight: 1.7 }}>
          Merge Fortress 2048 は、2048パズルとタワーディフェンスを組み合わせた手数制ストラテジーです。下のタブで項目を切り替えて確認できます。
        </div>

        <div
          role="tablist"
          aria-label="遊び方の項目"
          style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}
        >
          {GUIDE_TABS.map((tab) => {
            const isActive = tab.key === activeTab.key;
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={`${descriptionId}-${tab.key}-panel`}
                id={`${descriptionId}-${tab.key}-tab`}
                onClick={() => setActiveTabKey(tab.key)}
                style={{
                  border: isActive ? "1px solid #7dd3fc" : "1px solid #334155",
                  background: isActive ? "#0b3a55" : "#111827",
                  color: isActive ? "#e0f2fe" : "#cbd5e1",
                  fontSize: 14,
                  fontWeight: 700,
                  padding: "8px 10px",
                  borderRadius: 10,
                  cursor: "pointer",
                  lineHeight: 1.2,
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div
          role="tabpanel"
          id={`${descriptionId}-${activeTab.key}-panel`}
          aria-labelledby={`${descriptionId}-${activeTab.key}-tab`}
          style={{
            background: "rgba(15, 23, 42, 0.78)",
            border: "1px solid #334155",
            borderRadius: 12,
            padding: "12px 12px 10px",
            marginBottom: 14,
          }}
        >
          <div style={{ fontSize: 17, color: "#f8fafc", fontWeight: 800, marginBottom: 6 }}>{activeTab.title}</div>
          <ul style={{ margin: "0 0 0 18px", padding: 0, color: "#e2e8f0", fontSize: 15, lineHeight: 1.75 }}>
            {activeTab.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <button
          type="button"
          onClick={onClose}
          style={createPrimaryButtonStyle({
            background: "#1e293b",
            color: "#f8fafc",
            borderRadius: 10,
            padding: "11px 0",
            fontSize: 15,
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
