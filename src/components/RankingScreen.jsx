import { centeredFullscreenLayout, createPanelSurface, createPrimaryButtonStyle } from "./ui/styles";

function formatPlayedAt(playedAt) {
  try {
    return new Intl.DateTimeFormat("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(playedAt));
  } catch {
    return playedAt;
  }
}

export function RankingScreen({ rankings, latestEntryId, onStart, onBackToTitle }) {
  return (
    <div style={{ ...centeredFullscreenLayout, background: "linear-gradient(160deg,#09111f 0%,#132238 52%,#1f2937 100%)" }}>
      <div style={createPanelSurface({ maxWidth: 520, background: "rgba(8,15,27,0.9)", border: "1px solid rgba(148,163,184,0.2)", borderRadius: 18, boxShadow: "0 26px 60px rgba(0,0,0,0.38)" })}>
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 13, letterSpacing: 2, color: "#60a5fa", marginBottom: 6 }}>LOCAL SCORE BOARD</div>
          <h1 style={{ margin: 0, fontSize: 28, color: "#f8fafc" }}>ランキング</h1>
          <div style={{ marginTop: 6, fontSize: 14, color: "#cbd5e1" }}>現状はローカル保存、将来的なオンライン対応を見据えた構成です</div>
        </div>

        <ol style={{ display: "grid", gap: 10, marginBottom: 16, listStyle: "none", padding: 0, margin: "0 0 16px" }}>
          {rankings.length > 0 ? rankings.map((entry, index) => {
            const isLatest = latestEntryId === entry.id;

            return (
              <li
                key={entry.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "52px minmax(0,1fr)",
                  gap: 10,
                  alignItems: "center",
                  padding: "12px 12px 10px",
                  borderRadius: 14,
                  border: isLatest ? "1px solid rgba(251,191,36,0.75)" : "1px solid rgba(71,85,105,0.58)",
                  background: isLatest ? "linear-gradient(135deg,rgba(120,53,15,0.55),rgba(30,41,59,0.92))" : "linear-gradient(135deg,rgba(15,23,42,0.95),rgba(30,41,59,0.88))",
                  boxShadow: isLatest ? "0 0 0 1px rgba(251,191,36,0.18) inset, 0 10px 22px rgba(120,53,15,0.22)" : "none",
                }}
              >
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>RANK</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: index < 3 ? "#fbbf24" : "#e2e8f0" }}>#{index + 1}</div>
                </div>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: "#22c55e" }}>{entry.score.toLocaleString()}</div>
                    <div style={{ fontSize: 13, color: "#cbd5e1" }}>Wave {entry.wave}</div>
                  </div>
                  <div style={{ marginTop: 4, fontSize: 12, color: isLatest ? "#fde68a" : "#94a3b8" }}>
                    {isLatest ? "今回のスコア" : formatPlayedAt(entry.playedAt)}
                  </div>
                </div>
              </li>
            );
          }) : (
            <li style={{ padding: "22px 14px", borderRadius: 14, border: "1px dashed rgba(100,116,139,0.7)", textAlign: "center", color: "#cbd5e1", background: "rgba(15,23,42,0.62)" }}>
              まだランキング記録がありません。最初のプレイ結果を保存してみてください。
            </li>
          )}
        </ol>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <button type="button" onClick={onStart} style={createPrimaryButtonStyle({ background: "linear-gradient(90deg,#0284c7,#0ea5e9)" })}>
            ▶ プレイする
          </button>
          <button type="button" onClick={onBackToTitle} style={createPrimaryButtonStyle({ background: "linear-gradient(90deg,#334155,#475569)" })}>
            ← タイトルへ
          </button>
        </div>
      </div>
    </div>
  );
}
