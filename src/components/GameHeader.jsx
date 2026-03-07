import { MovesIndicator } from "./MovesIndicator";
import { StatusHud } from "./StatusHud";
import { gameHeaderIntroStyle, gameSubtitleStyle, gameTitleStyle } from "./ui/styles";

export function GameHeader({
  lives,
  wave,
  score,
  movesLeft,
  movesPerTurn,
  isResolving,
  isLifeLossActive,
  lifeLossAmount,
  lifeLossFxKey,
}) {
  return (
    <>
      <div style={gameHeaderIntroStyle}>
        <h1 style={gameTitleStyle}>🗼 MERGE FORTRESS 2048</h1>
        <div style={gameSubtitleStyle}>スライドで砲塔合体 → 敵を撃退せよ</div>
      </div>
      <StatusHud
        lives={lives}
        wave={wave}
        score={score}
        isLifeLossActive={isLifeLossActive}
        lifeLossAmount={lifeLossAmount}
        lifeLossFxKey={lifeLossFxKey}
      />
      <MovesIndicator movesLeft={movesLeft} totalMoves={movesPerTurn} isResolving={isResolving} />
    </>
  );
}
