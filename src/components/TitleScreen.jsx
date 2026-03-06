const FEATURE_CARDS = [
  ["⚡ 高速敵", "通常より速く侵攻"],
  ["🧬 分裂敵", "撃破で3体に分裂"],
  ["👑 ボス", "各Wave最後に登場"],
  ["🛡️ 装甲敵", "火力不足だと弾かれる"],
];

export function TitleScreen({ onStart }) {
  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(145deg,#0b1020 0%,#1a1a2e 50%,#0f172a 100%)",display:"flex",justifyContent:"center",alignItems:"center",padding:"20px 12px",fontFamily:"'Segoe UI',sans-serif"}}>
      <div style={{width:"100%",maxWidth:460,background:"rgba(13,17,23,0.92)",border:"1px solid #29303d",borderRadius:16,padding:"22px 16px",boxShadow:"0 20px 50px rgba(0,0,0,0.45)",textAlign:"center"}}>
        <div style={{fontSize:13,color:"#6b7280",letterSpacing:1,marginBottom:8}}>TOWER MERGE BATTLE</div>
        <h1 style={{margin:"0 0 6px",fontSize:30,color:"#f1c40f",textShadow:"0 0 14px rgba(241,196,15,0.55)"}}>🗼 MERGE TOWER DEFENSE</h1>
        <div style={{fontSize:13,color:"#94a3b8",marginBottom:14}}>砲塔を合体して、押し寄せる敵を迎え撃て</div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
          {FEATURE_CARDS.map(([title, desc]) => (
            <div key={title} style={{background:"#111827",border:"1px solid #1f2937",borderRadius:10,padding:"8px 6px"}}>
              <div style={{fontSize:12,color:"#e5e7eb",fontWeight:700}}>{title}</div>
              <div style={{fontSize:10,color:"#64748b",marginTop:2}}>{desc}</div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onStart}
          style={{
            width:"100%",
            border:"none",
            borderRadius:12,
            padding:"13px 10px",
            background:"linear-gradient(90deg,#f59e0b 0%,#f1c40f 52%,#f59e0b 100%)",
            color:"#111827",
            fontSize:18,
            fontWeight:900,
            cursor:"pointer",
            boxShadow:"0 10px 24px rgba(245,158,11,0.35)",
          }}
        >
          ▶ ゲームスタート
        </button>
        <div style={{marginTop:10,fontSize:11,color:"#475569"}}>矢印キー / スワイプで操作</div>
      </div>
    </div>
  );
}
