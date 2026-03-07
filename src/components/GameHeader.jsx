import { MovesIndicator } from "./MovesIndicator";
import { StatusHud } from "./StatusHud";

export function GameHeader({ lives, wave, score, movesLeft, movesPerTurn, isResolving }) {
  return (
    <>
      <div style={{ textAlign: "center", marginBottom: 10 }}>
        <h1 style={{ margin: 0, fontSize: 22, color: "#f1c40f", letterSpacing: 1, textShadow: "0 0 12px #f1c40f88" }}>🗼 MERGE FORTRESS 2048</h1>
        <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>スライドで砲塔合体 → 敵を撃退せよ</div>
      </div>
      <StatusHud lives={lives} wave={wave} score={score} />
      <MovesIndicator movesLeft={movesLeft} totalMoves={movesPerTurn} isResolving={isResolving} />
    </>
  );
}
