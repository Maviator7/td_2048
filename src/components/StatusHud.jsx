import { memo } from "react";
import {
  hudCellStyle,
  hudLabelStyle,
  hudLifeCellStyle,
  hudLivesValueStyle,
  hudScoreValueStyle,
  hudShellStyle,
  hudWaveValueStyle,
} from "./ui/styles";

function formatLives(lives) {
  if (lives <= 0) {
    return "💀";
  }

  return "❤️".repeat(Math.min(lives, 5)) + (lives > 5 ? `+${lives - 5}` : "");
}

export const StatusHud = memo(function StatusHud({
  lives,
  wave,
  score,
  isLifeLossActive,
  lifeLossAmount,
  lifeLossFxKey,
}) {
  return (
    <div style={hudShellStyle}>
      <div
        className={isLifeLossActive ? "hud-life-loss-pulse" : undefined}
        key={isLifeLossActive ? `life-cell-${lifeLossFxKey}` : undefined}
        style={hudLifeCellStyle}
      >
        <div style={hudLabelStyle}>LIVES</div>
        <div style={hudLivesValueStyle}>{formatLives(lives)}</div>
        {isLifeLossActive && (
          <div className="hud-life-loss-float">
            -{lifeLossAmount}
          </div>
        )}
      </div>
      <div style={hudCellStyle}>
        <div style={hudLabelStyle}>WAVE</div>
        <div style={hudWaveValueStyle}>{wave}</div>
      </div>
      <div style={hudCellStyle}>
        <div style={hudLabelStyle}>SCORE</div>
        <div style={hudScoreValueStyle}>{score.toLocaleString()}</div>
      </div>
    </div>
  );
});
