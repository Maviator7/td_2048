import { useState } from "react";
import { TitleHowToModal } from "./TitleHowToModal";
import { TitleSettingsModal } from "./TitleSettingsModal";
import { centeredFullscreenLayout, createPanelSurface, createPrimaryButtonStyle } from "./ui/styles";

const FEATURE_CARDS = [
  ["⚡ 高速敵", "通常より速く侵攻"],
  ["🧬 分裂敵", "撃破で3体に分裂"],
  ["👑 ボス", "各Wave最後に登場"],
  ["🛡️ 装甲敵", "火力不足だと弾かれる"],
];

export function TitleScreen({
  onStart,
  onContinue,
  canContinue,
  continueMeta,
  onOpenRanking,
  topScore,
  bgmMuted,
  bgmVolume,
  onToggleBgmMute,
  onChangeBgmVolume,
  onUnlockAudio,
}) {
  const [isHowToOpen, setIsHowToOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [continueMessage, setContinueMessage] = useState("");

  return (
    <div style={{ ...centeredFullscreenLayout, background:"linear-gradient(145deg,#0b1020 0%,#1a1a2e 50%,#0f172a 100%)" }}>
      <div style={createPanelSurface({ maxWidth: 460, padding: "22px 16px" })}>
        <h1 style={{margin:"0 0 6px",fontSize:30,color:"#f1c40f",textShadow:"0 0 14px rgba(241,196,15,0.55)"}}>🗼 MERGE FORTRESS 2048</h1>
        <div style={{fontSize:14,color:"#cbd5e1",marginBottom:14}}>砲塔を合体して、押し寄せる敵を迎え撃て</div>
        <div style={{marginBottom:14,padding:"10px 12px",borderRadius:12,background:"linear-gradient(135deg,rgba(30,41,59,0.95),rgba(15,23,42,0.9))",border:"1px solid #334155"}}>
          <div style={{fontSize:12,color:"#94a3b8"}}>LOCAL BEST SCORE</div>
          <div style={{fontSize:24,fontWeight:900,color:"#22c55e",lineHeight:1.1}}>{topScore !== null ? topScore.toLocaleString() : "--"}</div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
          {FEATURE_CARDS.map(([title, desc]) => (
            <div key={title} style={{background:"#111827",border:"1px solid #1f2937",borderRadius:10,padding:"8px 6px"}}>
              <div style={{fontSize:12,color:"#e5e7eb",fontWeight:700}}>{title}</div>
              <div style={{fontSize:12,color:"#94a3b8",marginTop:2,lineHeight:1.45}}>{desc}</div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onStart}
          style={createPrimaryButtonStyle({
            background: "linear-gradient(90deg,#f59e0b 0%,#f1c40f 52%,#f59e0b 100%)",
            color: "#111827",
            fontSize: 18,
            padding: "13px 10px",
            fontWeight: 900,
            boxShadow: "0 10px 24px rgba(245,158,11,0.35)",
          })}
        >
          ▶ ゲームスタート
        </button>
        <button
          type="button"
          onClick={() => {
            const ok = onContinue?.();
            setContinueMessage(ok ? "" : "ロードに失敗しました（データが無効です）");
          }}
          disabled={!canContinue}
          style={{
            ...createPrimaryButtonStyle({
              marginTop: 8,
              border: "1px solid #315a38",
              background: "linear-gradient(90deg,#0f2a1f 0%,#14532d 100%)",
              color: "#dcfce7",
              padding: "11px 10px",
            }),
            opacity: canContinue ? 1 : 0.45,
            cursor: canContinue ? "pointer" : "not-allowed",
          }}
        >
          ⏯ 続きから
        </button>
        {canContinue && continueMeta && (
          <div style={{ marginTop: 6, fontSize: 12, color: "#86efac" }}>
            Wave {continueMeta.wave} / Score {continueMeta.score.toLocaleString()}
          </div>
        )}
        {continueMessage && (
          <div style={{ marginTop: 6, fontSize: 12, color: "#fca5a5" }}>
            {continueMessage}
          </div>
        )}
        <button
          type="button"
          onClick={onOpenRanking}
          style={createPrimaryButtonStyle({
            marginTop: 10,
            border: "1px solid #475569",
            background: "linear-gradient(90deg,#0f172a 0%,#1e293b 100%)",
            color: "#e2e8f0",
            padding: "11px 10px",
          })}
        >
          🏆 ランキング
        </button>
        <button
          type="button"
          onClick={() => setIsSettingsOpen(true)}
          style={createPrimaryButtonStyle({
            marginTop: 8,
            border: "1px solid #475569",
            borderRadius: 10,
            padding: "10px",
            background: "#0f172a",
            color: "#e2e8f0",
            fontSize: 14,
            fontWeight: 700,
            boxShadow: "none",
          })}
        >
          ⚙️ 設定
        </button>
        <button
          type="button"
          onClick={() => setIsHowToOpen(true)}
          style={createPrimaryButtonStyle({
            marginTop: 8,
            border: "1px solid #334155",
            borderRadius: 10,
            padding: "10px",
            background: "#111827",
            color: "#d1d5db",
            fontSize: 14,
            fontWeight: 700,
            boxShadow: "none",
          })}
        >
          📘 遊び方
        </button>
        <div style={{marginTop:10,fontSize:12,color:"#94a3b8"}}>矢印キー / スワイプで操作</div>
      </div>
      <TitleSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        bgmMuted={bgmMuted}
        bgmVolume={bgmVolume}
        onToggleBgmMute={onToggleBgmMute}
        onChangeBgmVolume={onChangeBgmVolume}
        onUnlockAudio={onUnlockAudio}
      />
      <TitleHowToModal isOpen={isHowToOpen} onClose={() => setIsHowToOpen(false)} />
    </div>
  );
}
