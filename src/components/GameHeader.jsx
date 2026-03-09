import { MovesIndicator } from "./MovesIndicator";
import { StatusHud } from "./StatusHud";

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
  onOpenMenu,
  isMenuDisabled,
}) {
  return (
    <>
      <StatusHud
        lives={lives}
        wave={wave}
        score={score}
        isLifeLossActive={isLifeLossActive}
        lifeLossAmount={lifeLossAmount}
        lifeLossFxKey={lifeLossFxKey}
        onOpenMenu={onOpenMenu}
        isMenuDisabled={isMenuDisabled}
      />
      <MovesIndicator movesLeft={movesLeft} totalMoves={movesPerTurn} isResolving={isResolving} />
    </>
  );
}
