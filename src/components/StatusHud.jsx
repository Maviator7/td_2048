import { memo, useLayoutEffect, useRef, useState } from "react";
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
  onOpenMenu,
  isMenuDisabled,
}) {
  const waveCellRef = useRef(null);
  const [menuButtonSize, setMenuButtonSize] = useState(44);

  useLayoutEffect(() => {
    const updateButtonSize = () => {
      const measuredHeight = waveCellRef.current?.offsetHeight ?? 44;
      setMenuButtonSize(Math.max(36, measuredHeight));
    };

    updateButtonSize();
    window.addEventListener("resize", updateButtonSize);
    return () => window.removeEventListener("resize", updateButtonSize);
  }, [wave, score, lives]);

  return (
    <div style={{ ...hudShellStyle, position: "relative", paddingRight: 46 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", width: "100%" }}>
        <div
          className={isLifeLossActive ? "hud-life-loss-pulse" : undefined}
          key={isLifeLossActive ? `life-cell-${lifeLossFxKey}` : undefined}
          style={{ ...hudLifeCellStyle, justifySelf: "center" }}
        >
          <div style={hudLabelStyle}>LIVES</div>
          <div style={hudLivesValueStyle}>{formatLives(lives)}</div>
          {isLifeLossActive && (
            <div className="hud-life-loss-float">
              -{lifeLossAmount}
            </div>
          )}
        </div>
        <div ref={waveCellRef} style={{ ...hudCellStyle, justifySelf: "center" }}>
          <div style={hudLabelStyle}>WAVE</div>
          <div style={hudWaveValueStyle}>{wave}</div>
        </div>
        <div style={{ ...hudCellStyle, justifySelf: "center" }}>
          <div style={hudLabelStyle}>SCORE</div>
          <div style={hudScoreValueStyle}>{score.toLocaleString()}</div>
        </div>
      </div>
      <button
        type="button"
        onClick={onOpenMenu}
        disabled={isMenuDisabled}
        aria-label="メニュー"
        style={{
          position: "absolute",
          right: 1,
          top: "50%",
          transform: "translateY(-50%)",
          border: "1px solid #334155",
          borderRadius: 8,
          width: menuButtonSize,
          height: menuButtonSize,
          padding: 0,
          background: "rgba(15,23,42,0.92)",
          color: "#e2e8f0",
          fontWeight: 800,
          fontSize: 28,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: isMenuDisabled ? "not-allowed" : "pointer",
          opacity: isMenuDisabled ? 0.55 : 1,
        }}
      >
        ☰
      </button>
    </div>
  );
});
