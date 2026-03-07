import {
  createGuideGridStyle,
  guideCardDescriptionStyle,
  guideCardStyle,
  guideCardTitleStyle,
  guideHintStyle,
} from "./ui/styles";

const GUIDE_ITEMS = [
  ["🟡 手数マス", "3マス分スライドしたら自動攻撃"],
  ["⚡ 高速敵", "通常より速くDEFENSE LINEへ接近"],
  ["🧬 分裂敵", "倒すと小さい敵3体に分裂"],
  ["👑 ボス", "各Waveの最後に少し強いボスが1体出現"],
  ["🛡️ 装甲敵", "Wave4〜 砲塔値>装甲値が必要"],
  ["💀 敗北条件", "ライフ0 or グリッド満杯"],
];

export function GuideCards({ isDesktop }) {
  return (
    <>
      <div style={createGuideGridStyle(isDesktop)}>
        {GUIDE_ITEMS.map(([title, description]) => (
          <div key={title} style={guideCardStyle}>
            <div style={guideCardTitleStyle}>{title}</div>
            <div style={guideCardDescriptionStyle}>{description}</div>
          </div>
        ))}
      </div>
      <div style={guideHintStyle}>
        矢印キー / スワイプ: スライド
      </div>
    </>
  );
}
