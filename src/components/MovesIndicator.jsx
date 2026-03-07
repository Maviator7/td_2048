import { memo } from "react";
import {
  createMovePipStyle,
  movesIndicatorLabelStyle,
  movesIndicatorShellStyle,
  resolvingTextStyle,
} from "./ui/styles";

export const MovesIndicator = memo(function MovesIndicator({ movesLeft, totalMoves, isResolving }) {
  return (
    <div style={movesIndicatorShellStyle}>
      <span style={movesIndicatorLabelStyle}>残り手数：</span>
      {Array.from({ length: totalMoves }).map((_, index) => {
        const isActive = index < movesLeft;
        return (
          <div
            key={index}
            style={createMovePipStyle(isActive)}
          />
        );
      })}
      {isResolving && <span style={resolvingTextStyle}>⚔️ 攻撃中...</span>}
    </div>
  );
});
