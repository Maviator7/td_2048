const GUIDE_ITEMS = [
  ["🟡 手数マス", "3マス分スライドしたら自動攻撃"],
  ["👑 ボス", "各Waveの最後に少し強いボスが1体出現"],
  ["🛡️ 装甲敵", "Wave4〜 砲塔値>装甲値が必要"],
  ["💀 敗北条件", "ライフ0 or グリッド満杯"],
];

export function GuideCards({ isDesktop }) {
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "1fr" : "1fr 1fr", gap: 4 }}>
        {GUIDE_ITEMS.map(([title, description]) => (
          <div key={title} style={{ background: "#0d1117", border: "1px solid #1e2a3a", borderRadius: 8, padding: "6px 8px" }}>
            <div style={{ fontSize: 11, color: "#aaa", fontWeight: "bold" }}>{title}</div>
            <div style={{ fontSize: 10, color: "#555", marginTop: 2 }}>{description}</div>
          </div>
        ))}
      </div>
      <div style={{ textAlign: "center", color: "#333", fontSize: 10, marginTop: 2 }}>
        矢印キー / スワイプ: スライド
      </div>
    </>
  );
}
