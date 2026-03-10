import { memo, useEffect, useState } from "react";

import { GAME_PHASES } from "../game/config";
import { COLS, ROWS } from "../game/constants";

const PHASE_OPTIONS = Object.values(GAME_PHASES);

function sectionStyle() {
  return {
    background: "#0b1220",
    border: "1px solid #334155",
    borderRadius: 10,
    padding: 10,
  };
}

function labelStyle() {
  return {
    fontSize: 11,
    color: "#94a3b8",
    marginBottom: 4,
  };
}

function inputStyle() {
  return {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #475569",
    background: "#0f172a",
    color: "#e5e7eb",
    borderRadius: 8,
    padding: "7px 8px",
    fontSize: 13,
  };
}

function buttonStyle() {
  return {
    border: "1px solid #475569",
    background: "#1e293b",
    color: "#e2e8f0",
    borderRadius: 8,
    padding: "8px 10px",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
  };
}

export const DebugPanel = memo(function DebugPanel({
  wave,
  lives,
  score,
  movesLeft,
  phase,
  boostRow,
  boostCol,
  onSetWave,
  onSetLives,
  onSetScore,
  onSetMovesLeft,
  onSetPhase,
  onBoostTile,
  onSpawnTile,
  showCombatOverlay,
  onToggleCombatOverlay,
  onKillAllEnemies,
  onRespawnWaveEnemies,
  onNextWave,
}) {
  const [waveInput, setWaveInput] = useState(String(wave));
  const [livesInput, setLivesInput] = useState(String(lives));
  const [scoreInput, setScoreInput] = useState(String(score));
  const [movesInput, setMovesInput] = useState(String(movesLeft));
  const [phaseInput, setPhaseInput] = useState(phase);
  const [boostRowInput, setBoostRowInput] = useState("0");
  const [boostColInput, setBoostColInput] = useState("0");
  const [spawnLevelInput, setSpawnLevelInput] = useState("1");

  useEffect(() => {
    setWaveInput(String(wave));
  }, [wave]);

  useEffect(() => {
    setLivesInput(String(lives));
  }, [lives]);

  useEffect(() => {
    setScoreInput(String(score));
  }, [score]);

  useEffect(() => {
    setMovesInput(String(movesLeft));
  }, [movesLeft]);

  useEffect(() => {
    setPhaseInput(phase);
  }, [phase]);

  useEffect(() => {
    setBoostRowInput(String(boostRow));
  }, [boostRow]);

  useEffect(() => {
    setBoostColInput(String(boostCol));
  }, [boostCol]);

  return (
    <div
      style={{
        marginTop: 10,
        background: "#020617",
        border: "1px solid #1e293b",
        borderRadius: 12,
        padding: 10,
      }}
    >
      <div style={{ fontSize: 12, color: "#f8fafc", fontWeight: 800, marginBottom: 8 }}>
        DEBUG PANEL (Tester)
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <div style={sectionStyle()}>
          <div style={labelStyle()}>Wave</div>
          <input type="number" value={waveInput} onChange={(event) => setWaveInput(event.target.value)} style={inputStyle()} />
          <button type="button" style={{ ...buttonStyle(), marginTop: 8, width: "100%" }} onClick={() => onSetWave(waveInput)}>
            Wave適用
          </button>
        </div>

        <div style={sectionStyle()}>
          <div style={labelStyle()}>Lives</div>
          <input type="number" value={livesInput} onChange={(event) => setLivesInput(event.target.value)} style={inputStyle()} />
          <button type="button" style={{ ...buttonStyle(), marginTop: 8, width: "100%" }} onClick={() => onSetLives(livesInput)}>
            Lives適用
          </button>
        </div>

        <div style={sectionStyle()}>
          <div style={labelStyle()}>Score</div>
          <input type="number" value={scoreInput} onChange={(event) => setScoreInput(event.target.value)} style={inputStyle()} />
          <button type="button" style={{ ...buttonStyle(), marginTop: 8, width: "100%" }} onClick={() => onSetScore(scoreInput)}>
            Score適用
          </button>
        </div>

        <div style={sectionStyle()}>
          <div style={labelStyle()}>Moves / Turn</div>
          <input
            type="number"
            min="1"
            value={movesInput}
            onChange={(event) => setMovesInput(event.target.value)}
            style={inputStyle()}
          />
          <button type="button" style={{ ...buttonStyle(), marginTop: 8, width: "100%" }} onClick={() => onSetMovesLeft(movesInput)}>
            ターン手数を適用
          </button>
        </div>
      </div>

      <div style={{ marginTop: 8, ...sectionStyle() }}>
        <div style={labelStyle()}>Phase</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8 }}>
          <select value={phaseInput} onChange={(event) => setPhaseInput(event.target.value)} style={inputStyle()}>
            {PHASE_OPTIONS.map((phaseOption) => (
              <option key={phaseOption} value={phaseOption}>
                {phaseOption}
              </option>
            ))}
          </select>
          <button type="button" style={buttonStyle()} onClick={() => onSetPhase(phaseInput)}>
            適用
          </button>
        </div>
      </div>

      <div style={{ marginTop: 8, ...sectionStyle() }}>
        <div style={labelStyle()}>Boost Tile (Lv +1)</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 8 }}>
          <input
            type="number"
            min="0"
            max={ROWS - 1}
            value={boostRowInput}
            onChange={(event) => setBoostRowInput(event.target.value)}
            style={inputStyle()}
            placeholder={`row (0-${ROWS - 1})`}
          />
          <input
            type="number"
            min="0"
            max={COLS - 1}
            value={boostColInput}
            onChange={(event) => setBoostColInput(event.target.value)}
            style={inputStyle()}
            placeholder={`col (0-${COLS - 1})`}
          />
          <button type="button" style={buttonStyle()} onClick={() => onBoostTile(boostRowInput, boostColInput)}>
            タイル強化
          </button>
        </div>
      </div>

      <div style={{ marginTop: 8, ...sectionStyle() }}>
        <div style={labelStyle()}>Spawn Tile (Level)</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 8 }}>
          <input
            type="number"
            min="1"
            max="16"
            value={spawnLevelInput}
            onChange={(event) => setSpawnLevelInput(event.target.value)}
            style={inputStyle()}
            placeholder="level (1-16)"
          />
          <button type="button" style={buttonStyle()} onClick={() => onSpawnTile(spawnLevelInput, false)}>
            指定生成
          </button>
          <button type="button" style={buttonStyle()} onClick={() => onSpawnTile(spawnLevelInput, true)}>
            ランダム
          </button>
        </div>
      </div>

      <div style={{ marginTop: 8, ...sectionStyle() }}>
        <div style={labelStyle()}>Combat Overlay</div>
        <label style={{ display: "flex", alignItems: "center", gap: 8, color: "#e2e8f0", fontSize: 12, fontWeight: 700 }}>
          <input
            type="checkbox"
            checked={showCombatOverlay}
            onChange={(event) => onToggleCombatOverlay?.(event.target.checked)}
          />
          戦闘詳細オーバーレイを表示
        </label>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 8 }}>
        <button type="button" style={buttonStyle()} onClick={onKillAllEnemies}>
          敵全滅
        </button>
        <button type="button" style={buttonStyle()} onClick={onRespawnWaveEnemies}>
          敵再生成
        </button>
        <button type="button" style={buttonStyle()} onClick={onNextWave}>
          次Waveへ
        </button>
      </div>
    </div>
  );
});
