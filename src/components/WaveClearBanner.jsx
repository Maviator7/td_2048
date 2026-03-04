export function WaveClearBanner({ wave, onNextWave }) {
  return (
    <div className="waveclear-top-cta wave-clear-panel" key={`wave-clear-${wave}`}>
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
        次のウェーブへ進めます
      </div>
      <button className="wave-next-btn" onClick={onNextWave}>
        ▶ 次のウェーブへ進む (Wave {wave + 1})
      </button>
    </div>
  );
}
