import { useEffect, useState } from "react";

const WAVE_TRANSITION_TOTAL_DELAY_MS = 3840;
const WAVE_TRANSITION_ANIMATION_MS = 840;

export function WaveClearBanner({ wave }) {
  const [isEngaging, setIsEngaging] = useState(false);

  useEffect(() => {
    setIsEngaging(false);
    const engageTimer = window.setTimeout(() => {
      setIsEngaging(true);
    }, WAVE_TRANSITION_TOTAL_DELAY_MS - WAVE_TRANSITION_ANIMATION_MS);

    return () => window.clearTimeout(engageTimer);
  }, [wave]);

  return (
    <div
      className={`waveclear-top-cta wave-clear-panel ${isEngaging ? "wave-clear-engaging" : ""}`}
      key={`wave-clear-${wave}`}
    >
      {isEngaging && <div className="wave-engage-flash" aria-hidden="true" />}
      {isEngaging && (
        <div className="wave-engage-overlay" aria-hidden="true">
          <div className="wave-engage-streaks" />
          <div className="wave-engage-label">WAVE {wave + 1}</div>
        </div>
      )}
      <div className="wave-clear-confetti" aria-hidden="true">
        {Array.from({ length: 14 }).map((_, index) => (
          <span
            key={`spark-${index}`}
            className="wave-clear-spark"
            style={{
              left: `${6 + (index * 7) % 88}%`,
              animationDelay: `${(index % 7) * 0.1}s`,
              animationDuration: `${1.2 + (index % 4) * 0.2}s`,
            }}
          />
        ))}
      </div>
      <div style={{ fontSize: 16, fontWeight: "bold", color: "#ffe082", textShadow: "0 0 12px #f1c40f88" }}>
        🎉 Wave {wave} クリア！
      </div>
      <div style={{ fontSize: 12, color: "#d5e9da", marginTop: 3, marginBottom: 8 }}>
        {isEngaging ? `▶ 進軍中... (Wave ${wave + 1})` : `3秒後に Wave ${wave + 1} へ進みます...`}
      </div>
    </div>
  );
}
